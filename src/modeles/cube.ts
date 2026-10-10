import { plan, pt } from '../pliage/geo';
import type { Face, Figure, Fleche, Ligne, Plan, Pt } from '../pliage/types';
import { add3, mul3, type P3, vue } from './espace';
import { CADRE_MODULE, carreModule, coteModule, etapesModule, moduleFini } from './sonobe';
import type { Etape, Modele } from './types';

/*
 * Le cube modulaire : six modules Sonobe, un par face. Les pattes de chaque module
 * se glissent dans les poches de ses voisins ; le cube tient sans colle.
 */

const v = (a: Pt, b: Pt, type: Ligne['type'] = 'vallee'): Ligne => ({ a, b, type });
const f = (de: Pt, vers: Pt, type: Fleche['type'] = 'devant', courbe?: number): Fleche =>
  courbe === undefined ? { de, vers, type } : { de, vers, type, courbe };

const s = 42; // demi-côté du cube
const ECART = 46; // de combien les faces s'écartent avant l'assemblage
const VUE = vue(-32, 26);
const ROUGE = '#e88a92';

interface FaceCube {
  id: string;
  normale: P3;
  coins: P3[];
  couleur: Face;
  /** Troisième couleur, pour la dernière paire de faces. */
  teinte?: string;
}

/** Les six faces, chacune coupée en deux triangles le long de la fente du module. */
const FACES: FaceCube[] = [0, 1, 2].flatMap((axe) =>
  [1, -1].map((signe) => {
    const [a, b] = [0, 1, 2].filter((i) => i !== axe);
    const coin = (i: number, j: number): P3 => {
      const p = [0, 0, 0];
      p[axe] = signe * s;
      p[a] = i * s;
      p[b] = j * s;
      return [p[0], p[1], p[2]];
    };
    const normale: P3 = axe === 0 ? [signe, 0, 0] : axe === 1 ? [0, signe, 0] : [0, 0, signe];
    return {
      id: `${'xyz'[axe]}${signe > 0 ? '+' : '-'}`,
      normale,
      coins: [coin(-1, -1), coin(1, -1), coin(1, 1), coin(-1, 1)],
      // Trois couleurs, une par paire de faces opposées (comme les deux modules de chaque couleur).
      couleur: axe === 2 ? 'verso' : 'recto',
      ...(axe === 1 ? { teinte: ROUGE } : {}),
    };
  }),
);

const triangles = (fa: FaceCube): { id: string; pts: P3[] }[] => {
  const [c0, c1, c2, c3] = fa.coins;
  return [
    { id: `${fa.id}-a`, pts: [c0, c1, c2] },
    { id: `${fa.id}-b`, pts: [c0, c2, c3] },
  ];
};

const profondeurFace = (fa: FaceCube) => VUE.profondeur(mul3(fa.normale, s));
/** Les faces de derrière d'abord : on les voit par l'intérieur tant que le cube est ouvert. */
const PAR_PROFONDEUR = [...FACES].sort((a, b) => profondeurFace(b) - profondeurFace(a));
const DERRIERE = PAR_PROFONDEUR.slice(0, 3);
const DEVANT = PAR_PROFONDEUR.slice(3);

const projeter = (fa: FaceCube, ecart: number) =>
  triangles(fa).map((t) => ({ id: t.id, pts: t.pts.map((p) => VUE.projeter(add3(p, mul3(fa.normale, ecart)))) }));

function plansDe(faces: FaceCube[], ecart: number): Plan[] {
  return faces.flatMap((fa) => {
    const vueDeDos = profondeurFace(fa) > 0;
    // Vue de l'intérieur, une face est dans l'ombre ; de l'extérieur, la lumière décide.
    const ombre = vueDeDos ? 0.32 : VUE.ombre(fa.normale);
    return projeter(fa, ecart).map((t) => ({
      ...plan(t.id, t.pts, fa.couleur, ombre),
      dos: fa.couleur,
      ...(fa.teinte ? { teinte: fa.teinte } : {}),
    }));
  });
}

const cible = (faces: FaceCube[]): Record<string, Pt[]> =>
  Object.fromEntries(faces.flatMap((fa) => projeter(fa, 0).map((t) => [t.id, t.pts])));

const CADRE_CUBE = [-120, -125, 240, 240] as const;

const etape6: Etape = {
  titre: 'Six modules, pattes relevées',
  consigne:
    'Pliez six modules en tout, deux de chaque couleur. Sur chacun, relevez les deux pattes à angle droit le long des côtés du carré.',
  astuce: 'Plier les six modules d’affilée, c’est le meilleur moyen de les avoir tous pareils.',
  figure: {
    cadre: CADRE_MODULE,
    plans: moduleFini(),
    lignes: [v(carreModule[0], carreModule[1]), v(carreModule[2], carreModule[3])],
    fleches: [f(pt(coteModule + 4, -2 * coteModule + 6), pt(coteModule + 18, -coteModule), 'devant', 0.5)],
  },
};

const etape7: Etape = {
  titre: 'Assembler un coin',
  consigne:
    'Glissez une patte d’un module dans la poche d’un autre, à angle droit. Ajoutez un troisième module : les trois carrés forment un coin, comme l’angle d’une boîte.',
  astuce: 'La poche est la fente entre le rabat et le dos du module. Enfoncez la patte jusqu’au bout.',
  figure: {
    cadre: CADRE_CUBE,
    plans: plansDe(DERRIERE, ECART),
  },
  geste: {
    duree: 3200,
    pistes: [{ type: 'morph', vers: cible(DERRIERE) }],
  },
};

const etape8: Etape = {
  titre: 'Fermer le cube',
  consigne:
    'Ajoutez les trois derniers modules, un par un. Le dernier est le plus délicat : ses deux pattes et les deux pattes voisines doivent entrer en même temps.',
  astuce: 'Si une patte refuse d’entrer, desserrez un peu les autres, glissez-la, puis resserrez le tout.',
  figure: {
    cadre: CADRE_CUBE,
    plans: [...plansDe(DERRIERE, 0), ...plansDe(DEVANT, ECART)],
  },
  geste: {
    duree: 3600,
    pistes: DEVANT.map((fa, i) => ({
      type: 'morph' as const,
      de: i * 0.25,
      a: 0.5 + i * 0.25,
      vers: cible([fa]),
    })),
  },
};

const cubeFini = (): Plan[] => [...plansDe(DERRIERE, 0), ...plansDe(DEVANT, 0)];

const etape9: Etape = {
  titre: 'Le cube est fini',
  consigne:
    'Pressez doucement chaque face pour que tout s’emboîte bien. Le cube tient tout seul : lancez-le, empilez-en plusieurs, faites-en un dé !',
  figure: {
    cadre: CADRE_CUBE,
    plans: cubeFini(),
  },
};

const illustration: Figure = {
  cadre: [-78, -82, 156, 160],
  plans: cubeFini(),
};

export const cube: Modele = {
  id: 'cube',
  nom: 'Le cube modulaire',
  sousTitre: 'Cube Sonobe',
  kana: 'キューブ',
  niveau: 3,
  duree: '30 min',
  feuille: 'Six feuilles carrées de 7,5 × 7,5 cm, en trois couleurs (deux de chaque)',
  resume:
    'Six modules identiques qui s’emboîtent sans colle. Chaque module est simple ; tout l’art est dans l’assemblage, surtout le dernier.',
  papier: { recto: '#7ea3d9', verso: '#f6d27a' },
  illustration,
  etapes: [...etapesModule, etape6, etape7, etape8, etape9],
};
