import { useEffect, useRef } from 'react';
import { useProgression } from '../hooks/useProgression';
import { aller, lien } from '../hooks/useRoute';
import type { Modele } from '../modeles';
import { Lecteur, PlancheFixe } from '../pliage/Lecteur';
import { IconeAstuce, IconeChevronGauche } from '../ui/Icones';
import { Legende, signesDe } from '../ui/Legende';

const deuxChiffres = (n: number) => String(n).padStart(2, '0');

export function EtapeEcran({ modele, numero }: { modele: Modele; numero: number }) {
  const total = modele.etapes.length;
  const n = Math.min(Math.max(1, numero), total);
  const etape = modele.etapes[n - 1];
  const { noterEtape } = useProgression();
  const titreRef = useRef<HTMLHeadingElement>(null);

  const precedent = n > 1 ? lien.etape(modele.id, n - 1) : lien.modele(modele.id);
  const suivant = n < total ? lien.etape(modele.id, n + 1) : lien.fin(modele.id);

  useEffect(() => {
    if (n !== numero) aller(lien.etape(modele.id, n), true);
  }, [n, numero, modele.id]);

  useEffect(() => {
    noterEtape(modele.id, n);
    document.title = `${etape.titre} — ${modele.nom} · Pli`;
    // À chaque étape, on place le focus sur le titre : les lecteurs d'écran annoncent la nouvelle consigne.
    titreRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [modele.id, modele.nom, n, etape.titre, noterEtape]);

  // Flèches du clavier pour passer d'une étape à l'autre (hors champs de saisie et curseur du lecteur).
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null;
      if (cible && (cible.tagName === 'INPUT' || cible.tagName === 'TEXTAREA' || cible.isContentEditable)) return;
      if (e.altKey || e.metaKey || e.ctrlKey) return;
      if (e.key === 'ArrowRight') aller(suivant);
      if (e.key === 'ArrowLeft') aller(precedent);
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [suivant, precedent]);

  const titreSchema = `Schéma de l’étape ${n} : ${etape.titre}`;

  return (
    <div className="page page--etape">
      <header className="barre-haut">
        <a className="lien-retour" href={lien.modele(modele.id)}>
          <IconeChevronGauche />
          {modele.nom}
        </a>
        <span className="repere repere--fort" aria-label={`Étape ${n} sur ${total}`}>
          Étape {deuxChiffres(n)} / {total}
        </span>
      </header>

      <ol className="segments" aria-hidden="true">
        {modele.etapes.map((e, i) => (
          <li
            key={i}
            className={[
              'segment',
              i < n ? 'segment--fait' : '',
              i === n - 1 ? 'segment--actuel' : '',
              e.geste ? 'segment--anime' : '',
            ].join(' ')}
          />
        ))}
      </ol>

      <main className="etape">
        <div className="etape__figure">
          {etape.geste ? (
            <Lecteur figure={etape.figure} geste={etape.geste} papier={modele.papier} titre={titreSchema} />
          ) : (
            <PlancheFixe figure={etape.figure} papier={modele.papier} titre={titreSchema} />
          )}
        </div>

        <div className="etape__texte">
          <h1 className="etape__titre" ref={titreRef} tabIndex={-1}>
            {etape.titre}
          </h1>
          <p className="etape__consigne">{etape.consigne}</p>

          {etape.astuce && (
            <aside className="astuce coin-corne">
              <IconeAstuce />
              <p>{etape.astuce}</p>
            </aside>
          )}

          <Legende signes={signesDe(etape.figure)} />

          <nav className="navigation-etapes" aria-label="Étapes">
            <a className="bouton bouton--secondaire" href={precedent}>
              {n > 1 ? 'Précédente' : 'Présentation'}
            </a>
            <a className="bouton bouton--principal" href={suivant}>
              {n < total ? 'Suivante' : 'Terminer'}
            </a>
          </nav>
        </div>
      </main>

    </div>
  );
}
