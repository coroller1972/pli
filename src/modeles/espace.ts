import { pt } from '../pliage/geo';
import type { Pt } from '../pliage/types';

/*
 * Un peu de 3D pour les modèles en volume (le cube, l'étoile) : on place les morceaux de papier
 * dans l'espace, on les tourne, puis on les projette. Le moteur ne fait qu'interpoler entre les projections.
 */

export type P3 = readonly [number, number, number];

export const add3 = (a: P3, b: P3): P3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub3 = (a: P3, b: P3): P3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul3 = (a: P3, k: number): P3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot3 = (a: P3, b: P3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross3 = (a: P3, b: P3): P3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const norm3 = (a: P3): P3 => mul3(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
export const centre3 = (pts: readonly P3[]): P3 => mul3(pts.reduce(add3, [0, 0, 0] as P3), 1 / pts.length);

/** Lumière venant d'en haut à gauche, un peu de face. */
const LUMIERE = norm3([-0.45, -0.7, 0.55]);

export interface Vue {
  /** Place un point dans le repère de la vue (on regarde vers +y, z vers le haut). */
  tourner: (p: P3) => P3;
  /** Projette un point sur le dessin. */
  projeter: (p: P3) => Pt;
  /** Distance au regard : plus elle est grande, plus le point est loin. */
  profondeur: (p: P3) => number;
  /** Assombrissement d'une face, selon son orientation (normale sortante, repère de l'objet). */
  ombre: (normale: P3) => number;
}

/** Une vue en projection parallèle : on tourne l'objet autour de la verticale, puis on l'incline vers soi. */
export function vue(tourDeg: number, inclinaisonDeg: number): Vue {
  const a = (tourDeg * Math.PI) / 180;
  const b = (inclinaisonDeg * Math.PI) / 180;
  const tourner = ([x, y, z]: P3): P3 => {
    const x1 = x * Math.cos(a) - y * Math.sin(a);
    const y1 = x * Math.sin(a) + y * Math.cos(a);
    return [x1, y1 * Math.cos(b) - z * Math.sin(b), y1 * Math.sin(b) + z * Math.cos(b)];
  };
  return {
    tourner,
    projeter: (p) => {
      const q = tourner(p);
      return pt(q[0], -q[2]);
    },
    profondeur: (p) => tourner(p)[1],
    ombre: (n) => {
      const eclairage = Math.max(0, dot3(norm3(tourner(n)), LUMIERE));
      return 0.04 + 0.36 * (1 - eclairage);
    },
  };
}
