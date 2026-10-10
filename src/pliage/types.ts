/** Un point du schéma, en unités du viewBox (y vers le bas). */
export type Pt = readonly [number, number];

/** Face du papier visible pour le spectateur. */
export type Face = 'recto' | 'verso';

/** Un morceau de papier plat, dessiné comme un polygone. */
export interface Plan {
  id: string;
  pts: Pt[];
  face: Face;
  /** Assombrissement fixe (0 à 1), pour suggérer une couche en retrait. */
  ombre?: number;
  /**
   * Face montrée quand le plan se retourne (par défaut, l'autre face).
   * Utile pour un rabat de deux couches, coloré des deux côtés.
   */
  dos?: Face;
  /**
   * Rang de dessin une fois retourné (par défaut, sa place dans la liste).
   * Un rabat qui se replie sous une autre couche passe ainsi dessous.
   */
  zRetourne?: number;
  /** Couleur imposée (une feuille d'une autre couleur, dans un pliage modulaire). */
  teinte?: string;
}

/**
 * Notation des diagrammes d'origami (système Yoshizawa-Randlett) :
 * - vallee : tirets, le papier se replie vers soi ;
 * - montagne : trait-point-point, le papier se replie derrière ;
 * - marque : pli déjà marqué, trait fin ;
 * - coupe : repère discret (limite d'une zone) ;
 * - feutre : un trait dessiné au feutre sur le modèle (yeux, moustaches…).
 */
export type TypeLigne = 'vallee' | 'montagne' | 'marque' | 'coupe' | 'feutre';

export interface Ligne {
  a: Pt;
  b: Pt;
  type: TypeLigne;
  /** Épaisseur du trait, pour le feutre (un trait de longueur nulle fait un point). */
  epaisseur?: number;
}

/**
 * Flèches :
 * - devant : plier vers soi (pointe pleine) ;
 * - derriere : plier derrière (pointe ouverte) ;
 * - pousser : enfoncer, pousser vers l'intérieur (pointe creuse) ;
 * - tirer : tirer, ouvrir (trait droit) ;
 * - retourner : retourner la feuille (boucle), placée en `de`.
 */
export type TypeFleche = 'devant' | 'derriere' | 'pousser' | 'tirer' | 'retourner';

export interface Fleche {
  de: Pt;
  vers: Pt;
  type: TypeFleche;
  /** Courbure : écart du point de contrôle, en fraction de la longueur (signe = côté). */
  courbe?: number;
}

/** Un schéma fixe : l'état du papier au début de l'étape, avec la notation du geste à faire. */
export interface Figure {
  /** viewBox : [x, y, largeur, hauteur]. */
  cadre: readonly [number, number, number, number];
  plans: Plan[];
  lignes?: Ligne[];
  fleches?: Fleche[];
}

interface FenetreTemps {
  /** Début et fin de la piste, en fraction de la durée du geste (0 à 1). */
  de?: number;
  a?: number;
}

/** Plier des plans autour d'un axe (rotation 3D projetée, avec perspective). */
export interface PistePli extends FenetreTemps {
  type: 'pli';
  ids: string[];
  axe: readonly [Pt, Pt];
  /** 1 : le rabat vient vers le spectateur (pli vallée) ; -1 : il passe derrière (pli montagne). */
  sens?: 1 | -1;
  /** Angle final en degrés (180 par défaut). */
  angle?: number;
}

/** Faire pivoter des plans dans le plan du schéma (pli inversé vu de profil, par exemple). */
export interface PisteRotation extends FenetreTemps {
  type: 'rotation';
  ids: string[];
  pivot: Pt;
  /** Degrés, sens horaire à l'écran. */
  angle: number;
}

/** Déformer des plans vers une forme cible (mêmes sommets, mêmes ordres). */
export interface PisteMorph extends FenetreTemps {
  type: 'morph';
  vers: Record<string, Pt[]>;
  /** Ombre fixe atteinte en fin de piste, par plan. */
  ombres?: Record<string, number>;
}

export type Piste = PistePli | PisteRotation | PisteMorph;

/** Un geste animé : une suite de pistes jouées sur la figure de l'étape. */
export interface Geste {
  pistes: Piste[];
  /** Durée du geste à vitesse 1×, en millisecondes. */
  duree: number;
}
