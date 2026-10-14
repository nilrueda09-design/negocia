/* =====================================================================
 * NEGOCIA · servidor/simulado.mjs — cliente FALSO, solo para pruebas
 *
 * Imita la forma de client.beta.messages.create() para probar de extremo
 * a extremo el Modo IA (esquemas, validación, proxy e interfaz) sin clave
 * ni coste. Se activa con NEGOCIA_IA_SIMULADA=1. No es inteligente: usa
 * palabras clave. Un mensaje que contenga «#error» simula un fallo de la API.
 * ===================================================================== */

const normal = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const palabras = (s) => normal(s).split(/[^a-z0-9ñ]+/).filter((w) => w.length > 3);

function entre(s, desde, hasta) {
  const i = s.indexOf(desde);
  if (i < 0) return '';
  const j = hasta ? s.indexOf(hasta, i + desde.length) : -1;
  return s.slice(i + desde.length, j < 0 ? undefined : j);
}
function listaIds(bloque) {
  return [...bloque.matchAll(/^\s+- ([\w-]+): «(.*?)»/gm)].map((m) => ({ id: m[1], texto: m[2] }));
}
function masParecida(lista, mensaje) {
  const m = new Set(palabras(mensaje));
  let mejor = null, max = -1;
  for (const x of lista) {
    const n = palabras(x.texto).filter((w) => m.has(w)).length;
    if (n > max) { max = n; mejor = x; }
  }
  return mejor;
}

function interpretarFalso(sistema, mensaje) {
  const t = normal(mensaje);
  const disp = entre(sistema, 'Acciones disponibles ahora: ', '\n').split(/,\s*/).map((x) => x.replace(/\.$/, '').trim());
  const base = (k) => { try { return JSON.parse(entre(sistema, k, '.\n')); } catch (e) { return null; } };
  const vars = [...entre(sistema, 'Variables negociables', 'Última oferta').matchAll(/^\s+\d+\. .*?: (.*)$/gm)].map((m) => m[1].split(' · ').map((o) => o.replace(/^\[\d+\] /, '')));
  const r = { tipo: 'charla', paquete: null, id: null, justifica: false, final: false, explicacion: 'Charla de cortesía' };
  const puede = (x) => disp.includes(x);
  if (/\bacepto\b|trato hecho/.test(t) && puede('aceptar')) return Object.assign(r, { tipo: 'aceptar', explicacion: 'Aceptas su propuesta' });
  if (/me levanto|me voy|lo dejamos aqui/.test(t) && puede('abandonar')) return Object.assign(r, { tipo: 'abandonar', explicacion: 'Te levantas de la mesa' });
  if (/pausa|receso/.test(t) && puede('pausa')) return Object.assign(r, { tipo: 'pausa', explicacion: 'Pides una pausa' });
  if (/alternativa|otro proveedor|otras opciones/.test(t) && puede('presionar')) return Object.assign(r, { tipo: 'presionar', explicacion: 'Recuerdas que tienes alternativa' });
  if (/propongo|ofrezco|mi oferta|ultima oferta/.test(t) && puede('oferta')) {
    const paq = (base('Última oferta del jugador: ') || base('Propuesta de la contraparte sobre la mesa: ') || vars.map(() => 0)).slice();
    vars.forEach((ops, i) => { ops.forEach((o, k) => { if (t.includes(normal(o))) paq[i] = k; }); });
    return Object.assign(r, { tipo: 'oferta', paquete: paq, justifica: /indice|mercado|datos/.test(t), final: /ultima oferta|oferta final/.test(t), explicacion: 'Haces una oferta' });
  }
  if ((/\?/.test(mensaje)) && puede('pregunta')) {
    const q = masParecida(listaIds(entre(sistema, 'Preguntas posibles', 'Información que')), mensaje);
    if (q) return Object.assign(r, { tipo: 'pregunta', id: q.id, explicacion: 'Preguntas: ' + q.texto });
  }
  if (/prioridad|lo que mas me importa|te cuento|os cuento|te confieso/.test(t) && puede('compartir')) {
    const x = masParecida(listaIds(entre(sistema, 'Información que el jugador puede compartir', 'Reglas:')), mensaje);
    if (x) return Object.assign(r, { tipo: 'compartir', id: x.id, explicacion: 'Compartes: ' + x.texto });
  }
  return r;
}

function narrarFalso(usuario) {
  const lineas = [...usuario.matchAll(/^- ([\w-]+): reacción «.*?»\. Lo que el motor le hace decir \(reformúlalo\): «([\s\S]*?)»(?:\.|$)/gm)];
  return { respuestas: lineas.map((m) => ({ quien: m[1], texto: '[Simulación IA] ' + m[2] })) };
}

export function crearClienteSimulado() {
  const crear = async (params) => {
    const usuario = params.messages[0].content;
    const mensaje = entre(usuario, '<mensaje_del_jugador>\n', '\n</mensaje_del_jugador>');
    if (mensaje.includes('#error')) throw new Error('Fallo simulado de la API');
    await new Promise((r) => setTimeout(r, 120));
    const esquema = params.output_config.format.schema;
    const datos = esquema.properties.tipo ? interpretarFalso(params.system, mensaje)
      : esquema.properties.analisis ? { analisis: '[Simulación IA] No ha habido acuerdo porque cada parte defendía solo lo suyo.', propuesta: [1, 1, 1, 1, 2], razon: 'Reparte los sacrificios entre todos.', evento: null, anuncio_evento: '' }
      : esquema.properties.resumen ? { resumen: '[Simulación IA] Evaluación del equipo.', roles: { direccion: 'Bien.', sindicato: 'Bien.', fondo: 'Bien.' }, leccion: 'Crear valor antes de repartirlo.' }
      : narrarFalso(usuario);
    return { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(datos) }] };
  };
  return { beta: { messages: { create: crear } } };
}
