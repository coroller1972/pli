import { couper, plan, pt, rabat, reflet } from '../pliage/geo';
import type { Figure, Fleche, Ligne, Plan, Pt } from '../pliage/types';
import { cadreDe } from './outils';
import type { Etape, Modele } from './types';

/*
 * Le papillon traditionnel, d'après la séquence présentée par origami.me (diagrammes de Nick Robinson).
 * Un quadrillage de plis, deux rabattements « en moulin » (le haut puis le bas) qui donnent un hexagone
 * à quatre pointes, les ailes du bas rabattues, le haut passé derrière, puis un pli en zigzag pour le corps.
 *
 * Géométrie en carreaux : la feuille va de -2 à 2 dans les deux sens (vue de face, face blanche vers soi).
 */

const u = 30; // un carreau
const P = (x: number, y: number): Pt => pt(x * u, y * u);
const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };
const miroirPt = (p: Pt): Pt => pt(-p[0], p[1]);
const miroirPts = (pts: Pt[]): Pt[] => pts.map(miroirPt).reverse();
const refl = (pts: Pt[], a: Pt, b: Pt): Pt[] => pts.map((q) => reflet(q, a, b));

const CADRE_FEUILLE = [-90, -90, 180, 180] as const;

// ─── Les plis préparatoires ─────────────────────────────────────────────────────
const feuille = (face: 'recto' | 'verso') => [plan('feuille', [P(-2, -2), P(2, -2), P(2, 2), P(-2, 2)], face)];
const milieux = (type: Ligne['type']) => [v(P(-2, 0), P(2, 0), type), v(P(0, -2), P(0, 2), type)];
const diagonales = (type: Ligne['type']) => [v(P(-2, -2), P(2, 2), type), v(P(2, -2), P(-2, 2), type)];
const losange = (type: Ligne['type']) => [
  v(P(0, -2), P(2, 0), type),
  v(P(2, 0), P(0, 2), type),
  v(P(0, 2), P(-2, 0), type),
  v(P(-2, 0), P(0, -2), type),
];
const quarts = (type: Ligne['type']) => [
  v(P(-1, -2), P(-1, 2), type),
  v(P(1, -2), P(1, 2), type),
  v(P(-2, -1), P(2, -1), type),
  v(P(-2, 1), P(2, 1), type),
];

const etape1: Etape = {
  titre: 'Plier en deux, deux fois',
  consigne: 'Face blanche vers vous, pliez la feuille en deux de haut en bas, dépliez, puis de gauche à droite, dépliez.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: feuille('verso'),
    lignes: milieux('vallee'),
    fleches: [f(P(0.4, -1.8), P(0.4, 1.8), 'devant', -0.25)],
  },
};

const etape2: Etape = {
  titre: 'Retourner, les diagonales',
  consigne: 'Retournez la feuille, face colorée vers vous. Pliez-la en deux sur une diagonale, dépliez, puis sur l’autre.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: feuille('recto'),
    lignes: [...milieux('marque'), ...diagonales('vallee')],
    fleches: [f(P(-1.4, 1.4), P(1.4, -1.4), 'devant', 0.3)],
  },
};

const etape3: Etape = {
  titre: 'Les coins au centre, puis dépliez',
  consigne: 'Rabattez chacun des quatre coins au centre, marquez bien, et dépliez à chaque fois.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: feuille('recto'),
    lignes: [...milieux('marque'), ...diagonales('marque'), ...losange('vallee')],
    fleches: [f(P(-1.8, -1.8), P(-0.2, -0.2), 'devant', 0.3), f(P(1.8, 1.8), P(0.2, 0.2), 'devant', 0.3)],
  },
};

const etape4: Etape = {
  titre: 'Retourner, les bords au milieu',
  consigne:
    'Retournez à nouveau, face blanche vers vous. Rabattez chaque bord sur le pli du milieu, marquez, dépliez : la feuille est quadrillée.',
  astuce: 'Tous ces plis préparent le rabattement suivant : plus ils sont nets, plus le papillon se formera tout seul.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: feuille('verso'),
    lignes: [...milieux('marque'), ...diagonales('marque'), ...losange('marque'), ...quarts('vallee')],
    fleches: [f(P(-1.8, 0.4), P(-0.2, 0.4), 'devant', -0.4), f(P(0.4, -1.8), P(0.4, -0.2), 'devant', 0.4)],
  },
};

// ─── Les morceaux de la feuille, pour les rabattements ─────────────────────────
// À gauche (la droite s'en déduit par symétrie) :
//  - en haut, le coin A (qui suit la bande du haut), Bt (qui passe derrière) et C (qui reste) ;
//  - en bas, les mêmes A2, Bt2, C2, reflets des premiers.
const ORIGINE: Record<string, Pt[]> = {
  'base-h': [P(-1, -1), P(1, -1), P(1, 0), P(-1, 0)],
  'base-b': [P(-1, 0), P(1, 0), P(1, 1), P(-1, 1)],
  ts: [P(-1, -2), P(1, -2), P(1, -1), P(-1, -1)],
  'bs-g': [P(-1, 1), P(0, 1), P(0, 2), P(-1, 2)],
  'bs-d': [P(0, 1), P(1, 1), P(1, 2), P(0, 2)],
  'a-g': [P(-2, -2), P(-1, -2), P(-1, -1)],
  'bt-g': [P(-2, -2), P(-1, -1), P(-2, 0)],
  'c-g': [P(-2, 0), P(-1, -1), P(-1, 0)],
  'a2-g': [P(-2, 2), P(-1, 2), P(-1, 1)],
  'bt2-g': [P(-2, 2), P(-1, 1), P(-2, 0)],
  'c2-g': [P(-2, 0), P(-1, 1), P(-1, 0)],
};
for (const id of ['a-g', 'bt-g', 'c-g', 'a2-g', 'bt2-g', 'c2-g']) ORIGINE[id.replace('-g', '-d')] = miroirPts(ORIGINE[id]);

type Etat = Record<string, Pt[]>;
const cote = (id: string) => (id.endsWith('-d') ? -1 : 1);
const m = (id: string, p: Pt) => (cote(id) === 1 ? p : miroirPt(p));

// Rabattement du haut : la bande du haut descend, les côtés du bas viennent au milieu.
function rabattreHaut(e: Etat): Etat {
  const r: Etat = { ...e };
  for (const id of ['ts', 'a-g', 'a-d']) r[id] = refl(e[id], P(-2, -1), P(2, -1));
  for (const id of ['bt-g', 'bt-d']) r[id] = refl(e[id], m(id, P(-2, 0)), m(id, P(-1, -1)));
  for (const id of ['a2-g', 'bt2-g', 'c2-g', 'a2-d', 'bt2-d', 'c2-d']) r[id] = refl(e[id], m(id, P(-1, -2)), m(id, P(-1, 2)));
  return r;
}
// Rabattement du bas : la bande du bas remonte, les côtés du bas ressortent.
function rabattreBas(e: Etat): Etat {
  const r: Etat = { ...e };
  for (const id of ['bs-g', 'bs-d']) r[id] = refl(ORIGINE[id], P(-2, 1), P(2, 1));
  for (const id of ['a2-g', 'a2-d']) r[id] = refl(ORIGINE[id], P(-2, 1), P(2, 1));
  for (const id of ['bt2-g', 'bt2-d']) r[id] = refl(ORIGINE[id], m(id, P(-2, 0)), m(id, P(-1, 1)));
  for (const id of ['c2-g', 'c2-d']) r[id] = ORIGINE[id];
  return r;
}
// Les ailes du bas descendent, le long de la diagonale qui part du centre.
const AILES_BAS = ['a2', 'bt2', 'c2'];
function ailesBas(e: Etat): Etat {
  const r: Etat = { ...e };
  for (const s of ['-g', '-d']) for (const b of AILES_BAS) r[b + s] = refl(e[b + s], P(0, 0), m(s, P(-1, 1)));
  return r;
}
const HAUT = ['base-h', 'ts', 'a-g', 'a-d', 'bt-g', 'bt-d', 'c-g', 'c-d'];
function hautDerriere(e: Etat): Etat {
  const r: Etat = { ...e };
  for (const id of HAUT) r[id] = refl(e[id], P(-2, 0), P(2, 0));
  return r;
}

const E4 = ORIGINE;
const E5 = rabattreHaut(E4);
const E6 = rabattreBas(E5);
const E7 = ailesBas(E6);
const E8 = hautDerriere(E7);

/** Ordre de dessin, du fond vers l'avant. */
const ORDRE = [
  'bt-g', 'bt-d', 'base-h', 'base-b', 'bs-g', 'bs-d',
  'bt2-g', 'bt2-d', 'c2-g', 'c2-d', 'a2-g', 'a2-d',
  'c-g', 'c-d', 'ts', 'a-g', 'a-d',
];

/** La face visible : on compare l'orientation à celle de la feuille, face blanche vers soi. */
function plansDe(e: Etat, ordre = ORDRE, z: Record<string, number> = {}): Plan[] {
  return ordre.map((id) => {
    const aire = (pts: Pt[]) => pts.reduce((s, a, i) => s + a[0] * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * a[1], 0);
    const retourne = Math.sign(aire(e[id])) !== Math.sign(aire(ORIGINE[id]));
    const p = id.startsWith('base') ? plan(id, e[id], 'verso') : plan(id, e[id], retourne ? 'recto' : 'verso');
    return z[id] !== undefined ? { ...p, zRetourne: z[id] } : p;
  });
}

const CADRE_PLIAGE = [-80, -80, 160, 160] as const;

const etape5: Etape = {
  titre: 'Rabattre le haut',
  consigne:
    'Rabattez les bords de gauche et de droite sur le milieu, et en même temps le bord du haut vers le bas. Les coins du haut s’aplatissent en deux pointes sur les côtés.',
  astuce: 'Suivez les plis déjà marqués : le papier sait où aller. Aplatissez bien les deux pointes.',
  figure: {
    cadre: CADRE_PLIAGE,
    plans: plansDe(E4),
    lignes: [
      v(P(-1, -2), P(-1, 2)),
      v(P(1, -2), P(1, 2)),
      v(P(-1, -1), P(1, -1)),
      v(P(-2, -2), P(-1, -1)),
      v(P(2, -2), P(1, -1)),
      v(P(-2, 0), P(-1, -1), 'montagne'),
      v(P(2, 0), P(1, -1), 'montagne'),
    ],
    fleches: [f(P(0, -2.2), P(0, -0.4), 'devant', 0.3), f(P(-1.9, 1), P(-0.3, 1), 'devant', -0.3), f(P(1.9, 1), P(0.3, 1), 'devant', 0.3)],
  },
  geste: {
    duree: 3800,
    pistes: [
      { type: 'pli', ids: ['ts', 'a-g', 'a-d'], axe: [P(-2, -1), P(2, -1)], sens: 1, de: 0, a: 0.6 },
      { type: 'pli', ids: ['bt-g'], axe: [P(-2, 0), P(-1, -1)], sens: -1, de: 0, a: 0.6 },
      { type: 'pli', ids: ['bt-d'], axe: [P(1, -1), P(2, 0)], sens: -1, de: 0, a: 0.6 },
      { type: 'pli', ids: ['a2-g', 'bt2-g', 'c2-g'], axe: [P(-1, -2), P(-1, 2)], sens: 1, de: 0.35, a: 1 },
      { type: 'pli', ids: ['a2-d', 'bt2-d', 'c2-d'], axe: [P(1, 2), P(1, -2)], sens: 1, de: 0.35, a: 1 },
    ],
  },
};

const etape6: Etape = {
  titre: 'Rabattre le bas',
  consigne:
    'Remontez le bord du bas le long du pli, en ressortant les coins du bas vers l’extérieur. Aplatissez : vous obtenez un hexagone à quatre pointes.',
  figure: {
    cadre: CADRE_PLIAGE,
    plans: plansDe(E5),
    lignes: [v(P(-1, 1), P(1, 1))],
    fleches: [f(P(-0.3, 1.9), P(-1.6, 0.4), 'tirer'), f(P(0.3, 1.9), P(1.6, 0.4), 'tirer')],
  },
  geste: {
    duree: 3600,
    pistes: [
      { type: 'pli', ids: ['bs-g', 'bs-d'], axe: [P(-2, 1), P(2, 1)], sens: 1, de: 0, a: 0.6 },
      {
        type: 'morph',
        de: 0.2,
        a: 1,
        vers: Object.fromEntries(['a2-g', 'a2-d', 'bt2-g', 'bt2-d', 'c2-g', 'c2-d'].map((id) => [id, E6[id]])),
      },
    ],
  },
};

const etape7: Etape = {
  titre: 'Les ailes du bas',
  consigne: 'Rabattez les deux pointes du bas vers le bas, le long des plis en biais qui partent du centre.',
  figure: {
    cadre: CADRE_PLIAGE,
    plans: plansDe(E6),
    lignes: [v(P(0, 0), P(-1, 1)), v(P(0, 0), P(1, 1))],
    fleches: [f(P(-1.8, 0.3), P(-0.4, 1.8), 'devant', 0.4), f(P(1.8, 0.3), P(0.4, 1.8), 'devant', -0.4)],
  },
  geste: {
    duree: 3000,
    pistes: [
      { type: 'pli', ids: ['a2-g', 'bt2-g', 'c2-g'], axe: [P(0, 0), P(-1, 1)], sens: 1, de: 0, a: 0.65 },
      { type: 'pli', ids: ['a2-d', 'bt2-d', 'c2-d'], axe: [P(1, 1), P(0, 0)], sens: 1, de: 0.35, a: 1 },
    ],
  },
};

// Le haut passe derrière : une fois retourné, il se range sous tout le reste.
const zDerriere = Object.fromEntries(HAUT.map((id, i) => [id, -20 + i]));

const etape8: Etape = {
  titre: 'Le haut derrière',
  consigne: 'Pliez toute la partie du haut vers l’arrière, le long de la ligne du milieu.',
  figure: {
    cadre: CADRE_PLIAGE,
    plans: plansDe(E7, ORDRE, zDerriere),
    lignes: [v(P(-2.1, 0), P(2.1, 0), 'montagne')],
    fleches: [f(P(0.3, -0.9), P(0.3, 0.6), 'derriere', -0.6)],
  },
  geste: {
    duree: 2600,
    pistes: [{ type: 'pli', ids: HAUT, axe: [P(-2, 0), P(2, 0)], sens: -1 }],
  },
};

// ─── À partir d'ici, on découpe les morceaux le long des plis ───────────────────
const add = (a: Pt, b: Pt): Pt => pt(a[0] + b[0], a[1] + b[1]);
/** Vrai si le point de référence est du côté que `couper(…, a, b)` garde. */
const refGardee = (a: Pt, b: Pt, ref: Pt) => couper([ref, add(ref, pt(0.01, 0)), add(ref, pt(0, 0.01))], a, b).length > 0;
/** La partie d'un polygone du même côté de la droite (a, b) que le point de référence. */
const coteDe = (pts: Pt[], a: Pt, b: Pt, ref: Pt): Pt[] => (refGardee(a, b, ref) ? couper(pts, a, b) : couper(pts, b, a));
const autreCote = (pts: Pt[], a: Pt, b: Pt, ref: Pt): Pt[] => (refGardee(a, b, ref) ? couper(pts, b, a) : couper(pts, a, b));

type Morceau = { id: string; pts: Pt[]; face: 'recto' | 'verso' };
const versMorceaux = (plans: Plan[]): Morceau[] => plans.map((p) => ({ id: p.id, pts: p.pts, face: p.face }));
const versPlans = (ms: Morceau[]): Plan[] => ms.filter((x) => x.pts.length >= 3).map((x) => (x.id.startsWith('base') ? plan(x.id, x.pts, x.face) : rabat(x.id, x.pts, 'recto')));

/** Découpe chaque morceau le long d'une droite : [du côté de ref, de l'autre côté]. */
function decouper(ms: Morceau[], a: Pt, b: Pt, ref: Pt, suffixe: [string, string]): [Morceau[], Morceau[]] {
  const ici: Morceau[] = [];
  const la: Morceau[] = [];
  for (const x of ms) {
    const p1 = coteDe(x.pts, a, b, ref);
    const p2 = autreCote(x.pts, a, b, ref);
    if (p1.length >= 3) ici.push({ ...x, id: x.id + suffixe[0], pts: p1 });
    if (p2.length >= 3) la.push({ ...x, id: x.id + suffixe[1], pts: p2 });
  }
  return [ici, la];
}

// Affiner les ailes du bas : le bord extérieur se replie vers l'intérieur,
// le long d'un pli qui va du coin du haut au milieu du bord du bas.
const pliAffineG: [Pt, Pt] = [P(-1, 0), P(-0.5, 1.5)];
const pliAffineD: [Pt, Pt] = [P(0.5, 1.5), P(1, 0)];
const DEVANT_BAS = ['bs-g', 'bs-d', 'a2-g', 'a2-d', 'bt2-g', 'bt2-d', 'c2-g', 'c2-d'];
const E8plans = plansDe(E8, ORDRE, zDerriere);
const derriere = versMorceaux(E8plans.filter((p) => !DEVANT_BAS.includes(p.id)));
const devantBas = versMorceaux(E8plans.filter((p) => DEVANT_BAS.includes(p.id)));
const [devantG, devantD] = decouper(devantBas, P(0, -3), P(0, 3), P(-1, 1), ['', '']);
const [rabatG, resteG] = decouper(devantG, ...pliAffineG, P(-1.2, 1.2), ['-pli', '']);
const [rabatD, resteD] = decouper(devantD, ...pliAffineD, P(1.2, 1.2), ['-pli', '']);
const rabatGPlie = rabatG.map((x) => ({ ...x, pts: refl(x.pts, ...pliAffineG) }));
const rabatDPlie = rabatD.map((x) => ({ ...x, pts: refl(x.pts, ...pliAffineD) }));
// Le haut, passé derrière, est rangé en premier.
const derriereOrdonne = [...derriere].sort((a, b) => HAUT.indexOf(a.id) - HAUT.indexOf(b.id));

const etape9: Etape = {
  titre: 'Affiner les ailes du bas',
  consigne:
    'Sur chaque aile du bas, repliez le bord extérieur vers l’intérieur, le long d’un pli qui va du coin du haut au milieu du bord du bas.',
  astuce: 'Pincez d’abord le milieu du bord du bas pour le repérer : les deux ailes seront bien symétriques.',
  figure: {
    cadre: CADRE_PLIAGE,
    plans: versPlans([...derriereOrdonne, ...resteG, ...resteD, ...rabatG, ...rabatD]),
    lignes: [v(...pliAffineG), v(...pliAffineD)],
    fleches: [f(P(-1.2, 1.3), P(-0.55, 1.05), 'devant', -0.5), f(P(1.2, 1.3), P(0.55, 1.05), 'devant', 0.5)],
  },
  geste: {
    duree: 2800,
    pistes: [
      { type: 'pli', ids: rabatG.map((x) => x.id), axe: pliAffineG, sens: 1, de: 0, a: 0.65 },
      { type: 'pli', ids: rabatD.map((x) => x.id), axe: pliAffineD, sens: 1, de: 0.35, a: 1 },
    ],
  },
};

// État après l'étape 9 : tout le papillon à plat, vu de face.
const E9: Morceau[] = [...derriereOrdonne, ...resteG, ...resteD, ...rabatGPlie, ...rabatDPlie];

// Plier en deux : la moitié gauche vient sur la droite.
const [moitieG, moitieD] = decouper(E9, P(0, -3), P(0, 3), P(-1, 0), ['-mg', '-md']);
const axeMilieu: [Pt, Pt] = [P(0, 3), P(0, -3)];
const moitieGPliee = moitieG.map((x) => ({ ...x, pts: refl(x.pts, ...axeMilieu) }));

const CADRE_PAPILLON = [-80, -58, 160, 135] as const;

const etape10: Etape = {
  titre: 'Plier en deux',
  consigne: 'Pliez tout le papillon en deux, la moitié gauche sur la moitié droite.',
  figure: {
    cadre: CADRE_PAPILLON,
    plans: versPlans([...moitieD, ...moitieG]),
    lignes: [v(P(0, -0.2), P(0, 2.1))],
    fleches: [f(P(-1.8, 0.2), P(1.6, 0.2), 'devant', -0.25)],
  },
  geste: {
    duree: 2600,
    pistes: [{ type: 'pli', ids: moitieG.map((x) => x.id), axe: axeMilieu, sens: 1 }],
  },
};

// Le corps : l'aile du dessus repart vers la gauche le long d'un pli légèrement en biais,
// en laissant une étroite bande au milieu. Le biais relève un peu les ailes.
// Le pli part du bord du haut, un peu à droite du pli du milieu, et le croise vers le tiers de la hauteur :
// en dessous, toute l'aile du bas repart avec l'aile du haut, et s'écarte.
const pliCorps: [Pt, Pt] = [P(0.18, 0), P(-0.24, 2.1)];
const [bandeG, aileG] = decouper(moitieGPliee, ...pliCorps, P(0.02, 0.15), ['-bande', '-aile']);
const aileGOuverte = aileG.map((x) => ({ ...x, pts: refl(x.pts, ...pliCorps) }));

const etape11: Etape = {
  titre: 'Le corps',
  consigne:
    'Rabattez l’aile du dessus vers la gauche, le long d’un pli en biais qui part du haut, juste à côté du bord plié, et le croise vers le tiers de la hauteur. Une étroite bande reste au milieu (le corps) et les ailes s’écartent.',
  astuce: 'Pas de repère précis : plus le pli est en biais, plus les ailes se relèvent.',
  figure: {
    cadre: CADRE_PAPILLON,
    plans: versPlans([...moitieD, ...bandeG, ...aileG]),
    lignes: [v(...pliCorps)],
    fleches: [f(P(1.6, 0.1), P(-1.6, 0.1), 'devant', 0.3)],
  },
  geste: {
    duree: 2800,
    pistes: [{ type: 'pli', ids: aileG.map((x) => x.id), axe: pliCorps, sens: 1 }],
  },
};

// De l'autre côté, le même pli : l'aile de droite devient le reflet exact de celle de gauche.
// Reflet le long du pli, puis symétrie du papillon : c'est une petite rotation, l'aile se relève.
const [bandeD, aileD] = decouper(moitieD, ...pliCorps, P(0.02, 0.15), ['-bande', '-aile']);
const relever = (q: Pt): Pt => miroirPt(reflet(q, ...pliCorps));
const aileDRelevee = aileD.map((x) => ({ ...x, pts: x.pts.map(relever) }));

const papillonPresque = (): Morceau[] => [...aileD, ...bandeD, ...aileGOuverte, ...bandeG];
const papillonFini = (): Morceau[] => [...aileDRelevee, ...bandeD, ...aileGOuverte, ...bandeG];

const etape12: Etape = {
  titre: 'Retourner, de l’autre côté',
  consigne:
    'Retournez le papillon et faites le même pli en biais de l’autre côté : l’autre aile se relève, et le corps prend du relief.',
  figure: {
    cadre: CADRE_PAPILLON,
    plans: versPlans(papillonPresque()),
    fleches: [f(P(1.9, -1.2), P(1.9, -1.2), 'retourner')],
  },
  geste: { duree: 2400, pistes: [{ type: 'morph', vers: Object.fromEntries(aileDRelevee.map((x) => [x.id, x.pts])) }] },
};

const etape13: Etape = {
  titre: 'Ouvrir les ailes',
  consigne:
    'Retournez-le encore une fois. Écartez doucement les ailes et pincez le corps pour lui donner du volume : le papillon est prêt à s’envoler.',
  astuce: 'Posé sur le bord d’une étagère ou piqué sur un cadeau, il fait toujours son effet.',
  figure: {
    cadre: cadreDe(versPlans(papillonFini()), 0.1),
    plans: versPlans(papillonFini()),
  },
};

const illustration: Figure = {
  cadre: cadreDe(versPlans(papillonFini()), 0.05),
  plans: versPlans(papillonFini()),
};

export const papillon: Modele = {
  id: 'papillon',
  nom: 'Le papillon',
  sousTitre: 'Chō',
  kana: 'ちょう',
  niveau: 2,
  duree: '10 min',
  feuille: 'Feuille carrée de 15 × 15 cm, colorée d’un côté',
  resume:
    'Le papillon traditionnel : un quadrillage de plis qui se rabat tout seul en moulin, puis un petit pli en zigzag pour le corps. D’après la séquence présentée par origami.me.',
  papier: { recto: '#c7a6d8', verso: '#ffffff' },
  illustration,
  etapes: [etape1, etape2, etape3, etape4, etape5, etape6, etape7, etape8, etape9, etape10, etape11, etape12, etape13],
};
