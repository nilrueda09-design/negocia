/* =====================================================================
 * NEGOCIA · núcleo/estadoVisual.js
 * Función PURA  estadoMotor → estadoVisual.
 * Traduce el estado oculto de la contraparte (confianza, tensión,
 * paciencia, última reacción, personalidad…) en expresión, postura,
 * gesto y mirada del personaje. Así la cara es coherente con la lógica
 * del motor y no un adorno. Se prueba con Node (tests/estadoVisual.test.js).
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};

  const EXPRESIONES = ['neutral', 'receptivo', 'pensativo', 'tenso', 'molesto', 'entusiasmado', 'desconfiado'];
  const POSTURAS = ['reposo', 'cruzados', 'inclinado', 'barbilla', 'reloj', 'movil', 'recostado'];
  const GESTOS = ['asentir', 'negar', 'tensarse', 'relajarse', 'suspirar', 'sobresalto'];

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  /* Reacciones puntuales del motor → aspecto inmediato (prioridad máxima). */
  const POR_REACCION = {
    acepta:         { expresion: 'entusiasmado', postura: 'inclinado', gesto: 'asentir' },
    acepta_parcial: { expresion: 'receptivo', postura: 'inclinado', gesto: 'asentir' },
    ofendido:       { expresion: 'molesto', postura: 'cruzados', gesto: 'tensarse' },
    molesto:        { expresion: 'molesto', postura: 'cruzados', gesto: null },
    llama_farol:    { expresion: 'desconfiado', postura: 'recostado', gesto: 'negar' },
    desconfiado:    { expresion: 'desconfiado', postura: 'cruzados', gesto: null },
    se_endurece:    { expresion: 'tenso', postura: 'cruzados', gesto: 'tensarse' },
    reciproca:      { expresion: 'receptivo', postura: 'reposo', gesto: 'relajarse' },
    se_abre:        { expresion: 'receptivo', postura: 'inclinado', gesto: null },
    receptivo:      { expresion: 'receptivo', postura: 'inclinado', gesto: 'asentir' },
    relajado:       { expresion: 'receptivo', postura: 'reposo', gesto: 'relajarse' },
    pensativo:      { expresion: 'pensativo', postura: 'barbilla', gesto: null, mirada: 'arriba' },
    respeta_poder:  { expresion: 'pensativo', postura: 'barbilla', gesto: 'suspirar' },
    impaciente:     { expresion: 'tenso', postura: 'reloj', gesto: 'suspirar', mirada: 'reloj' },
    confiado:       { expresion: 'neutral', postura: 'recostado', gesto: null },
    sorprendido:    { expresion: 'pensativo', postura: 'recostado', gesto: 'sobresalto' },
    se_retira:      { expresion: 'molesto', postura: 'recostado', gesto: null, mirada: 'lado' }
  };

  /*
   * e: { confianza, tension, paciencia, pacienciaMax, reaccion, personalidad,
   *      turno, bloqueCon, aliado, retirado, ultimatum }
   */
  function derivar(e) {
    e = e || {};
    const C = clamp(typeof e.confianza === 'number' ? e.confianza : 50, 0, 100);
    const E = clamp(typeof e.tension === 'number' ? e.tension : 0, 0, 100);
    const P0 = e.pacienciaMax || 10;
    const P = clamp(typeof e.paciencia === 'number' ? e.paciencia : P0, 0, P0 + 5);
    const urgencia = clamp(1 - P / P0, 0, 1);
    const intensidad = Math.round(clamp(Math.max(E / 100, Math.abs(C - 50) / 50), 0, 1) * 100) / 100;
    const out = { expresion: 'neutral', postura: 'reposo', gesto: null, mirada: 'jugador', intensidad, urgenciaReloj: Math.round(urgencia * 100) / 100 };

    if (e.retirado) return Object.assign(out, { expresion: C < 40 ? 'molesto' : 'desconfiado', postura: 'recostado', mirada: 'lado' });

    // 1) Reacción puntual del último turno
    const r = POR_REACCION[e.reaccion];
    if (r) {
      Object.assign(out, r);
      if (!r.mirada) out.mirada = 'jugador';
      // Coherencia: con tensión muy alta nadie aparece entusiasmado
      if (out.expresion === 'entusiasmado' && E >= 70) out.expresion = 'receptivo';
      if (e.reaccion === 'evasiva') out.mirada = 'lado';
      return remate(out, e);
    }
    if (e.reaccion === 'evasiva') {
      Object.assign(out, e.personalidad === 'evasiva'
        ? { expresion: 'neutral', postura: 'movil', mirada: 'movil' }
        : { expresion: 'desconfiado', postura: 'recostado', mirada: 'lado' });
      return remate(out, e);
    }

    // 2) Estado sostenido (prioridades: tensión > desconfianza > urgencia > buena sintonía)
    if (E >= 70) Object.assign(out, { expresion: C < 40 ? 'molesto' : 'tenso', postura: 'cruzados' });
    else if (C < 30) Object.assign(out, { expresion: 'desconfiado', postura: 'cruzados' });
    else if (e.ultimatum || urgencia >= 0.75) Object.assign(out, { expresion: 'tenso', postura: 'reloj', mirada: 'reloj' });
    else if (C >= 65 && E < 40) Object.assign(out, { expresion: 'receptivo', postura: 'inclinado' });
    else if (E >= 45) Object.assign(out, { expresion: 'tenso', postura: 'reposo' });
    else {
      // 3) Reposo según personalidad (pequeños hábitos reconocibles)
      const t = e.turno || 0;
      switch (e.personalidad) {
        case 'evasiva': if (t % 3 === 1) Object.assign(out, { postura: 'movil', mirada: 'movil' }); break;
        case 'analitica': if (t % 2 === 1) Object.assign(out, { expresion: 'pensativo', postura: 'barbilla' }); break;
        case 'competitiva': out.postura = 'recostado'; break;
        case 'colaborativa': if (C >= 55) out.expresion = 'receptivo'; break;
        case 'emocional': if (C >= 55) out.expresion = 'receptivo'; else if (C < 45) out.expresion = 'tenso'; break;
        default: break;
      }
    }
    return remate(out, e);
  }

  /* Multiparte: miradas cómplices entre miembros de un bloque; el aliado asiente al jugador. */
  function remate(out, e) {
    if (e.bloqueCon && out.mirada === 'jugador') out.mirada = 'hacia:' + e.bloqueCon;
    if (e.aliado && out.expresion === 'neutral') out.expresion = 'receptivo';
    return out;
  }

  /* Color y ángulo del reloj de paciencia sobre la mesa. */
  function reloj(paciencia, pacienciaMax) {
    const u = clamp(1 - paciencia / (pacienciaMax || 10), 0, 1);
    return { angulo: Math.round(u * 330), color: u < 0.5 ? '#3cc6b0' : u < 0.75 ? '#f2b84b' : '#ff6b6b', urgente: u >= 0.75 };
  }

  NG.EstadoVisual = { derivar, reloj, EXPRESIONES, POSTURAS, GESTOS, POR_REACCION };
})(typeof window !== 'undefined' ? window : globalThis);
