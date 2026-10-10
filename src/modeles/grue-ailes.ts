import { add, couper, lerpPt, mul, norm, pt, rabat, reflet, sub, tourne } from '../pliage/geo';
import type { Figure, Fleche, Ligne, Plan, Pt } from '../pliage/types';
import { baseOiseauRepere, etapesBaseCarree, etapesBaseOiseau } from './grue';
import { cadreDe } from './outils';
import type { Etape, Modele } from './types';

/*
 * La grue qui bat des ailes (habataku tori), d'après la séquence présentée par origami.me (« Flapping Bird »).
 * Base de l'oiseau, comme la grue ; puis les deux pointes du bas remontent et ressortent de part et d'autre :
 * la queue et le cou. Un pli inversé pour la tête, et on tire la queue pour faire battre les ailes.
 */

const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };
const miroir = (p: Pt): Pt => pt(-p[0], p[1]);
const miroirs = (pts: Pt[]): Pt[] => pts.map(miroir).reverse();

const { B2, KG, KD, Bp } = baseOiseauRepere;
const Kc = pt(0, KG[1]); // le milieu de la charnière des ailes

// Les ailes (la grande pointe du haut) et les deux pointes du bas, de part et d'autre du milieu.
const aileG: Pt[] = [KG, Kc, Bp];
const aileD: Pt[] = [Kc, KD, Bp];
const piedG: Pt[] = [KG, B2, Kc];
const piedD: Pt[] = [Kc, B2, KD];
// Remontées le long de la charnière, elles se posent exactement sur les ailes.
const remonte = (pts: Pt[]) => pts.map((q) => reflet(q, KG, KD));

// La queue (à gauche) et le cou (à droite) : la pointe intérieure est tirée vers l'extérieur et aplatie.
// C'est un pli le long d'une droite qui passe par le coin de la charnière : un reflet, qui fait aussi
// descendre le bas de la pointe sous les ailes (le petit « V » des diagrammes).
const ELEVATION = 45; // degrés au-dessus de l'horizontale
const versQueue = pt(-Math.cos((ELEVATION * Math.PI) / 180), -Math.sin((ELEVATION * Math.PI) / 180));
const dirPliQueue = norm(add(norm(sub(Bp, KG)), versQueue));
const axeQueue: [Pt, Pt] = [KG, add(KG, mul(dirPliQueue, 100))];
const axeCou: [Pt, Pt] = [miroir(axeQueue[1]), miroir(axeQueue[0])];
const queue = remonte(piedG).map((q) => reflet(q, ...axeQueue));
const cou = miroirs(queue);

// La tête : un pli inversé près de la pointe du cou, qui la fait basculer vers le bas.
const pointeCou = cou.reduce((a, b) => (b[1] < a[1] ? b : a));
const pointeQueue = miroir(pointeCou);
const baseCou = KD;
const articulation = lerpPt(baseCou, pointeCou, 0.78);
const longueurTete = Math.hypot(...sub(pointeCou, articulation));
const pointeTete = add(articulation, mul(norm(pt(0.85, 0.55)), longueurTete));
const milieuTete = lerpPt(pointeCou, pointeTete, 0.5);
const dTete = sub(pointeTete, pointeCou);
const axeTete: [Pt, Pt] = [add(milieuTete, pt(-dTete[1], dTete[0])), add(milieuTete, pt(dTete[1], -dTete[0]))];
/** Le côté du pli où se trouve la pointe du cou. */
const autourPointe: Pt[] = [pointeCou, add(pointeCou, pt(0.5, 0)), add(pointeCou, pt(0, 0.5))];
const [ctete, ccou] = couper(autourPointe, ...axeTete).length > 0 ? [axeTete, [axeTete[1], axeTete[0]] as [Pt, Pt]] : [[axeTete[1], axeTete[0]] as [Pt, Pt], axeTete];
const tete = couper(cou, ...ctete);
const couSansTete = couper(cou, ...ccou);
const teteBaissee = tete.map((q) => reflet(q, ...axeTete));

const lignePli = (axe: [Pt, Pt], type: Ligne['type'] = 'vallee'): Ligne => {
  const d = norm(sub(axe[1], axe[0]));
  const c = lerpPt(axe[0], axe[1], 0.5);
  return { a: sub(c, mul(d, 16)), b: add(c, mul(d, 16)), type };
};

/** L'oiseau, du fond vers l'avant : les ailes de derrière, la queue et le cou (entre les couches), les ailes de devant. */
const oiseau = (q: Pt[], c: Pt[], t?: Pt[]): Plan[] => [
  rabat('aile-ar', [KG, KD, Bp], 'recto'),
  rabat('queue', q),
  rabat('cou', c),
  ...(t ? [rabat('tete', t)] : []),
  rabat('aile-g', aileG),
  rabat('aile-d', aileD),
];

const CADRE = cadreDe([...oiseau(queue, cou), rabat('b', [KG, KD, B2])], 0.1);

const etape13: Etape = {
  titre: 'Remonter les pointes du bas',
  consigne:
    'Tournez le rabat de gauche du dessus vers la droite, comme une page, et faites de même derrière. Puis remontez la pointe du bas le long du pli horizontal, devant et derrière.',
  figure: {
    cadre: CADRE,
    plans: [rabat('aile-ar', [KG, KD, Bp]), rabat('aile-g', aileG), rabat('aile-d', aileD), rabat('pied-g', piedG), rabat('pied-d', piedD)],
    lignes: [v(KG, KD), v(Bp, B2, 'marque')],
    fleches: [f(add(B2, pt(-6, -6)), add(Bp, pt(-6, 10)), 'devant', 0.35)],
  },
  geste: { duree: 2600, pistes: [{ type: 'pli', ids: ['pied-g', 'pied-d'], axe: [KG, KD], sens: 1 }] },
};

const etape14: Etape = {
  titre: 'La queue',
  consigne:
    'À gauche, tirez doucement la pointe intérieure vers l’extérieur et aplatissez-la, bords du bas bien alignés : c’est la queue.',
  astuce: 'Tenez les ailes d’une main pendant que vous tirez : la pointe glisse entre les couches.',
  figure: {
    cadre: CADRE,
    plans: [rabat('aile-ar', [KG, KD, Bp]), rabat('queue', remonte(piedG)), rabat('pied-d', remonte(piedD)), rabat('aile-g', aileG), rabat('aile-d', aileD)],
    fleches: [f(add(Bp, pt(-10, 14)), add(pointeQueue, pt(-6, 8)), 'tirer', 0.3)],
  },
  geste: { duree: 2600, pistes: [{ type: 'pli', ids: ['queue'], axe: axeQueue, sens: 1 }] },
};

const etape15: Etape = {
  titre: 'Le cou',
  consigne: 'Même geste à droite : tirez la pointe intérieure vers l’extérieur et aplatissez-la. C’est le cou.',
  figure: {
    cadre: CADRE,
    plans: [rabat('aile-ar', [KG, KD, Bp]), rabat('queue', queue), rabat('cou', remonte(piedD)), rabat('aile-g', aileG), rabat('aile-d', aileD)],
    fleches: [f(add(Bp, pt(10, 14)), add(miroir(pointeQueue), pt(6, 8)), 'tirer', -0.3)],
  },
  geste: { duree: 2600, pistes: [{ type: 'pli', ids: ['cou'], axe: axeCou, sens: 1 }] },
};

const etape16: Etape = {
  titre: 'La tête',
  consigne:
    'Pliez la pointe du cou vers le bas pour marquer la tête, dépliez, puis rentrez-la entre les couches par un pli inversé. Pas de repère précis : placez la tête où elle vous plaît.',
  figure: {
    cadre: CADRE,
    plans: [...oiseau(queue, couSansTete, tete)],
    lignes: [lignePli(axeTete)],
    fleches: [f(add(pointeCou, pt(6, -4)), add(pointeTete, pt(6, 0)), 'devant', -0.5)],
  },
  geste: { duree: 2200, pistes: [{ type: 'pli', ids: ['tete'], axe: axeTete, sens: 1 }] },
};

// Les ailes qui battent : elles basculent vers le spectateur, leur pointe descend, puis remonte.
// Tirer la queue la fait légèrement pivoter vers le bas.
const ailesBaissees = (pts: Pt[]) => pts.map((q) => pt(q[0] * 1.05, Kc[1] + (q[1] - Kc[1]) * 0.35));
const queueTiree = queue.map((q) => tourne(q, KG, -14));
const final = (): Plan[] => oiseau(queue, couSansTete, teteBaissee);

const etape17: Etape = {
  titre: 'Faire battre les ailes',
  consigne:
    'Tenez l’oiseau par le bas du cou, puis tirez doucement la queue vers le bas et relâchez : les ailes battent ! Écartez un peu les ailes pour qu’elles bougent librement.',
  astuce: 'Courbez légèrement les ailes vers l’extérieur : elles battront plus grand.',
  figure: {
    cadre: CADRE,
    plans: final(),
    fleches: [f(add(pointeQueue, pt(-2, 10)), add(pointeQueue, pt(-4, 34)), 'tirer')],
  },
  geste: {
    duree: 1600,
    pistes: [
      {
        type: 'morph',
        de: 0,
        a: 0.5,
        vers: { 'aile-g': ailesBaissees(aileG), 'aile-d': ailesBaissees(aileD), 'aile-ar': ailesBaissees([KG, KD, Bp]), queue: queueTiree },
      },
      { type: 'morph', de: 0.5, a: 1, vers: { 'aile-g': aileG, 'aile-d': aileD, 'aile-ar': [KG, KD, Bp], queue } },
    ],
  },
};

const illustration: Figure = {
  cadre: cadreDe(final(), 0.05),
  plans: final(),
};

export const grueAiles: Modele = {
  id: 'grue-ailes',
  nom: 'La grue qui bat des ailes',
  sousTitre: 'Habataku tori',
  kana: 'はばたくとり',
  niveau: 2,
  duree: '10 min',
  feuille: 'Feuille carrée de 15 × 15 cm, colorée d’un côté',
  resume:
    'La cousine de la grue : même base de l’oiseau, puis on tire sur la queue et les ailes battent pour de vrai. D’après la séquence présentée par origami.me.',
  papier: { recto: '#e7a1cf', verso: '#ffffff' },
  illustration,
  etapes: [...etapesBaseCarree, ...etapesBaseOiseau, etape13, etape14, etape15, etape16, etape17],
};

