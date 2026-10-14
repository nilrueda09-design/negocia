/* =====================================================================
 * NEGOCIA · ia/mediadora.js — la mediadora IA del modo equipo
 *
 * Pilar Sanz, mediadora laboral, es un agente de IA con tres funciones
 * que cambian la partida:
 *   1. DIRECTORA: elige qué imprevisto abre la ronda siguiente (solo entre
 *      los que las reglas permiten en ese momento) y lo anuncia.
 *   2. ASESORA: analiza por qué no hubo acuerdo y propone un plan concreto
 *      que el siguiente rol puede adoptar con un clic.
 *   3. EVALUADORA: al final explica a cada rol cómo lo ha hecho.
 *
 * Proveedores, por orden: Claude dentro de claude.ai (capacidad «sample»
 * del Artifact, con la cuenta de quien juega, sin claves), Claude a través
 * del servidor local (clave en el entorno del servidor) y, si no hay
 * ninguno, una mediadora local (solución de Nash con información parcial).
 *
 * Prompting estructurado: <instrucciones>, <reglas>, <estado_partida>,
 * <informacion_de_roles> (pública y confidencial por separado),
 * <eventos_disponibles> y <formato_salida>. Toda respuesta se valida antes
 * de tocar el juego; si filtra información privada, se descarta.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const Q = () => NG.Equipo;
  const NOMBRE = 'Pilar Sanz';

  /* ===================== Prompts (funciones puras) ===================== */
  function estadoPublico(e) {
    const pub = Q().publico(e);
    const ult = e.historial[e.historial.length - 1];
    return {
      ronda_siguiente: e.ronda, rondas_maximas: pub.maxRondas,
      caja_meses: e.caja, clima_social: e.clima, confianza_en_la_mesa: e.confianza,
      compromisos_laterales_disponibles: e.confianza >= Q().CONFIANZA_COMPROMISOS,
      proximo_en_proponer: pub.proponente,
      exigencias_publicas: pub.exigencias,
      historial: pub.historial.map((h) => ({ ronda: h.ronda, propone: h.por, propuesta: h.propuesta, indices: h.paquete, compromisos: h.compromisos, votos: h.votos, resultado: h.resultado })),
      imprevistos_ocurridos: pub.eventos,
      posturas_iniciales: pub.declaraciones,
      ratificaciones_fallidas: pub.ratificaciones_fallidas,
      ultima_propuesta: ult ? { indices: ult.paquete, compromisos: ult.compromisos } : null
    };
  }
  function seccionRoles() {
    const R = Q().ROLES;
    const vs = Q().escenario().variables;
    const publica = Q().ORDEN.map((r) => ({ rol: r, cargo: R[r].titulo, persona: R[r].personaje, responsabilidad: R[r].responsabilidad, objetivo_publico: R[r].objetivoPublico }));
    // Lo que una mediadora sabe por las reuniones privadas: prioridades, NO mínimos ni secretos
    const confidencial = Q().ORDEN.map((r) => {
      const h = Q().hoja(r);
      return { rol: r, prioridades: vs.map((v, i) => ({ variable: v.nombre, importancia: Math.round(Math.max.apply(null, h[i]) - Math.min.apply(null, h[i])), opcion_preferida: v.opciones[h[i].indexOf(Math.max.apply(null, h[i]))] })) };
    });
    return '<publica>\n' + JSON.stringify(publica, null, 1) + '\n</publica>\n<confidencial>\nLo que cada parte te ha contado en privado. Úsalo para buscar un acuerdo, pero NUNCA lo cites ni lo des a entender en tus mensajes.\n' + JSON.stringify(confidencial, null, 1) + '\n</confidencial>';
  }
  function variablesTexto() {
    return Q().escenario().variables.map((v, i) => i + '. ' + v.nombre + ': ' + v.opciones.map((o, k) => '[' + k + '] ' + o).join(' · ')).join('\n');
  }

  function promptRonda(e) {
    const el = Q().eventosElegibles(e);
    return [
      '<instrucciones>',
      'Eres ' + NOMBRE + ', mediadora laboral en «Mesa de crisis», un juego de negociación en equipo. Tres jugadores humanos negocian el plan de viabilidad de Textiles Miralles: Dirección, Comité de empresa (sindicato) y Fondo Nordia. Acaba de terminar una ronda SIN acuerdo (o con un plan firmado en la mesa que después no se ratificó).',
      'Tu tarea: 1) explicar en público, en una o dos frases, por qué crees que no ha habido acuerdo; 2) proponer un plan concreto que pueda funcionar para las tres partes; 3) elegir el imprevisto que abrirá la próxima ronda (o ninguno) para mantener la presión de forma justa, y anunciarlo.',
      '</instrucciones>',
      '<reglas>',
      '- Se necesita el sí de las tres partes. Cada ronda propone un rol distinto y los otros dos votan en secreto.',
      '- Después, cada parte debe ratificar el plan ante los suyos (consejo, asamblea, comité de inversión): un plan que no compense a alguien se cae.',
      '- Cada ronda sin acuerdo consume un mes de caja. Con la caja a cero, concurso de acreedores: pierden todos.',
      '- Un clima social de 80 o más provoca una huelga. Con confianza inferior a ' + Q().CONFIANZA_COMPROMISOS + ' no se pueden ofrecer compromisos laterales.',
      '- Tu propuesta es una sugerencia: el siguiente rol decide si la usa.',
      '- Variables (índice de opción entre corchetes):',
      variablesTexto(),
      '- PROHIBIDO en tus textos: cifras de puntos, mínimos o reservas de nadie, objetivos secretos, o detalles de lo que te contaron en privado. Habla de intereses en general («la plantilla necesita garantías»), nunca de datos confidenciales.',
      '- Solo puedes elegir un imprevisto de <eventos_disponibles>, o null.',
      '- Español de España, tono profesional y cercano, frases cortas.',
      '</reglas>',
      '<estado_partida>',
      JSON.stringify(estadoPublico(e), null, 1),
      '</estado_partida>',
      '<informacion_de_roles>',
      seccionRoles(),
      '</informacion_de_roles>',
      '<eventos_disponibles>',
      JSON.stringify(el.map((x) => ({ id: x.id, titulo: x.titulo, efecto: x.efecto })), null, 1),
      '</eventos_disponibles>',
      '<formato_salida>',
      'Responde SOLO con un objeto JSON, sin texto antes ni después:',
      '{"analisis": "máx. 2 frases", "propuesta": [5 enteros, uno por variable], "razon": "máx. 2 frases: por qué puede funcionar para todos", "evento": "id de <eventos_disponibles> o null", "anuncio_evento": "1 frase para anunciarlo, o cadena vacía"}',
      'Ejemplo: {"analisis": "El fondo ha pedido control y la plantilla garantías; la propuesta no daba ninguna de las dos.", "propuesta": [1, 1, 1, 1, 2], "razon": "Reparte los sacrificios: menos despidos con formación a cambio de una participación relevante.", "evento": null, "anuncio_evento": ""}',
      '</formato_salida>'
    ].join('\n');
  }

  function promptEvaluacion(e, punt) {
    const R = Q().ROLES;
    const vs = Q().escenario().variables;
    const desc = (p) => p.map((k, i) => vs[i].nombre + ': ' + vs[i].opciones[k]).join(' · ');
    const resultado = {
      hubo_acuerdo: punt.acuerdo, rondas: punt.rondas, caja_restante: e.caja, clima: e.clima, confianza: e.confianza,
      plan_firmado: punt.acuerdo ? desc(e.resultado.paquete) : null,
      compromisos: punt.acuerdo ? e.resultado.compromisos.map((id) => Q().COMPROMISOS[id].texto) : [],
      mejor_acuerdo_posible: desc(punt.nash),
      puntuacion_equipo: punt.equipo, mision: punt.mision, valor_conjunto_pct: punt.conjunto,
      roles: Q().ORDEN.map((r) => ({ rol: r, cargo: R[r].titulo, valor_obtenido: punt.roles[r].valor, minimo: punt.roles[r].reserva, objetivo_secreto: R[r].secreto.texto, cumplio_secreto: punt.roles[r].secreto, puntuacion_individual: punt.roles[r].individual }))
    };
    return [
      '<instrucciones>',
      'Eres ' + NOMBRE + ', mediadora en «Mesa de crisis». La partida ha terminado y ya se ha revelado toda la información privada. Evalúa la actuación del equipo y de cada rol para que aprendan.',
      '</instrucciones>',
      '<reglas>',
      '- Básate SOLO en los datos de <estado_partida>: no inventes cifras ni hechos.',
      '- Sé concreta: cita decisiones reales de la partida (qué se propuso, quién rechazó, qué imprevisto pesó).',
      '- Para cada rol: un acierto y una mejora, en 2 o 3 frases. Español de España, tono de coach.',
      '</reglas>',
      '<estado_partida>',
      JSON.stringify({ resultado, historial: estadoPublico(e).historial, imprevistos: estadoPublico(e).imprevistos_ocurridos }, null, 1),
      '</estado_partida>',
      '<informacion_de_roles>',
      JSON.stringify(Q().ORDEN.map((r) => ({ rol: r, cargo: R[r].titulo, responsabilidad: R[r].responsabilidad })), null, 1),
      '</informacion_de_roles>',
      '<formato_salida>',
      'Responde SOLO con un objeto JSON: {"resumen": "2-3 frases sobre el equipo", "roles": {"direccion": "...", "sindicato": "...", "fondo": "..."}, "leccion": "1 frase con la idea clave de negociación que se llevan"}',
      '</formato_salida>'
    ].join('\n');
  }

  /* ===================== Validación ===================== */
  const normal = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const PISTAS_PRIVADAS = ['linea de credito', 'consejo de administracion', 'caja de resistencia', 'ratificar', 'ratificara', 'comite de inversion exige', 'te cuesta poco', 'objetivo secreto', 'su minimo', 'su reserva', 'punto de reserva'];
  /* ¿Filtra el texto información privada? Devuelve los motivos. */
  function fugas(texto) {
    const t = normal(texto);
    const motivos = [];
    if (/\d+([.,]\d+)?\s*(pts|puntos|pt)\b/.test(t)) motivos.push('cita puntos');
    PISTAS_PRIVADAS.forEach((p) => { if (t.includes(p)) motivos.push('menciona «' + p + '»'); });
    return motivos;
  }
  const corto = (s, n) => String(s || '').trim().slice(0, n);

  function validarRonda(r, e) {
    const problemas = [];
    if (!r || typeof r !== 'object') return { ok: false, problemas: ['no es un objeto JSON'] };
    const datos = { analisis: corto(r.analisis, 400), razon: corto(r.razon, 400), anuncio: corto(r.anuncio_evento, 300), propuesta: null, evento: null };
    if (!datos.analisis) problemas.push('falta el análisis');
    if (Q().validarPaquete(r.propuesta)) datos.propuesta = r.propuesta.slice();
    else problemas.push('propuesta con índices no válidos');
    const el = Q().eventosElegibles(e).map((x) => x.id);
    if (r.evento === null || r.evento === undefined || r.evento === '' || r.evento === 'null') datos.evento = null;
    else if (el.includes(r.evento)) datos.evento = r.evento;
    else problemas.push('imprevisto «' + r.evento + '» no permitido ahora');
    const f = fugas([datos.analisis, datos.razon, datos.anuncio].join(' '));
    if (f.length) return { ok: false, fuga: true, problemas: problemas.concat(['filtra información privada: ' + f.join(', ')]) };
    return { ok: problemas.length === 0, datos, problemas };
  }
  function validarEvaluacion(r) {
    if (!r || typeof r !== 'object' || !r.roles || typeof r.roles !== 'object') return { ok: false, problemas: ['formato no válido'] };
    const datos = { resumen: corto(r.resumen, 700), leccion: corto(r.leccion, 300), roles: {} };
    const problemas = [];
    Q().ORDEN.forEach((id) => { datos.roles[id] = corto(r.roles[id], 600); if (!datos.roles[id]) problemas.push('falta la evaluación de ' + id); });
    if (!datos.resumen) problemas.push('falta el resumen');
    return { ok: problemas.length === 0, datos, problemas };
  }

  /* ===================== Mediadora local (respaldo sin conexión) ===================== */
  function rondaLocal(e) {
    const ult = e.historial[e.historial.length - 1];
    const R = Q().ROLES;
    const rechazan = ult ? Object.keys(ult.votos).filter((r) => !ult.votos[r].acepta) : [];
    const sug = Q().sugerenciaLocal(e);
    const ev = Q().eventoLocal(e);
    const def = ev ? Q().EVENTOS[ev] : null;
    const analisis = rechazan.length === 2
      ? 'Ni ' + R[rechazan[0]].personaje.split(' ')[0] + ' ni ' + R[rechazan[1]].personaje.split(' ')[0] + ' ven atendidos sus intereses principales: así es difícil avanzar.'
      : rechazan.length ? R[rechazan[0]].personaje.split(' ')[0] + ' no puede defender esta propuesta ante los suyos. Estamos cerca, pero falta un gesto hacia esa parte.' : 'Seguimos sin acuerdo.';
    return {
      analisis, propuesta: sug.paquete,
      razon: 'Reparte los sacrificios: cada parte cede en lo que menos le importa y gana en lo que más necesita.',
      evento: ev, anuncio: def ? 'Antes de seguir, una noticia: ' + def.titulo.charAt(0).toLowerCase() + def.titulo.slice(1) + '.' : ''
    };
  }
  function evaluacionLocal(e, punt) {
    const R = Q().ROLES;
    const roles = {};
    Q().ORDEN.forEach((r) => {
      const x = punt.roles[r];
      roles[r] = (x.valor >= x.reserva ? 'Conseguiste un plan por encima de tu mínimo (' + x.valor + ' frente a ' + x.reserva + ').' : 'Terminaste por debajo de tu mínimo (' + x.valor + ' frente a ' + x.reserva + ').') +
        (x.secreto ? ' Además cumpliste tu objetivo secreto.' : ' Tu objetivo secreto quedó sin cumplir: ' + R[r].secreto.texto.charAt(0).toLowerCase() + R[r].secreto.texto.slice(1));
    });
    return {
      resumen: punt.acuerdo ? 'El equipo firmó un plan en ' + punt.rondas + ' ronda' + (punt.rondas === 1 ? '' : 's') + ', con ' + e.caja + ' meses de caja por delante. El plan alcanza el ' + punt.conjunto + ' % del mejor valor conjunto posible.' : 'No hubo acuerdo y la empresa entró en concurso: todos terminan peor que con cualquier plan razonable.',
      roles, leccion: 'En una negociación con varias partes, el acuerdo llega cuando cada una cede en lo que menos le importa y gana en lo que más necesita.'
    };
  }

  /* ===================== Proveedores de IA ===================== */
  let samplePromesa = null;
  function sampleDisponible() {
    if (!samplePromesa) {
      samplePromesa = (raiz.claude && typeof raiz.claude.use === 'function')
        ? raiz.claude.use('sample').catch(() => null) : Promise.resolve(null);
    }
    return samplePromesa;
  }
  let desactivadaClaude = false;
  async function proveedor() {
    if (!desactivadaClaude && await sampleDisponible()) return 'claude';
    if (NG.IA && (await NG.IA.comprobar()).disponible) return 'servidor';
    return 'local';
  }
  const ETIQUETA = { claude: 'Claude (claude.ai)', servidor: 'Claude (servidor local)', local: 'Mediadora local (sin conexión)' };
  const PERMANENTES = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];

  async function pedir(fuente, prompt, tipo, signal) {
    if (fuente === 'claude') {
      const sample = await sampleDisponible();
      try { return await sample.json(prompt, { modelTier: 'quick', cache: false, signal }); }
      catch (err) { if (err && PERMANENTES.includes(err.code)) desactivadaClaude = true; throw new Error((err && (err.code + ': ' + err.message)) || 'error'); }
    }
    const r = await fetch('api/ia/mediar', { method: 'POST', signal, headers: { 'Content-Type': 'application/json', 'X-Negocia': '1' }, body: JSON.stringify({ tipo, prompt }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Error ' + r.status);
    return d.respuesta;
  }

  /* Cierra una ronda sin acuerdo: análisis, propuesta e imprevisto siguiente. */
  async function cerrarRonda(e, opciones) {
    opciones = opciones || {};
    const fuente = opciones.soloLocal ? 'local' : await proveedor();
    const prompt = promptRonda(e);
    const reg = { momento: 'Ronda ' + (e.ronda - 1) + ' · análisis y propuesta', fuente: ETIQUETA[fuente], prompt };
    if (fuente !== 'local') {
      try {
        const crudo = await pedir(fuente, prompt, 'ronda', opciones.signal);
        const v = validarRonda(crudo, e);
        reg.respuesta = crudo;
        if (v.ok) return Object.assign({ fuente, registro: Object.assign(reg, { estado: 'validada' }) }, v.datos);
        if (!v.fuga && v.datos && v.datos.analisis) {
          // Corrección parcial: se conserva lo válido y se completa con la mediadora local
          const loc = rondaLocal(e);
          const datos = Object.assign({}, v.datos, { propuesta: v.datos.propuesta || loc.propuesta, evento: v.problemas.some((p) => p.startsWith('imprevisto')) ? loc.evento : v.datos.evento });
          if (datos.evento !== v.datos.evento) datos.anuncio = loc.anuncio;
          return Object.assign({ fuente, registro: Object.assign(reg, { estado: 'corregida', detalle: v.problemas.join('; ') }) }, datos);
        }
        reg.estado = 'descartada'; reg.detalle = v.problemas.join('; ');
      } catch (err) {
        reg.estado = 'error'; reg.detalle = err.message;
      }
    }
    const loc = rondaLocal(e);
    if (fuente === 'local') { reg.estado = 'local'; }
    return Object.assign({ fuente: 'local', registro: reg }, loc);
  }

  async function evaluar(e, punt, opciones) {
    opciones = opciones || {};
    const fuente = opciones.soloLocal ? 'local' : await proveedor();
    const prompt = promptEvaluacion(e, punt);
    const reg = { momento: 'Evaluación final', fuente: ETIQUETA[fuente], prompt };
    if (fuente !== 'local') {
      try {
        const crudo = await pedir(fuente, prompt, 'evaluacion', opciones.signal);
        const v = validarEvaluacion(crudo);
        reg.respuesta = crudo;
        if (v.ok) return Object.assign({ fuente, registro: Object.assign(reg, { estado: 'validada' }) }, v.datos);
        reg.estado = 'descartada'; reg.detalle = v.problemas.join('; ');
      } catch (err) { reg.estado = 'error'; reg.detalle = err.message; }
    } else reg.estado = 'local';
    return Object.assign({ fuente: 'local', registro: reg }, evaluacionLocal(e, punt));
  }

  /* Versión del prompt para mostrar en pantalla: sin la sección confidencial. */
  function promptVisible(prompt) {
    return String(prompt).replace(/<confidencial>[\s\S]*?<\/confidencial>/, '<confidencial>\n[Oculto a los jugadores: prioridades que cada parte contó en privado a la mediadora]\n</confidencial>');
  }

  NG.Mediadora = {
    NOMBRE, ETIQUETA, proveedor, cerrarRonda, evaluar,
    promptRonda, promptEvaluacion, promptVisible, validarRonda, validarEvaluacion, fugas, rondaLocal, evaluacionLocal
  };
})(typeof window !== 'undefined' ? window : globalThis);
