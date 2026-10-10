import { add, couper, intersection, lerpPt, milieu, norm, plan, pt, rabat, reflet, sub, tourne } from '../pliage/geo';
import type { Figure, Fleche, Ligne, Piste, Plan, Pt } from '../pliage/types';
import type { Etape, Modele } from './types';

/*
 * Le lapin (usagi), d'après la séquence présentée par origami.me (« Origami Rabbit »).
 * Triangle, coins sur la pointe, cerf-volant, deux rabats écrasés, puis on plie en deux :
 * le lapin se plie de profil. Oreilles relevées et affinées, tête rabattue par un pli écrasé,
 * petite queue en zigzag, museau rentré.
 *
 * Toute la géométrie est calculée à plat (vue de face), puis tournée pour la vue de profil :
 * de 30° pour les oreilles, de 45° une fois le lapin assis.
 */

const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };
const miroir = (p: Pt): Pt => pt(-p[0], p[1]);
const miroirs = (pts: Pt[]): Pt[] => pts.map(miroir).reverse();
const bissectrice = (sommet: Pt, a: Pt, b: Pt): Pt => add(sommet, add(norm(sub(a, sommet)), norm(sub(b, sommet))));

// ─── Vue de face ───────────────────────────────────────────────────────────────
const h = 62;
const O = pt(0, 0);
const T = pt(0, -2 * h);
const R = pt(2 * h, 0);
const L = pt(-2 * h, 0);
const B = pt(0, 2 * h);
const Mg = pt(-h, h);
const Md = pt(h, h);

// Cerf-volant : les bords du bas viennent sur la ligne du milieu.
const Kd = intersection(B, bissectrice(B, Md, O), O, Md);
const Kg = miroir(Kd);
const Lc = reflet(Md, B, Kd); // le coin du losange arrive sur la ligne du milieu
// Écraser : le pli part du coin Kd, sur la bissectrice, jusqu'à la ligne du milieu.
const P = intersection(Kd, bissectrice(Kd, Lc, B), O, B);
const Xd = reflet(P, B, Kd);
const Ls = milieu(P, Xd);
const Xg = miroir(Xd);

const CADRE_FEUILLE = [-160, -160, 320, 320] as const;
const CADRE_TRIANGLE = [-140, -24, 280, 176] as const;
const CADRE_LOSANGE = [-95, -18, 190, 158] as const;

const etape1: Etape = {
  titre: 'Plier en triangle',
  consigne: 'Feuille en losange, face blanche vers vous. Rabattez la pointe du haut sur celle du bas.',
  figure: {
    cadre: CADRE_FEUILLE,
    plans: [plan('feuille', [T, R, B, L], 'verso')],
    lignes: [v(L, R)],
    fleches: [f(pt(18, -104), pt(18, 102), 'devant', -0.25)],
  },
};

const etape2: Etape = {
  titre: 'Les coins sur la pointe',
  consigne: 'Rabattez les deux coins du haut sur la pointe du bas. Vous obtenez un carré posé sur la pointe.',
  figure: {
    cadre: CADRE_TRIANGLE,
    plans: [plan('fond', [O, Md, B, Mg]), rabat('coin-g', [L, O, Mg]), rabat('coin-d', [O, R, Md])],
    lignes: [v(O, Mg), v(O, Md)],
    fleches: [f(pt(-112, -8), pt(-8, 112), 'devant', 0.35), f(pt(112, -8), pt(8, 112), 'devant', -0.35)],
  },
  geste: {
    duree: 2800,
    pistes: [
      { type: 'pli', ids: ['coin-g'], axe: [O, Mg], sens: 1, de: 0, a: 0.65 },
      { type: 'pli', ids: ['coin-d'], axe: [Md, O], sens: 1, de: 0.35, a: 1 },
    ],
  },
};

const etape3: Etape = {
  titre: 'Les bords au milieu',
  consigne: 'Rabattez les deux bords du bas sur la ligne du milieu, comme pour un cerf-volant.',
  figure: {
    cadre: CADRE_LOSANGE,
    plans: [plan('fond', [O, Kd, B, Kg]), rabat('pan-g', [Mg, Kg, B]), rabat('pan-d', [Kd, Md, B])],
    lignes: [v(O, B, 'marque'), v(B, Kg), v(B, Kd)],
    fleches: [f(pt(-56, 66), pt(-8, 66), 'devant', -0.4), f(pt(56, 66), pt(8, 66), 'devant', 0.4)],
  },
  geste: {
    duree: 2600,
    pistes: [
      { type: 'pli', ids: ['pan-g'], axe: [Kg, B], sens: 1, de: 0, a: 0.65 },
      { type: 'pli', ids: ['pan-d'], axe: [B, Kd], sens: 1, de: 0.35, a: 1 },
    ],
  },
};

/** Les quatre morceaux d'un rabat écrasé, à droite (ar = couche de dessous, av = couche de dessus). */
const ecraseD = (): Plan[] => [
  rabat('d-ar-bas', [Kd, P, B]),
  rabat('d-av-bas', [Kd, Xd, B]),
  rabat('d-ar-haut', [Kd, Ls, P]),
  rabat('d-av-haut', [Kd, Ls, Xd]),
];
const ecraseG = (): Plan[] => [
  rabat('g-ar-bas', miroirs([Kd, P, B])),
  rabat('g-av-bas', miroirs([Kd, Xd, B])),
  rabat('g-ar-haut', miroirs([Kd, Ls, P])),
  rabat('g-av-haut', miroirs([Kd, Ls, Xd])),
];

/** Le geste d'écraser le rabat de droite : la couche de dessus se rouvre, le haut se rabat de part et d'autre. */
const pistesEcraser = (cote: 'd' | 'g'): Piste[] => {
  const m = cote === 'd' ? (p: Pt) => p : miroir;
  return [
    { type: 'pli', ids: [`${cote}-av-bas`], axe: [m(B), m(Kd)], sens: 1, de: 0, a: 0.6 },
    { type: 'morph', de: 0, a: 0.6, vers: { [`${cote}-av-haut`]: cote === 'd' ? [Kd, Ls, Xd] : miroirs([Kd, Ls, Xd]) } },
    { type: 'pli', ids: [`${cote}-ar-haut`], axe: [m(Kd), m(P)], sens: 1, de: 0.4, a: 1 },
  ];
};

const rabatPlie = (cote: 'd' | 'g'): Plan[] => {
  const m = cote === 'd' ? (pts: Pt[]) => pts : miroirs;
  return [
    rabat(`${cote}-ar-bas`, m([Kd, P, B])),
    rabat(`${cote}-av-bas`, m([Kd, P, B])),
    rabat(`${cote}-ar-haut`, m([Kd, Lc, P])),
    rabat(`${cote}-av-haut`, m([Kd, Lc, P])),
  ];
};

const etape4: Etape = {
  titre: 'Écraser le rabat de droite',
  consigne:
    'Ouvrez le rabat de droite par le milieu et écrasez-le à plat : son bord du haut se replie en deux, de part et d’autre du pli en biais.',
  astuce: 'Glissez l’index sous le rabat, soulevez-le, puis appuyez sur le coin de droite : le papier tombe dans ses plis.',
  figure: {
    cadre: CADRE_LOSANGE,
    plans: [plan('fond', [O, Kd, B, Kg]), rabat('pan-g', [Lc, Kg, B]), ...rabatPlie('d')],
    lignes: [v(Kd, P, 'montagne'), v(O, B, 'marque')],
    fleches: [f(add(Kd, pt(30, 2)), add(Kd, pt(6, 2)), 'pousser'), f(pt(26, 34), pt(66, 92), 'devant', -0.4)],
  },
  geste: { duree: 3400, pistes: pistesEcraser('d') },
};

const etape5: Etape = {
  titre: 'Puis celui de gauche',
  consigne: 'Même geste de l’autre côté : ouvrez le rabat de gauche et écrasez-le, bien symétrique.',
  figure: {
    cadre: CADRE_LOSANGE,
    plans: [plan('fond', [O, Kd, B, Kg]), ...rabatPlie('g'), ...ecraseD()],
    lignes: [v(Kg, P, 'montagne'), v(O, B, 'marque')],
    fleches: [f(add(Kg, pt(-30, 2)), add(Kg, pt(-6, 2)), 'pousser'), f(pt(-26, 34), pt(-66, 92), 'devant', 0.4)],
  },
  geste: { duree: 3400, pistes: pistesEcraser('g') },
};

const etape6: Etape = {
  titre: 'Plier en deux',
  consigne: 'Pliez le modèle en deux le long de la ligne du milieu, en rabattant la moitié droite derrière la gauche.',
  figure: {
    cadre: CADRE_LOSANGE,
    plans: [plan('corps-d', [O, Kd, B]), ...ecraseD(), plan('corps-g', [O, B, Kg]), ...ecraseG()],
    lignes: [v(pt(0, -10), pt(0, 2 * h + 10), 'montagne')],
    fleches: [f(pt(50, 6), pt(-30, 6), 'derriere', -0.4)],
  },
  geste: {
    duree: 2600,
    pistes: [{ type: 'pli', ids: ['corps-d', 'd-ar-bas', 'd-av-bas', 'd-ar-haut', 'd-av-haut'], axe: [O, B], sens: -1 }],
  },
};

// ─── Vue de profil : la moitié gauche, tournée ─────────────────────────────────
const Bo = reflet(B, Kg, P); // la pointe de l'oreille, une fois relevée
const E = intersection(Kg, Bo, O, B); // là où l'oreille sort de la tête

/**
 * Affiner l'oreille : on rabat son bord extérieur (P-Bo) vers l'intérieur, le long d'un pli
 * qui part du bord du bas de l'oreille, pour qu'il vienne toucher le point E.
 * La position du pli se trouve par dichotomie.
 */
function plierOreille(t: number) {
  const G = lerpPt(Kg, Bo, t);
  const R2 = intersection(G, Xg, Kg, P);
  return { G, R2, P2: reflet(P, G, R2), Bo2: reflet(Bo, G, R2) };
}
const ecartAE = (t: number) => {
  const { P2, Bo2 } = plierOreille(t);
  const d = sub(Bo2, P2);
  return d[0] * (E[1] - P2[1]) - d[1] * (E[0] - P2[0]);
};
let [t0, t1] = [0.3, 0.95];
for (let i = 0; i < 50; i++) {
  const tm = (t0 + t1) / 2;
  if (Math.sign(ecartAE(tm)) === Math.sign(ecartAE(t0))) t0 = tm;
  else t1 = tm;
}
const OREILLE = plierOreille((t0 + t1) / 2);

/** Le profil à plat, avant le pli de la tête : corps, moitié gauche des rabats écrasés, tête. */
const profilCorps = (): Plan[] => [plan('corps', [O, B, Kg]), ...ecraseG()];
const tete = (): Plan => plan('tete', [O, Kg, P]);
const oreillesAffinees = (): Plan[] => [
  rabat('oreille', [Kg, OREILLE.G, OREILLE.R2]),
  rabat('oreille-pli', [OREILLE.G, OREILLE.Bo2, OREILLE.P2, OREILLE.R2]),
];

const oreilleLevee = (): Plan => rabat('oreille', [Kg, P, Bo]);

// Vues tournées.
const vue30 = (p: Pt) => tourne(p, O, -30);
const vue45 = (p: Pt) => tourne(p, O, -45);
const tournerPlans = (plans: Plan[], vue: (p: Pt) => Pt): Plan[] => plans.map((p) => ({ ...p, pts: p.pts.map(vue) }));
const tournerLigne = (l: Ligne, vue: (p: Pt) => Pt): Ligne => ({ ...l, a: vue(l.a), b: vue(l.b) });

/** Le cadre qui contient tous ces plans, avec une marge. */
function cadreDe(plans: Plan[], marge = 0.14): readonly [number, number, number, number] {
  const pts = plans.flatMap((p) => p.pts);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const m = marge * Math.max(x1 - x0, y1 - y0);
  return [x0 - m, y0 - m, x1 - x0 + 2 * m, y1 - y0 + 2 * m];
}

const CADRE_PROFIL = cadreDe(
  tournerPlans([...profilCorps(), tete(), rabat('o', [Kg, P, B]), oreilleLevee(), ...oreillesAffinees()], vue30),
);

const etape7: Etape = {
  titre: 'La première oreille',
  consigne:
    'Tournez le pliage d’un tiers de quart de tour, pointe du bas vers la droite. Relevez la pointe du bas, couche de devant, le long du pli entre le coin de gauche et le milieu : elle monte et devient une oreille.',
  figure: {
    cadre: CADRE_PROFIL,
    plans: tournerPlans([...profilCorps().slice(0, 1), rabat('oreille', [Kg, P, B]), ...profilCorps().slice(1), tete()], vue30),
    lignes: [tournerLigne(v(Kg, P), vue30)],
    fleches: [f(vue30(add(B, pt(-4, -10))), vue30(add(Bo, pt(-10, 6))), 'devant', -0.35)],
  },
  geste: {
    duree: 2800,
    pistes: [{ type: 'pli', ids: ['oreille'], axe: [vue30(Kg), vue30(P)], sens: 1 }],
  },
};

const etape8: Etape = {
  titre: 'La deuxième oreille',
  consigne: 'Retournez le pliage et faites de même avec la pointe de derrière. Les deux oreilles se superposent.',
  figure: {
    cadre: CADRE_PROFIL,
    plans: tournerPlans([profilCorps()[0], oreilleLevee(), ...profilCorps().slice(1), tete()], vue30),
    fleches: [f(vue30(pt(96, 40)), vue30(pt(96, 40)), 'retourner')],
  },
};

const etape9: Etape = {
  titre: 'Affiner les oreilles',
  consigne:
    'Sur chaque oreille, rabattez le bord extérieur vers l’intérieur, jusqu’au point où l’oreille sort de la tête. Les oreilles s’affinent et se redressent.',
  astuce: 'Le pli part du bas de l’oreille : marquez-le bien jusqu’en haut, la pointe doit rester bien fine.',
  figure: {
    cadre: CADRE_PROFIL,
    plans: tournerPlans(
      [
        profilCorps()[0],
        rabat('oreille', [Kg, OREILLE.G, OREILLE.R2]),
        rabat('oreille-pli', [OREILLE.G, Bo, P, OREILLE.R2]),
        ...profilCorps().slice(1),
        tete(),
      ],
      vue30,
    ),
    lignes: [tournerLigne(v(OREILLE.G, OREILLE.R2), vue30)],
    fleches: [f(vue30(add(milieu(P, Bo), pt(6, 4))), vue30(add(E, pt(4, -4))), 'devant', 0.4)],
  },
  geste: {
    duree: 2600,
    pistes: [{ type: 'pli', ids: ['oreille-pli'], axe: [vue30(OREILLE.G), vue30(OREILLE.R2)], sens: 1 }],
  },
};

// ─── Le pli écrasé de la tête ──────────────────────────────────────────────────
// Deux plis qui se rejoignent en Lc : un montagne horizontal (Lc-Kg) et un vallée à 45° vers le bas.
// La tête (au-dessus du premier) pivote d'un quart de tour autour de Lc ; la bande entre les deux passe dessous.
const vallee45 = add(Lc, pt(-1, 1));
const versDroite = add(Lc, pt(1, 0));
const versGauche = add(Lc, pt(-1, 0));
const partTete = (pts: Pt[]) => couper(pts, versGauche, versDroite); // au-dessus du pli horizontal (garde le haut)
const sousTete = (pts: Pt[]) => couper(pts, versDroite, versGauche);
const partPince = (pts: Pt[]) => couper(sousTete(pts), vallee45, Lc);
const partCorps = (pts: Pt[]) => couper(sousTete(pts), Lc, vallee45);
const pivoterTete = (p: Pt) => tourne(p, Lc, -90);

interface Morceaux {
  pince: Plan[];
  corps: Plan[];
  tete: Plan[];
}
/** Découpe le profil le long des deux plis de la tête. Les oreilles ne sont pas concernées. */
function decouper(): Morceaux {
  const res: Morceaux = { pince: [], corps: [], tete: [] };
  for (const p of [...profilCorps(), tete()]) {
    const morceaux: [keyof Morceaux, Pt[]][] = [
      ['pince', partPince(p.pts)],
      ['corps', partCorps(p.pts)],
      ['tete', partTete(p.pts)],
    ];
    for (const [quoi, pts] of morceaux) {
      if (pts.length >= 3) res[quoi].push({ ...p, id: `${p.id}-${quoi}`, pts });
    }
  }
  return res;
}
const MORCEAUX = decouper();

const etape10: Etape = {
  titre: 'Rabattre la tête',
  consigne:
    'Poussez la pointe du haut (le futur museau) vers le bas, par-dessus les oreilles, en pinçant un pli en zigzag à la base de la tête. Redressez ensuite le lapin pour qu’il soit assis.',
  astuce: 'Ne marquez pas le pli jusqu’en bas : laissez-le un peu arrondi, le lapin tiendra mieux debout.',
  figure: {
    cadre: CADRE_PROFIL,
    plans: tournerPlans([...MORCEAUX.pince, ...MORCEAUX.corps.slice(0, 1), ...oreillesAffinees(), ...MORCEAUX.corps.slice(1), ...MORCEAUX.tete], vue30),
    lignes: [tournerLigne(v(Kg, Lc, 'montagne'), vue30), tournerLigne(v(Lc, add(Lc, pt(-0.7 * h, 0.7 * h))), vue30)],
    fleches: [f(vue30(add(O, pt(-6, -4))), vue30(add(pivoterTete(O), pt(-8, 2))), 'devant', 0.5)],
  },
  geste: {
    duree: 3600,
    pistes: [
      { type: 'pli', ids: MORCEAUX.pince.map((p) => p.id), axe: [vue30(Lc), vue30(vallee45)], sens: -1, de: 0, a: 0.6 },
      { type: 'rotation', ids: MORCEAUX.tete.map((p) => p.id), pivot: vue30(Lc), angle: -90, de: 0, a: 0.6 },
      {
        type: 'rotation',
        ids: [...MORCEAUX.pince, ...MORCEAUX.corps, ...oreillesAffinees(), ...MORCEAUX.tete].map((p) => p.id),
        pivot: O,
        angle: -15,
        de: 0.55,
        a: 1,
      },
    ],
  },
};

// ─── Le lapin assis (vue à 45°) ────────────────────────────────────────────────
const assis = (p: Plan, enTete = false): Plan => ({ ...p, pts: p.pts.map((q) => vue45(enTete ? pivoterTete(q) : q)) });
const CORPS_ASSIS = MORCEAUX.corps.map((p) => assis(p));
const TETE_ASSISE = MORCEAUX.tete.map((p) => assis(p, true));
const OREILLES_ASSISES = oreillesAffinees().map((p) => assis(p));

// La queue : la pointe arrière, au-delà d'une ligne verticale, se replie en zigzag et ressort en petite languette.
const Bassis = vue45(B);
const xQueue = Bassis[0] - 0.22 * h;
const yBase = Bassis[1];
const queueCoupe = (pts: Pt[]) => couper(pts, pt(xQueue, 0), pt(xQueue, 1)); // garde la droite
const resteCoupe = (pts: Pt[]) => couper(pts, pt(xQueue, 1), pt(xQueue, 0));
const enQueue = (p: Pt): Pt => pt(p[0] - 0.08 * h, yBase - (yBase - p[1]) * 0.3);

const corpsSansQueue = CORPS_ASSIS.map((p) => ({ ...p, pts: resteCoupe(p.pts) })).filter((p) => p.pts.length >= 3);
const queue = CORPS_ASSIS.map((p) => ({ ...p, id: `${p.id}-queue`, pts: queueCoupe(p.pts) })).filter((p) => p.pts.length >= 3);
const queueFinie = queue.map((p) => ({ ...p, pts: p.pts.map(enQueue) }));

const CADRE_ASSIS = cadreDe([...CORPS_ASSIS, ...TETE_ASSISE, ...OREILLES_ASSISES]);

const etape11: Etape = {
  titre: 'La queue',
  consigne:
    'Pincez la pointe arrière et pliez-la en zigzag : un pli vers l’intérieur, puis un pli vers l’extérieur. Une petite queue ressort en bas du dos.',
  astuce: 'C’est le pli le plus délicat. Marquez d’abord les deux plis, dépliez, puis entrouvrez les couches pour les replier.',
  figure: {
    cadre: CADRE_ASSIS,
    plans: [...corpsSansQueue.slice(0, 1), ...queue.slice(0, 1), ...OREILLES_ASSISES, ...corpsSansQueue.slice(1), ...queue.slice(1), ...TETE_ASSISE],
    lignes: [v(pt(xQueue, yBase - 0.26 * h), pt(xQueue, yBase + 4)), v(pt(xQueue + 0.08 * h, yBase - 0.18 * h), pt(xQueue + 0.08 * h, yBase + 4), 'montagne')],
    fleches: [f(add(Bassis, pt(4, -14)), add(Bassis, pt(-0.16 * h, -26)), 'pousser')],
  },
  geste: {
    duree: 2600,
    pistes: [{ type: 'morph', vers: Object.fromEntries(queueFinie.map((p) => [p.id, p.pts])) }],
  },
};

// Le museau : la pointe de la tête, au-delà d'une ligne verticale, rentre à l'intérieur.
const pointeNez = TETE_ASSISE.flatMap((p) => p.pts).reduce((a, b) => (b[0] < a[0] ? b : a));
const xNez = pointeNez[0];
const xMuseau = xNez + 0.14 * h;
const museauCoupe = (pts: Pt[]) => couper(pts, pt(xMuseau, 1), pt(xMuseau, 0)); // garde la gauche
const teteCoupe = (pts: Pt[]) => couper(pts, pt(xMuseau, 0), pt(xMuseau, 1));
const teteSansNez = TETE_ASSISE.map((p) => ({ ...p, pts: teteCoupe(p.pts) })).filter((p) => p.pts.length >= 3);
const nez = TETE_ASSISE.map((p) => ({ ...p, id: `${p.id}-nez`, pts: museauCoupe(p.pts) })).filter((p) => p.pts.length >= 3);

const corpsFini = (): Plan[] => [...corpsSansQueue.slice(0, 1), ...queueFinie.slice(0, 1), ...OREILLES_ASSISES, ...corpsSansQueue.slice(1), ...queueFinie.slice(1)];

const etape12: Etape = {
  titre: 'Le museau',
  consigne: 'Rentrez la pointe du museau à l’intérieur de la tête, d’un petit pli inversé : le bout du nez devient tout rond.',
  figure: {
    cadre: CADRE_ASSIS,
    plans: [...corpsFini(), ...nez, ...teteSansNez],
    lignes: [v(pt(xMuseau, pointeNez[1] - 0.3 * h), pt(xMuseau, pointeNez[1] + 0.3 * h), 'montagne')],
    fleches: [f(pt(xNez - 16, pointeNez[1]), pt(xNez + 2, pointeNez[1]), 'pousser')],
  },
  geste: {
    duree: 2200,
    pistes: [{ type: 'pli', ids: nez.map((p) => p.id), axe: [pt(xMuseau, -100), pt(xMuseau, 100)], sens: -1 }],
  },
};

// Les oreilles s'écartent un peu : celle de derrière bascule vers l'arrière.
const baseOreilles = vue45(OREILLE.G);
const oreillesOuvertes = (): Plan[] => [
  ...oreillesAffinees().map((p) => ({ ...p, id: `${p.id}-ar`, pts: p.pts.map((q) => tourne(vue45(q), baseOreilles, 7)), ombre: 0.22 })),
  ...OREILLES_ASSISES,
];
const lapinFini = (): Plan[] => [
  ...corpsSansQueue.slice(0, 1),
  ...queueFinie.slice(0, 1),
  ...oreillesOuvertes(),
  ...corpsSansQueue.slice(1),
  ...queueFinie.slice(1),
  ...teteSansNez,
];

const etape13: Etape = {
  titre: 'Ouvrir les oreilles',
  consigne:
    'Écartez doucement les deux oreilles et arrondissez-les du bout des doigts. Posez le lapin : il tient assis tout seul !',
  astuce: 'Un petit point au feutre pour l’œil, et votre lapin vous regarde.',
  figure: {
    cadre: CADRE_ASSIS,
    plans: [
      ...corpsSansQueue.slice(0, 1),
      ...queueFinie.slice(0, 1),
      ...oreillesAffinees().map((p) => ({ ...p, id: `${p.id}-ar`, pts: p.pts.map(vue45), ombre: 0.22 })),
      ...OREILLES_ASSISES,
      ...corpsSansQueue.slice(1),
      ...queueFinie.slice(1),
      ...teteSansNez,
    ],
    fleches: [f(add(vue45(OREILLE.Bo2), pt(6, 10)), add(vue45(OREILLE.Bo2), pt(24, 18)), 'tirer')],
  },
  geste: {
    duree: 1800,
    pistes: [{ type: 'rotation', ids: oreillesAffinees().map((p) => `${p.id}-ar`), pivot: baseOreilles, angle: 7 }],
  },
};

const illustration: Figure = {
  cadre: cadreDe(lapinFini(), 0.06),
  plans: lapinFini(),
};

export const lapin: Modele = {
  id: 'lapin',
  nom: 'Le lapin',
  sousTitre: 'Usagi',
  kana: 'うさぎ',
  niveau: 2,
  duree: '15 min',
  feuille: 'Feuille carrée de 15 × 15 cm, colorée d’un côté',
  resume:
    'Un lapin assis, de profil, avec de grandes oreilles. Deux rabats écrasés, un pli en zigzag pour la tête et un autre pour la queue : d’après le modèle présenté par origami.me.',
  papier: { recto: '#b9a7d9', verso: '#ffffff' },
  illustration,
  etapes: [etape1, etape2, etape3, etape4, etape5, etape6, etape7, etape8, etape9, etape10, etape11, etape12, etape13],
};
