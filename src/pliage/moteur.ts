import { add, aire, autreFace, dot, lerp, lerpPt, mul, norm, sub, tourne } from './geo';
import type { Face, Figure, Geste, Piste, Pt } from './types';

/** Un plan tel qu'il doit être dessiné à un instant donné. */
export interface PlanRendu {
  id: string;
  pts: Pt[];
  face: Face;
  /** Assombrissement total (fixe + dû à l'inclinaison du papier). */
  ombre: number;
  /** Couleur imposée, à la place de celle du papier. */
  teinte?: string;
}

/** Distance du point de vue, pour une légère perspective pendant les plis. */
const RECUL = 900;

/**
 * Courbe du papier : départ lent, accélération, pose.
 * Équivalent à cubic-bezier(.65, 0, .35, 1), la courbe de la DA.
 */
export function courbePapier(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

const borne = (x: number, min = 0, max = 1) => Math.min(max, Math.max(min, x));

function avancement(piste: Piste, t: number): number {
  const de = piste.de ?? 0;
  const a = piste.a ?? 1;
  if (a <= de) return t >= a ? 1 : 0;
  return courbePapier(borne((t - de) / (a - de)));
}

function appliquer(
  piste: Piste,
  p: number,
  courants: Map<string, Pt[]>,
  ombres: Map<string, number>,
  centre: Pt,
): void {
  if (p <= 0) return;
  switch (piste.type) {
    case 'rotation': {
      for (const id of piste.ids) {
        const pts = courants.get(id);
        if (pts) courants.set(id, pts.map((q) => tourne(q, piste.pivot, piste.angle * p)));
      }
      return;
    }
    case 'morph': {
      for (const [id, cible] of Object.entries(piste.vers)) {
        const pts = courants.get(id);
        if (!pts) continue;
        if (pts.length !== cible.length) {
          throw new Error(`Morph « ${id} » : ${pts.length} sommets vers ${cible.length}`);
        }
        courants.set(
          id,
          pts.map((q, i) => lerpPt(q, cible[i], p)),
        );
        const o = piste.ombres?.[id];
        if (o !== undefined) ombres.set(id, lerp(ombres.get(id) ?? 0, o, p));
      }
      return;
    }
    case 'pli': {
      const [a, b] = piste.axe;
      const u = norm(sub(b, a));
      const n: Pt = [-u[1], u[0]];
      const theta = (((piste.angle ?? 180) * Math.PI) / 180) * p;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const sens = piste.sens ?? 1;
      for (const id of piste.ids) {
        const pts = courants.get(id);
        if (!pts) continue;
        courants.set(
          id,
          pts.map((q) => {
            const aq = sub(q, a);
            const le = dot(aq, u);
            const d = dot(aq, n);
            const plat = add(add(a, mul(u, le)), mul(n, d * cos));
            // Hauteur au-dessus de la feuille, puis petite perspective autour du centre.
            const z = Math.abs(d * sin) * sens;
            const f = RECUL / (RECUL - z);
            return add(centre, mul(sub(plat, centre), f));
          }),
        );
      }
      return;
    }
  }
}

function etatBrut(figure: Figure, geste: Geste | undefined, t: number) {
  const courants = new Map<string, Pt[]>(figure.plans.map((p) => [p.id, p.pts.slice()]));
  const ombres = new Map<string, number>(figure.plans.map((p) => [p.id, p.ombre ?? 0]));
  const [x, y, w, h] = figure.cadre;
  const centre: Pt = [x + w / 2, y + h / 2];
  if (geste) {
    for (const piste of geste.pistes) appliquer(piste, avancement(piste, t), courants, ombres, centre);
  }
  return { courants, ombres };
}

/**
 * Prépare un geste : calcule une fois les aires de départ et d'arrivée,
 * puis renvoie une fonction qui donne les plans à dessiner pour t ∈ [0, 1].
 *
 * La face visible se déduit de l'orientation du polygone : quand un plan se retourne,
 * son aire signée change de signe et on montre l'autre face du papier.
 * L'ombre dynamique vient de la perte d'aire apparente : un rabat à 90° est vu par la tranche.
 */
export function preparer(figure: Figure, geste?: Geste) {
  const aires0 = new Map(figure.plans.map((p) => [p.id, aire(p.pts)]));
  const fin = etatBrut(figure, geste, 1).courants;
  const aires1 = new Map(figure.plans.map((p) => [p.id, Math.abs(aire(fin.get(p.id) ?? p.pts))]));

  return (t: number): PlanRendu[] => {
    const { courants, ombres } = etatBrut(figure, geste, t);
    const rendus = figure.plans.map((plan, rang) => {
      const pts = courants.get(plan.id) ?? plan.pts;
      const a0 = aires0.get(plan.id) ?? 0;
      const a = aire(pts);
      const retourne = a0 !== 0 && Math.sign(a) !== Math.sign(a0) && Math.abs(a) > 1e-6;
      const attendu = lerp(Math.abs(a0), aires1.get(plan.id) ?? Math.abs(a0), t);
      const perte = attendu > 1e-6 ? borne(1 - Math.abs(a) / attendu) : 0;
      const rendu: PlanRendu = {
        id: plan.id,
        pts,
        face: retourne ? (plan.dos ?? autreFace(plan.face)) : plan.face,
        ombre: borne((ombres.get(plan.id) ?? 0) + perte * 0.5, 0, 0.7),
      };
      if (plan.teinte) rendu.teinte = plan.teinte;
      return { rendu, z: retourne && plan.zRetourne !== undefined ? plan.zRetourne : rang };
    });
    // Tri stable : seuls les plans qui ont un rang « retourné » changent de place.
    return rendus.sort((x, y) => x.z - y.z).map((r) => r.rendu);
  };
}

/** Plans d'une figure fixe, prêts à dessiner. */
export const plansFixes = (figure: Figure): PlanRendu[] => preparer(figure)(0);
