/* =====================================================================
 * NEGOCIA · núcleo/motor.js
 * Fase 2: negociación por turnos contra una o varias contrapartes con
 * variables ocultas (pesos, reserva, BATNA, paciencia, confianza,
 * tensión, personalidad y susceptibilidad a sesgos).
 *
 * Contrato con la interfaz:
 *   - El estado de la partida es un objeto plano y serializable.
 *   - ejecutar() / resolverEvento() lo mutan y devuelven una COLA DE
 *     SALIDAS ({tipo:'dialogo'|'delta'|'reaccion'|'oferta'|'pizarra'|
 *     'evento'|'coalicion'|'aviso'|'juicio'|'fin', …}) que la UI anima en
 *     orden. La UI nunca decide nada: solo representa.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const U = NG.Util;
  const A = NG.Analisis;

  /* ===================== Acceso y utilidades ===================== */
  const escDe = (p) => {
    const e = NG.Escenarios.obtener(p.escenarioId);
    if (!e) throw new Error('Escenario no registrado: ' + p.escenarioId);
    return e;
  };
  const pers = (p, ci) => NG.Personalidades[escDe(p).contrapartes[ci].personalidad];
  const defC = (p, ci) => escDe(p).contrapartes[ci];
  const perfilJ = (p) => p.modJ || escDe(p).perfilJ;
  const ujDe = (p, paq) => A.utilidadPerfil(perfilJ(p), paq) + p.bonus.jugador;
  const ucDe = (p, ci, paq) => A.utilidadPerfil(escDe(p).perfilesC[ci], paq) + p.bonus.c[ci];
  const activos = (p) => p.contrapartes.filter((c) => !c.retirado).map((c) => c.i);
  const nombreCorto = (p, ci) => defC(p, ci).nombre.split(' ')[0];

  /* Fuerza de la BATNA del jugador en [0,1] (escala propia del escenario). */
  function fuerzaBatna(p) {
    const [lo, hi] = escDe(p).jugador.escalaBatna || [25, 60];
    return U.clamp((p.jugador.batnaValor - lo) / (hi - lo), 0, 1);
  }

  /* Similitud entre paquetes en [0,1] (1 = idénticos). */
  function similitud(esc, a, b) {
    if (!b) return 0.5;
    let s = 0;
    for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]) / (esc.radices[i] - 1);
    return 1 - s / a.length;
  }

  /* ============ Aspiración de la contraparte (curva de concesión) ============
   * τ = 1 − P/P0     A = A0' − (A0' − R)·τ^e + H − K + 6·(50 − C)/50
   * A0' incluye el efecto ancla; H = endurecimiento; K = reciprocidad/poder;
   * con poca confianza pide más y con mucha, menos. Nunca baja de su reserva. */
  function aspiracion(p, ci) {
    const c = p.contrapartes[ci];
    const pr = pers(p, ci);
    const e = pr.e + (c.eExtra || 0);
    const tau = U.clamp(1 - Math.max(0, c.P) / c.P0, 0, 1);
    const A0p = c.A0 - c.ancla;
    const R = reservaEfectiva(p, ci);
    // Confianza: con mucha, se conforma con algo menos; con poca, exige una prima de riesgo
    const ajusteC = c.C >= 50 ? -6 * (c.C - 50) / 50 : 12 * (50 - c.C) / 50;
    const v = A0p - (A0p - R) * Math.pow(tau, e) + c.H - c.K + ajusteC;
    return U.clamp(v, R, 100);
  }
  /* Reserva efectiva: sube si conoce tu límite o si no se fía de ti (prima de riesgo). */
  const reservaEfectiva = (p, ci) => {
    const c = p.contrapartes[ci];
    return Math.max(c.R + Math.max(0, 25 - c.C) * 0.4, c.Rjugador || 0);
  };

  /* ===================== Creación de partida ===================== */
  function crearPartida(esc, prep, opciones) {
    opciones = opciones || {};
    const semilla = typeof opciones.semilla === 'number' ? opciones.semilla : U.semillaAleatoria();
    const batnas = esc.jugador.batnas;
    const elegida = batnas.find((b) => b.id === prep.batnaId) || batnas.find((b) => b.conocida) || batnas[0];
    const visibles = NG.Preparacion.batnasVisibles(prep, esc);
    const mostrada = (visibles.find((b) => b.id === elegida.id) || { valorMostrado: elegida.valor }).valorMostrado;
    const dRef = typeof esc.jugador.batnaReferencia === 'number'
      ? esc.jugador.batnaReferencia
      : Math.max.apply(null, batnas.filter((b) => b.conocida && typeof b.valorAparente !== 'number').map((b) => b.valor));
    const nVars = esc.variables.length;

    const p = {
      version: 1, escenarioId: esc.id, semilla, rng: U.crearRng(semilla),
      rngTexto: U.crearRng((semilla ^ 0x9E3779B9) >>> 0), // aleatorio cosmético: no altera el juego
      turno: 0, fase: 'negociacion', iniciada: false,
      prep: U.copiar(prep),
      tecnicas: Object.assign({ meso: false, ofertaFinal: false, bilateral: !!esc.multiparte }, opciones.tecnicas || {}),
      jugador: {
        batnaId: elegida.id, batnaValor: elegida.valor, batnaMostrada: mostrada,
        batnaVerificada: typeof elegida.valorAparente !== 'number' || prep.revelado.verificadas.includes(elegida.id),
        reserva: typeof prep.reserva === 'number' ? prep.reserva : mostrada,
        objetivo: typeof prep.objetivo === 'number' ? prep.objetivo : Math.min(95, mostrada + 25),
        apertura: prep.apertura ? prep.apertura.slice() : null,
        credibilidad: 1, pausasUsadas: 0, ofertaFinalPendiente: false,
        reveloReserva: false, reveloPlazo: false, presionesUsadas: 0,
        mentirasDescubiertas: 0
      },
      dRef,
      contrapartes: esc.contrapartes.map((c, i) => ({
        id: c.id, i,
        A0: c.aspiracion, R: c.reserva, Rjugador: 0, P0: c.paciencia, P: c.paciencia,
        C: c.confianza, E: c.tension || 10, H: 0, K: 0, ancla: 0, eExtra: 0, conocimiento: 0,
        dirConocida: new Array(nVars).fill(false), // ¿sabe en qué sentido prefieres cada variable?
        anclaAplicada: false, ultimatum: false, avisoUltimatum: false,
        ofertas: [], exigencia: null, reaccion: 'neutral',
        estimJ: new Array(nVars).fill(1 / nVars),
        rechazosSeguidos: 0, aliado: false, haAceptado: false, retirado: false,
        Emax: c.tension || 10, Cmin: c.confianza, Cmax: c.confianza, ultimoGesto: null
      })),
      ofertasJugador: [],
      ofertaEnMesa: null,
      anclaContraparte: null,
      pizarra: U.copiar(prep.notas),
      revelado: {
        intereses: prep.revelado.intereses.slice(),
        criterios: prep.revelado.criterios.slice(),
        personalidad: prep.revelado.personalidad.slice()
      },
      preguntasHechas: [], preguntasEvadidas: [], informacionCompartida: [], compromisos: [],
      eventosOcurridos: [], eventoPendiente: null, mentirasPendientes: [],
      registro: [], bloque: null, bloquesRotos: 0,
      bonus: { jugador: 0, c: esc.contrapartes.map(() => 0) },
      modJ: null,
      resultado: null,
      stats: {
        preguntasIntereses: 0, preguntasSugestivas: 0, concesiones: 0, concesionesCondicionadas: 0,
        racha: 0, maxRachaSinReciprocidad: 0, ofensas: 0, retrocesos: 0, criteriosUsados: 0,
        mesos: 0, mesosReveladores: 0, eventosAcierto: 0, eventosError: 0, compartidoPrioridades: 0,
        presionesEficaces: 0, farolesDescubiertos: 0, pausasUtiles: 0, intercambiosCondicionados: 0
      }
    };
    // Variación oculta por partida (con la semilla): rejugar no es memorizar
    if (opciones.variacion !== false) {
      const rv = U.crearRng((semilla * 2654435761) >>> 0);
      p.contrapartes.forEach((c) => {
        c.R += U.entero(rv, -4, 4);
        c.A0 += U.entero(rv, -5, 5);
        c.P0 = Math.max(6, c.P0 + U.entero(rv, -1, 1)); c.P = c.P0;
        c.C = U.clamp(c.C + U.entero(rv, -6, 6), 0, 100); c.Cmin = c.Cmax = c.C;
      });
    }
    return p;
  }

  /* ===================== Salidas y registro ===================== */
  function decir(S, quien, texto, extra) { if (texto) S.push(Object.assign({ tipo: 'dialogo', quien, texto }, extra || {})); }
  function reaccionar(p, S, ci, r) {
    p.contrapartes[ci].reaccion = r;
    S.push({ tipo: 'reaccion', quien: p.contrapartes[ci].id, reaccion: r });
  }
  function registrar(p, entrada) {
    p.registro.push(Object.assign({ turno: p.turno }, entrada));
  }
  function juicio(p, S, j, texto, extra) {
    registrar(p, Object.assign({ tipo: 'juicio', juicio: j, explicacion: texto }, extra || {}));
    S.push({ tipo: 'juicio', juicio: j });
  }
  function cambiarC(p, S, ci, d) {
    const c = p.contrapartes[ci];
    const antes = c.C;
    c.C = U.clamp(c.C + d, 0, 100);
    c.Cmin = Math.min(c.Cmin, c.C); c.Cmax = Math.max(c.Cmax, c.C);
    const real = Math.round(c.C - antes);
    if (real !== 0) S.push({ tipo: 'delta', quien: c.id, variable: 'confianza', valor: real });
  }
  function cambiarE(p, S, ci, d) {
    const c = p.contrapartes[ci];
    c.E = U.clamp(c.E + d, 0, 100);
    c.Emax = Math.max(c.Emax, c.E);
  }
  function cambiarP(p, S, ci, d) {
    const c = p.contrapartes[ci];
    c.P = Math.min(c.P0 + 2, c.P + d);
    if (d !== 0) S.push({ tipo: 'delta', quien: c.id, variable: 'paciencia', valor: d });
  }

  /* Líneas de diálogo: específicas del personaje/escenario o genéricas. */
  function linea(p, ci, clave, ctx) {
    const esc = escDe(p);
    const c = ci === null || ci === undefined ? null : defC(p, ci);
    const especificos = [];
    if (c && c.dialogos && c.dialogos[clave]) especificos.push(c.dialogos[clave]);
    if (esc.dialogos && esc.dialogos[clave]) especificos.push(esc.dialogos[clave]);
    const persId = c ? c.personalidad : 'comun';
    return NG.Dialogos.linea(p.rngTexto, clave, persId, especificos, Object.assign({ nombre: c ? c.nombre.split(' ')[0] : '' }, ctx || {}));
  }
  const gesto = (p, reaccion) => NG.Dialogos.gesto(p.rngTexto, reaccion);

  /* ===================== Revelaciones (pizarra) ===================== */
  function anotar(p, S, nota) {
    if (!nota || p.pizarra.some((n) => n.id === nota.id)) return false;
    nota.turno = p.turno;
    p.pizarra.push(nota);
    S.push({ tipo: 'pizarra', nota });
    return true;
  }
  function revelar(p, S, revela) {
    if (!revela) return false;
    const esc = escDe(p);
    let nuevo = false;
    const lista = (x) => (x === undefined ? [] : Array.isArray(x) ? x : [x]);
    lista(revela.interes).forEach((iid) => {
      if (!p.revelado.intereses.includes(iid)) { p.revelado.intereses.push(iid); nuevo = true; }
      for (const c of esc.contrapartes) {
        const it = (c.intereses || []).find((x) => x.id === iid);
        if (it) {
          const v = esc.variables.find((x) => x.id === it.variable);
          nuevo = anotar(p, S, {
            id: 'int-' + it.id, tipo: 'interes', quien: c.id, variable: it.variable,
            importancia: it.importancia, direccion: it.direccion || 'opuesta',
            titulo: it.titulo || (v ? v.nombre : 'Interés'), texto: it.texto
          }) || nuevo;
        }
      }
    });
    if (revela.pista) nuevo = anotar(p, S, { id: 'pista-' + p.turno + '-' + p.pizarra.length, tipo: 'pista', titulo: revela.titulo || 'Pista', texto: revela.pista, quien: revela.quien }) || nuevo;
    lista(revela.criterio).forEach((cid) => {
      if (!p.revelado.criterios.includes(cid)) {
        p.revelado.criterios.push(cid);
        const cr = (esc.criterios || []).find((x) => x.id === cid);
        if (cr) nuevo = anotar(p, S, { id: 'crit-' + cid, tipo: 'criterio', titulo: 'Criterio objetivo', texto: cr.texto }) || nuevo;
      }
    });
    return nuevo;
  }
  /* Intereses aún ocultos de una contraparte (para que "se abra"). */
  function interesesOcultos(p, ci) {
    return (defC(p, ci).intereses || []).filter((it) => !p.revelado.intereses.includes(it.id));
  }

  /* ===================== Contraoferta (estrategia trade-off) =====================
   * Entre los paquetes que le dan ≈ su aspiración, elige el que maximiza
   *   λ·Û_jugador + (1−λ)·similitud(con tu última oferta) + 0.15·similitud(con la suya)
   * Û_jugador usa lo que CREE de tus prioridades (mejora si las compartes). */
  /* Lo que la contraparte CREE que vale cada opción para ti. Salvo que se lo hayas
   * contado, supone que en todo quieres lo contrario que ella (sesgo del pastel fijo):
   * por eso las cuestiones compatibles solo se descubren compartiendo información. */
  function curvaEstimada(p, ci, i) {
    const c = p.contrapartes[ci];
    if (c.dirConocida && c.dirConocida[i]) return perfilJ(p).u[i];
    return escDe(p).perfilesC[ci].u[i].map((x) => 1 - x);
  }
  function estimUj(p, ci, paq) {
    const w = p.contrapartes[ci].estimJ;
    let s = 0;
    for (let i = 0; i < paq.length; i++) s += w[i] * curvaEstimada(p, ci, i)[paq[i]];
    return 100 * s;
  }
  function generarContraoferta(p, ci, referencia) {
    const esc = escDe(p);
    const c = p.contrapartes[ci];
    const pr = pers(p, ci);
    const objetivo = aspiracion(p, ci);
    // Solo busca paquetes buenos para ti si es cooperativa, confía en ti y conoce tus prioridades
    const lambda = U.clamp(pr.cooperacion * (0.3 + c.C / 100) * (0.25 + 0.75 * c.conocimiento), 0, 1);
    const previa = c.ofertas.length ? c.ofertas[c.ofertas.length - 1].paquete : null;
    const uCb = esc.utilCBase[ci], bonus = p.bonus.c[ci];
    let mejor = null, mejorScore = -Infinity;
    for (const ventana of [9, 18, 30]) {
      for (let k = 0; k < esc.paquetes.length; k++) {
        const u = uCb[k] + bonus;
        if (u < objetivo - 0.01 || u > objetivo + ventana) continue;
        const pk = esc.paquetes[k];
        if (c.Rjugador && ujDe(p, pk) > p.jugador.reserva + 6) continue; // si conoce tu reserva, no te da más
        if (!eficiente(p, ci, pk)) continue; // nadie racional propone algo que empeora a ambos
        // Pedir de más tiene un coste (ralentiza el acuerdo), pero no tanto como para ofrecer algo absurdo
        const score = lambda * estimUj(p, ci, pk) / 100 + (1 - lambda) * similitud(esc, pk, referencia)
          + 0.3 * similitud(esc, pk, previa) - 0.012 * (u - objetivo);
        if (score > mejorScore) { mejorScore = score; mejor = pk; }
      }
      if (mejor) break;
    }
    if (!mejor) { // objetivo inalcanzable: su mejor paquete posible
      let k = 0; for (let j = 1; j < uCb.length; j++) if (uCb[j] > uCb[k]) k = j;
      mejor = esc.paquetes[k];
    }
    return mejor.slice();
  }

  /* Un paquete es "ineficiente" para la contraparte si mover una sola variable te
   * mejora a ti (según lo que ella cree) sin empeorarle a ella: no lo propondría. */
  function eficiente(p, ci, pk) {
    const esc = escDe(p);
    const uC = esc.perfilesC[ci].u;
    for (let i = 0; i < pk.length; i++) {
      const uJ = curvaEstimada(p, ci, i);
      for (let d = -1; d <= 1; d += 2) {
        const k = pk[i] + d;
        if (k < 0 || k >= esc.radices[i]) continue;
        if (uC[i][k] >= uC[i][pk[i]] - 1e-9 && uJ[k] > uJ[pk[i]] + 1e-9) return false;
      }
    }
    return true;
  }

  /* La variable que más le duele de un paquete (para quejas y exigencias). */
  function variableQueMasDuele(p, ci, paq) {
    const perf = escDe(p).perfilesC[ci];
    let mejor = 0, peor = -1;
    for (let i = 0; i < paq.length; i++) {
      const d = perf.pesos[i] * (1 - perf.u[i][paq[i]]);
      if (d > peor) { peor = d; mejor = i; }
    }
    return mejor;
  }

  /* Lo que exige una parte (multiparte): la variable en la que su propuesta
   * ideal más mejora el paquete para ella. Así nunca «exige» lo que ya tiene. */
  function exigenciaDe(p, ci, paq, ideal) {
    const perf = escDe(p).perfilesC[ci];
    let vi = -1, max = 1e-9;
    for (let i = 0; i < paq.length; i++) {
      const d = perf.pesos[i] * (perf.u[i][ideal[i]] - perf.u[i][paq[i]]);
      if (d > max) { max = d; vi = i; }
    }
    if (vi >= 0) return { vi, opcion: ideal[vi] };
    vi = variableQueMasDuele(p, ci, paq);
    const u = perf.u[vi];
    return { vi, opcion: u.indexOf(Math.max.apply(null, u)) };
  }

  /* ===================== Evaluación de una oferta ===================== */
  function evaluar(p, ci, paq, mods, ruido) {
    const c = p.contrapartes[ci];
    const pr = pers(p, ci);
    const uc = ucDe(p, ci, paq);
    const Aact = aspiracion(p, ci);
    const R = reservaEfectiva(p, ci);
    let umbral = Aact;
    if (mods.criterio) umbral -= 3 * pr.criterio;
    if (mods.final && p.jugador.credibilidad > 0.5) umbral -= 0.5 * (Aact - R);
    umbral = Math.max(R, umbral);
    return { uc, A: Aact, umbral, acepta: uc + ruido >= umbral, cerca: uc + 5 >= umbral };
  }

  /* ===================== Acciones disponibles ===================== */
  function accionesDisponibles(p) {
    const esc = escDe(p);
    const no = { oferta: false, concesion: false, meso: false, pregunta: false, compartir: false, presionar: false, pausa: false, aceptar: false, abandonar: false, bilateral: false };
    if (p.fase !== 'negociacion') return no;
    const enUltimatum = p.contrapartes.some((c) => !c.retirado && c.ultimatum);
    const pausas = p.jugador.pausasUsadas < 2;
    const hayPreguntas = preguntasDisponibles(p).length > 0;
    const hayInfo = informacionDisponible(p).length > 0;
    const d = {
      oferta: true,
      concesion: p.ofertasJugador.length > 0,
      meso: !!p.tecnicas.meso && !esc.multiparte,
      pregunta: hayPreguntas,
      compartir: hayInfo,
      presionar: true,
      pausa: pausas,
      aceptar: !!p.ofertaEnMesa && !esc.multiparte,
      abandonar: true,
      bilateral: !!esc.multiparte && pausas
    };
    if (enUltimatum) Object.keys(d).forEach((k) => { if (!['oferta', 'aceptar', 'abandonar', 'concesion'].includes(k)) d[k] = false; });
    return d;
  }
  function preguntasDisponibles(p) {
    return (escDe(p).preguntas || []).filter((q) => !p.preguntasHechas.includes(q.id) &&
      p.preguntasEvadidas.filter((x) => x === q.id).length < 2);
  }
  function informacionDisponible(p) {
    return (escDe(p).informacion || []).filter((x) => !p.informacionCompartida.includes(x.id) &&
      (!x.requiereBatna || x.requiereBatna === p.jugador.batnaId));
  }

  /* ===================== Inicio de la negociación ===================== */
  function iniciar(p) {
    const S = [];
    if (p.iniciada) return S;
    p.iniciada = true;
    const esc = escDe(p);
    if (esc.multiparte && esc.dialogos && esc.dialogos.apertura_mediadora)
      decir(S, 'mediadora', linea(p, null, 'apertura_mediadora'));
    activos(p).forEach((ci) => {
      decir(S, p.contrapartes[ci].id, linea(p, ci, 'saludo'), { gesto: gesto(p, 'saludo') });
    });
    if (esc.quienAbre === 'contraparte' && !esc.multiparte) {
      const paq = generarContraoferta(p, 0, esc.statusQuo);
      registrarOfertaContraparte(p, S, 0, paq);
      p.anclaContraparte = paq.slice();
      decir(S, p.contrapartes[0].id, linea(p, 0, 'apertura_contraparte', { paquete: A.describir(esc, paq) }));
      registrar(p, { tipo: 'nota', actor: p.contrapartes[0].id, texto: 'Abre con: ' + A.describir(esc, paq) });
    } else if (esc.multiparte) {
      activos(p).forEach((ci) => {
        const ex = exigenciaDe(p, ci, esc.statusQuo, generarContraoferta(p, ci, esc.statusQuo));
        p.contrapartes[ci].exigencia = { variable: esc.variables[ex.vi].id, opcion: ex.opcion };
      });
    } else {
      decir(S, p.contrapartes[0].id, linea(p, 0, 'invita'));
    }
    return S;
  }

  function registrarOfertaContraparte(p, S, ci, paq) {
    const c = p.contrapartes[ci];
    const uj = ujDe(p, paq);
    c.ofertas.push({ turno: p.turno, paquete: paq.slice(), uc: ucDe(p, ci, paq), uj });
    p.ofertaEnMesa = { quien: ci, paquete: paq.slice(), turno: p.turno, uj };
    S.push({ tipo: 'oferta', quien: c.id, paquete: paq.slice(), uj: Math.round(uj) });
  }

  /* ===================== Bucle principal ===================== */
  function ejecutar(p, accion) {
    const S = [];
    if (!p.iniciada) S.push.apply(S, iniciar(p));
    if (p.fase !== 'negociacion') throw new Error('No se puede actuar: la partida está en fase ' + p.fase);
    const disp = accionesDisponibles(p);
    if (!disp[accion.tipo]) throw new Error('Acción no disponible: ' + accion.tipo);

    // Romper una "oferta final" rechazada cuesta credibilidad
    if (p.jugador.ofertaFinalPendiente && accion.tipo !== 'abandonar' && accion.tipo !== 'aceptar') {
      p.jugador.ofertaFinalPendiente = false;
      p.jugador.credibilidad = 0.3;
      activos(p).forEach((ci) => { cambiarC(p, S, ci, -10); decir(S, p.contrapartes[ci].id, linea(p, ci, 'final_incumplida')); });
      juicio(p, S, 'error', 'Presentaste una «oferta final» y después seguiste negociando: tus próximas amenazas valdrán menos.', { conceptos: ['credibilidad'] });
    }

    p.turno++;
    const ctx = { costeP: {}, sinCosteP: false, accion };
    registrar(p, { tipo: 'accion', actor: 'jugador', accion: U.copiar(accion), texto: describirAccion(p, accion) });

    switch (accion.tipo) {
      case 'oferta': accionOferta(p, accion, S, ctx); break;
      case 'concesion': accionConcesion(p, accion, S, ctx); break;
      case 'meso': accionMeso(p, accion, S, ctx); break;
      case 'pregunta': accionPregunta(p, accion, S, ctx); break;
      case 'compartir': accionCompartir(p, accion, S, ctx); break;
      case 'presionar': accionPresionar(p, accion, S, ctx); break;
      case 'pausa': accionPausa(p, accion, S, ctx); break;
      case 'aceptar': accionAceptar(p, accion, S, ctx); break;
      case 'abandonar': accionAbandonar(p, accion, S, ctx); break;
      case 'bilateral': accionBilateral(p, accion, S, ctx); break;
      default: throw new Error('Acción desconocida: ' + accion.tipo);
    }
    if (p.fase === 'negociacion') finDeTurno(p, S, ctx);
    return S;
  }

  function describirAccion(p, a) {
    const esc = escDe(p);
    switch (a.tipo) {
      case 'oferta': return (a.final ? 'Oferta final: ' : 'Oferta: ') + A.describir(esc, A.normalizarPaquete(esc, a.paquete));
      case 'concesion': return 'Concesión en ' + esc.variables[a.variable].nombre + (typeof a.pedir === 'number' ? ' a cambio de ' + esc.variables[a.pedir].nombre : '');
      case 'meso': return 'Ofertas múltiples equivalentes (' + a.paquetes.length + ')';
      case 'pregunta': { const q = esc.preguntas.find((x) => x.id === a.id); return 'Pregunta: ' + (q ? q.texto : a.id); }
      case 'compartir': { const x = esc.informacion.find((y) => y.id === a.id); return 'Comparte: ' + (x ? x.texto : a.id); }
      case 'presionar': return 'Presiona con tu BATNA';
      case 'pausa': return 'Pide una pausa';
      case 'aceptar': return 'Acepta su propuesta';
      case 'abandonar': return 'Abandona la negociación';
      case 'bilateral': return 'Reunión bilateral con ' + nombreCorto(p, p.contrapartes.findIndex((c) => c.id === a.con));
      default: return a.tipo;
    }
  }

  /* ---------- Hacer oferta ---------- */
  function accionOferta(p, accion, S, ctx) {
    const esc = escDe(p);
    const paq = A.normalizarPaquete(esc, accion.paquete);
    const criterio = accion.criterio && p.revelado.criterios.includes(accion.criterio)
      ? (esc.criterios || []).find((x) => x.id === accion.criterio) : null;
    const final = !!accion.final && !!p.tecnicas.ofertaFinal;
    const previa = p.ofertasJugador.length ? p.ofertasJugador[p.ofertasJugador.length - 1] : null;
    const uj = ujDe(p, paq);
    const ucs = p.contrapartes.map((c) => ucDe(p, c.i, paq));
    p.ofertasJugador.push({ turno: p.turno, paquete: paq.slice(), uj, uc: ucs.slice(), tipo: accion.etiqueta || 'oferta', criterio: criterio ? criterio.id : null, final, condicionada: !!accion.condicionada });
    S.push({ tipo: 'oferta', quien: 'jugador', paquete: paq.slice(), uj: Math.round(uj) });

    // Variables movidas respecto a la oferta anterior (pastel fijo vs. paquetes)
    if (criterio) p.stats.criteriosUsados++;

    const ruido = U.entre(p.rng, -1.5, 1.5);
    const evals = [];
    activos(p).forEach((ci) => {
      const c = p.contrapartes[ci];
      const pr = pers(p, ci);
      const uc = ucs[ci];
      let ofendido = false;
      // 1) Primera oferta recibida: efecto ancla… o insulto
      if (!c.anclaAplicada) {
        c.anclaAplicada = true;
        if (uc >= c.R - 20) {
          const s = (defC(p, ci).susceptibilidad || {}).anclaje || 0.3;
          c.ancla = s * Math.min(25, Math.max(0, c.A0 - uc));
          if (c.ancla >= 4) juicio(p, S, 'acierto', 'Tu apertura fue ambiciosa pero creíble: rebajó las expectativas de ' + nombreCorto(p, ci) + ' (anclaje).', { conceptos: ['anclaje'], quien: c.id });
        }
      }
      // 2) Oferta ofensiva: muy por debajo de lo que considera razonable
      if (uc < c.R - 20) {
        ofendido = true;
        p.stats.ofensas++;
        cambiarC(p, S, ci, -8 * pr.ofensa);
        cambiarE(p, S, ci, 25 * pr.volatilidad);
        c.H += 4 * pr.ofensa;
        ctx.costeP[ci] = 2;
        juicio(p, S, 'error', 'Oferta fuera de rango para ' + nombreCorto(p, ci) + ': la percibió como un insulto, se endureció y perdió confianza.', { conceptos: ['anclaje', 'zopa'], sesgo: 'exceso', quien: c.id });
      }
      // 3) Retroceso: recuperar para ti lo que ya habías ofrecido (mala fe).
      //    Redistribuir valor entre partes sin ganar tú (multiparte) no lo es.
      if (previa && uc < previa.uc[ci] - 3 && uj > previa.uj + 0.5) {
        p.stats.retrocesos++;
        cambiarC(p, S, ci, -10 * pr.ofensa);
        cambiarE(p, S, ci, 12 * pr.volatilidad);
        c.H += 3;
        decir(S, c.id, linea(p, ci, 'retroceso'), { gesto: gesto(p, 'molesto') });
        juicio(p, S, 'error', 'Retrocediste respecto a tu oferta anterior: se percibe como mala fe y erosiona la confianza.', { conceptos: ['concesiones-reciprocas'], quien: c.id });
      }
      // 4) Concesión: reciprocidad (y riesgo de parecer débil)
      if (previa && uc > previa.uc[ci] + 0.5) {
        const delta = uc - previa.uc[ci];
        c.K += pr.reciprocidad * delta;
        const etiquetada = accion.etiqueta === 'concesion';
        cambiarC(p, S, ci, (etiquetada ? (accion.condicionada ? 2 : 3) : 1) * pr.ganaConfianza);
        if (!accion.condicionada && delta > 10 && p.turno <= 3) {
          c.A0 += pr.debilidad * delta;
          if (pr.debilidad >= 0.1) juicio(p, S, 'error', 'Concesión grande y muy temprana sin pedir nada a cambio: ' + nombreCorto(p, ci) + ' lo leyó como debilidad y subió sus expectativas.', { conceptos: ['concesiones-reciprocas'], quien: c.id });
        }
      }
      // 5) Criterio objetivo (Fisher & Ury)
      if (criterio) {
        cambiarC(p, S, ci, 3 * pr.criterio);
        if (!c._criterioJuzgado) { c._criterioJuzgado = true; juicio(p, S, 'acierto', 'Justificaste tu propuesta con un criterio objetivo (' + criterio.nombre + '): es más difícil rechazar datos que exigencias.', { conceptos: ['criterios-objetivos'], quien: c.id }); }
      }
      if (!ofendido && uc >= c.R - 5) cambiarC(p, S, ci, 1);
      const ev = evaluar(p, ci, paq, { criterio: !!criterio, final }, ruido);
      ev.ofendido = ofendido;
      evals.push({ ci, ev });
    });

    resolverRespuestas(p, S, ctx, paq, evals, { final, previa, accion });
  }

  /* Respuesta de la(s) contraparte(s) a una oferta del jugador. */
  function resolverRespuestas(p, S, ctx, paq, evals, info) {
    const esc = escDe(p);
    const todos = evals.length > 0 && evals.every((x) => x.ev.acepta);
    if (todos) {
      evals.forEach(({ ci }) => { p.contrapartes[ci].haAceptado = true; });
      if (info.final) decir(S, p.contrapartes[evals[0].ci].id, linea(p, evals[0].ci, 'final_aceptada'));
      cerrarAcuerdo(p, S, paq, 'jugador');
      return;
    }
    if (info.final) {
      p.jugador.ofertaFinalPendiente = true;
      S.push({ tipo: 'aviso', texto: 'Han rechazado tu oferta final. Si sigues negociando perderás credibilidad; abandonar es coherente con lo que dijiste.' });
    }

    if (!esc.multiparte) {
      const { ci, ev } = evals[0];
      const c = p.contrapartes[ci];
      const prev = c.ofertas.length ? c.ofertas[c.ofertas.length - 1] : null;
      const contra = generarContraoferta(p, ci, paq);
      const ucContra = ucDe(p, ci, contra);
      // Regla "AC-next": si tu oferta le vale tanto como lo que iba a proponer, acepta
      if (!ev.ofendido && ev.uc >= ucContra - 0.01 && ev.uc >= reservaEfectiva(p, ci)) {
        c.haAceptado = true;
        cerrarAcuerdo(p, S, paq, 'jugador');
        return;
      }
      let r;
      if (ev.ofendido) r = 'ofendido';
      else if (prev && ucContra > prev.uc + 1.5) r = 'se_endurece';
      else if (info.previa && ev.uc > info.previa.uc[ci] + 0.5 && prev && ujDe(p, contra) > prev.uj + 1) r = 'reciproca';
      else if (ev.cerca) r = 'pensativo';
      else r = 'contraoferta';
      reaccionar(p, S, ci, r);
      const vi = variableQueMasDuele(p, ci, paq);
      const ctxL = { variable: esc.variables[vi].nombre.toLowerCase(), paquete: A.describir(esc, contra) };
      decir(S, c.id, linea(p, ci, r, ctxL), { gesto: gesto(p, r) });
      // Pista realista: menciona lo que más le duele (más probable con confianza)
      const pr = pers(p, ci);
      if (!ev.ofendido && U.probabilidad(p.rng, 0.25 + 0.45 * (c.C / 100) * (0.5 + pr.apertura))) {
        decir(S, c.id, linea(p, ci, 'queja_variable', ctxL));
        anotar(p, S, { id: 'queja-' + esc.variables[vi].id + '-' + c.id, tipo: 'pista', quien: c.id, variable: esc.variables[vi].id, titulo: 'Le preocupa: ' + esc.variables[vi].nombre, texto: nombreCorto(p, ci) + ' insiste en ' + esc.variables[vi].nombre.toLowerCase() + '. Puede ser una prioridad… o una táctica.' });
      }
      if (c.ultimatum) {
        // Ya estaba en ultimátum y la oferta no basta: se marcha
        retirarse(p, S, ci, 'paciencia');
        return;
      }
      // Reciprocidad observada: ¿te ha devuelto algo?
      const devuelve = prev && ujDe(p, contra) > prev.uj + 1;
      if (info.previa && ev.uc > info.previa.uc[ci] + 0.5) {
        p.stats.racha = devuelve ? 0 : p.stats.racha + 1;
        p.stats.maxRachaSinReciprocidad = Math.max(p.stats.maxRachaSinReciprocidad, p.stats.racha);
      } else if (devuelve) p.stats.racha = 0;
      registrarOfertaContraparte(p, S, ci, contra);
      registrar(p, { tipo: 'respuesta', actor: c.id, reaccion: r, texto: 'Contraoferta: ' + A.describir(esc, contra) });
      return;
    }

    // ---------- Multiparte: cada parte se pronuncia ----------
    const aceptan = [], rechazan = [];
    evals.forEach(({ ci, ev }) => {
      const c = p.contrapartes[ci];
      c.haAceptado = ev.acepta;
      if (ev.acepta) { aceptan.push(ci); c.rechazosSeguidos = 0; }
      else { rechazan.push({ ci, ev }); c.rechazosSeguidos++; }
    });
    aceptan.forEach((ci) => {
      reaccionar(p, S, ci, 'acepta_parcial');
      decir(S, p.contrapartes[ci].id, linea(p, ci, p.contrapartes[ci].aliado ? 'apoyo_aliado' : 'acepta_parcial'), { gesto: gesto(p, 'acepta') });
      if (p.contrapartes[ci].aliado) rechazan.forEach(({ ci: cj }) => { p.contrapartes[cj].K += 2; });
    });
    rechazan.forEach(({ ci, ev }) => {
      const c = p.contrapartes[ci];
      const ideal = generarContraoferta(p, ci, paq);
      const ex = exigenciaDe(p, ci, paq, ideal);
      const vi = ex.vi;
      c.exigencia = { variable: esc.variables[vi].id, opcion: ex.opcion };
      c.ofertas.push({ turno: p.turno, paquete: ideal.slice(), uc: ucDe(p, ci, ideal), uj: ujDe(p, ideal) });
      const r = ev.ofendido ? 'ofendido' : ev.cerca ? 'pensativo' : 'contraoferta';
      reaccionar(p, S, ci, r);
      decir(S, c.id, linea(p, ci, 'exigencia', { variable: esc.variables[vi].nombre.toLowerCase(), opcion: esc.variables[vi].opciones[ex.opcion] }), { gesto: gesto(p, r) });
      S.push({ tipo: 'exigencia', quien: c.id, variable: esc.variables[vi].id, opcion: ex.opcion });
      if (c.ultimatum) retirarse(p, S, ci, 'paciencia');
    });
    if (p.fase !== 'negociacion') return;
    registrar(p, { tipo: 'respuesta', actor: 'mesa', texto: aceptan.length ? 'Aceptan: ' + aceptan.map((ci) => nombreCorto(p, ci)).join(', ') + ' · Rechazan: ' + rechazan.map((x) => nombreCorto(p, x.ci)).join(', ') : 'Todos rechazan' });

    // Coaliciones: bloque contra ti, o ruptura del bloque
    if (p.bloque && aceptan.length && rechazan.length) {
      const aislados = rechazan.map((x) => x.ci);
      p.bloque = null; p.bloquesRotos++;
      aislados.forEach((ci) => { p.contrapartes[ci].K += 4; ctx.costeP[ci] = 2; });
      S.push({ tipo: 'coalicion', estado: 'roto', miembros: [] });
      decir(S, 'mediadora', linea(p, null, 'bloque_roto'));
      juicio(p, S, 'acierto', 'Rompiste el bloque: una oferta que satisfacía a una parte dejó aislada a la otra (dinámica de coaliciones).', { conceptos: ['coaliciones'] });
    } else if (!p.bloque && !aceptan.length && rechazan.length >= 2 &&
      rechazan.every(({ ci, ev }) => p.contrapartes[ci].rechazosSeguidos >= 2 && ev.uc < ev.A - 5 && !p.contrapartes[ci].aliado)) {
      p.bloque = rechazan.map((x) => p.contrapartes[x.ci].id);
      rechazan.forEach(({ ci }) => { p.contrapartes[ci].H += 3; });
      S.push({ tipo: 'coalicion', estado: 'bloque', miembros: p.bloque.slice() });
      decir(S, p.contrapartes[rechazan[0].ci].id, linea(p, rechazan[0].ci, 'bloque'), { gesto: 'Cruza una mirada cómplice con la otra parte.' });
      juicio(p, S, 'error', 'Tus propuestas perjudicaban a todas las partes a la vez y las has unido contra ti: ahora negocian en bloque.', { conceptos: ['coaliciones'] });
    }
  }

  /* ---------- Concesión (con o sin contrapartida) ---------- */
  function pasoVariable(p, base, vi, sentido) {
    const esc = escDe(p);
    const n = esc.variables[vi].opciones.length, cur = base[vi];
    const u = perfilJ(p).u[vi];
    let mejor = null;
    [cur - 1, cur + 1].filter((x) => x >= 0 && x < n).forEach((x) => {
      if (sentido < 0 && u[x] < u[cur] - 1e-9 && (mejor === null || u[x] > u[mejor])) mejor = x;      // cede lo justo
      if (sentido > 0 && u[x] > u[cur] + 1e-9 && (mejor === null || u[x] > u[mejor])) mejor = x;
    });
    return mejor;
  }
  function paqueteConcesion(p, accion) {
    const esc = escDe(p);
    const base = p.ofertasJugador.length ? p.ofertasJugador[p.ofertasJugador.length - 1].paquete.slice()
      : (p.jugador.apertura || esc.statusQuo).slice();
    const paso = pasoVariable(p, base, accion.variable, -1);
    if (paso === null) return null;
    base[accion.variable] = paso;
    base.pidio = false;
    if (typeof accion.pedir === 'number' && accion.pedir !== accion.variable) {
      const ped = pasoVariable(p, base, accion.pedir, +1);
      if (ped !== null) { base[accion.pedir] = ped; base.pidio = true; }
    }
    return base;
  }
  function accionConcesion(p, accion, S, ctx) {
    const res = paqueteConcesion(p, accion);
    if (!res) throw new Error('No se puede ceder más en esa variable');
    const condicionada = res.pidio;
    const paq = res.slice();
    p.stats.concesiones++;
    if (condicionada) { p.stats.concesionesCondicionadas++; }
    // ¿Has cedido en algo que también le perjudica a ella? (cuestión compatible)
    const esc = escDe(p);
    const previa = p.ofertasJugador[p.ofertasJugador.length - 1];
    const ci0 = activos(p)[0];
    const pierdeEllos = ucDe(p, ci0, paq) < previa.uc[ci0] - 0.5 && !condicionada;
    accionOferta(p, { tipo: 'oferta', paquete: paq, etiqueta: 'concesion', condicionada }, S, ctx);
    if (pierdeEllos && p.fase === 'negociacion') {
      juicio(p, S, 'error', 'Cediste en ' + esc.variables[accion.variable].nombre.toLowerCase() + ', algo que también perjudica a la otra parte: es una cuestión compatible, no un intercambio (sesgo del pastel fijo).', { sesgo: 'pastelFijo', conceptos: ['intercambio-integrativo'] });
    } else if (condicionada && p.fase === 'negociacion') {
      p.stats.intercambiosCondicionados++;
    }
  }

  /* ---------- MESO: ofertas múltiples equivalentes simultáneas ---------- */
  function accionMeso(p, accion, S, ctx) {
    const esc = escDe(p);
    const paqs = (accion.paquetes || []).map((x) => A.normalizarPaquete(esc, x)).slice(0, 3);
    if (paqs.length < 2) throw new Error('MESO requiere al menos dos paquetes');
    p.stats.mesos++;
    const ujs = paqs.map((x) => ujDe(p, x));
    const equivalentes = Math.max.apply(null, ujs) - Math.min.apply(null, ujs) <= 6;
    const ci = activos(p)[0];
    const c = p.contrapartes[ci];
    const pr = pers(p, ci);
    const ruido = U.entre(p.rng, -1.5, 1.5);
    const evs = paqs.map((x) => evaluar(p, ci, x, {}, ruido));
    // Primera oferta → ancla con la mejor para ella
    if (!c.anclaAplicada) {
      c.anclaAplicada = true;
      const ucMax = Math.max.apply(null, evs.map((e) => e.uc));
      if (ucMax >= c.R - 20) c.ancla = ((defC(p, ci).susceptibilidad || {}).anclaje || 0.3) * Math.min(25, Math.max(0, c.A0 - ucMax));
    }
    cambiarC(p, S, ci, 3 * pr.ganaConfianza);
    let best = 0;
    evs.forEach((e, i) => { if (e.uc > evs[best].uc) best = i; });
    p.ofertasJugador.push({ turno: p.turno, paquete: paqs[best].slice(), uj: ujs[best], uc: p.contrapartes.map((cc) => ucDe(p, cc.i, paqs[best])), tipo: 'meso', alternativas: paqs.map((x) => x.slice()) });
    S.push({ tipo: 'oferta', quien: 'jugador', paquete: paqs[best].slice(), uj: Math.round(ujs[best]), alternativas: paqs.map((x) => x.slice()) });
    const aceptables = evs.map((e, i) => (e.acepta ? i : -1)).filter((i) => i >= 0);
    if (aceptables.length) {
      let k = aceptables[0];
      aceptables.forEach((i) => { if (evs[i].uc > evs[k].uc) k = i; });
      decir(S, c.id, linea(p, ci, 'meso_acepta', { opcion: String.fromCharCode(65 + k) }));
      juicio(p, S, 'acierto', 'Las ofertas múltiples equivalentes te permitieron cerrar con la opción que ' + nombreCorto(p, ci) + ' más valoraba sin coste para ti.', { conceptos: ['meso'] });
      cerrarAcuerdo(p, S, paqs[k], 'jugador');
      return;
    }
    // Revela preferencia: la variable con mayor diferencia ponderada entre la preferida y las demás
    const letra = String.fromCharCode(65 + best);
    reaccionar(p, S, ci, 'pensativo');
    decir(S, c.id, linea(p, ci, 'meso_preferencia', { opcion: letra }), { gesto: gesto(p, 'pensativo') });
    let vMax = -1, dMax = 0;
    const perf = esc.perfilesC[ci];
    paqs.forEach((x, i) => {
      if (i === best) return;
      for (let v = 0; v < x.length; v++) {
        const d = perf.pesos[v] * (perf.u[v][paqs[best][v]] - perf.u[v][x[v]]);
        if (d > dMax) { dMax = d; vMax = v; }
      }
    });
    if (vMax >= 0) {
      const nuevo = anotar(p, S, { id: 'meso-' + esc.variables[vMax].id + '-' + c.id, tipo: 'pista', quien: c.id, variable: esc.variables[vMax].id, titulo: 'MESO: prefiere la opción ' + letra, texto: 'Su elección sugiere que ' + esc.variables[vMax].nombre.toLowerCase() + ' pesa mucho para ' + nombreCorto(p, ci) + '.' });
      if (nuevo) p.stats.mesosReveladores++;
    }
    juicio(p, S, equivalentes ? 'acierto' : 'neutral', equivalentes
      ? 'Presentaste varias ofertas de igual valor para ti: su elección revela sus prioridades sin que tengas que ceder (MESO).'
      : 'Tus ofertas múltiples no eran equivalentes para ti: un MESO funciona mejor si todas te valen lo mismo.', { conceptos: ['meso'] });
    const contra = generarContraoferta(p, ci, paqs[best]);
    registrarOfertaContraparte(p, S, ci, contra);
    if (c.ultimatum) retirarse(p, S, ci, 'paciencia');
  }

  /* ---------- Preguntar ---------- */
  function accionPregunta(p, accion, S, ctx, bilateralCon) {
    const esc = escDe(p);
    const q = (esc.preguntas || []).find((x) => x.id === accion.id);
    if (!q) throw new Error('Pregunta desconocida ' + accion.id);
    const destino = typeof bilateralCon === 'number' ? bilateralCon
      : q.a ? p.contrapartes.findIndex((c) => c.id === q.a) : activos(p)[0];
    const c = p.contrapartes[destino];
    const pr = pers(p, destino);
    decir(S, 'jugador', q.texto);
    if (q.tipo === 'sugestiva') {
      p.preguntasHechas.push(q.id);
      p.stats.preguntasSugestivas++;
      cambiarC(p, S, destino, -3 * pr.ofensa);
      cambiarE(p, S, destino, 6 * pr.volatilidad);
      reaccionar(p, S, destino, 'molesto');
      decir(S, c.id, (q.respuestas && q.respuestas.evasiva) || linea(p, destino, 'pregunta_sugestiva'), { gesto: gesto(p, 'molesto') });
      juicio(p, S, 'error', 'Pregunta sugestiva: busca confirmar lo que ya crees (sesgo de confirmación) y pone a la otra parte a la defensiva. Las preguntas abiertas revelan más.', { sesgo: 'confirmacion', conceptos: ['intereses-posiciones'] });
      return;
    }
    const umbral = (typeof q.confianzaMin === 'number' ? q.confianzaMin : 40) + pr.confianzaPregunta - (typeof bilateralCon === 'number' ? 15 : 0);
    const esquiva = U.probabilidad(p.rng, pr.evasion);
    if (c.C >= umbral && !esquiva) {
      p.preguntasHechas.push(q.id);
      const nuevo = revelar(p, S, q.revela);
      if (q.tipo === 'abierta') p.stats.preguntasIntereses++;
      cambiarC(p, S, destino, (typeof q.confianza === 'number' ? q.confianza : q.tipo === 'abierta' ? 4 : 1) * pr.ganaConfianza);
      cambiarE(p, S, destino, -4);
      reaccionar(p, S, destino, 'se_abre');
      decir(S, c.id, (q.respuestas && q.respuestas.abierta) || linea(p, destino, 'respuesta_generica'), { gesto: gesto(p, 'se_abre') });
      if (nuevo && q.tipo === 'abierta') juicio(p, S, 'acierto', 'Pregunta abierta en el momento adecuado: descubriste un interés que estaba detrás de su posición.', { conceptos: ['intereses-posiciones'] });
      else if (q.tipo === 'cerrada') juicio(p, S, 'neutral', 'Las preguntas cerradas obtienen un sí o un no; las abiertas («¿qué…?», «¿cómo…?», «¿por qué…?») revelan intereses.', { conceptos: ['intereses-posiciones'] });
    } else {
      p.preguntasEvadidas.push(q.id);
      cambiarC(p, S, destino, 1);
      reaccionar(p, S, destino, 'evasiva');
      decir(S, c.id, (q.respuestas && q.respuestas.evasiva) || linea(p, destino, 'evasiva'), { gesto: gesto(p, 'evasiva') });
      juicio(p, S, 'neutral', 'Esquivó la pregunta: la confianza aún era insuficiente (' + Math.round(c.C) + '/100). Compartir información propia o un gesto recíproco abre la puerta.', { conceptos: ['confianza'] });
    }
  }

  /* ---------- Compartir información ---------- */
  function accionCompartir(p, accion, S, ctx) {
    const esc = escDe(p);
    const info = (esc.informacion || []).find((x) => x.id === accion.id);
    if (!info) throw new Error('Información desconocida ' + accion.id);
    p.informacionCompartida.push(info.id);
    decir(S, 'jugador', info.dicho || info.texto);
    const destinos = info.a ? [p.contrapartes.findIndex((c) => c.id === info.a)] : activos(p);
    const pJ = perfilJ(p);
    const ESTANDAR = ['prioridades', 'restriccion', 'batna', 'reserva', 'plazo'];
    if (!ESTANDAR.includes(info.tipo)) {
      // Tipos propios del escenario (p. ej. «disculpa»): efectos declarativos, una sola vez
      aplicarEfectos(p, S, info.efectos || {});
      destinos.forEach((ci) => reaccionar(p, S, ci, info.reaccion || 'receptivo'));
      if (info.respuesta) decir(S, p.contrapartes[destinos[0]].id, info.respuesta, { gesto: gesto(p, info.reaccion || 'receptivo') });
    }
    destinos.forEach((ci) => {
      if (!ESTANDAR.includes(info.tipo)) return;
      const c = p.contrapartes[ci];
      const pr = pers(p, ci);
      switch (info.tipo) {
        case 'prioridades': {
          // La contraparte aprende tus pesos reales en las variables indicadas
          const idx = (info.variables || esc.variables.map((v) => v.id)).map((id) => esc.variables.findIndex((v) => v.id === id));
          idx.forEach((i) => { c.estimJ[i] = pJ.pesos[i]; c.dirConocida[i] = true; });
          const s = U.suma(c.estimJ); c.estimJ = c.estimJ.map((w) => w / s);
          c.conocimiento = U.clamp(c.conocimiento + idx.length / esc.variables.length, 0, 1);
          cambiarC(p, S, ci, 6 * pr.ganaConfianza);
          reaccionar(p, S, ci, 'receptivo');
          decir(S, c.id, linea(p, ci, 'agradece_info'), { gesto: gesto(p, 'receptivo') });
          // Reciprocidad en la revelación: a veces corresponde contando algo suyo
          const ocultos = interesesOcultos(p, ci);
          if (ocultos.length && U.probabilidad(p.rng, 0.6 * pr.apertura + c.C / 250)) {
            const it = ocultos[0];
            decir(S, c.id, it.confesion || linea(p, ci, 'se_abre_reciproco', { texto: it.texto }));
            revelar(p, S, { interes: it.id });
            reaccionar(p, S, ci, 'se_abre');
          }
          break;
        }
        case 'restriccion':
          c.K += 2; cambiarC(p, S, ci, 2 * pr.ganaConfianza);
          decir(S, c.id, linea(p, ci, 'agradece_info'));
          break;
        case 'batna': {
          const f = fuerzaBatna(p);
          if (f >= 0.45) {
            c.K += 4 * f * pr.respetoPoder; cambiarC(p, S, ci, 1);
            reaccionar(p, S, ci, 'respeta_poder');
            decir(S, c.id, linea(p, ci, 'respeta_poder'), { gesto: gesto(p, 'pensativo') });
          } else {
            c.A0 += 4;
            reaccionar(p, S, ci, 'neutral');
            decir(S, c.id, linea(p, ci, 'batna_debil'), { gesto: gesto(p, 'confiado') });
          }
          break;
        }
        case 'reserva': {
          // Ahora sabe hasta dónde puedes llegar: no te dará más que eso
          p.jugador.reveloReserva = true;
          let best = 0;
          esc.paquetes.forEach((pk, k) => { if (ujDe(p, pk) >= p.jugador.reserva && esc.utilCBase[ci][k] + p.bonus.c[ci] > best) best = esc.utilCBase[ci][k] + p.bonus.c[ci]; });
          c.Rjugador = Math.max(c.R, best - 4);
          reaccionar(p, S, ci, 'confiado');
          decir(S, c.id, linea(p, ci, 'sabe_reserva'), { gesto: gesto(p, 'confiado') });
          break;
        }
        case 'plazo':
          p.jugador.reveloPlazo = true;
          c.eExtra += 0.8; c.H += 4;
          reaccionar(p, S, ci, 'confiado');
          decir(S, c.id, linea(p, ci, 'sabe_plazo'), { gesto: gesto(p, 'confiado') });
          break;
        default: break;
      }
    });
    if (info.tipo === 'prioridades') {
      p.stats.compartidoPrioridades++;
      juicio(p, S, 'acierto', 'Compartiste tus prioridades (no tus límites): permite a la otra parte proponer intercambios que os benefician a ambos.', { conceptos: ['intercambio-integrativo', 'crear-valor'] });
    } else if (info.tipo === 'reserva') {
      juicio(p, S, 'error', 'Revelaste tu punto de reserva: a partir de ahora la otra parte ajustará sus ofertas a tu límite y no te dará más.', { conceptos: ['punto-reserva', 'informacion-asimetrica'] });
    } else if (info.tipo === 'plazo') {
      juicio(p, S, 'error', 'Revelaste que tienes prisa: quien conoce tu fecha límite puede esperar a que cedas.', { conceptos: ['informacion-asimetrica'] });
    } else if (info.tipo === 'batna') {
      juicio(p, S, fuerzaBatna(p) >= 0.45 ? 'acierto' : 'error', fuerzaBatna(p) >= 0.45
        ? 'Mencionar una alternativa sólida, sin amenazar, refuerza tu posición sin dañar la relación.'
        : 'Mencionaste una alternativa débil: en lugar de reforzarte, mostró que necesitas este acuerdo.', { conceptos: ['batna'] });
    } else if (info.juicio) {
      juicio(p, S, info.juicio, info.explicacion || '', { conceptos: info.conceptos || [] });
    }
  }

  /* ---------- Presionar con la BATNA ---------- */
  function accionPresionar(p, accion, S, ctx) {
    const esc = escDe(p);
    const b = esc.jugador.batnas.find((x) => x.id === p.jugador.batnaId);
    decir(S, 'jugador', linea(p, null, 'jugador_presiona', { batna: b ? b.corto || b.texto : 'otra opción' }));
    const usos = p.jugador.presionesUsadas++;
    const f = fuerzaBatna(p);
    const ujMesa = p.ofertaEnMesa ? p.ofertaEnMesa.uj : 0;
    const cred = f * (p.jugador.batnaValor >= ujMesa - 8 ? 1 : 0.5) * p.jugador.credibilidad;
    activos(p).forEach((ci) => {
      const c = p.contrapartes[ci];
      const pr = pers(p, ci);
      if (p.bloque && p.bloque.includes(c.id)) {
        cambiarC(p, S, ci, -3);
        reaccionar(p, S, ci, 'desconfiado');
        decir(S, c.id, linea(p, ci, 'farol_bloque'), { gesto: gesto(p, 'desconfiado') });
        return;
      }
      const pLlamar = pr.sagacidad * (1 - cred) + 0.15 * usos;
      if (cred < 0.6 && U.probabilidad(p.rng, pLlamar)) {
        p.stats.farolesDescubiertos++;
        cambiarC(p, S, ci, -20 * Math.max(0.6, pr.ofensa));
        cambiarE(p, S, ci, 15 * pr.volatilidad);
        c.H += 5;
        p.jugador.credibilidad = Math.max(0, p.jugador.credibilidad - 0.5);
        reaccionar(p, S, ci, 'llama_farol');
        decir(S, c.id, linea(p, ci, 'llama_farol'), { gesto: gesto(p, 'llama_farol') });
        juicio(p, S, 'error', (p.jugador.batnaVerificada ? 'Tu alternativa no era lo bastante fuerte para amenazar con ella' : 'Presionaste con una alternativa que no habías verificado') + ': ' + nombreCorto(p, ci) + ' detectó el farol.', { sesgo: 'exceso', conceptos: ['batna'], quien: c.id });
      } else {
        c.K += 7 * cred * pr.respetoPoder / (1 + usos);
        cambiarC(p, S, ci, -(8 - 4 * pr.respetoPoder));
        cambiarE(p, S, ci, 12 * pr.volatilidad);
        ctx.costeP[ci] = 2;
        const r = cred >= 0.5 ? 'respeta_poder' : 'pensativo';
        reaccionar(p, S, ci, r);
        decir(S, c.id, linea(p, ci, r), { gesto: gesto(p, r) });
        if (cred >= 0.6) p.stats.presionesEficaces++;
        if (usos >= 2) juicio(p, S, 'error', 'Presionar una y otra vez desgasta la relación y cada amenaza vale menos que la anterior.', { conceptos: ['batna'], quien: c.id });
        else if (cred >= 0.6) juicio(p, S, 'acierto', 'Tu BATNA era sólida y creíble: usarla con mesura hizo que ' + nombreCorto(p, ci) + ' rebajara sus expectativas.', { conceptos: ['batna'], quien: c.id });
        else juicio(p, S, 'neutral', 'Presión con una alternativa poco convincente: apenas movió a la otra parte y la tensionó.', { conceptos: ['batna'], quien: c.id });
      }
    });
    if (!esc.multiparte && p.fase === 'negociacion') {
      const ci = activos(p)[0];
      if (ci !== undefined) {
        const ref = p.ofertasJugador.length ? p.ofertasJugador[p.ofertasJugador.length - 1].paquete : esc.statusQuo;
        registrarOfertaContraparte(p, S, ci, generarContraoferta(p, ci, ref));
      }
    }
  }

  /* ---------- Pausa ("ir al balcón") ---------- */
  function accionPausa(p, accion, S, ctx) {
    p.jugador.pausasUsadas++;
    ctx.sinCosteP = true;
    let util = false;
    activos(p).forEach((ci) => {
      const c = p.contrapartes[ci];
      const pr = pers(p, ci);
      if (c.E > 45) { util = true; cambiarC(p, S, ci, (pr.volatilidad > 1.2 ? 4 : 2)); }
      cambiarE(p, S, ci, -25);
      reaccionar(p, S, ci, 'relajado');
      decir(S, c.id, linea(p, ci, 'pausa'), { gesto: gesto(p, 'pausa') });
    });
    if (util) { p.stats.pausasUtiles++; juicio(p, S, 'acierto', 'Pausa oportuna: bajó la tensión antes de que escalara («ir al balcón», Ury).', { conceptos: ['ir-al-balcon'] }); }
    else juicio(p, S, 'neutral', 'Pausa sin tensión que rebajar: no cuesta paciencia, pero tampoco aporta mucho.', { conceptos: ['ir-al-balcon'] });
  }

  /* ---------- Aceptar la propuesta de la otra parte ---------- */
  function accionAceptar(p, accion, S, ctx) {
    const m = p.ofertaEnMesa;
    if (!m) throw new Error('No hay propuesta que aceptar');
    const uj = ujDe(p, m.paquete);
    decir(S, 'jugador', linea(p, null, 'jugador_acepta'));
    if (uj < p.jugador.batnaValor - 0.5) juicio(p, S, 'error', 'Aceptaste un acuerdo (' + Math.round(uj) + ' pts) peor que tu BATNA (' + p.jugador.batnaValor + ' pts): habrías estado mejor sin acuerdo.', { conceptos: ['batna'], sesgo: 'escalada' });
    else if (uj < p.jugador.reserva - 0.5) juicio(p, S, 'error', 'Aceptaste por debajo del punto de reserva que tú mismo fijaste (' + p.jugador.reserva + ' pts).', { conceptos: ['punto-reserva'], sesgo: 'escalada' });
    else if (uj >= p.jugador.objetivo - 0.5) juicio(p, S, 'acierto', 'Cerraste alcanzando tu objetivo.', { conceptos: ['punto-reserva'] });
    cerrarAcuerdo(p, S, m.paquete, 'contraparte');
  }

  /* ---------- Abandonar ---------- */
  function accionAbandonar(p, accion, S, ctx) {
    const esc = escDe(p);
    decir(S, 'jugador', linea(p, null, 'jugador_abandona'));
    const an = A.analizar(esc, { utilJ: utilJ(p), utilC: utilC(p), dJ: p.jugador.batnaValor, reservas: p.contrapartes.map((c) => c.R) });
    const ujMesa = p.ofertaEnMesa && !esc.multiparte ? p.ofertaEnMesa.uj : null;
    if (ujMesa !== null && ujMesa > p.jugador.batnaValor + 3)
      juicio(p, S, 'error', 'Abandonaste cuando sobre la mesa había una propuesta (' + Math.round(ujMesa) + ' pts) mejor que tu BATNA (' + p.jugador.batnaValor + ' pts).', { conceptos: ['batna', 'zopa'], sesgo: p.jugador.ofertaFinalPendiente ? null : 'aversionPerdida' });
    else if (!an.hayZopa || an.maxJFactible < p.jugador.batnaValor + 2)
      juicio(p, S, 'acierto', 'No existía un acuerdo mejor que tu alternativa: retirarse era la decisión correcta.', { conceptos: ['batna', 'zopa'] });
    else juicio(p, S, 'neutral', 'Había margen para un acuerdo mejor que tu BATNA; quizá faltó explorar intereses.', { conceptos: ['zopa'] });
    activos(p).forEach((ci) => { reaccionar(p, S, ci, 'sorprendido'); decir(S, p.contrapartes[ci].id, linea(p, ci, 'despedida_abandono'), { gesto: gesto(p, 'sorprendido') }); });
    terminar(p, S, 'abandono', null, 'Abandonaste la negociación');
  }

  /* ---------- Reunión bilateral (multiparte) ---------- */
  function accionBilateral(p, accion, S, ctx) {
    const esc = escDe(p);
    const ci = p.contrapartes.findIndex((c) => c.id === accion.con);
    if (ci < 0 || p.contrapartes[ci].retirado) throw new Error('Parte no válida para la bilateral');
    p.jugador.pausasUsadas++;
    ctx.sinCosteP = true;
    S.push({ tipo: 'aviso', texto: 'Reunión a puerta cerrada con ' + defC(p, ci).nombre + '.' });
    if (accion.sub === 'pregunta') {
      accionPregunta(p, { id: accion.id }, S, ctx, ci);
      return;
    }
    const comp = (esc.compromisos || []).find((x) => x.id === accion.id);
    if (!comp) throw new Error('Compromiso desconocido');
    if (p.compromisos.includes(comp.id)) throw new Error('Compromiso ya adquirido');
    p.compromisos.push(comp.id);
    const c = p.contrapartes[ci];
    decir(S, 'jugador', comp.dicho || comp.texto);
    p.bonus.c[ci] += comp.bonus || 6;
    p.bonus.jugador -= comp.coste || 3;
    c.aliado = true;
    cambiarC(p, S, ci, (comp.confianza || 10) * pers(p, ci).ganaConfianza);
    reaccionar(p, S, ci, 'receptivo');
    decir(S, c.id, comp.respuesta || linea(p, ci, 'alianza'), { gesto: gesto(p, 'receptivo') });
    S.push({ tipo: 'coalicion', estado: 'alianza', miembros: [c.id] });
    let descubierto = false;
    activos(p).forEach((cj) => {
      if (cj === ci) return;
      const otra = p.contrapartes[cj];
      if (U.probabilidad(p.rng, 0.1 + 0.35 * (1 - otra.C / 100))) {
        descubierto = true;
        cambiarC(p, S, cj, -15);
        cambiarE(p, S, cj, 15 * pers(p, cj).volatilidad);
        reaccionar(p, S, cj, 'desconfiado');
        decir(S, otra.id, linea(p, cj, 'descubre_pacto'), { gesto: gesto(p, 'desconfiado') });
      }
    });
    if (p.bloque && p.bloque.includes(c.id)) {
      p.bloque = null; p.bloquesRotos++;
      S.push({ tipo: 'coalicion', estado: 'roto', miembros: [] });
      juicio(p, S, 'acierto', 'Un compromiso lateral con ' + nombreCorto(p, ci) + ' disolvió el bloque que tenías enfrente.', { conceptos: ['coaliciones'] });
    }
    juicio(p, S, descubierto ? 'neutral' : 'acierto', descubierto
      ? 'Compromiso lateral útil, pero la otra parte lo descubrió y desconfía: las coaliciones también tienen coste.'
      : 'Compromiso lateral: algo barato para ti y valioso para ' + nombreCorto(p, ci) + ' te gana un aliado en la mesa.', { conceptos: ['coaliciones', 'intercambio-integrativo'] });
  }

  /* ===================== Fin de turno ===================== */
  function finDeTurno(p, S, ctx) {
    activos(p).forEach((ci) => {
      const c = p.contrapartes[ci];
      const pr = pers(p, ci);
      if (!ctx.sinCosteP) cambiarP(p, S, ci, -(ctx.costeP[ci] || 1));
      c.H = Math.max(0, c.H - 0.5); // el resentimiento se disipa despacio
      c.E = U.clamp(c.E * 0.85, 0, 100);
      // Se abre espontáneamente si confía mucho
      const ocultos = interesesOcultos(p, ci);
      if (c.C >= 70 && ocultos.length && U.probabilidad(p.rng, pr.apertura * 0.3)) {
        const it = ocultos[0];
        decir(S, c.id, it.confesion || linea(p, ci, 'se_abre_reciproco', { texto: it.texto }), { gesto: gesto(p, 'se_abre') });
        revelar(p, S, { interes: it.id });
      }
      // Tensión extrema: una contraparte volátil puede levantarse de la mesa
      if (c.E >= 90 && U.probabilidad(p.rng, Math.max(0, 0.5 * (pr.volatilidad - 0.6)))) {
        retirarse(p, S, ci, 'tension');
        return;
      }
      // Sin confianza, deja de merecer la pena seguir (más aún si hay tensión)
      if (c.C <= 10 && U.probabilidad(p.rng, c.E >= 40 ? 0.6 : 0.4)) {
        retirarse(p, S, ci, 'desconfianza');
        return;
      }
      // Paciencia agotada → ultimátum (una última acción)
      if (c.P <= 0 && !c.ultimatum) {
        c.ultimatum = true;
        reaccionar(p, S, ci, 'impaciente');
        decir(S, c.id, linea(p, ci, 'ultimatum'), { gesto: gesto(p, 'impaciente') });
        S.push({ tipo: 'aviso', texto: nombreCorto(p, ci) + ' ha perdido la paciencia: o cierras ahora o se marcha.' });
      } else if (c.P === 2 && !c.avisoUltimatum) {
        c.avisoUltimatum = true;
        decir(S, c.id, linea(p, ci, 'impaciente'), { gesto: gesto(p, 'mira_reloj') });
      }
    });
    if (p.fase !== 'negociacion') return;
    comprobarMentiras(p, S);
    if (p.fase !== 'negociacion') return;
    comprobarEventos(p, S);
  }

  function retirarse(p, S, ci, motivo) {
    const c = p.contrapartes[ci];
    c.retirado = true;
    reaccionar(p, S, ci, 'se_retira');
    const claves = { tension: 'retirada_tension', desconfianza: 'retirada_desconfianza' };
    const motivos = {
      tension: nombreCorto(p, ci) + ' se levantó de la mesa: la tensión era insoportable',
      desconfianza: nombreCorto(p, ci) + ' se marchó: ya no confiaba en ti',
      paciencia: nombreCorto(p, ci) + ' se marchó: se agotó su paciencia'
    };
    decir(S, c.id, linea(p, ci, claves[motivo] || 'se_retira'), { gesto: gesto(p, 'se_retira') });
    terminar(p, S, 'ruptura', null, motivos[motivo] || motivos.paciencia);
  }

  /* ===================== Cierre ===================== */
  function cerrarAcuerdo(p, S, paq, quien) {
    const esc = escDe(p);
    activos(p).forEach((ci) => {
      reaccionar(p, S, ci, 'acepta');
      decir(S, p.contrapartes[ci].id, linea(p, ci, quien === 'jugador' ? 'acepta' : 'cierre_acepta_jugador'), { gesto: gesto(p, 'acepta') });
    });
    terminar(p, S, 'acuerdo', paq, 'Acuerdo: ' + A.describir(esc, paq));
  }
  function terminar(p, S, tipo, paq, motivo) {
    p.fase = 'fin';
    p.eventoPendiente = null;
    const uj = paq ? ujDe(p, paq) : p.jugador.batnaValor;
    p.resultado = {
      tipo, paquete: paq ? paq.slice() : null, uj,
      uc: paq ? p.contrapartes.map((c) => ucDe(p, c.i, paq)) : null,
      turno: p.turno, motivo
    };
    registrar(p, { tipo: 'fin', actor: 'sistema', texto: motivo, resultado: tipo });
    S.push({ tipo: 'fin', resultado: U.copiar(p.resultado) });
  }

  /* ===================== Eventos ===================== */
  function vistaEvento(p, ev) {
    const sust = (t) => (typeof t === 'function' ? t(p) : t);
    return {
      id: ev.id, tipo: ev.tipo || 'aviso', quien: ev.quien || null, icono: ev.icono || 'telefono',
      titulo: sust(ev.titulo), texto: sust(ev.texto), temporizador: ev.temporizador || 0,
      opciones: ev.opciones.map((o) => ({ id: o.id, texto: sust(o.texto) })),
      porDefecto: ev.porDefecto || ev.opciones[ev.opciones.length - 1].id
    };
  }
  function comprobarEventos(p, S) {
    const esc = escDe(p);
    for (const ev of esc.eventos || []) {
      if (p.eventosOcurridos.includes(ev.id)) continue;
      const w = ev.cuando || {};
      if (w.turnoMin && p.turno < w.turnoMin) continue;
      if (w.turnoMax && p.turno > w.turnoMax) continue;
      if (w.condicion && !w.condicion(p, consultas)) continue;
      if (typeof w.prob === 'number' && !U.probabilidad(p.rng, w.prob)) continue;
      p.eventoPendiente = ev.id;
      p.fase = 'evento';
      S.push({ tipo: 'evento', evento: vistaEvento(p, ev) });
      return;
    }
  }
  function resolverEvento(p, opcionId) {
    const S = [];
    if (p.fase !== 'evento' || !p.eventoPendiente) throw new Error('No hay evento pendiente');
    const esc = escDe(p);
    const ev = esc.eventos.find((x) => x.id === p.eventoPendiente);
    const op = ev.opciones.find((o) => o.id === opcionId) || ev.opciones.find((o) => o.id === (ev.porDefecto || ev.opciones[ev.opciones.length - 1].id));
    p.eventosOcurridos.push(ev.id);
    p.eventoPendiente = null;
    p.fase = 'negociacion';
    registrar(p, { tipo: 'evento', actor: 'evento', evento: ev.id, opcion: op.id, texto: (typeof ev.titulo === 'function' ? ev.titulo(p) : ev.titulo) + ' → ' + (typeof op.texto === 'function' ? op.texto(p) : op.texto), estilo: op.estilo });
    if (op.juicio === 'acierto') p.stats.eventosAcierto++;
    if (op.juicio === 'error') p.stats.eventosError++;
    if (op.juicio) juicio(p, S, op.juicio, op.explicacion || '', { sesgo: op.sesgo || null, conceptos: op.conceptos || [], evento: ev.id });
    aplicarEfectos(p, S, op.efectos || {});
    if (op.respuesta) {
      const r = typeof op.respuesta === 'string' ? { quien: p.contrapartes[0].id, texto: op.respuesta } : op.respuesta;
      decir(S, r.quien, r.texto, r.gesto ? { gesto: r.gesto } : undefined);
    }
    if (p.fase === 'negociacion') {
      // Si el evento dejó a alguien sin paciencia, se aplica el ultimátum
      activos(p).forEach((ci) => {
        const c = p.contrapartes[ci];
        if (c.P <= 0 && !c.ultimatum) { c.ultimatum = true; decir(S, c.id, linea(p, ci, 'ultimatum')); }
      });
    }
    return S;
  }

  /* Efectos declarativos usados por eventos y datos de escenario. */
  function aplicarEfectos(p, S, ef) {
    const esc = escDe(p);
    const porParte = (x, fn) => {
      if (x === undefined) return;
      if (typeof x === 'number') activos(p).forEach((ci) => fn(ci, x));
      else Object.keys(x).forEach((id) => { const ci = p.contrapartes.findIndex((c) => c.id === id); if (ci >= 0) fn(ci, x[id]); });
    };
    porParte(ef.confianza, (ci, d) => cambiarC(p, S, ci, d));
    porParte(ef.tension, (ci, d) => cambiarE(p, S, ci, d));
    porParte(ef.paciencia, (ci, d) => cambiarP(p, S, ci, d));
    porParte(ef.aspiracion, (ci, d) => { p.contrapartes[ci].H += d; });
    porParte(ef.reserva, (ci, d) => { p.contrapartes[ci].R = U.clamp(p.contrapartes[ci].R + d, 0, 100); });
    porParte(ef.reciprocidad, (ci, d) => { p.contrapartes[ci].K += d; });
    if (typeof ef.batnaJugador === 'number') {
      p.jugador.batnaValor = U.clamp(p.jugador.batnaValor + ef.batnaJugador, 0, 100);
      S.push({ tipo: 'aviso', texto: 'Tu alternativa ' + (ef.batnaJugador > 0 ? 'mejora' : 'empeora') + ': ahora vale ' + p.jugador.batnaValor + ' pts.' });
    }
    if (typeof ef.reservaJugador === 'number') p.jugador.reserva = U.clamp(p.jugador.reserva + ef.reservaJugador, 0, 100);
    if (typeof ef.credibilidad === 'number') p.jugador.credibilidad = U.clamp(p.jugador.credibilidad + ef.credibilidad, 0, 1);
    if (ef.revelar) revelar(p, S, ef.revelar);
    if (ef.perfilJugador) {
      const base = perfilJ(p);
      const nuevo = { pesos: base.pesos.slice(), u: base.u.map((x) => x.slice()) };
      Object.keys(ef.perfilJugador.curvas || {}).forEach((id) => {
        const i = esc.variables.findIndex((v) => v.id === id);
        nuevo.u[i] = A.curvaUtilidad(ef.perfilJugador.curvas[id], esc.variables[i].opciones.length);
      });
      Object.keys(ef.perfilJugador.pesos || {}).forEach((id) => {
        const i = esc.variables.findIndex((v) => v.id === id);
        nuevo.pesos[i] = ef.perfilJugador.pesos[id];
      });
      const s = U.suma(nuevo.pesos); nuevo.pesos = nuevo.pesos.map((w) => w / s);
      p.modJ = nuevo;
      if (p.ofertaEnMesa) p.ofertaEnMesa.uj = ujDe(p, p.ofertaEnMesa.paquete);
      S.push({ tipo: 'aviso', texto: ef.perfilJugador.aviso || 'Tu hoja de puntos ha cambiado.' });
      S.push({ tipo: 'hoja' });
    }
    if (ef.mentira) {
      // Se decide ahora (con la semilla) si se descubrirá y en qué turno
      const descubre = U.probabilidad(p.rng, typeof ef.mentira.prob === 'number' ? ef.mentira.prob : 0.4);
      const turno = p.turno + U.entero(p.rng, 1, ef.mentira.turnos || 3);
      p.mentirasPendientes.push({ turno: descubre ? turno : null, texto: ef.mentira.texto || '' });
    }
    if (ef.ofertaContraparte) {
      const ci = activos(p)[0];
      registrarOfertaContraparte(p, S, ci, A.normalizarPaquete(esc, ef.ofertaContraparte));
    }
    if (ef.nuevaOferta) {
      const ci = activos(p)[0];
      const ref = p.ofertasJugador.length ? p.ofertasJugador[p.ofertasJugador.length - 1].paquete : esc.statusQuo;
      registrarOfertaContraparte(p, S, ci, generarContraoferta(p, ci, ref));
    }
    if (ef.terminar) terminar(p, S, ef.terminar, null, ef.motivo || 'La negociación terminó');
  }

  function comprobarMentiras(p, S) {
    const quedan = [];
    p.mentirasPendientes.forEach((m) => {
      if (m.turno !== null && p.turno >= m.turno) {
        p.jugador.mentirasDescubiertas++;
        activos(p).forEach((ci) => {
          cambiarC(p, S, ci, -30);
          cambiarE(p, S, ci, 30 * pers(p, ci).volatilidad);
          reaccionar(p, S, ci, 'llama_farol');
          decir(S, p.contrapartes[ci].id, linea(p, ci, 'mentira_descubierta'), { gesto: gesto(p, 'llama_farol') });
        });
        juicio(p, S, 'error', 'Tu mentira salió a la luz' + (m.texto ? ' (' + m.texto + ')' : '') + ': la confianza se desplomó. La reputación tarda años en construirse y segundos en perderse.', { conceptos: ['confianza'], sesgo: 'exceso' });
      } else if (m.turno !== null) quedan.push(m);
    });
    p.mentirasPendientes = quedan;
  }

  /* ===================== Consultas para eventos, UI y agentes ===================== */
  const cacheJ = new WeakMap();
  function utilJ(p) {
    const esc = escDe(p);
    if (!p.modJ && !p.bonus.jugador) return esc.utilJBase;
    const clave = JSON.stringify(p.modJ) + '|' + p.bonus.jugador;
    const c = cacheJ.get(p);
    if (c && c.clave === clave) return c.arr;
    const arr = Float64Array.from(esc.paquetes, (pk) => ujDe(p, pk));
    cacheJ.set(p, { clave, arr });
    return arr;
  }
  function utilC(p) {
    const esc = escDe(p);
    return esc.utilCBase.map((arr, ci) => (p.bonus.c[ci] ? arr.map((x) => x + p.bonus.c[ci]) : arr));
  }
  const consultas = {
    ujDe, ucDe, aspiracion, activos, fuerzaBatna,
    confianza: (p, ci) => p.contrapartes[ci || 0].C,
    tension: (p, ci) => p.contrapartes[ci || 0].E,
    ofertas: (p) => p.ofertasJugador.length
  };

  /* Lo que el jugador puede saber (la UI y los agentes de simulación usan esto). */
  function observacion(p) {
    const esc = escDe(p);
    const pJ = perfilJ(p);
    return {
      turno: p.turno, fase: p.fase, escenarioId: p.escenarioId, multiparte: !!esc.multiparte,
      variables: esc.variables.map((v) => ({ id: v.id, nombre: v.nombre, opciones: v.opciones.slice() })),
      hoja: esc.variables.map((v, i) => v.opciones.map((_, k) => Math.round(100 * pJ.pesos[i] * pJ.u[i][k] * 10) / 10)),
      utilidad: (paq) => ujDe(p, A.normalizarPaquete(esc, paq)),
      pizarra: p.pizarra.slice(),
      intereses: p.pizarra.filter((n) => n.tipo === 'interes'),
      criterios: p.revelado.criterios.map((id) => (esc.criterios || []).find((c) => c.id === id)).filter(Boolean),
      contrapartes: p.contrapartes.map((c) => ({
        id: c.id, nombre: defC(p, c.i).nombre, confianza: Math.round(c.C), paciencia: Math.max(0, c.P), pacienciaMax: c.P0,
        exigencia: c.exigencia, aliado: c.aliado, retirado: c.retirado, haAceptado: c.haAceptado, ultimatum: c.ultimatum,
        reaccion: c.reaccion, visual: NG.EstadoVisual ? NG.EstadoVisual.derivar(estadoParaVisual(p, c.i)) : null
      })),
      ofertaEnMesa: p.ofertaEnMesa ? { quien: p.contrapartes[p.ofertaEnMesa.quien].id, paquete: p.ofertaEnMesa.paquete.slice(), uj: ujDe(p, p.ofertaEnMesa.paquete) } : null,
      misOfertas: p.ofertasJugador.map((o) => ({ paquete: o.paquete.slice(), uj: o.uj, tipo: o.tipo })),
      preguntas: preguntasDisponibles(p).map((q) => ({ id: q.id, texto: q.texto, tipo: q.tipo, a: q.a || null })),
      informacion: informacionDisponible(p).map((x) => ({ id: x.id, texto: x.texto, tipo: x.tipo, a: x.a || null })),
      compromisos: (esc.compromisos || []).filter((x) => !p.compromisos.includes(x.id)).map((x) => ({ id: x.id, texto: x.texto, con: x.con, coste: x.coste || 3 })),
      acciones: accionesDisponibles(p),
      pausasRestantes: 2 - p.jugador.pausasUsadas,
      tecnicas: Object.assign({}, p.tecnicas),
      jugador: { batnaId: p.jugador.batnaId, batna: p.jugador.batnaMostrada, reserva: p.jugador.reserva, objetivo: p.jugador.objetivo, apertura: p.jugador.apertura, ofertaFinalPendiente: p.jugador.ofertaFinalPendiente },
      evento: p.eventoPendiente ? vistaEvento(p, esc.eventos.find((x) => x.id === p.eventoPendiente)) : null,
      bloque: p.bloque ? p.bloque.slice() : null,
      resultado: p.resultado ? U.copiar(p.resultado) : null
    };
  }

  /* Datos del motor que alimentan a la función pura estadoMotor → estadoVisual. */
  function estadoParaVisual(p, ci) {
    const c = p.contrapartes[ci];
    const otros = p.bloque && p.bloque.includes(c.id) ? p.bloque.filter((x) => x !== c.id) : [];
    return {
      confianza: c.C, tension: c.E, paciencia: Math.max(0, c.P), pacienciaMax: c.P0,
      reaccion: c.reaccion, personalidad: defC(p, ci).personalidad, turno: p.turno,
      bloqueCon: otros.length ? otros[0] : null, aliado: c.aliado, retirado: c.retirado,
      ultimatum: c.ultimatum, fase: p.fase
    };
  }

  NG.Motor = {
    crearPartida, iniciar, ejecutar, resolverEvento, accionesDisponibles, observacion,
    estadoParaVisual, paqueteConcesion, utilJ, utilC, aspiracion, consultas, describirAccion,
    _interno: { generarContraoferta, evaluar, fuerzaBatna, variableQueMasDuele, similitud }
  };
})(typeof window !== 'undefined' ? window : globalThis);
