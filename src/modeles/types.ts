import type { Papier } from '../pliage/Schema';
import type { Figure, Geste } from '../pliage/types';

export interface Etape {
  titre: string;
  consigne: string;
  astuce?: string;
  figure: Figure;
  /** Présent seulement pour les gestes délicats : l'étape devient animée. */
  geste?: Geste;
}

export type Niveau = 1 | 2 | 3;

export interface Modele {
  id: string;
  nom: string;
  /** Nom d'origine, affiché en sous-titre. */
  sousTitre?: string;
  /** Le nom en japonais (kana), en petit décor sur les cartes. */
  kana?: string;
  niveau: Niveau;
  /** Durée indicative pour une première fois. */
  duree: string;
  /** Feuille à préparer. */
  feuille: string;
  resume: string;
  papier: Papier;
  /** Le modèle terminé, pour le catalogue et l'écran de fin. */
  illustration: Figure;
  etapes: Etape[];
}

export const LIBELLES_NIVEAU: Record<Niveau, string> = {
  1: 'Débutant',
  2: 'Intermédiaire',
  3: 'Avancé',
};
