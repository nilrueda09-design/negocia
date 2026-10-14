/* =====================================================================
 * NEGOCIA · núcleo/puntuacion.js
 * Puntuación en 5 dimensiones, análisis de "lo que quedó sobre la mesa"
 * y conceptos aplicados en la partida (debrief).
 *
 *   valor     · cuánto de lo alcanzable capturaste (sobre tu BATNA de referencia)
 *   conjunto  · eficiencia del acuerdo: cercanía a la frontera de Pareto
 *   relacion  · confianza final, excedente de la otra parte, tensión, honestidad
 *   proceso   · preparación, preguntas, reciprocidad, ritmo…
 *   sesgos    · 100 − penalizaciones por sesgos + decisiones en eventos
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const U = NG.Util;
  const R = Math.round;

  const PESOS = { valor: 0.25, conjunto: 0.15, relacion: 0.20, proceso: 0.20, sesgos: 0.20 }; // la relación pesa: el público son directivos con relaciones de largo plazo
  const PENALIZACION = { 1: 8, 2: 15, 3: 25 };

  function estrellasDe(total) { return total >= 85 ? 3 : total >= 70 ? 2 : total >= 50 ? 1 : 0; }

  function calcular(p) {
    const esc = NG.Escenarios.obtener(p.escenarioId);
    const A = NG.Analisis, M = NG.Motor;
    const uJ = M.utilJ(p), uC = M.utilC(p);
    const reservas = p.contrapartes.map((c) => c.R);
    const an = A.analizar(esc, { utilJ: uJ, utilC: uC, dJ: p.dRef, reservas });
    const anReal = A.analizar(esc, { utilJ: uJ, utilC: uC, dJ: p.jugador.batnaValor, reservas });
    const res = p.resultado || { tipo: 'abandono', uj: p.jugador.batnaValor, paquete: null };
    const acuerdo = res.tipo === 'acuerdo';
    const ujFinal = res.uj;

    // 1) Valor obtenido: sobre un máximo REALISTA (ninguna contraparte racional cede
    //    hasta su último punto: se le deja al menos un 20 % de su margen)
    //    En multiparte con unanimidad cada parte puede vetar: el margen que conserva es mayor
    const margen = esc.multiparte ? 0.35 : 0.2;
    let maxRealista = -Infinity;
    for (let k = 0; k < esc.paquetes.length; k++) {
      let ok = true;
      for (let c = 0; c < uC.length; c++) {
        const cc = p.contrapartes[c];
        if (uC[c][k] < cc.R + margen * Math.max(0, cc.A0 - cc.R)) { ok = false; break; }
      }
      if (ok && uJ[k] > maxRealista) maxRealista = uJ[k];
    }
    if (!isFinite(maxRealista)) maxRealista = an.maxJFactible;
    const denom = Math.max(1, maxRealista - p.dRef);
    let valor = U.clamp((ujFinal - p.dRef) / denom, 0, 1) * 100;
    if (!acuerdo && (!anReal.hayZopa || anReal.maxJFactible < p.jugador.batnaValor + 2)) valor = Math.max(valor, 80);

    // 2) Valor conjunto (eficiencia)
    let conjunto;
    if (acuerdo) {
      let J = res.uj; res.uc.forEach((x) => { J += x; });
      conjunto = an.hayZopa && an.jointMax > an.jointMin
        ? U.clamp((J - an.jointMin) / (an.jointMax - an.jointMin), 0, 1) * 100 : 50;
    } else conjunto = anReal.hayZopa && anReal.maxJFactible >= p.jugador.batnaValor + 2 ? 0 : 70;

    // 3) Relación a largo plazo
    const rels = p.contrapartes.map((c, i) => {
      const sur = acuerdo ? U.clamp((res.uc[i] - c.R) / Math.max(1, c.A0 - c.R), 0, 1) : 0;
      // Solo cuenta la tensión que TÚ añadiste sobre la que ya traía a la reunión
      const e0 = esc.contrapartes[i].tension || 10;
      return 0.6 * c.C + 25 * sur + 15 * (1 - U.clamp(c.Emax - e0, 0, 100) / 100);
    });
    let relacion = U.media(rels) - 20 * p.jugador.mentirasDescubiertas - (res.tipo === 'ruptura' ? 15 : 0);
    relacion = U.clamp(relacion, 0, 100);

    // 4) Calidad del proceso (lista de comprobación)
    const items = [];
    const item = (id, texto, ok, max, pts) => items.push({ id, texto, ok, max, puntos: ok ? (pts === undefined ? max : pts) : 0 });
    const prep = p.prep;
    const claves = (esc.investigacion || []).filter((f) => f.clave);
    const clavesHechas = claves.filter((f) => prep.investigado.includes(f.id)).length;
    item('investigacion', 'Aprovechaste el tiempo de preparación', prep.gastados >= prep.puntos * 0.7, 5);
    item('clave', 'Investigaste la información clave (' + clavesHechas + '/' + claves.length + ')', clavesHechas > 0, 10, claves.length ? R(10 * clavesHechas / claves.length) : 10);
    const vis = NG.Preparacion.batnasVisibles(prep, esc);
    const mejorVisibleReal = Math.max.apply(null, vis.filter((b) => b.verificada).map((b) => esc.jugador.batnas.find((x) => x.id === b.id).valor));
    const batnaOk = p.jugador.batnaVerificada && p.jugador.batnaValor >= mejorVisibleReal - 0.5;
    item('batna', 'Elegiste tu mejor alternativa verificada como BATNA', batnaOk || p.jugador.batnaVerificada, 10, batnaOk ? 10 : 5);
    item('reserva', 'Punto de reserva coherente con tu BATNA', Math.abs(p.jugador.reserva - p.jugador.batnaValor) <= 8, 5);
    item('objetivo', 'Objetivo ambicioso pero realista', p.jugador.objetivo >= p.jugador.batnaValor + 10 && p.jugador.objetivo <= an.maxJFactible + 5, 5);
    const pi = p.stats.preguntasIntereses;
    item('preguntas', 'Preguntaste por intereses (' + pi + ')', pi >= 1, 12, pi >= 2 ? 12 : 6);
    item('compartir', 'Compartiste tus prioridades', p.stats.compartidoPrioridades > 0, 8);
    const hayOfertas = p.ofertasJugador.length > 0;
    item('retrocesos', 'Sin retroceder en tus ofertas', hayOfertas && p.stats.retrocesos === 0, 8);
    item('ofensas', 'Sin ofertas ofensivas', hayOfertas && p.stats.ofensas === 0, 8);
    item('criterio', 'Usaste criterios objetivos', p.stats.criteriosUsados > 0, 6);
    // Variables que has puesto en juego: las que tu apertura cambia respecto al statu quo y las que mueves después
    const movidas = new Set();
    p.ofertasJugador.forEach((o, k) => {
      const ref = k ? p.ofertasJugador[k - 1].paquete : esc.statusQuo;
      o.paquete.forEach((x, i) => { if (x !== ref[i]) movidas.add(i); });
    });
    const paquetes = movidas.size >= 2 || p.stats.mesos > 0 || p.stats.intercambiosCondicionados > 0 || (acuerdo && p.ofertasJugador.length <= 1 && hayOfertas);
    item('paquetes', 'Negociaste paquetes, no variables sueltas', paquetes, 8);
    const recip = p.stats.maxRachaSinReciprocidad < 3;
    item('reciprocidad', 'Concesiones recíprocas' + (p.stats.intercambiosCondicionados ? ' y condicionadas' : ''), recip && hayOfertas, 8, (recip ? 5 : 0) + (p.stats.intercambiosCondicionados ? 3 : 0));
    const ritmoOk = res.tipo !== 'ruptura' && (p.turno >= 3 || (acuerdo && valor >= 60));
    item('ritmo', 'Buen ritmo: sin precipitarte ni agotar a la otra parte', ritmoOk, 7);
    const proceso = U.clamp(items.reduce((s, x) => s + x.puntos, 0), 0, 100);

    // 5) Gestión de sesgos
    const sesgos = NG.Sesgos.detectar(p);
    let gestion = 100 - sesgos.reduce((s, x) => s + PENALIZACION[x.gravedad], 0)
      + 4 * p.stats.eventosAcierto - 4 * p.stats.eventosError;
    if (!acuerdo && p.ofertasJugador.length < 2) gestion = Math.min(gestion, 50);
    gestion = U.clamp(gestion, 0, 100);

    const dims = { valor: R(valor), conjunto: R(conjunto), relacion: R(relacion), proceso: R(proceso), sesgos: R(gestion) };
    const total = R(Object.keys(PESOS).reduce((s, k) => s + PESOS[k] * dims[k], 0));
    return {
      dimensiones: dims, total, estrellas: estrellasDe(total), superado: total >= 50,
      proceso: items, sesgos, resultado: U.copiar(res),
      zopa: { hay: anReal.hayZopa, desde: p.jugador.batnaValor, hasta: R(an.maxJFactible) }
    };
  }

  /* ---------- "Lo que quedó sobre la mesa": datos para el debrief ---------- */
  function mesa(p) {
    const esc = NG.Escenarios.obtener(p.escenarioId);
    const A = NG.Analisis, M = NG.Motor;
    const uJ = M.utilJ(p), uC = M.utilC(p);
    const reservas = p.contrapartes.map((c) => c.R);
    const an = A.analizar(esc, { utilJ: uJ, utilC: uC, dJ: p.jugador.batnaValor, reservas });
    const yDe = (k) => U.media(uC.map((arr) => arr[k]));
    const puntos = esc.paquetes.map((pk, k) => ({ k, x: uJ[k], y: yDe(k), v: [uJ[k], yDe(k)] }));
    const frontera = A.frontera(puntos).sort((a, b) => a.x - b.x).map((pt) => ({ k: pt.k, x: pt.x, y: pt.y }));
    const res = p.resultado;
    const acuerdo = res && res.tipo === 'acuerdo';
    const kAcuerdo = acuerdo ? A.indicePaquete(esc, res.paquete) : null;
    const kMejor = acuerdo ? A.mejorSinPerjudicar(esc, uJ, uC, kAcuerdo) : null;
    const nash = an.kNash >= 0 ? an.kNash : null;
    const yDeP = (paq) => U.media(p.contrapartes.map((c) => M.consultas.ucDe(p, c.i, paq)));
    return {
      puntos: puntos.map((pt) => ({ k: pt.k, x: pt.x, y: pt.y })),
      frontera,
      reservaC: U.media(reservas),
      batnaJ: p.jugador.batnaValor,
      hayZopa: an.hayZopa,
      acuerdo: acuerdo ? { k: kAcuerdo, x: uJ[kAcuerdo], y: yDe(kAcuerdo), paquete: res.paquete.slice(), texto: A.describir(esc, res.paquete) } : null,
      mejor: kMejor !== null ? { k: kMejor, x: uJ[kMejor], y: yDe(kMejor), paquete: esc.paquetes[kMejor].slice(), texto: A.describir(esc, esc.paquetes[kMejor]) } : null,
      nash: nash !== null ? { k: nash, x: uJ[nash], y: yDe(nash), paquete: esc.paquetes[nash].slice(), texto: A.describir(esc, esc.paquetes[nash]) } : null,
      dejado: kMejor !== null ? R(uJ[kMejor] - uJ[kAcuerdo]) : null,
      cambios: kMejor !== null && kMejor !== kAcuerdo ? A.diferencias(esc, res.paquete, esc.paquetes[kMejor]) : [],
      danza: {
        jugador: p.ofertasJugador.map((o) => ({ x: o.uj, y: yDeP(o.paquete), turno: o.turno })),
        contraparte: [].concat.apply([], p.contrapartes.map((c) => c.ofertas.map((o) => ({ x: o.uj, y: yDeP(o.paquete), turno: o.turno, quien: c.id }))))
          .sort((a, b) => a.turno - b.turno)
      },
      ocultos: p.contrapartes.map((c, i) => {
        const d = esc.contrapartes[i];
        const pers = NG.Personalidades[d.personalidad];
        return {
          id: c.id, nombre: d.nombre, cargo: d.cargo, personalidad: pers.nombre, descPersonalidad: pers.descripcion,
          pesos: esc.variables.map((v, vi) => ({ variable: v.nombre, peso: R(esc.perfilesC[i].pesos[vi] * 100), tuyo: R(esc.perfilJ.pesos[vi] * 100) })),
          reserva: R(c.R), aspiracion: R(c.A0), batna: d.batna, confianza: R(c.C), paciencia: Math.max(0, c.P), pacienciaMax: c.P0,
          intereses: (d.intereses || []).map((it) => ({ texto: it.texto, descubierto: p.revelado.intereses.includes(it.id) })),
          susceptibilidad: d.susceptibilidad || {}
        };
      })
    };
  }

  /* ---------- Conceptos aplicados: frases ligadas a lo que ocurrió ---------- */
  function conceptosAplicados(p, punt) {
    const esc = NG.Escenarios.obtener(p.escenarioId);
    const res = p.resultado || { tipo: 'abandono', uj: p.jugador.batnaValor };
    const b = esc.jugador.batnas.find((x) => x.id === p.jugador.batnaId);
    const out = [];
    const nom = esc.contrapartes.map((c) => c.nombre.split(' ')[0]).join(' y ');
    const tocados = new Set(esc.conceptos || []);
    p.registro.forEach((r) => (r.conceptos || []).forEach((c) => tocados.add(c)));

    const bv = p.jugador.batnaValor;
    const txtB = 'Tu BATNA era «' + (b ? b.corto || b.texto : '') + '» (' + bv + ' pts). ' + (res.tipo === 'acuerdo'
      ? (res.uj >= bv ? 'Cerraste en ' + R(res.uj) + ' pts: ' + R(res.uj - bv) + ' puntos por encima de tu alternativa.' : 'Cerraste en ' + R(res.uj) + ' pts: por debajo de tu alternativa. Habrías estado mejor sin acuerdo.')
      : 'Sin acuerdo, te quedas con ella: ' + bv + ' pts.');
    out.push({ id: 'batna', texto: txtB });
    if (tocados.has('zopa') || true) {
      out.push({ id: 'zopa', texto: punt.zopa.hay
        ? 'La zona de posible acuerdo iba, para ti, de ' + punt.zopa.desde + ' a ' + punt.zopa.hasta + ' pts. Capturaste un ' + punt.dimensiones.valor + ' % del valor alcanzable.'
        : 'Con tu BATNA real no existía zona de acuerdo: ningún acuerdo aceptable para ' + nom + ' superaba tu alternativa.' });
    }
    if (p.ofertasJugador.length) {
      const c0 = p.contrapartes[0];
      out.push({ id: 'anclaje', texto: p.anclaContraparte
        ? nom + ' abrió primero. Tu primera respuesta valía ' + R(p.ofertasJugador[0].uj) + ' pts para ti (objetivo: ' + p.jugador.objetivo + ').'
        : 'Abriste tú, con una oferta de ' + R(p.ofertasJugador[0].uj) + ' pts para ti. ' + (c0.ancla >= 4 ? 'Era creíble y rebajó sus expectativas iniciales.' : c0.anclaAplicada && p.stats.ofensas ? 'Era tan extrema que se percibió como un insulto.' : 'Apenas movió sus expectativas: podrías haber anclado más alto.') });
    }
    const intereses = p.pizarra.filter((n) => n.tipo === 'interes').length;
    const totalInt = esc.contrapartes.reduce((s, c) => s + (c.intereses || []).length, 0);
    out.push({ id: 'intereses-posiciones', texto: 'Descubriste ' + intereses + ' de ' + totalInt + ' intereses ocultos detrás de las posiciones de ' + nom + ' (' + p.stats.preguntasIntereses + ' preguntas abiertas respondidas).' });
    if (p.stats.concesiones || p.ofertasJugador.length > 1)
      out.push({ id: 'concesiones-reciprocas', texto: 'Hiciste ' + plural(p.stats.concesiones, 'concesión explícita', 'concesiones explícitas') + ' (' + p.stats.concesionesCondicionadas + ' condicionada' + (p.stats.concesionesCondicionadas === 1 ? '' : 's') + '). ' +
        (p.stats.maxRachaSinReciprocidad >= 3 ? 'Llegaste a encadenar ' + p.stats.maxRachaSinReciprocidad + ' concesiones sin que te devolvieran nada.' : 'Nunca encadenaste tres concesiones sin reciprocidad.') });
    out.push({ id: 'crear-valor', texto: res.tipo === 'acuerdo'
      ? 'El acuerdo alcanzó un ' + punt.dimensiones.conjunto + ' % del valor conjunto posible. ' + (punt.dimensiones.conjunto >= 85 ? 'Agrandasteis el pastel antes de repartirlo.' : 'Quedó valor sin crear: algún intercambio os habría beneficiado a ambos.')
      : 'Sin acuerdo no se crea valor conjunto: solo tiene sentido si tu alternativa es mejor.' });
    if (tocados.has('criterios-objetivos') || p.stats.criteriosUsados)
      out.push({ id: 'criterios-objetivos', texto: p.stats.criteriosUsados ? 'Apoyaste ' + plural(p.stats.criteriosUsados, 'oferta', 'ofertas') + ' en criterios objetivos.' : 'No usaste criterios objetivos: una referencia externa (índice, mercado, precedente) legitima tus cifras.' });
    if (p.stats.mesos) {
      const r = p.stats.mesosReveladores;
      out.push({ id: 'meso', texto: 'Presentaste ' + plural(p.stats.mesos, 'ronda de ofertas múltiples', 'rondas de ofertas múltiples') + '; ' + (r ? r + (r === 1 ? ' reveló' : ' revelaron') + ' prioridades de la otra parte.' : 'ninguna reveló prioridades nuevas.') });
    }
    if (esc.multiparte) out.push({ id: 'coaliciones', texto: p.bloquesRotos ? 'Rompiste ' + plural(p.bloquesRotos, 'bloque', 'bloques') + ' en la mesa.' : (p.registro.some((r) => /bloque/.test(r.explicacion || '')) ? 'Las otras partes llegaron a negociar en bloque contra ti.' : 'Ninguna coalición se formó en tu contra.') });
    if (tocados.has('ir-al-balcon')) out.push({ id: 'ir-al-balcon', texto: p.stats.pausasUtiles ? 'Tus pausas rebajaron la tensión ' + plural(p.stats.pausasUtiles, 'vez', 'veces') + '.' : 'No necesitaste o no usaste pausas para rebajar la tensión.' });
    (esc.conceptosExtra || []).forEach((f) => { const t = f(p, punt); if (t) out.push(t); });
    return out;
  }

  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  NG.Puntuacion = { PESOS, calcular, mesa, conceptosAplicados, estrellasDe };
})(typeof window !== 'undefined' ? window : globalThis);
