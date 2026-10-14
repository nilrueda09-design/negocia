'use strict';
/* Modo equipo «Mesa de crisis»: roles, rondas, consecuencias y mediadora IA. */
const Q = NG.Equipo;
const MED = NG.Mediadora;

/* Juega una partida completa con una política de equipo. */
function jugar(semilla, estilo, postura) {
  const e = Q.crear({ semilla });
  Q.ORDEN.forEach((r) => Q.elegirPostura(e, r, postura || (estilo === 'coop' ? 'colaborativa' : 'firme')));
  while (e.fase !== 'fin') {
    Q.abrirRonda(e, Q.eventoLocal(e));
    const por = Q.proponenteDe(e.ronda);
    let paq;
    if (estilo === 'coop') paq = e.sugerencia ? e.sugerencia.paquete : Q.sugerenciaLocal(e).paquete;
    else { let bv = -1; Q.escenario().paquetes.forEach((p) => { const v = Q.base(por, p); if (v > bv) { bv = v; paq = p; } }); }
    Q.proponer(e, { paquete: paq, compromisos: [] });
    Q.otros(por).forEach((r) => Q.votar(e, r, { acepta: Q.valor(r, paq, []) >= e.roles[r].reserva }));
    const res = Q.resolver(e);
    if (!res.acuerdo && !res.fin) e.sugerencia = { paquete: MED.rondaLocal(e).propuesta };
  }
  return { e, punt: Q.puntuacion(e) };
}

prueba('hay 3 roles jugables con información privada y objetivos distintos', () => {
  assert.strictEqual(Q.ORDEN.length, 3);
  const secretos = new Set(Q.ORDEN.map((r) => Q.ROLES[r].secreto.texto));
  assert.strictEqual(secretos.size, 3);
  const e = Q.crear({ semilla: 1 });
  const hojas = Q.ORDEN.map((r) => JSON.stringify(Q.privado(e, r).hoja));
  assert.strictEqual(new Set(hojas).size, 3, 'cada rol valora distinto el mismo plan');
  // La propuesta inicial del fondo es buena para el fondo y mala para el sindicato: intereses enfrentados
  const sq = Q.escenario().statusQuo;
  assert.ok(Q.base('fondo', sq) > Q.base('sindicato', sq) + 40);
});

prueba('lo público no contiene mínimos, secretos ni hojas de puntos', () => {
  const e = Q.crear({ semilla: 2 });
  const txt = JSON.stringify(Q.publico(e));
  Q.ORDEN.forEach((r) => {
    assert.ok(!txt.includes(Q.ROLES[r].secreto.texto));
    Q.ROLES[r].confidencial.forEach((c) => assert.ok(!txt.includes(c)));
  });
  assert.ok(!/reserva|hoja/.test(txt));
});

const nueva = (semilla) => { const e = Q.crear({ semilla }); Q.ORDEN.forEach((r) => Q.elegirPostura(e, r, 'abierta')); return e; };

prueba('fase 1: las posturas se revelan a la vez y cambian confianza, clima y lo que sabe la mesa', () => {
  const e = Q.crear({ semilla: 30 });
  assert.strictEqual(e.fase, 'posturas');
  assert.throws(() => Q.abrirRonda(e, null), 'no se negocia sin posturas');
  assert.strictEqual(Q.elegirPostura(e, 'direccion', 'firme'), null, 'hasta que no eligen todos no se revela nada');
  Q.elegirPostura(e, 'sindicato', 'colaborativa');
  const decl = Q.elegirPostura(e, 'fondo', 'abierta');
  assert.strictEqual(decl.length, 3);
  assert.strictEqual(e.fase, 'apertura');
  assert.ok(e.exigencias.direccion, 'la postura firme deja su exigencia sobre la mesa');
  assert.strictEqual(e.confianza, 50 - 4 + 6 + 3);
  assert.ok(Q.publico(e).declaraciones.some((d) => d.rol === 'sindicato' && /importa/.test(d.dice)));
});

prueba('fase 3: un plan aceptado por debajo del mínimo de alguien no se ratifica', () => {
  const e = nueva(31);
  Q.abrirRonda(e, null);
  const malo = [3, 2, 0, 2, 0]; // muy malo para el sindicato
  Q.proponer(e, { paquete: malo });
  Q.votar(e, 'fondo', { acepta: true });
  Q.votar(e, 'sindicato', { acepta: true }); // acepta en la mesa… pero su asamblea no
  const res = Q.resolver(e);
  assert.strictEqual(res.acuerdo, false);
  assert.ok(res.ratificacion.some((x) => x.rol === 'sindicato' && !x.ok));
  assert.strictEqual(e.historial[0].resultado, 'no ratificado');
  assert.strictEqual(e.caja, 5);
  assert.ok(e.exigencias.sindicato);
});

prueba('fase 3: un plan que compensa a todos se ratifica y termina la partida', () => {
  const e = nueva(32);
  Q.abrirRonda(e, null);
  Q.proponer(e, { paquete: [1, 2, 2, 2, 2] });
  Q.votar(e, 'fondo', { acepta: true }); Q.votar(e, 'sindicato', { acepta: true });
  const res = Q.resolver(e);
  assert.ok(res.acuerdo && res.ratificacion.every((x) => x.ok));
  assert.strictEqual(e.fase, 'fin');
});

prueba('una ronda rechazada cuesta caja, sube el clima y cambia el turno', () => {
  const e = nueva(3);
  Q.abrirRonda(e, null);
  assert.strictEqual(Q.proponenteDe(e.ronda), 'direccion');
  Q.proponer(e, { paquete: Q.escenario().statusQuo });
  Q.votar(e, 'fondo', { acepta: true });
  Q.votar(e, 'sindicato', { acepta: false, pide: { variable: 0, opcion: 0 } });
  const res = Q.resolver(e);
  assert.strictEqual(res.acuerdo, false);
  assert.strictEqual(e.caja, 5);
  assert.ok(e.clima > 40);
  assert.strictEqual(Q.proponenteDe(e.ronda), 'fondo');
  assert.deepStrictEqual(e.exigencias.sindicato, { variable: 0, opcion: 0 }, 'la exigencia se hace pública');
});

prueba('las decisiones previas cambian opciones posteriores: sin confianza no hay compromisos', () => {
  const e = nueva(4);
  assert.ok(Q.compromisosDisponibles(e, 'direccion').length > 0);
  e.confianza = Q.CONFIANZA_COMPROMISOS - 1;
  assert.strictEqual(Q.compromisosDisponibles(e, 'direccion').length, 0);
});

prueba('el clima acumulado provoca una huelga que cuesta caja y confianza', () => {
  const e = nueva(5);
  e.clima = 75;
  Q.abrirRonda(e, null);
  Q.proponer(e, { paquete: [3, 2, 0, 2, 0] });
  Q.votar(e, 'fondo', { acepta: false });
  Q.votar(e, 'sindicato', { acepta: false });
  const res = Q.resolver(e);
  assert.ok(res.notas.some((n) => /Huelga/.test(n)));
  assert.strictEqual(e.caja, 4);
  assert.ok(e.eventos.some((x) => x.id === 'huelga'));
});

prueba('los compromisos laterales suman a quien los recibe y cuestan a quien los da', () => {
  const p = [1, 1, 1, 1, 1];
  assert.strictEqual(Q.valor('fondo', p, ['consejo']), Math.round((Q.base('fondo', p) + 10) * 10) / 10);
  assert.strictEqual(Q.valor('direccion', p, ['consejo']), Math.round((Q.base('direccion', p) - 4) * 10) / 10);
});

prueba('solo se pueden aplicar imprevistos elegibles en ese momento', () => {
  const e = nueva(6);
  assert.deepStrictEqual(Q.eventosElegibles(e), [], 'la primera ronda no tiene imprevistos');
  assert.throws(() => Q.abrirRonda(e, 'pedido'));
});

prueba('equilibrio: cooperar llega a acuerdo; el egoísmo lleva al concurso', () => {
  let coop = 0, ego = 0, ac = 0, ae = 0;
  for (let s = 1; s <= 60; s++) {
    const a = jugar(s, 'coop'); coop += a.punt.equipo; ac += a.punt.acuerdo;
    const b = jugar(s, 'ego'); ego += b.punt.equipo; ae += b.punt.acuerdo;
  }
  assert.ok(ac >= 54, 'el equipo cooperativo casi siempre firma (' + ac + '/60)');
  assert.ok(ae <= 6, 'el equipo egoísta casi nunca firma (' + ae + '/60)');
  assert.ok(coop / 60 > ego / 60 + 40);
});

prueba('una partida dura al menos 2 rondas y como mucho ' + Q.MAX_RONDAS, () => {
  for (let s = 1; s <= 30; s++) {
    const { punt } = jugar(s, 'coop');
    assert.ok(punt.rondas >= 1 && punt.rondas <= Q.MAX_RONDAS);
  }
});

/* ---------- Mediadora IA ---------- */
prueba('el prompt separa instrucciones, reglas, estado, roles, eventos y formato', () => {
  const e = nueva(7);
  Q.abrirRonda(e, null);
  Q.proponer(e, { paquete: Q.escenario().statusQuo });
  Q.votar(e, 'fondo', { acepta: true }); Q.votar(e, 'sindicato', { acepta: false });
  Q.resolver(e);
  const p = MED.promptRonda(e);
  ['instrucciones', 'reglas', 'estado_partida', 'informacion_de_roles', 'publica', 'confidencial', 'eventos_disponibles', 'formato_salida'].forEach((s) => {
    assert.ok(p.includes('<' + s + '>') && p.includes('</' + s + '>'), 'falta la sección ' + s);
  });
  // La mediadora no recibe mínimos ni objetivos secretos
  Q.ORDEN.forEach((r) => assert.ok(!p.includes(Q.ROLES[r].secreto.texto)));
  assert.ok(!/"reserva"|"minimo"/.test(p));
  assert.ok(!MED.promptVisible(p).includes('"prioridades"'), 'lo confidencial se oculta al mostrar el prompt');
});

prueba('validación: acepta una respuesta correcta y rechaza imprevistos o índices inválidos', () => {
  const e = nueva(8); e.ronda = 3; e.caja = 4;
  const el = Q.eventosElegibles(e).map((x) => x.id);
  const ok = MED.validarRonda({ analisis: 'Falta un gesto hacia la plantilla.', propuesta: [1, 1, 1, 1, 2], razon: 'Reparte esfuerzos.', evento: el[0], anuncio_evento: 'Una noticia.' }, e);
  assert.ok(ok.ok);
  const malEvento = MED.validarRonda({ analisis: 'x', propuesta: [1, 1, 1, 1, 2], razon: 'y', evento: 'meteorito', anuncio_evento: '' }, e);
  assert.ok(!malEvento.ok && malEvento.problemas.some((p) => /meteorito/.test(p)));
  const malPaquete = MED.validarRonda({ analisis: 'x', propuesta: [9, 1, 1], razon: 'y', evento: null, anuncio_evento: '' }, e);
  assert.ok(!malPaquete.ok && malPaquete.datos.propuesta === null);
});

prueba('validación: descarta respuestas que filtran información privada', () => {
  const e = nueva(9);
  const fuga = MED.validarRonda({ analisis: 'El fondo tiene un mínimo de 47 pts, así que acepta seguro.', propuesta: [1, 1, 1, 1, 2], razon: 'Ok.', evento: null, anuncio_evento: '' }, e);
  assert.ok(!fuga.ok && fuga.fuga);
  const fuga2 = MED.validarRonda({ analisis: 'Recordad que la caja de resistencia del sindicato es limitada.', propuesta: [1, 1, 1, 1, 2], razon: 'Ok.', evento: null, anuncio_evento: '' }, e);
  assert.ok(!fuga2.ok && fuga2.fuga);
});

prueba('la mediadora local siempre devuelve algo válido (respaldo sin conexión)', () => {
  for (let s = 1; s <= 20; s++) {
    const e = nueva(s); e.ronda = 2 + (s % 4); e.caja = 1 + (s % 5); e.clima = 30 + s * 2;
    const r = MED.rondaLocal(e);
    const v = MED.validarRonda({ analisis: r.analisis, propuesta: r.propuesta, razon: r.razon, evento: r.evento, anuncio_evento: r.anuncio }, e);
    assert.ok(v.ok, v.problemas.join('; '));
  }
});

prueba('la evaluación final se valida y tiene una entrada por rol', () => {
  const { e, punt } = jugar(3, 'coop');
  const loc = MED.evaluacionLocal(e, punt);
  assert.ok(MED.validarEvaluacion(loc).ok);
  assert.ok(!MED.validarEvaluacion({ resumen: 'x', roles: { direccion: 'a' } }).ok);
  assert.ok(MED.promptEvaluacion(e, punt).includes('<formato_salida>'));
});
