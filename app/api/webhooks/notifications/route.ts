import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';
import {NextResponse, after} from 'next/server';
import {z} from 'zod';

import {manager} from '@/tenant';
import type {Client} from '@/goovee/.generated/client';
import {findSubscribers} from '@/orm/notification';
import NotificationManager, {NotificationType} from '@/notification';
import {getTranslation} from '@/locale/server';
import {notifyUser} from '@/pwa/utils';
import {NotificationTag} from '@/pwa/tags';
import {
  TenantIdSchema,
  WorkspaceURLSchema,
  NotificationAppCodeSchema,
  type NotificationAppCode,
} from '@/utils/validators';
import {User} from '@/types';
import {APP_TITLE} from '@/constants';
import {publicationMail} from '@/lib/mbi/mail';

type App = NonNullable<Awaited<ReturnType<typeof findAppByCode>>>;

async function findAppByCode({code, client}: {code: string; client: Client}) {
  return client.aOSPortalApp.findOne({
    where: {
      code,
    },
    select: {
      name: true,
      code: true,
    },
  });
}

function isValidSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

function response(data: any, status: number) {
  return NextResponse.json(data, {status});
}

const BATCH_SIZE = 10;

async function processBatch<T>(
  data: T[],
  action: (data: NoInfer<T>) => Promise<void>,
  batchSize: number = BATCH_SIZE,
): Promise<void> {
  const chunks = chunkArray(data, batchSize);

  for (const chunk of chunks) {
    await Promise.allSettled(chunk.map(data => action(data)));
  }
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function sendMail({
  user,
  mail,
  app,
  entity,
}: {
  user: User;
  mail?: Mail | null;
  entity: {id: string; route: string};
  app: App;
}) {
  const mailService = NotificationManager.getService(NotificationType.mail);

  // MBI: French mail in the MBI layout; the ERP message, if any, goes inside it.
  await mailService?.notify({
    to: user.email,
    ...publicationMail({
      appCode: app.code ?? '',
      link: entity.route,
      subject: mail?.subject,
      bodyHtml: mail?.body ? sanitizeHtml(mail.body) : null,
    }),
  });
}

async function sendSystemNotification({
  user,
  tenantId,
  mail,
  app,
  entity,
  workspace,
  client,
}: {
  user: User;
  tenantId: string;
  mail?: Mail | null;
  entity: {id: string; route: string};
  app: App;
  workspace: {
    id: string;
    version: number;
    name: string | null;
    url: string;
  };
  client: Client;
}) {
  await notifyUser({
    userId: user.id,
    tenantId,
    workspaceURL: workspace.url,
    client,
    payload: {
      title:
        mail?.subject ||
        (await getTranslation(
          {locale: user.locale, tenant: tenantId},
          '{0} - Notifications from {1}',
          app.name || '',
          workspace.name || APP_TITLE,
        )),
      url: entity.route,
      tag: app.name
        ? NotificationTag.system(app.name, workspace.id)
        : undefined,
    },
  });
}

async function sendNotifications(data: {
  tenantId: string;
  workspace: {
    id: string;
    version: number;
    name: string | null;
    url: string;
  };
  code: NotificationAppCode;
  recordId: string;
  mail?: {
    subject?: string | null;
    body?: string | null;
  } | null;
  client: Client;
  app: App;
}) {
  const {tenantId, workspace, code, recordId, mail, client, app} = data;

  try {
    const subscribers = await findSubscribers({
      code,
      workspaceUrl: workspace.url,
      recordId,
      tenantId,
      client,
    });

    await processBatch(subscribers, async ({user, entity}) => {
      try {
        await Promise.all([
          sendMail({
            user,
            mail,
            entity,
            app,
          }),
          sendSystemNotification({
            user,
            tenantId,
            mail,
            entity,
            app,
            workspace,
            client,
          }),
        ]);
      } catch (err) {
        console.error(
          '[NOTIFICATIONS] Failed to notify subscriber',
          user.email,
          err,
        );
      }
    });
  } catch (err) {
    console.error(
      '[NOTIFICATIONS] Failed to process webhook notifications',
      err,
    );
  }
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;

function isValidTimestamp(timestamp: number) {
  const current = Date.now();
  const ts = Number(timestamp);
  return ts <= current && current - ts < FIVE_MINUTES_MS;
}

const MailSchema = z.object({
  subject: z.string().nullish(),
  body: z.string().nullish(),
});

type Mail = z.infer<typeof MailSchema>;

const NotificationWebhookPayloadSchema = z.object({
  tenantId: TenantIdSchema,
  workspaceUrl: WorkspaceURLSchema,
  code: NotificationAppCodeSchema,
  record: z.object({
    id: z.union([z.string(), z.number()]),
  }),
  timestamp: z.number().int('Timestamp must be an integer'),
  mail: MailSchema.nullish(),
});

export async function POST(request: Request) {
  const body = await request.text();

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return response('Payload is required', 400);
  }

  const parsed = NotificationWebhookPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return response(z.prettifyError(parsed.error), 400);
  }

  const {tenantId, workspaceUrl, code, record, timestamp, mail} = parsed.data;

  if (!isValidTimestamp(timestamp)) {
    return response('Invalid timestamp', 400);
  }

  const signature = request.headers.get('x-signature');

  if (!signature) {
    return response('Unauthorized', 401);
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return response('Unauthorized', 401);
  }
  const {client} = tenant;

  const secret = tenant.config.aos.webhookSecret;

  if (!secret || !isValidSignature(body, signature, secret)) {
    return response('Unauthorized', 401);
  }

  const workspace = await client.aOSPortalWorkspace.findOne({
    where: {url: workspaceUrl},
    select: {id: true, name: true, url: true},
  });

  if (!workspace) {
    return response('Invalid Workspace', 401);
  }

  const app = await findAppByCode({code, client});
  if (!app) {
    return response('Invalid App', 401);
  }

  after(() =>
    sendNotifications({
      tenantId,
      code,
      recordId: String(record.id),
      mail,
      client,
      workspace,
      app,
    }),
  );

  return response('Success', 200);
}
