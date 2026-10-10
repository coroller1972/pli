import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMouvementReduit } from '../hooks/useMouvementReduit';
import { IconePause, IconeLecture, IconeRejouer } from '../ui/Icones';
import { preparer } from './moteur';
import { Schema, type Papier } from './Schema';
import type { Figure, Geste } from './types';

interface Props {
  figure: Figure;
  geste: Geste;
  papier: Papier;
  titre: string;
}

/** Temps de la boucle, en millisecondes (hors geste). */
const ATTENTE = 900;
const PAUSE = 1400;
const RETOUR = 500;

type Vitesse = 1 | 0.5;

/**
 * Lecteur d'un geste délicat : boucle « schéma → geste → pose → retour »,
 * avec lecture/pause, vitesse ½×, rejouer et défilement image par image.
 */
export function Lecteur({ figure, geste, papier, titre }: Props) {
  const reduit = useMouvementReduit();
  const [lecture, setLecture] = useState(!reduit);
  const [vitesse, setVitesse] = useState<Vitesse>(1);
  const [horloge, setHorloge] = useState(0);
  const precedent = useRef<number | null>(null);

  const calcul = useMemo(() => preparer(figure, geste), [figure, geste]);
  const dureeGeste = geste.duree / vitesse;
  const cycle = ATTENTE + dureeGeste + PAUSE + RETOUR;

  // Nouvelle étape : on repart du début.
  useEffect(() => {
    setHorloge(0);
    setLecture(!reduit);
  }, [figure, geste, reduit]);

  useEffect(() => {
    if (!lecture) {
      precedent.current = null;
      return;
    }
    let id = 0;
    const tic = (maintenant: number) => {
      if (precedent.current !== null) {
        const dt = Math.min(64, maintenant - precedent.current);
        setHorloge((h) => (h + dt) % cycle);
      }
      precedent.current = maintenant;
      id = requestAnimationFrame(tic);
    };
    id = requestAnimationFrame(tic);
    return () => cancelAnimationFrame(id);
  }, [lecture, cycle]);

  // Où en est-on dans la boucle ?
  let t = 0;
  let notation = 1;
  let opacite = 1;
  if (horloge < ATTENTE) {
    t = 0;
  } else if (horloge < ATTENTE + dureeGeste) {
    t = (horloge - ATTENTE) / dureeGeste;
    notation = Math.max(0, 1 - t / 0.15);
  } else if (horloge < ATTENTE + dureeGeste + PAUSE) {
    t = 1;
    notation = 0;
  } else {
    const r = (horloge - ATTENTE - dureeGeste - PAUSE) / RETOUR;
    if (r < 0.5) {
      t = 1;
      notation = 0;
      opacite = 1 - r * 2;
    } else {
      t = 0;
      opacite = r * 2 - 1;
    }
  }

  const changerVitesse = useCallback(() => {
    const suivante: Vitesse = vitesse === 1 ? 0.5 : 1;
    // On garde l'avancement du geste en changeant de vitesse.
    const nouvelleDuree = geste.duree / suivante;
    setHorloge((h) => {
      if (h < ATTENTE) return h;
      if (h < ATTENTE + dureeGeste) return ATTENTE + ((h - ATTENTE) / dureeGeste) * nouvelleDuree;
      return ATTENTE + nouvelleDuree + (h - ATTENTE - dureeGeste);
    });
    setVitesse(suivante);
  }, [vitesse, geste.duree, dureeGeste]);

  const defiler = (valeur: number) => {
    setLecture(false);
    const tt = valeur / 1000;
    setHorloge(tt <= 0 ? 0 : tt >= 1 ? ATTENTE + dureeGeste : ATTENTE + tt * dureeGeste);
  };

  return (
    <div className="lecteur">
      <div className="planche planche--anime">
        <span className="badge-anime">
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <polygon points="2,1 9,5 2,9" fill="currentColor" />
          </svg>
          Geste animé
        </span>
        <span className="planche__vitesse" aria-hidden="true">
          Vitesse {vitesse === 1 ? '1×' : '½×'}
        </span>
        <Schema
          className="planche__schema"
          cadre={figure.cadre}
          plans={calcul(t)}
          lignes={figure.lignes}
          fleches={figure.fleches}
          papier={papier}
          notation={notation}
          opacite={opacite}
          titre={titre}
        />
      </div>

      <div className="lecteur__controles">
        <button
          type="button"
          className="bouton-rond"
          onClick={() => {
            setHorloge(0);
            setLecture(true);
          }}
          aria-label="Rejouer le geste"
        >
          <IconeRejouer />
        </button>
        <button
          type="button"
          className="bouton-rond bouton-rond--plein"
          onClick={() => setLecture((l) => !l)}
          aria-label={lecture ? 'Mettre en pause' : 'Lire le geste'}
        >
          {lecture ? <IconePause /> : <IconeLecture />}
        </button>
        <button
          type="button"
          className={`bouton-rond bouton-rond--texte${vitesse === 0.5 ? ' est-actif' : ''}`}
          onClick={changerVitesse}
          aria-pressed={vitesse === 0.5}
          aria-label="Ralentir le geste (vitesse ½)"
        >
          {vitesse === 1 ? '1×' : '½×'}
        </button>
      </div>

      <label className="lecteur__defilement">
        <span className="visuellement-cache">Avancer le geste image par image</span>
        <input
          type="range"
          min={0}
          max={1000}
          step={1}
          value={Math.round(t * 1000)}
          onChange={(e) => defiler(Number(e.target.value))}
        />
      </label>
    </div>
  );
}

/** Schéma fixe d'une étape simple. */
export function PlancheFixe({ figure, papier, titre }: Omit<Props, 'geste'>) {
  const plans = useMemo(() => preparer(figure)(0), [figure]);
  return (
    <div className="planche">
      <Schema
        className="planche__schema"
        cadre={figure.cadre}
        plans={plans}
        lignes={figure.lignes}
        fleches={figure.fleches}
        papier={papier}
        titre={titre}
      />
    </div>
  );
}
