/**
 * MBI: shared e-mail layout in the Marne et Brie Industries colours (taken from
 * the main logo). Plain strings with inline styles and tables only, so the mails
 * render the same in webmails and Outlook. Pure module (no Next/DB import): the
 * preview script (`pnpm mbi:mail:preview`) renders it outside the app.
 */
import {
  MBI_MAIN_LOGO,
  MBI_PARTNER_LOGOS,
} from '@/app/[tenant]/[workspace]/mbi-brand';
import {getBasePath} from '@/lib/core/path/base-path';

export const MBI_NAME = 'Marne et Brie Industries';

export const MBI_COLORS = {
  navy: '#29327a',
  blue: '#4397d2',
  blueLight: '#eaf3fb',
  text: '#33384d',
  muted: '#6b7088',
  border: '#dfe5ee',
  background: '#f2f5fa',
  white: '#ffffff',
};

const FONT = "Arial, 'Helvetica Neue', Helvetica, sans-serif";

export type MbiMail = {subject: string; html: string};

export type MbiMailOptions = {
  /* Base URL the logos are loaded from. Mail clients need an absolute URL:
   * defaults to the public portal URL, the preview passes a local one. */
  assetBase?: string;
};

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* Rich text (forum post, comment) reduced to a short plain-text excerpt. */
export function toExcerpt(content: string | null | undefined, max = 220) {
  const text = String(content ?? '')
    .replace(/<(br|\/p|\/div|\/li)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

function assetUrl(path: string, options?: MbiMailOptions) {
  const base =
    options?.assetBase ??
    `${process.env.GOOVEE_PUBLIC_HOST ?? ''}${getBasePath()}`;
  return `${base.replace(/\/$/, '')}${path}`;
}

// ---- Building blocks ---- //

export function heading(text: string) {
  return `<h1 style="margin:0 0 20px;font-family:${FONT};font-size:22px;line-height:30px;font-weight:bold;color:${MBI_COLORS.navy};">${escapeHtml(text)}</h1>`;
}

/* `html` is trusted markup built by the templates (already escaped values). */
export function paragraph(html: string, {muted = false} = {}) {
  const color = muted ? MBI_COLORS.muted : MBI_COLORS.text;
  const size = muted ? '13px' : '15px';
  const lineHeight = muted ? '20px' : '24px';
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:${size};line-height:${lineHeight};color:${color};">${html}</p>`;
}

export function strong(text: string) {
  return `<strong style="color:${MBI_COLORS.navy};">${escapeHtml(text)}</strong>`;
}

export function button(href: string, label: string) {
  const url = escapeHtml(href);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
  <tr>
    <td align="center" bgcolor="${MBI_COLORS.navy}" style="border-radius:6px;">
      <a href="${url}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:${FONT};font-size:15px;font-weight:bold;line-height:20px;color:${MBI_COLORS.white};text-decoration:none;border-radius:6px;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

/* Raw link under a button, for clients that block buttons. */
export function fallbackLink(href: string) {
  const url = escapeHtml(href);
  return paragraph(
    `Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href="${url}" target="_blank" style="color:${MBI_COLORS.blue};word-break:break-all;">${url}</a>`,
    {muted: true},
  );
}

export function codeBox(code: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:4px 0 24px;">
  <tr>
    <td align="center" bgcolor="${MBI_COLORS.blueLight}" style="padding:20px;border:1px dashed ${MBI_COLORS.blue};border-radius:8px;font-family:'Courier New',Courier,monospace;font-size:32px;line-height:38px;font-weight:bold;letter-spacing:8px;color:${MBI_COLORS.navy};">${escapeHtml(code)}</td>
  </tr>
</table>`;
}

/* Label / value rows; values are trusted markup (escape them before). */
export function infoTable(rows: Array<[string, string | null | undefined]>) {
  const cells = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `<tr>
    <td valign="top" style="padding:10px 16px 10px 0;width:120px;font-family:${FONT};font-size:13px;line-height:20px;font-weight:bold;color:${MBI_COLORS.muted};border-bottom:1px solid ${MBI_COLORS.border};">${escapeHtml(label)}</td>
    <td valign="top" style="padding:10px 0;font-family:${FONT};font-size:15px;line-height:22px;color:${MBI_COLORS.text};border-bottom:1px solid ${MBI_COLORS.border};">${value}</td>
  </tr>`,
    )
    .join('\n');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;border-top:1px solid ${MBI_COLORS.border};">
  ${cells}
</table>`;
}

/* Highlighted block (quoted message, ERP content); `html` is trusted markup. */
export function quote(html: string) {
  /* Rich text from the ERP comes as <p> blocks: tighten their default margins. */
  const content = html
    .replace(/<p(\s[^>]*)?>/gi, '<p style="margin:0 0 10px;">')
    .replace(
      /<p style="margin:0 0 10px;">((?:(?!<p[\s>])[\s\S])*?)<\/p>\s*$/i,
      '<p style="margin:0;">$1</p>',
    );
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;">
  <tr>
    <td style="padding:16px 20px;background:${MBI_COLORS.background};border-left:4px solid ${MBI_COLORS.blue};font-family:${FONT};font-size:15px;line-height:24px;color:${MBI_COLORS.text};">${content}</td>
  </tr>
</table>`;
}

// ---- Layout ---- //

export function layout(
  {
    preheader,
    body,
    footerNote,
  }: {
    /* Preview text shown by mail clients after the subject. */
    preheader: string;
    /* Trusted markup built with the blocks above. */
    body: string;
    footerNote?: string;
  },
  options?: MbiMailOptions,
) {
  const logoWidth = 220;
  const logoHeight = Math.round(
    (logoWidth * MBI_MAIN_LOGO.height) / MBI_MAIN_LOGO.width,
  );

  const partners = MBI_PARTNER_LOGOS.map(logo => {
    // Small enough for the four logos to fit a phone screen on one row.
    const height = 28;
    const width = Math.round((height * logo.width) / logo.height);
    return `<td align="center" valign="middle" style="padding:6px 6px;">
          <a href="${escapeHtml(logo.href)}" target="_blank"><img src="${escapeHtml(assetUrl(logo.src, options))}" width="${width}" height="${height}" alt="${escapeHtml(logo.name)}" style="display:block;border:0;height:${height}px;width:${width}px;"></a>
        </td>`;
  }).join('\n        ');

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${escapeHtml(MBI_NAME)}</title>
</head>
<body style="margin:0;padding:0;background:${MBI_COLORS.background};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${MBI_COLORS.background}" style="background:${MBI_COLORS.background};">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;">
        <tr>
          <td align="center" bgcolor="${MBI_COLORS.white}" style="padding:28px 24px 22px;background:${MBI_COLORS.white};border-radius:10px 10px 0 0;">
            <a href="${escapeHtml(MBI_MAIN_LOGO.href)}" target="_blank"><img src="${escapeHtml(assetUrl(MBI_MAIN_LOGO.src, options))}" width="${logoWidth}" height="${logoHeight}" alt="${escapeHtml(MBI_MAIN_LOGO.name)}" style="display:block;border:0;width:${logoWidth}px;height:${logoHeight}px;"></a>
          </td>
        </tr>
        <tr>
          <td height="4" bgcolor="${MBI_COLORS.blue}" style="font-size:0;line-height:0;background:${MBI_COLORS.blue};">&nbsp;</td>
        </tr>
        <tr>
          <td bgcolor="${MBI_COLORS.white}" style="padding:32px 36px 16px;background:${MBI_COLORS.white};border-radius:0 0 10px 10px;">
            ${body}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 12px 8px;font-family:${FONT};font-size:12px;line-height:18px;color:${MBI_COLORS.muted};">
            Le territoire d'industrie ${escapeHtml(MBI_NAME)} réunit
          </td>
        </tr>
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
        ${partners}
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:16px 24px 8px;font-family:${FONT};font-size:12px;line-height:18px;color:${MBI_COLORS.muted};">
            ${footerNote ? `${escapeHtml(footerNote)}<br>` : ''}Cet e-mail a été envoyé automatiquement par le portail ${escapeHtml(MBI_NAME)}, merci de ne pas y répondre.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
