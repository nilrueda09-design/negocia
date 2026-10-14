'use strict';
const M = NG.Motor;
const P = NG.Preparacion;

function partida(definir, investigar) {
  const esc = NG.Escenarios.obtener('e1-proveedor');
  const prep = P.crear(esc);
  (investigar || []).forEach((id) => P.investigar(prep, esc, id));
  P.definir(prep, esc, Object.assign({ batnaId: 'turco', reserva: 34, objetivo: 75, apertura: [0, 1, 3] }, definir || {}));
  const p = M.crearPartida(esc, prep, { semilla: 5, variacion: false });
  M.iniciar(p);
  p.eventosOcurridos = esc.eventos.map((e) => e.id);
  return p;
}
const ids = (p) => NG.Sesgos.detectar(p).map((s) => s.id);

prueba('anclaje: tu primera respuesta queda más cerca de su ancla que de tu objetivo', () => {
  const p = partida();
  p.anclaContraparte = [5, 0, 1]; // 880 € · 30 días · 10.000 t
  M.ejecutar(p, { tipo: 'oferta', paquete: [4, 0, 1] });
  const s = NG.Sesgos.detectar(p).find((x) => x.id === 'anclaje');
  assert.ok(s, 'debería detectar anclaje');
  assert.ok(/abrió con/.test(s.ejemplo));
});

prueba('pastel fijo: tres ofertas moviendo solo el precio', () => {
  const p = partida();
  [[0, 2, 1], [1, 2, 1], [2, 2, 1]].forEach((pk) => { if (p.fase === 'negociacion') M.ejecutar(p, { tipo: 'oferta', paquete: pk }); });
  assert.ok(ids(p).includes('pastelFijo'));
});

prueba('exceso de confianza: BATNA sin verificar', () => {
  const p = partida({ batnaId: 'interna', reserva: 52 });
  M.ejecutar(p, { tipo: 'abandonar' });
  const s = NG.Sesgos.detectar(p).find((x) => x.id === 'exceso');
  assert.ok(s && /sin verificarla/.test(s.ejemplo + (s.extra || '')));
});

prueba('escalada de compromiso: concesiones seguidas sin reciprocidad', () => {
  const p = partida();
  p.stats.maxRachaSinReciprocidad = 4;
  assert.ok(ids(p).includes('escalada'));
});

prueba('coste hundido: cerrar por debajo de tu BATNA tras muchos turnos', () => {
  const p = partida({ batnaId: 'portugues', reserva: 48 }, ['alternativas']);
  p.turno = 8;
  p.resultado = { tipo: 'acuerdo', paquete: [4, 2, 1], uj: 37.5, uc: [50], turno: 8 };
  p.fase = 'fin';
  assert.ok(ids(p).includes('costeHundido'));
});

prueba('aceptar su primera contraoferta sin explorar es anclaje', () => {
  const p = partida();
  M.ejecutar(p, { tipo: 'oferta', paquete: [0, 2, 3] });
  M.ejecutar(p, { tipo: 'aceptar' });
  assert.ok(ids(p).includes('anclaje'));
});

prueba('la partida modelo no comete sesgos', () => {
  const { Agentes, jugar } = require('./agentes.js');
  const { p } = jugar(NG.Escenarios.obtener('e1-proveedor'), Agentes.modelo, 4242);
  assert.deepStrictEqual(ids(p), []);
});

prueba('cada sesgo detectado trae definición, ejemplo y consejo', () => {
  const p = partida({ batnaId: 'interna', reserva: 52 });
  M.ejecutar(p, { tipo: 'pregunta', id: 'abuso' });
  NG.Sesgos.detectar(p).forEach((s) => {
    assert.ok(s.nombre && s.definicion && s.consejo && s.ejemplo, s.id);
    assert.ok([1, 2, 3].includes(s.gravedad));
  });
});
