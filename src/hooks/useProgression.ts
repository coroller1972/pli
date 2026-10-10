import { useCallback, useSyncExternalStore } from 'react';

/** Progression par modèle, gardée dans le navigateur. */
export interface Avancement {
  etape: number;
  termine: boolean;
  maj: number;
}
type Progression = Record<string, Avancement>;

const CLE = 'pli.progression.v1';
const abonnes = new Set<() => void>();
let cache: Progression | null = null;

function lire(): Progression {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(CLE) ?? '{}') as Progression;
  } catch {
    cache = {};
  }
  return cache;
}

function ecrire(p: Progression) {
  cache = p;
  try {
    localStorage.setItem(CLE, JSON.stringify(p));
  } catch {
    // Navigation privée ou stockage plein : la progression reste en mémoire pour la session.
  }
  abonnes.forEach((f) => f());
}

const sAbonner = (f: () => void) => {
  abonnes.add(f);
  return () => abonnes.delete(f);
};

export function useProgression() {
  const progression = useSyncExternalStore(sAbonner, lire, lire);

  const noterEtape = useCallback((id: string, etape: number) => {
    const actuelle = lire();
    if (actuelle[id]?.etape === etape && !actuelle[id]?.termine) return;
    ecrire({ ...actuelle, [id]: { etape, termine: false, maj: Date.now() } });
  }, []);

  const noterFin = useCallback((id: string, total: number) => {
    ecrire({ ...lire(), [id]: { etape: total, termine: true, maj: Date.now() } });
  }, []);

  /** Le pliage commencé le plus récemment et pas encore terminé. */
  const enCours = Object.entries(progression)
    .filter(([, a]) => !a.termine && a.etape > 1)
    .sort((a, b) => b[1].maj - a[1].maj)[0];

  return { progression, noterEtape, noterFin, enCours };
}
