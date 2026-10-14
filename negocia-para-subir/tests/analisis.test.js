'use strict';
const A = NG.Analisis;

prueba('curvas de utilidad: asc, desc, array y pico', () => {
  assert.deepStrictEqual(A.curvaUtilidad('asc', 3), [0, 0.5, 1]);
  assert.deepStrictEqual(A.curvaUtilidad('desc', 3), [1, 0.5, 0]);
  assert.deepStrictEqual(A.curvaUtilidad([0, 0.2, 1], 3), [0, 0.2, 1]);
  assert.deepStrictEqual(A.curvaUtilidad({ pico: 1 }, 3), [0, 1, 0]);
  assert.throws(() => A.curvaUtilidad([0, 1], 3));
});

prueba('utilidad ponderada en escala 0-100', () => {
  const perfil = { pesos: [0.5, 0.5], u: [[0, 1], [1, 0]] };
  assert.strictEqual(A.utilidadPerfil(perfil, [1, 0]), 100);
  assert.strictEqual(A.utilidadPerfil(perfil, [0, 1]), 0);
  assert.strictEqual(A.utilidadPerfil(perfil, [1, 1]), 50);
});

prueba('frontera de Pareto en 2D descarta los dominados', () => {
  const pts = [{ k: 0, v: [1, 1] }, { k: 1, v: [2, 0] }, { k: 2, v: [0, 2] }, { k: 3, v: [0.5, 0.5] }];
  const f = A.frontera(pts).map((x) => x.k).sort();
  assert.deepStrictEqual(f, [0, 1, 2]);
});

prueba('frontera de Pareto en 3D', () => {
  const pts = [{ k: 0, v: [1, 1, 1] }, { k: 1, v: [1, 1, 0] }, { k: 2, v: [2, 0, 0] }];
  assert.deepStrictEqual(A.frontera(pts).map((x) => x.k).sort(), [0, 2]);
});

prueba('E1: el espacio se enumera entero y existe ZOPA', () => {
  const esc = NG.Escenarios.obtener('e1-proveedor');
  assert.strictEqual(esc.paquetes.length, 6 * 4 * 4);
  const an = A.analizar(esc, { dJ: 34, reservas: [42] });
  assert.ok(an.hayZopa);
  assert.ok(an.maxJFactible >= 85);
  assert.ok(an.kNash >= 0);
});

prueba('E1: regatear solo el precio deja valor sobre la mesa', () => {
  const esc = NG.Escenarios.obtener('e1-proveedor');
  // Mejor acuerdo moviendo solo el precio (plazo y volumen en statu quo) que Jordi acepte (≥ reserva)
  let mejorSoloPrecio = 0;
  for (let i = 0; i < 6; i++) {
    const p = [i, 2, 1];
    if (A.utilidadPerfil(esc.perfilesC[0], p) >= 42) mejorSoloPrecio = Math.max(mejorSoloPrecio, A.utilidadPerfil(esc.perfilJ, p));
  }
  const an = A.analizar(esc, { dJ: 34, reservas: [42] });
  assert.ok(an.maxJFactible - mejorSoloPrecio >= 30, 'diferencia ' + (an.maxJFactible - mejorSoloPrecio));
});

prueba('índice de paquete y normalización por objeto', () => {
  const esc = NG.Escenarios.obtener('e1-proveedor');
  esc.paquetes.forEach((p, k) => assert.strictEqual(A.indicePaquete(esc, p), k));
  assert.deepStrictEqual(A.normalizarPaquete(esc, { precio: 0 }), [0, 2, 1]);
});

prueba('mejor acuerdo sin perjudicar a la contraparte', () => {
  const esc = NG.Escenarios.obtener('e1-proveedor');
  const k = A.indicePaquete(esc, [3, 2, 1]); // statu quo
  const m = A.mejorSinPerjudicar(esc, esc.utilJBase, esc.utilCBase, k);
  assert.ok(esc.utilJBase[m] > esc.utilJBase[k]);
  assert.ok(esc.utilCBase[0][m] >= esc.utilCBase[0][k]);
});

prueba('un escenario con pesos mal definidos se rechaza', () => {
  assert.throws(() => NG.Escenarios.registrar({
    id: 'malo', orden: 99, variables: [{ id: 'a', nombre: 'A', opciones: ['x', 'y'], jugador: { peso: 0.7, curva: 'asc' } }],
    jugador: { batnas: [] },
    contrapartes: [{ id: 'c', nombre: 'C', personalidad: 'analitica', pesos: { a: 1 }, curvas: { a: 'desc' } }]
  }), /suman/);
});
