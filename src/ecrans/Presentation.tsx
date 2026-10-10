import { useProgression } from '../hooks/useProgression';
import { lien } from '../hooks/useRoute';
import { LIBELLES_NIVEAU, nombreGestes, type Modele } from '../modeles';
import type { CSSProperties } from 'react';
import { Fleurs, IconeChevronGauche, IconeFeuille } from '../ui/Icones';
import { Illustration } from '../ui/Illustration';
import { Legende, TOUS_LES_SIGNES } from '../ui/Legende';

export function Presentation({ modele }: { modele: Modele }) {
  const { progression } = useProgression();
  const a = progression[modele.id];
  const enCours = a && !a.termine && a.etape > 1;
  const gestes = nombreGestes(modele);

  return (
    <div className="page">
      <header className="barre-haut">
        <a className="lien-retour" href={lien.catalogue()}>
          <IconeChevronGauche />
          Catalogue
        </a>
      </header>

      <main className="presentation">
        <div
          className="planche presentation__planche coin-corne"
          style={{ '--teinte': modele.papier.recto } as CSSProperties}
        >
          <Illustration modele={modele} className="presentation__dessin" />
          {modele.kana && (
            <span className="presentation__kana" lang="ja" aria-hidden="true">
              {modele.kana}
            </span>
          )}
        </div>

        <div className="presentation__texte">
          <div>
            {modele.sousTitre && <p className="repere">{modele.sousTitre}</p>}
            <h1 className="titre-page">{modele.nom}</h1>
          </div>
          <p className="presentation__resume">{modele.resume}</p>

          <dl className="fiche">
            <div>
              <dt className="repere">Niveau</dt>
              <dd>
                <span className={`pastille-niveau pastille-niveau--${modele.niveau}`}>
                  <Fleurs niveau={modele.niveau} />
                  {LIBELLES_NIVEAU[modele.niveau]}
                </span>
              </dd>
            </div>
            <div>
              <dt className="repere">Étapes</dt>
              <dd>
                {modele.etapes.length}, dont {gestes} {gestes > 1 ? 'animées' : 'animée'}
              </dd>
            </div>
            <div>
              <dt className="repere">Durée</dt>
              <dd>Environ {modele.duree}</dd>
            </div>
          </dl>

          <p className="feuille">
            <IconeFeuille />
            {modele.feuille}
          </p>

          <div className="actions">
            {enCours ? (
              <>
                <a className="bouton bouton--principal" href={lien.etape(modele.id, a.etape)}>
                  Reprendre à l’étape {a.etape}
                </a>
                <a className="bouton bouton--secondaire" href={lien.etape(modele.id, 1)}>
                  Recommencer
                </a>
              </>
            ) : (
              <a className="bouton bouton--principal" href={lien.etape(modele.id, 1)}>
                Commencer {modele.nom.toLowerCase()}
              </a>
            )}
          </div>

          <details className="lire-schemas">
            <summary>Comment lire les schémas</summary>
            <Legende signes={TOUS_LES_SIGNES} />
          </details>
        </div>
      </main>
    </div>
  );
}
