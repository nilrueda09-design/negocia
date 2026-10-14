/* =====================================================================
 * Agentes de simulación para probar el balance del motor.
 * IMPORTANTE: solo usan la información que tendría un jugador humano:
 * la observación del motor (observacion()), las fichas y textos visibles
 * y el "estilo" legible de las opciones de los eventos. Nunca leen
 * pesos, reservas ni personalidades ocultas.
 * ===================================================================== */
'use strict';
const NG = require('./cargar.js');
const U = NG.Util;
const A = NG.Analisis;

/* ---------- Modelo estimado de la contraparte a partir de la pizarra ---------- */
function modeloEstimado(obs, esc) {
  const nV = obs.variables.length;
  const uJ = obs.hoja.map((fila) => { const m = Math.max.apply(null, fila) || 1; return fila.map((x) => x / m); });
  return obs.contrapartes.map((c) => {
    const w = new Array(nV).fill(1);
    const igual = new Array(nV).fill(false);
    obs.pizarra.forEach((n) => {
      if (n.quien && n.quien !== c.id) return;
      const i = obs.variables.findIndex((v) => v.id === n.variable);
      if (i < 0) return;
      if (n.tipo === 'interes') {
        w[i] = Math.max(w[i], n.importancia === 'alta' ? 3.5 : n.importancia === 'media' ? 2 : 0.6);
        if (n.direccion === 'igual') igual[i] = true;
      } else if (n.tipo === 'pista') w[i] = Math.max(w[i], 2);
    });
    if (c.exigencia) { const i = obs.variables.findIndex((v) => v.id === c.exigencia.variable); if (i >= 0) w[i] = Math.max(w[i], 2.5); }
    const s = U.suma(w);
    return (paq) => {
      let t = 0;
      for (let i = 0; i < nV; i++) t += (w[i] / s) * (igual[i] ? uJ[i][paq[i]] : 1 - uJ[i][paq[i]]);
      return 100 * t;
    };
  });
}

/* Mejor paquete con uj ≥ objetivo que maximiza la utilidad estimada para ellos. */
function mejorPaquete(esc, obs, objetivo, estimadores, minimo) {
  let mejor = null, mejorS = -Infinity;
  for (const pk of esc.paquetes) {
    const uj = obs.utilidad(pk);
    if (uj < objetivo) continue;
    const est = estimadores.map((f) => f(pk));
    const s = (minimo ? Math.min.apply(null, est) : U.media(est)) + 0.01 * uj;
    if (s > mejorS) { mejorS = s; mejor = pk; }
  }
  if (!mejor) { // objetivo imposible → el mejor para mí
    let best = esc.paquetes[0];
    for (const pk of esc.paquetes) if (obs.utilidad(pk) > obs.utilidad(best)) best = pk;
    mejor = best;
  }
  return mejor.slice();
}

function eligeEvento(evento, preferencias, rng) {
  const def = evento ? evento.opciones : [];
  for (const estilo of preferencias) {
    const op = evento.opcionesEstilo && evento.opcionesEstilo.find((o) => o.estilo === estilo);
    if (op) return op.id;
  }
  return rng ? U.elegir(rng, def).id : def[0].id;
}

/* Las fichas de investigación "se leen": el agente sabe qué tipo de dato da cada una. */
function prepararCon(prep, esc, prioridad) {
  const fichas = (esc.investigacion || []).slice().sort((a, b) => prioridad(a) - prioridad(b) || a.coste - b.coste);
  for (const f of fichas) {
    if (prioridad(f) >= 99) continue;
    if (f.coste <= NG.Preparacion.restantes(prep)) NG.Preparacion.investigar(prep, esc, f.id);
  }
}
const tipoFicha = (f) => { const r = f.revela || {}; return r.interes ? 'interes' : r.batna ? 'batna' : r.verifica ? 'verifica' : r.criterio ? 'criterio' : r.personalidad ? 'personalidad' : r.batnaContraparte ? 'cbatna' : 'otro'; };

/* ===================== Agentes ===================== */
const Agentes = {};

/* Creador de valor / colaborativo: investiga intereses, pregunta, comparte
 * prioridades, negocia paquetes y concede de forma decreciente. */
Agentes.colaborativo = {
  nombre: 'Colaborativo (creador de valor)',
  preparar(prep, esc) {
    const orden = { interes: 1, batna: 2, verifica: 3, criterio: 4, cbatna: 5, personalidad: 6, otro: 99 };
    prepararCon(prep, esc, (f) => orden[tipoFicha(f)]);
    const vis = NG.Preparacion.batnasVisibles(prep, esc).filter((b) => b.verificada);
    const b = vis.sort((x, y) => y.valorMostrado - x.valorMostrado)[0];
    NG.Preparacion.definir(prep, esc, { batnaId: b.id, reserva: b.valorMostrado, objetivo: Math.min(95, b.valorMostrado + 32) });
    if (esc.quienAbre !== 'contraparte' && !esc.multiparte) {
      const p0 = NG.Motor.crearPartida(esc, prep, { semilla: 1 });
      const obs = NG.Motor.observacion(p0);
      const est = modeloEstimado(obs, esc);
      // Apertura ambiciosa pero creíble: máxima utilidad propia con ≥ 45 estimado para ellos
      let mejor = null;
      for (const pk of esc.paquetes) {
        if (est.some((f) => f(pk) < 45)) continue;
        if (!mejor || obs.utilidad(pk) > obs.utilidad(mejor)) mejor = pk;
      }
      NG.Preparacion.definir(prep, esc, { apertura: mejor || esc.statusQuo });
    }
  },
  evento(ev) { return eligeEvento(ev, ['calma', 'honesto', 'contrastar', 'reconocer', 'condicionar', 'neutral']); },
  actuar(obs, esc, rng, mem) {
    mem.ofertas = mem.ofertas || 0;
    const a = obs.acciones;
    const c0 = obs.contrapartes.filter((c) => !c.retirado);
    const pac = Math.min.apply(null, c0.map((c) => c.paciencia));
    const pacMax = Math.max.apply(null, c0.map((c) => c.pacienciaMax));
    const ultimatum = c0.some((c) => c.ultimatum);
    const est = modeloEstimado(obs, esc);
    const crit = obs.criterios.length ? obs.criterios[0].id : undefined;
    const j = obs.jugador;
    const progreso = U.clamp(1 - pac / pacMax, 0, 1);
    const objetivo = j.objetivo - (j.objetivo - j.reserva) * Math.pow(progreso, 1.2);
    const mesa = obs.ofertaEnMesa;

    if (ultimatum) {
      if (a.aceptar && mesa && mesa.uj >= j.reserva - 0.5) return { tipo: 'aceptar' };
      const pk = mejorPaquete(esc, obs, j.reserva, est, obs.multiparte);
      if (mem.ultimaFinal && A.igualPaquete(pk, mem.ultimaFinal)) return { tipo: 'abandonar' };
      mem.ultimaFinal = pk;
      return { tipo: 'oferta', paquete: pk, criterio: crit };
    }
    if (a.aceptar && mesa && mesa.uj >= objetivo - 1) return { tipo: 'aceptar' };
    // Pausa si la tensión es visible
    if (a.pausa && c0.some((c) => c.visual && ['molesto', 'tenso'].includes(c.visual.expresion)) && !obs.multiparte) return { tipo: 'pausa' };
    // Construir confianza e información en los primeros turnos
    const prioridades = obs.informacion.filter((x) => x.tipo === 'prioridades');
    if (a.compartir && prioridades.length && (mem.compartidas || 0) < 2 && obs.turno < 4) {
      mem.compartidas = (mem.compartidas || 0) + 1;
      return { tipo: 'compartir', id: prioridades[0].id };
    }
    // Multiparte: compromisos laterales para ganar aliados
    if (obs.multiparte && a.bilateral && obs.compromisos.length && obs.turno >= 2 && (mem.bilaterales || 0) < 2) {
      const comp = obs.compromisos.find((x) => !obs.contrapartes.find((c) => c.id === x.con).aliado);
      if (comp) { mem.bilaterales = (mem.bilaterales || 0) + 1; return { tipo: 'bilateral', con: comp.con, sub: 'compromiso', id: comp.id }; }
    }
    const abiertas = obs.preguntas.filter((q) => q.tipo === 'abierta');
    const preguntasHechas = mem.preguntas || 0;
    if (a.pregunta && abiertas.length && preguntasHechas < 3 && (obs.turno <= 2 || (mem.ofertas >= 1 && preguntasHechas < 3 && pac > 4))) {
      mem.preguntas = preguntasHechas + 1;
      return { tipo: 'pregunta', id: abiertas[(mem.preguntas - 1) % abiertas.length].id };
    }
    if (a.meso && mem.ofertas === 1 && !mem.meso) {
      // MESO: tres paquetes de valor similar para mí, distintos entre sí
      mem.meso = true;
      const obj = Math.max(objetivo - 2, j.reserva);
      const cands = esc.paquetes.filter((pk) => Math.abs(obs.utilidad(pk) - obj) <= 3);
      if (cands.length >= 3) {
        const elegidos = [cands[0]];
        for (const pk of cands) {
          if (elegidos.length >= 3) break;
          if (elegidos.every((e) => NG.Motor._interno.similitud(esc, e, pk) < 0.6)) elegidos.push(pk);
        }
        if (elegidos.length >= 2) { mem.ofertas++; return { tipo: 'meso', paquetes: elegidos }; }
      }
    }
    let pk = mem.ofertas === 0 && j.apertura ? j.apertura.slice() : mejorPaquete(esc, obs, objetivo, est, obs.multiparte);
    // Nunca retroceder: si la oferta nueva me da más que la anterior en lo que a ellos importa… se mantiene la lógica de concesión decreciente
    mem.ofertas++;
    return { tipo: 'oferta', paquete: pk, criterio: crit };
  }
};

/* Agresivo: no investiga, ancla extremo, presiona y concede lo mínimo. */
Agentes.agresivo = {
  nombre: 'Agresivo (solo presiona)',
  preparar(prep, esc) {
    const vis = NG.Preparacion.batnasVisibles(prep, esc);
    const b = vis.sort((x, y) => y.valorMostrado - x.valorMostrado)[0];
    let mejor = esc.paquetes[0];
    for (const pk of esc.paquetes) if (A.utilidadPerfil(esc.perfilJ, pk) > A.utilidadPerfil(esc.perfilJ, mejor)) mejor = pk;
    NG.Preparacion.definir(prep, esc, { batnaId: b.id, reserva: b.valorMostrado, objetivo: 95, apertura: mejor });
  },
  evento(ev) { return eligeEvento(ev, ['presion', 'mentir', 'neutral']); },
  actuar(obs, esc, rng, mem) {
    mem.n = (mem.n || 0) + 1;
    const a = obs.acciones, j = obs.jugador, mesa = obs.ofertaEnMesa;
    const c0 = obs.contrapartes.filter((c) => !c.retirado);
    const ultimatum = c0.some((c) => c.ultimatum);
    const principal = obs.hoja.map((f) => Math.max.apply(null, f)).reduce((b, x, i, arr) => (x > arr[b] ? i : b), 0);
    if (ultimatum) {
      if (a.aceptar && mesa && mesa.uj >= j.reserva) return { tipo: 'aceptar' };
      return { tipo: 'abandonar' };
    }
    if (a.aceptar && mesa && mesa.uj >= j.objetivo - 20) return { tipo: 'aceptar' };
    if (mem.n === 1) return { tipo: 'oferta', paquete: j.apertura || esc.statusQuo };
    if (mem.n % 3 === 2 && a.presionar) return { tipo: 'presionar' };
    // Concesión mínima en la variable principal
    const ult = obs.misOfertas.length ? obs.misOfertas[obs.misOfertas.length - 1].paquete.slice() : esc.statusQuo.slice();
    if (mem.n % 2 === 0) {
      const fila = obs.hoja[principal];
      const cur = ult[principal];
      const vecinos = [cur - 1, cur + 1].filter((x) => x >= 0 && x < fila.length && fila[x] < fila[cur]);
      if (vecinos.length) ult[principal] = vecinos.sort((x, y) => fila[y] - fila[x])[0];
    }
    return { tipo: 'oferta', paquete: ult, final: !!obs.tecnicas.ofertaFinal && mem.n === 6 };
  }
};

/* Blando: cede rápido para cerrar cuanto antes. */
Agentes.blando = {
  nombre: 'Blando (cede para cerrar)',
  preparar(prep, esc, rng) {
    const fichas = esc.investigacion || [];
    if (fichas.length) NG.Preparacion.investigar(prep, esc, U.elegir(rng, fichas).id);
    const vis = NG.Preparacion.batnasVisibles(prep, esc);
    const b = vis[0];
    const obj = Math.min(90, b.valorMostrado + 15);
    let ap = esc.paquetes[0], dist = Infinity;
    for (const pk of esc.paquetes) { const d = Math.abs(A.utilidadPerfil(esc.perfilJ, pk) - obj); if (d < dist) { dist = d; ap = pk; } }
    NG.Preparacion.definir(prep, esc, { batnaId: b.id, reserva: b.valorMostrado - 5, objetivo: obj, apertura: ap });
  },
  evento(ev) { return eligeEvento(ev, ['ceder', 'revelar', 'neutral']); },
  actuar(obs, esc, rng, mem) {
    mem.n = (mem.n || 0) + 1;
    const a = obs.acciones, j = obs.jugador, mesa = obs.ofertaEnMesa;
    if (a.aceptar && mesa && (mesa.uj >= j.reserva - 5 || mem.n >= 3)) return { tipo: 'aceptar' };
    const objetivo = j.objetivo - 6 * (mem.n - 1);
    let pk = esc.paquetes[0], dist = Infinity;
    for (const x of esc.paquetes) { const d = Math.abs(obs.utilidad(x) - objetivo); if (d < dist) { dist = d; pk = x; } }
    if (mem.n === 1 && j.apertura) pk = j.apertura;
    return { tipo: 'oferta', paquete: pk.slice() };
  }
};

/* Regateador: prepara bien el precio, pero solo negocia la variable principal (pastel fijo). */
Agentes.regateador = {
  nombre: 'Regateador (pastel fijo)',
  preparar(prep, esc) {
    const orden = { criterio: 1, batna: 2, verifica: 3, interes: 99, personalidad: 99, cbatna: 99, otro: 99 };
    prepararCon(prep, esc, (f) => orden[tipoFicha(f)]);
    const vis = NG.Preparacion.batnasVisibles(prep, esc).filter((b) => b.verificada);
    const b = vis.sort((x, y) => y.valorMostrado - x.valorMostrado)[0];
    const principal = esc.perfilJ.pesos.reduce((bi, x, i, arr) => (x > arr[bi] ? i : bi), 0);
    const ap = esc.statusQuo.slice();
    const u = esc.perfilJ.u[principal];
    ap[principal] = u.indexOf(Math.max.apply(null, u));
    NG.Preparacion.definir(prep, esc, { batnaId: b.id, reserva: b.valorMostrado, objetivo: Math.min(95, b.valorMostrado + 25), apertura: ap });
  },
  evento(ev) { return eligeEvento(ev, ['neutral', 'calma']); },
  actuar(obs, esc, rng, mem) {
    mem.n = (mem.n || 0) + 1;
    const a = obs.acciones, j = obs.jugador, mesa = obs.ofertaEnMesa;
    const c0 = obs.contrapartes.filter((c) => !c.retirado);
    const ultimatum = c0.some((c) => c.ultimatum);
    if (a.aceptar && mesa && mesa.uj >= Math.max(j.reserva, j.objetivo - 4 * mem.n)) return { tipo: 'aceptar' };
    if (ultimatum) return a.aceptar && mesa && mesa.uj >= j.reserva ? { tipo: 'aceptar' } : { tipo: 'abandonar' };
    const principal = obs.hoja.map((f) => Math.max.apply(null, f)).reduce((b, x, i, arr) => (x > arr[b] ? i : b), 0);
    const base = (j.apertura || esc.statusQuo).slice();
    const fila = obs.hoja[principal];
    const orden = fila.map((v, k) => k).sort((x, y) => fila[y] - fila[x]);
    const paso = Math.min(orden.length - 1, Math.floor((mem.n - 1) / 2));
    base[principal] = orden[paso];
    const crit = obs.criterios.length ? obs.criterios[0].id : undefined;
    return { tipo: 'oferta', paquete: base, criterio: crit };
  }
};

/* Aleatorio: acciones válidas al azar. */
Agentes.aleatorio = {
  nombre: 'Aleatorio',
  preparar(prep, esc, rng) {
    (esc.investigacion || []).forEach((f) => { if (U.probabilidad(rng, 0.5) && f.coste <= NG.Preparacion.restantes(prep)) NG.Preparacion.investigar(prep, esc, f.id); });
    const vis = NG.Preparacion.batnasVisibles(prep, esc);
    const b = U.elegir(rng, vis);
    const reserva = U.entero(rng, 20, 60);
    NG.Preparacion.definir(prep, esc, { batnaId: b.id, reserva, objetivo: Math.min(100, reserva + U.entero(rng, 0, 40)), apertura: U.elegir(rng, esc.paquetes) });
  },
  evento(ev, obs, rng) { return U.elegir(rng, ev.opciones).id; },
  actuar(obs, esc, rng) {
    const a = obs.acciones;
    const tipos = Object.keys(a).filter((k) => a[k] && k !== 'abandonar' && k !== 'bilateral' && k !== 'meso');
    if (U.probabilidad(rng, 0.04)) return { tipo: 'abandonar' };
    const t = U.elegir(rng, tipos);
    if (t === 'oferta') return { tipo: 'oferta', paquete: U.elegir(rng, esc.paquetes) };
    if (t === 'concesion') {
      const vi = U.entero(rng, 0, esc.variables.length - 1);
      const pedir = U.probabilidad(rng, 0.5) ? U.entero(rng, 0, esc.variables.length - 1) : undefined;
      return { tipo: 'concesion', variable: vi, pedir };
    }
    if (t === 'pregunta') return { tipo: 'pregunta', id: U.elegir(rng, obs.preguntas).id };
    if (t === 'compartir') return { tipo: 'compartir', id: U.elegir(rng, obs.informacion).id };
    return { tipo: t };
  }
};

/* Partida modelo: guion definido en los datos del escenario. */
Agentes.modelo = {
  nombre: 'Partida modelo (guion)',
  preparar(prep, esc) {
    const m = esc.partidaModelo;
    (m.preparacion.investigar || []).forEach((id) => NG.Preparacion.investigar(prep, esc, id));
    NG.Preparacion.definir(prep, esc, m.preparacion.definir);
  },
  evento(ev, obs, rng, mem) {
    const m = NG.Escenarios.obtener(obs.escenarioId).partidaModelo;
    return (m.eventos && m.eventos[ev.id]) || eligeEvento(ev, ['calma', 'honesto', 'contrastar', 'reconocer', 'condicionar', 'neutral']);
  },
  actuar(obs, esc, rng, mem) {
    mem.i = mem.i || 0;
    const pasos = esc.partidaModelo.pasos;
    while (mem.i < pasos.length) {
      const paso = pasos[mem.i++];
      if (paso.accion && obs.acciones[paso.accion.tipo]) return paso.accion;
    }
    // Fin del guion: aceptar si hay algo razonable, si no, colaborativo
    return Agentes.colaborativo.actuar(obs, esc, rng, mem);
  }
};

/* ---------- Ejecutar una partida completa con un agente ---------- */
function jugar(esc, agente, semilla, opciones) {
  opciones = opciones || {};
  const rng = U.crearRng((semilla * 7919 + 13) >>> 0);
  const prep = NG.Preparacion.crear(esc);
  agente.preparar(prep, esc, rng);
  const p = NG.Motor.crearPartida(esc, prep, { semilla, tecnicas: opciones.tecnicas });
  NG.Motor.iniciar(p);
  const mem = {};
  let guarda = 0;
  while (p.fase !== 'fin' && guarda++ < 80) {
    const obs = NG.Motor.observacion(p);
    if (p.fase === 'evento') {
      const ev = Object.assign({}, obs.evento, { escenarioId: esc.id, opcionesEstilo: esc.eventos.find((e) => e.id === obs.evento.id).opciones.map((o) => ({ id: o.id, estilo: o.estilo })) });
      NG.Motor.resolverEvento(p, agente.evento(ev, obs, rng, mem));
      continue;
    }
    let accion = agente.actuar(obs, esc, rng, mem);
    if (!accion || !obs.acciones[accion.tipo]) {
      // Acción no válida (p. ej. el aleatorio pidiendo una concesión) → oferta aleatoria
      accion = { tipo: 'oferta', paquete: U.elegir(rng, esc.paquetes) };
    }
    if (accion.tipo === 'concesion') {
      try { NG.Motor.ejecutar(p, accion); } catch (e) { NG.Motor.ejecutar(p, { tipo: 'oferta', paquete: obs.misOfertas.length ? obs.misOfertas[obs.misOfertas.length - 1].paquete : esc.statusQuo }); }
    } else NG.Motor.ejecutar(p, accion);
  }
  if (p.fase !== 'fin') NG.Motor.ejecutar(p, { tipo: 'abandonar' });
  return { p, punt: NG.Puntuacion.calcular(p) };
}

module.exports = { Agentes, jugar, modeloEstimado, mejorPaquete };
