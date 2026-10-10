import { plan, pt, rabat } from '../pliage/geo';
import type { Figure, Fleche, Ligne, Plan, Pt } from '../pliage/types';
import type { Etape, Modele } from './types';

/*
 * La grenouille sauteuse (pyon-pyon gaeru), dans une fiche bristol.
 * La tête est une base de la bombe à eau pliée dans le carré du haut ; le pli en accordéon
 * de l'arrière fait ressort : on appuie, on glisse le doigt, elle saute.
 */

const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };
const miroir = (p: Pt): Pt => pt(-p[0], p[1]);

// La fiche, en hauteur : un carré en haut (demi-côté u, centré sur C), le reste en dessous.
const u = 50;
const yBas = 2.4 * u;
const C = pt(0, 0);
const HG = pt(-u, -u);
const HD = pt(u, -u);
const BD = pt(u, u);
const BG = pt(-u, u);
const Mh = pt(0, -u);
const Mb = pt(0, u);
const Mg = pt(-u, 0);
const Md = pt(u, 0);
const P = pt(-u / 2, u / 2);
const Pd = miroir(P);

// Le corps, affiné puis replié en accordéon.
const q = u / 2;
const yRemonte = (u + yBas) / 2; // le bas remonte jusqu'à la base de la tête
const yRessort = (u + yRemonte) / 2;
const rect = (x0: number, x1: number, y0: number, y1: number): Pt[] => [pt(x0, y0), pt(x1, y0), pt(x1, y1), pt(x0, y1)];

const CADRE_FICHE = [-90, -72, 180, 214] as const;
const CADRE_GRENOUILLE = [-85, -30, 170, 170] as const;

const corpsEntier = (): Plan => plan('corps', rect(-u, u, u, yBas), 'verso');

const etape1: Etape = {
  titre: 'Une croix en haut',
  consigne:
    'Une fiche bristol en hauteur, face claire vers vous. Rabattez le coin en haut à droite sur le bord gauche, marquez, dépliez. Faites de même avec le coin en haut à gauche.',
  astuce: 'Une fiche bristol ou un papier un peu épais : la grenouille sautera bien plus haut.',
  figure: {
    cadre: CADRE_FICHE,
    plans: [plan('fiche', rect(-u, u, -u, yBas), 'verso')],
    lignes: [v(HG, BD), v(HD, BG)],
    fleches: [f(pt(38, -42), pt(-38, 34), 'devant', 0.4)],
  },
};

const etape2: Etape = {
  titre: 'Le pli du milieu',
  consigne:
    'Pliez le haut de la fiche vers l’arrière, le long de la ligne qui passe par le croisement des deux plis, puis dépliez.',
  figure: {
    cadre: CADRE_FICHE,
    plans: [plan('fiche', rect(-u, u, -u, yBas), 'verso')],
    lignes: [v(HG, BD, 'marque'), v(HD, BG, 'marque'), v(Mg, Md, 'montagne')],
    fleches: [f(pt(16, -40), pt(16, 34), 'derriere', 0.4)],
  },
};

const etape3: Etape = {
  titre: 'La tête en triangle',
  consigne:
    'Rabattez le haut vers le bas en poussant les deux côtés vers l’intérieur, le long des plis : le carré du haut devient un triangle, pointe en haut.',
  astuce: 'C’est la base de la bombe à eau, comme pour le ballon. Aplatissez bien le triangle.',
  figure: {
    cadre: CADRE_FICHE,
    plans: [
      corpsEntier(),
      plan('b-g', [C, BG, Mb], 'verso'),
      plan('b-d', [C, Mb, BD], 'verso'),
      plan('b-g-in', [C, Mg, BG], 'verso'),
      plan('b-d-in', [C, BD, Md], 'verso'),
      plan('h-g-in', [C, HG, Mg], 'verso'),
      plan('h-d-in', [C, Md, HD], 'verso'),
      plan('h-g', [C, Mh, HG], 'verso'),
      plan('h-d', [C, HD, Mh], 'verso'),
    ],
    lignes: [v(HG, BD), v(HD, BG), v(Mg, Md, 'montagne')],
    fleches: [f(pt(14, -44), pt(14, 40), 'devant', -0.25), f(pt(-74, 0), pt(-56, 0), 'pousser'), f(pt(74, 0), pt(56, 0), 'pousser')],
  },
  geste: {
    duree: 3600,
    pistes: [
      { type: 'pli', ids: ['h-g', 'h-d', 'h-g-in', 'h-d-in'], axe: [Mg, Md], sens: 1, de: 0, a: 0.42 },
      {
        type: 'morph',
        de: 0.5,
        a: 1,
        vers: {
          'h-g-in': [C, BG, Mb],
          'h-d-in': [C, Mb, BD],
          'b-g-in': [C, Mb, BG],
          'b-d-in': [C, BD, Mb],
        },
        ombres: { 'h-g-in': 0.2, 'h-d-in': 0.2, 'b-g-in': 0.2, 'b-d-in': 0.2 },
      },
    ],
  },
};

const etape4: Etape = {
  titre: 'Les pattes avant',
  consigne:
    'Couche du dessus : remontez les deux coins du bas du triangle jusqu’à sa pointe. Ce sont les pattes avant.',
  figure: {
    cadre: CADRE_GRENOUILLE,
    plans: [
      corpsEntier(),
      plan('triangle', [C, BG, BD]),
      plan('fixe-g', [C, P, Mb]),
      plan('fixe-d', [C, Mb, Pd]),
      rabat('coin-g', [P, BG, Mb]),
      rabat('coin-d', [Pd, Mb, BD]),
    ],
    lignes: [v(P, Mb), v(Pd, Mb)],
    fleches: [f(pt(-46, 46), pt(-6, 6), 'devant', 0.3), f(pt(46, 46), pt(6, 6), 'devant', -0.3)],
  },
  geste: {
    duree: 2800,
    pistes: [
      { type: 'pli', ids: ['coin-g'], axe: [P, Mb], sens: 1, de: 0, a: 0.65 },
      { type: 'pli', ids: ['coin-d'], axe: [Pd, Mb], sens: 1, de: 0.35, a: 1 },
    ],
  },
};

/** La tête : le triangle et le losange des pattes avant. */
const tete = (): Plan[] => [
  plan('triangle', [C, BG, BD], 'recto', 0.1),
  rabat('patte-g', [C, P, Mb]),
  rabat('patte-d', [C, Mb, Pd]),
];

const etape5: Etape = {
  titre: 'Affiner le corps',
  consigne:
    'Rabattez les bords de gauche et de droite du corps sur la ligne du milieu, en les glissant sous le triangle de la tête.',
  figure: {
    cadre: CADRE_GRENOUILLE,
    plans: [
      plan('milieu', rect(-q, q, u, yBas), 'verso'),
      plan('cote-g', rect(-u, -q, u, yBas), 'verso'),
      plan('cote-d', rect(q, u, u, yBas), 'verso'),
      ...tete(),
    ],
    lignes: [v(pt(-q, u), pt(-q, yBas)), v(pt(q, u), pt(q, yBas))],
    fleches: [f(pt(-44, 96), pt(-6, 96), 'devant', -0.4), f(pt(44, 96), pt(6, 96), 'devant', 0.4)],
  },
  geste: {
    duree: 2600,
    pistes: [
      { type: 'pli', ids: ['cote-g'], axe: [pt(-q, u), pt(-q, yBas)], sens: 1, de: 0, a: 0.65 },
      { type: 'pli', ids: ['cote-d'], axe: [pt(q, yBas), pt(q, u)], sens: 1, de: 0.35, a: 1 },
    ],
  },
};

const couture = v(pt(0, u), pt(0, yRemonte), 'marque');

const etape6: Etape = {
  titre: 'Remonter le bas',
  consigne: 'Remontez le bas du corps jusqu’à la base de la tête. Marquez bien le pli.',
  figure: {
    cadre: CADRE_GRENOUILLE,
    plans: [plan('corps', rect(-q, q, u, yRemonte)), rabat('bas', rect(-q, q, yRemonte, yBas)), ...tete()],
    lignes: [v(pt(-q, yRemonte), pt(q, yRemonte)), v(pt(0, u), pt(0, yBas), 'marque')],
    fleches: [f(pt(-8, yBas - 4), pt(-8, u + 6), 'devant', 0.5)],
  },
  geste: {
    duree: 2400,
    pistes: [{ type: 'pli', ids: ['bas'], axe: [pt(-q, yRemonte), pt(q, yRemonte)], sens: 1 }],
  },
};

const etape7: Etape = {
  titre: 'Le ressort',
  consigne:
    'Repliez ce même rabat vers le bas, en deux : son bord vient sur le pli du bas. Ce petit accordéon, c’est le ressort de la grenouille.',
  astuce: 'Plus l’accordéon est bien marqué, plus la grenouille saute haut.',
  figure: {
    cadre: CADRE_GRENOUILLE,
    plans: [
      plan('corps', rect(-q, q, u, yRemonte)),
      rabat('bas-bas', rect(-q, q, yRessort, yRemonte)),
      rabat('bas-haut', rect(-q, q, u, yRessort)),
      ...tete(),
    ],
    lignes: [v(pt(-q, yRessort), pt(q, yRessort)), couture],
    fleches: [f(pt(-8, u + 4), pt(-8, yRemonte - 4), 'devant', -0.6)],
  },
  geste: {
    duree: 2200,
    pistes: [{ type: 'pli', ids: ['bas-haut'], axe: [pt(-q, yRessort), pt(q, yRessort)], sens: 1 }],
  },
};

/** Un œil : un disque blanc et sa pupille. */
const disque = (c: Pt, r: number, n = 10): Pt[] =>
  Array.from({ length: n }, (_, i) => pt(c[0] + r * Math.cos((2 * Math.PI * i) / n), c[1] + r * Math.sin((2 * Math.PI * i) / n)));
const yeux = (): Plan[] =>
  [-1, 1].flatMap((s) => [
    plan(`oeil-${s}`, disque(pt(s * 15, 0.5 * u), 8), 'verso'),
    plan(`pupille-${s}`, disque(pt(s * 15 + 1.5, 0.5 * u + 1), 3.6), 'recto', 0.7),
  ]);

// Pattes arrière : le coin du bas de chaque rabat de côté est tiré vers l'extérieur et aplati en biais.
const yGenou = u + 8;
const jambeCachee: Pt[] = [pt(-q, yGenou), pt(0, yRemonte), pt(-q, yRemonte)];
const jambeSortie: Pt[] = [pt(-q, yGenou), pt(-q - 30, yRemonte + 12), pt(-q, yRemonte)];
const jambes = (sorties: boolean): Plan[] => {
  const g = sorties ? jambeSortie : jambeCachee;
  return [rabat('jambe-g', g), rabat('jambe-d', g.map(miroir).reverse())];
};

const etape8: Etape = {
  titre: 'Les pattes arrière',
  consigne:
    'Glissez un doigt sous le bas du corps et tirez le coin intérieur de chaque rabat de côté vers l’extérieur. Aplatissez-le en biais : une patte arrière dépasse de chaque côté.',
  astuce: 'Tirez les deux pattes de la même longueur, sinon la grenouille sautera de travers.',
  figure: {
    cadre: CADRE_GRENOUILLE,
    plans: [
      ...jambes(false),
      plan('corps', rect(-q, q, u, yRemonte)),
      rabat('bas-bas', rect(-q, q, yRessort, yRemonte)),
      rabat('bas-haut', rect(-q, q, yRessort, yRemonte)),
      ...tete(),
    ],
    lignes: [couture],
    fleches: [f(pt(-6, yRemonte - 6), pt(-q - 26, yRemonte + 8), 'tirer'), f(pt(6, yRemonte - 6), pt(q + 26, yRemonte + 8), 'tirer')],
  },
  geste: {
    duree: 2400,
    pistes: [
      {
        type: 'morph',
        vers: { 'jambe-g': jambeSortie, 'jambe-d': jambeSortie.map(miroir).reverse() },
      },
    ],
  },
};

/** La grenouille vue de dessus, une fois retournée. */
const grenouilleFinie = (): Plan[] => [
  ...jambes(true),
  plan('corps', rect(-q, q, u, yRemonte), 'recto', 0.1),
  plan('tete', [C, BD, BG]),
  ...yeux(),
];
const saut = (dy: number): Record<string, Pt[]> =>
  Object.fromEntries(grenouilleFinie().map((p) => [p.id, p.pts.map((x) => pt(x[0], x[1] + dy))]));

const etape9: Etape = {
  titre: 'Retourner et faire sauter',
  consigne:
    'Retournez la grenouille, dessinez-lui des yeux. Posez-la sur une table, appuyez du bout du doigt sur l’arrière, puis faites glisser le doigt : hop, elle saute !',
  astuce: 'Organisez une course de grenouilles : la première arrivée au bout de la table a gagné.',
  figure: {
    cadre: CADRE_GRENOUILLE,
    plans: grenouilleFinie(),
    fleches: [f(pt(0, yRemonte + 26), pt(0, yRemonte - 8), 'pousser')],
  },
  geste: {
    duree: 1800,
    pistes: [
      { type: 'morph', de: 0, a: 0.45, vers: saut(-36) },
      { type: 'morph', de: 0.5, a: 1, vers: saut(0) },
    ],
  },
};

const illustration: Figure = {
  cadre: [-66, -8, 132, 112],
  plans: grenouilleFinie(),
};

export const grenouille: Modele = {
  id: 'grenouille',
  nom: 'La grenouille sauteuse',
  sousTitre: 'Pyon-pyon gaeru',
  kana: 'ぴょんぴょん',
  niveau: 2,
  duree: '10 min',
  feuille: 'Une fiche bristol (environ 7,5 × 12,5 cm), ou un rectangle de papier épais',
  resume:
    'Elle saute pour de vrai ! Une tête en bombe à eau, deux pattes arrière et un corps replié en accordéon qui fait ressort. Parfait pour les courses en famille.',
  papier: { recto: '#7cc39a', verso: '#dcf1e4' },
  illustration,
  etapes: [etape1, etape2, etape3, etape4, etape5, etape6, etape7, etape8, etape9],
};
