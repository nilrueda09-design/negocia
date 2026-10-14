'use strict';
/* Criterios de balance con menos partidas (la simulación completa está en simulacion.js).
 * «Ganable»: la estrategia que crea valor supera el escenario. «No obvio»: ninguna
 * estrategia trivial lo supera de forma sistemática y la excelencia (★★★) no sale sola. */
const { ejecutar } = require('./simulacion.js');

const res = ejecutar(150).filter((r) => /^e\d/.test(r.esc.id));
res.forEach(({ esc, filas }) => {
  const f = Object.fromEntries(filas.map((x) => [x.clave, x]));
  prueba(esc.titulo + ': crear valor puntúa más que solo presionar', () => {
    assert.ok(f.colaborativo.total >= f.agresivo.total + 10, f.colaborativo.total + ' vs ' + f.agresivo.total);
    assert.ok(f.colaborativo.dims.conjunto > f.agresivo.dims.conjunto);
  });
  prueba(esc.titulo + ': ninguna estrategia trivial gana siempre', () => {
    ['agresivo', 'blando', 'regateador', 'aleatorio'].forEach((k) => assert.ok(f[k].superado < 60, k + ' supera el ' + f[k].superado + ' %'));
  });
  prueba(esc.titulo + ': ganable pero no obvio', () => {
    assert.ok(f.colaborativo.superado >= 60, 'colaborativo supera ' + f.colaborativo.superado + ' %');
    assert.ok(f.colaborativo.tres < 60, 'colaborativo ★★★ ' + f.colaborativo.tres + ' %');
  });
});
