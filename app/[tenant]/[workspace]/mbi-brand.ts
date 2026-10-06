/**
 * MBI: logos shown in the header and on the home hero — the main
 * "Territoires d'industrie · Marne et Brie Industries" logo and the four
 * intercommunalities. Images live in public/images/mbi (trimmed, web-sized);
 * `width`/`height` are the intrinsic image size, used for the aspect ratio.
 */
export type MbiLogo = {
  name: string;
  src: string;
  href: string;
  width: number;
  height: number;
};

export const MBI_MAIN_LOGO: MbiLogo = {
  name: "Territoires d'industrie · Marne et Brie Industries",
  src: '/images/mbi/territoires-industrie-mbi.png',
  href: 'https://www.linkedin.com/company/marne-et-brie-industries/',
  width: 1200,
  height: 521,
};

export const MBI_PARTNER_LOGOS: MbiLogo[] = [
  {
    name: "L'Orée de la Brie",
    src: '/images/mbi/loree-de-la-brie.png',
    href: 'https://www.loreedelabrie.fr/',
    width: 465,
    height: 240,
  },
  {
    name: 'Les Portes Briardes',
    src: '/images/mbi/les-portes-briardes.png',
    href: 'https://www.lesportesbriardes.fr/',
    width: 670,
    height: 240,
  },
  {
    name: 'Paris Vallée de la Marne',
    src: '/images/mbi/paris-vallee-de-la-marne.png',
    href: 'https://www.agglo-pvm.fr/',
    width: 561,
    height: 240,
  },
  {
    name: 'Marne et Gondoire',
    src: '/images/mbi/marne-et-gondoire.png',
    href: 'https://www.marneetgondoire.fr/',
    width: 294,
    height: 184,
  },
];
