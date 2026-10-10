/** Icônes au trait, dans l'esprit de la notation d'origami. Décoratives : le texte voisin porte le sens. */

const trait = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const IconeLecture = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <polygon points="7,4 20,12 7,20" fill="currentColor" />
  </svg>
);

export const IconePause = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="6" y="5" width="4" height="14" fill="currentColor" />
    <rect x="14" y="5" width="4" height="14" fill="currentColor" />
  </svg>
);

export const IconeRejouer = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...trait}>
    <path d="M4 12 A 8 8 0 1 0 7 5.8" />
    <polyline points="3,4 7,5.8 6,10" />
  </svg>
);

export const IconeChevronGauche = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...trait} strokeWidth={2.2}>
    <polyline points="15,5 8,12 15,19" />
  </svg>
);

export const IconeChevronDroite = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" {...trait}>
    <polyline points="9,5 16,12 9,19" />
  </svg>
);

export const IconeFermer = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...trait}>
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
);

export const IconeAstuce = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" {...trait}>
    <polygon points="12,3 21,12 12,21 3,12" />
    <line x1="12" y1="8" x2="12" y2="13" />
    <line x1="12" y1="16.5" x2="12" y2="16.6" />
  </svg>
);

export const IconeFeuille = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" {...trait}>
    <path d="M5 3 H15 L19 7 V21 H5 Z" />
    <polyline points="15,3 15,7 19,7" />
  </svg>
);

/** Marque Pli : un carré en losange, plié en deux sur la diagonale, posé sur une pastille sakura. */
export function Marque({ taille = 36, recto = 'var(--vermillon)' }: { taille?: number; recto?: string }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 132 132" aria-hidden="true">
      <circle cx="66" cy="66" r="64" fill="var(--sakura-pale)" />
      <polygon points="66,16 114,64 18,64" fill="#ffffff" stroke="#3d4058" strokeWidth="5" strokeLinejoin="round" />
      <polygon points="18,64 114,64 66,112" fill={recto} stroke="#3d4058" strokeWidth="5" strokeLinejoin="round" />
      <polygon points="18,64 114,64 66,90" fill="#ffffff" stroke="#3d4058" strokeWidth="5" strokeLinejoin="round" />
    </svg>
  );
}

/** Indicateur de difficulté : trois fleurs de cerisier, colorées selon le niveau. */
export function Fleurs({ niveau }: { niveau: 1 | 2 | 3 }) {
  const petale = 'M0 0 C -7 -6, -6 -15, 0 -17 C 6 -15, 7 -6, 0 0 Z';
  return (
    <span className={`fleurs fleurs--${niveau}`} aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <svg key={i} className={i <= niveau ? 'fleur fleur--pleine' : 'fleur'} width="16" height="16" viewBox="-20 -20 40 40">
          {[0, 72, 144, 216, 288].map((a) => (
            <path key={a} d={petale} transform={`rotate(${a})`} />
          ))}
        </svg>
      ))}
    </span>
  );
}
