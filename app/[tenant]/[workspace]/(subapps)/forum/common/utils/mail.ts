// ---- CORE IMPORTS ---- //
import {forumMail, toExcerpt} from '@/lib/mbi/mail';
import NotificationManager, {NotificationType} from '@/notification';

// ---- LOCAL IMPORTS ---- //
import {NOTIFICATION_VALUES} from '@/subapps/forum/common/constants';
import {
  ContentType,
  NotificationParams,
} from '@/subapps/forum/common/types/forum';

export const sendEmailNotifications = async ({
  type,
  title,
  content,
  author,
  group,
  subscribers,
  link,
  postAuthor,
}: NotificationParams) => {
  try {
    if (!subscribers?.length) {
      return;
    }

    const filteredSubscribers = subscribers.filter(
      ({notificationSelect, member}) => {
        if (!member?.id) {
          return false;
        }

        switch (notificationSelect) {
          case NOTIFICATION_VALUES.ALL:
            return true;
          case NOTIFICATION_VALUES.ALL_ON_MY_POST:
            return (
              type === ContentType.POST ||
              (type === ContentType.COMMENT && postAuthor?.id === member.id)
            );
          case NOTIFICATION_VALUES.NEW_COMMENTS_ON_MY_POST:
            return type === ContentType.COMMENT && postAuthor?.id === member.id;
          case NOTIFICATION_VALUES.NONE:
            return false;
          default:
            return false;
        }
      },
    );

    if (!filteredSubscribers?.length) {
      return;
    }

    const mailService = NotificationManager.getService(NotificationType.mail);
    if (!mailService) {
      console.error('Mail service is not available.');
      return;
    }

    for (const subscriber of filteredSubscribers) {
      try {
        if (!subscriber.member?.emailAddress?.address) {
          continue;
        }

        // MBI: French mail in the MBI layout.
        await mailService.notify({
          to: subscriber.member.emailAddress.address,
          ...forumMail({
            type: type === ContentType.POST ? 'post' : 'comment',
            recipientName: subscriber.member?.simpleFullName,
            authorName: author?.simpleFullName,
            groupName: group?.name,
            postTitle: title,
            excerpt: toExcerpt(content),
            link,
          }),
        });
      } catch (error) {
        console.error(
          `Failed to send email to ${subscriber.member?.emailAddress?.address || 'Unknown Email'}:`,
          error,
        );
      }
    }

    return {success: true};
  } catch (error) {
    console.error('Error sending notifications:', error);
    return;
  }
};
