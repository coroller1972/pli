import { useMemo } from 'react';
import type { Modele } from '../modeles';
import { preparer } from '../pliage/moteur';
import { Schema } from '../pliage/Schema';

/** Le modèle terminé, dessiné avec le même moteur que les étapes. */
export function Illustration({ modele, className }: { modele: Modele; className?: string }) {
  const plans = useMemo(() => preparer(modele.illustration)(0), [modele]);
  return (
    <Schema
      className={className}
      cadre={modele.illustration.cadre}
      plans={plans}
      lignes={modele.illustration.lignes}
      papier={modele.papier}
      titre={`${modele.nom}, une fois pliée`}
    />
  );
}
