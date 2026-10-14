'use strict';
const P = NG.Preparacion;
const esc = () => NG.Escenarios.obtener('e1-proveedor');

prueba('el presupuesto de preparación limita la investigación', () => {
  const prep = P.crear(esc());
  assert.ok(P.investigar(prep, esc(), 'cuentas').ok);
  assert.ok(P.investigar(prep, esc(), 'alternativas').ok);
  assert.ok(P.investigar(prep, esc(), 'indice').ok);
  assert.ok(P.investigar(prep, esc(), 'reputacion').ok);
  const r = P.investigar(prep, esc(), 'feria');
  assert.strictEqual(r.ok, false);
  assert.strictEqual(P.restantes(prep), 0);
});

prueba('no se puede investigar dos veces lo mismo', () => {
  const prep = P.crear(esc());
  P.investigar(prep, esc(), 'indice');
  assert.strictEqual(P.investigar(prep, esc(), 'indice').ok, false);
});

prueba('investigar revela intereses, criterios y alternativas en la pizarra', () => {
  const prep = P.crear(esc());
  P.investigar(prep, esc(), 'cuentas');
  P.investigar(prep, esc(), 'indice');
  P.investigar(prep, esc(), 'alternativas');
  assert.ok(prep.notas.some((n) => n.tipo === 'interes' && n.variable === 'plazo'));
  assert.ok(prep.revelado.criterios.includes('indice-acero'));
  assert.ok(P.batnasVisibles(prep, esc()).some((b) => b.id === 'portugues'));
});

prueba('una BATNA sin verificar muestra su valor aparente (espejismo)', () => {
  const prep = P.crear(esc());
  let interna = P.batnasVisibles(prep, esc()).find((b) => b.id === 'interna');
  assert.strictEqual(interna.valorMostrado, 52);
  assert.strictEqual(interna.verificada, false);
  P.investigar(prep, esc(), 'verificar');
  interna = P.batnasVisibles(prep, esc()).find((b) => b.id === 'interna');
  assert.strictEqual(interna.valorMostrado, 18);
  assert.strictEqual(interna.verificada, true);
});

prueba('la validación exige BATNA, reserva, objetivo coherente y apertura', () => {
  const prep = P.crear(esc());
  assert.strictEqual(P.validar(prep, esc()).ok, false);
  P.definir(prep, esc(), { batnaId: 'turco', reserva: 40, objetivo: 30 });
  assert.ok(P.validar(prep, esc()).errores.some((e) => /objetivo/.test(e)));
  const v = P.definir(prep, esc(), { objetivo: 70, apertura: [0, 1, 3] });
  assert.ok(v.ok, v.errores.join(' '));
});

prueba('no se puede elegir una BATNA que aún no se ha descubierto', () => {
  const prep = P.crear(esc());
  const v = P.definir(prep, esc(), { batnaId: 'portugues', reserva: 40, objetivo: 70, apertura: [0, 1, 3] });
  assert.strictEqual(v.ok, false);
});
