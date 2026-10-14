/* =====================================================================
 * NEGOCIA · nucleo/equipo.js — Modo equipo «Mesa de crisis» (3 roles)
 *
 * Tres roles jugables (Dirección, Sindicato y Fondo) comparten una misión:
 * firmar un plan de viabilidad para Textiles Miralles antes de que se acabe
 * la caja. Cada rol tiene información privada (su hoja de puntos, su mínimo,
 * un objetivo secreto y datos confidenciales) y un objetivo individual que
 * no coincide con el de los demás.
 *
 * Cuatro fases: 1) POSTURAS: cada rol elige en secreto cómo se presenta;
 * 2) RONDAS: la mediadora (IA) abre con un imprevisto, un rol propone un
 * plan (con compromisos laterales opcionales), los otros dos votan en
 * privado, y el resultado cambia la caja, el clima social y la confianza;
 * 3) RATIFICACIÓN: cada parte debe defender el plan ante los suyos
 * (asamblea, comité de inversión, consejo): si firmó por debajo de su
 * mínimo, se lo tumban (juego a dos niveles, Putnam 1988); 4) EVALUACIÓN.
 * Lógica pura, sin DOM: se prueba en Node.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const U = NG.Util;
  const A = NG.Analisis;
  const ESC_ID = 'e5-multiparte';
  const esc = () => NG.Escenarios.obtener(ESC_ID);

  const ORDEN = ['direccion', 'fondo', 'sindicato'];
  const MAX_RONDAS = 7;

  /* ---------- Roles: información pública y privada ---------- */
  const ROLES = {
    direccion: {
      id: 'direccion', titulo: 'Dirección General', personaje: 'Marta Soler', color: '#f2b84b', perfil: 'jugador',
      avatar: { semilla: 31, genero: 'm', piel: 1, pelo: 'ondulado', colorPelo: '#3b2a20', gafas: 'finas', ropa: 'blazer', colorRopa: '#2f3d5c', colorCamisa: '#f3f1ea', edad: 46, cara: 'ovalada' },
      responsabilidad: 'Presentar un plan viable y conseguir que lo firmen todos.',
      objetivoPublico: 'Salvar la empresa sin perder el control de la gestión.',
      reserva: 50, batna: 15, batnaTexto: 'Concurso de acreedores: la dirección sería sustituida.',
      secreto: { texto: 'El banco solo renovará la línea de crédito si entran al menos 15 M€ de capital.', cumple: (p) => p.paquete[2] >= 1 },
      confidencial: ['El consejo de administración no quiere que el fondo pase del 40 %.', 'Para ti, un ajuste moderado (40 puestos) es lo ideal: sin despidos la empresa no es viable.'],
      compromisos: ['comite', 'consejo']
    },
    sindicato: {
      id: 'sindicato', titulo: 'Comité de empresa', personaje: 'Rosa Jiménez', color: '#ff8a8a', perfil: 0, contraparte: 'rosa',
      responsabilidad: 'Defender a la plantilla y que la asamblea ratifique el plan.',
      objetivoPublico: 'Salvar el máximo de puestos de trabajo en condiciones dignas.',
      reserva: 47, batna: 25, batnaTexto: 'Huelga indefinida y presión política, con la fábrica en riesgo de cierre.',
      secreto: { texto: 'La asamblea solo ratificará despidos si hay un plan completo de recolocación con formación.', cumple: (p) => p.paquete[0] === 0 || p.paquete[4] === 2 },
      confidencial: ['La caja de resistencia solo aguanta un mes de huelga.', 'En privado, muchos trabajadores aceptarían congelar sueldos si se salvan puestos.'],
      compromisos: ['paz']
    },
    fondo: {
      id: 'fondo', titulo: 'Fondo Nordia Capital', personaje: 'Daniel Weber', color: '#7fa6ff', perfil: 1, contraparte: 'weber',
      responsabilidad: 'Invertir solo si el control y el retorno compensan el riesgo.',
      objetivoPublico: 'Una inversión rentable con influencia real en la empresa.',
      reserva: 47, batna: 38, batnaTexto: 'Invertir en otra textil del Vallès que también busca capital.',
      secreto: { texto: 'Tu comité de inversión exige al menos el 40 % de la empresa… o asientos en el consejo.', cumple: (p) => p.paquete[3] >= 1 || p.compromisos.includes('consejo') },
      confidencial: ['Recolocar a la plantilla te cuesta poco: no merece la pena pelearlo.', 'La otra textil del Vallès podría cerrar su ronda con otro inversor en cualquier momento.'],
      compromisos: ['linea']
    }
  };

  /* ---------- Compromisos laterales (los ofrece quien propone) ---------- */
  const COMPROMISOS = {
    comite: { id: 'comite', de: 'direccion', texto: 'Comité de seguimiento del plan con el sindicato dentro', bonus: { sindicato: 8 }, coste: 2 },
    consejo: { id: 'consejo', de: 'direccion', texto: 'Dos asientos en el consejo para el fondo', bonus: { fondo: 10 }, coste: 4 },
    paz: { id: 'paz', de: 'sindicato', texto: 'Paz social: sin huelgas durante dos años', bonus: { fondo: 6, direccion: 4 }, coste: 3, clima: -15 },
    linea: { id: 'linea', de: 'fondo', texto: 'Invertir además en una nueva línea de producción', bonus: { sindicato: 7, direccion: 3 }, coste: 4 }
  };
  const CONFIANZA_COMPROMISOS = 40;

  /* ---------- Fase 1: posturas de apertura (decisión privada) ---------- */
  const POSTURAS = {
    firme: { id: 'firme', titulo: 'Firme', texto: 'Dejar claras tus líneas rojas desde el principio.', efecto: 'Tu exigencia principal queda sobre la mesa. Clima +6, confianza −4.', clima: 6, confianza: -4 },
    abierta: { id: 'abierta', titulo: 'Abierta', texto: 'Escuchar antes de pedir nada.', efecto: 'Confianza +3.', clima: 0, confianza: 3 },
    colaborativa: { id: 'colaborativa', titulo: 'Colaborativa', texto: 'Compartir qué es lo que más te importa.', efecto: 'La mesa sabe tu prioridad. Confianza +6, clima −4.', clima: -4, confianza: 6 }
  };
  const ANTE = { direccion: 'el consejo de administración', sindicato: 'la asamblea de trabajadores', fondo: 'el comité de inversión' };

  /* ---------- Imprevistos (la mediadora elige cuál y cuándo) ---------- */
  const EVENTOS = {
    pedido: {
      titulo: 'Un cliente alemán adelanta un pedido', resumen: '+1 mes de caja y +5 de confianza.',
      puede: (e) => e.ronda >= 2,
      aplicar: (e) => { e.caja += 1; e.confianza += 5; }
    },
    filtracion: {
      titulo: 'La prensa filtra la negociación', resumen: 'El clima social sube 15 puntos y la confianza baja 5.',
      puede: (e) => e.confianza < 65,
      aplicar: (e) => { e.clima += 15; e.confianza -= 5; }
    },
    asamblea: {
      titulo: 'Asamblea de trabajadores', resumen: 'Si ya se ha propuesto un plan completo de recolocación, la plantilla se calma (el mínimo del sindicato baja 3); si no, se endurece (+3).',
      puede: (e) => e.clima >= 45,
      aplicar: (e) => {
        const hubo = e.historial.some((h) => h.paquete[4] === 2);
        e.roles.sindicato.reserva += hubo ? -3 : 3;
        e.clima -= 10;
      }
    },
    'otra-textil': {
      titulo: 'La otra textil del Vallès cierra con otro inversor', resumen: 'La alternativa del fondo desaparece: su mínimo baja 4 puntos.',
      puede: (e) => e.ronda >= 3,
      aplicar: (e) => { e.roles.fondo.reserva -= 4; e.roles.fondo.batna -= 8; }
    },
    'comite-inversion': {
      titulo: 'El comité de inversión de Nordia se impacienta', resumen: 'Si nadie ha ofrecido asientos en el consejo, el mínimo del fondo sube 3 y la confianza baja 5.',
      puede: (e) => e.ronda >= 2,
      aplicar: (e) => {
        if (!e.historial.some((h) => h.compromisos.includes('consejo'))) { e.roles.fondo.reserva += 3; e.confianza -= 5; }
      }
    },
    banco: {
      titulo: 'El banco pide garantías', resumen: 'Si la última propuesta traía 15 M€ o más, el banco da un mes más; si no, recorta uno.',
      puede: (e) => e.ronda >= 3 && e.caja <= 4 && e.historial.length > 0,
      aplicar: (e) => { const u = e.historial[e.historial.length - 1]; e.caja += u.paquete[2] >= 1 ? 1 : -1; }
    }
  };

  /* ===================== Utilidades ===================== */
  function perfilDe(rolId) {
    const r = ROLES[rolId];
    return r.perfil === 'jugador' ? esc().perfilJ : esc().perfilesC[r.perfil];
  }
  function hoja(rolId) {
    const perf = perfilDe(rolId);
    return esc().variables.map((v, i) => v.opciones.map((_, k) => Math.round(1000 * perf.pesos[i] * perf.u[i][k]) / 10));
  }
  function base(rolId, paquete) { return A.utilidadPerfil(perfilDe(rolId), paquete); }
  /* Valor de una propuesta para un rol, con los compromisos laterales. */
  function valor(rolId, paquete, compromisos) {
    let v = base(rolId, paquete);
    (compromisos || []).forEach((id) => {
      const c = COMPROMISOS[id];
      if (!c) return;
      v += c.bonus[rolId] || 0;
      if (c.de === rolId) v -= c.coste;
    });
    return Math.round(v * 10) / 10;
  }
  const otros = (rolId) => ORDEN.filter((r) => r !== rolId);
  const proponenteDe = (ronda) => ORDEN[(ronda - 1) % ORDEN.length];
  function normalizar(e) {
    e.caja = Math.max(0, Math.round(e.caja));
    e.clima = U.clamp(Math.round(e.clima), 0, 100);
    e.confianza = U.clamp(Math.round(e.confianza), 0, 100);
  }
  function validarPaquete(p) {
    const vs = esc().variables;
    return Array.isArray(p) && p.length === vs.length && p.every((k, i) => Number.isInteger(k) && k >= 0 && k < vs[i].opciones.length);
  }

  /* ===================== Partida ===================== */
  function crear(opciones) {
    opciones = opciones || {};
    const semilla = opciones.semilla || U.semillaAleatoria();
    const roles = {};
    ORDEN.forEach((id) => {
      roles[id] = { id, jugador: (opciones.nombres && opciones.nombres[id]) || '', reserva: ROLES[id].reserva, reserva0: ROLES[id].reserva, batna: ROLES[id].batna };
    });
    return {
      semilla, rng: U.crearRng(semilla),
      ronda: 1, fase: 'posturas', caja: 6, clima: 40, confianza: 50,
      roles, posturas: {}, declaraciones: [], propuesta: null, votos: {}, exigencias: {}, ratificaciones: [],
      historial: [], eventos: [], sugerencia: null, resultado: null
    };
  }

  /* ---------- Fase 1 ---------- */
  function prioridad(rolId) {
    const h = hoja(rolId);
    const rango = h.map((op) => Math.max.apply(null, op) - Math.min.apply(null, op));
    const i = rango.indexOf(Math.max.apply(null, rango));
    return { variable: i, opcion: h[i].indexOf(Math.max.apply(null, h[i])) };
  }
  function elegirPostura(e, rolId, postura) {
    if (e.fase !== 'posturas') throw new Error('No es la fase de posturas');
    if (!POSTURAS[postura] || !ROLES[rolId]) throw new Error('Postura no válida');
    e.posturas[rolId] = postura;
    if (Object.keys(e.posturas).length < ORDEN.length) return null;
    // Todas elegidas: se revelan a la vez
    const vs = esc().variables;
    ORDEN.forEach((r) => {
      const p = POSTURAS[e.posturas[r]];
      e.clima += p.clima; e.confianza += p.confianza;
      const pr = prioridad(r);
      let texto;
      if (p.id === 'firme') { e.exigencias[r] = pr; texto = 'Para nosotros es innegociable: ' + vs[pr.variable].nombre.toLowerCase() + ' → ' + vs[pr.variable].opciones[pr.opcion] + '.'; }
      else if (p.id === 'colaborativa') texto = 'Seamos claros: lo que más nos importa es ' + vs[pr.variable].nombre.toLowerCase() + '. En lo demás podemos movernos.';
      else texto = 'Antes de pedir nada, queremos escuchar a todos.';
      e.declaraciones.push({ rol: r, postura: p.id, texto, prioridad: p.id === 'colaborativa' ? vs[pr.variable].nombre : null });
    });
    normalizar(e);
    e.fase = 'apertura';
    return e.declaraciones.slice();
  }

  /* Imprevistos que se pueden dar ahora (la IA solo puede elegir entre estos). */
  function eventosElegibles(e) {
    if (e.ronda < 2) return [];
    return Object.keys(EVENTOS).filter((id) => !e.eventos.some((x) => x.id === id) && EVENTOS[id].puede(e))
      .map((id) => ({ id, titulo: EVENTOS[id].titulo, efecto: EVENTOS[id].resumen }));
  }
  function aplicarEvento(e, id) {
    if (!id) return null;
    if (!eventosElegibles(e).some((x) => x.id === id)) throw new Error('Imprevisto no disponible: ' + id);
    const antes = { caja: e.caja, clima: e.clima, confianza: e.confianza };
    EVENTOS[id].aplicar(e);
    normalizar(e);
    e.eventos.push({ ronda: e.ronda, id });
    return { id, titulo: EVENTOS[id].titulo, resumen: EVENTOS[id].resumen, cambios: { caja: e.caja - antes.caja, clima: e.clima - antes.clima, confianza: e.confianza - antes.confianza } };
  }
  /* Abre la ronda: aplica el imprevisto elegido (puede ser ninguno) y pasa a proponer. */
  function abrirRonda(e, eventoId) {
    if (e.fase !== 'apertura') throw new Error('La ronda ya está abierta');
    const ev = aplicarEvento(e, eventoId || null);
    e.fase = 'propuesta';
    e.votos = {};
    return ev;
  }

  function compromisosDisponibles(e, rolId) {
    if (e.confianza < CONFIANZA_COMPROMISOS) return [];
    return ROLES[rolId].compromisos.map((id) => COMPROMISOS[id]);
  }

  function proponer(e, datos) {
    if (e.fase !== 'propuesta') throw new Error('No es momento de proponer');
    if (!validarPaquete(datos.paquete)) throw new Error('Propuesta no válida');
    const por = proponenteDe(e.ronda);
    const permitidos = compromisosDisponibles(e, por).map((c) => c.id);
    const compromisos = (datos.compromisos || []).filter((id) => permitidos.includes(id));
    e.propuesta = { ronda: e.ronda, por, paquete: datos.paquete.slice(), compromisos, deLaMediadora: !!(e.sugerencia && datos.paquete.join() === e.sugerencia.paquete.join()) };
    e.fase = 'voto';
    return e.propuesta;
  }

  function votar(e, rolId, voto) {
    if (e.fase !== 'voto') throw new Error('No es momento de votar');
    if (!otros(e.propuesta.por).includes(rolId)) throw new Error('Este rol no vota esta propuesta');
    let pide = null;
    if (!voto.acepta && voto.pide && Number.isInteger(voto.pide.variable)) {
      const v = esc().variables[voto.pide.variable];
      if (v && Number.isInteger(voto.pide.opcion) && voto.pide.opcion >= 0 && voto.pide.opcion < v.opciones.length) pide = { variable: voto.pide.variable, opcion: voto.pide.opcion };
    }
    e.votos[rolId] = { acepta: !!voto.acepta, pide };
    if (pide) e.exigencias[rolId] = pide;
    else if (voto.acepta) delete e.exigencias[rolId];
    return Object.keys(e.votos).length === 2;
  }

  /* Cierra la ronda: acuerdo, o consecuencias sobre caja, clima y confianza. */
  function resolver(e) {
    if (e.fase !== 'voto' || Object.keys(e.votos).length < 2) throw new Error('Faltan votos');
    const p = e.propuesta;
    const valores = {};
    ORDEN.forEach((r) => { valores[r] = valor(r, p.paquete, p.compromisos); });
    const aceptan = Object.keys(e.votos).filter((r) => e.votos[r].acepta);
    const antes = { caja: e.caja, clima: e.clima, confianza: e.confianza };
    const entrada = { ronda: e.ronda, por: p.por, paquete: p.paquete.slice(), compromisos: p.compromisos.slice(), votos: JSON.parse(JSON.stringify(e.votos)), valores, deLaMediadora: p.deLaMediadora };
    const notas = [];
    let ratificacion = null;
    if (aceptan.length === 2) {
      // Fase 3: cada parte defiende el plan ante los suyos
      ratificacion = ORDEN.map((r) => {
        const cumpleSecreto = ROLES[r].secreto.cumple({ paquete: p.paquete, compromisos: p.compromisos });
        const ok = valores[r] >= e.roles[r].reserva - (cumpleSecreto ? 3 : 0);
        return { rol: r, ante: ANTE[r], ok, texto: ok ? 'Lo defiende ante ' + ANTE[r] + ' y lo aprueban.' : ANTE[r].charAt(0).toUpperCase() + ANTE[r].slice(1) + ' tumba el plan: no compensa lo que se cede.' };
      });
      e.ratificaciones.push({ ronda: e.ronda, resultados: ratificacion });
      if (ratificacion.every((x) => x.ok)) {
        entrada.resultado = 'acuerdo';
        e.historial.push(entrada);
        p.compromisos.forEach((id) => { if (COMPROMISOS[id].clima) e.clima += COMPROMISOS[id].clima; });
        normalizar(e);
        e.resultado = { tipo: 'acuerdo', paquete: p.paquete.slice(), compromisos: p.compromisos.slice(), ronda: e.ronda };
        e.fase = 'fin';
        return { acuerdo: true, aceptan, valores, ratificacion, cambios: { caja: 0, clima: e.clima - antes.clima, confianza: 0 }, notas };
      }
      // Ratificación fallida: vuelta a la mesa con la confianza tocada
      entrada.resultado = 'no ratificado';
      e.confianza -= 6;
      ratificacion.filter((x) => !x.ok).forEach((x) => { e.exigencias[x.rol] = prioridad(x.rol); if (x.rol === 'sindicato') e.clima += 10; });
      notas.push('El plan se firmó en la mesa, pero no se ratificó. Firmar por debajo de lo que tu gente puede aceptar no sirve de nada.');
    } else entrada.resultado = 'rechazo';
    e.historial.push(entrada);
    // Consecuencias: el tiempo corre y cada rechazo tensa la mesa
    e.caja -= 1;
    if (!ratificacion) {
      if (!e.votos.sindicato || !e.votos.sindicato.acepta) e.clima += valores.sindicato < 40 ? 16 : 9;
      else e.clima -= 6;
      e.confianza += aceptan.length === 1 ? 4 : -8;
    }
    if (p.compromisos.length) e.confianza += 4;
    if (p.deLaMediadora) e.confianza += 3;
    if (e.clima >= 80) {
      // Huelga: consecuencia automática del clima acumulado
      e.caja -= 1; e.confianza -= 10; e.clima = 60;
      e.eventos.push({ ronda: e.ronda, id: 'huelga' });
      notas.push('Huelga de 48 horas: la plantilla para la fábrica y se pierde un mes más de caja.');
    }
    normalizar(e);
    if (e.confianza < CONFIANZA_COMPROMISOS && antes.confianza >= CONFIANZA_COMPROMISOS) notas.push('La confianza ha caído por debajo de ' + CONFIANZA_COMPROMISOS + ': ya nadie se cree los compromisos laterales.');
    if (e.confianza >= CONFIANZA_COMPROMISOS && antes.confianza < CONFIANZA_COMPROMISOS) notas.push('La confianza se recupera: vuelven a poder ofrecerse compromisos laterales.');
    const cambios = { caja: e.caja - antes.caja, clima: e.clima - antes.clima, confianza: e.confianza - antes.confianza };
    if (e.caja <= 0 || e.ronda >= MAX_RONDAS) {
      e.resultado = { tipo: 'concurso', ronda: e.ronda };
      e.fase = 'fin';
      return { acuerdo: false, fin: true, aceptan, valores, ratificacion, cambios, notas };
    }
    e.ronda += 1;
    e.fase = 'apertura';
    e.propuesta = null;
    return { acuerdo: false, fin: false, aceptan, valores, ratificacion, cambios, notas };
  }

  /* ===================== Mediadora local (sin conexión) ===================== */
  /* Como una mediadora real: conoce las prioridades de cada parte (se las
   * cuentan en privado) pero NO sus mínimos ni sus objetivos secretos, así
   * que los estima. Busca la solución de Nash con esa estimación, acercada a
   * lo que se ha pedido en la mesa y a la última propuesta. */
  const MINIMO_ESTIMADO = 45;
  function sugerenciaLocal(e) {
    const P = esc().paquetes;
    const ult = e.historial.length ? e.historial[e.historial.length - 1].paquete : esc().statusQuo;
    const exig = Object.values(e.exigencias);
    let mejores = [];
    P.forEach((p) => {
      const ex = ORDEN.map((r) => base(r, p) - MINIMO_ESTIMADO);
      const ok = ex.every((x) => x >= 0);
      let s = ok ? ex.reduce((a, b) => a * (b + 1), 1) : -1e6 + Math.min.apply(null, ex) * 1000;
      s *= 1 + 0.04 * exig.filter((x) => p[x.variable] === x.opcion).length;
      s *= 1 + 0.02 * p.filter((k, i) => k === ult[i]).length;
      mejores.push({ p, s, ok });
    });
    mejores.sort((a, b) => b.s - a.s);
    const m = mejores[0];
    return { paquete: m.p.slice(), viable: m.ok };
  }
  /* Elección local del imprevisto: el que más presión pone según el estado. */
  function eventoLocal(e) {
    const el = eventosElegibles(e).map((x) => x.id);
    const prefer = e.clima >= 55 ? ['asamblea', 'filtracion'] : e.caja <= 3 ? ['banco', 'pedido'] : ['comite-inversion', 'otra-textil', 'pedido', 'filtracion'];
    return prefer.find((id) => el.includes(id)) || (el.length && U.probabilidad(e.rng, 0.5) ? U.elegir(e.rng, el) : null);
  }

  /* ===================== Lo que ve cada uno ===================== */
  function publico(e) {
    const vs = esc().variables;
    const desc = (p) => p.map((k, i) => vs[i].nombre + ': ' + vs[i].opciones[k]).join(' · ');
    return {
      ronda: e.ronda, maxRondas: MAX_RONDAS, fase: e.fase, caja: e.caja, clima: e.clima, confianza: e.confianza,
      proponente: e.fase === 'fin' ? null : proponenteDe(e.ronda),
      roles: ORDEN.map((r) => ({ id: r, titulo: ROLES[r].titulo, personaje: ROLES[r].personaje, responsabilidad: ROLES[r].responsabilidad, objetivoPublico: ROLES[r].objetivoPublico })),
      exigencias: Object.keys(e.exigencias).map((r) => ({ rol: r, variable: vs[e.exigencias[r].variable].nombre, opcion: vs[e.exigencias[r].variable].opciones[e.exigencias[r].opcion] })),
      historial: e.historial.map((h) => ({ ronda: h.ronda, por: h.por, propuesta: desc(h.paquete), paquete: h.paquete.slice(), compromisos: h.compromisos.map((id) => COMPROMISOS[id].texto),
        votos: Object.keys(h.votos).map((r) => ({ rol: r, acepta: h.votos[r].acepta })), resultado: h.resultado })),
      eventos: e.eventos.map((x) => ({ ronda: x.ronda, titulo: x.id === 'huelga' ? 'Huelga de 48 horas' : EVENTOS[x.id].titulo })),
      declaraciones: e.declaraciones.map((d) => ({ rol: d.rol, postura: POSTURAS[d.postura].titulo, dice: d.texto })),
      ratificaciones_fallidas: e.ratificaciones.filter((x) => x.resultados.some((r) => !r.ok)).map((x) => ({ ronda: x.ronda, tumban: x.resultados.filter((r) => !r.ok).map((r) => r.ante) })),
      describir: desc
    };
  }
  function privado(e, rolId) {
    const r = ROLES[rolId];
    return {
      rol: r, hoja: hoja(rolId), reserva: e.roles[rolId].reserva, batna: e.roles[rolId].batna,
      secreto: r.secreto.texto, confidencial: r.confidencial.slice(), compromisos: compromisosDisponibles(e, rolId)
    };
  }

  /* ===================== Resultado final ===================== */
  function puntuacion(e) {
    const P = esc().paquetes;
    const acuerdo = e.resultado && e.resultado.tipo === 'acuerdo';
    const fin = acuerdo ? { paquete: e.resultado.paquete, compromisos: e.resultado.compromisos } : null;
    // Mejor acuerdo posible (Nash sobre los mínimos iniciales, sin compromisos)
    let nash = null, nv = -1, sumaMax = 0;
    P.forEach((p) => {
      const ex = ORDEN.map((r) => base(r, p) - ROLES[r].reserva);
      sumaMax = Math.max(sumaMax, ORDEN.reduce((s, r) => s + base(r, p), 0));
      if (ex.every((x) => x >= 0)) { const v = ex.reduce((a, b) => a * (b + 1), 1); if (v > nv) { nv = v; nash = p; } }
    });
    const roles = {};
    ORDEN.forEach((r) => {
      const maxZ = Math.max.apply(null, P.filter((p) => ORDEN.every((o) => base(o, p) >= ROLES[o].reserva)).map((p) => base(r, p)));
      const res = e.roles[r].reserva;
      let v, ind;
      if (acuerdo) {
        v = valor(r, fin.paquete, fin.compromisos);
        ind = v >= res ? 50 + 50 * U.clamp((v - res) / Math.max(1, maxZ - res), 0, 1) : 50 * U.clamp(v / res, 0, 1);
      } else { v = e.roles[r].batna; ind = 30 * U.clamp(v / res, 0, 1); }
      const secreto = acuerdo && ROLES[r].secreto.cumple(fin);
      if (secreto) ind += 10;
      roles[r] = { valor: Math.round(v), reserva: res, individual: Math.round(U.clamp(ind, 0, 100)), secreto, gana: ind >= 70 };
    });
    const conjunto = acuerdo ? Math.round(100 * ORDEN.reduce((s, r) => s + base(r, fin.paquete), 0) / sumaMax) : 0;
    const mision = acuerdo ? Math.round(U.clamp(60 + 8 * e.caja - 0.15 * e.clima + 0.1 * (e.confianza - 50), 0, 100)) : 10;
    const media = ORDEN.reduce((s, r) => s + roles[r].individual, 0) / 3;
    const equipo = Math.round(0.5 * mision + 0.5 * media);
    return { acuerdo, roles, mision, conjunto, equipo, estrellas: NG.Puntuacion ? NG.Puntuacion.estrellasDe(equipo) : 0, nash, rondas: e.historial.length };
  }

  NG.Equipo = {
    ORDEN, ROLES, COMPROMISOS, EVENTOS, POSTURAS, ANTE, MAX_RONDAS, CONFIANZA_COMPROMISOS, ESC_ID,
    escenario: esc, crear, elegirPostura, prioridad, abrirRonda, eventosElegibles, proponer, votar, resolver, proponenteDe, otros,
    compromisosDisponibles, valor, base, hoja, sugerenciaLocal, eventoLocal, publico, privado, puntuacion, validarPaquete
  };
})(typeof window !== 'undefined' ? window : globalThis);
