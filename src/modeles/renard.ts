import { add, lerpPt, mul, norm, plan, pt, rabat, reflet, sub, tourne } from '../pliage/geo';
import type { Figure, Fleche, Ligne, Plan, Pt } from '../pliage/types';
import { cadreDe } from './outils';
import type { Etape, Modele } from './types';

/*
 * Le renard (kitsune), version simplifiée d'un modèle de Mitsuo Okuda, d'après la séquence présentée par origami.me.
 * Triangle, coins sur la pointe, plié en deux et tourné : une oreille se rabat, la tête s'écrase entre les deux
 * oreilles, et la queue se replie pour que le renard tienne assis.
 */

const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };
const feutre = (a: Pt, b: Pt, epaisseur = 2): Ligne => ({ a, b, type: 'feutre', epaisseur });

// La feuille en losange (demi-diagonale D) ; une fois pliée et tournée, le triangle a des côtés de longueur s.
const s = 100;
const D = s * Math.SQRT2;
const T = pt(0, -D);
const R = pt(D, 0);
const B = pt(0, D);
const L = pt(-D, 0);
const O = pt(0, 0);
const Mg = pt(-D / 2, -D / 2);
const Md = pt(D / 2, -D / 2);

const CADRE_FEUILLE = [-185, -185, 370, 370] as const;
const CADRE_TRIANGLE = [-175, -170, 350, 210] as const;
const CADRE_LOSANGE = [-110, -170, 220, 210] as const;

const etape1: Etape = {
  titre: 'Marquer le milieu',
  consigne: 'Feuille en losange, face blanche vers vous. Pliez-la en deux de gauche à droite, marquez, dépliez.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [plan('feuille', [T, R, B, L], 'verso')],
    lignes: [v(T, B)],
    fleches: [f(pt(-118, -16), pt(118, -16), 'devant', -0.3)],
  },
};

const etape2: Etape = {
  titre: 'Plier en triangle',
  consigne: 'Remontez la pointe du bas sur celle du haut : un triangle, pointe en haut.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [plan('haut', [L, R, T], 'verso'), plan('bas', [L, B, R], 'verso')],
    lignes: [v(L, R), v(T, O, 'marque')],
    fleches: [f(pt(-16, 120), pt(-16, -118), 'devant', 0.25)],
  },
  geste: { duree: 2200, pistes: [{ type: 'pli', ids: ['bas'], axe: [L, R], sens: 1 }] },
};

const etape3: Etape = {
  titre: 'Les coins sur la pointe',
  consigne: 'Remontez les coins de gauche et de droite jusqu’à la pointe du haut. Vous obtenez un carré posé sur la pointe.',
  figure: {
    cadre: CADRE_TRIANGLE,
    plans: [plan('fond', [T, Md, O, Mg]), rabat('coin-g', [L, O, Mg]), rabat('coin-d', [O, R, Md])],
    lignes: [v(O, Mg), v(O, Md), v(T, O, 'marque')],
    fleches: [f(pt(-124, -6), pt(-10, -126), 'devant', -0.35), f(pt(124, -6), pt(10, -126), 'devant', 0.35)],
  },
  geste: {
    duree: 2800,
    pistes: [
      { type: 'pli', ids: ['coin-g'], axe: [Mg, O], sens: 1, de: 0, a: 0.65 },
      { type: 'pli', ids: ['coin-d'], axe: [O, Md], sens: 1, de: 0.35, a: 1 },
    ],
  },
};

const etape4: Etape = {
  titre: 'Retourner',
  consigne: 'Retournez le pliage.',
  figure: {
    cadre: CADRE_LOSANGE,
    plans: [plan('fond', [T, Md, O, Mg]), rabat('coin-g', [T, O, Mg]), rabat('coin-d', [T, Md, O])],
    fleches: [f(pt(78, -150), pt(78, -150), 'retourner')],
  },
};

const etape5: Etape = {
  titre: 'Plier en deux',
  consigne: 'Pliez le carré en deux, de gauche à droite, le long du pli du milieu.',
  figure: {
    cadre: CADRE_LOSANGE,
    plans: [rabat('droite', [T, Md, O]), rabat('gauche', [T, O, Mg])],
    lignes: [v(add(T, pt(0, -8)), add(O, pt(0, 8)))],
    fleches: [f(pt(-60, -60), pt(60, -60), 'devant', -0.3)],
  },
  geste: { duree: 2200, pistes: [{ type: 'pli', ids: ['gauche'], axe: [O, T], sens: 1 }] },
};

// ─── La vue tournée : un triangle rectangle, angle droit en bas à droite ───────
// Tourner de 45° autour du coin droit : le côté qui montait vers T devient vertical.
const tourner = (p: Pt): Pt => sub(tourne(p, Md, 45), Md);
const C = pt(0, 0); // l'angle droit
const A = tourner(T); // en haut
const Bg = tourner(O); // à gauche

const etape6: Etape = {
  titre: 'Tourner',
  consigne: 'Tournez le triangle d’un demi-quart de tour vers la droite : l’angle droit se retrouve en bas à droite.',
  figure: {
    cadre: cadreDe([rabat('t', [T, Md, O].map((p) => sub(p, Md))), rabat('t2', [A, C, Bg])], 0.12),
    plans: [rabat('triangle', [T, Md, O].map((p) => sub(p, Md)))],
    fleches: [f(pt(-60, -150), pt(-20, -170), 'devant', -0.4)],
  },
  geste: { duree: 2000, pistes: [{ type: 'rotation', ids: ['triangle'], pivot: C, angle: 45 }] },
};

// L'oreille : la couche du dessus se replie le long d'un pli qui part de l'angle droit et monte jusqu'à P.
const P = lerpPt(Bg, A, 0.78);
const Ap = reflet(A, C, P); // la pointe de l'oreille
// La tête : le haut du rabat du milieu, soulevé puis écrasé en losange entre les deux oreilles.
const Hd = pt(0, -0.72 * s); // sur le bord droit
const axeTete = norm(pt(0.546, 0.838));
const Hb = add(P, mul(axeTete, 0.28 * s)); // le menton
const Hg = reflet(Hd, P, Hb);

const CADRE_RENARD = cadreDe([rabat('a', [Bg, C, A]), rabat('b', [P, C, Ap])], 0.1);

const etape7: Etape = {
  titre: 'La première oreille',
  consigne:
    'Couche du dessus : repliez le bord de droite vers la gauche, le long d’un pli qui part du coin en bas à droite. La pointe dépasse en haut : c’est une oreille. Placez-la où elle vous plaît.',
  figure: {
    cadre: CADRE_RENARD,
    plans: [rabat('dos', [Bg, C, A]), rabat('tete-d', [P, A, Hd]), rabat('tete-g', [P, A, Hd]), rabat('avant', [Bg, C, P]), rabat('oreille', [P, C, A])],
    lignes: [v(C, P)],
    fleches: [f(add(A, pt(-4, 12)), add(Ap, pt(10, 6)), 'devant', 0.4)],
  },
  geste: { duree: 2400, pistes: [{ type: 'pli', ids: ['oreille'], axe: [C, P], sens: 1 }] },
};

const avantTete = (): Plan[] => [rabat('dos', [Bg, C, A]), rabat('avant', [Bg, C, P]), rabat('oreille', [P, C, Ap])];

const etape8: Etape = {
  titre: 'La tête',
  consigne:
    'Soulevez le rabat du milieu à angle droit, ouvrez ses deux couches et écrasez-le à plat, sa pointe vers le bas : un petit losange se forme entre les deux oreilles. C’est la tête.',
  astuce: 'C’est le geste le plus délicat : glissez un doigt dans le rabat avant d’appuyer, il s’ouvrira tout seul.',
  figure: {
    cadre: CADRE_RENARD,
    plans: [...avantTete(), rabat('tete-d', [P, A, Hd]), rabat('tete-g', [P, A, Hd])],
    lignes: [v(P, Hd)],
    fleches: [f(add(A, pt(-6, 8)), add(Hb, pt(0, -6)), 'pousser')],
  },
  geste: {
    duree: 3200,
    pistes: [
      { type: 'pli', ids: ['tete-d', 'tete-g'], axe: [P, Hd], sens: 1, angle: 90, de: 0, a: 0.4 },
      { type: 'morph', de: 0.45, a: 1, vers: { 'tete-d': [P, Hb, Hd], 'tete-g': [P, Hb, Hg] } },
    ],
  },
};

const tete = (): Plan[] => [rabat('tete-d', [P, Hb, Hd]), rabat('tete-g', [P, Hb, Hg])];

// La queue : le coin de gauche se replie vers l'intérieur, le long d'une verticale.
const xQueue = -0.65 * s;
const surHypotenuse = (x: number): Pt => lerpPt(Bg, A, (x - Bg[0]) / (A[0] - Bg[0]));
const Q1 = pt(xQueue, 0);
const Q2 = surHypotenuse(xQueue);
const corpsSansQueue = (): Plan[] => [rabat('dos', [Q1, C, A, Q2]), rabat('avant', [Q1, C, P, Q2])];

const etape9: Etape = {
  titre: 'La queue',
  consigne:
    'Repliez le coin de gauche vers l’intérieur, le long d’un pli vertical : c’est la queue. Ajustez-la pour que les deux bords du bas soient alignés, et le renard tient assis.',
  figure: {
    cadre: CADRE_RENARD,
    plans: [...corpsSansQueue(), rabat('queue', [Bg, Q1, Q2]), rabat('oreille', [P, C, Ap]), ...tete()],
    lignes: [v(add(Q1, pt(0, 6)), Q2)],
    fleches: [f(add(Bg, pt(10, -4)), add(Q1, pt(20, -8)), 'devant', 0.6)],
  },
  geste: { duree: 2200, pistes: [{ type: 'pli', ids: ['queue'], axe: [Q1, Q2], sens: 1 }] },
};

const queuePliee = (): Plan => rabat('queue', [reflet(Bg, Q1, Q2), Q1, Q2]);
// La frimousse : deux yeux en arc et une truffe, sur le losange de la tête.
const centreTete = lerpPt(Hg, Hd, 0.5);
const versMenton = norm(sub(Hb, P));
const oeil = (c: Pt): Ligne[] => [feutre(add(c, pt(-3.5, 1.5)), add(c, pt(0, -1.5))), feutre(add(c, pt(0, -1.5)), add(c, pt(3.5, 1.5)))];
const frimousse: Ligne[] = [
  ...oeil(add(lerpPt(centreTete, Hg, 0.45), mul(versMenton, -1))),
  ...oeil(add(lerpPt(centreTete, Hd, 0.45), mul(versMenton, -1))),
  feutre(sub(Hb, mul(versMenton, 3)), sub(Hb, mul(versMenton, 3)), 6),
];
const renardFini = (): Plan[] => [...corpsSansQueue(), queuePliee(), rabat('oreille', [P, C, Ap]), ...tete()];

const etape10: Etape = {
  titre: 'La frimousse',
  consigne: 'Au feutre, dessinez deux yeux plissés et une petite truffe au bout du museau. Votre renard est prêt !',
  astuce: 'Pliez-en un grand et un petit : une maman renard et son renardeau.',
  figure: { cadre: CADRE_RENARD, plans: renardFini(), lignes: frimousse },
};

const illustration: Figure = {
  cadre: cadreDe(renardFini(), 0.06),
  plans: renardFini(),
  lignes: frimousse,
};

export const renard: Modele = {
  id: 'renard',
  nom: 'Le renard',
  sousTitre: 'Kitsune (d’après Mitsuo Okuda)',
  kana: 'きつね',
  niveau: 1,
  duree: '8 min',
  feuille: 'Feuille carrée de 15 × 15 cm, colorée d’un côté, et un feutre',
  resume:
    'Un renard assis, avec ses grandes oreilles et sa queue repliée. Un seul geste délicat, la tête écrasée entre les oreilles. D’après le modèle de Mitsuo Okuda présenté par origami.me.',
  papier: { recto: '#e9a46a', verso: '#fff7ec' },
  illustration,
  etapes: [etape1, etape2, etape3, etape4, etape5, etape6, etape7, etape8, etape9, etape10],
};

