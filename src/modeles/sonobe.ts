import { plan, pt, rabat } from '../pliage/geo';
import type { Fleche, Ligne, Plan, Pt } from '../pliage/types';
import type { Etape } from './types';

/*
 * Le module Sonobe, brique des pliages modulaires (le cube, l'étoile kusudama).
 * Un parallélogramme avec un carré au milieu, deux pattes et deux poches : les pattes
 * de chaque module se glissent dans les poches des voisins, sans colle.
 */

const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };

const u = 30; // un quart du côté de la feuille
const S = 2 * u;
const CADRE_FEUILLE = [-90, -90, 180, 180] as const;

const etapeMilieu: Etape = {
  titre: 'Module : marquer le milieu',
  consigne:
    'Face colorée dessous, pliez la feuille en deux de gauche à droite, marquez, dépliez. Chaque module se plie de la même façon.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [plan('feuille', [pt(-S, -S), pt(S, -S), pt(S, S), pt(-S, S)], 'verso')],
    lignes: [v(pt(0, -S), pt(0, S))],
    fleches: [f(pt(-46, -12), pt(46, -12), 'devant', -0.3)],
  },
};

const etapeBords: Etape = {
  titre: 'Module : les bords au milieu',
  consigne: 'Rabattez les bords de gauche et de droite sur le pli du milieu. Ils se touchent sans se chevaucher.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [
      plan('centre', [pt(-u, -S), pt(u, -S), pt(u, S), pt(-u, S)], 'verso'),
      plan('g', [pt(-S, -S), pt(-u, -S), pt(-u, S), pt(-S, S)], 'verso'),
      plan('d', [pt(u, -S), pt(S, -S), pt(S, S), pt(u, S)], 'verso'),
    ],
    lignes: [v(pt(0, -S), pt(0, S), 'marque'), v(pt(-u, -S), pt(-u, S)), v(pt(u, -S), pt(u, S))],
    fleches: [f(pt(-52, 10), pt(-6, 10), 'devant', -0.4), f(pt(52, 10), pt(6, 10), 'devant', 0.4)],
  },
  geste: {
    duree: 2600,
    pistes: [
      { type: 'pli', ids: ['g'], axe: [pt(-u, -S), pt(-u, S)], sens: 1, de: 0, a: 0.65 },
      { type: 'pli', ids: ['d'], axe: [pt(u, S), pt(u, -S)], sens: 1, de: 0.35, a: 1 },
    ],
  },
};

// Les deux coins en biais : le bord du haut vient sur le bord gauche, celui du bas sur le bord droit.
const hautG = pt(-u, -S);
const milieuD = pt(u, 0);
const basD = pt(u, S);
const milieuG = pt(-u, 0);
const triangleHaut: Pt[] = [hautG, pt(u, -S), milieuD];
const triangleBas: Pt[] = [basD, pt(-u, S), milieuG];
const parallelogramme: Pt[] = [hautG, milieuD, basD, milieuG];
const fente = v(pt(0, -u), pt(0, u), 'marque');

const etapeCoins: Etape = {
  titre: 'Module : les coins en biais',
  consigne:
    'Rabattez le coin en haut à droite pour que le bord du haut se pose sur le bord gauche. Même chose en bas : le coin en bas à gauche monte sur le bord droit.',
  astuce: 'Tous les modules doivent être pliés dans le même sens, sinon ils ne s’emboîteront pas.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [rabat('bande', parallelogramme), rabat('t-haut', triangleHaut), rabat('t-bas', triangleBas)],
    lignes: [v(pt(0, -S), pt(0, S), 'marque'), v(hautG, milieuD), v(basD, milieuG)],
    fleches: [f(pt(24, -54), pt(-24, -6), 'devant', 0.4), f(pt(-24, 54), pt(24, 6), 'devant', 0.4)],
  },
  geste: {
    duree: 2800,
    pistes: [
      { type: 'pli', ids: ['t-haut'], axe: [hautG, milieuD], sens: 1, de: 0, a: 0.65 },
      { type: 'pli', ids: ['t-bas'], axe: [basD, milieuG], sens: 1, de: 0.35, a: 1 },
    ],
  },
};

const etapeRentrer: Etape = {
  titre: 'Module : rentrer les triangles',
  consigne:
    'Dépliez les deux triangles. Repliez vers l’arrière la petite pointe qui dépasse de chacun, puis repliez-les le long du même pli en les glissant sous les rabats.',
  astuce: 'Les triangles rentrés ferment le module : il ne doit plus rien dépasser du parallélogramme.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [
      rabat('bande', parallelogramme),
      rabat('t-haut', [hautG, milieuG, milieuD]),
      rabat('t-bas', [basD, milieuD, milieuG]),
    ],
    lignes: [fente],
    fleches: [f(pt(-20, -40), pt(-4, -16), 'pousser'), f(pt(20, 40), pt(4, 16), 'pousser')],
  },
};

// Une fois retourné, le module est le reflet du parallélogramme.
const refl = (p: Pt): Pt => pt(-p[0], p[1]);
const pointeHaut = refl(hautG); // (u, -S)
const pointeBas = refl(basD); // (-u, S)
export const carreModule: Pt[] = [pt(0, -u), pt(u, 0), pt(0, u), pt(-u, 0)];
const patteHaut: Pt[] = [pointeHaut, pt(u, 0), pt(0, -u)];
const patteBas: Pt[] = [pointeBas, pt(-u, 0), pt(0, u)];

const etapeCarre: Etape = {
  titre: 'Module : former le carré',
  consigne:
    'Retournez le module. Rabattez la pointe du haut sur le coin opposé, puis celle du bas : un carré apparaît au milieu. Marquez bien.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [rabat('carre', carreModule), rabat('patte-h', patteHaut), rabat('patte-b', patteBas)],
    lignes: [v(pt(0, -u), pt(u, 0)), v(pt(0, u), pt(-u, 0)), fente],
    fleches: [f(pointeHaut, pt(-u + 6, -2), 'devant', -0.4), f(pointeBas, pt(u - 6, 2), 'devant', -0.4)],
  },
  geste: {
    duree: 2600,
    pistes: [
      { type: 'pli', ids: ['patte-h'], axe: [pt(0, -u), pt(u, 0)], sens: 1, de: 0, a: 0.65 },
      { type: 'pli', ids: ['patte-b'], axe: [pt(0, u), pt(-u, 0)], sens: 1, de: 0.35, a: 1 },
    ],
  },
};

/** Les cinq étapes d'un module, communes au cube et à l'étoile. */
export const etapesModule: Etape[] = [etapeMilieu, etapeBords, etapeCoins, etapeRentrer, etapeCarre];

/** Le module fini, déplié à plat : un carré et ses deux pattes. */
export const moduleFini = (): Plan[] => [rabat('carre', carreModule), rabat('patte-h', patteHaut), rabat('patte-b', patteBas)];

export const CADRE_MODULE = CADRE_FEUILLE;
/** Demi-diagonale du carré du module. */
export const coteModule = u;
