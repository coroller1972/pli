import type { Face, Plan, Pt } from './types';

export const pt = (x: number, y: number): Pt => [x, y];

export const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
export const dot = (a: Pt, b: Pt): number => a[0] * b[0] + a[1] * b[1];
export const len = (a: Pt): number => Math.hypot(a[0], a[1]);
export const norm = (a: Pt): Pt => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const milieu = (a: Pt, b: Pt): Pt => lerpPt(a, b, 0.5);
export const miroirX = (p: Pt): Pt => [-p[0], p[1]];

/** Symétrique de p par rapport à la droite (a, b) : c'est l'endroit où tombe p après un pli à plat. */
export function reflet(p: Pt, a: Pt, b: Pt): Pt {
  const u = norm(sub(b, a));
  const ap = sub(p, a);
  const proj = add(a, mul(u, dot(ap, u)));
  return sub(mul(proj, 2), p);
}

/** Rotation de p autour de c, angle en degrés (sens horaire à l'écran, y vers le bas). */
export function tourne(p: Pt, c: Pt, deg: number): Pt {
  const r = (deg * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const dx = p[0] - c[0];
  const dy = p[1] - c[1];
  return [c[0] + dx * cos - dy * sin, c[1] + dx * sin + dy * cos];
}

/** Intersection des droites (a1, a2) et (b1, b2). */
export function intersection(a1: Pt, a2: Pt, b1: Pt, b2: Pt): Pt {
  const d1 = sub(a2, a1);
  const d2 = sub(b2, b1);
  const den = d1[0] * d2[1] - d1[1] * d2[0];
  if (Math.abs(den) < 1e-9) return a1;
  const t = ((b1[0] - a1[0]) * d2[1] - (b1[1] - a1[1]) * d2[0]) / den;
  return add(a1, mul(d1, t));
}

/** Aire signée (le signe change quand le plan est retourné). */
export function aire(pts: readonly Pt[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}

export const plan = (id: string, pts: Pt[], face: Face = 'recto', ombre?: number): Plan =>
  ombre === undefined ? { id, pts, face } : { id, pts, face, ombre };

/** Un rabat de deux couches, qui montre la même face des deux côtés. */
export const rabat = (id: string, pts: Pt[], face: Face = 'recto', ombre?: number): Plan => ({
  ...plan(id, pts, face, ombre),
  dos: face,
});

/** Copie d'un plan avec d'autres sommets ou un autre identifiant. */
export const avec = (p: Plan, modif: Partial<Plan>): Plan => ({ ...p, ...modif });

/** Applique une transformation de points à des plans. */
export const transforme = (plans: Plan[], f: (p: Pt) => Pt): Plan[] =>
  plans.map((p) => ({ ...p, pts: p.pts.map(f) }));

export const autreFace = (f: Face): Face => (f === 'recto' ? 'verso' : 'recto');

/** Arrondi pour l'affichage SVG. */
export const r2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * La partie d'un polygone située à gauche de la droite orientée (a → b), à l'écran (y vers le bas).
 * Sert à découper une couche le long d'un pli, quand seule une partie bouge.
 */
export function couper(pts: readonly Pt[], a: Pt, b: Pt): Pt[] {
  const d = sub(b, a);
  const cote = (p: Pt) => d[0] * (p[1] - a[1]) - d[1] * (p[0] - a[0]);
  const res: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    const cp = cote(p);
    const cq = cote(q);
    if (cp <= 0) res.push(p);
    if ((cp < 0 && cq > 0) || (cp > 0 && cq < 0)) res.push(lerpPt(p, q, cp / (cp - cq)));
  }
  // Supprime les sommets confondus.
  return res.filter((p, i) => Math.hypot(p[0] - res[(i + 1) % res.length][0], p[1] - res[(i + 1) % res.length][1]) > 1e-6);
}
