import { useEffect } from 'react';
import { Catalogue } from './ecrans/Catalogue';
import { EtapeEcran } from './ecrans/EtapeEcran';
import { Fin } from './ecrans/Fin';
import { Presentation } from './ecrans/Presentation';
import { lien, useRoute } from './hooks/useRoute';
import { trouverModele } from './modeles';

export function App() {
  const route = useRoute();
  const modele = route.ecran === 'catalogue' ? undefined : trouverModele(route.id);

  useEffect(() => {
    if (route.ecran === 'catalogue') document.title = 'Pli — origami en famille';
    if (route.ecran === 'modele' && modele) document.title = `${modele.nom} · Pli`;
    if (route.ecran !== 'etape') window.scrollTo({ top: 0 });
  }, [route, modele]);

  if (route.ecran === 'catalogue') return <Catalogue />;

  if (!modele) {
    return (
      <main className="page introuvable">
        <h1 className="titre-page">Ce modèle n’existe pas (encore).</h1>
        <a className="bouton bouton--principal" href={lien.catalogue()}>
          Voir le catalogue
        </a>
      </main>
    );
  }

  switch (route.ecran) {
    case 'modele':
      return <Presentation modele={modele} />;
    case 'etape':
      return <EtapeEcran key={modele.id} modele={modele} numero={route.numero} />;
    case 'fin':
      return <Fin modele={modele} />;
  }
}
