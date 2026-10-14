'use strict';
/* Validación de los datos de cada escenario real de la campaña. */
const { Agentes, jugar } = require('./agentes.js');
const reales = () => NG.Escenarios.todos().filter((e) => /^e\d/.test(e.id));

prueba('hay escenarios registrados y con orden único', () => {
  const es = reales();
  assert.ok(es.length >= 1);
  assert.strictEqual(new Set(es.map((e) => e.orden)).size, es.length);
});

reales().forEach((esc) => {
  prueba(esc.id + ': ZOPA respecto a la BATNA de referencia', () => {
    const an = NG.Analisis.analizar(esc, { dJ: Math.max.apply(null, esc.jugador.batnas.filter((b) => b.conocida && typeof b.valorAparente !== 'number').map((b) => b.valor)), reservas: esc.contrapartes.map((c) => c.reserva) });
    assert.ok(an.hayZopa);
  });

  prueba(esc.id + ': referencias internas coherentes', () => {
    const vars = new Set(esc.variables.map((v) => v.id));
    const intereses = new Set();
    esc.contrapartes.forEach((c) => (c.intereses || []).forEach((it) => { assert.ok(vars.has(it.variable), it.id); intereses.add(it.id); }));
    const batnas = new Set(esc.jugador.batnas.map((b) => b.id));
    const criterios = new Set((esc.criterios || []).map((c) => c.id));
    const lista = (x) => (x === undefined ? [] : Array.isArray(x) ? x : [x]);
    const comprobarRevela = (r, donde) => {
      if (!r) return;
      lista(r.interes).forEach((i) => assert.ok(intereses.has(i), donde + ' interés ' + i));
      lista(r.batna).forEach((b) => assert.ok(batnas.has(b), donde + ' batna ' + b));
      lista(r.verifica).forEach((b) => assert.ok(batnas.has(b), donde + ' verifica ' + b));
      lista(r.criterio).forEach((c) => assert.ok(criterios.has(c), donde + ' criterio ' + c));
    };
    (esc.investigacion || []).forEach((f) => comprobarRevela(f.revela, 'ficha ' + f.id));
    (esc.preguntas || []).forEach((q) => { comprobarRevela(q.revela, 'pregunta ' + q.id); assert.ok(['abierta', 'cerrada', 'sugestiva'].includes(q.tipo), q.id); });
    (esc.informacion || []).forEach((x) => assert.ok(x.tipo && x.texto, 'info ' + x.id));
    assert.ok(esc.jugador.batnas.some((b) => b.conocida), 'al menos una BATNA conocida');
    assert.ok(esc.briefing && esc.briefing.rol && esc.briefing.contexto, 'briefing');
  });

  prueba(esc.id + ': eventos bien formados', () => {
    (esc.eventos || []).forEach((ev) => {
      assert.ok(ev.opciones.length >= 2, ev.id);
      const idsOp = ev.opciones.map((o) => o.id);
      assert.ok(!ev.porDefecto || idsOp.includes(ev.porDefecto), ev.id + ' porDefecto');
      ev.opciones.forEach((o) => {
        assert.ok(!o.juicio || ['acierto', 'error', 'neutral'].includes(o.juicio), ev.id + '/' + o.id);
        assert.ok(o.estilo, ev.id + '/' + o.id + ' sin estilo');
        assert.ok(!o.sesgo || NG.Sesgos.catalogo[o.sesgo], ev.id + '/' + o.id + ' sesgo ' + o.sesgo);
      });
    });
  });

  prueba(esc.id + ': la partida modelo se puede reproducir y saca ★★★', () => {
    assert.ok(esc.partidaModelo, 'falta partida modelo');
    const { p, punt } = jugar(esc, Agentes.modelo, esc.partidaModelo.semilla, { tecnicas: { meso: esc.orden > 1, ofertaFinal: esc.orden > 2 } });
    assert.strictEqual(p.fase, 'fin');
    assert.ok(punt.total >= 85, 'total ' + punt.total);
    esc.partidaModelo.pasos.forEach((paso) => assert.ok(paso.comentario, 'paso sin comentario'));
  });
});
