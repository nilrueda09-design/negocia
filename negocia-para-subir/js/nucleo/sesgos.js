/* =====================================================================
 * NEGOCIA · núcleo/sesgos.js
 * Detección de sesgos cognitivos del JUGADOR a partir del registro de la
 * partida (Kahneman & Tversky; Bazerman & Neale; Thompson). Cada sesgo
 * detectado incluye un ejemplo concreto con cifras de la propia partida.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const R = Math.round;

  const CATALOGO = {
    anclaje: {
      nombre: 'Anclaje',
      definicion: 'Dejarse arrastrar por la primera cifra que aparece sobre la mesa, aunque sea arbitraria.',
      consejo: 'Antes de responder a un ancla, vuelve a tu objetivo y a tu BATNA. Si el ancla es extrema, no la contraofertes: recházala y reancla con un criterio objetivo.'
    },
    aversionPerdida: {
      nombre: 'Aversión a la pérdida',
      definicion: 'Las pérdidas pesan aproximadamente el doble que las ganancias equivalentes: ceder algo se vive como perder, aunque a cambio se gane más.',
      consejo: 'Evalúa cada intercambio por el valor neto del paquete completo, no por lo que «sueltas» en una variable concreta.'
    },
    escalada: {
      nombre: 'Escalada de compromiso',
      definicion: 'Seguir invirtiendo (concesiones, tiempo) en un curso de acción porque ya se ha invertido mucho, aunque no esté funcionando.',
      consejo: 'Fija de antemano tu punto de reserva y respétalo. Si cedes dos veces sin reciprocidad, para y exige un movimiento de la otra parte.'
    },
    confirmacion: {
      nombre: 'Sesgo de confirmación',
      definicion: 'Buscar y valorar solo la información que confirma lo que ya creemos, ignorando la que lo contradice.',
      consejo: 'Haz preguntas abiertas y genuinas. Cuando descubras algo que contradice tu plan, ajusta el plan, no la información.'
    },
    exceso: {
      nombre: 'Exceso de confianza',
      definicion: 'Sobrestimar nuestra posición, nuestra información o la fuerza de nuestras alternativas.',
      consejo: 'Verifica tu BATNA antes de usarla, calibra tus aperturas con datos de mercado y no amenaces con lo que no estás dispuesto a cumplir.'
    },
    costeHundido: {
      nombre: 'Falacia del coste hundido',
      definicion: 'Dejar que lo ya gastado (tiempo, dinero, esfuerzo), que no se puede recuperar, condicione una decisión que solo debería mirar al futuro.',
      consejo: 'Pregúntate: «Si empezara hoy desde cero, ¿aceptaría este acuerdo?». Si la respuesta es no, tu BATNA es mejor.'
    },
    pastelFijo: {
      nombre: 'Pastel fijo',
      definicion: 'Suponer que lo que gana una parte lo pierde la otra, sin buscar intercambios ni cuestiones compatibles (Bazerman & Neale).',
      consejo: 'Negocia paquetes, no variables sueltas. Pregunta qué valora la otra parte y cede en lo que a ti te importa poco a cambio de lo que te importa mucho.'
    }
  };

  function detectar(p) {
    const esc = NG.Escenarios.obtener(p.escenarioId);
    const A = NG.Analisis;
    const M = NG.Motor;
    const ofertas = p.ofertasJugador;
    const encontrados = {};
    const add = (id, gravedad, ejemplo) => {
      if (!encontrados[id] || encontrados[id].gravedad < gravedad) {
        encontrados[id] = Object.assign({ id, gravedad, ejemplo }, CATALOGO[id]);
      } else if (encontrados[id] && ejemplo && encontrados[id].ejemplo !== ejemplo && !encontrados[id].extra) {
        encontrados[id].extra = ejemplo;
      }
    };
    const nombreC = (id) => { const c = esc.contrapartes.find((x) => x.id === id); return c ? c.nombre.split(' ')[0] : 'la otra parte'; };
    const nom0 = esc.contrapartes[0].nombre.split(' ')[0];
    const uj = (paq) => M.consultas.ujDe(p, paq);

    // Sesgos marcados directamente por el motor y por los eventos; repetirlos agrava el sesgo
    const repeticiones = {};
    p.registro.forEach((r) => {
      if (r.tipo !== 'juicio' || !r.sesgo || !CATALOGO[r.sesgo]) return;
      repeticiones[r.sesgo] = (repeticiones[r.sesgo] || 0) + 1;
      const n = repeticiones[r.sesgo];
      add(r.sesgo, Math.min(3, (r.juicio === 'error' ? 2 : 1) + (n >= 3 ? 1 : 0)), 'Turno ' + r.turno + ': ' + r.explicacion + (n >= 3 ? ' (y no fue la única vez: ' + n + ' veces en la partida).' : ''));
    });

    // ---- Anclaje ----
    if (p.anclaContraparte && ofertas.length) {
      const ujA = uj(p.anclaContraparte), uj1 = ofertas[0].uj, obj = p.jugador.objetivo;
      if (Math.abs(uj1 - ujA) < Math.abs(obj - uj1) && uj1 < obj - 10) {
        add('anclaje', Math.abs(uj1 - ujA) < 8 ? 3 : 2,
          nom0 + ' abrió con «' + A.describir(esc, p.anclaContraparte) + '» (' + R(ujA) + ' pts para ti). Tu primera respuesta valía ' + R(uj1) +
          ' pts: más cerca de su ancla que de tu objetivo (' + obj + ' pts).');
      }
    } else if (p.anclaContraparte && !ofertas.length && p.resultado && p.resultado.tipo === 'acuerdo') {
      add('anclaje', 3, 'Aceptaste sin hacer ninguna contraoferta tras la apertura de ' + nom0 + ': su primera cifra marcó todo el acuerdo.');
    } else if (!p.anclaContraparte && p.resultado && p.resultado.tipo === 'acuerdo' && p.contrapartes[0].ofertas.length &&
      A.igualPaquete(p.resultado.paquete, p.contrapartes[0].ofertas[0].paquete) && !esc.multiparte) {
      add('anclaje', 2, 'Aceptaste la primera contraoferta de ' + nom0 + ' («' + A.describir(esc, p.resultado.paquete) + '», ' + R(p.resultado.uj) +
        ' pts para ti) sin explorar más: su primera cifra se convirtió en el acuerdo. Las primeras contraofertas casi nunca son las últimas.');
    } else if (!p.anclaContraparte && ofertas.length && ofertas[0].uj < p.jugador.objetivo - 15) {
      add('anclaje', 1, 'Abriste con una oferta que valía ' + R(ofertas[0].uj) + ' pts para ti, muy por debajo de tu propio objetivo (' + p.jugador.objetivo +
        ' pts): renunciaste a la ventaja de anclar primero.');
    }

    // ---- Escalada de compromiso ----
    if (p.stats.maxRachaSinReciprocidad >= 3)
      add('escalada', p.stats.maxRachaSinReciprocidad >= 4 ? 3 : 2, 'Hiciste ' + p.stats.maxRachaSinReciprocidad +
        ' concesiones seguidas sin que ' + nom0 + ' te devolviera nada. Cada concesión no correspondida enseña a la otra parte a esperar la siguiente.');

    // ---- Coste hundido ----
    if (p.resultado && p.resultado.tipo === 'acuerdo' && p.resultado.uj < p.jugador.batnaValor - 0.5 && p.turno >= 6)
      add('costeHundido', 3, 'Tras ' + p.turno + ' turnos cerraste en ' + R(p.resultado.uj) + ' pts, por debajo de tu BATNA (' + p.jugador.batnaValor +
        ' pts). El tiempo invertido ya no se recupera: no debería empujarte a aceptar.');

    // ---- Exceso de confianza ----
    if (!p.jugador.batnaVerificada) {
      const b = esc.jugador.batnas.find((x) => x.id === p.jugador.batnaId);
      add('exceso', 2, 'Elegiste como BATNA «' + (b ? b.corto || b.texto : p.jugador.batnaId) + '» sin verificarla: creías que valía ' + p.jugador.batnaMostrada +
        ' pts y en realidad valía ' + p.jugador.batnaValor + '.');
    }
    const an = A.analizar(esc, { utilJ: M.utilJ(p), utilC: M.utilC(p), dJ: p.dRef, reservas: p.contrapartes.map((c) => c.R) });
    if (p.jugador.objetivo > an.maxJFactible + 8)
      add('exceso', 1, 'Tu objetivo (' + p.jugador.objetivo + ' pts) era inalcanzable: el máximo que la otra parte podía aceptar te daba ' + R(an.maxJFactible) + ' pts.');
    if (p.prep.gastados < p.prep.puntos * 0.5)
      add('exceso', 1, 'Usaste solo ' + p.prep.gastados + ' de ' + p.prep.puntos + ' puntos de preparación: negociaste con la información justa.');

    // ---- Confirmación: información clave descubierta pero ignorada ----
    p.pizarra.filter((n) => n.tipo === 'interes' && n.importancia === 'alta' && n.direccion !== 'igual').forEach((n) => {
      const vi = esc.variables.findIndex((v) => v.id === n.variable);
      const ci = p.contrapartes.findIndex((c) => c.id === n.quien);
      if (vi < 0 || ci < 0) return;
      // Atender su interés con un compromiso lateral también es tenerlo en cuenta
      if ((esc.compromisos || []).some((x) => x.con === n.quien && p.compromisos.includes(x.id))) return;
      const tRev = n.turno || 0;
      const despues = ofertas.filter((o) => o.turno >= tRev);
      if (despues.length < 2) return;
      const perf = esc.perfilesC[ci];
      const mejorParaEllos = Math.max.apply(null, despues.map((o) => perf.u[vi][o.paquete[vi]]));
      // Solo es sesgo si nunca moviste esa variable hacia ellos respecto al punto de partida
      if (mejorParaEllos <= perf.u[vi][esc.statusQuo[vi]] + 1e-9)
        add('confirmacion', 2, 'Sabías que ' + esc.variables[vi].nombre.toLowerCase() + ' era clave para ' + nombreC(n.quien) +
          ' y aun así nunca la usaste como moneda de cambio en tus ofertas.');
    });

    // ---- Pastel fijo: solo se mueve una variable / cuestiones compatibles desperdiciadas ----
    if (ofertas.length >= 3) {
      const movidas = new Set();
      for (let k = 0; k < ofertas.length; k++) {
        const ref = k ? ofertas[k - 1].paquete : esc.statusQuo;
        ofertas[k].paquete.forEach((x, i) => { if (x !== ref[i]) movidas.add(i); });
      }
      if (movidas.size <= 1) {
        const v = movidas.size ? esc.variables[[...movidas][0]].nombre.toLowerCase() : 'ninguna variable';
        add('pastelFijo', 2, 'En ' + ofertas.length + ' ofertas solo moviste ' + v + '. Negociar una sola variable convierte la negociación en un pulso donde lo que uno gana lo pierde el otro.');
      }
    }
    if (p.resultado && p.resultado.paquete && !esc.multiparte) {
      const paq = p.resultado.paquete;
      esc.variables.forEach((v, i) => {
        const uJ = esc.perfilJ.u[i], uC = esc.perfilesC[0].u[i];
        // Cuestión compatible: ambos prefieren la misma opción
        const bestJ = uJ.indexOf(Math.max.apply(null, uJ)), bestC = uC.indexOf(Math.max.apply(null, uC));
        if (bestJ === bestC && paq[i] !== bestJ && esc.perfilJ.pesos[i] >= 0.1 && esc.perfilesC[0].pesos[i] >= 0.1) {
          add('pastelFijo', 2, 'En ' + v.nombre.toLowerCase() + ' ambos preferíais «' + v.opciones[bestJ] + '», pero el acuerdo quedó en «' + v.opciones[paq[i]] +
            '»: un resultado perder-perder en una cuestión compatible.');
        }
      });
    }

    // ---- Aversión a la pérdida: aferrarse a lo que vale poco para ti y mucho para ellos ----
    if (ofertas.length >= 3 && !esc.multiparte) {
      const perfJ = esc.perfilJ, perfC = esc.perfilesC[0];
      esc.variables.forEach((v, i) => {
        if (perfJ.pesos[i] > 0.2 || perfC.pesos[i] < 0.3) return;
        const conocido = p.pizarra.some((n) => n.variable === v.id);
        if (!conocido) return;
        const best = perfJ.u[i].indexOf(Math.max.apply(null, perfJ.u[i]));
        if (ofertas.every((o) => perfJ.u[i][o.paquete[i]] >= perfJ.u[i][best] - 0.34))
          add('aversionPerdida', 2, 'Te aferraste a ' + v.nombre.toLowerCase() + ' (solo un ' + R(perfJ.pesos[i] * 100) + ' % de tu valor) aunque sabías que para ' + nom0 +
            ' era importante. Ceder ahí habría «comprado» mucho a cambio de muy poco.');
      });
    }

    const orden = ['anclaje', 'pastelFijo', 'confirmacion', 'aversionPerdida', 'escalada', 'costeHundido', 'exceso'];
    return Object.values(encontrados).sort((a, b) => b.gravedad - a.gravedad || orden.indexOf(a.id) - orden.indexOf(b.id));
  }

  NG.Sesgos = { catalogo: CATALOGO, detectar };
})(typeof window !== 'undefined' ? window : globalThis);
