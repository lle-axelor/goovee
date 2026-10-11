// ---- CORE IMPORTS ---- //
import {after} from 'next/server';
import {getTranslation} from '@/locale/server';
import NotificationManager, {NotificationType} from '@/notification';
import {
  type MailConfig,
  isValidMailConfig,
  replacePlaceholders,
} from '@/orm/email-template';
import type {Client} from '@/goovee/.generated/client';
import {otpMail} from '@/lib/mbi/mail';

// ---- LOCAL IMPORTS ---- //
import {create} from '../orm';
import {Scope} from '../constants';

function error(message: string) {
  return {
    error: true,
    message,
  };
}

export async function generateOTP({
  email,
  scope,
  tenantId,
  client,
  mailConfig,
}: {
  email: string;
  scope?: string;
  tenantId?: string;
  client: Client;
  mailConfig?: MailConfig;
}): Promise<{error: boolean; message: string} | undefined> {
  try {
    const result = await create({
      force: true,
      scope: scope || Scope.Registration,
      entity: email,
      client,
    });

    if (!result) {
      throw new Error('Error creating otp');
    }

    const mailService = NotificationManager.getService(NotificationType.mail);
    if (!result?.otp) return;

    after(async () => {
      try {
        if (mailConfig && isValidMailConfig(mailConfig)) {
          const {template} = mailConfig;

          await mailService?.notify({
            to: email,
            subject:
              template?.subject || otpMail({otp: result.otp, scope}).subject,
            html: replacePlaceholders({
              content: template?.content,
              values: {
                context: {
                  otp: result.otp,
                  email,
                },
              },
            }),
          });
        } else {
          // MBI: French mail in the MBI layout when no ERP template is set.
          await mailService?.notify({
            to: email,
            ...otpMail({otp: result.otp, scope}),
          });
        }
      } catch (err) {
        console.error('[OTP] Failed to send OTP mail', err);
      }
    });
  } catch (err) {
    return error(
      await getTranslation(
        {tenant: tenantId},
        'Error creating otp, try again.',
      ),
    );
  }
}
