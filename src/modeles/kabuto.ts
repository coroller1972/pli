import { plan, pt, rabat, reflet } from '../pliage/geo';
import type { Figure, Fleche, Ligne, Plan, Pt } from '../pliage/types';
import type { Etape, Modele } from './types';

/*
 * Le kabuto, le casque de samouraï que l'on plie au Japon pour la fête des enfants (5 mai).
 * Triangle, coins en bas, pointes en haut, cornes, puis la bande du bas pliée deux fois.
 */

const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };
const miroir = (p: Pt): Pt => pt(-p[0], p[1]);
const miroirs = (pts: Pt[]): Pt[] => pts.map(miroir).reverse();

// La feuille en losange (demi-diagonale D). Une fois en triangle, O est le milieu du pli du haut.
const D = 110;
const T = pt(0, -D);
const R = pt(D, 0);
const B = pt(0, D);
const L = pt(-D, 0);
const O = pt(0, 0);
const Mg = pt(-D / 2, D / 2); // coin gauche du losange
const Md = miroir(Mg);
const Cm = pt(0, D / 2); // centre du losange

// Cornes : la pointe des rabats bascule vers l'extérieur, le long d'un pli légèrement décentré.
const corneA = pt(-0.1 * D, D / 2);
const corneB = pt(-0.2 * D, 0.2 * D);
const corneG: Pt[] = [corneA, Cm, O, corneB];
const corneGFinie = corneG.map((p) => reflet(p, corneA, corneB));
const resteG: Pt[] = [Mg, corneA, corneB];

// Bande : la pointe du bas (couche de devant) monte jusqu'à la ligne des coins, puis la bande remonte encore.
const yBande = 0.75 * D;
const bandeG = pt(-(D - yBande), yBande);
const bandeD = miroir(bandeG);
const yHautBande = D - yBande; // une fois remontée, la bande s'arrête ici
const hautBandeG = pt(-yHautBande, yHautBande);
const hautBandeD = miroir(hautBandeG);

const CADRE_FEUILLE = [-140, -140, 280, 280] as const;
const CADRE_TRIANGLE = [-130, -30, 260, 160] as const;
const CADRE_CASQUE = [-100, -20, 200, 150] as const;

const etape1: Etape = {
  titre: 'Plier en triangle',
  consigne: 'Feuille en losange, face blanche vers vous. Rabattez la pointe du haut sur celle du bas.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [plan('feuille', [T, R, B, L], 'verso')],
    lignes: [v(L, R)],
    fleches: [f(pt(16, -94), pt(16, 92), 'devant', -0.25)],
  },
};

const etape2: Etape = {
  titre: 'Les coins en bas',
  consigne: 'Rabattez les deux coins du haut sur la pointe du bas. Vous obtenez un carré posé sur la pointe.',
  figure: {
    cadre: CADRE_TRIANGLE,
    plans: [plan('fond', [O, Md, B, Mg]), rabat('coin-g', [L, O, Mg]), rabat('coin-d', [O, R, Md])],
    lignes: [v(O, Mg), v(O, Md)],
    fleches: [f(pt(-100, -8), pt(-8, 98), 'devant', 0.35), f(pt(100, -8), pt(8, 98), 'devant', -0.35)],
  },
  geste: {
    duree: 2800,
    pistes: [
      { type: 'pli', ids: ['coin-g'], axe: [O, Mg], sens: 1, de: 0, a: 0.65 },
      { type: 'pli', ids: ['coin-d'], axe: [Md, O], sens: 1, de: 0.35, a: 1 },
    ],
  },
};

/** Les deux moitiés hautes des rabats, qui ne bougent plus ensuite. */
const hautsRabats = (): Plan[] => [rabat('g-haut', [O, Mg, Cm]), rabat('d-haut', [O, Cm, Md])];

const etape3: Etape = {
  titre: 'Les pointes en haut',
  consigne:
    'Remontez les deux pointes du bas (les rabats que vous venez de plier) jusqu’à la pointe du haut. Le carré est maintenant fait de deux triangles.',
  figure: {
    cadre: CADRE_TRIANGLE,
    plans: [
      plan('fond', [O, Md, B, Mg]),
      ...hautsRabats(),
      rabat('g-bas', [Mg, Cm, B]),
      rabat('d-bas', [Cm, Md, B]),
    ],
    lignes: [v(Mg, Md)],
    fleches: [f(pt(-12, 100), pt(-12, 10), 'devant', 0.4), f(pt(12, 100), pt(12, 10), 'devant', -0.4)],
  },
};

const etape4: Etape = {
  titre: 'Les cornes',
  consigne:
    'Rabattez la pointe de chaque petit triangle vers l’extérieur, en biais : elles dépassent sur les côtés, comme les cornes du casque.',
  astuce: 'Le pli part juste à côté du milieu, en bas du triangle. Les deux cornes doivent être bien symétriques.',
  figure: {
    cadre: CADRE_TRIANGLE,
    plans: [
      plan('fond', [O, Md, B, Mg]),
      ...hautsRabats(),
      rabat('g-reste', resteG),
      rabat('d-reste', miroirs(resteG)),
      rabat('g-corne', corneG),
      rabat('d-corne', miroirs(corneG)),
    ],
    lignes: [v(corneA, corneB), v(miroir(corneA), miroir(corneB))],
    fleches: [
      f(pt(-8, 6), corneGFinie[2], 'devant', 0.4),
      f(pt(8, 6), miroir(corneGFinie[2]), 'devant', -0.4),
    ],
  },
  geste: {
    duree: 3000,
    pistes: [
      { type: 'pli', ids: ['g-corne'], axe: [corneB, corneA], sens: 1, de: 0, a: 0.65 },
      { type: 'pli', ids: ['d-corne'], axe: [miroir(corneA), miroir(corneB)], sens: 1, de: 0.35, a: 1 },
    ],
  },
};

/** Le haut du casque, cornes faites. */
const hautCasque = (): Plan[] => [
  ...hautsRabats(),
  rabat('g-reste', resteG),
  rabat('d-reste', miroirs(resteG)),
  rabat('g-corne', corneGFinie),
  rabat('d-corne', miroirs(corneGFinie)),
];

const etape5: Etape = {
  titre: 'Remonter la pointe du bas',
  consigne:
    'Couche de devant seulement : remontez la pointe du bas jusqu’à la ligne des coins. La couche de derrière ne bouge pas.',
  figure: {
    cadre: CADRE_CASQUE,
    plans: [
      plan('arriere', [Mg, Md, B], 'recto', 0.12),
      plan('fond', [O, Md, Mg]),
      plan('bande', [Mg, Md, bandeD, bandeG]),
      plan('pointe', [bandeG, bandeD, B]),
      ...hautCasque(),
    ],
    lignes: [v(bandeG, bandeD)],
    fleches: [f(pt(-10, B[1] - 4), pt(-10, Cm[1] + 4), 'devant', 0.6)],
  },
};

const etape6: Etape = {
  titre: 'La bande du casque',
  consigne:
    'Repliez encore une fois vers le haut, le long de la ligne des coins : la bande blanche se pose sur le bas des cornes.',
  figure: {
    cadre: CADRE_CASQUE,
    plans: [
      plan('arriere', [Mg, Md, B], 'recto', 0.12),
      plan('fond', [O, Md, Mg]),
      ...hautCasque(),
      plan('bande', [Mg, Md, bandeD, bandeG]),
      // Une fois retournée, la pointe passe juste sous la bande (rang 8).
      { ...plan('pointe', [bandeG, bandeD, Cm], 'verso'), zRetourne: 7.5 },
    ],
    lignes: [v(Mg, Md)],
    fleches: [f(pt(-14, yBande + 4), pt(-14, yHautBande + 4), 'devant', 0.5)],
  },
  geste: {
    duree: 2600,
    pistes: [{ type: 'pli', ids: ['bande', 'pointe'], axe: [Mg, Md], sens: 1 }],
  },
};

const bandeFinie = (): Plan => plan('bande', [hautBandeG, hautBandeD, Md, Mg], 'verso');

const etape7: Etape = {
  titre: 'Rentrer la pointe de derrière',
  consigne: 'Retournez le casque, puis pliez la pointe qui reste vers le haut et glissez-la à l’intérieur du casque.',
  astuce: 'Si la pointe dépasse, pliez-la d’abord, puis rentrez-la : le casque tiendra mieux sur la tête.',
  figure: {
    cadre: CADRE_CASQUE,
    plans: [plan('arriere', [Mg, Md, B], 'recto', 0.12), plan('fond', [O, Md, Mg]), ...hautCasque(), bandeFinie()],
    lignes: [v(Mg, Md, 'montagne')],
    fleches: [f(pt(12, B[1] - 6), pt(12, Cm[1] + 14), 'derriere', -0.5)],
  },
};

const casque = (): Plan[] => [plan('fond', [O, Md, Mg]), ...hautCasque(), bandeFinie()];

const etape8: Etape = {
  titre: 'Ouvrir le casque',
  consigne:
    'Glissez les doigts dans l’ouverture du bas et écartez doucement : le kabuto prend du volume. Il n’y a plus qu’à le poser sur une tête… de poupée, ou d’enfant avec une grande feuille !',
  astuce: 'Avec une feuille de journal carrée (60 × 60 cm), le casque est à la taille d’un enfant.',
  figure: {
    cadre: CADRE_CASQUE,
    plans: casque(),
    fleches: [f(pt(-6, Cm[1] + 10), pt(-30, Cm[1] + 40), 'tirer'), f(pt(6, Cm[1] + 10), pt(30, Cm[1] + 40), 'tirer')],
  },
};

const illustration: Figure = {
  cadre: [-82, -8, 164, 70],
  plans: casque(),
};

export const kabuto: Modele = {
  id: 'kabuto',
  nom: 'Le kabuto',
  sousTitre: 'Casque de samouraï',
  kana: 'かぶと',
  niveau: 2,
  duree: '8 min',
  feuille: 'Feuille carrée de 15 × 15 cm colorée d’un côté, ou un journal carré pour le porter',
  resume:
    'Le casque que l’on plie au Japon pour la fête des enfants. Deux cornes et une bande pliée deux fois : précis, mais sans piège.',
  papier: { recto: '#6f86c2', verso: '#ffffff' },
  illustration,
  etapes: [etape1, etape2, etape3, etape4, etape5, etape6, etape7, etape8],
};
