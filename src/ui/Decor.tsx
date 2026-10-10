/** Petits décors de la DA « atelier du dimanche » : nuages, soleil, fleurs de cerisier, vagues seigaiha. Tous décoratifs. */

/** Une fleur de cerisier à cinq pétales. */
export function Sakura({ taille = 18, couleur = 'var(--sakura)', className }: { taille?: number; couleur?: string; className?: string }) {
  const petale = 'M0 0 C -7 -6, -6 -15, 0 -17 C 6 -15, 7 -6, 0 0 Z';
  return (
    <svg className={className} width={taille} height={taille} viewBox="-20 -20 40 40" aria-hidden="true">
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} d={petale} transform={`rotate(${a})`} fill={couleur} />
      ))}
      <circle r="3.2" fill="var(--yuzu)" />
    </svg>
  );
}

/** Un nuage japonais, tout en volutes. */
export function Nuage({ largeur = 96, className }: { largeur?: number; className?: string }) {
  return (
    <svg className={className} width={largeur} height={largeur * 0.45} viewBox="0 0 120 54" aria-hidden="true">
      <path
        d="M14 46 C 2 46, 2 30, 14 30 C 12 18, 30 12, 38 22 C 42 6, 66 4, 72 20 C 80 12, 98 16, 96 30 C 110 28, 116 46, 102 46 Z"
        fill="var(--verso)"
        stroke="var(--ligne-forte)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M40 34 C 46 28, 54 30, 56 36" fill="none" stroke="var(--ligne-forte)" strokeWidth="2" strokeLinecap="round" />
      <path d="M70 32 C 76 26, 84 28, 86 34" fill="none" stroke="var(--ligne-forte)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Le soleil levant, en pastille. */
export function Soleil({ taille = 72, className }: { taille?: number; className?: string }) {
  return (
    <svg className={className} width={taille} height={taille} viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="30" fill="var(--vermillon)" />
      <circle cx="31" cy="31" r="7" fill="#ffffff" opacity="0.25" />
    </svg>
  );
}

/** Bande de vagues seigaiha, en motif répété. */
export function Vagues({ className }: { className?: string }) {
  return (
    <svg className={className} width="100%" height="48" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern id="seigaiha" width="40" height="20" patternUnits="userSpaceOnUse">
          {/* La rangée du fond d'abord : chaque rangée recouvre le bas de la précédente. */}
          {[
            [20, 10],
            [0, 20],
            [40, 20],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
              {[18, 13, 8, 3].map((r, i) => (
                <circle key={r} r={r} fill={i % 2 === 0 ? 'var(--sakura-pale)' : 'var(--verso)'} stroke="var(--sakura)" strokeWidth="1.4" />
              ))}
            </g>
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="48" fill="url(#seigaiha)" />
    </svg>
  );
}

/** Pétales qui tombent doucement, pour fêter un pliage terminé (aucun mouvement si l'animation est réduite). */
export function PluieDePetales() {
  const petales = [
    { x: 6, d: 0, t: 7.5, s: 16 },
    { x: 18, d: 2.2, t: 9, s: 12 },
    { x: 31, d: 0.8, t: 8.2, s: 18 },
    { x: 46, d: 3.1, t: 10, s: 13 },
    { x: 58, d: 1.4, t: 7.8, s: 16 },
    { x: 71, d: 4, t: 9.4, s: 11 },
    { x: 83, d: 0.4, t: 8.6, s: 17 },
    { x: 93, d: 2.7, t: 9.8, s: 13 },
  ];
  return (
    <div className="pluie" aria-hidden="true">
      {petales.map((p, i) => (
        <span
          key={i}
          className="pluie__petale"
          style={{ left: `${p.x}%`, animationDelay: `${p.d}s`, animationDuration: `${p.t}s` }}
        >
          <Sakura taille={p.s} couleur={i % 3 === 0 ? 'var(--vermillon-pale)' : 'var(--sakura)'} />
        </span>
      ))}
    </div>
  );
}
