'use strict';
const M = NG.Motor;
const P = NG.Preparacion;
const { Agentes, jugar } = require('./agentes.js');

function terminada(paquete, definir) {
  const esc = NG.Escenarios.obtener('e1-proveedor');
  const prep = P.crear(esc);
  P.investigar(prep, esc, 'alternativas');
  P.definir(prep, esc, Object.assign({ batnaId: 'portugues', reserva: 48, objetivo: 80, apertura: [0, 1, 3] }, definir || {}));
  const p = M.crearPartida(esc, prep, { semilla: 3, variacion: false });
  M.iniciar(p);
  p.turno = 5;
  p.fase = 'fin';
  p.resultado = paquete
    ? { tipo: 'acuerdo', paquete, uj: M.consultas.ujDe(p, paquete), uc: [M.consultas.ucDe(p, 0, paquete)], turno: 5 }
    : { tipo: 'abandono', paquete: null, uj: p.jugador.batnaValor, uc: null, turno: 5 };
  return p;
}

prueba('las cinco dimensiones están en 0-100 y el total es su media ponderada', () => {
  for (let s = 1; s <= 30; s++) {
    const { punt } = jugar(NG.Escenarios.obtener('e1-proveedor'), Agentes.aleatorio, s);
    Object.values(punt.dimensiones).forEach((v) => assert.ok(v >= 0 && v <= 100, v));
    const W = NG.Puntuacion.PESOS;
    const t = Object.keys(W).reduce((a, k) => a + W[k] * punt.dimensiones[k], 0);
    assert.ok(Math.abs(t - punt.total) <= 0.51);
  }
});

prueba('un acuerdo integrativo crea más valor conjunto que uno de solo precio', () => {
  const integrativo = NG.Puntuacion.calcular(terminada([1, 0, 3]));   // 800 € · 30 días · 14.000 t
  const soloPrecio = NG.Puntuacion.calcular(terminada([3, 2, 1]));    // 840 € · 60 días · 10.000 t
  assert.ok(integrativo.dimensiones.conjunto > soloPrecio.dimensiones.conjunto + 40);
  assert.ok(integrativo.dimensiones.valor > soloPrecio.dimensiones.valor);
});

prueba('estrellas: umbrales 50 / 70 / 85', () => {
  const e = NG.Puntuacion.estrellasDe;
  assert.deepStrictEqual([e(49), e(50), e(69), e(70), e(84), e(85)], [0, 1, 1, 2, 2, 3]);
});

prueba('la partida modelo de E1 consigue tres estrellas', () => {
  const { punt } = jugar(NG.Escenarios.obtener('e1-proveedor'), Agentes.modelo, 4242);
  assert.strictEqual(punt.estrellas, 3, 'total ' + punt.total);
});

prueba('lo que quedó sobre la mesa: frontera, mejor acuerdo y variables ocultas', () => {
  const p = terminada([3, 2, 1]);
  const m = NG.Puntuacion.mesa(p);
  assert.ok(m.frontera.length >= 3);
  assert.ok(m.dejado > 20, 'dejado ' + m.dejado);
  assert.ok(m.cambios.length >= 1);
  assert.strictEqual(m.ocultos[0].pesos.length, 3);
  assert.ok(m.ocultos[0].reserva > 0);
});

prueba('conceptos aplicados: frases ligadas a la partida', () => {
  const p = terminada([1, 0, 3]);
  const c = NG.Puntuacion.conceptosAplicados(p, NG.Puntuacion.calcular(p));
  const batna = c.find((x) => x.id === 'batna');
  assert.ok(batna && /48 pts/.test(batna.texto));
  assert.ok(c.some((x) => x.id === 'zopa'));
});
