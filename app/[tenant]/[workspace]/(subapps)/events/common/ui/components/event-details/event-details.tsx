'use client';

// ---- CORE IMPORTS ---- //
import {PortalWorkspace} from '@/orm/workspace';
import type {Cloned} from '@/types/util';
import {isCommentEnabled} from '@/comments';
import {SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {
  EventPageCard,
  CommentsSection,
} from '@/subapps/events/common/ui/components';
import type {FullEvent} from '@/subapps/events/common/orm/event';

export function EventDetails({
  eventDetails,
  workspace,
}: {
  eventDetails: Cloned<FullEvent>;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
}) {
  const eventId = eventDetails.id;

  const enableComment = isCommentEnabled({
    subapp: SUBAPP_CODES.events,
    workspace,
  });
  return (
    <div className="bg-ink-25 min-h-full">
      <div className="container mx-auto flex flex-col gap-6 py-8 pb-24 lg:pb-8 max-w-5xl">
        <EventPageCard eventDetails={eventDetails} workspace={workspace} />
        {enableComment && (
          <div className="bg-white rounded-xl border border-ink-100 shadow-xs p-6">
            <CommentsSection eventId={eventId} slug={eventDetails.slug} />
          </div>
        )}
      </div>
    </div>
  );
}
