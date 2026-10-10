import { plan, pt, rabat, reflet } from '../pliage/geo';
import type { Figure, Fleche, Ligne, Plan, Pt } from '../pliage/types';
import type { Etape, Modele } from './types';

/*
 * La tête de chien (inu), le tout premier pliage des petites mains.
 * Un triangle, deux oreilles qui tombent, un museau, et on dessine la frimousse.
 */

const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };
const feutre = (a: Pt, b: Pt, epaisseur = 2.4): Ligne => ({ a, b, type: 'feutre', epaisseur });

// La feuille posée en losange (demi-diagonale D).
const D = 110;
const T = pt(0, -D);
const R = pt(D, 0);
const B = pt(0, D);
const L = pt(-D, 0);
const O = pt(0, 0);
const CADRE_FEUILLE = [-140, -140, 280, 280] as const;
const CADRE_TETE = [-130, -50, 260, 190] as const;

/** Un point du bord gauche du triangle (de L vers B), à la hauteur y. */
const surBordG = (y: number): Pt => pt(-D + y, y);

// Oreilles : le pli part du bord du haut et descend en biais sur le côté.
const oreilleHautG = pt(-0.32 * D, 0);
const oreilleBasG = surBordG(0.32 * D);
const pointeOreilleG = reflet(L, oreilleHautG, oreilleBasG);
const miroir = (p: Pt): Pt => pt(-p[0], p[1]);
const oreilleHautD = miroir(oreilleHautG);
const oreilleBasD = miroir(oreilleBasG);
const pointeOreilleD = miroir(pointeOreilleG);

// Museau : la pointe du bas remonte, couche de devant.
const yMuseau = 0.7 * D;
const museauG = pt(-(D - yMuseau), yMuseau);
const museauD = pt(D - yMuseau, yMuseau);
const pointeMuseau = reflet(B, museauG, museauD);

const etape1: Etape = {
  titre: 'Plier en triangle',
  consigne:
    'Posez la feuille en losange, face blanche vers vous. Rabattez la pointe du haut sur celle du bas, puis appuyez bien sur le pli.',
  astuce: 'Pour un pli bien net, faites glisser l’ongle du pouce le long du pli, du milieu vers les bords.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [plan('bas', [L, B, R], 'verso'), plan('haut', [L, R, T], 'verso')],
    lignes: [v(L, R)],
    fleches: [f(pt(16, -94), pt(16, 92), 'devant', -0.25)],
  },
  geste: {
    duree: 2400,
    pistes: [{ type: 'pli', ids: ['haut'], axe: [L, R], sens: 1 }],
  },
};

const triangle = (): Plan[] => [plan('tete', [L, R, B])];

const etape2: Etape = {
  titre: 'Marquer le milieu',
  consigne: 'Pliez le triangle en deux, d’un coin à l’autre, appuyez, puis dépliez. Le pli du milieu sert de repère.',
  figure: {
    cadre: CADRE_TETE,
    plans: triangle(),
    lignes: [v(O, B)],
    fleches: [f(pt(-88, 14), pt(88, 14), 'devant', -0.3)],
  },
};

const etape3: Etape = {
  titre: 'Les oreilles',
  consigne:
    'Rabattez les deux coins du haut vers le bas, en biais, pour qu’ils dépassent un peu sur les côtés : ce sont les oreilles qui tombent.',
  astuce: 'Pas besoin d’être précis : de grandes oreilles font un chien rigolo, de petites un chiot sage.',
  figure: {
    cadre: CADRE_TETE,
    plans: [
      plan('tete', [oreilleHautG, oreilleHautD, oreilleBasD, B, oreilleBasG]),
      rabat('oreille-g', [L, oreilleHautG, oreilleBasG]),
      rabat('oreille-d', [oreilleHautD, R, oreilleBasD]),
    ],
    lignes: [v(O, B, 'marque'), v(oreilleHautG, oreilleBasG), v(oreilleHautD, oreilleBasD)],
    fleches: [
      f(pt(-104, -6), pointeOreilleG, 'devant', 0.45),
      f(pt(104, -6), pointeOreilleD, 'devant', -0.45),
    ],
  },
  geste: {
    duree: 2600,
    pistes: [
      { type: 'pli', ids: ['oreille-g'], axe: [oreilleHautG, oreilleBasG], sens: 1, de: 0, a: 0.7 },
      { type: 'pli', ids: ['oreille-d'], axe: [oreilleHautD, oreilleBasD], sens: 1, de: 0.3, a: 1 },
    ],
  },
};

const oreilles = (): Plan[] => [
  rabat('oreille-g', [pointeOreilleG, oreilleBasG, oreilleHautG]),
  rabat('oreille-d', [oreilleHautD, oreilleBasD, pointeOreilleD]),
];

const etape4: Etape = {
  titre: 'Le museau',
  consigne:
    'Remontez un peu la pointe du bas, couche de devant seulement : le blanc du museau apparaît. Pliez la pointe de derrière vers l’arrière.',
  figure: {
    cadre: CADRE_TETE,
    plans: [
      plan('menton-arriere', [museauG, museauD, B], 'recto', 0.12),
      plan('tete', [oreilleHautG, oreilleHautD, oreilleBasD, museauD, museauG, oreilleBasG]),
      plan('museau', [museauG, museauD, B]),
      ...oreilles(),
    ],
    lignes: [v(O, B, 'marque'), v(museauG, museauD)],
    fleches: [f(pt(-10, B[1] - 4), pt(-10, pointeMuseau[1] + 6), 'devant', 0.5)],
  },
  geste: {
    duree: 2600,
    pistes: [
      { type: 'pli', ids: ['museau'], axe: [museauG, museauD], sens: 1, de: 0, a: 0.6 },
      { type: 'pli', ids: ['menton-arriere'], axe: [museauG, museauD], sens: -1, de: 0.45, a: 1 },
    ],
  },
};

// La frimousse, dessinée au feutre.
const frimousse: Ligne[] = [
  feutre(pt(-26, 22), pt(-26, 22), 9),
  feutre(pt(26, 22), pt(26, 22), 9),
  feutre(pt(-7, pointeMuseau[1] + 4), pt(7, pointeMuseau[1] + 4), 9),
  feutre(pt(0, pointeMuseau[1] + 6), pt(0, pointeMuseau[1] + 16)),
  feutre(pt(0, pointeMuseau[1] + 16), pt(-8, pointeMuseau[1] + 21)),
  feutre(pt(0, pointeMuseau[1] + 16), pt(8, pointeMuseau[1] + 21)),
];

const chienFini = (): Plan[] => [
  plan('tete', [oreilleHautG, oreilleHautD, oreilleBasD, museauD, museauG, oreilleBasG]),
  plan('museau', [museauG, museauD, pointeMuseau], 'verso'),
  ...oreilles(),
];

const etape5: Etape = {
  titre: 'La frimousse',
  consigne:
    'Au feutre, dessinez deux yeux ronds, une truffe en haut du museau et une petite bouche. Votre chien est prêt à aboyer !',
  astuce: 'Chacun peut dessiner sa propre tête : un chien qui dort, qui rit, qui tire la langue…',
  figure: {
    cadre: CADRE_TETE,
    plans: chienFini(),
    lignes: frimousse,
  },
};

const illustration: Figure = {
  cadre: [-118, -14, 236, 140],
  plans: chienFini(),
  lignes: frimousse,
};

export const chien: Modele = {
  id: 'chien',
  nom: 'Le chien',
  sousTitre: 'Inu',
  kana: 'いぬ',
  niveau: 1,
  duree: '3 min',
  feuille: 'Feuille carrée de 15 × 15 cm, colorée d’un côté, et un feutre',
  resume:
    'Le tout premier pliage des petites mains, au Japon comme ici : quatre plis, puis on dessine la frimousse.',
  papier: { recto: '#d9a074', verso: '#fff7ec' },
  illustration,
  etapes: [etape1, etape2, etape3, etape4, etape5],
};
