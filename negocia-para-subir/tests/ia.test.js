'use strict';
/* Modo IA: las piezas puras del cliente (sin red). Comprueban que la IA
 * nunca puede saltarse el motor y que no se envían variables ocultas. */
const M = NG.Motor;
const P = NG.Preparacion;
const IA = NG.IA;

function nueva(escId, definir, opts) {
  const esc = NG.Escenarios.obtener(escId || 'e1-proveedor');
  const prep = P.crear(esc);
  P.definir(prep, esc, definir || { batnaId: 'turco', reserva: 34, objetivo: 75, apertura: [0, 1, 3] });
  const p = M.crearPartida(esc, prep, Object.assign({ semilla: 7, variacion: false }, opts || {}));
  M.iniciar(p);
  p.eventosOcurridos = esc.eventos.map((e) => e.id);
  return { esc, p };
}

prueba('el contexto de interpretación no contiene ninguna variable oculta', () => {
  const { esc, p } = nueva();
  const ctx = IA.contextoInterpretacion(p);
  const txt = JSON.stringify(ctx);
  const c = esc.contrapartes[0];
  assert.ok(!/reserva|aspiracion|pesos|curvas|batna/i.test(Object.keys(ctx).join(' ')));
  assert.ok(!txt.includes(c.batna.texto), 'no revela su BATNA');
  c.intereses.forEach((it) => assert.ok(!txt.includes(it.texto), 'no revela intereses ocultos'));
  assert.strictEqual(ctx.variables.length, esc.variables.length);
  assert.deepStrictEqual(ctx.ultimaOferta, [0, 1, 3], 'usa la apertura como referencia');
  assert.strictEqual(ctx.acciones.aceptar, false);
  assert.ok(ctx.preguntas.some((q) => q.id === 'preocupa'));
});

prueba('accionMotor valida la acción contra lo que el motor permite ahora', () => {
  const { p } = nueva();
  assert.deepStrictEqual(IA.accionMotor(p, { tipo: 'pregunta', id: 'preocupa' }), { tipo: 'pregunta', id: 'preocupa' });
  assert.strictEqual(IA.accionMotor(p, { tipo: 'pregunta', id: 'inventada' }), null);
  assert.strictEqual(IA.accionMotor(p, { tipo: 'aceptar' }), null, 'no hay propuesta sobre la mesa');
  assert.strictEqual(IA.accionMotor(p, { tipo: 'oferta', paquete: [0, 9, 0] }), null, 'opción fuera de rango');
  assert.strictEqual(IA.accionMotor(p, { tipo: 'oferta', paquete: [0, 1] }), null, 'faltan variables');
  assert.strictEqual(IA.accionMotor(p, { tipo: 'concesion', variable: 0 }), null, 'tipo no permitido a la IA');
  const o = IA.accionMotor(p, { tipo: 'oferta', paquete: [1, 2, 2], justifica: true, final: true });
  assert.deepStrictEqual(o.paquete, [1, 2, 2]);
  assert.strictEqual(o.criterio, undefined, 'sin criterio investigado no hay justificación');
  assert.strictEqual(o.final, false, 'la oferta final aún no está desbloqueada');
});

prueba('las decisiones del motor se extraen por personaje, con su propuesta exacta', () => {
  const { esc, p } = nueva();
  const S = M.ejecutar(p, { tipo: 'oferta', paquete: [0, 1, 3] });
  const decs = IA.decisiones(p, S);
  assert.strictEqual(decs.length, 1);
  assert.strictEqual(decs[0].quien, 'jordi');
  const of = S.find((s) => s.tipo === 'oferta' && s.quien === 'jordi');
  if (of) assert.strictEqual(decs[0].oferta, NG.Analisis.describir(esc, of.paquete));
  assert.ok(decs[0].textoMotor.length > 0);
});

prueba('la narración solo sustituye textos: reacciones, deltas y ofertas quedan intactas', () => {
  const { p } = nueva();
  const S = M.ejecutar(p, { tipo: 'pregunta', id: 'planes' });
  const R = IA.aplicarNarracion(S, [{ quien: 'jordi', texto: 'Texto narrado' }], 'Lo que escribe el jugador');
  const sinDialogo = (L) => L.filter((s) => s.tipo !== 'dialogo').map((s) => JSON.stringify(s));
  assert.deepStrictEqual(sinDialogo(R), sinDialogo(S));
  const dj = R.filter((s) => s.tipo === 'dialogo' && s.quien === 'jugador');
  const dc = R.filter((s) => s.tipo === 'dialogo' && s.quien === 'jordi');
  assert.strictEqual(dj.length, 1); assert.strictEqual(dj[0].texto, 'Lo que escribe el jugador');
  assert.strictEqual(dc.length, 1); assert.strictEqual(dc[0].texto, 'Texto narrado'); assert.ok(dc[0].ia);
});

prueba('si la IA no responde, se conservan las líneas clásicas', () => {
  const { p } = nueva();
  const S = M.ejecutar(p, { tipo: 'pregunta', id: 'planes' });
  const R = IA.aplicarNarracion(S, [], null);
  assert.deepStrictEqual(R, S);
});

prueba('multiparte: cada parte recibe su propia narración', () => {
  const esc = NG.Escenarios.obtener('e5-multiparte');
  const { p } = nueva('e5-multiparte', esc.partidaModelo.preparacion.definir, { tecnicas: { bilateral: true } });
  const S = M.ejecutar(p, { tipo: 'oferta', paquete: esc.statusQuo });
  const decs = IA.decisiones(p, S);
  assert.ok(decs.length >= 1);
  const ctx = IA.contextoNarracion(p, 'Propongo esto', decs);
  assert.ok(ctx.personajes.every((x) => decs.some((d) => d.quien === x.id)));
  const R = IA.aplicarNarracion(S, decs.map((d) => ({ quien: d.quien, texto: 'Voz de ' + d.quien })), null);
  decs.forEach((d) => assert.ok(R.some((s) => s.tipo === 'dialogo' && s.texto === 'Voz de ' + d.quien)));
});
