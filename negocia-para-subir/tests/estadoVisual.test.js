'use strict';
const V = NG.EstadoVisual;
const base = { confianza: 50, tension: 10, paciencia: 10, pacienciaMax: 10, reaccion: 'neutral', personalidad: 'analitica', turno: 0 };
const con = (x) => V.derivar(Object.assign({}, base, x));

prueba('devuelve siempre valores del catálogo', () => {
  const reacciones = Object.keys(V.POR_REACCION).concat(['neutral', 'contraoferta', 'evasiva', undefined]);
  ['competitiva', 'colaborativa', 'evasiva', 'emocional', 'analitica'].forEach((pers) => {
    reacciones.forEach((r) => {
      for (let C = 0; C <= 100; C += 25) for (let E = 0; E <= 100; E += 25) for (let P = 0; P <= 10; P += 5) {
        const v = con({ personalidad: pers, reaccion: r, confianza: C, tension: E, paciencia: P });
        assert.ok(V.EXPRESIONES.includes(v.expresion), v.expresion);
        assert.ok(V.POSTURAS.includes(v.postura), v.postura);
        assert.ok(v.gesto === null || V.GESTOS.includes(v.gesto), v.gesto);
        assert.ok(v.intensidad >= 0 && v.intensidad <= 1);
      }
    });
  });
});

prueba('aceptar → entusiasmado e inclinado hacia delante, asintiendo', () => {
  const v = con({ reaccion: 'acepta' });
  assert.deepStrictEqual([v.expresion, v.postura, v.gesto], ['entusiasmado', 'inclinado', 'asentir']);
});

prueba('con tensión alta nunca aparece entusiasmado', () => {
  for (let C = 0; C <= 100; C += 10) {
    ['acepta', 'neutral', 'reciproca', 'se_abre'].forEach((r) => assert.notStrictEqual(con({ reaccion: r, tension: 85, confianza: C }).expresion, 'entusiasmado'));
  }
});

prueba('una oferta ofensiva → molesto con los brazos cruzados', () => {
  const v = con({ reaccion: 'ofendido' });
  assert.strictEqual(v.expresion, 'molesto');
  assert.strictEqual(v.postura, 'cruzados');
  assert.strictEqual(v.gesto, 'tensarse');
});

prueba('concesión correspondida → se relaja', () => {
  const v = con({ reaccion: 'reciproca' });
  assert.strictEqual(v.expresion, 'receptivo');
  assert.strictEqual(v.gesto, 'relajarse');
});

prueba('poca paciencia → mira el reloj', () => {
  const v = con({ paciencia: 2 });
  assert.strictEqual(v.postura, 'reloj');
  assert.strictEqual(v.mirada, 'reloj');
  assert.ok(v.urgenciaReloj >= 0.75);
});

prueba('desconfianza sostenida → desconfiado y cerrado', () => {
  const v = con({ confianza: 15 });
  assert.strictEqual(v.expresion, 'desconfiado');
  assert.strictEqual(v.postura, 'cruzados');
});

prueba('mucha confianza y poca tensión → receptivo, inclinado', () => {
  const v = con({ confianza: 80, tension: 10 });
  assert.deepStrictEqual([v.expresion, v.postura], ['receptivo', 'inclinado']);
});

prueba('la tensión manda sobre la confianza', () => {
  assert.strictEqual(con({ confianza: 90, tension: 80 }).expresion, 'tenso');
  assert.strictEqual(con({ confianza: 20, tension: 80 }).expresion, 'molesto');
});

prueba('evasiva y personalidad evasiva → mira el móvil', () => {
  const v = con({ reaccion: 'evasiva', personalidad: 'evasiva' });
  assert.strictEqual(v.postura, 'movil');
});

prueba('en un bloque mira a su aliado; retirado mira hacia otro lado', () => {
  assert.strictEqual(con({ bloqueCon: 'daniel' }).mirada, 'hacia:daniel');
  assert.strictEqual(con({ retirado: true }).mirada, 'lado');
});

prueba('es pura: misma entrada, misma salida; no muta la entrada', () => {
  const e = Object.assign({}, base, { reaccion: 'pensativo' });
  const copia = JSON.stringify(e);
  assert.deepStrictEqual(V.derivar(e), V.derivar(e));
  assert.strictEqual(JSON.stringify(e), copia);
});

prueba('reloj de paciencia: verde → ámbar → rojo', () => {
  assert.strictEqual(V.reloj(10, 10).color, '#3cc6b0');
  assert.strictEqual(V.reloj(4, 10).color, '#f2b84b');
  assert.strictEqual(V.reloj(1, 10).color, '#ff6b6b');
  assert.ok(V.reloj(1, 10).urgente);
});

prueba('integración: el estado del motor alimenta el estado visual', () => {
  const esc = NG.Escenarios.obtener('e1-proveedor');
  const prep = NG.Preparacion.crear(esc);
  NG.Preparacion.definir(prep, esc, { batnaId: 'turco', reserva: 34, objetivo: 70, apertura: [0, 1, 3] });
  const p = NG.Motor.crearPartida(esc, prep, { semilla: 2, variacion: false });
  NG.Motor.iniciar(p);
  p.eventosOcurridos = esc.eventos.map((e) => e.id);
  NG.Motor.ejecutar(p, { tipo: 'oferta', paquete: [0, 3, 3] }); // ofensiva
  const v = V.derivar(NG.Motor.estadoParaVisual(p, 0));
  assert.strictEqual(v.expresion, 'molesto');
  const obs = NG.Motor.observacion(p);
  assert.strictEqual(obs.contrapartes[0].visual.expresion, 'molesto');
});
