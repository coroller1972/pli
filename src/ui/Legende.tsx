import type { Figure, TypeFleche, TypeLigne } from '../pliage/types';

type Signe = TypeLigne | TypeFleche;

const LIBELLES: Partial<Record<Signe, string>> = {
  vallee: 'Pli vallée : le papier vient vers vous',
  montagne: 'Pli montagne : le papier passe derrière',
  devant: 'Plier dans ce sens, vers vous',
  derriere: 'Plier derrière',
  pousser: 'Pousser, enfoncer',
  tirer: 'Tirer, ouvrir',
  retourner: 'Retourner le pliage',
};

const ORDRE: Signe[] = ['vallee', 'montagne', 'devant', 'derriere', 'pousser', 'tirer', 'retourner'];

function Pictogramme({ signe }: { signe: Signe }) {
  const s = { stroke: 'currentColor', strokeWidth: 2, fill: 'none' };
  switch (signe) {
    case 'vallee':
      return <line x1="2" y1="12" x2="42" y2="12" {...s} strokeDasharray="7 5" />;
    case 'montagne':
      return <line x1="2" y1="12" x2="42" y2="12" {...s} strokeDasharray="9 3 2 3 2 3" />;
    case 'devant':
      return (
        <>
          <path d="M4 19 C 14 2, 30 2, 36 14" {...s} />
          <polygon points="40,20 31,13 41,10" fill="currentColor" />
        </>
      );
    case 'derriere':
      return (
        <>
          <path d="M4 19 C 14 2, 30 2, 38 17" {...s} />
          <polyline points="31,15 38,17 39,10" {...s} />
        </>
      );
    case 'pousser':
      return (
        <>
          <line x1="4" y1="12" x2="28" y2="12" {...s} strokeWidth={2.4} />
          <polygon points="40,12 28,5 28,19" fill="var(--verso)" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
        </>
      );
    case 'tirer':
      return (
        <>
          <line x1="4" y1="12" x2="30" y2="12" {...s} />
          <polygon points="40,12 30,7 30,17" fill="currentColor" />
        </>
      );
    case 'retourner':
      return (
        <g transform="translate(22 12)">
          <path d="M -9 6 A 10 8 0 1 1 9 5" {...s} />
          <polygon points="13,10 4,7 12,0" fill="currentColor" />
        </g>
      );
    default:
      return null;
  }
}

/** Les signes de notation utilisés par une figure, expliqués en clair. */
export function signesDe(figure: Figure): Signe[] {
  const presents = new Set<Signe>();
  figure.lignes?.forEach((l) => {
    if (l.type === 'vallee' || l.type === 'montagne') presents.add(l.type);
  });
  figure.fleches?.forEach((f) => presents.add(f.type));
  return ORDRE.filter((s) => presents.has(s));
}

export function Legende({ signes, titre }: { signes: Signe[]; titre?: string }) {
  if (signes.length === 0) return null;
  return (
    <div className="legende">
      {titre && <h2 className="intertitre">{titre}</h2>}
      <ul className="legende__liste">
        {signes.map((s) => (
          <li key={s} className="legende__item">
            <svg width="44" height="24" viewBox="0 0 44 24" aria-hidden="true">
              <Pictogramme signe={s} />
            </svg>
            <span>{LIBELLES[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const TOUS_LES_SIGNES = ORDRE;
