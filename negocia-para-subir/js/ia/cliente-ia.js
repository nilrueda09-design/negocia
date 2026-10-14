/* =====================================================================
 * NEGOCIA · ia/cliente-ia.js — Modo IA (opcional), lado del navegador
 *
 * Solo se activa si el juego se abre desde el servidor local
 * (servidor/servidor.mjs) y este tiene clave de API. En cualquier otro
 * caso (doble clic, sin clave, sin red) el juego sigue en modo clásico.
 *
 * Reparto de papeles:
 *   - Claude INTERPRETA lo que escribe el jugador → una acción del motor.
 *   - El MOTOR decide (acepta, contraoferta, revela, se enfada…) y mueve
 *     las variables ocultas, igual que en modo clásico.
 *   - Claude NARRA esa decisión con naturalidad. La interfaz anima la
 *     misma cola de salidas: el avatar reacciona igual que siempre.
 * Al servidor no se envía ninguna variable oculta (reservas, pesos…):
 * solo lo que el jugador ya ve y las líneas que el motor ha decidido.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const TIPOS_IA = ['oferta', 'pregunta', 'compartir', 'presionar', 'pausa', 'aceptar', 'abandonar'];
  const TIEMPO_ESTADO = 2500;
  const TIEMPO_LLAMADA = 45000;

  /* ===================== Funciones puras (probadas en Node) ===================== */
  const recortar = (s, n) => String(s || '').slice(0, n);

  /* Contexto para interpretar al jugador: solo información visible. */
  function contextoInterpretacion(p) {
    const esc = NG.Escenarios.obtener(p.escenarioId);
    const obs = NG.Motor.observacion(p);
    const acciones = {};
    TIPOS_IA.forEach((t) => { acciones[t] = !!obs.acciones[t]; });
    const ultima = obs.misOfertas.length ? obs.misOfertas[obs.misOfertas.length - 1].paquete : (obs.jugador.apertura || null);
    return {
      escenario: { titulo: esc.titulo, rol: recortar(esc.briefing.rol, 200) },
      contrapartes: obs.contrapartes.filter((c) => !c.retirado).map((c) => ({ id: c.id, nombre: c.nombre })),
      variables: obs.variables.map((v) => ({ nombre: v.nombre, opciones: v.opciones })),
      ultimaOferta: ultima,
      ofertaEnMesa: obs.ofertaEnMesa ? obs.ofertaEnMesa.paquete : null,
      acciones,
      preguntas: obs.preguntas.map((q) => ({ id: q.id, texto: q.texto, a: q.a })),
      informacion: obs.informacion.map((x) => ({ id: x.id, texto: x.texto, a: x.a })),
      criterios: obs.criterios.map((c) => c.nombre || c.texto),
      ofertaFinal: !!obs.tecnicas.ofertaFinal
    };
  }

  /* Acción devuelta por la IA → acción del motor (o null si no es válida ahora). */
  function accionMotor(p, a) {
    if (!a || !TIPOS_IA.includes(a.tipo)) return null;
    const obs = NG.Motor.observacion(p);
    if (!obs.acciones[a.tipo]) return null;
    if (a.tipo === 'oferta') {
      const esc = NG.Escenarios.obtener(p.escenarioId);
      if (!Array.isArray(a.paquete) || a.paquete.length !== esc.variables.length) return null;
      if (!a.paquete.every((k, i) => Number.isInteger(k) && k >= 0 && k < esc.variables[i].opciones.length)) return null;
      return { tipo: 'oferta', paquete: a.paquete.slice(), criterio: a.justifica && obs.criterios.length ? obs.criterios[0].id : undefined, final: !!(a.final && obs.tecnicas.ofertaFinal) };
    }
    if (a.tipo === 'pregunta' && !obs.preguntas.some((q) => q.id === a.id)) return null;
    if (a.tipo === 'compartir' && !obs.informacion.some((x) => x.id === a.id)) return null;
    if (a.tipo === 'pregunta' || a.tipo === 'compartir') return { tipo: a.tipo, id: a.id };
    return { tipo: a.tipo };
  }

  /* De la cola de salidas del motor, qué ha decidido cada contraparte. */
  function decisiones(p, S) {
    const esc = NG.Escenarios.obtener(p.escenarioId);
    const ids = esc.contrapartes.map((c) => c.id);
    const porId = {};
    const orden = [];
    S.forEach((s) => {
      if (!ids.includes(s.quien)) return;
      if (!porId[s.quien]) { porId[s.quien] = { quien: s.quien, reaccion: 'neutral', textos: [], oferta: null, revelacion: [] }; orden.push(s.quien); }
      const d = porId[s.quien];
      if (s.tipo === 'reaccion') d.reaccion = s.reaccion;
      if (s.tipo === 'dialogo') d.textos.push(s.texto);
      if (s.tipo === 'oferta') d.oferta = NG.Analisis.describir(esc, s.paquete);
    });
    // Lo que el motor ha dejado descubrir este turno (notas nuevas de la pizarra)
    S.forEach((s) => { if (s.tipo === 'pizarra' && s.nota && s.nota.quien && porId[s.nota.quien]) porId[s.nota.quien].revelacion.push(s.nota.texto); });
    return orden.map((id) => porId[id]).filter((d) => d.textos.length)
      .map((d) => ({ quien: d.quien, reaccion: d.reaccion, textoMotor: recortar(d.textos.join(' '), 500), oferta: d.oferta, revelacion: d.revelacion.length ? recortar(d.revelacion.join(' / '), 300) : null }));
  }

  /* Contexto para narrar: personajes, lo que ya se sabe de ellos y las decisiones. */
  function contextoNarracion(p, mensaje, decs) {
    const esc = NG.Escenarios.obtener(p.escenarioId);
    return {
      escenario: { titulo: esc.titulo, contexto: recortar(esc.briefing.contexto, 600) },
      mensaje: recortar(mensaje, 600),
      personajes: esc.contrapartes.filter((c) => decs.some((d) => d.quien === c.id)).map((c) => {
        const pers = NG.Personalidades[c.personalidad];
        return {
          id: c.id, nombre: c.nombre, cargo: c.cargo,
          personalidad: pers ? pers.nombre + ' (' + pers.descripcion + ')' : c.personalidad,
          interesesRevelados: p.pizarra.filter((n) => n.tipo === 'interes' && n.quien === c.id).map((n) => n.texto)
        };
      }),
      decisiones: decs
    };
  }

  /* Sustituye los textos de las contrapartes por la narración y pone las
   * palabras del jugador en su boca. Todo lo demás (reacciones, deltas,
   * ofertas, pizarra, eventos, fin) queda exactamente igual. */
  function aplicarNarracion(S, respuestas, mensajeJugador) {
    const nuevo = {};
    (respuestas || []).forEach((r) => { if (r && r.quien && r.texto && !nuevo[r.quien]) nuevo[r.quien] = r.texto; });
    const usado = {};
    const R = [];
    let jugadorPuesto = false;
    S.forEach((s) => {
      if (s.tipo === 'dialogo' && s.quien === 'jugador' && mensajeJugador) {
        if (jugadorPuesto) return;
        jugadorPuesto = true;
        R.push(Object.assign({}, s, { texto: mensajeJugador, ia: true }));
        return;
      }
      if (s.tipo === 'dialogo' && nuevo[s.quien]) {
        if (usado[s.quien]) return;           // las demás líneas de esa parte quedan sustituidas
        usado[s.quien] = true;
        R.push(Object.assign({}, s, { texto: nuevo[s.quien], ia: true }));
        return;
      }
      R.push(s);
    });
    if (mensajeJugador && !jugadorPuesto) R.unshift({ tipo: 'dialogo', quien: 'jugador', texto: mensajeJugador, ia: true });
    return R;
  }

  /* ===================== Red (solo navegador) ===================== */
  let estado = null;
  // El proxy solo existe en el ordenador del jugador: en una web publicada (o con doble clic) ni se busca
  const enServidor = () => typeof location !== 'undefined' && /^https?:$/.test(location.protocol) && typeof fetch === 'function' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

  function conTiempo(ms) {
    const c = typeof AbortController === 'function' ? new AbortController() : null;
    const t = c ? setTimeout(() => c.abort(), ms) : null;
    return { senal: c ? c.signal : undefined, fin: () => t && clearTimeout(t) };
  }

  async function comprobar(forzar) {
    if (estado && !forzar) return estado;
    if (!enServidor()) return (estado = { disponible: false, motivo: 'El Modo IA solo funciona con el servidor local (node servidor/servidor.mjs)' });
    const t = conTiempo(TIEMPO_ESTADO);
    try {
      const r = await fetch('api/ia/estado', { cache: 'no-store', signal: t.senal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      estado = { disponible: !!d.disponible, modelo: d.modelo || null, motivo: d.motivo || null };
    } catch (e) {
      estado = { disponible: false, motivo: 'Servidor de IA no disponible' };
    } finally { t.fin(); }
    return estado;
  }

  async function post(ruta, cuerpo) {
    const t = conTiempo(TIEMPO_LLAMADA);
    try {
      const r = await fetch(ruta, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Negocia': '1' }, body: JSON.stringify(cuerpo), signal: t.senal });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Error ' + r.status);
      return d;
    } catch (e) {
      if (e && e.name === 'AbortError') throw new Error('La IA ha tardado demasiado en responder');
      throw e;
    } finally { t.fin(); }
  }

  const interpretar = (p, mensaje) => post('api/ia/interpretar', { contexto: contextoInterpretacion(p), mensaje: recortar(mensaje, 600) }).then((d) => d.accion);
  const narrar = (ctx) => post('api/ia/narrar', { contexto: ctx }).then((d) => d.respuestas || []);

  NG.IA = {
    comprobar, interpretar, narrar,
    contextoInterpretacion, accionMotor, decisiones, contextoNarracion, aplicarNarracion,
    get activo() { return !!(estado && estado.disponible); },
    get estado() { return estado; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
