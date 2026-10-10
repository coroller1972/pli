import { useEffect, useState } from 'react';

/**
 * Routage par hash, sans dépendance : l'app fonctionne sur n'importe quel hébergement statique.
 *   #/                  catalogue
 *   #/m/grue            présentation d'un modèle
 *   #/m/grue/7          étape 7
 *   #/m/grue/fin        modèle terminé
 */
export type Route =
  | { ecran: 'catalogue' }
  | { ecran: 'modele'; id: string }
  | { ecran: 'etape'; id: string; numero: number }
  | { ecran: 'fin'; id: string };

export function lireRoute(hash: string): Route {
  const morceaux = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (morceaux[0] === 'm' && morceaux[1]) {
    const id = decodeURIComponent(morceaux[1]);
    if (morceaux[2] === 'fin') return { ecran: 'fin', id };
    const n = Number(morceaux[2]);
    if (Number.isInteger(n) && n > 0) return { ecran: 'etape', id, numero: n };
    return { ecran: 'modele', id };
  }
  return { ecran: 'catalogue' };
}

export const lien = {
  catalogue: () => '#/',
  modele: (id: string) => `#/m/${encodeURIComponent(id)}`,
  etape: (id: string, n: number) => `#/m/${encodeURIComponent(id)}/${n}`,
  fin: (id: string) => `#/m/${encodeURIComponent(id)}/fin`,
};

export function aller(hash: string, remplacer = false): void {
  if (remplacer) window.history.replaceState(null, '', hash);
  else window.location.hash = hash;
  if (remplacer) window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => lireRoute(window.location.hash));
  useEffect(() => {
    const surChangement = () => setRoute(lireRoute(window.location.hash));
    window.addEventListener('hashchange', surChangement);
    return () => window.removeEventListener('hashchange', surChangement);
  }, []);
  return route;
}
