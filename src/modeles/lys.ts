import { add, intersection, norm, plan, pt, reflet, sub } from '../pliage/geo';
import type { Figure, Fleche, Ligne, Plan, Pt } from '../pliage/types';
import { etapesBaseCarree } from './grue';
import type { Etape, Modele } from './types';

/*
 * Le lys (yuri), à partir de la base carrée : quatre rabats écrasés, quatre plis pétales
 * (c'est la base de la grenouille), puis on affine et on ouvre les pétales.
 * On montre une face ; les autres se font de la même façon, en tournant les rabats comme des pages.
 */

const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };
const miroir = (p: Pt): Pt => pt(-p[0], p[1]);

// La base carrée (demi-diagonale h), ouverture vers le bas, comme pour la grue.
const h = 100;
const T2 = pt(0, -h);
const R2 = pt(h, 0);
const B2 = pt(0, h);
const L2 = pt(-h, 0);

// Écraser un rabat : son bord plié (T2-R2) vient sur la ligne du milieu, chaque couche se plie sur sa bissectrice.
const dirBissec = norm(add(norm(sub(B2, T2)), norm(sub(R2, T2))));
const Qd = intersection(T2, add(T2, dirBissec), R2, B2); // où la bissectrice coupe le bord du bas
const Qg = miroir(Qd);
const Rp = reflet(R2, T2, Qd); // le coin R2 arrive sur la ligne du milieu

// Pli pétale du losange écrasé : les bords du bas viennent sur la ligne du milieu.
const dirKite = norm(add(norm(sub(T2, B2)), norm(sub(Qd, B2))));
const Kd = intersection(B2, add(B2, dirKite), T2, Qd);
const Kg = miroir(Kd);
const Lc = reflet(Qg, B2, Kg); // les côtés rentrés se rejoignent ici
const pointePetale = reflet(B2, Kg, Kd); // la pointe monte jusqu'en haut

// Affiner : les bords du haut viennent sur la ligne du milieu.
const dirAffine = norm(add(norm(sub(B2, T2)), norm(sub(Kd, T2))));
const Nd = intersection(T2, add(T2, dirAffine), Kd, B2);
const Ng = miroir(Nd);
const Xd = intersection(T2, Nd, Kg, Kd); // le pli d'affinage croise la charnière des pétales
const Xg = miroir(Xd);

const CADRE_BASE = [-150, -128, 300, 256] as const;
const CADRE_ETROIT = [-110, -125, 220, 250] as const;
const CADRE_FLEUR = [-150, -130, 300, 260] as const;

const etape7: Etape = {
  titre: 'Écraser les rabats',
  consigne:
    'Ouverture vers le bas. Relevez le rabat de droite à la verticale, ouvrez-le en glissant un doigt dedans, puis écrasez-le bien à plat, symétriquement. Faites de même avec les trois autres rabats.',
  astuce: 'Pour atteindre les rabats suivants, tournez-les comme les pages d’un livre, puis retournez le pliage.',
  figure: {
    cadre: CADRE_BASE,
    plans: [
      plan('dos', [T2, R2, B2, L2], 'recto', 0.08),
      plan('c2A', [T2, Qd, B2], 'verso'),
      plan('c2B', [T2, R2, Qd], 'verso'),
      plan('c1A', [T2, Qd, B2]),
      plan('c1B', [T2, R2, Qd]),
    ],
    lignes: [v(T2, B2, 'marque'), v(T2, Qd)],
    fleches: [f(pt(84, 50), pt(18, 96), 'pousser'), f(pt(70, -40), pt(-30, -40), 'devant', 0.4)],
  },
  geste: {
    duree: 3800,
    pistes: [
      { type: 'pli', ids: ['c1A', 'c1B', 'c2A', 'c2B'], axe: [T2, B2], sens: 1, angle: 90, de: 0, a: 0.4 },
      {
        type: 'morph',
        de: 0.45,
        a: 1,
        vers: {
          c1A: [T2, Qg, B2],
          c1B: [T2, Rp, Qg],
          c2A: [T2, Qd, B2],
          c2B: [T2, Rp, Qd],
        },
      },
    ],
  },
};

const etape8: Etape = {
  titre: 'Le pli pétale',
  consigne:
    'Sur chaque face écrasée : soulevez la pointe du bas et faites-la monter jusqu’en haut, en laissant les côtés rentrer vers le milieu le long des plis. Aplatissez. Faites-le sur les quatre faces.',
  astuce: 'C’est le même geste que pour la grue. Marquez d’abord les plis (côtés au milieu, haut rabattu) puis dépliez.',
  figure: {
    cadre: CADRE_BASE,
    plans: [
      plan('dos', [T2, Qd, B2, Qg], 'recto', 0.1),
      plan('tt', [T2, Kd, Kg]),
      plan('lf', [Kg, Qg, B2], 'verso'),
      plan('rf', [Kd, B2, Qd], 'verso'),
      plan('mt', [Kg, Kd, B2], 'verso'),
      plan('ls', [Kg, B2, Qg], 'verso'),
      plan('rs', [Kd, Qd, B2], 'verso'),
    ],
    lignes: [v(T2, B2, 'marque'), v(Kg, Kd), v(B2, Kg, 'montagne'), v(B2, Kd, 'montagne')],
    fleches: [
      f(pt(8, 92), pt(8, -84), 'devant', -0.2),
      f(pt(-100, 34), pt(-66, 34), 'pousser'),
      f(pt(100, 34), pt(66, 34), 'pousser'),
    ],
  },
  geste: {
    duree: 3400,
    pistes: [
      {
        type: 'morph',
        vers: {
          lf: [Kg, Lc, B2],
          rf: [Kd, B2, Lc],
          mt: [Kg, Kd, pointePetale],
          ls: [Kg, pointePetale, Lc],
          rs: [Kd, Lc, pointePetale],
        },
      },
    ],
  },
};

/** Écraser puis plier en pétale : la base de la grenouille, reprise par la grenouille traditionnelle. */
export const etapesBaseGrenouille: Etape[] = [etape7, etape8];
/** Les repères de la base de la grenouille (vue d'une face). */
export const baseGrenouilleRepere = { T2, B2, Kd, Kg };

const baseGrenouille = (): Plan[] => [
  plan('dos', [T2, Kd, B2, Kg], 'recto', 0.1),
  plan('lf', [Kg, Lc, B2], 'verso'),
  plan('rf', [Kd, B2, Lc], 'verso'),
  plan('petale', [Kg, Kd, pointePetale]),
];

const etape9: Etape = {
  titre: 'Rabattre les pétales',
  consigne:
    'Vous tenez la base de la grenouille. Rabattez le pétale du dessus vers le bas, le long de sa charnière. Faites de même sur les quatre faces.',
  figure: {
    cadre: CADRE_BASE,
    plans: baseGrenouille(),
    lignes: [v(Kg, Kd)],
    fleches: [f(pt(10, -88), pt(10, 88), 'devant', -0.3)],
  },
};

const etape10: Etape = {
  titre: 'Affiner le haut',
  consigne:
    'Sur la couche du dessus, rabattez les deux bords du haut sur la ligne du milieu. Tournez les rabats et recommencez sur les quatre faces : le haut devient une tige fine.',
  astuce: 'Le papier devient épais : appuyez bien et prenez votre temps sur les dernières faces.',
  figure: {
    cadre: CADRE_ETROIT,
    plans: [plan('dos', [T2, Kd, B2, Kg], 'recto', 0.1), plan('haut', [T2, Kd, Kg]), plan('petale', [Kg, Kd, B2], 'verso')],
    lignes: [v(T2, Nd), v(T2, Ng), v(T2, B2, 'marque')],
    fleches: [f(pt(-36, -6), pt(-6, -30), 'devant', -0.4), f(pt(36, -6), pt(6, -30), 'devant', 0.4)],
  },
};

// La fleur, tête en haut : on retourne le pliage bout pour bout (rotation d'un demi-tour).
const rot = (p: Pt): Pt => pt(-p[0], -p[1]);
const tige: Pt[] = [rot(Xd), rot(Xg), rot(T2)];
const petaleRot: Pt[] = [rot(Xg), rot(Xd), rot(Nd), rot(B2), rot(Ng)];
const charniereG = rot(Xd);
const charniereD = rot(Xg);

const etape11: Etape = {
  titre: 'Ouvrir les pétales',
  consigne:
    'Tournez le pliage, la tige vers le bas. Rabattez chacun des quatre pétales vers l’extérieur, le long de sa charnière : le lys s’ouvre.',
  figure: {
    cadre: CADRE_FLEUR,
    plans: [
      plan('p-g', petaleRot, 'verso'),
      plan('p-d', petaleRot, 'verso'),
      plan('coeur', petaleRot, 'recto', 0.12),
      plan('tige', tige),
      plan('p-av', petaleRot),
    ],
    lignes: [v(charniereG, charniereD)],
    fleches: [
      f(pt(-20, -70), pt(-96, -10), 'devant', 0.35),
      f(pt(20, -70), pt(96, -10), 'devant', -0.35),
      f(pt(4, -94), pt(4, 70), 'devant', -0.3),
    ],
  },
  geste: {
    duree: 3600,
    pistes: [
      { type: 'pli', ids: ['p-av'], axe: [charniereG, charniereD], sens: 1, angle: 140, de: 0, a: 0.6 },
      { type: 'rotation', ids: ['p-g'], pivot: charniereG, angle: -54, de: 0.25, a: 0.85 },
      { type: 'rotation', ids: ['p-d'], pivot: charniereD, angle: 54, de: 0.4, a: 1 },
    ],
  },
};

/** Le lys ouvert, pour l'étape finale et l'illustration. */
const enrouler = (pts: Pt[], pivot: Pt, angle: number): Pt[] => {
  const r = (angle * Math.PI) / 180;
  return pts.map((p) => {
    const d = sub(p, pivot);
    return add(pivot, pt(d[0] * Math.cos(r) - d[1] * Math.sin(r), d[0] * Math.sin(r) + d[1] * Math.cos(r)));
  });
};
const avantRabattu = petaleRot.map((p) => {
  // Le pétale de devant, rabattu vers soi : vu un peu raccourci, sous la charnière.
  const y = charniereG[1] + (charniereG[1] - p[1]) * 0.55;
  return pt(p[0] * 1.08, y);
});
const pointeG = enrouler([rot(B2)], charniereG, -54)[0];
const pointeD = enrouler([rot(B2)], charniereD, 54)[0];
const lysOuvert = (): Plan[] => [
  plan('p-g', enrouler(petaleRot, charniereG, -54), 'verso'),
  plan('p-d', enrouler(petaleRot, charniereD, 54), 'verso'),
  plan('coeur', petaleRot, 'recto', 0.12),
  plan('tige', tige),
  plan('p-av', avantRabattu, 'verso'),
];

const etape12: Etape = {
  titre: 'Friser les pétales',
  consigne:
    'Enroulez le bout de chaque pétale autour d’un crayon pour le friser vers l’extérieur. Votre lys est en fleur.',
  astuce: 'Plusieurs lys de couleurs différentes, piqués sur des tiges en bambou, font un joli bouquet qui ne fane jamais.',
  figure: {
    cadre: CADRE_FLEUR,
    plans: lysOuvert(),
    fleches: [
      f(add(pointeG, pt(2, -10)), add(pointeG, pt(10, 22)), 'devant', 0.9),
      f(add(pointeD, pt(-2, -10)), add(pointeD, pt(-10, 22)), 'devant', -0.9),
    ],
  },
};

const illustration: Figure = {
  cadre: [-140, -112, 280, 222],
  plans: lysOuvert(),
};

export const lys: Modele = {
  id: 'lys',
  nom: 'Le lys',
  sousTitre: 'Yuri',
  kana: 'ゆり',
  niveau: 3,
  duree: '25 min',
  feuille: 'Feuille carrée de 15 × 15 cm, fine, et un crayon pour friser les pétales',
  resume:
    'Une fleur qui ne fane jamais. Quatre plis écrasés et quatre plis pétales, sur chaque face : la patience est récompensée.',
  papier: { recto: '#ef8fb1', verso: '#fde3ec' },
  illustration,
  etapes: [...etapesBaseCarree, etape7, etape8, etape9, etape10, etape11, etape12],
};
