import { add, couper, lerpPt, mul, norm, plan, pt, rabat, reflet, sub, tourne } from '../pliage/geo';
import type { Face, Figure, Fleche, Ligne, Plan, Pt } from '../pliage/types';
import { cadreDe } from './outils';
import type { Etape, Modele } from './types';

/*
 * L'écureuil (risu), modèle de Sébastien Limet (Mister Paperfold), d'après la séquence présentée par origami.me.
 *
 * Vue de face : cerf-volant, côtés rentrés par un pli inversé vertical (un petit triangle coloré apparaît
 * dans le blanc), petites pattes (coin rentré puis relevé). Plié en deux et tourné d'un quart de tour,
 * on retrouve exactement le profil des diagrammes : tête blanche en triangle à gauche, queue à droite.
 *
 * Le modelage de la tête (étapes 12 à 20 des diagrammes, en gros plan) est regroupé en trois gestes ;
 * leurs formes d'arrivée sont relevées sur les diagrammes. Le reste est calculé pli par pli.
 */

const u = 72;
const P = (x: number, y: number): Pt => pt(x * u, y * u);
const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };
const miroir = (p: Pt): Pt => pt(-p[0], p[1]);
const miroirs = (pts: Pt[]): Pt[] => pts.map(miroir).reverse();
const blanc = (id: string, pts: Pt[], ombre?: number): Plan => plan(id, pts, 'verso', ombre);
const couleur = (id: string, pts: Pt[], ombre?: number): Plan => rabat(id, pts, 'recto', ombre);
const z = (p: Plan, rang: number): Plan => ({ ...p, zRetourne: rang });
/** Un petit bout de pli, centré sur la droite (a, b). */
const bout = (a: Pt, b: Pt, longueur: number, type: Ligne['type'] = 'vallee'): Ligne => {
  const c = lerpPt(a, b, 0.5);
  const d = mul(norm(sub(b, a)), longueur / 2);
  return { a: sub(c, d), b: add(c, d), type };
};

// ─── Repères de la vue de face (feuille en losange, demi-diagonale 1) ──────────
const r2 = Math.SQRT2;
const T = P(0, -1);
const R = P(1, 0);
const B = P(0, 1);
const L = P(-1, 0);
const Kd = P(2 - r2, r2 - 1); // les bords du haut sur le milieu : le pli part de T et arrive ici
const Kg = miroir(Kd);
const M = P(0, r2 - 1); // le coin R, rabattu, arrive sur la ligne du milieu
const a = (2 - r2) / 2; // la verticale des côtés rentrés, à mi-chemin du milieu et du coin
const P1 = P(a, -a); // en haut de la verticale, sur le bord du cerf-volant
const P2 = P(a, r2 - 1); // à hauteur du bas des rabats colorés
const Q = P(a, 1 - a); // en bas de la verticale, sur le bord du bas
const [P1g, P2g, Qg] = [P1, P2, Q].map(miroir);
// Petites pattes : un pli à 45° depuis M ; le coin rentre, puis remonte le long de l'horizontale de X.
const X = P(a, r2 - 1 - a);
const N = P(0, r2 - 1 - a);
const Mh = reflet(M, N, X); // la pointe de la patte, une fois relevée
const Xg = miroir(X);

const CADRE_FEUILLE = [-1.25 * u, -1.25 * u, 2.5 * u, 2.5 * u] as const;
const CADRE_ETROIT = [-0.75 * u, -1.15 * u, 1.5 * u, 2.3 * u] as const;
const verticale = (x: number): [Pt, Pt] => [pt(x, -2 * u), pt(x, 2 * u)];

const etape1: Etape = {
  titre: 'Marquer le milieu',
  consigne: 'Feuille en losange, face blanche vers vous. Pliez-la en deux de gauche à droite, marquez, dépliez.',
  astuce: 'Un papier de la même couleur des deux côtés évite que le blanc apparaisse.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [blanc('feuille', [T, R, B, L])],
    lignes: [v(T, B)],
    fleches: [f(P(-0.8, -0.1), P(0.8, -0.1), 'devant', -0.3)],
  },
};

const etape2: Etape = {
  titre: 'Les bords du haut au milieu',
  consigne: 'Rabattez les deux bords du haut sur la ligne du milieu, comme pour un cerf-volant.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [blanc('fond', [T, Kd, B, Kg]), blanc('pan-g', [T, Kg, L]), blanc('pan-d', [T, R, Kd])],
    lignes: [v(T, Kd), v(T, Kg), v(T, B, 'marque')],
    fleches: [f(P(0.75, -0.2), P(0.08, -0.2), 'devant', 0.4), f(P(-0.75, -0.2), P(-0.08, -0.2), 'devant', -0.4)],
  },
  geste: {
    duree: 2600,
    pistes: [
      { type: 'pli', ids: ['pan-g'], axe: [Kg, T], sens: 1, de: 0, a: 0.65 },
      { type: 'pli', ids: ['pan-d'], axe: [T, Kd], sens: 1, de: 0.35, a: 1 },
    ],
  },
};

const etape3: Etape = {
  titre: 'Rentrer le côté droit',
  consigne:
    'Rabattez le coin de droite sur la ligne du milieu, marquez, dépliez. Puis rentrez-le à l’intérieur par un pli inversé le long de ce pli vertical : un petit triangle coloré apparaît dans le blanc.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [
      z(couleur('pan-d-coin', [P1, Kd, P2]), -10),
      blanc('blanc', [Kg, P2, Q, B]),
      couleur('pan-g', [T, Kg, M]),
      couleur('pan-d', [T, M, P2, P1]),
      blanc('blanc-d', [P2, Kd, Q]),
    ],
    lignes: [v(P1, Q), v(T, B, 'marque')],
    fleches: [f(add(Kd, P(0.22, 0)), add(Kd, P(0.04, 0)), 'pousser')],
  },
  geste: {
    duree: 2800,
    pistes: [
      { type: 'pli', ids: ['pan-d-coin'], axe: verticale(P1[0]), sens: -1, de: 0, a: 0.8 },
      { type: 'pli', ids: ['blanc-d'], axe: verticale(P1[0]), sens: 1, de: 0.2, a: 1 },
    ],
  },
};

const etape4: Etape = {
  titre: 'Puis le côté gauche',
  consigne: 'Même chose à gauche : marquez le pli, puis rentrez le coin à l’intérieur par un pli inversé.',
  figure: {
    cadre: CADRE_ETROIT,
    plans: [
      z(couleur('pan-g-coin', [P1g, P2g, Kg]), -10),
      blanc('blanc', [P2g, P2, Q, B, Qg]),
      couleur('pan-g', [T, P1g, P2g, M]),
      couleur('pan-d', [T, M, P2, P1]),
      couleur('tri-d', [P2, M, Q]),
      blanc('blanc-g', [Kg, Qg, P2g]),
    ],
    lignes: [v(P1g, Qg)],
    fleches: [f(add(Kg, P(-0.22, 0)), add(Kg, P(-0.04, 0)), 'pousser')],
  },
  geste: {
    duree: 2800,
    pistes: [
      { type: 'pli', ids: ['pan-g-coin'], axe: verticale(P1g[0]), sens: -1, de: 0, a: 0.8 },
      { type: 'pli', ids: ['blanc-g'], axe: verticale(P1g[0]), sens: 1, de: 0.2, a: 1 },
    ],
  },
};

/** La face avant, une fois les deux côtés rentrés, sans les pattes. */
const faceRentree = (): Plan[] => [
  blanc('blanc', [P2g, P2, Q, B, Qg]),
  couleur('pan-g', [T, P1g, Xg, M]),
  couleur('pan-d', [T, M, X, P1]),
  couleur('coin-g', [M, Xg, P2g]),
  couleur('coin-d', [M, P2, X]),
  couleur('tri-g', [P2g, Qg, M]),
  couleur('tri-d', [P2, M, Q]),
];

const etape5: Etape = {
  titre: 'Les petites pattes',
  consigne:
    'Sur le rabat coloré de droite, remontez le bord du bas sur la ligne du milieu, marquez, dépliez ; rentrez ce coin par un pli inversé, puis relevez-le le long de l’horizontale : une petite pointe se dresse. Faites de même à gauche.',
  figure: {
    cadre: CADRE_ETROIT,
    plans: [z(couleur('patte-d', [N, X, M]), 100), z(couleur('patte-g', miroirs([N, X, M])), 101), ...faceRentree()],
    lignes: [v(M, X), v(M, Xg), v(N, X, 'marque'), v(N, Xg, 'marque')],
    fleches: [
      f(add(P2, P(-0.04, 0.02)), add(N, P(0.06, -0.14)), 'devant', 0.45),
      f(add(P2g, P(0.04, 0.02)), add(N, P(-0.06, -0.14)), 'devant', -0.45),
    ],
  },
  geste: {
    duree: 2800,
    pistes: [
      { type: 'pli', ids: ['patte-d'], axe: [N, X], sens: 1, de: 0, a: 0.65 },
      { type: 'pli', ids: ['patte-g'], axe: [Xg, N], sens: 1, de: 0.35, a: 1 },
    ],
  },
};

/** La face avant finie : les morceaux de gauche (qui restent devant) et ceux de droite (qui passeront derrière). */
const faceGauche = (): Plan[] => [
  blanc('blanc-g', [P2g, M, B, Qg]),
  couleur('pan-g', [T, P1g, Xg, M]),
  couleur('coin-g', [M, Xg, P2g]),
  couleur('tri-g', [P2g, Qg, M]),
  couleur('patte-g', miroirs([N, X, Mh])),
];
const faceDroite = (): Plan[] => [
  blanc('blanc-d', [M, P2, Q, B]),
  couleur('pan-d', [T, M, X, P1]),
  couleur('coin-d', [M, P2, X]),
  couleur('tri-d', [P2, M, Q]),
  couleur('patte-d', [N, X, Mh]),
];

const etape6: Etape = {
  titre: 'Plier en deux',
  consigne: 'Pliez le modèle en deux vers l’arrière, la moitié droite derrière la gauche.',
  figure: {
    cadre: CADRE_ETROIT,
    plans: [...faceDroite().map((p, i) => z(p, -20 + i)), ...faceGauche()],
    lignes: [v(P(0, -1.08), P(0, 1.08), 'montagne')],
    fleches: [f(P(0.25, -0.3), P(-0.15, -0.3), 'derriere', -0.4)],
  },
  geste: { duree: 2400, pistes: [{ type: 'pli', ids: faceDroite().map((p) => p.id), axe: [pt(0, 2 * u), pt(0, -2 * u)], sens: -1 }] },
};

// ─── Vue de profil ─────────────────────────────────────────────────────────────
// Un quart de tour vers la droite : la pointe colorée (T) part à droite, la pointe blanche (B) à gauche.
const quart = (p: Pt): Pt => tourne(p, pt(0, 0), 90);
const profil = (): Plan[] => faceGauche().map((p) => ({ ...p, pts: p.pts.map(quart) }));

const etape7: Etape = {
  titre: 'Tourner',
  consigne:
    'Tournez le pliage d’un quart de tour vers la droite. La longue pointe colorée, à droite, sera la queue ; le triangle blanc, à gauche, la tête.',
  figure: {
    cadre: cadreDe([...faceGauche(), ...profil()], 0.08),
    plans: faceGauche(),
    fleches: [f(P(0.2, -1.05), P(0.6, -0.8), 'devant', -0.4)],
  },
  geste: { duree: 2000, pistes: [{ type: 'rotation', ids: faceGauche().map((p) => p.id), pivot: pt(0, 0), angle: 90 }] },
};

// Repères du profil : le ventre (le pli) en bas, sur y = 0 ; le dos en haut, sur y = -a.
const F0 = quart(M); // l'avant du ventre, là où le blanc de la tête touche le corps
const avant = (dx: number, dy: number): Pt => add(F0, P(dx, dy));
const pointeQueue0 = quart(T); // la pointe de la queue, à droite
const W = [quart(B), quart(Qg), F0]; // la tête blanche
const Cl = [quart(P2g), quart(Qg), F0]; // le triangle coloré devant la tête (le côté rentré)
const corps0 = [quart(T), quart(P1g), quart(Xg), F0]; // le rabat coloré, le long du corps
const coinP = [F0, quart(Xg), quart(P2g)];
const patteP = miroirs([N, X, Mh]).map(quart);

const CADRE_PROFIL = cadreDe(
  [couleur('c', corps0), blanc('w', W), couleur('o', [avant(0, -0.45), avant(-0.25, 0.2), avant(0.6, 0.25)])],
  0.12,
);

const etape8: Etape = {
  titre: 'Préparer la tête',
  consigne:
    'Marquez les plis de la tête, en dépliant à chaque fois : le coin du haut, à gauche, rabattu vers le bas jusqu’au repère ; le bord du bas relevé contre le côté du triangle coloré ; le triangle blanc plié le long de son bord droit ; enfin sa pointe rabattue jusqu’au repère du dos.',
  astuce: 'Ces plis préparent le pli écrasé du cou : marquez-les nettement.',
  figure: {
    cadre: CADRE_PROFIL,
    plans: [couleur('corps', corps0), couleur('coin', coinP), couleur('patte', patteP), couleur('tete-col', Cl), blanc('tete-blanc', W)],
    lignes: [
      v(add(F0, P(0, 0.06)), add(F0, P(0, -a - 0.06))),
      v(F0, avant(-0.18, -0.24)),
      v(quart(Qg), F0, 'marque'),
      v(avant(-0.42, 0.04), avant(-0.22, -0.32)),
    ],
  },
};

// Le cou : un pli écrasé relève la tête (rotation autour de l'avant du ventre).
const ANGLE_COU = 35;
const releve = (pts: Pt[]) => pts.map((q) => tourne(q, F0, ANGLE_COU));
const corps1 = [quart(T), quart(P1g), avant(0.07, -a), F0]; // l'avant du dos recule un peu

const etape9: Etape = {
  titre: 'Le cou',
  consigne: 'Pincez un pli en zigzag le long des deux premiers plis marqués : la tête se relève vers l’avant.',
  astuce: 'Les plieurs le disent : c’est la partie la plus délicate. Allez-y doucement, pli par pli.',
  figure: {
    cadre: CADRE_PROFIL,
    plans: [couleur('corps', corps0), couleur('coin', coinP), couleur('patte', patteP), couleur('tete-col', Cl), blanc('tete-blanc', W)],
    lignes: [v(add(F0, P(0, 0.06)), add(F0, P(0, -a - 0.06)), 'montagne'), v(F0, avant(-0.18, -0.24))],
    fleches: [f(add(quart(B), P(0, -0.06)), add(releve([quart(B)])[0], P(0.04, 0.04)), 'devant', 0.4)],
  },
  geste: {
    duree: 2600,
    pistes: [
      { type: 'rotation', ids: ['tete-col', 'tete-blanc'], pivot: F0, angle: ANGLE_COU },
      { type: 'morph', vers: { corps: corps1 } },
    ],
  },
};

// La tête finie, relevée sur les diagrammes (en unités de feuille, depuis l'avant du ventre).
const teteCol: Pt[] = [F0, avant(0.07, -a), avant(0, -0.335), avant(-0.02, -0.14)];
const museau: Pt[] = [avant(-0.03, -0.3), avant(-0.183, -0.227), avant(-0.128, -0.145), avant(-0.02, -0.14)];
const museauRond: Pt[] = [avant(-0.03, -0.3), avant(-0.15, -0.235), avant(-0.12, -0.16), avant(-0.02, -0.14)];
const oreille: Pt[] = [avant(0, -0.31), avant(0.093, -0.304), avant(0.022, -0.41)];
const oreilleAr: Pt[] = [avant(-0.02, -0.31), avant(0.06, -0.3), avant(-0.022, -0.399)];
const rentrer = (pts: Pt[]) => pts.map((q) => reflet(q, oreille[0], oreille[1]));
// Les morceaux de la tête, avec autant de sommets au départ qu'à l'arrivée (on double un sommet au besoin).
const teteColLevee = releve([Cl[0], Cl[0], Cl[1], Cl[2]]);
const teteBlancheLevee = releve([W[1], W[0], W[0], W[2]]);

const etape10: Etape = {
  titre: 'La tête et les oreilles',
  consigne:
    'Rentrez le triangle blanc par un pli inversé le long de son bord droit, puis rentrez le rabat du haut le long du pli du repère : les deux oreilles se dressent, et il ne reste qu’un bout de blanc pour le museau.',
  figure: {
    cadre: CADRE_PROFIL,
    plans: [
      z(couleur('oreille-ar', rentrer(oreilleAr), 0.2), 100),
      z(couleur('oreille', rentrer(oreille)), 101),
      couleur('corps', corps1),
      couleur('coin', coinP),
      couleur('patte', patteP),
      couleur('tete-col', teteColLevee),
      blanc('tete-blanc', teteBlancheLevee),
    ],
    fleches: [f(add(teteBlancheLevee[1], P(-0.12, 0)), add(teteBlancheLevee[1], P(0.02, 0)), 'pousser')],
  },
  geste: {
    duree: 3000,
    pistes: [
      { type: 'morph', de: 0, a: 0.6, vers: { 'tete-col': teteCol, 'tete-blanc': museau } },
      { type: 'pli', ids: ['oreille', 'oreille-ar'], axe: [oreille[0], oreille[1]], sens: 1, de: 0.5, a: 1 },
    ],
  },
};

const tete = (bout: Pt[]): Plan[] => [
  couleur('oreille-ar', oreilleAr, 0.2),
  couleur('tete-col', teteCol),
  blanc('tete-blanc', bout),
  couleur('oreille', oreille),
];

const etape11: Etape = {
  titre: 'Le museau',
  consigne:
    'Repliez la pointe du museau pour que les bords du haut s’alignent, marquez, puis rentrez-la par un pli inversé : le museau s’arrondit.',
  figure: {
    cadre: CADRE_PROFIL,
    plans: [couleur('corps', corps1), couleur('coin', coinP), couleur('patte', patteP), ...tete(museau)],
    lignes: [v(avant(-0.17, -0.27), avant(-0.11, -0.13), 'montagne')],
    fleches: [f(add(museau[1], P(-0.12, 0)), add(museau[1], P(0.02, 0)), 'pousser')],
  },
  geste: { duree: 2000, pistes: [{ type: 'morph', vers: { 'tete-blanc': museauRond } }] },
};

// Les pattes : un rabat descend sous le ventre (relevé sur les diagrammes).
const jambeDepart: Pt[] = [avant(0.324, -0.249), avant(0.29, -0.02), avant(0.5, -0.02)];
const jambe: Pt[] = [avant(0.324, -0.249), avant(0.148, 0.159), avant(0.39, 0.037)];

const etape12: Etape = {
  titre: 'Les pattes',
  consigne:
    'Repliez le bord droit du rabat du dessus jusqu’au pli vertical voisin, pincez au niveau du ventre, dépliez. Repliez-le de nouveau en amenant ce pinçon sur le pli : la patte descend sous le ventre. Faites de même de l’autre côté.',
  figure: {
    cadre: CADRE_PROFIL,
    plans: [couleur('corps', corps1), couleur('coin', coinP), couleur('patte', patteP), couleur('jambe', jambeDepart), ...tete(museauRond)],
    fleches: [f(add(jambeDepart[2], P(0.05, -0.1)), add(jambe[1], P(0.04, 0.02)), 'devant', -0.5)],
  },
  geste: { duree: 2200, pistes: [{ type: 'morph', vers: { jambe } }] },
};

// ─── La queue ──────────────────────────────────────────────────────────────────
interface Morceau {
  id: string;
  pts: Pt[];
  face: Face;
}
const autour = (p: Pt): Pt[] => [p, add(p, pt(0.5, 0)), add(p, pt(0, 0.5))];
const cote = (pts: Pt[], a1: Pt, b1: Pt, ref: Pt): Pt[] => (couper(autour(ref), a1, b1).length > 0 ? couper(pts, a1, b1) : couper(pts, b1, a1));
function decouper(ms: Morceau[], axe: [Pt, Pt], ici: Pt, la: Pt, suffixe: string): [Morceau[], Morceau[]] {
  const g: Morceau[] = [];
  const d: Morceau[] = [];
  for (const m of ms) {
    const p1 = cote(m.pts, ...axe, ici);
    const p2 = cote(m.pts, ...axe, la);
    if (p1.length >= 3) g.push({ ...m, pts: p1 });
    if (p2.length >= 3) d.push({ ...m, id: m.id + suffixe, pts: p2 });
  }
  return [g, d];
}
const versPlans = (ms: Morceau[]): Plan[] => ms.map((m) => (m.face === 'verso' ? blanc(m.id, m.pts) : couleur(m.id, m.pts)));
/** Le pli qui amène `de` sur `vers` : leur médiatrice. */
const mediatrice = (de: Pt, vers: Pt): [Pt, Pt] => {
  const c = lerpPt(de, vers, 0.5);
  const d = sub(vers, de);
  return [add(c, pt(-d[1], d[0])), add(c, pt(d[1], -d[0]))];
};

// Tout l'arrière se relève le long d'un pli qui part de là où la patte rejoint la queue (environ 58°).
const J = avant(0.45, 0);
const angleQueue = (-58 * Math.PI) / 180;
const pliQueue: [Pt, Pt] = [J, add(J, P(Math.cos(angleQueue), Math.sin(angleQueue)))];
const corpsMorceaux: Morceau[] = [
  { id: 'corps', pts: corps1, face: 'recto' },
  { id: 'coin', pts: coinP, face: 'recto' },
  { id: 'patte', pts: patteP, face: 'recto' },
];
const [corpsAvant, queue] = decouper(corpsMorceaux, pliQueue, F0, pointeQueue0, '-queue');
const queueLevee = queue.map((m) => ({ ...m, pts: m.pts.map((q) => reflet(q, ...pliQueue)) }));
const pointeQueue = reflet(pointeQueue0, ...pliQueue);
const devant = (): Plan[] => [couleur('jambe', jambe), ...tete(museauRond)];

const etape13: Etape = {
  titre: 'Relever la queue',
  consigne:
    'Relevez toute la partie arrière vers le haut, le long d’un pli qui part de là où la patte rejoint la queue. Laissez un petit espace entre les oreilles et la queue.',
  figure: {
    cadre: cadreDe([...versPlans(corpsMorceaux), ...versPlans(queueLevee), ...devant()], 0.1),
    plans: [...versPlans(corpsAvant), ...versPlans(queue), ...devant()],
    lignes: [bout(J, add(J, P(0.5 * Math.cos(angleQueue), 0.5 * Math.sin(angleQueue))), 0.5 * u)],
    fleches: [f(add(pointeQueue0, P(-0.05, -0.05)), add(pointeQueue, P(0.06, 0.04)), 'devant', 0.4)],
  },
  geste: { duree: 2800, pistes: [{ type: 'pli', ids: queue.map((m) => m.id), axe: pliQueue, sens: 1 }] },
};

// Le bout de la queue : le haut se rabat vers l'arrière et vers le bas.
const longueurQueue = Math.hypot(...sub(pointeQueue, J));
const charniereBout = lerpPt(J, pointeQueue, 0.62);
const boutVise = add(charniereBout, mul(norm(pt(Math.cos(0.35), Math.sin(0.35))), 0.38 * longueurQueue));
const pliBout = mediatrice(pointeQueue, boutVise);
const [queueBas, boutQueue] = decouper(queueLevee, pliBout, J, pointeQueue, '-bout');
const boutRabattu = boutQueue.map((m) => ({ ...m, pts: m.pts.map((q) => reflet(q, ...pliBout)) }));

const ecureuilAvec = (b: Morceau[]): Plan[] => [...versPlans(corpsAvant), ...versPlans(queueBas), ...versPlans(b), ...devant()];
const CADRE_FINAL = cadreDe([...ecureuilAvec(boutQueue), ...versPlans(boutRabattu)], 0.1);

const etape14: Etape = {
  titre: 'Le bout de la queue',
  consigne:
    'Rabattez le haut de la queue vers l’arrière et vers le bas, puis rentrez son coin vers l’intérieur : la queue s’enroule. Pas de repère précis, à vous de choisir sa forme !',
  astuce: 'L’écureuil a la queue lourde : rapprochez-la des oreilles pour qu’il tienne debout.',
  figure: {
    cadre: CADRE_FINAL,
    plans: ecureuilAvec(boutQueue),
    lignes: [bout(...pliBout, 0.4 * u)],
    fleches: [f(add(pointeQueue, P(0.03, 0)), add(boutVise, P(0.04, -0.02)), 'devant', 0.5)],
  },
  geste: { duree: 2400, pistes: [{ type: 'pli', ids: boutQueue.map((m) => m.id), axe: pliBout, sens: 1 }] },
};

const ecureuilFini = (): Plan[] => ecureuilAvec(boutRabattu);

const etape15: Etape = {
  titre: 'L’écureuil est prêt',
  consigne: 'Ajustez les pattes pour qu’il tienne assis, la queue bien dressée. Il n’attend plus que sa noisette !',
  figure: { cadre: CADRE_FINAL, plans: ecureuilFini() },
};

const illustration: Figure = {
  cadre: cadreDe(ecureuilFini(), 0.05),
  plans: ecureuilFini(),
};

export const ecureuil: Modele = {
  id: 'ecureuil',
  nom: 'L’écureuil',
  sousTitre: 'Risu (de Sébastien Limet)',
  kana: 'りす',
  niveau: 2,
  duree: '15 min',
  feuille: 'Feuille carrée de 15 × 15 cm, de la même couleur des deux côtés si possible',
  resume:
    'Un écureuil assis, la grande queue dressée au-dessus de la tête. Des plis inversés pour les côtés, le cou, les oreilles et le museau. D’après le modèle de Sébastien Limet présenté par origami.me.',
  papier: { recto: '#d98e5f', verso: '#f3c9a8' },
  illustration,
  etapes: [etape1, etape2, etape3, etape4, etape5, etape6, etape7, etape8, etape9, etape10, etape11, etape12, etape13, etape14, etape15],
};
