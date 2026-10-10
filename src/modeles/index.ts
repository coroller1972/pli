import { ballon } from './ballon';
import { bateau } from './bateau';
import { chat } from './chat';
import { chien } from './chien';
import { cocotte } from './cocotte';
import { cube } from './cube';
import { ecureuil } from './ecureuil';
import { etoile } from './etoile';
import { grenouille } from './grenouille';
import { grenouilleTraditionnelle } from './grenouille-traditionnelle';
import { grue } from './grue';
import { grueAiles } from './grue-ailes';
import { kabuto } from './kabuto';
import { lapin } from './lapin';
import { lys } from './lys';
import { marquePage } from './marque-page';
import { masu } from './masu';
import { pajarita } from './pajarita';
import { papillon } from './papillon';
import { renard } from './renard';
import type { Modele } from './types';

/** Rangés par niveau, du plus simple au plus délicat. */
export const MODELES: Modele[] = [chien, chat, renard, pajarita, marquePage, bateau, cocotte, kabuto, ballon, grenouille, lapin, ecureuil, papillon, grue, grueAiles, masu, cube, lys, grenouilleTraditionnelle, etoile];

export const trouverModele = (id: string): Modele | undefined => MODELES.find((m) => m.id === id);

export const nombreGestes = (m: Modele): number => m.etapes.filter((e) => e.geste).length;

export type { Etape, Modele, Niveau } from './types';
export { LIBELLES_NIVEAU } from './types';
