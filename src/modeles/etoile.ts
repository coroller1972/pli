import { plan, pt } from '../pliage/geo';
import type { Figure, Fleche, Ligne, Plan, Pt } from '../pliage/types';
import { add3, centre3, cross3, dot3, mul3, norm3, type P3, sub3, vue } from './espace';
import { CADRE_MODULE, carreModule, coteModule, etapesModule, moduleFini } from './sonobe';
import type { Etape, Modele } from './types';

/*
 * L'étoile kusudama : trente modules Sonobe forment vingt pyramides posées sur les faces
 * d'un icosaèdre. Chaque module est plié en deux sur la diagonale de son carré, qui suit une arête :
 * ses deux moitiés appartiennent aux deux pyramides de part et d'autre.
 *
 * Chaque pyramide est un coin de cube (trois triangles rectangles isocèles) : pour une face
 * équilatérale d'arête e, sa pointe est à e/√6 au-dessus du centre de la face.
 */

const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };

const ECART = 34;
const VUE = vue(18, 16);
const COULEURS = ['#e88a92', '#f6d27a', '#7ea3d9'];

// ─── L'icosaèdre ───────────────────────────────────────────────────────────────
const PHI = (1 + Math.sqrt(5)) / 2;
const k = 31; // échelle : arête 2k
const SOMMETS: P3[] = [];
for (const s1 of [1, -1]) {
  for (const s2 of [1, -1]) {
    SOMMETS.push([0, s1 * k, s2 * k * PHI], [s1 * k, s2 * k * PHI, 0], [s2 * k * PHI, 0, s1 * k]);
  }
}
const ARETE = 2 * k;
const voisins = (i: number, j: number) =>
  Math.abs(Math.hypot(...sub3(SOMMETS[i], SOMMETS[j])) - ARETE) < 1e-6;

const ARETES: [number, number][] = [];
const FACES: [number, number, number][] = [];
for (let i = 0; i < 12; i++) {
  for (let j = i + 1; j < 12; j++) {
    if (!voisins(i, j)) continue;
    ARETES.push([i, j]);
    for (let l = j + 1; l < 12; l++) if (voisins(i, l) && voisins(j, l)) FACES.push([i, j, l]);
  }
}

/** Trois couleurs, dix modules chacune, et jamais deux fois la même couleur sur une pyramide. */
function colorier(): number[] {
  const couleur = ARETES.map(() => -1);
  const facesDe = ARETES.map(([i, j]) => FACES.filter((fa) => fa.includes(i) && fa.includes(j)));
  const indice = (i: number, j: number) => ARETES.findIndex(([x, y]) => (x === i && y === j) || (x === j && y === i));
  const libre = (e: number, c: number) =>
    facesDe[e].every(([x, y, z]) =>
      [indice(x, y), indice(y, z), indice(x, z)].every((autre) => autre === e || couleur[autre] !== c),
    );
  const essayer = (e: number): boolean => {
    if (e === ARETES.length) return true;
    for (let c = 0; c < 3; c++) {
      if (!libre(e, c)) continue;
      couleur[e] = c;
      if (essayer(e + 1)) return true;
    }
    couleur[e] = -1;
    return false;
  };
  essayer(0);
  return couleur;
}
const COULEUR_ARETE = colorier();

/** La pointe de la pyramide posée sur une face. */
function pointe(fa: [number, number, number]): P3 {
  const c = centre3(fa.map((i) => SOMMETS[i]));
  return add3(c, mul3(norm3(c), ARETE / Math.sqrt(6)));
}

interface Triangle {
  id: string;
  pts: P3[];
  /** L'arête de l'icosaèdre, donc le module : ses deux triangles bougent ensemble. */
  module: number;
  face: number;
}

const TRIANGLES: Triangle[] = ARETES.flatMap(([i, j], m) =>
  FACES.map((fa, n) => ({ fa, n }))
    .filter(({ fa }) => fa.includes(i) && fa.includes(j))
    .map(({ fa, n }) => ({ id: `m${m}-f${n}`, pts: [SOMMETS[i], SOMMETS[j], pointe(fa)], module: m, face: n })),
);

const normale = (t: Triangle): P3 => {
  const n = norm3(cross3(sub3(t.pts[1], t.pts[0]), sub3(t.pts[2], t.pts[0])));
  return dot3(n, centre3(t.pts)) < 0 ? mul3(n, -1) : n;
};
/** Chaque module s'écarte vers l'extérieur, dans la direction du milieu de son arête. */
const direction = (t: Triangle): P3 => norm3(centre3(t.pts.slice(0, 2)));
const projeter = (t: Triangle, ecart: number): Pt[] => t.pts.map((p) => VUE.projeter(add3(p, mul3(direction(t), ecart))));
const profondeur = (t: Triangle) => VUE.profondeur(centre3(t.pts));

/** Les triangles choisis, du plus lointain au plus proche, écartés ou non. */
function plansDe(choix: Triangle[], ecart: number): Plan[] {
  return [...choix]
    .sort((x, y) => profondeur(y) - profondeur(x))
    .map((t) => ({
      ...plan(t.id, projeter(t, ecart), 'recto', VUE.ombre(normale(t))),
      dos: 'recto' as const,
      teinte: COULEURS[COULEUR_ARETE[t.module]],
    }));
}
const cible = (choix: Triangle[]): Record<string, Pt[]> => Object.fromEntries(choix.map((t) => [t.id, projeter(t, 0)]));
const modulesDe = (faces: Set<number>) => {
  const modules = new Set(TRIANGLES.filter((t) => faces.has(t.face)).map((t) => t.module));
  return TRIANGLES.filter((t) => modules.has(t.module));
};

// La face la plus proche du regard : la première pyramide.
const profondeurFace = (n: number) => VUE.profondeur(pointe(FACES[n]));
const faceDevant = FACES.map((_, n) => n).sort((x, y) => profondeurFace(x) - profondeurFace(y))[0];
const PREMIERE = modulesDe(new Set([faceDevant]));
// Le sommet le plus proche : la couronne de cinq pyramides qui l'entoure.
const sommetDevant = SOMMETS.map((_, i) => i).sort((x, y) => VUE.profondeur(SOMMETS[x]) - VUE.profondeur(SOMMETS[y]))[0];
const COURONNE = modulesDe(new Set(FACES.map((fa, n) => (fa.includes(sommetDevant) ? n : -1)).filter((n) => n >= 0)));

const CADRE_ETOILE = [-112, -112, 224, 224] as const;

const etape6: Etape = {
  titre: 'Trente modules, pliés en deux',
  consigne:
    'Pliez trente modules, dix de chaque couleur. Sur chacun, pliez le carré en deux le long de sa diagonale, puis relevez les pattes à angle droit.',
  astuce: 'Trente modules, c’est long : partagez le travail en famille, mais vérifiez qu’ils sont tous pliés dans le même sens.',
  figure: {
    cadre: CADRE_MODULE,
    plans: moduleFini(),
    lignes: [v(carreModule[3], carreModule[1]), v(carreModule[0], carreModule[1]), v(carreModule[2], carreModule[3])],
    fleches: [f(pt(-coteModule + 4, 14), pt(-coteModule + 4, -14), 'devant', 0.6)],
  },
};

const etape7: Etape = {
  titre: 'Une première pyramide',
  consigne:
    'Trois modules de trois couleurs : glissez la patte de l’un dans la poche du suivant, puis fermez le triangle avec le troisième. Une petite pyramide se dresse.',
  astuce: 'Pincez la pointe de la pyramide entre deux doigts pendant que vous glissez la troisième patte.',
  figure: {
    cadre: CADRE_ETOILE,
    plans: plansDe(PREMIERE, ECART),
  },
  geste: {
    duree: 3200,
    pistes: [{ type: 'morph', vers: cible(PREMIERE) }],
  },
};

const etape8: Etape = {
  titre: 'Une couronne de cinq',
  consigne:
    'Ajoutez des modules autour : cinq pyramides se referment autour d’un creux en étoile. Partout sur la boule, chaque creux réunit cinq modules.',
  astuce: 'Une même couleur ne doit jamais se retrouver deux fois sur une pyramide : c’est le secret d’une jolie boule.',
  figure: {
    cadre: CADRE_ETOILE,
    plans: plansDe(COURONNE, 0),
  },
};

const etape9: Etape = {
  titre: 'Fermer l’étoile',
  consigne:
    'Continuez couronne après couronne. La boule se courbe toute seule. Les derniers modules sont les plus difficiles : glissez-les un à un, en tenant l’étoile au creux de la main.',
  astuce: 'Pour la toute dernière patte, aidez-vous d’une pince à épiler ou d’un cure-dent.',
  figure: {
    cadre: CADRE_ETOILE,
    plans: plansDe(TRIANGLES, ECART),
  },
  geste: {
    duree: 3800,
    pistes: [{ type: 'morph', vers: cible(TRIANGLES) }],
  },
};

const etoileFinie = (): Plan[] => plansDe(TRIANGLES, 0);

const etape10: Etape = {
  titre: 'L’étoile est prête',
  consigne:
    'Pressez doucement chaque pyramide pour bien tout emboîter. Suspendez l’étoile à un fil : au Japon, les kusudama décorent les fêtes.',
  figure: {
    cadre: CADRE_ETOILE,
    plans: etoileFinie(),
  },
};

const illustration: Figure = {
  cadre: [-88, -88, 176, 176],
  plans: etoileFinie(),
};

export const etoile: Modele = {
  id: 'etoile',
  nom: 'L’étoile kusudama',
  sousTitre: 'Boule Sonobe à 30 modules',
  kana: 'くすだま',
  niveau: 3,
  duree: '2 h',
  feuille: 'Trente feuilles carrées de 7,5 × 7,5 cm, en trois couleurs (dix de chaque)',
  resume:
    'Le grand défi du catalogue : trente modules, vingt pointes, et une boule qui ne tient que par ses plis. À plier à plusieurs mains.',
  papier: { recto: '#e88a92', verso: '#fbe3e5' },
  illustration,
  etapes: [...etapesModule, etape6, etape7, etape8, etape9, etape10],
};
