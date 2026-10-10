import { add, lerpPt, mul, norm, plan, pt, sub } from '../pliage/geo';
import type { Figure, Fleche, Ligne, Piste, Plan, Pt } from '../pliage/types';
import type { Etape, Modele } from './types';

/*
 * Le bateau en papier, à partir d'une feuille rectangulaire (A4).
 * Chapeau, losange, triangle, losange, puis on tire sur les côtés.
 */

const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };

const W = 74; // demi-largeur de la feuille
const H = 105; // demi-hauteur

// Feuille pliée en deux : rectangle W×2 de large, H de haut, recentré.
const hh = H / 2;
const haut = pt(0, -hh);
const coinG = pt(-W, -hh);
const coinD = pt(W, -hh);
const yBande = -hh + W; // les coins rabattus arrivent sur la ligne du milieu, à cette hauteur
const bandeHaute = yBande - (hh - yBande); // bande remontée de sa hauteur
const pointeG = pt(-W, yBande);
const pointeD = pt(W, yBande);
const Fm = pt(0, yBande); // milieu du bas du chapeau

// Losange obtenu en ouvrant le chapeau : les deux coins se rejoignent en bas.
const cote = Math.hypot(W, W);
const bas = pt(0, -hh + cote);
const yMil = (-hh + bas[1]) / 2;
const demi = Math.sqrt(W * W - (cote / 2) * (cote / 2));
const Fp = pt(-demi, yMil);
const Kp = pt(demi, yMil);
const hBande = hh - yBande;
const nG = norm(sub(pt(0, yMil), add(mul(add(Fp, bas), 0.5), pt(0, 0)))); // vers l'intérieur, côté gauche
const nD: Pt = [-nG[0], nG[1]];
const bandeG1 = add(Fp, mul(nG, hBande));
const bandeG2 = add(bas, mul(nG, hBande));
const bandeD1 = add(Kp, mul(nD, hBande));
const bandeD2 = add(bas, mul(nD, hBande));

// Second losange : on ouvre le triangle [Fp, haut, Kp].
const cote2 = Math.hypot(Fp[0] - haut[0], Fp[1] - haut[1]);
const bas2 = pt(0, -hh + cote2);
const yMil2 = (-hh + bas2[1]) / 2;
const hTri = Math.hypot(0, yMil - -hh);
const demi2 = Math.sqrt(Math.max(0, hTri * hTri - (cote2 / 2) * (cote2 / 2)));
const S1 = pt(-demi2, yMil2);
const S2 = pt(demi2, yMil2);
const M2 = pt(0, yMil);
const centre2 = pt(0, yMil2);

/**
 * Ouvrir un chapeau et l'aplatir fait tourner le pliage d'un quart de tour : vu de face,
 * il s'affine jusqu'à être vu par la tranche, puis s'élargit dans l'autre sens.
 * On joue donc deux morphs : vers une forme « par la tranche », puis vers la forme finale.
 */
function ouverture(depart: Plan[], arrivee: Record<string, Pt[]>): Piste[] {
  const tranche: Record<string, Pt[]> = {};
  for (const p of depart) {
    const fin = arrivee[p.id];
    if (!fin) continue;
    tranche[p.id] = p.pts.map((q, i) => {
      const m = lerpPt(q, fin[i], 0.5);
      return pt(m[0] * 0.3, m[1]);
    });
  }
  return [
    { type: 'morph', vers: tranche, de: 0, a: 0.5 },
    { type: 'morph', vers: arrivee, de: 0.5, a: 1 },
  ];
}

const CADRE_FEUILLE = [-130, -130, 260, 260] as const;
const CADRE_PLIE = [-112, -112, 224, 224] as const;
const CADRE_CHAPEAU = [-130, -100, 260, 190] as const;
const CADRE_PETIT = [-100, -90, 200, 150] as const;

const etape1: Etape = {
  titre: 'Plier en deux',
  consigne: 'Feuille A4 en hauteur. Pliez-la en deux, du haut vers le bas, en alignant bien les bords.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [plan('feuille', [pt(-W, -H), pt(W, -H), pt(W, H), pt(-W, H)])],
    lignes: [v(pt(-W, 0), pt(W, 0))],
    fleches: [f(pt(14, -92), pt(14, 90), 'devant', -0.25)],
  },
};

const plie = (): Plan[] => [plan('plie', [coinG, coinD, pt(W, hh), pt(-W, hh)])];

const etape2: Etape = {
  titre: 'Marquer le milieu',
  consigne: 'Le pli est en haut. Pliez en deux de gauche à droite pour marquer le milieu, puis dépliez.',
  figure: {
    cadre: CADRE_PLIE,
    plans: plie(),
    lignes: [v(pt(0, -hh), pt(0, hh))],
    fleches: [f(pt(-62, -14), pt(62, -14), 'devant', -0.3)],
  },
};

const etape3: Etape = {
  titre: 'Rabattre les coins',
  consigne: 'Rabattez les deux coins du haut sur la ligne du milieu. Une bande reste libre en bas.',
  figure: {
    cadre: CADRE_PLIE,
    plans: plie(),
    lignes: [v(pt(0, -hh), pt(0, hh), 'marque'), v(haut, pointeG), v(haut, pointeD)],
    fleches: [f(pt(-64, -44), pt(-6, 14), 'devant', 0.3), f(pt(64, -44), pt(6, 14), 'devant', -0.3)],
  },
};

const etape4: Etape = {
  titre: 'Le chapeau',
  consigne:
    'Remontez la bande du bas, couche de devant seulement, sur le triangle. Retournez et faites de même de l’autre côté : vous tenez un chapeau.',
  astuce: 'Rabattez les petits coins de la bande qui dépassent par-dessus les côtés : le chapeau tiendra mieux.',
  figure: {
    cadre: CADRE_CHAPEAU,
    plans: [
      plan('fond', [haut, pointeD, pt(W, hh), pt(-W, hh), pointeG]),
      plan('coin-g', [haut, Fm, pointeG], 'verso'),
      plan('coin-d', [haut, pointeD, Fm], 'verso'),
    ],
    lignes: [v(pointeG, pointeD)],
    fleches: [f(pt(12, hh - 6), pt(12, bandeHaute + 6), 'devant', -0.4)],
  },
};

const Bm = pt(0, bandeHaute);
const plansChapeau: Plan[] = [
  plan('dd', [haut, Fm, pointeD], 'recto', 0.1),
  plan('dg', [haut, pointeG, Fm], 'recto', 0.1),
  plan('bdg', [pt(-W, bandeHaute), Bm, Fm, pointeG], 'verso', 0.1),
  plan('bdd', [Bm, pt(W, bandeHaute), pointeD, Fm], 'verso', 0.1),
  plan('ag', [haut, pointeG, Fm]),
  plan('ad', [haut, Fm, pointeD]),
  plan('bag', [pt(-W, bandeHaute), Bm, Fm, pointeG], 'verso'),
  plan('bad', [Bm, pt(W, bandeHaute), pointeD, Fm], 'verso'),
];
const etape5: Etape = {
  titre: 'Ouvrir en losange',
  consigne:
    'Glissez les pouces dans l’ouverture du chapeau et écartez. Rapprochez les deux coins du bas l’un de l’autre, puis aplatissez : le chapeau devient un losange.',
  astuce: 'Les deux coins doivent se toucher exactement, l’un sur l’autre. Lissez ensuite à plat.',
  figure: {
    cadre: CADRE_CHAPEAU,
    plans: plansChapeau,
    fleches: [
      f(pt(-4, yBande + 6), pt(-26, yBande + 34), 'tirer'),
      f(pt(4, yBande + 6), pt(26, yBande + 34), 'tirer'),
      f(pt(-124, yBande), pt(-90, yBande), 'pousser'),
      f(pt(124, yBande), pt(90, yBande), 'pousser'),
    ],
  },
  geste: {
    duree: 3800,
    pistes: ouverture(plansChapeau, {
      ag: [haut, bas, Fp],
      ad: [haut, Fp, bas],
      dg: [haut, bas, Kp],
      dd: [haut, Kp, bas],
      bag: [bandeG2, bandeG1, Fp, bas],
      bad: [bandeG1, bandeG2, bas, Fp],
      bdg: [bandeD2, bandeD1, Kp, bas],
      bdd: [bandeD1, bandeD2, bas, Kp],
    }),
  },
};

const losange = (): Plan[] => [
  plan('dd', [haut, Kp, bas], 'recto', 0.1),
  plan('dg', [haut, bas, Kp], 'recto', 0.1),
  plan('ag', [haut, bas, Fp]),
  plan('ad', [haut, Fp, bas]),
  plan('bd', [bandeD1, Kp, bas, bandeD2], 'verso', 0.1),
  plan('bg', [bandeG1, bandeG2, bas, Fp], 'verso'),
];

const etape6: Etape = {
  titre: 'Remonter les pointes',
  consigne:
    'Remontez la pointe du bas, couche de devant, jusqu’à la pointe du haut. Retournez et faites de même : vous obtenez un triangle.',
  figure: {
    cadre: CADRE_CHAPEAU,
    plans: losange(),
    lignes: [v(Fp, Kp)],
    fleches: [f(pt(10, bas[1] - 8), pt(10, -hh + 8), 'devant', -0.35)],
  },
};

const plansTriangle: Plan[] = [
  plan('dd', [haut, M2, Kp], 'recto', 0.1),
  plan('dg', [haut, Fp, M2], 'recto', 0.1),
  plan('ag', [haut, Fp, M2]),
  plan('ad', [haut, M2, Kp]),
];

const etape7: Etape = {
  titre: 'Ouvrir à nouveau',
  consigne:
    'Comme à l’étape 5 : ouvrez le triangle par le bas, rapprochez les deux coins l’un de l’autre et aplatissez en un losange plus petit.',
  figure: {
    cadre: CADRE_PETIT,
    plans: plansTriangle,
    fleches: [
      f(pt(-4, yMil + 4), pt(-22, yMil + 26), 'tirer'),
      f(pt(4, yMil + 4), pt(22, yMil + 26), 'tirer'),
      f(pt(-94, yMil), pt(-64, yMil), 'pousser'),
      f(pt(94, yMil), pt(64, yMil), 'pousser'),
    ],
  },
  geste: {
    duree: 3400,
    pistes: ouverture(plansTriangle, {
      ag: [haut, bas2, S1],
      ad: [haut, S1, bas2],
      dg: [haut, bas2, S2],
      dd: [haut, S2, bas2],
    }),
  },
};

// Bateau final.
const voileFinale: Pt[] = [pt(0, -62), pt(-22, -10), pt(22, -10)];
const coqueFinale: Pt[] = [pt(-84, -32), pt(-48, 18), pt(48, 18), pt(84, -32), pt(24, -10), pt(-24, -10)];

const etape8: Etape = {
  titre: 'Tirer, le bateau apparaît',
  consigne:
    'Pincez les deux pointes de côté et tirez doucement vers l’extérieur. Le pliage s’ouvre : la coque se déploie et la voile reste au centre.',
  astuce: 'Tirez lentement et sans à-coup : c’est l’étape où le papier se déchire le plus souvent.',
  figure: {
    cadre: CADRE_PETIT,
    plans: [plan('voile', [haut, S1, S2]), plan('coque', [S1, bas2, bas2, S2, centre2, centre2])],
    fleches: [f(pt(S1[0] - 6, S1[1]), pt(-86, S1[1] - 10), 'tirer'), f(pt(S2[0] + 6, S2[1]), pt(86, S2[1] - 10), 'tirer')],
  },
  geste: {
    duree: 3000,
    pistes: [{ type: 'morph', vers: { voile: voileFinale, coque: coqueFinale } }],
  },
};

const illustration: Figure = {
  cadre: [-100, -74, 200, 104],
  plans: [plan('voile', voileFinale, 'recto', 0.18), plan('coque', coqueFinale)],
  lignes: [v(pt(-24, -10), pt(-48, 18), 'marque'), v(pt(24, -10), pt(48, 18), 'marque')],
};

export const bateau: Modele = {
  id: 'bateau',
  nom: 'Le bateau',
  sousTitre: 'Bateau en papier',
  kana: 'ふね',
  niveau: 1,
  duree: '5 min',
  feuille: 'Une feuille A4, papier ordinaire',
  resume: 'Celui de l’enfance, plié dans une feuille A4. Deux ouvertures en losange à bien réussir.',
  papier: { recto: '#e3b65c', verso: '#f3dba6' },
  illustration,
  etapes: [etape1, etape2, etape3, etape4, etape5, etape6, etape7, etape8],
};
