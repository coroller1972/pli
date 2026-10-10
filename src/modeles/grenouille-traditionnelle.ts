import { add, couper, intersection, lerpPt, mul, norm, plan, pt, rabat, reflet, sub } from '../pliage/geo';
import type { Figure, Fleche, Ligne, Plan, Pt } from '../pliage/types';
import { etapesBaseCarree } from './grue';
import { baseGrenouilleRepere, etapesBaseGrenouille } from './lys';
import { cadreDe } from './outils';
import type { Etape, Modele } from './types';

/*
 * La grenouille traditionnelle (kaeru), d'après la séquence présentée par origami.me.
 * Base carrée (comme la grue), base de la grenouille (comme le lys), on affine le bas,
 * puis les quatre pattes naissent de plis inversés successifs : pattes, genoux, pieds.
 *
 * Vu à plat, un pli inversé intérieur replie la pointe le long du pli : c'est un reflet.
 * On choisit pour chaque pli une articulation et une nouvelle direction ; le pli est alors
 * la médiatrice entre la pointe et sa nouvelle position.
 */

const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };
const miroir = (p: Pt): Pt => pt(-p[0], p[1]);
const miroirs = (pts: Pt[]): Pt[] => pts.map(miroir).reverse();

const { T2, B2, Kd, Kg } = baseGrenouilleRepere;
const h = B2[1];
const O = pt(0, 0);

// ─── Affiner le bas ────────────────────────────────────────────────────────────
// Les bords du bas (Kd-B2) viennent sur la ligne du milieu : le pli part de B2, sur la bissectrice.
const dirAffine = norm(add(norm(sub(Kd, B2)), norm(sub(O, B2))));
// Le pli monte de B2 jusqu'au bord du haut (en Md) : tout le côté se replie, la grenouille s'affine.
const Md = intersection(B2, add(B2, dirAffine), T2, Kd);
const Mg = miroir(Md);
const Nd = intersection(B2, Md, Kg, Kd); // là où le pli croise la charnière des pétales
const Ng = miroir(Nd);
const w = Nd[0];

const CADRE_BASE = [-150, -128, 300, 256] as const;

const etape9: Etape = {
  titre: 'Affiner le bas',
  consigne:
    'Couche du dessus : rabattez les deux bords du bas sur la ligne du milieu. Retournez et faites de même, puis tournez les rabats comme des pages et recommencez sur les deux autres faces.',
  astuce: 'Le papier devient épais : appuyez bien chaque pli avec l’ongle.',
  figure: {
    cadre: CADRE_BASE,
    plans: [
      plan('dos', [T2, Kd, B2, Kg], 'recto', 0.1),
      rabat('bas', [Ng, Nd, B2]),
      rabat('petale', [T2, Md, Nd, Ng, Mg]),
      rabat('pli-g', [Mg, B2, Kg]),
      rabat('pli-d', [Md, Kd, B2]),
    ],
    lignes: [v(B2, Mg), v(B2, Md), v(O, B2, 'marque'), v(Kg, Kd, 'marque')],
    fleches: [f(add(Kg, pt(8, 14)), pt(-8, 40), 'devant', -0.4), f(add(Kd, pt(-8, 14)), pt(8, 40), 'devant', 0.4)],
  },
  geste: {
    duree: 2600,
    pistes: [
      { type: 'pli', ids: ['pli-g'], axe: [Mg, B2], sens: 1, de: 0, a: 0.65 },
      { type: 'pli', ids: ['pli-d'], axe: [B2, Md], sens: 1, de: 0.35, a: 1 },
    ],
  },
};

// ─── Les pattes ────────────────────────────────────────────────────────────────
interface Morceau {
  id: string;
  pts: Pt[];
}
/** Les quatre rabats fins du bas : deux devant, deux derrière. Ce sont les pattes. */
const pattesInitiales: Morceau[] = [
  { id: 'ar-g', pts: [Ng, O, B2] },
  { id: 'ar-d', pts: [O, Nd, B2] },
  { id: 'av-g', pts: [Ng, O, B2] },
  { id: 'av-d', pts: [O, Nd, B2] },
];

interface Pli {
  axe: [Pt, Pt];
  /** Les morceaux qui bougent (côté de la pointe), avant et après. */
  avant: Morceau[];
  apres: Morceau[];
  /** Les morceaux qui restent. */
  restent: Morceau[];
  pointe: Pt;
}

/**
 * Plier une patte : `articulation` reste fixe, la `pointe` part dans la `direction` voulue.
 * Le pli est la médiatrice entre la pointe et sa nouvelle place ; il passe par l'articulation.
 */
function plierPatte(ms: Morceau[], articulation: Pt, pointe: Pt, direction: Pt, suffixe: string): Pli {
  const longueur = Math.hypot(...sub(pointe, articulation));
  const nouvelle = add(articulation, mul(norm(direction), longueur));
  const milieu = lerpPt(pointe, nouvelle, 0.5);
  const d = sub(nouvelle, pointe);
  const axe: [Pt, Pt] = [add(milieu, pt(-d[1], d[0])), add(milieu, pt(d[1], -d[0]))];
  // Le côté du pli où se trouve la pointe : on teste un petit triangle autour d'elle.
  const autour = (p: Pt): Pt[] => [p, add(p, pt(0.5, 0)), add(p, pt(0, 0.5))];
  const pointeGardee = couper(autour(pointe), axe[0], axe[1]).length > 0;
  const [cotePointe, autreCote] = pointeGardee ? [axe, [axe[1], axe[0]] as [Pt, Pt]] : [[axe[1], axe[0]] as [Pt, Pt], axe];
  const avant: Morceau[] = [];
  const restent: Morceau[] = [];
  for (const m of ms) {
    const bouge = couper(m.pts, ...cotePointe);
    const reste = couper(m.pts, ...autreCote);
    if (bouge.length >= 3) avant.push({ id: m.id + suffixe, pts: bouge });
    if (reste.length >= 3) restent.push({ id: m.id, pts: reste });
  }
  const apres = avant.map((m) => ({ ...m, pts: m.pts.map((q) => reflet(q, ...axe)) }));
  return { axe, avant, apres, restent, pointe: nouvelle };
}

/** Plie la patte d'un côté (gauche), puis en déduit l'autre par symétrie. */
function plierPaire(ms: Morceau[], prefixe: string, articulation: Pt, pointe: Pt, direction: Pt, suffixe: string) {
  const g = plierPatte(ms.filter((m) => m.id.startsWith(prefixe + '-g')), articulation, pointe, direction, suffixe);
  const sym = (x: Morceau): Morceau => ({ id: x.id.replace(prefixe + '-g', prefixe + '-d'), pts: miroirs(x.pts) });
  const d: Pli = {
    axe: [miroir(g.axe[1]), miroir(g.axe[0])],
    avant: g.avant.map(sym),
    apres: g.apres.map(sym),
    restent: g.restent.map(sym),
    pointe: miroir(g.pointe),
  };
  const autres = ms.filter((m) => !m.id.startsWith(prefixe + '-'));
  return { g, d, autres };
}

// La patte de gauche est un long triangle fin ; son axe va du milieu de son bord du haut à la pointe B2.
const axeHaut = pt(-w / 2, 0);

// 1. Pattes avant : elles remontent le long du corps, un peu vers l'extérieur.
const hancheAv = lerpPt(axeHaut, B2, 0.2);
const pattesAv = plierPaire(pattesInitiales, 'av', hancheAv, B2, pt(-0.45, -1), '-p');
// 2. Pattes arrière : elles partent vers l'extérieur.
const etatApresAv: Morceau[] = [...pattesAv.autres, ...pattesAv.g.restent, ...pattesAv.d.restent, ...pattesAv.g.apres, ...pattesAv.d.apres];
const hancheAr = lerpPt(axeHaut, B2, 0.1);
const pattesAr = plierPaire(etatApresAv, 'ar', hancheAr, B2, pt(-1, 0.22), '-p');
const etatApresAr: Morceau[] = [
  ...pattesAr.g.restent,
  ...pattesAr.d.restent,
  ...pattesAr.g.apres,
  ...pattesAr.d.apres,
  ...pattesAr.autres,
];
// 3. Genoux : la patte avant se coude vers l'extérieur, la patte arrière vers le bas.
const genouAv = lerpPt(hancheAv, pattesAv.g.pointe, 0.5);
const genouxAv = plierPaire(etatApresAr, 'av', genouAv, pattesAv.g.pointe, pt(-1, -0.12), '-g');
const etatGenouxAv: Morceau[] = [...genouxAv.autres, ...genouxAv.g.restent, ...genouxAv.d.restent, ...genouxAv.g.apres, ...genouxAv.d.apres];
const genouAr = lerpPt(hancheAr, pattesAr.g.pointe, 0.5);
const genouxAr = plierPaire(etatGenouxAv, 'ar', genouAr, pattesAr.g.pointe, pt(-0.22, 1), '-g');
const etatGenoux: Morceau[] = [...genouxAr.g.restent, ...genouxAr.d.restent, ...genouxAr.g.apres, ...genouxAr.d.apres, ...genouxAr.autres];
// 4. Pieds : la pointe avant se relève, la pointe arrière part vers l'extérieur.
const piedAv = lerpPt(genouAv, genouxAv.g.pointe, 0.78);
const piedsAv = plierPaire(etatGenoux, 'av', piedAv, genouxAv.g.pointe, pt(-0.08, -1), '-f');
const etatPiedsAv: Morceau[] = [...piedsAv.autres, ...piedsAv.g.restent, ...piedsAv.d.restent, ...piedsAv.g.apres, ...piedsAv.d.apres];
const piedAr = lerpPt(genouAr, genouxAr.g.pointe, 0.8);
const piedsAr = plierPaire(etatPiedsAv, 'ar', piedAr, genouxAr.g.pointe, pt(-1, 0.05), '-f');
const etatPieds: Morceau[] = [...piedsAr.g.restent, ...piedsAr.d.restent, ...piedsAr.g.apres, ...piedsAr.d.apres, ...piedsAr.autres];

// Le corps : le haut de la base, par-dessus les pattes (dont la base se cache entre les couches).
const corps = (): Plan[] => [rabat('corps', [T2, Md, Nd, Ng, Mg])];
const lignesCorps: Ligne[] = [v(T2, O, 'marque'), v(Mg, O, 'marque'), v(Md, O, 'marque')];

/** Les pattes derrière le corps : celles de derrière d'abord. */
const ordonner = (ms: Morceau[]): Plan[] => {
  const rang = (id: string) => (id.startsWith('ar') ? 0 : 1);
  return [...ms].sort((a, b) => rang(a.id) - rang(b.id)).map((m) => rabat(m.id, m.pts));
};
const plansAvec = (ms: Morceau[]): Plan[] => [...ordonner(ms), ...corps()];
const cibles = (ms: Morceau[]): Record<string, Pt[]> => Object.fromEntries(ms.map((m) => [m.id, m.pts]));

const lignePli = (axe: [Pt, Pt], type: Ligne['type'] = 'vallee'): Ligne => {
  const d = norm(sub(axe[1], axe[0]));
  const c = lerpPt(axe[0], axe[1], 0.5);
  return { a: sub(c, mul(d, 18)), b: add(c, mul(d, 18)), type };
};

// Le cadre de toutes les étapes de pattes : celui de la grenouille finie, et celui de la base affinée.
const CADRE_PATTES = cadreDe([...plansAvec(etatPieds), ...plansAvec(pattesInitiales)], 0.08);

const etape10: Etape = {
  titre: 'Les pattes avant',
  consigne:
    'Écartez un peu les couches de devant et faites remonter les deux rabats fins du dessus par un pli inversé intérieur : ils glissent entre les couches et ressortent vers le haut.',
  astuce: 'Marquez d’abord le pli dans les deux sens : la patte se retournera plus facilement à l’intérieur.',
  figure: {
    cadre: CADRE_PATTES,
    plans: plansAvec([...pattesInitiales.filter((m) => m.id.startsWith('ar')), ...pattesAv.g.restent, ...pattesAv.d.restent, ...pattesAv.g.avant, ...pattesAv.d.avant]),
    lignes: [...lignesCorps, lignePli(pattesAv.g.axe), lignePli(pattesAv.d.axe)],
    fleches: [f(add(B2, pt(-6, -6)), add(pattesAv.g.pointe, pt(-4, 8)), 'devant', 0.35), f(add(B2, pt(6, -6)), add(pattesAv.d.pointe, pt(4, 8)), 'devant', -0.35)],
  },
  geste: {
    duree: 3000,
    pistes: [
      { type: 'pli', ids: pattesAv.g.avant.map((m) => m.id), axe: pattesAv.g.axe, sens: 1, de: 0, a: 0.7 },
      { type: 'pli', ids: pattesAv.d.avant.map((m) => m.id), axe: pattesAv.d.axe, sens: 1, de: 0.3, a: 1 },
    ],
  },
};

const etape11: Etape = {
  titre: 'Les pattes arrière',
  consigne: 'Même geste avec les deux rabats de derrière, par un pli inversé : ils sortent sur les côtés, vers l’extérieur.',
  figure: {
    cadre: CADRE_PATTES,
    plans: plansAvec([...pattesAr.autres, ...pattesAr.g.restent, ...pattesAr.d.restent, ...pattesAr.g.avant, ...pattesAr.d.avant]),
    lignes: [...lignesCorps, lignePli(pattesAr.g.axe), lignePli(pattesAr.d.axe)],
    fleches: [f(add(B2, pt(-6, -2)), add(pattesAr.g.pointe, pt(6, -6)), 'devant', -0.3), f(add(B2, pt(6, -2)), add(pattesAr.d.pointe, pt(-6, -6)), 'devant', 0.3)],
  },
  geste: {
    duree: 3000,
    pistes: [
      { type: 'pli', ids: pattesAr.g.avant.map((m) => m.id), axe: pattesAr.g.axe, sens: 1, de: 0, a: 0.7 },
      { type: 'pli', ids: pattesAr.d.avant.map((m) => m.id), axe: pattesAr.d.axe, sens: 1, de: 0.3, a: 1 },
    ],
  },
};

const etape12: Etape = {
  titre: 'Plier les genoux',
  consigne:
    'Un pli inversé au milieu de chaque patte : les pattes avant se coudent vers l’extérieur, les pattes arrière vers le bas.',
  figure: {
    cadre: CADRE_PATTES,
    plans: plansAvec([...genouxAr.autres.filter((m) => !m.id.startsWith('av')), ...genouxAv.g.restent, ...genouxAv.d.restent, ...genouxAv.g.avant, ...genouxAv.d.avant, ...genouxAr.g.restent, ...genouxAr.d.restent, ...genouxAr.g.avant, ...genouxAr.d.avant]),
    lignes: [...lignesCorps, lignePli(genouxAv.g.axe), lignePli(genouxAv.d.axe), lignePli(genouxAr.g.axe), lignePli(genouxAr.d.axe)],
  },
  geste: {
    duree: 3400,
    pistes: [
      { type: 'morph', de: 0, a: 0.6, vers: cibles([...genouxAv.g.apres, ...genouxAv.d.apres]) },
      { type: 'morph', de: 0.4, a: 1, vers: cibles([...genouxAr.g.apres, ...genouxAr.d.apres]) },
    ],
  },
};

const etape13: Etape = {
  titre: 'Les pieds',
  consigne: 'Encore un petit pli inversé au bout de chaque patte : les pieds avant se relèvent, les pieds arrière s’écartent.',
  figure: {
    cadre: CADRE_PATTES,
    plans: plansAvec([...piedsAv.g.restent, ...piedsAv.d.restent, ...piedsAv.g.avant, ...piedsAv.d.avant, ...piedsAr.g.restent, ...piedsAr.d.restent, ...piedsAr.g.avant, ...piedsAr.d.avant]),
    lignes: [...lignesCorps, lignePli(piedsAv.g.axe), lignePli(piedsAv.d.axe), lignePli(piedsAr.g.axe), lignePli(piedsAr.d.axe)],
  },
  geste: {
    duree: 2800,
    pistes: [{ type: 'morph', vers: cibles([...piedsAv.g.apres, ...piedsAv.d.apres, ...piedsAr.g.apres, ...piedsAr.d.apres]) }],
  },
};

// La tête : la pointe du haut se replie derrière.
const yTete = -0.72 * h;
const teteD = lerpPt(T2, Md, (yTete - T2[1]) / (Md[1] - T2[1]));
const teteG = miroir(teteD);
const corpsSansTete = (): Plan[] => [rabat('corps', [teteG, teteD, Md, Nd, Ng, Mg])];
const etatFinal = (): Plan[] => [...ordonner(etatPieds), ...corpsSansTete()];

const etape14: Etape = {
  titre: 'La tête',
  consigne: 'Repliez la pointe du haut vers l’arrière : la tête de la grenouille devient toute plate.',
  figure: {
    cadre: CADRE_PATTES,
    plans: [{ ...rabat('tete', [T2, teteG, teteD]), zRetourne: -10 }, ...etatFinal()],
    lignes: [v(add(teteG, pt(-6, 0)), add(teteD, pt(6, 0)), 'montagne')],
    fleches: [f(add(T2, pt(8, 4)), pt(8, yTete + 22), 'derriere', -0.6)],
  },
  geste: { duree: 2200, pistes: [{ type: 'pli', ids: ['tete'], axe: [teteG, teteD], sens: -1 }] },
};

const etape15: Etape = {
  titre: 'La grenouille est prête',
  consigne:
    'Ajustez les pattes pour qu’elle tienne bien à plat. Pour lui donner du volume, soufflez doucement dans le petit trou entre les pattes : elle se gonfle !',
  astuce: 'Un petit point de feutre de chaque côté de la tête, et elle vous regarde.',
  figure: {
    cadre: CADRE_PATTES,
    plans: etatFinal(),
  },
};

const illustration: Figure = {
  cadre: cadreDe(etatFinal(), 0.04),
  plans: etatFinal(),
};

export const grenouilleTraditionnelle: Modele = {
  id: 'grenouille-traditionnelle',
  nom: 'La grenouille traditionnelle',
  sousTitre: 'Kaeru',
  kana: 'かえる',
  niveau: 3,
  duree: '20 min',
  feuille: 'Feuille carrée de 15 × 15 cm, assez fine',
  resume:
    'La grenouille aux quatre pattes, pliée dans la base de la grenouille. Douze plis inversés pour les pattes, les genoux et les pieds : d’après la séquence présentée par origami.me.',
  papier: { recto: '#9ccc7a', verso: '#ffffff' },
  illustration,
  etapes: [...etapesBaseCarree, ...etapesBaseGrenouille, etape9, etape10, etape11, etape12, etape13, etape14, etape15],
};
