import { plan, pt, tourne } from '../pliage/geo';
import type { Figure, Fleche, Ligne, Plan, Pt } from '../pliage/types';
import type { Etape, Modele } from './types';

/*
 * La cocotte (salière), à partir d'une feuille carrée.
 * Deux fois les coins au centre, deux plis bord à bord, puis on la forme avec les doigts.
 */

const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };

const S = 100;
const CADRE = [-140, -140, 280, 280] as const;
const CADRE_PETIT = [-85, -85, 170, 170] as const;

const hg = pt(-S, -S);
const hd = pt(S, -S);
const bd = pt(S, S);
const bg = pt(-S, S);
const O = pt(0, 0);
const mh = pt(0, -S);
const md = pt(S, 0);
const mb = pt(0, S);
const mg = pt(-S, 0);
const s = S / 2;

/** Les quatre directions, pour poser une même flèche sur chaque coin. */
const quatre = <T,>(fn: (angle: number) => T): T[] => [0, 90, 180, 270].map(fn);

const etape1: Etape = {
  titre: 'Marquer les diagonales',
  consigne:
    'Face blanche vers vous, pliez la feuille en deux sur une diagonale, marquez, dépliez. Faites de même sur l’autre diagonale.',
  figure: {
    cadre: CADRE,
    plans: [plan('feuille', [hg, hd, bd, bg], 'verso')],
    lignes: [v(hg, bd), v(hd, bg)],
    fleches: [f(pt(-56, 60), pt(58, -54), 'devant', 0.3)],
  },
};

const etape2: Etape = {
  titre: 'Les coins au centre',
  consigne: 'Rabattez les quatre coins exactement au centre, là où les diagonales se croisent.',
  astuce: 'Un coin à la fois : posez la pointe sur le centre, puis lissez le pli du centre vers le bord.',
  figure: {
    cadre: CADRE,
    plans: [plan('feuille', [hg, hd, bd, bg], 'verso')],
    lignes: [v(hg, bd, 'marque'), v(hd, bg, 'marque'), v(mh, md), v(md, mb), v(mb, mg), v(mg, mh)],
    fleches: quatre((a) => f(tourne(pt(-86, -86), O, a), tourne(pt(-16, -16), O, a), 'devant', 0.25)),
  },
};

const coinsRabattus = (): Plan[] => [
  plan('fond', [mh, md, mb, mg], 'verso'),
  plan('c1', [mh, O, mg]),
  plan('c2', [mh, md, O]),
  plan('c3', [md, mb, O]),
  plan('c4', [mb, mg, O]),
];

const etape3: Etape = {
  titre: 'Retourner',
  consigne: 'Retournez le pliage : la face lisse est vers vous.',
  figure: {
    cadre: CADRE,
    plans: coinsRabattus(),
    fleches: [f(pt(112, -112), pt(112, -112), 'retourner')],
  },
};

const etape4: Etape = {
  titre: 'Encore les coins au centre',
  consigne: 'Rabattez à nouveau les quatre coins au centre. Le pliage devient un petit carré.',
  figure: {
    cadre: CADRE,
    plans: [plan('fond', [mh, md, mb, mg])],
    lignes: [
      v(pt(-s, -s), pt(s, s), 'marque'),
      v(pt(s, -s), pt(-s, s), 'marque'),
      v(pt(-s, -s), pt(s, -s)),
      v(pt(s, -s), pt(s, s)),
      v(pt(s, s), pt(-s, s)),
      v(pt(-s, s), pt(-s, -s)),
    ],
    fleches: quatre((a) => f(tourne(pt(0, -88), O, a), tourne(pt(0, -16), O, a), 'devant', 0.35)),
  },
};

const petitCarre = (): Plan[] => [
  plan('fond', [pt(-s, -s), pt(s, -s), pt(s, s), pt(-s, s)]),
  plan('t1', [pt(-s, -s), pt(s, -s), O], 'recto', 0.1),
  plan('t2', [pt(s, -s), pt(s, s), O], 'recto', 0.1),
  plan('t3', [pt(s, s), pt(-s, s), O], 'recto', 0.1),
  plan('t4', [pt(-s, s), pt(-s, -s), O], 'recto', 0.1),
];

const etape5: Etape = {
  titre: 'Plier en deux, dans les deux sens',
  consigne:
    'Pliez en deux bord à bord, marquez fermement, dépliez. Recommencez dans l’autre sens, puis dépliez.',
  astuce: 'Ces deux plis font tout le mouvement de la cocotte : marquez-les bien, dans les deux sens.',
  figure: {
    cadre: CADRE_PETIT,
    plans: petitCarre(),
    lignes: [v(pt(-s, 0), pt(s, 0)), v(pt(0, -s), pt(0, s))],
    fleches: [f(pt(12, -44), pt(12, 44), 'devant', -0.3)],
  },
};

const etape6: Etape = {
  titre: 'Retourner',
  consigne: 'Retournez : quatre petits carrés apparaissent. Ce sont les poches où glisser les doigts.',
  figure: {
    cadre: CADRE_PETIT,
    plans: petitCarre(),
    lignes: [v(pt(-s, 0), pt(s, 0), 'marque'), v(pt(0, -s), pt(0, s), 'marque')],
    fleches: [f(pt(62, -62), pt(62, -62), 'retourner')],
  },
};

// Les quatre poches, chacune coupée en deux triangles le long de sa diagonale (pour l'ombrage du pétale).
const pochesInitiales = (): Plan[] =>
  [0, 90, 180, 270].flatMap((a, i) => {
    const m1 = tourne(pt(0, -s), O, a);
    const p = tourne(pt(-s, -s), O, a);
    const m2 = tourne(pt(-s, 0), O, a);
    return [plan(`p${i}a`, [O, m1, p]), plan(`p${i}b`, [O, p, m2])];
  });

const petales: Record<string, Pt[]> = {};
const ombresPetales: Record<string, number> = {};
[0, 90, 180, 270].forEach((a, i) => {
  const c = tourne(pt(-4, -4), O, a);
  const m1 = tourne(pt(-15, -41), O, a);
  const p = tourne(pt(-64, -64), O, a);
  const m2 = tourne(pt(-41, -15), O, a);
  petales[`p${i}a`] = [c, m1, p];
  petales[`p${i}b`] = [c, p, m2];
  ombresPetales[`p${i}b`] = 0.28;
});

const etape7: Etape = {
  titre: 'Former la cocotte',
  consigne:
    'Glissez pouces et index sous les quatre carrés, puis rapprochez les doigts vers le centre : les coins se soulèvent et la cocotte prend forme.',
  astuce: 'Poussez d’abord le centre vers le bas avec les doigts, puis pincez : les pointes montent toutes seules.',
  figure: {
    cadre: CADRE_PETIT,
    plans: pochesInitiales(),
    lignes: [v(pt(-s, 0), pt(s, 0), 'marque'), v(pt(0, -s), pt(0, s), 'marque')],
    fleches: quatre((a) => f(tourne(pt(0, -78), O, a), tourne(pt(0, -56), O, a), 'pousser')),
  },
  geste: {
    duree: 3200,
    pistes: [{ type: 'morph', vers: petales, ombres: ombresPetales }],
  },
};

const illustration: Figure = {
  cadre: [-78, -78, 156, 156],
  plans: pochesInitiales().map((p) => ({
    ...p,
    pts: petales[p.id],
    ombre: ombresPetales[p.id] ?? 0,
  })),
};

export const cocotte: Modele = {
  id: 'cocotte',
  nom: 'La cocotte',
  sousTitre: 'Salière',
  kana: 'パクパク',
  niveau: 1,
  duree: '5 min',
  feuille: 'Feuille carrée de 15 × 15 cm ou plus, colorée d’un côté',
  resume: 'Le jeu de la cour de récré. Que des plis simples, et un dernier geste pour lui donner forme.',
  papier: { recto: '#c9708f', verso: '#ffffff' },
  illustration,
  etapes: [etape1, etape2, etape3, etape4, etape5, etape6, etape7],
};
