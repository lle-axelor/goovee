'use client';

import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {App as PortalApp} from '@/orm/workspace';
import {Separator} from '@/ui/components/separator';
import {useWorkspace} from '../../workspace-context';
import {useToast} from '@/ui/hooks';

// ---- LOCAL IMPORTS ---- //
import {AccountToggle} from '../common/ui/components';

// ---- LOCAL IMPORTS ---- //
import {updatePreference} from './action';

export function Preference({
  preference,
  title,
  code,
  hideSubscription,
}: {
  preference: any;
  title: string;
  code: string;
  hideSubscription?: boolean;
}) {
  const {tenant, workspaceURI, workspaceURL} = useWorkspace();
  const {toast} = useToast();
  const router = useRouter();

  const changePreference =
    (root?: boolean) => async (activateNotification: any, record?: any) => {
      const result: any = await updatePreference({
        workspaceURL,
        workspaceURI,
        tenant,
        code,
        data: {
          ...(root
            ? {
                activateNotification,
              }
            : {
                activateNotification: true,
                record: {
                  id: record?.id,
                  activateNotification,
                },
              }),
        },
      });

      if ('success' in result) {
        router.refresh();
      } else {
        toast({
          title: result.message,
          variant: 'destructive',
        });
      }
    };

  if (!preference) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 py-1">
        <h5 className="text-sm font-semibold text-ink-900 mb-0">{title}</h5>
        <AccountToggle
          aria-label={title}
          checked={preference.activateNotification}
          onCheckedChange={changePreference(true)}
        />
      </div>
      {!hideSubscription && preference?.activateNotification && (
        <div className="space-y-1 border-l-2 border-royal-border pl-4 ml-1">
          {preference?.subscriptions?.map((subscription: any, i: number) => (
            <div
              className="flex items-center justify-between gap-4 py-1"
              key={subscription?.id}>
              <p className="text-sm text-ink-700 mb-0">{subscription?.name}</p>
              <AccountToggle
                aria-label={subscription?.name}
                checked={subscription.activateNotification}
                onCheckedChange={e =>
                  changePreference(false)(e, {id: subscription.id})
                }
              />
            </div>
          ))}
        </div>
      )}
      <Separator />
    </div>
  );
}
