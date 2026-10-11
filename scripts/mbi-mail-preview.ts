/**
 * MBI: renders every portal e-mail with sample data, without running the app.
 *
 *   pnpm mbi:mail:preview [--host https://portal.example.com]
 *
 * Writes `.mbi-mail-preview/` (gitignored): one HTML file per mail, an
 * `index.html` showing them all at desktop and phone width, and the two
 * ERP-ready templates (OTP, invitation) to paste into the portal app config.
 * Previews load the logos from `public/`; the ERP templates use `--host`
 * (default GOOVEE_PUBLIC_HOST), since a mail needs an absolute logo URL.
 */
import '@/load-swc-env';

import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from 'node:util';

import {getBasePath} from '@/lib/core/path/base-path';
import {
  type MbiMail,
  escapeHtml,
  eventRegistrationMail,
  forumMail,
  invitationMail,
  otpMail,
  publicationMail,
  resetPasswordMail,
  toExcerpt,
} from '@/lib/mbi/mail';

const {values} = parseArgs({
  args: process.argv.slice(2).filter(arg => arg !== '--'),
  options: {host: {type: 'string'}},
});

const outDir = path.join(process.cwd(), '.mbi-mail-preview');
const local = {assetBase: `file://${path.join(process.cwd(), 'public')}`};
const host = (values.host ?? process.env.GOOVEE_PUBLIC_HOST ?? '').replace(
  /\/$/,
  '',
);
const erp = {assetBase: `${host}${getBasePath()}`};

const portal = 'https://portail.example.com/d/mbi';
const nextWeek = new Date(Date.now() + 7 * 24 * 3600 * 1000);
nextWeek.setHours(14, 0, 0, 0);
const nextWeekEnd = new Date(nextWeek.getTime() + 3 * 3600 * 1000);

const mails: Array<{id: string; label: string; mail: MbiMail}> = [
  {
    id: '1-otp-inscription',
    label: '1-2. Code OTP – inscription (et inscription sur invitation)',
    mail: otpMail({otp: '482915', scope: 'registration'}, local),
  },
  {
    id: '3-otp-changement-email',
    label: "3. Code OTP – changement d'adresse e-mail",
    mail: otpMail({otp: '730264', scope: 'email_update'}, local),
  },
  {
    id: '4-invitation',
    label: "4. Invitation d'un membre",
    mail: invitationMail(
      {
        link: 'https://portail.example.com/auth/register/invite/42/email?tenant=d',
        inviterName: 'APOLLO',
      },
      local,
    ),
  },
  {
    id: '5-mot-de-passe',
    label: '5. Réinitialisation du mot de passe',
    mail: resetPasswordMail(
      {
        link: 'https://portail.example.com/auth/reset-password/info@apollo.fr',
        otp: '159357',
        email: 'info@apollo.fr',
      },
      local,
    ),
  },
  {
    id: '6-inscription-evenement',
    label: '6. Confirmation d’inscription à un événement',
    mail: eventRegistrationMail(
      {
        participantName: 'Camille Martin',
        eventTitle: 'Petit-déjeuner des industriels du territoire',
        start: nextWeek,
        end: nextWeekEnd,
        allDay: false,
        place: 'Hôtel d’agglomération, 5 cours de l’Arche Guédon, Torcy',
        facilities: ['Petit-déjeuner', 'Visite du site'],
        descriptionHtml:
          '<p>Une matinée d’échanges entre chefs d’entreprise sur les enjeux du recrutement industriel en Marne et Brie.</p>',
        link: `${portal}/events/petit-dejeuner-industriels`,
      },
      local,
    ),
  },
  {
    id: '7a-forum-sujet',
    label: '7. Forum – nouveau sujet',
    mail: forumMail(
      {
        type: 'post',
        recipientName: 'Camille Martin',
        authorName: 'Jean Dupont',
        groupName: 'Recrutement & compétences',
        postTitle: 'Mutualiser une formation de soudeurs ?',
        excerpt: toExcerpt(
          '<p>Bonjour à tous,</p><p>Nous cherchons à former <strong>trois soudeurs</strong> d’ici le printemps. D’autres entreprises du territoire auraient-elles le même besoin ? Nous pourrions monter une session commune avec un organisme de formation local.</p>',
        ),
        link: `${portal}/forum/topic/16`,
      },
      local,
    ),
  },
  {
    id: '7b-forum-reponse',
    label: '7. Forum – nouvelle réponse',
    mail: forumMail(
      {
        type: 'comment',
        recipientName: 'Jean Dupont',
        authorName: 'Camille Martin',
        groupName: 'Recrutement & compétences',
        postTitle: 'Mutualiser une formation de soudeurs ?',
        excerpt: toExcerpt(
          'Bonne idée ! Nous avons deux postes à pourvoir, comptez sur nous.',
        ),
        link: `${portal}/forum/topic/16`,
      },
      local,
    ),
  },
  {
    id: '8a-publication-actualite',
    label: '8. Nouvelle publication depuis l’ERP (sans message ERP)',
    mail: publicationMail(
      {appCode: 'news', link: `${portal}/news/category/territoire`},
      local,
    ),
  },
  {
    id: '8b-publication-message-erp',
    label: '8. Nouvelle publication depuis l’ERP (avec message ERP)',
    mail: publicationMail(
      {
        appCode: 'events',
        link: `${portal}/events/category/rencontres`,
        subject: 'Nouvel événement : Salon de l’industrie 2027',
        bodyHtml:
          '<p>Les inscriptions au <strong>Salon de l’industrie 2027</strong> sont ouvertes. Réservez votre stand avant le 15 décembre.</p>',
      },
      local,
    ),
  },
];

/* Templates for the ERP (portal app config › OTP / invitation templates): the
 * portal replaces `${context.*}` itself when it sends them. */
const erpTemplates = [
  {
    id: 'erp-otp',
    label: 'Modèle ERP – code OTP',
    mail: otpMail({otp: '${context.otp}', scope: 'registration'}, erp),
  },
  {
    id: 'erp-invitation',
    label: 'Modèle ERP – invitation',
    mail: invitationMail({link: '${context.link}'}, erp),
  },
];

fs.mkdirSync(outDir, {recursive: true});

for (const {id, mail} of [...mails, ...erpTemplates]) {
  fs.writeFileSync(path.join(outDir, `${id}.html`), mail.html);
}
for (const {id, mail} of erpTemplates) {
  fs.writeFileSync(path.join(outDir, `${id}.subject.txt`), `${mail.subject}\n`);
}

const cards = mails
  .map(
    ({id, label, mail}) => `<section>
  <h2>${escapeHtml(label)}</h2>
  <p class="subject"><span>Objet</span> ${escapeHtml(mail.subject)}</p>
  <div class="frames">
    <figure><figcaption>Ordinateur</figcaption><iframe src="${id}.html" width="680" height="900" loading="lazy"></iframe></figure>
    <figure><figcaption>Téléphone</figcaption><iframe src="${id}.html" width="375" height="900" loading="lazy"></iframe></figure>
  </div>
</section>`,
  )
  .join('\n');

const erpList = erpTemplates
  .map(
    ({id, label, mail}) =>
      `<li><a href="${id}.html">${escapeHtml(label)}</a> — objet : <code>${escapeHtml(mail.subject)}</code> (contenu : <code>${id}.html</code>)</li>`,
  )
  .join('\n');

fs.writeFileSync(
  path.join(outDir, 'index.html'),
  `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Aperçu des e-mails MBI</title>
<style>
  body { margin: 0; padding: 24px; font-family: Arial, sans-serif; background: #e9edf3; color: #33384d; }
  h1 { color: #29327a; margin: 0 0 8px; }
  h2 { color: #29327a; font-size: 18px; margin: 0 0 6px; }
  section { background: #fff; border-radius: 10px; padding: 20px; margin: 0 0 24px; }
  .subject { margin: 0 0 16px; font-size: 14px; }
  .subject span { display: inline-block; background: #29327a; color: #fff; border-radius: 4px; padding: 2px 8px; margin-right: 6px; font-size: 12px; }
  .frames { display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start; }
  figure { margin: 0; }
  figcaption { font-size: 12px; color: #6b7088; margin-bottom: 6px; }
  iframe { border: 1px solid #dfe5ee; border-radius: 8px; background: #fff; }
  code { background: #f2f5fa; padding: 1px 4px; border-radius: 3px; }
</style>
</head>
<body>
<h1>Aperçu des e-mails du portail</h1>
<p>Généré le ${escapeHtml(new Date().toLocaleString('fr-FR'))} avec des données d'exemple.</p>
<section>
  <h2>Modèles à coller dans l'ERP</h2>
  <p>Logos chargés depuis <code>${escapeHtml(erp.assetBase || '(GOOVEE_PUBLIC_HOST non défini)')}</code>.</p>
  <ul>${erpList}</ul>
</section>
${cards}
</body>
</html>
`,
);

console.log(`${mails.length} e-mails rendered in ${outDir}`);
console.log(`Open file://${path.join(outDir, 'index.html')}`);
