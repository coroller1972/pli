import { plan, pt, rabat } from '../pliage/geo';
import type { Figure, Fleche, Ligne, Plan, Pt } from '../pliage/types';
import type { Etape, Modele } from './types';

/*
 * Le ballon (kami fūsen), à partir de la base de la bombe à eau.
 * On le gonfle en soufflant dans le petit trou du bas : les enfants japonais jouent à le faire rebondir.
 */

const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };
const miroir = (p: Pt): Pt => pt(-p[0], p[1]);
const miroirs = (pts: Pt[]): Pt[] => pts.map(miroir).reverse();

// La feuille, bords droits (demi-côté S).
const S = 100;
const C = pt(0, 0);
const HG = pt(-S, -S);
const HD = pt(S, -S);
const BD = pt(S, S);
const BG = pt(-S, S);
const Mh = pt(0, -S);
const Mb = pt(0, S);
const Mg = pt(-S, 0);
const Md = pt(S, 0);

const CADRE_FEUILLE = [-130, -130, 260, 260] as const;
const CADRE_TRIANGLE = [-125, -22, 250, 144] as const;
const CADRE_LOSANGE = [-80, -16, 160, 132] as const;
const CADRE_GONFLE = [-80, -16, 160, 156] as const;

// Base de la bombe à eau : pointe en C, base de BG à BD. Coins à remonter.
const P = pt(-S / 2, S / 2); // milieu du bord gauche du triangle
const Pd = miroir(P);
// Coins sur le milieu (couche du dessus).
const q = S / 4;
const Qh = pt(-q, q);
const Qb = pt(-q, 3 * q);
const Qc = pt(0, S / 2);
// Pointes du haut, rabattues (elles se rentreront ensuite dans les poches).
const pointe: Pt[] = [Qh, pt(0, q), C];
const pointeRabattue: Pt[] = [Qh, pt(0, q), Qc];

const etape1: Etape = {
  titre: 'Marquer les diagonales',
  consigne: 'Face colorée vers vous, pliez la feuille en deux sur une diagonale, dépliez, puis sur l’autre diagonale.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [plan('feuille', [HG, HD, BD, BG])],
    lignes: [v(HG, BD), v(HD, BG)],
    fleches: [f(pt(-62, 58), pt(58, -62), 'devant', 0.3)],
  },
};

const etape2: Etape = {
  titre: 'Retourner, plier bord à bord',
  consigne:
    'Retournez la feuille, face blanche vers vous. Pliez-la en deux bord à bord, dépliez, puis dans l’autre sens.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [plan('feuille', [HG, HD, BD, BG], 'verso')],
    lignes: [v(HG, BD, 'marque'), v(HD, BG, 'marque'), v(Mg, Md), v(Mh, Mb)],
    fleches: [f(pt(14, -86), pt(14, 86), 'devant', -0.28), f(pt(118, -118), pt(118, -118), 'retourner')],
  },
};

const etape3: Etape = {
  titre: 'La base de la bombe à eau',
  consigne:
    'Rabattez le haut sur le bas, puis poussez les deux côtés vers l’intérieur en suivant les plis : la feuille se rassemble en un triangle, pointe en haut.',
  astuce: 'Les côtés rentrent tout seuls si les plis sont bien marqués. Aplatissez ensuite le triangle bien à plat.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [
      plan('b-g', [C, BG, Mb], 'verso'),
      plan('b-d', [C, Mb, BD], 'verso'),
      plan('b-g-in', [C, Mg, BG], 'verso'),
      plan('b-d-in', [C, BD, Md], 'verso'),
      plan('h-g-in', [C, HG, Mg], 'verso'),
      plan('h-d-in', [C, Md, HD], 'verso'),
      plan('h-g', [C, Mh, HG], 'verso'),
      plan('h-d', [C, HD, Mh], 'verso'),
    ],
    lignes: [v(Mg, Md, 'montagne'), v(Mh, Mb, 'montagne'), v(HG, BD), v(HD, BG)],
    fleches: [
      f(pt(16, -92), pt(16, 88), 'devant', -0.22),
      f(pt(-126, 0), pt(-104, 0), 'pousser'),
      f(pt(126, 0), pt(104, 0), 'pousser'),
    ],
  },
  geste: {
    duree: 3800,
    pistes: [
      { type: 'pli', ids: ['h-g', 'h-d', 'h-g-in', 'h-d-in'], axe: [Mg, Md], sens: 1, de: 0, a: 0.42 },
      {
        type: 'morph',
        de: 0.5,
        a: 1,
        vers: {
          'h-g-in': [C, BG, Mb],
          'h-d-in': [C, Mb, BD],
          'b-g-in': [C, Mb, BG],
          'b-d-in': [C, BD, Mb],
        },
        ombres: { 'h-g-in': 0.2, 'h-d-in': 0.2, 'b-g-in': 0.2, 'b-d-in': 0.2 },
      },
    ],
  },
};

const etape4: Etape = {
  titre: 'Les coins en haut',
  consigne:
    'Couche du dessus : remontez les deux coins du bas jusqu’à la pointe du haut. Retournez et faites de même de l’autre côté : vous obtenez un losange.',
  figure: {
    cadre: CADRE_TRIANGLE,
    plans: [
      plan('triangle', [C, BG, BD]),
      plan('fixe-g', [C, P, Mb]),
      plan('fixe-d', [C, Mb, Pd]),
      rabat('coin-g', [P, BG, Mb]),
      rabat('coin-d', [Pd, Mb, BD]),
    ],
    lignes: [v(P, Mb), v(Pd, Mb), v(C, Mb, 'marque')],
    fleches: [f(pt(-92, 94), pt(-8, 8), 'devant', 0.3), f(pt(92, 94), pt(8, 8), 'devant', -0.3)],
  },
  geste: {
    duree: 2800,
    pistes: [
      { type: 'pli', ids: ['coin-g'], axe: [P, Mb], sens: 1, de: 0, a: 0.65 },
      { type: 'pli', ids: ['coin-d'], axe: [Pd, Mb], sens: 1, de: 0.35, a: 1 },
    ],
  },
};

const etape5: Etape = {
  titre: 'Les côtés au milieu',
  consigne: 'Couche du dessus : rabattez les coins de gauche et de droite sur la ligne du milieu.',
  figure: {
    cadre: CADRE_LOSANGE,
    plans: [
      plan('fond', [C, Pd, Mb, P], 'recto', 0.1),
      rabat('g', [C, P, Mb]),
      rabat('d', [C, Mb, Pd]),
    ],
    lignes: [v(C, Mb, 'marque'), v(Qh, Qb), v(miroir(Qh), miroir(Qb))],
    fleches: [f(pt(-46, 46), pt(-6, 46), 'devant', -0.4), f(pt(46, 46), pt(6, 46), 'devant', 0.4)],
  },
};

/** Une face du losange, côtés rabattus. Les pointes du haut sont fournies à part. */
const faceCotes = (): Plan[] => [
  plan('fond', [C, Pd, Mb, P], 'recto', 0.1),
  rabat('g-bas', [Qh, Qb, Mb, pt(0, q)]),
  rabat('d-bas', miroirs([Qh, Qb, Mb, pt(0, q)])),
  rabat('cote-g', [Qh, Qc, Qb]),
  rabat('cote-d', miroirs([Qh, Qc, Qb])),
];

const etape6: Etape = {
  titre: 'Rabattre les petites pointes',
  consigne:
    'En haut, deux petites pointes dépassent : rabattez-les vers le bas, sur les triangles que vous venez de plier.',
  figure: {
    cadre: CADRE_LOSANGE,
    plans: [...faceCotes(), rabat('pointe-g', pointe), rabat('pointe-d', miroirs(pointe))],
    lignes: [v(Qh, miroir(Qh))],
    fleches: [f(pt(-8, 4), pt(-8, 44), 'devant', 0.5), f(pt(8, 4), pt(8, 44), 'devant', -0.5)],
  },
};

const etape7: Etape = {
  titre: 'Rentrer dans les poches',
  consigne:
    'Chaque petit triangle se replie en deux et se glisse dans la poche du triangle de côté. Ouvrez la poche du bout du doigt et poussez.',
  astuce: 'C’est le geste le plus délicat : allez-y doucement, la pointe doit disparaître entièrement dans la poche.',
  figure: {
    cadre: CADRE_LOSANGE,
    plans: [
      ...faceCotes(),
      // Une fois retournées, les pointes passent sous les triangles de côté (rangs 3 et 4).
      { ...rabat('pointe-g', pointeRabattue), zRetourne: 2.5 },
      { ...rabat('pointe-d', miroirs(pointeRabattue)), zRetourne: 2.6 },
    ],
    lignes: [v(Qh, Qc), v(miroir(Qh), Qc)],
    fleches: [f(pt(-4, 30), pt(-30, 50), 'pousser'), f(pt(4, 30), pt(30, 50), 'pousser')],
  },
  geste: {
    duree: 3000,
    pistes: [
      { type: 'pli', ids: ['pointe-g'], axe: [Qc, Qh], sens: 1, de: 0, a: 0.65 },
      { type: 'pli', ids: ['pointe-d'], axe: [miroir(Qh), Qc], sens: 1, de: 0.35, a: 1 },
    ],
  },
};

const hexagone = (): Plan[] => [
  plan('haut', [C, miroir(Qh), Qc, Qh]),
  rabat('cote-g', [Qh, Qc, Qb]),
  rabat('cote-d', miroirs([Qh, Qc, Qb])),
  plan('bas', [Qb, Qc, miroir(Qb), Mb]),
];

const etape8: Etape = {
  titre: 'Retourner et recommencer',
  consigne: 'Retournez le pliage et refaites les étapes 5 à 7 de l’autre côté. Les deux faces sont identiques.',
  figure: {
    cadre: CADRE_LOSANGE,
    plans: hexagone(),
    fleches: [f(pt(58, 6), pt(58, 6), 'retourner')],
  },
};

/** Le ballon gonflé : la forme s'élargit, les angles s'arrondissent. */
const gonfle = (p: Pt): Pt => pt(p[0] * 1.75, 50 + (p[1] - 50) * 0.86);
const hexagoneGonfle: Record<string, Pt[]> = Object.fromEntries(hexagone().map((p) => [p.id, p.pts.map(gonfle)]));

const etape9: Etape = {
  titre: 'Gonfler le ballon',
  consigne:
    'Tenez le ballon délicatement, trou en bas, et soufflez d’un coup sec dans le petit trou : il se gonfle et devient un cube. Lancez-le en l’air et faites-le rebondir dans la main !',
  astuce: 'Si le ballon ne se gonfle pas, écartez un peu les couches autour du trou avant de souffler.',
  figure: {
    cadre: CADRE_GONFLE,
    plans: hexagone(),
    fleches: [f(pt(0, 132), pt(0, 108), 'pousser')],
  },
  geste: {
    duree: 2400,
    pistes: [{ type: 'morph', vers: hexagoneGonfle, ombres: { 'cote-g': 0.18, 'cote-d': 0.18 } }],
  },
};

const illustration: Figure = {
  cadre: [-62, -12, 124, 124],
  plans: hexagone().map((p) => ({ ...p, pts: hexagoneGonfle[p.id], ombre: p.id.startsWith('cote') ? 0.18 : 0 })),
};

export const ballon: Modele = {
  id: 'ballon',
  nom: 'Le ballon',
  sousTitre: 'Kami fūsen',
  kana: 'かみふうせん',
  niveau: 2,
  duree: '10 min',
  feuille: 'Feuille carrée de 15 × 15 cm, colorée d’un côté (un papier fin se gonfle mieux)',
  resume:
    'Le ballon de papier que l’on gonfle d’un souffle. Les pointes à glisser dans les poches demandent de la précision, la fin est magique.',
  papier: { recto: '#ee9ab4', verso: '#ffffff' },
  illustration,
  etapes: [etape1, etape2, etape3, etape4, etape5, etape6, etape7, etape8, etape9],
};
