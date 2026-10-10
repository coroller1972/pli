import { plan, pt, rabat, tourne } from '../pliage/geo';
import type { Figure, Fleche, Ligne, Plan, Pt } from '../pliage/types';
import { cadreDe } from './outils';
import type { Etape, Modele } from './types';

/*
 * Le marque-page d'angle (Nick Robinson), d'après la séquence présentée par origami.me.
 * Deux pointes au centre, plié en deux, deux coins sur le milieu, puis les pointes du haut
 * rentrent dans la poche : un triangle qui coiffe le coin d'une page.
 */

const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };

// La feuille en losange (demi-diagonale D).
const D = 100;
const O = pt(0, 0);
const T = pt(0, -D);
const R = pt(D, 0);
const B = pt(0, D);
const L = pt(-D, 0);
const h = D / 2;
const HG = pt(-h, -h); // milieux des bords
const HD = pt(h, -h);
const BD = pt(h, h);
const BG = pt(-h, h);
const Ht = pt(0, -D); // pointe du haut, une fois le coin rabattu

const CADRE_FEUILLE = [-130, -130, 260, 260] as const;
const CADRE_HEXAGONE = [-125, -80, 250, 160] as const;
const CADRE_TRAPEZE = [-125, -118, 250, 150] as const;

const etape1: Etape = {
  titre: 'Marquer la diagonale',
  consigne:
    'Feuille en losange, face blanche vers vous (le côté à motif dessous). Rabattez la pointe du haut sur celle du bas, marquez, puis dépliez.',
  astuce: 'Un papier à motifs (chiyogami) fait un très joli marque-page.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [plan('feuille', [T, R, B, L], 'verso')],
    lignes: [v(L, R)],
    fleches: [f(pt(16, -86), pt(16, 84), 'devant', -0.25)],
  },
};

const etape2: Etape = {
  titre: 'Marquer le milieu, en bas',
  consigne:
    'Pliez la moitié du bas en deux, de gauche à droite, juste assez pour marquer le pli du milieu sous la diagonale. Dépliez.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [plan('feuille', [T, R, B, L], 'verso')],
    lignes: [v(L, R, 'marque'), v(O, B)],
    fleches: [f(pt(-66, 30), pt(66, 30), 'devant', -0.3)],
  },
};

const etape3: Etape = {
  titre: 'La pointe du haut au centre',
  consigne: 'Rabattez la pointe du haut jusqu’au centre de la feuille.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [plan('corps', [HG, HD, R, B, L], 'verso'), plan('haut', [HG, T, HD], 'verso')],
    lignes: [v(L, R, 'marque'), v(O, B, 'marque'), v(HG, HD)],
    fleches: [f(pt(10, -84), pt(10, -8), 'devant', -0.4)],
  },
  geste: { duree: 2200, pistes: [{ type: 'pli', ids: ['haut'], axe: [HG, HD], sens: 1 }] },
};

const etape4: Etape = {
  titre: 'La pointe du bas au centre',
  consigne: 'Même chose en bas : la pointe du bas monte jusqu’au centre. Vous obtenez un hexagone.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [plan('corps', [HG, HD, R, BD, BG, L], 'verso'), plan('haut', [HG, HD, O]), plan('bas', [BG, B, BD], 'verso')],
    lignes: [v(L, R, 'marque'), v(BG, BD)],
    fleches: [f(pt(-10, 84), pt(-10, 8), 'devant', -0.4)],
  },
  geste: { duree: 2200, pistes: [{ type: 'pli', ids: ['bas'], axe: [BG, BD], sens: 1 }] },
};

const etape5: Etape = {
  titre: 'Plier en deux',
  consigne: 'Pliez l’hexagone en deux le long de la diagonale : le bas remonte sur le haut. Le motif apparaît.',
  figure: {
    cadre: CADRE_HEXAGONE,
    plans: [
      plan('haut-trap', [L, HG, HD, R], 'verso'),
      plan('haut-pointe', [HG, HD, O]),
      plan('bas-trap', [L, R, BD, BG], 'verso'),
      // Une fois remontée, la pointe du bas passe sous la couche qui la porte.
      { ...plan('bas-pointe', [BG, O, BD]), zRetourne: 1.5 },
    ],
    lignes: [v(pt(-D - 8, 0), pt(D + 8, 0))],
    fleches: [f(pt(-12, h - 6), pt(-12, -h + 6), 'devant', 0.45)],
  },
  geste: { duree: 2400, pistes: [{ type: 'pli', ids: ['bas-trap', 'bas-pointe'], axe: [L, R], sens: 1 }] },
};

const triangleG: Pt[] = [L, HG, O];
const triangleM: Pt[] = [HG, HD, O];
const triangleD: Pt[] = [O, HD, R];
const coinG: Pt[] = [Ht, HG, O]; // le coin de gauche, une fois rabattu
const coinD: Pt[] = [Ht, O, HD];

const etape6: Etape = {
  titre: 'Le coin gauche sur le milieu',
  consigne:
    'Rabattez le coin de gauche vers le haut, le long d’un pli qui part du coin du haut : son bord du bas se pose sur le pli du milieu.',
  figure: {
    cadre: CADRE_TRAPEZE,
    plans: [rabat('milieu', triangleM), rabat('droite', triangleD), rabat('gauche', triangleG)],
    lignes: [v(HG, O), v(O, pt(0, -h), 'marque')],
    fleches: [f(pt(-70, -8), pt(-14, -76), 'devant', 0.35)],
  },
  geste: { duree: 2400, pistes: [{ type: 'pli', ids: ['gauche'], axe: [HG, O], sens: 1 }] },
};

const etape7: Etape = {
  titre: 'Puis le coin droit',
  consigne: 'Même geste à droite : le coin monte et se pose contre le premier. Vous obtenez un carré posé sur la pointe.',
  figure: {
    cadre: CADRE_TRAPEZE,
    plans: [rabat('milieu', triangleM), rabat('droite', triangleD), rabat('gauche', coinG)],
    lignes: [v(O, HD)],
    fleches: [f(pt(70, -8), pt(14, -76), 'devant', -0.35)],
  },
  geste: { duree: 2400, pistes: [{ type: 'pli', ids: ['droite'], axe: [O, HD], sens: 1 }] },
};

const etape8: Etape = {
  titre: 'Retourner',
  consigne: 'Retournez le pliage.',
  figure: {
    cadre: CADRE_TRAPEZE,
    plans: [rabat('milieu', triangleM), rabat('droite', coinD), rabat('gauche', coinG)],
    fleches: [f(pt(66, -96), pt(66, -96), 'retourner')],
  },
};

// Vu de l'autre côté : le triangle du bas devant, et les deux moitiés de la pointe du haut, séparées par la fente.
const hautG: Pt[] = [Ht, HG, pt(0, -h)];
const hautD: Pt[] = [Ht, pt(0, -h), HD];
const dos = (): Plan[] => [rabat('haut-g', hautG), rabat('haut-d', hautD), rabat('bas', triangleM)];

const etape9: Etape = {
  titre: 'Marquer le pli de la poche',
  consigne: 'Rabattez les deux pointes du haut sur la pointe du bas, marquez bien, puis dépliez.',
  figure: {
    cadre: CADRE_TRAPEZE,
    plans: dos(),
    lignes: [v(HG, HD)],
    fleches: [f(pt(-12, -96), pt(-12, -8), 'devant', 0.3), f(pt(12, -96), pt(12, -8), 'devant', -0.3)],
  },
};

const etape10: Etape = {
  titre: 'Rentrer dans la poche',
  consigne:
    'Ouvrez la poche du triangle du bas et glissez-y les deux pointes du haut, le long du pli marqué. Il ne reste qu’un triangle.',
  astuce: 'Entrouvrez la poche du bout du doigt : les pointes s’y glissent toutes seules.',
  figure: {
    cadre: CADRE_TRAPEZE,
    plans: [
      { ...rabat('haut-g', hautG), zRetourne: -2 },
      { ...rabat('haut-d', hautD), zRetourne: -1 },
      rabat('bas', triangleM),
    ],
    lignes: [v(HG, HD, 'montagne')],
    fleches: [f(pt(-12, -90), pt(-12, -30), 'pousser'), f(pt(12, -90), pt(12, -30), 'pousser')],
  },
  geste: { duree: 2600, pistes: [{ type: 'pli', ids: ['haut-g', 'haut-d'], axe: [HG, HD], sens: -1 }] },
};

// Le marque-page posé sur le coin d'une page : l'angle droit du triangle coiffe le coin.
const coinPage = pt(60, -70);
const surLaPage = (p: Pt): Pt => {
  const q = tourne(p, O, -135);
  return pt(q[0] + coinPage[0], q[1] + coinPage[1]);
};
const lignesTexte: Ligne[] = [0, 1, 2, 3, 4, 5, 6].map((i) => {
  const y = coinPage[1] + 24 + i * 16;
  const fin = i < 2 ? coinPage[0] - 70 : coinPage[0] - 14;
  return { a: pt(coinPage[0] - 150, y), b: pt(fin, y), type: 'marque' };
});
const page = (): Plan => ({ ...plan('page', [pt(-110, coinPage[1]), coinPage, pt(coinPage[0], 70), pt(-110, 70)], 'verso'), teinte: '#fffdf8' });
const marquePagePose = (): Plan[] => [page(), rabat('marque-page', triangleM.map(surLaPage))];

const etape11: Etape = {
  titre: 'Le marque-page est prêt',
  consigne: 'Glissez le coin d’une page dans la poche : le marque-page garde votre place sans corner le livre.',
  astuce: 'Pliez-en plusieurs dans des papiers différents : un par livre de la famille !',
  figure: {
    cadre: cadreDe(marquePagePose(), 0.08),
    plans: marquePagePose(),
    lignes: lignesTexte,
  },
};

const illustration: Figure = {
  cadre: cadreDe(marquePagePose(), 0.04),
  plans: marquePagePose(),
  lignes: lignesTexte,
};

export const marquePage: Modele = {
  id: 'marque-page',
  nom: 'Le marque-page',
  sousTitre: 'Marque-page d’angle (Nick Robinson)',
  kana: 'しおり',
  niveau: 1,
  duree: '5 min',
  feuille: 'Feuille carrée de 10 × 10 cm, à motif d’un côté',
  resume:
    'Un petit triangle à glisser sur le coin d’une page, pour ne jamais perdre sa place. D’après le modèle de Nick Robinson présenté par origami.me.',
  papier: { recto: '#7fb8b4', verso: '#ffffff' },
  illustration,
  etapes: [etape1, etape2, etape3, etape4, etape5, etape6, etape7, etape8, etape9, etape10, etape11],
};
