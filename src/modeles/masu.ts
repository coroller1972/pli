import { aire, autreFace, plan, pt } from '../pliage/geo';
import type { Face, Figure, Fleche, Ligne, Plan, Pt } from '../pliage/types';
import type { Etape, Modele } from './types';

/*
 * La boîte masu, la petite boîte carrée des fêtes japonaises.
 * Vue de dessus pour les plis à plat, puis vue de biais (projection isométrique) pour la mise en volume :
 * chaque morceau de papier est placé en 3D, état par état, puis projeté.
 */

const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };

// La boîte finie : fond carré de côté 2H, murs de hauteur H. La feuille, posée en losange, a une demi-diagonale 4H.
const H = 35;
const D = 4 * H;
const T = pt(0, -D);
const R = pt(D, 0);
const B = pt(0, D);
const L = pt(-D, 0);
const O = pt(0, 0);
const m = 2 * H; // le carré obtenu en rabattant les coins au centre va de -m à m
const hg = pt(-m, -m);
const hd = pt(m, -m);
const bd = pt(m, m);
const bg = pt(-m, m);

const CADRE_FEUILLE = [-170, -170, 340, 340] as const;
const CADRE_CARRE = [-100, -100, 200, 200] as const;
const CADRE_OUVERT = [-160, -100, 320, 200] as const;

// ─── Vue de dessus ─────────────────────────────────────────────────────────────

const etape1: Etape = {
  titre: 'Marquer les diagonales',
  consigne:
    'Feuille en losange, face colorée dessous. Pliez en deux de haut en bas, dépliez, puis de gauche à droite, dépliez. Le centre est marqué.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [plan('feuille', [T, R, B, L], 'verso')],
    lignes: [v(L, R), v(T, B)],
    fleches: [f(pt(16, -120), pt(16, 118), 'devant', -0.25)],
  },
};

const coins = (): Plan[] => [
  plan('c-h', [hg, T, hd], 'verso'),
  plan('c-d', [hd, R, bd], 'verso'),
  plan('c-b', [bd, B, bg], 'verso'),
  plan('c-g', [bg, L, hg], 'verso'),
];

const etape2: Etape = {
  titre: 'Les quatre coins au centre',
  consigne: 'Rabattez les quatre coins exactement au centre. Vous obtenez un carré, face colorée vers vous.',
  astuce: 'Un coin à la fois, en posant la pointe pile sur le centre : la boîte sera d’autant plus carrée.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [plan('carre', [hg, hd, bd, bg], 'verso'), ...coins()],
    lignes: [v(L, R, 'marque'), v(T, B, 'marque'), v(hg, hd), v(hd, bd), v(bd, bg), v(bg, hg)],
    fleches: [0, 1, 2, 3].map((i) => {
      const [de, vers] = [
        [pt(-10, -122), pt(-10, -14)],
        [pt(122, -10), pt(14, -10)],
        [pt(10, 122), pt(10, 14)],
        [pt(-122, 10), pt(-14, 10)],
      ][i] as [Pt, Pt];
      return f(de, vers, 'devant', 0.3);
    }),
  },
  geste: {
    duree: 3600,
    pistes: [
      { type: 'pli', ids: ['c-h'], axe: [hg, hd], sens: 1, de: 0, a: 0.4 },
      { type: 'pli', ids: ['c-d'], axe: [hd, bd], sens: 1, de: 0.2, a: 0.6 },
      { type: 'pli', ids: ['c-b'], axe: [bd, bg], sens: 1, de: 0.4, a: 0.8 },
      { type: 'pli', ids: ['c-g'], axe: [bg, hg], sens: 1, de: 0.6, a: 1 },
    ],
  },
};

const coinsRabattus = (): Plan[] => [
  plan('carre', [hg, hd, bd, bg], 'verso'),
  plan('c-h', [hg, O, hd]),
  plan('c-d', [hd, O, bd]),
  plan('c-b', [bd, O, bg]),
  plan('c-g', [bg, O, hg]),
];

const etape3: Etape = {
  titre: 'Marquer le quadrillage',
  consigne:
    'Pliez le bord du haut jusqu’au centre, marquez bien, dépliez. Faites de même avec les trois autres bords.',
  astuce: 'Ces quatre plis dessinent le fond de la boîte : plus ils sont nets, plus la boîte se montera facilement.',
  figure: {
    cadre: CADRE_CARRE,
    plans: coinsRabattus(),
    lignes: [v(pt(-m, -H), pt(m, -H)), v(pt(-m, H), pt(m, H)), v(pt(-H, -m), pt(-H, m)), v(pt(H, -m), pt(H, m))],
    fleches: [f(pt(-20, -66), pt(-20, -6), 'devant', 0.45)],
  },
};

const etape4: Etape = {
  titre: 'Ouvrir deux coins',
  consigne: 'Dépliez les coins de gauche et de droite. Les coins du haut et du bas restent pliés.',
  figure: {
    cadre: CADRE_OUVERT,
    plans: coinsRabattus(),
    lignes: [v(pt(-m, -H), pt(m, -H), 'marque'), v(pt(-m, H), pt(m, H), 'marque')],
    fleches: [f(pt(-20, 0), pt(-126, 0), 'tirer'), f(pt(20, 0), pt(126, 0), 'tirer')],
  },
  geste: {
    duree: 2600,
    pistes: [
      { type: 'pli', ids: ['c-g'], axe: [bg, hg], sens: 1, de: 0, a: 0.7 },
      { type: 'pli', ids: ['c-d'], axe: [hd, bd], sens: 1, de: 0.3, a: 1 },
    ],
  },
};

// ─── Vue de biais : les morceaux de papier en 3D ───────────────────────────────

type P3 = readonly [number, number, number];
const COS30 = Math.cos(Math.PI / 6);
/** Projection isométrique : x vers la droite et le bas, y vers la gauche et le bas, z vers le haut. */
const iso = ([x, y, z]: P3): Pt => pt((x - y) * COS30, (x + y) * 0.5 - z);

interface Morceau {
  id: string;
  face: Face;
  /** Face montrée quand le morceau se retourne. */
  dos?: Face;
  /** Le morceau à plat, vu de dessus (feuille ouverte de l'étape 4). */
  plat: Pt[];
}

/**
 * Les morceaux d'un bout (gauche), décrits à plat. Le bout droit et le coin avant s'en déduisent par symétrie.
 * s = distance au pied du mur du bout (x = -H) : le mur va de s = 0 à H, la bande qui rentre de H à 2H, la pointe au-delà.
 */
const boutG: Morceau[] = [
  { id: 'mur', face: 'verso', plat: [pt(-H, -H), pt(-m, -H), pt(-m, H), pt(-H, H)] },
  { id: 'int', face: 'verso', plat: [pt(-m, -H), pt(-3 * H, -H), pt(-3 * H, H), pt(-m, H)] },
  { id: 'pointe', face: 'verso', plat: [pt(-3 * H, -H), L, pt(-3 * H, H)] },
  { id: 'gousset-h', face: 'verso', plat: [pt(-m, -m), pt(-m, -H), pt(-3 * H, -H)] },
  { id: 'gousset-b', face: 'verso', plat: [pt(-m, m), pt(-3 * H, H), pt(-m, H)] },
  // Le carré de coin, coupé par sa diagonale : une moitié est couverte par le rabat du haut.
  { id: 'coin-h-a', face: 'recto', dos: 'recto', plat: [pt(-H, -H), pt(-H, -m), pt(-m, -m)] },
  { id: 'coin-h-b', face: 'verso', plat: [pt(-H, -H), pt(-m, -m), pt(-m, -H)] },
  { id: 'coin-b-a', face: 'recto', dos: 'recto', plat: [pt(-H, H), pt(-m, m), pt(-H, m)] },
  { id: 'coin-b-b', face: 'verso', plat: [pt(-H, H), pt(-m, H), pt(-m, m)] },
];

/** Les positions 3D de chaque sommet d'un bout gauche, pour un état donné. */
type Etat3D = Record<string, P3[]>;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Un point du bout gauche, dans le plan du mur relevé de `b` degrés (s = distance au pied du mur). */
const dansLePlanDuBout = (s: number, y: number, b: number): P3 => [-H - s * Math.cos(rad(b)), y, s * Math.sin(rad(b))];

/** État A : les grands côtés sont debout, le bout se relève à moitié, les coins se pincent contre les grands côtés. */
function boutEtatA(b: number): Etat3D {
  const p = (s: number, y: number) => dansLePlanDuBout(s, y, b);
  return {
    mur: [p(0, -H), p(H, -H), p(H, H), p(0, H)],
    int: [p(H, -H), p(2 * H, -H), p(2 * H, H), p(H, H)],
    pointe: [p(2 * H, -H), p(3 * H, 0), p(2 * H, H)],
    'gousset-h': [[-m, -H, H], p(H, -H), p(2 * H, -H)],
    'gousset-b': [[-m, H, H], p(2 * H, H), p(H, H)],
    'coin-h-a': [[-H, -H, 0], [-H, -H, H], [-m, -H, H]],
    'coin-h-b': [[-H, -H, 0], [-m, -H, H], p(H, -H)],
    'coin-b-a': [[-H, H, 0], [-m, H, H], [-H, H, H]],
    'coin-b-b': [[-H, H, 0], p(H, H), [-m, H, H]],
  };
}

/** Les pinces de coin, une fois rentrées contre l'intérieur du bout. */
const pinces = {
  'coin-h-a': [[-H, -H, 0], [-H, -H, H], [-H, 0, H]] as P3[],
  'coin-h-b': [[-H, -H, 0], [-H, 0, H], [-H, -H, H]] as P3[],
  'coin-b-a': [[-H, H, 0], [-H, 0, H], [-H, H, H]] as P3[],
  'coin-b-b': [[-H, H, 0], [-H, H, H], [-H, 0, H]] as P3[],
};
const murDebout: P3[] = [
  [-H, -H, 0],
  [-H, -H, H],
  [-H, H, H],
  [-H, H, 0],
];

/** Le bout debout, la bande et la pointe dressées dans le prolongement du mur. */
const boutDresse: Etat3D = {
  mur: murDebout,
  int: [
    [-H, -H, H],
    [-H, -H, 2 * H],
    [-H, H, 2 * H],
    [-H, H, H],
  ],
  pointe: [
    [-H, -H, 2 * H],
    [-H, 0, 3 * H],
    [-H, H, 2 * H],
  ],
  'gousset-h': [
    [-H, 0, H],
    [-H, -H, H],
    [-H, -H, 2 * H],
  ],
  'gousset-b': [
    [-H, 0, H],
    [-H, H, 2 * H],
    [-H, H, H],
  ],
  ...pinces,
};

/** La bande et la pointe basculent par-dessus le bord, à l'horizontale au-dessus de la boîte. */
const boutBascule: Etat3D = {
  mur: murDebout,
  int: [
    [-H, -H, H],
    [0, -H, H],
    [0, H, H],
    [-H, H, H],
  ],
  pointe: [
    [0, -H, H],
    [H, 0, H],
    [0, H, H],
  ],
  'gousset-h': [
    [-H, 0, H],
    [-H, -H, H],
    [0, -H, H],
  ],
  'gousset-b': [
    [-H, 0, H],
    [0, H, H],
    [-H, H, H],
  ],
  ...pinces,
};

/** Le bout fermé : la bande tapisse l'intérieur du mur, la pointe se pose au fond. */
const e = 0.6; // petit écart, pour que la bande reste devant le mur
const boutFerme: Etat3D = {
  mur: murDebout,
  int: [
    [-H + e, -H, H],
    [-H + e, -H, 0],
    [-H + e, H, 0],
    [-H + e, H, H],
  ],
  pointe: [
    [-H + e, -H, 0],
    [0, 0, 0],
    [-H + e, H, 0],
  ],
  'gousset-h': [
    [-H + e, 0, H],
    [-H + e, -H, H],
    [-H + e, -H, 0],
  ],
  'gousset-b': [
    [-H + e, 0, H],
    [-H + e, H, 0],
    [-H + e, H, H],
  ],
  ...pinces,
};

// Les grands côtés, avec le rabat du haut (ou du bas) qui les double à l'intérieur.
const grandCote = (a: number, cote: 1 | -1): P3[] => {
  const d = H; // hauteur du mur
  const pied = cote * H;
  const haut: P3 = [0, pied + cote * d * Math.cos(rad(a)), d * Math.sin(rad(a))];
  return [
    [-H, pied, 0],
    [H, pied, 0],
    [H, haut[1], haut[2]],
    [-H, haut[1], haut[2]],
  ];
};

const symX = ([x, y, z]: P3): P3 => [-x, y, z];

/** Les morceaux d'un état, projetés : bout gauche, bout droit (symétrique), grands côtés, fond. */
interface Scene {
  gauche: Etat3D;
  droite: Etat3D;
  angleCotes: number;
}

const idG = (id: string) => `g-${id}`;
const idD = (id: string) => `d-${id}`;

function projeter(sc: Scene): Record<string, Pt[]> {
  const res: Record<string, Pt[]> = {};
  for (const mo of boutG) {
    res[idG(mo.id)] = sc.gauche[mo.id].map(iso);
    // Le bout droit est le reflet du gauche : l'ordre des sommets s'inverse pour garder l'orientation.
    res[idD(mo.id)] = sc.droite[mo.id].map(symX).map(iso);
  }
  res['cote-h'] = grandCote(sc.angleCotes, -1).map(iso);
  res['cote-b'] = grandCote(sc.angleCotes, 1).map(iso);
  res['fond'] = (
    [
      [-H, -H, 0],
      [H, -H, 0],
      [H, H, 0],
      [-H, H, 0],
    ] as P3[]
  ).map(iso);
  res['rabat-h'] = (
    [
      [-H, -H, 0],
      [H, -H, 0],
      [0, 0, 0],
    ] as P3[]
  ).map(iso);
  res['rabat-b'] = (
    [
      [H, H, 0],
      [-H, H, 0],
      [0, 0, 0],
    ] as P3[]
  ).map(iso);
  return res;
}

const plat3D = (p: Pt): P3 => [p[0], p[1], 0];
const scenePlate: Scene = {
  gauche: Object.fromEntries(boutG.map((mo) => [mo.id, mo.plat.map(plat3D)])),
  droite: Object.fromEntries(boutG.map((mo) => [mo.id, mo.plat.map(plat3D)])),
  angleCotes: 0,
};
const sceneCotesMiHauteur: Scene = { ...scenePlate, gauche: boutEtatA(12), droite: boutEtatA(12), angleCotes: 45 };
const sceneCotesDebout: Scene = { gauche: boutEtatA(28), droite: boutEtatA(28), angleCotes: 90 };
const sceneGaucheFermee: Scene = { ...sceneCotesDebout, gauche: boutFerme };
const sceneFinie: Scene = { ...sceneCotesDebout, gauche: boutFerme, droite: boutFerme };

/**
 * Ordre de dessin, du fond vers l'avant, pour un regard venant de l'avant droit.
 * Le bout gauche et le grand côté du haut sont derrière, le bout droit et le grand côté du bas devant.
 */
const ORDRE_DERRIERE = ['g-pointe', 'g-int', 'g-gousset-h', 'g-gousset-b', 'g-mur', 'g-coin-h-b', 'g-coin-h-a'];
const ORDRE_FERME_G = ['g-mur', 'g-coin-h-a', 'g-coin-h-b', 'g-coin-b-a', 'g-coin-b-b', 'g-gousset-h', 'g-gousset-b', 'g-int'];
const ORDRE_MILIEU = ['d-coin-h-a', 'd-coin-h-b', 'cote-h', 'fond', 'rabat-h', 'rabat-b'];
const ORDRE_DEVANT = ['d-pointe', 'd-int', 'd-gousset-h', 'd-gousset-b', 'd-mur', 'g-coin-b-b', 'g-coin-b-a', 'cote-b', 'd-coin-b-b', 'd-coin-b-a'];
const ORDRE_FERME_D = ['d-coin-h-a', 'd-coin-h-b', 'd-coin-b-a', 'd-coin-b-b', 'd-gousset-h', 'd-gousset-b', 'd-int', 'd-mur'];

const FACES: Record<string, { face: Face; dos?: Face; ombre?: number }> = {
  fond: { face: 'verso' },
  'rabat-h': { face: 'recto', dos: 'recto' },
  'rabat-b': { face: 'recto', dos: 'recto' },
  'cote-h': { face: 'recto', dos: 'recto', ombre: 0.08 },
  'cote-b': { face: 'recto', dos: 'recto' },
};
for (const mo of boutG) {
  FACES[idG(mo.id)] = { face: mo.face, dos: mo.dos };
  FACES[idD(mo.id)] = { face: mo.face, dos: mo.dos };
}

/**
 * Les plans d'une scène, dans l'ordre de dessin voulu.
 * La face visible se déduit de l'orientation projetée, comparée à celle de la feuille à plat :
 * si elle s'est inversée, on regarde l'autre côté du papier.
 */
function plansDe(sc: Scene, ordre: string[]): Plan[] {
  const pts = projeter(sc);
  const aPlat = projeter(scenePlate);
  return ordre.map((id) => {
    const { face, dos, ombre } = FACES[id];
    const retourne = Math.sign(aire(pts[id])) !== Math.sign(aire(aPlat[id]));
    const visible = retourne ? (dos ?? autreFace(face)) : face;
    const p = plan(id, pts[id], visible, ombre);
    // Pendant un geste, le moteur retourne la face à partir de celle de départ.
    return { ...p, dos: retourne ? face : (dos ?? autreFace(face)) };
  });
}

const CADRE_ISO = [-150, -120, 300, 220] as const;
const CADRE_BOITE = [-110, -110, 220, 170] as const;

const etape5: Etape = {
  titre: 'Relever les grands côtés',
  consigne:
    'Le pliage est maintenant vu de biais. Relevez les côtés du haut et du bas à la verticale, le long des plis du quadrillage. Les bouts se soulèvent à moitié et les coins se pincent tout seuls.',
  astuce: 'Pincez chaque coin entre le pouce et l’index pour l’aider à se replier vers l’intérieur.',
  figure: {
    cadre: CADRE_ISO,
    plans: plansDe(scenePlate, [...ORDRE_DERRIERE, 'g-coin-b-b', 'g-coin-b-a', ...ORDRE_MILIEU, ...ORDRE_DEVANT.filter((id) => !id.startsWith('g-'))]),
    fleches: [
      f(iso([0, -m, 0]), iso([0, -H, H + 10]), 'devant', 0.3),
      f(iso([0, m, 0]), iso([0, H, H + 10]), 'devant', -0.3),
    ],
  },
  geste: {
    duree: 3400,
    pistes: [
      { type: 'morph', de: 0, a: 0.5, vers: projeter(sceneCotesMiHauteur) },
      { type: 'morph', de: 0.5, a: 1, vers: projeter(sceneCotesDebout) },
    ],
  },
};

const ordreGaucheQuiSeFerme = [
  ...ORDRE_FERME_G,
  'g-coin-b-a',
  ...ORDRE_MILIEU,
  'g-pointe',
  ...ORDRE_DEVANT.filter((id) => !['g-coin-b-b', 'g-coin-b-a'].includes(id)),
];
const ordreSansDoublon = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) === i);

const etape6: Etape = {
  titre: 'Fermer un bout',
  consigne:
    'Relevez le bout de gauche à la verticale : les coins pincés se rangent à l’intérieur. Puis rabattez la pointe par-dessus le bord, dans la boîte, jusqu’au fond.',
  astuce: 'La pointe vient recouvrir les coins pincés et les tient en place : appuyez bien au fond de la boîte.',
  figure: {
    cadre: CADRE_ISO,
    plans: plansDe(sceneCotesDebout, ordreSansDoublon(ordreGaucheQuiSeFerme)),
    fleches: [f(iso([-2 * H - 20, 0, 60]), iso([-6, 0, H + 12]), 'devant', -0.4)],
  },
  geste: {
    duree: 4200,
    pistes: [
      { type: 'morph', de: 0, a: 0.4, vers: projeter({ ...sceneCotesDebout, gauche: boutDresse }) },
      { type: 'morph', de: 0.4, a: 0.7, vers: projeter({ ...sceneCotesDebout, gauche: boutBascule }) },
      { type: 'morph', de: 0.7, a: 1, vers: projeter(sceneGaucheFermee) },
    ],
  },
};

const ordreFini = ordreSansDoublon([...ORDRE_FERME_G, 'cote-h', 'fond', 'rabat-h', 'rabat-b', 'g-pointe', 'd-pointe', ...ORDRE_FERME_D, 'cote-b']);

const etape7: Etape = {
  titre: 'Fermer l’autre bout',
  consigne: 'Même geste de l’autre côté : relevez le bout, rentrez les coins, rabattez la pointe jusqu’au fond.',
  figure: {
    cadre: CADRE_ISO,
    plans: plansDe(sceneGaucheFermee, ordreSansDoublon(ordreGaucheQuiSeFerme)),
    fleches: [f(iso([2 * H + 30, 0, 50]), iso([4, 0, H + 14]), 'devant', 0.4)],
  },
};

const etape8: Etape = {
  titre: 'La boîte est prête',
  consigne:
    'Lissez le fond du bout des doigts et pincez les quatre arêtes du haut pour bien marquer les angles. La boîte masu tient toute seule, sans colle !',
  astuce: 'Pliez une deuxième boîte avec une feuille 1 cm plus grande : elle fera le couvercle.',
  figure: {
    cadre: CADRE_BOITE,
    plans: plansDe(sceneFinie, ordreFini),
  },
};

const illustration: Figure = {
  cadre: [-78, -84, 156, 128],
  plans: plansDe(sceneFinie, ordreFini),
};

export const masu: Modele = {
  id: 'masu',
  nom: 'La boîte masu',
  sousTitre: 'Masu',
  kana: 'ます',
  niveau: 3,
  duree: '15 min',
  feuille: 'Feuille carrée de 20 × 20 cm au moins, assez ferme',
  resume:
    'Une vraie boîte, sans colle ni ciseaux, pour ranger trésors et bonbons. Les plis sont simples ; la mise en volume demande des mains sûres.',
  papier: { recto: '#5eb7b2', verso: '#f6efe0' },
  illustration,
  etapes: [etape1, etape2, etape3, etape4, etape5, etape6, etape7, etape8],
};
