/* =====================================================================
 * NEGOCIA · núcleo/personalidades.js
 * Parámetros de comportamiento de cada personalidad de contraparte.
 * Cada número tiene un sentido pedagógico concreto (ver DISENO.md).
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};

  /*
   * e              Exponente de concesión temporal: A = A0 − (A0 − R)·τ^e
   *                e > 1 → "Boulware" (cede tarde); e = 1 → lineal.
   * ofensa         Multiplicador del daño ante ofertas ofensivas o retrocesos.
   * ganaConfianza  Multiplicador de las subidas de confianza.
   * apertura       Probabilidad base de compartir información propia.
   * respetoPoder   Efecto de una BATNA creíble sobre su aspiración.
   * reciprocidad   Fracción de cada concesión del jugador que devuelve (ρ).
   * criterio       Peso que da a los criterios objetivos (Fisher & Ury).
   * cooperacion    Cuánto busca paquetes buenos para ambos al contraofertar (λ).
   * sagacidad      Probabilidad base de detectar un farol.
   * volatilidad    Multiplicador de los cambios de tensión.
   * debilidad      Cuánto sube su aspiración si el jugador cede mucho y pronto.
   * confianzaPregunta  Ajuste del umbral de confianza para responder preguntas.
   * evasion        Probabilidad de esquivar una pregunta aunque haya confianza.
   */
  NG.Personalidades = {
    competitiva: {
      nombre: 'Competitiva',
      descripcion: 'Busca ganar cada punto. Cede tarde, respeta el poder y castiga la debilidad.',
      e: 2.4, ofensa: 0.7, ganaConfianza: 0.65, apertura: 0.3, respetoPoder: 1.4,
      reciprocidad: 0.25, criterio: 0.8, cooperacion: 0.15, sagacidad: 0.7,
      volatilidad: 0.9, debilidad: 0.35, confianzaPregunta: 10, evasion: 0.1
    },
    colaborativa: {
      nombre: 'Colaborativa',
      descripcion: 'Busca soluciones de beneficio mutuo. Comparte si confía y castiga la agresividad.',
      e: 1.0, ofensa: 1.1, ganaConfianza: 1.3, apertura: 0.8, respetoPoder: 0.6,
      reciprocidad: 0.55, criterio: 1.0, cooperacion: 0.85, sagacidad: 0.4,
      volatilidad: 0.8, debilidad: 0, confianzaPregunta: -10, evasion: 0
    },
    evasiva: {
      nombre: 'Evasiva',
      descripcion: 'Evita comprometerse y esquiva las preguntas. Hay que ganarse cada dato.',
      e: 1.8, ofensa: 0.8, ganaConfianza: 0.8, apertura: 0.35, respetoPoder: 0.9,
      reciprocidad: 0.35, criterio: 1.0, cooperacion: 0.35, sagacidad: 0.5,
      volatilidad: 0.6, debilidad: 0.1, confianzaPregunta: 5, evasion: 0.35
    },
    emocional: {
      nombre: 'Emocional',
      descripcion: 'Reacciona con intensidad: se ofende con facilidad, pero se abre si se siente escuchada.',
      e: 1.2, ofensa: 1.6, ganaConfianza: 1.5, apertura: 0.6, respetoPoder: 0.7,
      reciprocidad: 0.5, criterio: 0.7, cooperacion: 0.5, sagacidad: 0.4,
      volatilidad: 1.6, debilidad: 0.1, confianzaPregunta: 0, evasion: 0.05
    },
    analitica: {
      nombre: 'Analítica',
      descripcion: 'Quiere datos y argumentos. Los criterios objetivos pesan mucho más que la presión.',
      e: 1.6, ofensa: 0.9, ganaConfianza: 0.9, apertura: 0.5, respetoPoder: 1.0,
      reciprocidad: 0.4, criterio: 1.6, cooperacion: 0.5, sagacidad: 0.6,
      volatilidad: 0.6, debilidad: 0.05, confianzaPregunta: 0, evasion: 0.05
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
