'use strict';
const M = NG.Motor;
const P = NG.Preparacion;

function nueva(opts) {
  opts = opts || {};
  const esc = NG.Escenarios.obtener(opts.escenario || 'e1-proveedor');
  const prep = P.crear(esc);
  (opts.investigar || []).forEach((id) => P.investigar(prep, esc, id));
  P.definir(prep, esc, Object.assign({ batnaId: 'turco', reserva: 34, objetivo: 75, apertura: [0, 1, 3] }, opts.definir || {}));
  const p = M.crearPartida(esc, prep, { semilla: opts.semilla || 7, variacion: false, tecnicas: opts.tecnicas });
  M.iniciar(p);
  if (opts.sinEventos) p.eventosOcurridos = esc.eventos.map((e) => e.id);
  return { esc, p };
}
/* Ejecuta una acción resolviendo antes cualquier evento pendiente con su opción por defecto. */
function actuar(p, accion) {
  while (p.fase === 'evento') M.resolverEvento(p, null);
  if (p.fase !== 'negociacion') return [];
  return M.ejecutar(p, accion);
}

prueba('determinismo: misma semilla y mismas acciones → misma partida', () => {
  const guion = [{ tipo: 'oferta', paquete: [1, 1, 3] }, { tipo: 'pregunta', id: 'planes' }, { tipo: 'presionar' }, { tipo: 'oferta', paquete: [2, 0, 3] }];
  const a = nueva({ semilla: 99 }).p, b = nueva({ semilla: 99 }).p;
  guion.forEach((x) => { actuar(a, x); actuar(b, x); });
  assert.strictEqual(JSON.stringify(a), JSON.stringify(b));
});

prueba('la variación oculta cambia los parámetros entre semillas', () => {
  const esc = NG.Escenarios.obtener('e1-proveedor');
  const prep = P.crear(esc);
  P.definir(prep, esc, { batnaId: 'turco', reserva: 34, objetivo: 75, apertura: [0, 1, 3] });
  const vals = new Set();
  for (let s = 1; s <= 20; s++) { const p = M.crearPartida(esc, prep, { semilla: s }); vals.add(p.contrapartes[0].R + '/' + p.contrapartes[0].A0); }
  assert.ok(vals.size > 5);
});

prueba('una oferta ofensiva baja la confianza, sube la tensión y endurece', () => {
  const { p } = nueva({ sinEventos: true });
  const c = p.contrapartes[0];
  const C0 = c.C, E0 = c.E;
  const S = actuar(p, { tipo: 'oferta', paquete: [0, 3, 3] }); // 780 € · 90 días: insultante para Jordi
  assert.ok(c.C < C0, 'confianza');
  assert.ok(c.Emax > E0, 'tensión');
  assert.ok(c.H > 0, 'endurecimiento');
  assert.strictEqual(c.ancla, 0, 'sin efecto ancla');
  assert.ok(S.some((s) => s.tipo === 'reaccion' && s.reaccion === 'ofendido'));
  assert.ok(p.registro.some((r) => r.tipo === 'juicio' && r.juicio === 'error' && r.sesgo === 'exceso'));
});

prueba('una apertura ambiciosa pero creíble ancla: rebaja su aspiración', () => {
  const sin = nueva({ sinEventos: true }).p;
  const A0 = M.aspiracion(sin, 0);
  const { p } = nueva({ sinEventos: true });
  actuar(p, { tipo: 'oferta', paquete: [0, 2, 3] }); // 780 € · 60 días · 14.000 t (≈35 para Jordi)
  assert.ok(p.contrapartes[0].ancla >= 4, 'ancla ' + p.contrapartes[0].ancla);
  assert.ok(M.aspiracion(p, 0) < A0 - 4);
});

prueba('las concesiones generan crédito de reciprocidad', () => {
  const { p } = nueva({ sinEventos: true });
  actuar(p, { tipo: 'oferta', paquete: [0, 2, 3] });
  const K0 = p.contrapartes[0].K;
  actuar(p, { tipo: 'concesion', variable: 1 }); // cede plazo: 60 → 45 días
  assert.ok(p.contrapartes[0].K > K0);
  assert.strictEqual(p.stats.concesiones, 1);
});

prueba('una concesión condicionada pide algo a cambio', () => {
  const { p } = nueva({ sinEventos: true });
  actuar(p, { tipo: 'oferta', paquete: [2, 2, 3] });
  actuar(p, { tipo: 'concesion', variable: 1, pedir: 0 });
  const ult = p.ofertasJugador[p.ofertasJugador.length - 1].paquete;
  assert.deepStrictEqual(ult.slice(0, 2), [1, 1]);
  assert.strictEqual(p.stats.concesionesCondicionadas, 1);
});

prueba('una oferta muy buena para la contraparte se acepta', () => {
  const { p } = nueva({ sinEventos: true });
  actuar(p, { tipo: 'oferta', paquete: [5, 0, 3] }); // 880 € · 30 días · 14.000 t = 100 para Jordi
  assert.strictEqual(p.fase, 'fin');
  assert.strictEqual(p.resultado.tipo, 'acuerdo');
});

prueba('aceptar su propuesta cierra con ese paquete', () => {
  const { p } = nueva({ sinEventos: true });
  actuar(p, { tipo: 'oferta', paquete: [0, 2, 3] });
  const mesa = p.ofertaEnMesa.paquete.slice();
  actuar(p, { tipo: 'aceptar' });
  assert.strictEqual(p.resultado.tipo, 'acuerdo');
  assert.deepStrictEqual(p.resultado.paquete, mesa);
});

prueba('agotar la paciencia lleva al ultimátum y luego a la ruptura', () => {
  const { p } = nueva({ sinEventos: true });
  let n = 0;
  while (p.fase === 'negociacion' && n++ < 30) {
    const d = M.accionesDisponibles(p);
    if (p.contrapartes[0].ultimatum) { assert.strictEqual(d.pregunta, false); assert.strictEqual(d.presionar, false); }
    actuar(p, { tipo: 'oferta', paquete: [2, 2, 1] }); // ~36 para Jordi: insuficiente, sin retroceder
  }
  assert.strictEqual(p.resultado.tipo, 'ruptura');
  assert.ok(n <= 15);
});

prueba('preguntar con poca confianza obtiene evasivas; con confianza, revela intereses', () => {
  const { p } = nueva({ sinEventos: true });
  p.contrapartes[0].C = 10;
  actuar(p, { tipo: 'pregunta', id: 'preocupa' });
  assert.ok(!p.revelado.intereses.includes('tesoreria'));
  assert.ok(p.preguntasEvadidas.includes('preocupa'));
  p.contrapartes[0].C = 90;
  actuar(p, { tipo: 'pregunta', id: 'preocupa' });
  assert.ok(p.revelado.intereses.includes('tesoreria'));
  assert.ok(p.pizarra.some((n) => n.id === 'int-tesoreria'));
});

prueba('una pregunta sugestiva se penaliza como sesgo de confirmación', () => {
  const { p } = nueva({ sinEventos: true });
  const C0 = p.contrapartes[0].C;
  actuar(p, { tipo: 'pregunta', id: 'abuso' });
  assert.ok(p.contrapartes[0].C < C0);
  assert.ok(p.registro.some((r) => r.sesgo === 'confirmacion'));
});

prueba('revelar tu punto de reserva sube su reserva efectiva', () => {
  const { p } = nueva({ sinEventos: true, definir: { reserva: 60 } });
  actuar(p, { tipo: 'compartir', id: 'limite' });
  assert.ok(p.contrapartes[0].Rjugador > p.contrapartes[0].R);
  assert.ok(M.aspiracion(p, 0) >= p.contrapartes[0].Rjugador);
});

prueba('compartir prioridades mejora lo que la contraparte sabe de ti', () => {
  const { p } = nueva({ sinEventos: true });
  actuar(p, { tipo: 'compartir', id: 'prioridades' });
  assert.ok(p.contrapartes[0].conocimiento > 0);
  assert.ok(p.contrapartes[0].estimJ[0] > p.contrapartes[0].estimJ[1]);
});

prueba('presionar con una BATNA sin verificar suele acabar en farol descubierto', () => {
  let descubiertos = 0, descubiertosFuerte = 0;
  for (let s = 1; s <= 60; s++) {
    const { p } = nueva({ semilla: s, sinEventos: true, definir: { batnaId: 'interna', reserva: 52 } });
    actuar(p, { tipo: 'presionar' });
    if (p.stats.farolesDescubiertos) descubiertos++;
    const f = nueva({ semilla: s, sinEventos: true, investigar: ['alternativas'], definir: { batnaId: 'portugues', reserva: 48 } }).p;
    actuar(f, { tipo: 'presionar' });
    if (f.stats.farolesDescubiertos) descubiertosFuerte++;
  }
  assert.ok(descubiertos > 30, 'faroles con BATNA falsa: ' + descubiertos);
  assert.ok(descubiertosFuerte < descubiertos / 2, 'con BATNA sólida: ' + descubiertosFuerte);
});

prueba('abandonar te deja tu BATNA real', () => {
  const { p } = nueva({ sinEventos: true, definir: { batnaId: 'interna', reserva: 50 } });
  actuar(p, { tipo: 'abandonar' });
  assert.strictEqual(p.resultado.tipo, 'abandono');
  assert.strictEqual(p.resultado.uj, 18); // el valor real, no el aparente (52)
});

prueba('los eventos pausan la negociación y sus efectos se aplican', () => {
  let visto = false;
  for (let s = 1; s <= 30 && !visto; s++) {
    const { p } = nueva({ semilla: s });
    for (let t = 0; t < 8 && p.fase !== 'fin'; t++) {
      if (p.fase === 'evento') {
        if (p.eventoPendiente === 'cfo') {
          const r0 = p.jugador.reserva;
          assert.strictEqual(M.accionesDisponibles(p).oferta, false);
          M.resolverEvento(p, 'bajar');
          assert.strictEqual(p.jugador.reserva, r0 - 10);
          assert.ok(p.registro.some((r) => r.evento === 'cfo' && r.juicio === 'error'));
          visto = true; break;
        }
        M.resolverEvento(p, null);
        continue;
      }
      M.ejecutar(p, { tipo: 'pregunta', id: 'mantener' });
    }
  }
  assert.ok(visto, 'el evento del CFO debería aparecer en alguna semilla');
});

prueba('MESO: o cierra con la mejor opción o revela una preferencia', () => {
  const { p } = nueva({ sinEventos: true, tecnicas: { meso: true } });
  assert.strictEqual(M.accionesDisponibles(p).meso, true);
  actuar(p, { tipo: 'meso', paquetes: [[0, 2, 3], [1, 0, 2], [2, 3, 3]] });
  assert.ok(p.fase === 'fin' || p.pizarra.some((n) => /MESO/.test(n.titulo)));
  assert.strictEqual(p.stats.mesos, 1);
});

prueba('la observación no expone variables ocultas', () => {
  const { p } = nueva({ sinEventos: true });
  const obs = M.observacion(p);
  const txt = JSON.stringify(obs.contrapartes);
  ['"R"', '"A0"', '"pesos"', '"H"', '"K"', 'reserva', 'aspiracion'].forEach((k) => assert.ok(!txt.includes(k), k));
  assert.strictEqual(obs.acciones.aceptar, false);
});

/* ---------------- Multiparte ---------------- */
NG.Escenarios.registrar({
  id: 'test-multi', orden: 90, titulo: 'Prueba multiparte', quienAbre: 'jugador',
  variables: [
    { id: 'a', nombre: 'A', opciones: ['0', '1', '2', '3'], jugador: { peso: 0.4, curva: 'asc' } },
    { id: 'b', nombre: 'B', opciones: ['0', '1', '2'], jugador: { peso: 0.3, curva: 'asc' } },
    { id: 'c', nombre: 'C', opciones: ['0', '1', '2'], jugador: { peso: 0.3, curva: 'desc' } }
  ],
  jugador: { puntosPreparacion: 2, batnas: [{ id: 'x', texto: 'X', valor: 30, conocida: true }] },
  contrapartes: [
    { id: 's', nombre: 'Sara Sol', personalidad: 'competitiva', pesos: { a: 0.6, b: 0.2, c: 0.2 }, curvas: { a: 'desc', b: 'desc', c: 'asc' }, reserva: 40, aspiracion: 85, paciencia: 8, confianza: 45 },
    { id: 'f', nombre: 'Fede Font', personalidad: 'analitica', pesos: { a: 0.2, b: 0.6, c: 0.2 }, curvas: { a: 'desc', b: 'desc', c: 'asc' }, reserva: 40, aspiracion: 85, paciencia: 8, confianza: 50 }
  ],
  compromisos: [{ id: 'cs', con: 's', texto: 'Promesa a Sara', bonus: 8, coste: 3 }],
  preguntas: [], informacion: [], eventos: []
});
function multi(semilla) {
  const esc = NG.Escenarios.obtener('test-multi');
  const prep = P.crear(esc);
  P.definir(prep, esc, { batnaId: 'x', reserva: 30, objetivo: 70 });
  const p = M.crearPartida(esc, prep, { semilla: semilla || 3, variacion: false });
  M.iniciar(p);
  return p;
}

prueba('multiparte: hace falta el sí de todas las partes', () => {
  const p = multi();
  assert.strictEqual(M.accionesDisponibles(p).aceptar, false);
  M.ejecutar(p, { tipo: 'oferta', paquete: [0, 0, 2] }); // ideal para ambas
  assert.strictEqual(p.resultado.tipo, 'acuerdo');
  assert.ok(p.contrapartes.every((c) => c.haAceptado));
});

prueba('multiparte: ofertas que perjudican a todos forman un bloque', () => {
  const p = multi();
  M.ejecutar(p, { tipo: 'oferta', paquete: [3, 2, 0] });
  M.ejecutar(p, { tipo: 'oferta', paquete: [3, 2, 0] });
  assert.ok(p.bloque && p.bloque.length === 2, 'bloque: ' + JSON.stringify(p.bloque));
  assert.ok(p.contrapartes.every((c) => c.exigencia));
});

prueba('multiparte: un compromiso lateral crea un aliado y rompe el bloque', () => {
  const p = multi();
  M.ejecutar(p, { tipo: 'oferta', paquete: [3, 2, 0] });
  M.ejecutar(p, { tipo: 'oferta', paquete: [3, 2, 0] });
  M.ejecutar(p, { tipo: 'bilateral', con: 's', sub: 'compromiso', id: 'cs' });
  assert.strictEqual(p.contrapartes[0].aliado, true);
  assert.strictEqual(p.bonus.c[0], 8);
  assert.strictEqual(p.bonus.jugador, -3);
  assert.strictEqual(p.bloque, null);
  assert.strictEqual(p.bloquesRotos, 1);
});

prueba('oferta final rechazada: aviso y pérdida de credibilidad si sigues negociando', () => {
  const esc = NG.Escenarios.obtener('e3-cliente');
  const prep = P.crear(esc);
  P.definir(prep, esc, { batnaId: 'perder', reserva: 22, objetivo: 66 });
  const p = M.crearPartida(esc, prep, { semilla: 7, variacion: false, tecnicas: { ofertaFinal: true } });
  M.iniciar(p);
  p.eventosOcurridos = esc.eventos.map((e) => e.id);
  const S = M.ejecutar(p, { tipo: 'oferta', paquete: [0, 0, 2, 0], final: true });
  assert.strictEqual(p.jugador.ofertaFinalPendiente, true);
  assert.ok(S.some((s) => s.tipo === 'aviso'));
  M.ejecutar(p, { tipo: 'pregunta', id: 'garantias' });
  assert.ok(p.jugador.credibilidad < 1);
});

prueba('multiparte: la exigencia siempre pide algo distinto de lo que ya ofreces', () => {
  const esc = NG.Escenarios.obtener('e5-multiparte');
  for (let semilla = 1; semilla <= 40; semilla++) {
    const prep = P.crear(esc);
    P.definir(prep, esc, esc.partidaModelo.preparacion.definir);
    const p = M.crearPartida(esc, prep, { semilla, tecnicas: { bilateral: true } });
    M.iniciar(p);
    p.eventosOcurridos = esc.eventos.map((e) => e.id);
    const paq = [1, 1, 1, 1, 0];
    M.ejecutar(p, { tipo: 'oferta', paquete: paq });
    p.contrapartes.forEach((c) => {
      if (!c.exigencia || c.haAceptado) return;
      const i = esc.variables.findIndex((v) => v.id === c.exigencia.variable);
      assert.notStrictEqual(c.exigencia.opcion, paq[i], 'semilla ' + semilla + ': ' + c.id + ' exige lo que ya tiene en ' + c.exigencia.variable);
    });
  }
});
