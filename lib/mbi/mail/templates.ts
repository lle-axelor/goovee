/**
 * MBI: every e-mail the portal sends, in French and in the MBI layout. Each
 * template is a pure function returning `{subject, html}`; the call sites only
 * gather the data. Rendered with sample data by `pnpm mbi:mail:preview`.
 */
import {DEFAULT_OTP_EXPIRY} from '@/lib/core/otp/constants';
import {
  MBI_NAME,
  type MbiMail,
  type MbiMailOptions,
  button,
  codeBox,
  escapeHtml,
  fallbackLink,
  heading,
  infoTable,
  layout,
  paragraph,
  quote,
  strong,
} from './layout';

const IGNORE_IF_NOT_YOU =
  "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail : aucune modification ne sera faite.";

// ---- 1-3. One-time code (registration, invitation, e-mail change) ---- //

/* Scope values of `@/lib/core/otp/constants` (`Scope`). */
export type OtpMailScope = 'registration' | 'email_update' | string;

const OTP_TEXTS: Record<
  string,
  {subject: string; title: string; intro: string}
> = {
  registration: {
    subject: `Votre code de vérification – ${MBI_NAME}`,
    title: 'Vérifiez votre adresse e-mail',
    intro: `Pour finaliser votre inscription sur le portail ${MBI_NAME}, saisissez le code ci-dessous :`,
  },
  email_update: {
    subject: `Confirmez votre nouvelle adresse e-mail – ${MBI_NAME}`,
    title: 'Confirmez votre nouvelle adresse e-mail',
    intro:
      "Pour confirmer le changement d'adresse e-mail de votre compte, saisissez le code ci-dessous :",
  },
};

export function otpMail(
  {otp, scope}: {otp: string; scope?: OtpMailScope},
  options?: MbiMailOptions,
): MbiMail {
  const texts = OTP_TEXTS[scope ?? ''] ?? OTP_TEXTS.registration;
  return {
    subject: texts.subject,
    html: layout(
      {
        preheader: `Votre code : ${otp}`,
        body: [
          heading(texts.title),
          paragraph(escapeHtml(texts.intro)),
          codeBox(otp),
          paragraph(
            `Ce code est valable ${DEFAULT_OTP_EXPIRY} minutes. Ne le communiquez à personne.`,
          ),
          paragraph(escapeHtml(IGNORE_IF_NOT_YOU), {muted: true}),
        ].join('\n'),
      },
      options,
    ),
  };
}

// ---- 4. Member invitation ---- //

export function invitationMail(
  {link, inviterName}: {link: string; inviterName?: string | null},
  options?: MbiMailOptions,
): MbiMail {
  const inviter = inviterName?.trim();
  return {
    subject: inviter
      ? `${inviter} vous invite sur le portail ${MBI_NAME}`
      : `Invitation au portail ${MBI_NAME}`,
    html: layout(
      {
        preheader: 'Créez votre compte pour rejoindre le portail.',
        body: [
          heading('Vous êtes invité à rejoindre le portail'),
          paragraph(
            `${inviter ? strong(inviter) : 'Une entreprise du territoire'} vous invite à rejoindre son espace sur le portail ${strong(MBI_NAME)}.`,
          ),
          paragraph(
            "Vous y retrouverez les actualités et les événements du territoire, le forum d'échange entre entreprises et l'annuaire des membres.",
          ),
          button(link, 'Créer mon compte'),
          fallbackLink(link),
          paragraph(
            "Si vous ne connaissez pas l'expéditeur de cette invitation, ignorez simplement cet e-mail.",
            {muted: true},
          ),
        ].join('\n'),
      },
      options,
    ),
  };
}

// ---- 5. Password reset ---- //

export function resetPasswordMail(
  {link, otp, email}: {link: string; otp: string; email: string},
  options?: MbiMailOptions,
): MbiMail {
  return {
    subject: `Réinitialisation de votre mot de passe – ${MBI_NAME}`,
    html: layout(
      {
        preheader:
          'Votre code et le lien pour choisir un nouveau mot de passe.',
        body: [
          heading('Réinitialisez votre mot de passe'),
          paragraph(
            `Nous avons reçu une demande de réinitialisation du mot de passe du compte ${strong(email)}.`,
          ),
          button(link, 'Choisir un nouveau mot de passe'),
          paragraph('Sur cette page, saisissez le code suivant :'),
          codeBox(otp),
          paragraph(
            `Le lien et le code sont valables ${DEFAULT_OTP_EXPIRY} minutes. Ne les communiquez à personne.`,
          ),
          fallbackLink(link),
          paragraph(escapeHtml(IGNORE_IF_NOT_YOU), {muted: true}),
        ].join('\n'),
      },
      options,
    ),
  };
}

// ---- 6. Event registration ---- //

const TIMEZONE = 'Europe/Paris';

function formatDay(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatEventDate({
  start,
  end,
  allDay,
}: {
  start?: string | Date | null;
  end?: string | Date | null;
  allDay?: boolean | null;
}): string {
  if (!start) return '';
  const from = new Date(start);
  const to = end ? new Date(end) : null;
  const sameDay = !to || formatDay(from) === formatDay(to);

  if (allDay) {
    return sameDay
      ? `${formatDay(from)} (toute la journée)`
      : `du ${formatDay(from)} au ${formatDay(to!)}`;
  }
  if (!to) return `${formatDay(from)} à ${formatTime(from)}`;
  return sameDay
    ? `${formatDay(from)}, de ${formatTime(from)} à ${formatTime(to)}`
    : `du ${formatDay(from)} à ${formatTime(from)} au ${formatDay(to)} à ${formatTime(to)}`;
}

export function eventRegistrationMail(
  {
    participantName,
    eventTitle,
    start,
    end,
    allDay,
    place,
    facilities = [],
    descriptionHtml,
    link,
  }: {
    participantName?: string | null;
    eventTitle: string;
    start?: string | Date | null;
    end?: string | Date | null;
    allDay?: boolean | null;
    place?: string | null;
    facilities?: string[];
    /* Event description from the ERP, already sanitized by the caller. */
    descriptionHtml?: string | null;
    link: string;
  },
  options?: MbiMailOptions,
): MbiMail {
  const name = participantName?.trim();
  return {
    subject: `Inscription confirmée : ${eventTitle}`,
    html: layout(
      {
        preheader: `Votre inscription à « ${eventTitle} » est enregistrée.`,
        body: [
          heading('Votre inscription est confirmée'),
          paragraph(`Bonjour${name ? ` ${strong(name)}` : ''},`),
          paragraph(
            'Merci pour votre inscription. Voici le récapitulatif de votre participation :',
          ),
          infoTable([
            ['Événement', strong(eventTitle)],
            ['Date', escapeHtml(formatEventDate({start, end, allDay}))],
            ['Lieu', place ? escapeHtml(place) : null],
            [
              'Prestations',
              facilities.length
                ? facilities.map(facility => escapeHtml(facility)).join('<br>')
                : null,
            ],
          ]),
          descriptionHtml ? quote(descriptionHtml) : '',
          button(link, "Voir l'événement"),
          paragraph(
            "L'invitation est jointe à cet e-mail : ouvrez-la pour ajouter l'événement à votre agenda.",
            {muted: true},
          ),
          paragraph('À très bientôt !'),
        ].join('\n'),
      },
      options,
    ),
  };
}

// ---- 7. Forum activity ---- //

export function forumMail(
  {
    type,
    recipientName,
    authorName,
    groupName,
    postTitle,
    excerpt,
    link,
  }: {
    type: 'post' | 'comment';
    recipientName?: string | null;
    authorName?: string | null;
    groupName?: string | null;
    postTitle: string;
    /* Plain text (see `toExcerpt`). */
    excerpt?: string | null;
    link: string;
  },
  options?: MbiMailOptions,
): MbiMail {
  const isPost = type === 'post';
  const author = authorName?.trim() || 'Un membre';
  const group = groupName?.trim();
  const name = recipientName?.trim();
  const inGroup = group ? ` dans le groupe ${strong(group)}` : '';

  return {
    subject: isPost
      ? `Nouveau sujet${group ? ` dans « ${group} »` : ''} : ${postTitle}`
      : `Nouvelle réponse à « ${postTitle} »`,
    html: layout(
      {
        preheader: isPost
          ? `${author} a publié « ${postTitle} ».`
          : `${author} a répondu à « ${postTitle} ».`,
        body: [
          heading(isPost ? 'Nouveau sujet sur le forum' : 'Nouvelle réponse'),
          paragraph(`Bonjour${name ? ` ${strong(name)}` : ''},`),
          paragraph(
            isPost
              ? `${strong(author)} a publié un nouveau sujet${inGroup} :`
              : `${strong(author)} a répondu au sujet ${strong(postTitle)}${inGroup} :`,
          ),
          quote(
            [
              isPost ? `${strong(postTitle)}` : '',
              excerpt ? escapeHtml(excerpt) : '',
            ]
              .filter(Boolean)
              .join('<br>'),
          ),
          button(link, isPost ? 'Lire le sujet' : 'Voir la réponse'),
        ].join('\n'),
        footerNote:
          'Vous pouvez modifier vos notifications depuis la page du groupe sur le forum.',
      },
      options,
    ),
  };
}

// ---- 8. New content published from the ERP (webhook) ---- //

const APP_TEXTS: Record<string, {label: string; title: string}> = {
  news: {label: 'Actualités', title: 'Une nouvelle actualité est en ligne'},
  events: {label: 'Événements', title: 'Un nouvel événement est en ligne'},
  forum: {label: 'Forum', title: 'Un nouveau sujet est en ligne'},
  resources: {
    label: 'Ressources',
    title: 'Une nouvelle ressource est en ligne',
  },
  ticketing: {label: 'Tickets', title: 'Un ticket a été mis à jour'},
};

export function publicationMail(
  {
    appCode,
    link,
    subject,
    bodyHtml,
  }: {
    appCode: string;
    link: string;
    /* Subject / body of the message linked in the ERP, if any. `bodyHtml` must
     * be sanitized by the caller. */
    subject?: string | null;
    bodyHtml?: string | null;
  },
  options?: MbiMailOptions,
): MbiMail {
  const texts = APP_TEXTS[appCode] ?? {
    label: 'Portail',
    title: 'Une nouvelle publication est en ligne',
  };
  return {
    subject: subject?.trim() || `${texts.title} – ${MBI_NAME}`,
    html: layout(
      {
        preheader: `${texts.label} : nouvelle publication sur le portail.`,
        body: [
          heading(texts.title),
          bodyHtml
            ? quote(bodyHtml)
            : paragraph(
                `Une nouvelle publication vous attend dans la rubrique ${strong(texts.label)} du portail ${strong(MBI_NAME)}.`,
              ),
          button(link, 'Voir sur le portail'),
        ].join('\n'),
        footerNote:
          'Vous recevez cet e-mail car vous suivez cette rubrique. Gérez vos abonnements dans Mon compte › Notifications.',
      },
      options,
    ),
  };
}
