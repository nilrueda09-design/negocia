/* =====================================================================
 * NEGOCIA · núcleo/progreso.js
 * Progresión de la campaña: récords por escenario, rangos, desbloqueos,
 * técnicas, logros, conceptos vistos y ajustes. Lógica pura; el
 * almacenamiento se inyecta (localStorage en el navegador, memoria en
 * los tests) y cualquier fallo de lectura/escritura se tolera.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const CLAVE = 'negocia.v1';

  const RANGOS = [
    { id: 'aprendiz', nombre: 'Aprendiz', desde: 0, descripcion: 'Empiezas a distinguir posiciones de intereses.' },
    { id: 'negociador', nombre: 'Negociador', desde: 150, descripcion: 'Preparas, anclas y concedes con criterio.' },
    { id: 'estratega', nombre: 'Estratega', desde: 275, descripcion: 'Creas valor antes de repartirlo y gestionas tus sesgos.' },
    { id: 'maestro', nombre: 'Maestro', desde: 400, descripcion: 'Dominas la negociación compleja y multiparte.' }
  ];

  const AJUSTES_DEFECTO = { sonido: true, volumen: 0.6, velocidadTexto: 'normal', temporizadores: 'normal', movimiento: 'auto', modoIA: true };

  function nuevo() {
    return { version: 1, escenarios: {}, logros: {}, conceptos: [], ajustes: Object.assign({}, AJUSTES_DEFECTO), tutorialVisto: false, guiaVista: false, partidas: 0 };
  }

  /* ---------- Almacenamiento tolerante a fallos ---------- */
  const memoria = {};
  const almacenNavegador = {
    leer(clave) {
      try { return raiz.localStorage ? raiz.localStorage.getItem(clave) : memoria[clave] || null; } catch (e) { return memoria[clave] || null; }
    },
    escribir(clave, valor) {
      memoria[clave] = valor;
      try { if (raiz.localStorage) raiz.localStorage.setItem(clave, valor); } catch (e) { /* modo privado o almacenamiento lleno */ }
    },
    borrar(clave) {
      delete memoria[clave];
      try { if (raiz.localStorage) raiz.localStorage.removeItem(clave); } catch (e) { /* ignorar */ }
    }
  };

  function cargar(almacen) {
    almacen = almacen || almacenNavegador;
    let datos = null;
    try { datos = JSON.parse(almacen.leer(CLAVE) || 'null'); } catch (e) { datos = null; }
    const p = nuevo();
    if (datos && datos.version === 1) {
      Object.assign(p, datos);
      p.ajustes = Object.assign({}, AJUSTES_DEFECTO, datos.ajustes || {});
    }
    return p;
  }
  function guardar(progreso, almacen) {
    (almacen || almacenNavegador).escribir(CLAVE, JSON.stringify(progreso));
  }
  function reiniciar(almacen) {
    (almacen || almacenNavegador).borrar(CLAVE);
    return nuevo();
  }

  /* ---------- Consultas ---------- */
  function puntuacionTotal(progreso) {
    return Object.values(progreso.escenarios).reduce((s, e) => s + (e.mejor || 0), 0);
  }
  function rango(progreso) {
    const total = puntuacionTotal(progreso);
    let i = 0;
    RANGOS.forEach((r, k) => { if (total >= r.desde) i = k; });
    const sig = RANGOS[i + 1] || null;
    return Object.assign({}, RANGOS[i], { total, siguiente: sig, faltan: sig ? sig.desde - total : 0, indice: i });
  }
  function registro(progreso, idEsc) {
    return progreso.escenarios[idEsc] || { mejor: 0, estrellas: 0, intentos: 0, superado: false };
  }
  function desbloqueado(progreso, esc) {
    if (esc.orden <= 1) return true;
    const anterior = NG.Escenarios.todos().find((e) => e.orden === esc.orden - 1);
    return !anterior || registro(progreso, anterior.id).superado;
  }
  function tecnicas(progreso) {
    const e = (orden) => { const x = NG.Escenarios.todos().find((s) => s.orden === orden); return x ? registro(progreso, x.id).superado : false; };
    return { meso: e(1), ofertaFinal: e(2), bilateral: true };
  }
  function siguienteEscenario(progreso) {
    const todos = NG.Escenarios.todos().filter((e) => /^e\d/.test(e.id));
    return todos.find((e) => desbloqueado(progreso, e) && !registro(progreso, e.id).superado) || todos[todos.length - 1];
  }

  /* ---------- Registrar una partida terminada ---------- */
  function registrarResultado(progreso, esc, partida, punt) {
    const antes = rango(progreso);
    const r = Object.assign({}, registro(progreso, esc.id));
    const tecnicasAntes = tecnicas(progreso);
    r.intentos = (r.intentos || 0) + 1;
    const record = punt.total > (r.mejor || 0);
    if (record) { r.mejor = punt.total; r.mejorResultado = { tipo: partida.resultado.tipo, dims: punt.dimensiones, fecha: new Date().toISOString().slice(0, 10) }; }
    r.estrellas = Math.max(r.estrellas || 0, punt.estrellas);
    const recienSuperado = !r.superado && punt.superado;
    r.superado = r.superado || punt.superado;
    progreso.escenarios[esc.id] = r;
    progreso.partidas = (progreso.partidas || 0) + 1;
    // Conceptos vistos (Biblioteca)
    const vistos = new Set(progreso.conceptos);
    (esc.conceptos || []).forEach((c) => vistos.add(c));
    partida.registro.forEach((x) => (x.conceptos || []).forEach((c) => vistos.add(c)));
    (punt.sesgos || []).forEach((s) => vistos.add('sesgo-' + s.id));
    progreso.conceptos = Array.from(vistos);
    // Logros
    const nuevos = [];
    (NG.Logros || []).forEach((l) => {
      if (progreso.logros[l.id]) return;
      let ok = false;
      try { ok = !!l.comprobar({ progreso, esc, p: partida, punt }); } catch (e) { ok = false; }
      if (ok) { progreso.logros[l.id] = new Date().toISOString().slice(0, 10); nuevos.push(l); }
    });
    const despues = rango(progreso);
    const tecnicasDespues = tecnicas(progreso);
    const nuevasTecnicas = Object.keys(tecnicasDespues).filter((k) => tecnicasDespues[k] && !tecnicasAntes[k]);
    return { record, recienSuperado, nuevosLogros: nuevos, subeRango: despues.indice > antes.indice ? despues : null, nuevasTecnicas };
  }

  NG.Progreso = {
    CLAVE, RANGOS, AJUSTES_DEFECTO, nuevo, cargar, guardar, reiniciar, puntuacionTotal, rango, registro,
    desbloqueado, tecnicas, siguienteEscenario, registrarResultado, almacenNavegador
  };
})(typeof window !== 'undefined' ? window : globalThis);
