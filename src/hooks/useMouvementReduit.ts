import { useEffect, useState } from 'react';

const REQUETE = '(prefers-reduced-motion: reduce)';

/** Vrai si la personne a demandé à réduire les animations dans son système. */
export function useMouvementReduit(): boolean {
  const [reduit, setReduit] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(REQUETE).matches : false,
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(REQUETE);
    const surChangement = () => setReduit(mq.matches);
    mq.addEventListener('change', surChangement);
    return () => mq.removeEventListener('change', surChangement);
  }, []);
  return reduit;
}
