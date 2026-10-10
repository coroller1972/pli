import { useEffect } from 'react';
import { useProgression } from '../hooks/useProgression';
import { lien } from '../hooks/useRoute';
import { MODELES, type Modele } from '../modeles';
import { PluieDePetales } from '../ui/Decor';
import { Illustration } from '../ui/Illustration';

export function Fin({ modele }: { modele: Modele }) {
  const { noterFin, progression } = useProgression();

  useEffect(() => {
    noterFin(modele.id, modele.etapes.length);
    document.title = `${modele.nom}, c’est plié · Pli`;
  }, [modele.id, modele.nom, modele.etapes.length, noterFin]);

  const suivant = MODELES.find((m) => m.id !== modele.id && !progression[m.id]?.termine);

  return (
    <div className="page">
      <PluieDePetales />
      <main className="fin">
        <div className="fin__dessin-cadre">
          <Illustration modele={modele} className="fin__dessin" />
        </div>
        <p className="fin__bravo" lang="ja" aria-hidden="true">
          やったね！
        </p>
        <p className="repere">Pliage terminé · {modele.etapes.length} étapes</p>
        <h1 className="titre-page">{modele.nom}, c’est plié.</h1>
        <p className="fin__texte">
          Bravo ! Posez-le quelque part où toute la famille le verra. Le prochain sera plus facile : les mains se souviennent des plis.
        </p>
        <div className="actions">
          {suivant ? (
            <a className="bouton bouton--principal" href={lien.modele(suivant.id)}>
              Plier {suivant.nom.toLowerCase()}
            </a>
          ) : null}
          <a className={`bouton ${suivant ? 'bouton--secondaire' : 'bouton--principal'}`} href={lien.catalogue()}>
            Retour au catalogue
          </a>
          <a className="lien-texte" href={lien.etape(modele.id, 1)}>
            Revoir les étapes
          </a>
        </div>
      </main>
    </div>
  );
}
