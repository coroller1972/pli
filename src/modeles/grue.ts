import { add, intersection, lerpPt, mul, norm, plan, pt, reflet, sub, tourne } from '../pliage/geo';
import type { Figure, Fleche, Ligne, Plan, Pt } from '../pliage/types';
import type { Etape, Modele } from './types';

/*
 * La grue (tsuru), à partir d'une feuille carrée colorée d'un côté.
 * Toutes les coordonnées sont calculées : chaque pli est un vrai reflet géométrique.
 */

const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };

// ─── Phase 1 : la feuille entière, posée en losange (demi-diagonale D) ──────────
const D = 130;
const C = pt(0, 0);
const T = pt(0, -D);
const R = pt(D, 0);
const B = pt(0, D);
const L = pt(-D, 0);
const Mhg = pt(-D / 2, -D / 2);
const Mhd = pt(D / 2, -D / 2);
const Mbd = pt(D / 2, D / 2);
const Mbg = pt(-D / 2, D / 2);
const CADRE_FEUILLE = [-165, -165, 330, 330] as const;

const feuille = (face: 'recto' | 'verso') => [plan('feuille', [T, R, B, L], face)];
const diagonales: Ligne[] = [v(L, R, 'marque'), v(T, B, 'marque')];

// ─── Phase 2 : la base carrée (demi-diagonale h = 100) ─────────────────────────
const h = 100;
const T2 = pt(0, -h);
const R2 = pt(h, 0);
const B2 = pt(0, h);
const L2 = pt(-h, 0);
// Plis en cerf-volant : les bords inférieurs viennent sur la ligne du milieu.
const bissec = norm(add(norm(sub(L2, B2)), norm(sub(T2, B2))));
const KG = intersection(B2, add(B2, bissec), T2, L2);
const KD = pt(-KG[0], KG[1]);
const Lc = reflet(L2, B2, KG); // où arrive le coin gauche : sur la ligne du milieu
const Bp = reflet(B2, KG, KD); // pointe du pétale, une fois relevée
const CADRE_BASE = [-150, -128, 300, 256] as const;
const CADRE_PETALE = [-158, -205, 316, 330] as const;

// ─── Affinage des jambes ───────────────────────────────────────────────────────
const bissec2 = norm(add(norm(sub(KG, B2)), norm(sub(Lc, B2))));
const NG = intersection(B2, add(B2, bissec2), KG, Lc);
const ND = pt(-NG[0], NG[1]);
const KGr = reflet(KG, B2, NG);
const KDr = pt(-KGr[0], KGr[1]);

// ─── Cou et queue : pli inversé intérieur des jambes ───────────────────────────
const yCoupe = 5;
const surBord = (a: Pt, b: Pt, y: number): Pt => lerpPt(a, b, (y - a[1]) / (b[1] - a[1]));
const coupeG = surBord(NG, B2, yCoupe);
const coupeD = pt(-coupeG[0], coupeG[1]);
const milieuCoupe = pt(0, yCoupe);
const jambeG: Pt[] = [coupeG, milieuCoupe, B2];
const jambeD: Pt[] = [milieuCoupe, coupeD, B2];
const angleDe = (de: Pt, vers: Pt) => (Math.atan2(vers[1] - de[1], vers[0] - de[0]) * 180) / Math.PI;
// Vu de face, les ailes dressées sont larges : le cou sort à 25° pour rester visible sous l'aile.
const ROT_COU = 205 - angleDe(coupeG, B2);
const ROT_QUEUE = -ROT_COU;
const cou: Pt[] = jambeG.map((p) => tourne(p, coupeG, ROT_COU));
const queue: Pt[] = jambeD.map((p) => tourne(p, coupeD, ROT_QUEUE));

// Tête : pli inversé à la pointe du cou.
const [c0, c1, pointeCou] = cou;
const t0 = lerpPt(c0, pointeCou, 0.7);
const t1 = lerpPt(c1, pointeCou, 0.7);
const pivotTete = lerpPt(t0, t1, 0.5);
const ROT_TETE = -80;
const couCourt: Pt[] = [c0, c1, t1, t0];
const tete: Pt[] = [t0, t1, pointeCou];
const teteFinale = tete.map((p) => tourne(p, pivotTete, ROT_TETE));
const CADRE_OISEAU = [-168, -205, 336, 330] as const;

// Plans du corps (ailes et départ des jambes), communs aux dernières étapes.
const moignonG: Pt[] = [NG, Lc, milieuCoupe, coupeG];
const moignonD: Pt[] = [Lc, ND, coupeD, milieuCoupe];
const corps = (): Plan[] => [
  plan('aile-g', [KG, Bp, Lc]),
  plan('aile-d', [KD, Lc, Bp]),
  plan('moignon-g', moignonG),
  plan('moignon-d', moignonD),
];

// ─── Les étapes ────────────────────────────────────────────────────────────────

const etape1: Etape = {
  titre: 'Plier en triangle',
  consigne:
    'Face colorée vers vous, rabattez la pointe du haut sur celle du bas. Alignez bien les coins, marquez le pli avec l’ongle, puis dépliez.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: feuille('recto'),
    lignes: [v(L, R)],
    fleches: [f(pt(18, -112), pt(18, 108), 'devant', -0.25)],
  },
};

const etape2: Etape = {
  titre: 'Puis sur l’autre diagonale',
  consigne: 'Rabattez la pointe de gauche sur celle de droite, marquez, puis dépliez. Deux diagonales sont marquées.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: feuille('recto'),
    lignes: [v(L, R, 'marque'), v(T, B)],
    fleches: [f(pt(-112, -18), pt(108, -18), 'devant', -0.25)],
  },
};

const etape3: Etape = {
  titre: 'Retourner la feuille',
  consigne: 'Retournez la feuille : la face blanche est maintenant vers vous.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: feuille('recto'),
    lignes: diagonales,
    fleches: [f(pt(128, -128), pt(128, -128), 'retourner')],
  },
};

const etape4: Etape = {
  titre: 'Plier bord à bord',
  consigne: 'Pliez la feuille en deux en amenant un bord sur le bord opposé. Marquez, puis dépliez.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: feuille('verso'),
    lignes: [...diagonales, v(Mhg, Mbd)],
    fleches: [f(pt(50, -50), pt(-50, 50), 'devant', 0.3)],
  },
};

const etape5: Etape = {
  titre: 'Et dans l’autre sens',
  consigne: 'Même pli dans l’autre sens, puis dépliez. La feuille porte maintenant une étoile de quatre plis.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: feuille('verso'),
    lignes: [...diagonales, v(Mhg, Mbd, 'marque'), v(Mhd, Mbg)],
    fleches: [f(pt(-50, -50), pt(50, 50), 'devant', -0.3)],
  },
};

// Base carrée : la feuille est découpée en huit triangles (deux par quart).
const Cb = pt(0, -65);
const Bb = pt(0, 65);
const Lb = pt(-65, 0);
const Rb = pt(65, 0);
const etape6: Etape = {
  titre: 'Rassembler en base carrée',
  consigne:
    'Rabattez le haut sur le bas en triangle, puis poussez les deux côtés vers l’intérieur en suivant les plis : la feuille se rassemble en un petit carré, ouverture vers le bas.',
  astuce: 'Les plis déjà marqués guident le papier. Ne forcez pas : laissez-le tomber dans ses plis.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [
      plan('qb1', [C, Mbd, B], 'verso'),
      plan('qb2', [C, B, Mbg], 'verso'),
      plan('qg1', [C, Mbg, L], 'verso'),
      plan('qd2', [C, R, Mbd], 'verso'),
      plan('qg2', [C, L, Mhg], 'verso'),
      plan('qd1', [C, Mhd, R], 'verso'),
      plan('qh1', [C, Mhg, T], 'verso'),
      plan('qh2', [C, T, Mhd], 'verso'),
    ],
    lignes: [v(L, R, 'montagne'), v(T, B, 'montagne'), v(Mhg, Mbd), v(Mhd, Mbg)],
    fleches: [
      f(pt(16, -112), pt(16, 110), 'devant', -0.22),
      f(pt(-163, 0), pt(-136, 0), 'pousser'),
      f(pt(163, 0), pt(136, 0), 'pousser'),
    ],
  },
  geste: {
    duree: 3800,
    pistes: [
      { type: 'pli', ids: ['qg2', 'qd1', 'qh1', 'qh2'], axe: [L, R], sens: 1, de: 0, a: 0.42 },
      {
        type: 'morph',
        de: 0.5,
        a: 1,
        vers: {
          qh1: [Cb, Lb, Bb],
          qh2: [Cb, Bb, Rb],
          qb1: [Cb, Rb, Bb],
          qb2: [Cb, Bb, Lb],
          qg1: [Cb, Lb, Bb],
          qg2: [Cb, Bb, Lb],
          qd1: [Cb, Rb, Bb],
          qd2: [Cb, Bb, Rb],
        },
      },
    ],
  },
};

/** Les six premières étapes, jusqu'à la base carrée : d'autres modèles (le lys) partent de là. */
export const etapesBaseCarree: Etape[] = [etape1, etape2, etape3, etape4, etape5, etape6];

const baseCarree = (): Plan[] => [plan('base', [T2, R2, B2, L2])];

const etape7: Etape = {
  titre: 'Plier en cerf-volant',
  consigne:
    'Ouverture vers le bas. Sur la couche du dessus seulement, rabattez les deux bords inférieurs sur la ligne du milieu.',
  figure: {
    cadre: CADRE_BASE,
    plans: baseCarree(),
    lignes: [v(T2, B2, 'marque'), v(B2, KG), v(B2, KD)],
    fleches: [f(pt(-88, 6), pt(-14, -28), 'devant', -0.3), f(pt(88, 6), pt(14, -28), 'devant', 0.3)],
  },
};

const etape8: Etape = {
  titre: 'Marquer le haut',
  consigne:
    'Rabattez le triangle du haut par-dessus, marquez fermement, puis dépliez ces trois derniers plis : ils préparent le pétale.',
  figure: {
    cadre: CADRE_BASE,
    plans: [
      plan('dos', [T2, R2, B2, L2]),
      plan('cv', [T2, KD, B2, KG]),
      plan('rg', [B2, KG, Lc]),
      plan('rd', [B2, Lc, KD]),
    ],
    lignes: [v(KG, KD)],
    fleches: [f(pt(12, -92), pt(12, 8), 'devant', -0.35)],
  },
};

/** Plans du pli pétale, sur une face de la base carrée. */
const planPetale = (dos: Plan): Plan[] => [
  dos,
  plan('tt', [T2, KD, KG]),
  plan('lf', [KG, L2, B2], 'verso'),
  plan('rf', [KD, B2, R2], 'verso'),
  plan('mt', [KG, KD, B2]),
  plan('ls', [KG, B2, L2]),
  plan('rs', [KD, R2, B2]),
];

const gestePetale = {
  duree: 3400,
  pistes: [
    {
      type: 'morph' as const,
      vers: {
        lf: [KG, Lc, B2],
        rf: [KD, B2, Lc],
        mt: [KG, KD, Bp],
        ls: [KG, Bp, Lc],
        rs: [KD, Lc, Bp],
      },
    },
  ],
};

const lignesPetale: Ligne[] = [v(T2, B2, 'marque'), v(KG, KD), v(B2, KG, 'montagne'), v(B2, KD, 'montagne')];
const flechesPetale: Fleche[] = [
  f(pt(8, 92), pt(8, -176), 'devant', -0.16),
  f(pt(-154, -4), pt(-110, -2), 'pousser'),
  f(pt(154, -4), pt(110, -2), 'pousser'),
];

const etape9: Etape = {
  titre: 'Le pli pétale',
  consigne:
    'Soulevez la pointe du bas de la couche du dessus et faites-la pivoter vers le haut sur le pli horizontal. Les côtés se replient vers le centre le long des plis marqués. Aplatissez.',
  astuce: 'Si le papier résiste, remarquez les plis de l’étape précédente avant de recommencer.',
  figure: {
    cadre: CADRE_PETALE,
    plans: planPetale(plan('dos', [T2, R2, B2, L2], 'recto', 0.1)),
    lignes: lignesPetale,
    fleches: flechesPetale,
  },
  geste: gestePetale,
};

const etape10: Etape = {
  titre: 'Retourner',
  consigne: 'Retournez le pliage pour travailler l’autre face.',
  figure: {
    cadre: CADRE_PETALE,
    plans: [
      plan('dos', [T2, R2, B2, L2], 'recto', 0.1),
      plan('lf', [KG, Lc, B2]),
      plan('rf', [KD, B2, Lc]),
      plan('ls', [KG, Bp, Lc]),
      plan('rs', [KD, Lc, Bp]),
    ],
    fleches: [f(pt(118, -150), pt(118, -150), 'retourner')],
  },
};

const petaleDerriere = plan('pet-dos', [KG, Bp, KD, T2], 'recto', 0.12);

const etape11: Etape = {
  titre: 'Cerf-volant, de ce côté',
  consigne:
    'Répétez les étapes 7 et 8 sur cette face : bords inférieurs sur la ligne du milieu, triangle du haut rabattu et marqué, puis tout déplier.',
  figure: {
    cadre: CADRE_PETALE,
    plans: [petaleDerriere, ...baseCarree()],
    lignes: [v(T2, B2, 'marque'), v(B2, KG), v(B2, KD), v(KG, KD, 'marque')],
    fleches: [f(pt(-88, 6), pt(-14, -28), 'devant', -0.3), f(pt(88, 6), pt(14, -28), 'devant', 0.3)],
  },
};

const etape12: Etape = {
  titre: 'Le second pétale',
  consigne:
    'Même pli pétale de ce côté : la pointe du bas monte, les côtés rentrent. Vous obtenez la base de l’oiseau, un long losange.',
  figure: {
    cadre: CADRE_PETALE,
    plans: [petaleDerriere, ...planPetale(plan('dos', [Bp, KD, B2, KG], 'recto', 0.1)).slice(1)],
    lignes: lignesPetale,
    fleches: flechesPetale,
  },
  geste: gestePetale,
};

/** De la base carrée à la base de l'oiseau (deux plis pétales) : reprises par l'oiseau qui bat des ailes. */
export const etapesBaseOiseau: Etape[] = [etape7, etape8, etape9, etape10, etape11, etape12];
/** Les repères de la base de l'oiseau, vue de face. */
export const baseOiseauRepere = { T2, B2, KG, KD, Lc, Bp };

const baseOiseau = (): Plan[] => [
  plan('dos', [Bp, KD, B2, KG], 'recto', 0.1),
  plan('lf', [KG, Lc, B2]),
  plan('rf', [KD, B2, Lc]),
  plan('ls', [KG, Bp, Lc]),
  plan('rs', [KD, Lc, Bp]),
];

const etape13: Etape = {
  titre: 'Affiner les jambes',
  consigne:
    'Sur la couche du dessus, rabattez les deux bords inférieurs sur la ligne du milieu : la partie basse devient plus fine.',
  figure: {
    cadre: CADRE_PETALE,
    plans: baseOiseau(),
    lignes: [v(B2, NG), v(B2, ND)],
    fleches: [f(pt(-48, -18), pt(-8, -30), 'devant', -0.4), f(pt(48, -18), pt(8, -30), 'devant', 0.4)],
  },
};

const etape14: Etape = {
  titre: 'Retourner et affiner',
  consigne: 'Retournez, puis affinez de la même façon de l’autre côté.',
  figure: {
    cadre: CADRE_PETALE,
    plans: [
      plan('dos', [Bp, KD, B2, KG], 'recto', 0.1),
      plan('ls', [KG, Bp, Lc]),
      plan('rs', [KD, Lc, Bp]),
      plan('lfn', [NG, Lc, B2]),
      plan('rfn', [ND, B2, Lc]),
      plan('lfp', [B2, NG, KGr]),
      plan('rfp', [B2, KDr, ND]),
    ],
    fleches: [f(pt(118, -150), pt(118, -150), 'retourner')],
  },
};

const etape15: Etape = {
  titre: 'Le cou : pli inversé',
  consigne:
    'Écartez légèrement les couches de la jambe de gauche et faites-la remonter entre elles, en biais vers le haut. Aplatissez : c’est le cou.',
  astuce: 'Marquez d’abord le pli dans les deux sens : la jambe se retournera plus facilement à l’intérieur.',
  figure: {
    cadre: CADRE_OISEAU,
    plans: [plan('jambe-g', jambeG), plan('jambe-d', jambeD), ...corps()],
    lignes: [v(add(coupeG, pt(-6, 0)), pt(4, yCoupe))],
    fleches: [f(pt(-12, 92), add(cou[2], pt(6, 10)), 'devant', -0.42)],
  },
  geste: {
    duree: 3000,
    pistes: [{ type: 'rotation', ids: ['jambe-g'], pivot: coupeG, angle: ROT_COU }],
  },
};

const etape16: Etape = {
  titre: 'La queue',
  consigne: 'Même pli inversé avec la jambe de droite : elle remonte entre les couches pour former la queue.',
  figure: {
    cadre: CADRE_OISEAU,
    plans: [plan('cou', cou), plan('jambe-d', jambeD), ...corps()],
    lignes: [v(pt(-4, yCoupe), add(coupeD, pt(6, 0)))],
    fleches: [f(pt(12, 92), add(queue[2], pt(-6, 10)), 'devant', 0.42)],
  },
  geste: {
    duree: 3000,
    pistes: [{ type: 'rotation', ids: ['jambe-d'], pivot: coupeD, angle: ROT_QUEUE }],
  },
};

const etape17: Etape = {
  titre: 'La tête',
  consigne: 'Un petit pli inversé à la pointe du cou : la tête bascule vers l’avant, entre les couches.',
  astuce: 'Pincez le cou juste sous le pli pour le guider sans écraser le reste.',
  figure: {
    cadre: CADRE_OISEAU,
    plans: [plan('tete', tete), plan('cou', couCourt), plan('queue', queue), ...corps()],
    lignes: [v(add(t0, mul(norm(sub(t0, t1)), 6)), add(t1, mul(norm(sub(t1, t0)), 6)))],
    fleches: [f(add(pointeCou, pt(10, -4)), add(teteFinale[2], pt(-4, 10)), 'devant', 0.45)],
  },
  geste: {
    duree: 2400,
    pistes: [{ type: 'rotation', ids: ['tete'], pivot: pivotTete, angle: ROT_TETE }],
  },
};

const etape18: Etape = {
  titre: 'Abaisser les ailes',
  consigne:
    'Abaissez l’aile de devant, puis celle de derrière. Écartez-les doucement et soufflez dans le corps si vous voulez lui donner du volume. La grue est prête.',
  figure: {
    cadre: CADRE_OISEAU,
    plans: [plan('tete', teteFinale), plan('cou', couCourt), plan('queue', queue), ...corps()],
    lignes: [v(KG, KD)],
    fleches: [f(pt(18, -168), pt(18, 30), 'devant', -0.3), f(pt(-18, -168), pt(-18, 30), 'derriere', 0.3)],
  },
};

const illustration: Figure = {
  cadre: [10, -4, 180, 120],
  plans: [
    plan('aile-arriere', [pt(100, 62), pt(160, 12), pt(116, 78)], 'recto', 0.28),
    plan('queue', [pt(122, 80), pt(132, 86), pt(176, 34)]),
    plan('corps', [pt(70, 86), pt(100, 62), pt(130, 86), pt(100, 104)]),
    plan('cou', [pt(78, 86), pt(92, 80), pt(36, 26)]),
    plan('tete', [pt(36, 26), pt(22, 36), pt(42, 32)], 'recto', 0.28),
    plan('aile-avant', [pt(100, 62), pt(44, 8), pt(84, 80)], 'recto', 0),
  ],
};

export const grue: Modele = {
  id: 'grue',
  nom: 'La grue',
  sousTitre: 'Tsuru',
  kana: 'つる',
  niveau: 2,
  duree: '15 min',
  feuille: 'Feuille carrée de 15 × 15 cm, colorée d’un côté',
  resume:
    'Le classique du pliage japonais. Deux plis pétales et trois plis inversés : les gestes délicats sont animés.',
  papier: { recto: '#6b86c9', verso: '#ffffff' },
  illustration,
  etapes: [
    ...etapesBaseCarree,
    etape7,
    etape8,
    etape9,
    etape10,
    etape11,
    etape12,
    etape13,
    etape14,
    etape15,
    etape16,
    etape17,
    etape18,
  ],
};
