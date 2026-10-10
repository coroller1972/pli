import type { Plan } from '../pliage/types';

/** Le cadre (viewBox) qui contient tous ces plans, avec une marge proportionnelle. */
export function cadreDe(plans: Plan[], marge = 0.14): readonly [number, number, number, number] {
  const pts = plans.flatMap((p) => p.pts);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const m = marge * Math.max(x1 - x0, y1 - y0);
  return [x0 - m, y0 - m, x1 - x0 + 2 * m, y1 - y0 + 2 * m];
}
