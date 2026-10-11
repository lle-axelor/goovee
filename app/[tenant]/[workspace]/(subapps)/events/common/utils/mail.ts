// ---- CORE IMPORTS ---- //
import {getSession} from '@/lib/core/auth';
import NotificationManager, {NotificationType} from '@/lib/core/notification';
import sanitizeHtml from 'sanitize-html';
import {findEvent} from '../orm/event';
import {generateIcs} from './index';
import {eventRegistrationMail} from '@/lib/mbi/mail';
import type {Client} from '@/goovee/.generated/client';
import type {TenantConfig} from '@/tenant';
import type {Workspace} from '@/orm/workspace';
import type {Cloned} from '@/types/util';

// ---- LOCAL IMPORTS ---- //
import type {Participant} from '@/subapps/events/common/actions/validators';

type MailEvent = {
  eventTitle: string | null;
  eventPlace: string | null;
  eventAllDay: boolean | null;
  eventStartDateTime: string | Date | null;
  eventEndDateTime: string | Date | null;
  eventDescription: string | null;
  eventLink: string;
};

/* MBI: French mail in the MBI layout. */
export function mailTemplate({
  event,
  participant,
}: {
  event: MailEvent;
  participant: Participant;
}) {
  const {name, surname, subscriptionSet = []} = participant;
  const facilities = (subscriptionSet as Array<{facility?: string | null}>)
    .map(subscription => subscription.facility?.trim())
    .filter((facility): facility is string => Boolean(facility));

  return eventRegistrationMail({
    participantName: `${name ?? ''} ${surname ?? ''}`.trim(),
    eventTitle: event.eventTitle ?? '',
    start: event.eventStartDateTime,
    end: event.eventEndDateTime,
    allDay: event.eventAllDay,
    place: event.eventPlace,
    facilities,
    descriptionHtml: event.eventDescription
      ? sanitizeHtml(event.eventDescription)
      : null,
    link: event.eventLink,
  });
}

export const generateRegistrationMailAction = async ({
  eventId,
  participants,
  client,
  config,
  workspace,
}: {
  participants: Participant[];
  eventId: string;
  client: Client;
  config: TenantConfig;
  workspace: Workspace | Cloned<Workspace>;
}) => {
  if (![eventId, participants?.length, workspace.url].every(Boolean)) {
    console.error(
      'Missing required parameters: eventId, participants, or workspace.',
    );
    return;
  }

  const session = await getSession();
  const user = session?.user;

  const event = await findEvent({
    id: eventId,
    client,
    config,
    user,
    workspace,
  });

  if (!event) {
    console.error(`Event with ID ${eventId} not found.`);
    return;
  }

  const mailService = NotificationManager.getService(NotificationType.mail);
  if (!mailService) {
    console.error('Mail service is not available.');
    return;
  }

  const ics = generateIcs(event, participants);

  const mailPromises = participants.map(async participant => {
    const {subject, html} = mailTemplate({event, participant});
    return mailService.notify({
      to: participant.emailAddress,
      subject,
      html,
      icalEvent: {
        method: 'REQUEST',
        content: ics,
      },
      attachments: [
        {
          filename: 'invite.ics',
          content: ics,
          contentType: 'text/calendar; method=REQUEST',
        },
      ],
    });
  });

  try {
    await Promise.all(mailPromises);
  } catch (error) {
    console.error('Error sending registration emails:', error);
  }
};
