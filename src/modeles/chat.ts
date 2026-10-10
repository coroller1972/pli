import { plan, pt, rabat, reflet } from '../pliage/geo';
import type { Figure, Fleche, Ligne, Plan, Pt } from '../pliage/types';
import type { Etape, Modele } from './types';

/*
 * La tête de chat (neko). Les coins descendent sur la pointe, puis remontent en biais :
 * ce sont les oreilles. On arrondit la tête et on dessine la frimousse.
 */

const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };
const feutre = (a: Pt, b: Pt, epaisseur = 2.2): Ligne => ({ a, b, type: 'feutre', epaisseur });
const miroir = (p: Pt): Pt => pt(-p[0], p[1]);
const miroirs = (pts: Pt[]): Pt[] => pts.map(miroir).reverse();

// La feuille en losange (demi-diagonale D). Une fois en triangle, O est le milieu du pli du haut.
const D = 110;
const T = pt(0, -D);
const R = pt(D, 0);
const B = pt(0, D);
const L = pt(-D, 0);
const O = pt(0, 0);
const Mg = pt(-D / 2, D / 2);
const Md = miroir(Mg);

// Oreilles : la pointe du rabat remonte en biais, le long d'un pli qui part du milieu.
const P1 = pt(0, 0.28 * D);
const P2 = pt(-0.42 * D, 0.42 * D);
const oreilleG: Pt[] = [P1, B, Mg, P2];
const oreilleGFinie = oreilleG.map((p) => reflet(p, P1, P2));
const resteG: Pt[] = [O, P2, P1];

// On arrondit : le haut de la tête et le bout du menton passent derrière.
const c = 0.2 * D;
const front = (): Pt[] => [pt(-c, c), O, pt(c, c)];
const yMenton = 0.82 * D;
const mentonG = pt(-(D - yMenton), yMenton);
const mentonD = miroir(mentonG);

const CADRE_FEUILLE = [-140, -140, 280, 280] as const;
const CADRE_TRIANGLE = [-130, -30, 260, 160] as const;
const CADRE_TETE = [-95, -60, 190, 180] as const;

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
  titre: 'Les coins sur la pointe',
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

const etape3: Etape = {
  titre: 'Les oreilles',
  consigne:
    'Remontez la pointe de chaque rabat en biais, vers le haut et l’extérieur : elles dépassent au-dessus de la tête. Ce sont les oreilles !',
  astuce: 'Le pli part du milieu, un peu sous le haut. Regardez les deux oreilles ensemble pour qu’elles soient pareilles.',
  figure: {
    cadre: CADRE_TETE,
    plans: [
      plan('fond', [O, Md, B, Mg]),
      rabat('reste-g', resteG),
      rabat('reste-d', miroirs(resteG)),
      rabat('oreille-g', oreilleG),
      rabat('oreille-d', miroirs(oreilleG)),
    ],
    lignes: [v(P1, P2), v(P1, miroir(P2))],
    fleches: [
      f(pt(-6, B[1] - 6), oreilleGFinie[1], 'devant', 0.35),
      f(pt(6, B[1] - 6), miroir(oreilleGFinie[1]), 'devant', -0.35),
    ],
  },
  geste: {
    duree: 3000,
    pistes: [
      { type: 'pli', ids: ['oreille-g'], axe: [P2, P1], sens: 1, de: 0, a: 0.65 },
      { type: 'pli', ids: ['oreille-d'], axe: [P1, miroir(P2)], sens: 1, de: 0.35, a: 1 },
    ],
  },
};

const oreilles = (): Plan[] => [rabat('oreille-g', oreilleGFinie), rabat('oreille-d', miroirs(oreilleGFinie))];

const etape4: Etape = {
  titre: 'Arrondir la tête',
  consigne:
    'Pliez la petite pointe du haut, entre les oreilles, vers l’arrière. Faites de même avec la pointe du menton : la tête s’arrondit.',
  figure: {
    cadre: CADRE_TETE,
    plans: [
      plan('front', front()),
      plan('menton', [mentonG, mentonD, B]),
      plan('fond', [pt(-c, c), pt(c, c), Md, mentonD, mentonG, Mg]),
      rabat('reste-g', [pt(-c, c), P2, P1, pt(0, c)]),
      rabat('reste-d', miroirs([pt(-c, c), P2, P1, pt(0, c)])),
      ...oreilles(),
    ],
    lignes: [v(pt(-c - 4, c), pt(c + 4, c), 'montagne'), v(mentonG, mentonD, 'montagne')],
    fleches: [f(pt(10, 4), pt(10, c + 16), 'derriere', -0.6), f(pt(10, B[1] - 4), pt(10, yMenton - 14), 'derriere', 0.6)],
  },
  geste: {
    duree: 2600,
    pistes: [
      { type: 'pli', ids: ['front'], axe: [pt(-c, c), pt(c, c)], sens: -1, de: 0, a: 0.6 },
      { type: 'pli', ids: ['menton'], axe: [mentonG, mentonD], sens: -1, de: 0.4, a: 1 },
    ],
  },
};

const tete = (): Plan[] => [
  plan('fond', [pt(-c, c), pt(c, c), Md, mentonD, mentonG, Mg]),
  rabat('reste-g', [pt(-c, c), P2, P1, pt(0, c)]),
  rabat('reste-d', miroirs([pt(-c, c), P2, P1, pt(0, c)])),
  ...oreilles(),
];

// La frimousse : deux yeux, un petit nez, une bouche en « w » et des moustaches.
const yNez = 66;
const frimousse: Ligne[] = [
  feutre(pt(-19, 50), pt(-19, 50), 9),
  feutre(pt(19, 50), pt(19, 50), 9),
  feutre(pt(-3, yNez), pt(3, yNez), 7),
  feutre(pt(0, yNez + 2), pt(-6, yNez + 8)),
  feutre(pt(-6, yNez + 8), pt(-11, yNez + 5)),
  feutre(pt(0, yNez + 2), pt(6, yNez + 8)),
  feutre(pt(6, yNez + 8), pt(11, yNez + 5)),
  ...[-1, 1].flatMap((s) => [
    feutre(pt(s * 14, yNez - 2), pt(s * 44, yNez - 8), 1.6),
    feutre(pt(s * 14, yNez + 2), pt(s * 44, yNez + 4), 1.6),
  ]),
];

const etape5: Etape = {
  titre: 'La frimousse',
  consigne:
    'Au feutre, dessinez deux yeux, un petit nez, une bouche en forme de « w » et de grandes moustaches. Miaou !',
  astuce: 'Avec deux feuilles de taille différente, faites un grand chat et son chaton.',
  figure: {
    cadre: CADRE_TETE,
    plans: tete(),
    lignes: frimousse,
  },
};

const illustration: Figure = {
  cadre: [-72, -42, 144, 136],
  plans: tete(),
  lignes: frimousse,
};

export const chat: Modele = {
  id: 'chat',
  nom: 'Le chat',
  sousTitre: 'Neko',
  kana: 'ねこ',
  niveau: 1,
  duree: '4 min',
  feuille: 'Feuille carrée de 15 × 15 cm, colorée d’un côté, et un feutre',
  resume:
    'Le compagnon du chien : deux oreilles pointues qui se dressent en un seul pli, une tête bien ronde, et la frimousse au feutre.',
  papier: { recto: '#f3b07a', verso: '#fff7ec' },
  illustration,
  etapes: [etape1, etape2, etape3, etape4, etape5],
};
