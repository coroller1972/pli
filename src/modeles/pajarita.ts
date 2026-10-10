import { plan, pt, rabat } from '../pliage/geo';
import type { Figure, Fleche, Ligne, Plan, Pt } from '../pliage/types';
import { cadreDe } from './outils';
import type { Etape, Modele } from './types';

/*
 * La pajarita, l'oiseau de papier traditionnel d'Espagne (la « cocotte en papier » des Français),
 * d'après la séquence présentée par origami.me (diagrammes de Nick Robinson).
 *
 * Toute la feuille vit sur un quadrillage de 4 × 4 carreaux (les plis de la double « base du blintz »).
 * Chaque état à plat est relevé sur ce quadrillage et recoupé avec les diagrammes. Les trois plis
 * pivotants (swivel folds) sont animés par un morphing vers leur position exacte ; la pose finale,
 * l'oiseau debout, est relevée sur le diagramme du modèle terminé.
 */

const g = 46; // un carreau
/** Un point du quadrillage (0 à 4 dans les deux sens), centré sur le milieu de la feuille. */
const G = (x: number, y: number): Pt => pt((x - 2) * g, (y - 2) * g);
const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };
const blanc = (id: string, pts: Pt[], ombre?: number): Plan => plan(id, pts, 'verso', ombre);
const couleur = (id: string, pts: Pt[], ombre?: number): Plan => plan(id, pts, 'recto', ombre);
/** Un rabat de deux couches, coloré des deux côtés. */
const double = (id: string, pts: Pt[]): Plan => rabat(id, pts, 'recto');
const z = (p: Plan, rang: number): Plan => ({ ...p, zRetourne: rang });
const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [G(x0, y0), G(x1, y0), G(x1, y1), G(x0, y1)];

const CADRE = [-3 * g, -3 * g, 6 * g, 6 * g] as const;
const quadrillage = (type: Ligne['type'] = 'marque'): Ligne[] => [
  ...[1, 2, 3].flatMap((k) => [v(G(k, 0), G(k, 4), type), v(G(0, k), G(4, k), type)]),
  v(G(0, 2), G(2, 0), type),
  v(G(2, 0), G(4, 2), type),
  v(G(4, 2), G(2, 4), type),
  v(G(2, 4), G(0, 2), type),
];

// ─── La base : coins au centre, de chaque côté, puis tout déplier ──────────────
const etape1: Etape = {
  titre: 'Marquer les diagonales',
  consigne: 'Face blanche vers vous, pliez la feuille en deux sur une diagonale, dépliez, puis sur l’autre.',
  figure: {
    cadre: CADRE,
    plans: [blanc('feuille', rect(0, 0, 4, 4))],
    lignes: [v(G(0, 0), G(4, 4)), v(G(4, 0), G(0, 4))],
    fleches: [f(G(0.4, 3.6), G(3.6, 0.4), 'devant', 0.3)],
  },
};

const coin = (id: string, c: Pt, a: Pt, b: Pt) => blanc(id, [a, c, b]);
const etape2: Etape = {
  titre: 'Les quatre coins au centre',
  consigne: 'Rabattez chacun des quatre coins au centre. Alignez bien les bords entre eux plutôt que de viser le centre au millimètre.',
  figure: {
    cadre: CADRE,
    plans: [
      blanc('carre', [G(2, 0), G(4, 2), G(2, 4), G(0, 2)]),
      coin('c-bg', G(0, 4), G(0, 2), G(2, 4)),
      coin('c-hg', G(0, 0), G(2, 0), G(0, 2)),
      coin('c-hd', G(4, 0), G(4, 2), G(2, 0)),
      coin('c-bd', G(4, 4), G(2, 4), G(4, 2)),
    ],
    lignes: [v(G(0, 2), G(2, 4)), v(G(0, 2), G(2, 0)), v(G(2, 0), G(4, 2)), v(G(4, 2), G(2, 4))],
    fleches: [f(G(0.35, 3.65), G(1.8, 2.2), 'devant', 0.3)],
  },
  geste: {
    duree: 3600,
    pistes: [
      { type: 'pli', ids: ['c-bg'], axe: [G(0, 2), G(2, 4)], sens: 1, de: 0, a: 0.4 },
      { type: 'pli', ids: ['c-hg'], axe: [G(2, 0), G(0, 2)], sens: 1, de: 0.2, a: 0.6 },
      { type: 'pli', ids: ['c-hd'], axe: [G(4, 2), G(2, 0)], sens: 1, de: 0.4, a: 0.8 },
      { type: 'pli', ids: ['c-bd'], axe: [G(2, 4), G(4, 2)], sens: 1, de: 0.6, a: 1 },
    ],
  },
};

const etape3: Etape = {
  titre: 'Retourner, marquer, tout déplier',
  consigne:
    'Retournez le pliage. Rabattez chaque coin au centre, marquez bien, dépliez. Puis dépliez tout : la feuille, face colorée vers vous, est quadrillée en 4 × 4.',
  astuce: 'Ces plis guident tous les gestes suivants : marquez-les nettement.',
  figure: {
    cadre: CADRE,
    plans: [couleur('carre', [G(2, 0), G(4, 2), G(2, 4), G(0, 2)])],
    lignes: [v(G(2, 0.9), G(2, 3.1)), v(G(0.9, 2), G(3.1, 2)), v(G(1, 1), G(3, 1)), v(G(3, 1), G(3, 3)), v(G(3, 3), G(1, 3)), v(G(1, 3), G(1, 1))],
    fleches: [f(G(3.2, -0.2), G(3.2, -0.2), 'retourner')],
  },
};

// ─── Les plis pivotants ────────────────────────────────────────────────────────
const etape4: Etape = {
  titre: 'Le bord droit au milieu',
  consigne: 'Feuille dépliée, face colorée vers vous. Rabattez le bord droit sur le pli vertical du milieu, le long du pli déjà marqué.',
  figure: {
    cadre: CADRE,
    plans: [couleur('base', rect(0, 0, 3, 4)), couleur('bande', rect(3, 0, 4, 4))],
    lignes: [...quadrillage(), v(G(3, -0.1), G(3, 4.1))],
    fleches: [f(G(3.8, 3.2), G(2.4, 3.2), 'devant', 0.3)],
  },
  geste: { duree: 2200, pistes: [{ type: 'pli', ids: ['bande'], axe: [G(3, 4), G(3, 0)], sens: 1 }] },
};

const etape5: Etape = {
  titre: 'Premier pli pivotant',
  consigne:
    'Soulevez un peu le bas du rabat blanc, puis remontez le bord du bas jusqu’au pli horizontal du milieu : le bas du rabat pivote et ressort en pointe vers la droite.',
  astuce: 'C’est le « swivel fold » : un pli qui fait tourner un autre rabat. Laissez le papier suivre les plis marqués.',
  figure: {
    cadre: CADRE,
    plans: [
      couleur('base', rect(0, 0, 3, 3)),
      couleur('bas', rect(0, 3, 3, 4)),
      blanc('rabat', rect(2, 0, 3, 3)),
      blanc('rabat-bas', rect(2, 3, 3, 4)),
    ],
    lignes: [v(G(-0.1, 3), G(2, 3)), v(G(2, 3), G(3, 3.5)), v(G(3, 3.5), G(2, 4), 'montagne')],
    fleches: [f(G(0.3, 3.9), G(0.3, 2.2), 'devant', 0.2), f(G(2.8, 3.6), G(3.8, 2.4), 'tirer')],
  },
  geste: {
    duree: 3200,
    pistes: [
      { type: 'pli', ids: ['bas'], axe: [G(0, 3), G(3, 3)], sens: 1 },
      { type: 'morph', vers: { 'rabat-bas': [G(3, 3), G(3, 2), G(4, 2), G(3, 3)] } },
    ],
  },
};

/** Après le premier pli pivotant. */
const apres5 = (): Plan[] => [
  couleur('base-coin', [G(0, 0), G(2, 0), G(0, 2)]),
  couleur('base', [G(2, 0), G(2, 2), G(0, 2)]),
  blanc('bas', rect(0, 2, 3, 3)),
  blanc('rabat', rect(2, 0, 3, 2)),
  blanc('pointe-d', [G(3, 2), G(4, 2), G(3, 3)]),
];

const etape6: Etape = {
  titre: 'Le coin derrière',
  consigne: 'Pliez le coin coloré du haut à gauche vers l’arrière, le long de la diagonale déjà marquée.',
  figure: {
    cadre: CADRE,
    plans: [z(apres5()[0], -10), ...apres5().slice(1)],
    lignes: [v(G(2.1, -0.1), G(-0.1, 2.1), 'montagne')],
    fleches: [f(G(0.5, 0.5), G(0.2, 1.4), 'derriere', 0.6)],
  },
  geste: { duree: 2200, pistes: [{ type: 'pli', ids: ['base-coin'], axe: [G(2, 0), G(0, 2)], sens: -1 }] },
};

const etape7: Etape = {
  titre: 'Deuxième pli pivotant',
  consigne:
    'Soulevez un peu le bas à gauche, puis rabattez le bord gauche sur le pli vertical du milieu : le bas de la bande pivote et ressort en pointe vers le bas.',
  figure: {
    cadre: CADRE,
    plans: [
      double('base-g', [G(1, 1), G(1, 2), G(0, 2)]),
      couleur('base', [G(2, 0), G(2, 2), G(1, 2), G(1, 1)]),
      blanc('bas-g', rect(0, 2, 1, 3)),
      blanc('bas', rect(1, 2, 3, 3)),
      blanc('rabat', rect(2, 0, 3, 2)),
      blanc('pointe-d', [G(3, 2), G(4, 2), G(3, 3)]),
    ],
    lignes: [v(G(1, 1), G(1, 2)), v(G(1, 3), G(2, 2)), v(G(0, 2), G(1, 3), 'montagne')],
    fleches: [f(G(0.2, 1.9), G(1.6, 1.9), 'devant', -0.3), f(G(0.5, 2.8), G(1.6, 3.8), 'tirer')],
  },
  geste: {
    duree: 3200,
    pistes: [
      { type: 'pli', ids: ['base-g'], axe: [G(1, 0), G(1, 4)], sens: 1 },
      { type: 'morph', vers: { 'bas-g': [G(1, 2), G(2, 3), G(2, 4), G(1, 3)] } },
    ],
  },
};

const etape8: Etape = {
  titre: 'Troisième pli pivotant',
  consigne:
    'Soulevez un peu le haut à droite, enfoncez le coin du haut à droite vers l’intérieur et faites-le pivoter vers la droite : le haut descend jusqu’au pli horizontal et une pointe ressort à droite.',
  figure: {
    cadre: CADRE,
    plans: [
      blanc('bas', rect(1, 2, 3, 3)),
      blanc('bas-g', [G(1, 2), G(2, 3), G(2, 4), G(1, 3)]),
      blanc('pointe-d', [G(3, 2), G(4, 2), G(3, 3)]),
      couleur('base', [G(2, 1), G(2, 2), G(1, 2), G(1, 1)]),
      double('base-haut', [G(2, 0), G(2, 1), G(1, 1)]),
      blanc('rabat', rect(2, 1, 3, 2)),
      blanc('rabat-haut', rect(2, 0, 3, 1)),
    ],
    lignes: [v(G(1, 1), G(3, 1)), v(G(2, 0), G(3, 1), 'montagne')],
    fleches: [f(G(2.8, 0.2), G(3.8, 1.6), 'tirer'), f(G(3.4, -0.3), G(2.9, 0.2), 'pousser')],
  },
  geste: {
    duree: 3200,
    pistes: [
      { type: 'pli', ids: ['base-haut'], axe: [G(1, 1), G(3, 1)], sens: 1 },
      { type: 'morph', vers: { 'rabat-haut': [G(3, 1), G(4, 2), G(3, 2), G(3, 1)] } },
    ],
  },
};

// ─── Retourner, puis plier en deux ─────────────────────────────────────────────
// Vu de l'autre côté : le moulin à trois pointes, le carré coloré en haut à droite.
// (Repère centré : le carré blanc du corps va de -1 à 1.)
const C = (x: number, y: number): Pt => pt(x * g, y * g);

const etape9: Etape = {
  titre: 'Retourner',
  consigne: 'Retournez le pliage : un carré coloré se trouve en haut à droite, et deux pointes dépassent, à gauche et en bas.',
  figure: {
    cadre: CADRE,
    plans: [
      blanc('bas', rect(1, 2, 3, 3)),
      blanc('bas-g', [G(1, 2), G(2, 3), G(2, 4), G(1, 3)]),
      blanc('pointe-d', [G(3, 1), G(4, 2), G(3, 3)]),
      blanc('rabat', rect(2, 1, 3, 2)),
      couleur('base', [G(2, 1), G(2, 2), G(1, 2), G(1, 1)]),
    ],
    lignes: [v(G(1, 1), G(2, 2), 'marque')],
    fleches: [f(G(3.4, 0.4), G(3.4, 0.4), 'retourner')],
  },
};

// Le pli final : en deux sur la diagonale ; le carré coloré se plie dans l'autre sens et se dresse.
const diag: [Pt, Pt] = [C(-1, 1), C(1, -1)];
const etape10: Etape = {
  titre: 'Plier en deux',
  consigne:
    'Soulevez un peu le carré coloré, puis repliez le coin en haut à gauche sur le coin en bas à droite, le long de la diagonale. Le carré coloré se plie en deux dans l’autre sens : c’est la tête.',
  figure: {
    cadre: CADRE,
    plans: [
      z(couleur('tete-moitie', [C(0, -1), C(1, -1), C(0, 0)]), -10),
      blanc('corps-bas', [C(-1, 1), C(1, -1), C(1, 1)]),
      blanc('pointe-b', [C(0, 1), C(1, 1), C(0, 2)]),
      // Ces couches sont blanches des deux côtés : une fois repliées, elles restent blanches.
      rabat('corps-haut', [C(-1, -1), C(1, -1), C(-1, 1)], 'verso'),
      rabat('pointe-g', [C(-1, -1), C(-2, 0), C(-1, 1)], 'verso'),
      // La tête reste dehors : on la soulève avant de plier.
      couleur('tete', [C(1, -1), C(1, 0), C(0, 0)]),
    ],
    lignes: [v(C(-1.1, 1.1), C(-0.05, 0.05)), v(C(0, 0), C(1, -1), 'montagne')],
    fleches: [f(C(-0.8, -0.8), C(0.7, 0.7), 'devant', 0.3)],
  },
  geste: {
    duree: 2800,
    pistes: [
      { type: 'pli', ids: ['corps-haut', 'pointe-g'], axe: diag, sens: 1, de: 0, a: 0.8 },
      { type: 'pli', ids: ['tete-moitie'], axe: diag, sens: -1, de: 0.2, a: 1 },
    ],
  },
};

// La pajarita debout, relevée sur le diagramme du modèle terminé (en carreaux, depuis l'avant du corps).
const D = (x: number, y: number): Pt => pt(x * g, y * g);
const pajaritaDebout = (): Plan[] => [
  blanc('queue', [D(-2.4, 1.85), D(0.1, 1.9), D(0.05, -0.6)]),
  blanc('corps', [D(0.05, -0.6), D(1.2, -1.75), D(2.2, 1.85), D(1.15, 0.75), D(0.1, 1.9)]),
  blanc('patte', [D(1.2, -1.75), D(1.45, -1.85), D(2.4, 1.6), D(2.2, 1.85)], 0.12),
  couleur('tete', [D(0, -3), D(2.45, -2.85), D(0.05, -0.6)]),
];
const lignesDebout: Ligne[] = [
  v(D(0.05, -0.6), D(0.1, 1.9), 'marque'),
  v(D(0.05, -0.6), D(1.95, -0.55), 'marque'),
  v(D(-1.2, 0.65), D(0.1, 1.9), 'marque'),
  v(D(0, -3), D(1.2, -1.75), 'marque'),
];

const etape11: Etape = {
  titre: 'La pajarita est prête',
  consigne:
    'Dressez la tête et ouvrez un peu le corps pour que l’oiseau tienne debout sur la queue et la patte. Voilà la pajarita, l’oiseau de papier que plient les enfants espagnols depuis plus de deux siècles !',
  astuce: 'Pliée dans une petite feuille, elle est encore plus mignonne.',
  figure: { cadre: cadreDe(pajaritaDebout(), 0.12), plans: pajaritaDebout(), lignes: lignesDebout },
};

const illustration: Figure = {
  cadre: cadreDe(pajaritaDebout(), 0.05),
  plans: pajaritaDebout(),
  lignes: lignesDebout,
};

export const pajarita: Modele = {
  id: 'pajarita',
  nom: 'La pajarita',
  sousTitre: 'L’oiseau de papier d’Espagne',
  kana: 'ことり',
  niveau: 1,
  duree: '5 min',
  feuille: 'Feuille carrée de 15 × 15 cm, colorée d’un côté (plus petite, elle est encore plus mignonne)',
  resume:
    'Le petit oiseau de papier que plient les enfants espagnols depuis plus de deux siècles. On y découvre les plis pivotants. D’après la séquence présentée par origami.me.',
  papier: { recto: '#f0c66e', verso: '#ffffff' },
  illustration,
  etapes: [etape1, etape2, etape3, etape4, etape5, etape6, etape7, etape8, etape9, etape10, etape11],
};

