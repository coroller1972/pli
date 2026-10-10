import { add, len, mul, norm, r2, sub } from './geo';
import type { PlanRendu } from './moteur';
import type { Fleche, Ligne, Pt } from './types';

export interface Papier {
  recto: string;
  verso: string;
}

interface Props {
  cadre: readonly [number, number, number, number];
  plans: PlanRendu[];
  lignes?: Ligne[];
  fleches?: Fleche[];
  papier: Papier;
  /** Opacité de la notation (lignes et flèches), qui s'efface pendant le geste. */
  notation?: number;
  /** Opacité de tout le dessin (utilisée au retour de boucle). */
  opacite?: number;
  titre: string;
  className?: string;
}

const ENCRE = 'var(--encre-planche)';
const pts = (p: readonly Pt[]) => p.map((q) => `${r2(q[0])},${r2(q[1])}`).join(' ');

const TIRETS: Record<Ligne['type'], string | undefined> = {
  vallee: '8 6',
  montagne: '11 4 2 4 2 4',
  marque: undefined,
  coupe: '2 4',
  feutre: undefined,
};

function TraitLigne({ l }: { l: Ligne }) {
  if (l.type === 'feutre') {
    return (
      <line
        x1={r2(l.a[0])}
        y1={r2(l.a[1])}
        x2={r2(l.b[0])}
        y2={r2(l.b[1])}
        stroke={ENCRE}
        strokeWidth={l.epaisseur ?? 2.2}
        strokeLinecap="round"
      />
    );
  }
  const marque = l.type === 'marque' || l.type === 'coupe';
  return (
    <line
      x1={r2(l.a[0])}
      y1={r2(l.a[1])}
      x2={r2(l.b[0])}
      y2={r2(l.b[1])}
      stroke={ENCRE}
      strokeWidth={marque ? 0.9 : 1.8}
      strokeOpacity={marque ? 0.45 : 1}
      strokeDasharray={TIRETS[l.type]}
      strokeLinecap={marque ? 'round' : 'butt'}
    />
  );
}

const TAILLE_POINTE = 11;

function TraitFleche({ f }: { f: Fleche }) {
  if (f.type === 'retourner') {
    // Boucle de « retourner la feuille », centrée sur `de`.
    const [x, y] = f.de;
    return (
      <g transform={`translate(${r2(x)} ${r2(y)})`} stroke={ENCRE} fill="none" strokeWidth={1.8}>
        <path d="M -13 9 A 15 12 0 1 1 13 7" />
        <polygon points="18,15 6,10 17,1" fill={ENCRE} stroke="none" />
      </g>
    );
  }
  const courbe = f.courbe ?? (f.type === 'devant' || f.type === 'derriere' ? 0.3 : 0);
  const d = sub(f.vers, f.de);
  const l = len(d);
  const perp: Pt = norm([-d[1], d[0]]);
  const ctrl = add(add(f.de, mul(d, 0.5)), mul(perp, courbe * l));
  const dir = norm(sub(f.vers, ctrl));
  const cote: Pt = [-dir[1], dir[0]];
  const base = sub(f.vers, mul(dir, TAILLE_POINTE));
  const g = add(base, mul(cote, TAILLE_POINTE * 0.5));
  const dr = sub(base, mul(cote, TAILLE_POINTE * 0.5));
  // Le trait s'arrête sous la pointe pour qu'elle reste nette.
  const finTrait = f.type === 'devant' || f.type === 'tirer' ? base : f.vers;
  const chemin = `M ${r2(f.de[0])} ${r2(f.de[1])} Q ${r2(ctrl[0])} ${r2(ctrl[1])} ${r2(finTrait[0])} ${r2(finTrait[1])}`;

  return (
    <g>
      <path
        d={chemin}
        fill="none"
        stroke={ENCRE}
        strokeWidth={f.type === 'pousser' ? 2.4 : 1.8}
        strokeLinecap="round"
      />
      {(f.type === 'devant' || f.type === 'tirer') && (
        <polygon points={pts([f.vers, g, dr])} fill={ENCRE} />
      )}
      {f.type === 'derriere' && (
        <polyline points={pts([g, f.vers])} fill="none" stroke={ENCRE} strokeWidth={1.8} strokeLinecap="round" />
      )}
      {f.type === 'pousser' && (
        <polygon
          points={pts([add(f.vers, mul(dir, 2)), add(base, mul(cote, 8)), sub(base, mul(cote, 8))])}
          fill="var(--planche)"
          stroke={ENCRE}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      )}
    </g>
  );
}

/** Dessin d'une figure : plans de papier, puis notation par-dessus. */
export function Schema({ cadre, plans, lignes, fleches, papier, notation = 1, opacite = 1, titre, className }: Props) {
  return (
    <svg
      className={className}
      viewBox={cadre.join(' ')}
      role="img"
      aria-label={titre}
      preserveAspectRatio="xMidYMid meet"
    >
      <g opacity={opacite}>
        {plans.map((p) => (
          <g key={p.id}>
            <polygon
              points={pts(p.pts)}
              fill={p.teinte ?? (p.face === 'recto' ? papier.recto : papier.verso)}
              stroke={ENCRE}
              strokeWidth={1.3}
              strokeLinejoin="round"
            />
            {p.ombre > 0.005 && <polygon points={pts(p.pts)} fill="#3d4058" fillOpacity={p.ombre} />}
          </g>
        ))}
        {notation > 0.001 && (
          <g opacity={notation}>
            {lignes?.map((l, i) => <TraitLigne key={`l${i}`} l={l} />)}
            {fleches?.map((f, i) => <TraitFleche key={`f${i}`} f={f} />)}
          </g>
        )}
      </g>
    </svg>
  );
}
