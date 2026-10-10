import { useState, type CSSProperties } from 'react';
import { useProgression } from '../hooks/useProgression';
import { lien } from '../hooks/useRoute';
import { LIBELLES_NIVEAU, MODELES, nombreGestes, trouverModele, type Modele, type Niveau } from '../modeles';
import { Nuage, Sakura, Soleil, Vagues } from '../ui/Decor';
import { Fleurs, IconeChevronDroite, Marque } from '../ui/Icones';
import { Illustration } from '../ui/Illustration';

const FILTRES: { valeur: Niveau | 0; libelle: string }[] = [
  { valeur: 0, libelle: 'Tout' },
  { valeur: 1, libelle: LIBELLES_NIVEAU[1] },
  { valeur: 2, libelle: LIBELLES_NIVEAU[2] },
  { valeur: 3, libelle: LIBELLES_NIVEAU[3] },
];

function meta(m: Modele) {
  const g = nombreGestes(m);
  return `${m.etapes.length} étapes · ${g} ${g > 1 ? 'gestes animés' : 'geste animé'}`;
}

/** La couleur du papier du modèle teinte sa carte. */
const teinte = (m: Modele) => ({ '--teinte': m.papier.recto }) as CSSProperties;

function CarteModele({ modele, etat }: { modele: Modele; etat?: string }) {
  return (
    <li>
      <a className="carte-modele" href={lien.modele(modele.id)} style={teinte(modele)}>
        <span className="carte-modele__vignette">
          <Illustration modele={modele} className="carte-modele__dessin" />
          {modele.kana && (
            <span className="carte-modele__kana" lang="ja" aria-hidden="true">
              {modele.kana}
            </span>
          )}
        </span>
        <span className="carte-modele__texte">
          <span className="carte-modele__nom">{modele.nom}</span>
          <span className="carte-modele__meta">{meta(modele)}</span>
          <span className="carte-modele__bas">
            <span className={`pastille-niveau pastille-niveau--${modele.niveau}`}>
              <Fleurs niveau={modele.niveau} />
              {LIBELLES_NIVEAU[modele.niveau]}
            </span>
            {etat && <span className="carte-modele__etat">{etat}</span>}
          </span>
        </span>
      </a>
    </li>
  );
}

export function Catalogue() {
  const [filtre, setFiltre] = useState<Niveau | 0>(0);
  const { progression, enCours } = useProgression();
  const reprise = enCours ? trouverModele(enCours[0]) : undefined;
  const liste = MODELES.filter((m) => filtre === 0 || m.niveau === filtre);

  return (
    <div className="page page--catalogue">
      <header className="entete">
        <a className="entete__marque" href={lien.catalogue()}>
          <Marque />
          <span>Pli</span>
          <span className="entete__kana" lang="ja" aria-hidden="true">
            おりがみ
          </span>
        </a>
      </header>

      <main className="catalogue">
        <div className="accueil">
          <div className="accueil__decor" aria-hidden="true">
            <Soleil className="accueil__soleil" />
            <Nuage className="accueil__nuage accueil__nuage--1" largeur={110} />
            <Nuage className="accueil__nuage accueil__nuage--2" largeur={78} />
            <Sakura className="accueil__fleur accueil__fleur--1" taille={22} />
            <Sakura className="accueil__fleur accueil__fleur--2" taille={14} />
          </div>
          <p className="accueil__surtitre">Origami en famille, pas à pas</p>
          <h1 className="titre-page">
            Que plie-t-on
            <br />
            aujourd’hui&nbsp;?
          </h1>
          <p className="accueil__texte">
            Une feuille, deux mains, un peu de patience&nbsp;: les gestes délicats sont animés pour les petits comme
            pour les grands.
          </p>
        </div>

        {reprise && enCours && (
          <a className="carte-reprise coin-corne" href={lien.etape(reprise.id, enCours[1].etape)} style={teinte(reprise)}>
            <span className="carte-reprise__haut">
              <span className="carte-reprise__textes">
                <span className="repere">À reprendre</span>
                <span className="carte-reprise__nom">{reprise.nom}</span>
                {reprise.sousTitre && <span className="texte-doux">{reprise.sousTitre}</span>}
              </span>
              <Illustration modele={reprise} className="carte-reprise__dessin" />
            </span>
            <span className="carte-reprise__progression">
              <span className="repere">
                Étape {String(enCours[1].etape).padStart(2, '0')} / {reprise.etapes.length}
              </span>
              <span className="barre" aria-hidden="true">
                <span
                  className="barre__plein"
                  style={{ width: `${(enCours[1].etape / reprise.etapes.length) * 100}%` }}
                />
              </span>
            </span>
            <span className="bouton bouton--principal bouton--compact">
              Reprendre
              <IconeChevronDroite />
            </span>
          </a>
        )}

        <section aria-labelledby="titre-catalogue" className="catalogue__section">
          <div className="intertitre-ligne">
            <h2 id="titre-catalogue" className="intertitre">
              Le catalogue
            </h2>
            <span className="pli-horizontal" aria-hidden="true" />
          </div>

          <div className="filtres" role="group" aria-label="Filtrer par niveau">
            {FILTRES.map((f) => (
              <button
                key={f.valeur}
                type="button"
                className={`filtre filtre--${f.valeur}`}
                aria-pressed={filtre === f.valeur}
                onClick={() => setFiltre(f.valeur)}
              >
                {f.valeur !== 0 && <Fleurs niveau={f.valeur} />}
                {f.libelle}
              </button>
            ))}
          </div>

          {liste.length > 0 ? (
            <ul className="liste-modeles">
              {liste.map((m) => {
                const a = progression[m.id];
                const etat = a?.termine ? 'Déjà plié ✓' : a && a.etape > 1 ? `En cours · étape ${a.etape}` : undefined;
                return <CarteModele key={m.id} modele={m} etat={etat} />;
              })}
            </ul>
          ) : (
            <p className="vide">Pas encore de modèle de ce niveau. Les prochains arrivent bientôt.</p>
          )}
        </section>
      </main>

      <Vagues className="vagues" />
    </div>
  );
}
