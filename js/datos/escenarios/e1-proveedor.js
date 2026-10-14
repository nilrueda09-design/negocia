/* =====================================================================
 * NEGOCIA · Escenario 1 · «Acero a tiempo» (tutorial)
 * Enseña: BATNA (y cómo se desarrolla investigando), punto de reserva,
 * anclaje, criterios objetivos e intercambio integrativo.
 * Estructura oculta: el plazo de pago vale poco para ti y mucho para
 * Jordi (tesorería); el volumen es una cuestión COMPATIBLE.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};

  NG.Escenarios.registrar({
    id: 'e1-proveedor',
    orden: 1,
    titulo: 'Acero a tiempo',
    subtitulo: 'Renegociar con un proveedor clave',
    dificultad: 1,
    duracionMin: 12,
    tutorial: true,
    quienAbre: 'jugador',
    escena: { preparacion: 'despacho', negociacion: 'sala-proveedor' },
    conceptos: ['batna', 'punto-reserva', 'anclaje', 'zopa', 'criterios-objetivos', 'intercambio-integrativo'],
    briefing: {
      rol: 'Dirección de Compras · Nébula Electrodomésticos (Zaragoza)',
      contexto: 'El contrato anual de chapa de acero con Aceros Levante vence en tres semanas. Ellos quieren subir el precio; tú necesitas suministro estable para la nueva línea de frigoríficos. Hoy te reúnes con Jordi Puig, su director comercial.',
      meta: 'Renueva el contrato en las mejores condiciones posibles: precio, plazo de pago y volumen anual.',
      aprenderas: ['Qué es tu BATNA y por qué conviene mejorarla antes de negociar', 'Cómo fijar un punto de reserva y un objetivo', 'El poder de la primera oferta (anclaje)', 'Por qué negociar paquetes y no solo el precio']
    },
    notasIniciales: [
      { tipo: 'dato', titulo: 'Contrato actual', texto: '840 €/t · pago a 60 días · 10.000 t/año. Vence en tres semanas.' },
      { tipo: 'dato', titulo: 'Tu director general', texto: '«Necesitamos acero estable para la nueva línea. No quiero sorpresas.»' }
    ],
    variables: [
      { id: 'precio', nombre: 'Precio por tonelada', icono: 'euro', opciones: ['780 €', '800 €', '820 €', '840 €', '860 €', '880 €'], statusQuo: 3,
        jugador: { peso: 0.50, curva: 'desc' } },
      { id: 'plazo', nombre: 'Plazo de pago', icono: 'calendario', opciones: ['30 días', '45 días', '60 días', '90 días'], statusQuo: 2,
        jugador: { peso: 0.15, curva: 'asc' } },
      { id: 'volumen', nombre: 'Volumen anual', icono: 'caja', opciones: ['8.000 t', '10.000 t', '12.000 t', '14.000 t'], statusQuo: 1,
        jugador: { peso: 0.35, curva: [0, 0.5, 0.85, 1] } }
    ],
    jugador: {
      puntosPreparacion: 6,
      escalaBatna: [25, 60],
      batnas: [
        { id: 'turco', corto: 'el proveedor turco', texto: 'Importar de un proveedor turco: 870 €/t, pago a 30 días y entregas poco fiables', valor: 34, conocida: true },
        { id: 'interna', corto: 'fabricarla nosotros', texto: 'Fabricar la chapa en la planta de Zaragoza', valor: 18, valorAparente: 52, conocida: true },
        { id: 'portugues', corto: 'la acería de Aveiro', texto: 'Acería de Aveiro (Portugal): 830 €/t, pago a 45 días, hasta 12.000 t', valor: 48, conocida: false }
      ]
    },
    contrapartes: [{
      id: 'jordi',
      nombre: 'Jordi Puig',
      cargo: 'Director comercial · Aceros Levante',
      edad: 56,
      avatar: { semilla: 11, genero: 'h', piel: 1, pelo: 'corto', colorPelo: '#8d8d8d', canas: 0.7, gafas: 'cuadradas', barba: 'perilla', ropa: 'blazer', colorRopa: '#3a4d6e', colorCamisa: '#e8eef6', corbata: '#8a2f3c', cara: 'cuadrada' },
      personalidad: 'analitica',
      pesos: { precio: 0.35, plazo: 0.45, volumen: 0.20 },
      curvas: { precio: 'asc', plazo: 'desc', volumen: 'asc' },
      reserva: 42, aspiracion: 86, paciencia: 10, confianza: 50, tension: 15,
      batna: { texto: 'Colocar el excedente en un cliente alemán con mucho menos margen', valor: 42 },
      susceptibilidad: { anclaje: 0.4, perdida: 0.2 },
      intereses: [
        { id: 'tesoreria', variable: 'plazo', importancia: 'alta', direccion: 'opuesta', titulo: 'Tesorería ajustada',
          texto: 'Aceros Levante tiene tensiones de tesorería tras invertir en un horno nuevo: cobrar pronto es vital para ellos.',
          confesion: 'Le seré sincero: con la inversión en el horno nuevo, cobrar antes nos daría un respiro enorme.' },
        { id: 'laminado', variable: 'volumen', importancia: 'media', direccion: 'igual', titulo: 'Quieren más volumen',
          texto: 'Tienen una línea de laminado nueva que llenar: más volumen les interesa tanto como a ti.',
          confesion: 'Entre nosotros: tenemos una línea de laminado nueva que necesitamos llenar. Más volumen nos vendría muy bien.' },
        { id: 'margen', variable: 'precio', importancia: 'media', direccion: 'opuesta', titulo: 'El precio no lo es todo',
          texto: 'El precio les importa, pero ya han aplicado la bajada del índice a otros clientes: hay margen.',
          confesion: 'El precio importa, claro… aunque sé que el índice ha bajado y otros clientes ya lo han notado.' }
      ],
      dialogos: {
        saludo: ['Buenos días. He traído los números del año; seguro que nos entendemos.'],
        invita: ['Ustedes pidieron revisar el contrato. Les escucho: ¿qué proponen?']
      }
    }],
    investigacion: [
      { id: 'cuentas', titulo: 'Analizar sus cuentas anuales', descripcion: 'Balance y flujo de caja de Aceros Levante en el Registro Mercantil.', coste: 2, clave: true, icono: 'grafico',
        revela: { interes: 'tesoreria' } },
      { id: 'alternativas', titulo: 'Sondear proveedores alternativos', descripcion: 'Pedir oferta formal a otras acerías de la península.', coste: 2, clave: true, icono: 'brujula',
        revela: { batna: 'portugues' } },
      { id: 'indice', titulo: 'Consultar el índice del acero', descripcion: 'Evolución del precio de referencia de la bobina laminada.', coste: 1, icono: 'indice',
        revela: { criterio: 'indice-acero' } },
      { id: 'verificar', titulo: 'Pedir a Producción el coste de fabricar dentro', descripcion: '¿Es real la opción de fabricar la chapa en Zaragoza?', coste: 1, icono: 'fabrica',
        revela: { verifica: 'interna' }, nota: { texto: 'Producción calcula un sobrecoste del 22 % y ocho meses de puesta en marcha: fabricar dentro no es una alternativa real (18 pts).' } },
      { id: 'reputacion', titulo: 'Preguntar por Jordi a otros clientes', descripcion: 'Cómo negocia, qué valora, cómo reacciona.', coste: 1, icono: 'persona',
        revela: { personalidad: 'jordi' }, nota: { texto: 'Analítico: decide con datos y desconfía de la presión. Un argumento objetivo vale más que una amenaza.' } },
      { id: 'feria', titulo: 'Charlar con un técnico suyo en la feria', descripcion: 'Información informal sobre sus planes de producción.', coste: 1, icono: 'cafe',
        revela: { interes: 'laminado' } }
    ],
    criterios: [
      { id: 'indice-acero', nombre: 'índice del acero', texto: 'El índice de referencia de la bobina laminada cayó un 6 % el último trimestre: el mercado ronda los 800–820 €/t.' }
    ],
    preguntas: [
      { id: 'preocupa', tipo: 'abierta', texto: '¿Qué es lo que más le preocupa de esta renovación?', confianzaMin: 48, revela: { interes: 'tesoreria' },
        respuestas: { abierta: 'Si le soy franco… el circulante. Hemos invertido mucho en el horno nuevo y cobrar a 60 o 90 días nos ahoga.', evasiva: 'Lo normal: que el contrato sea rentable para nosotros.' } },
      { id: 'planes', tipo: 'abierta', texto: '¿Cómo encaja nuestro volumen en sus planes de producción?', confianzaMin: 38, revela: { interes: 'laminado' },
        respuestas: { abierta: 'Tenemos una línea de laminado nueva que necesitamos llenar. Más volumen nos vendría muy bien, la verdad.', evasiva: 'Bien, bien. Eso ya lo veremos.' } },
      { id: 'sin-acuerdo', tipo: 'abierta', texto: '¿Qué harían con ese acero si no llegamos a un acuerdo?', confianzaMin: 56,
        revela: { pista: 'Si no hay acuerdo tendrían que vender en Alemania con mucho menos margen: su alternativa no es brillante.', titulo: 'Su BATNA es débil', quien: 'jordi' },
        respuestas: { abierta: 'Tendríamos que colocarlo fuera, en Alemania… con bastante menos margen, no le voy a engañar.', evasiva: 'Clientes no nos faltan, no se preocupe.' } },
      { id: 'subida', tipo: 'abierta', texto: '¿Cómo han calculado la subida de precio que plantean?', confianzaMin: 50, revela: { interes: 'margen' },
        respuestas: { abierta: 'Por la energía, sobre todo… aunque sé que el índice ha bajado. Otros clientes ya han renegociado.', evasiva: 'Con nuestros costes, que no son públicos.' } },
      { id: 'abuso', tipo: 'sugestiva', texto: '¿No le parece que están abusando un poco con el precio?',
        respuestas: { evasiva: '¿Abusando? Le recuerdo que llevamos ocho años sin fallarle ni una entrega.' } },
      { id: 'mantener', tipo: 'cerrada', texto: '¿Pueden mantener el precio actual?', confianzaMin: 30,
        respuestas: { abierta: 'Depende del resto de condiciones.', evasiva: 'Ya veremos.' } }
    ],
    informacion: [
      { id: 'prioridades', tipo: 'prioridades', variables: ['precio', 'plazo'], texto: 'Explicar que el precio es vuestra prioridad y el plazo de pago os importa menos',
        dicho: 'Para nosotros lo crítico es el precio. El plazo de pago, siendo sinceros, nos preocupa bastante menos.' },
      { id: 'crecimiento', tipo: 'prioridades', variables: ['volumen'], texto: 'Contar que la nueva línea podría absorber más volumen',
        dicho: 'Vamos a lanzar una línea nueva de frigoríficos: podríamos necesitar bastante más volumen.' },
      { id: 'alternativa', tipo: 'batna', texto: 'Mencionar, sin amenazar, que estás evaluando otras opciones',
        dicho: 'Quiero ser transparente: estamos evaluando otras opciones de suministro, aunque preferimos seguir con ustedes.' },
      { id: 'limite', tipo: 'reserva', texto: 'Confesar hasta dónde puedes llegar',
        dicho: 'Con total franqueza: tenemos un límite y no podemos pasar de ahí. Estamos cerca.' },
      { id: 'prisa', tipo: 'plazo', texto: 'Contar que necesitas cerrar antes del jueves',
        dicho: 'Necesito cerrar esto antes del jueves; tenemos comité de dirección.' }
    ],
    eventos: [
      {
        id: 'llamada', tipo: 'movil', quien: 'jordi', icono: 'movil', temporizador: 15,
        cuando: { turnoMin: 2, turnoMax: 5, prob: 0.45 },
        titulo: 'El móvil de Jordi vibra',
        texto: 'Jordi mira la pantalla y sonríe: «Perdone, es un cliente alemán… muy interesado en nuestro excedente». Deja el móvil bocabajo y te mira.',
        opciones: [
          { id: 'preguntar', estilo: 'calma', texto: 'Preguntar con calma si eso cambia algo para ellos',
            efectos: { confianza: 2, revelar: { pista: 'El «cliente alemán» paga bastante menos: su alternativa existe, pero con mucho menor margen.', titulo: 'Su alternativa', quien: 'jordi' } },
            respuesta: { quien: 'jordi', texto: 'Bueno… pagan menos, para qué le voy a engañar. Pero es una opción.' },
            juicio: 'acierto', conceptos: ['batna'], explicacion: 'Ante una amenaza implícita preguntaste en lugar de reaccionar, y descubriste que su alternativa es peor de lo que aparentaba.' },
          { id: 'ceder', estilo: 'ceder', texto: 'Mejorar tu propuesta cuanto antes para no perder el acuerdo',
            efectos: { aspiracion: 5, confianza: -2 },
            respuesta: { quien: 'jordi', texto: 'Vaya, veo que tienen prisa por cerrar. Interesante.' },
            juicio: 'error', sesgo: 'aversionPerdida', conceptos: ['batna'], explicacion: 'El miedo a perder el acuerdo te hizo mostrar debilidad sin que nadie te lo pidiera. Un simple «tengo otra oferta» explota la aversión a la pérdida.' },
          { id: 'ignorar', estilo: 'neutral', texto: 'Ignorarlo y seguir con tu argumento',
            efectos: {},
            juicio: 'neutral', explicacion: 'No reaccionar a la presión es razonable, aunque una pregunta te habría dado información valiosa sobre su alternativa.' }
        ],
        porDefecto: 'ignorar'
      },
      {
        id: 'cfo', tipo: 'mensaje', quien: 'cfo', icono: 'mensaje', temporizador: 20,
        cuando: { turnoMin: 4, prob: 0.7 },
        titulo: 'Mensaje de tu director financiero',
        texto: '«El comité es el jueves. Necesito el contrato del acero cerrado YA, como sea.»',
        opciones: [
          { id: 'plan', estilo: 'calma', texto: 'Mantener tu plan: un buen acuerdo vale más que uno rápido',
            efectos: {}, juicio: 'acierto', conceptos: ['punto-reserva'],
            explicacion: 'La presión de tiempo activa el pensamiento rápido (Sistema 1, Kahneman). Mantener tu punto de reserva te protege de cerrar mal.' },
          { id: 'bajar', estilo: 'ceder', texto: 'Bajar tu punto de reserva para cerrar cuanto antes',
            efectos: { reservaJugador: -10 }, juicio: 'error', conceptos: ['punto-reserva'],
            explicacion: 'Cambiaste tu límite por presión interna, no por información nueva. Tu BATNA no había cambiado: tu reserva tampoco debía hacerlo.' },
          { id: 'contar', estilo: 'revelar', texto: 'Decirle a Jordi que necesitas cerrar antes del jueves',
            efectos: { aspiracion: 5, confianza: 1 },
            respuesta: { quien: 'jordi', texto: 'Ah, ¿antes del jueves? Bueno, nosotros no tenemos tanta prisa.' },
            juicio: 'error', conceptos: ['informacion-asimetrica'], explicacion: 'Revelar tu urgencia regala poder: quien conoce tu fecha límite puede permitirse esperar.' },
          { id: 'nada', estilo: 'neutral', texto: 'Dejarlo para luego', efectos: { reservaJugador: -4 }, juicio: 'neutral',
            explicacion: 'No decidir también es decidir: la presión se quedó contigo y te volviste algo más conformista.' }
        ],
        porDefecto: 'nada'
      }
    ],
    dialogos: {},
    partidaModelo: {
      semilla: 4242,
      preparacion: {
        investigar: ['cuentas', 'alternativas', 'indice', 'reputacion'],
        definir: { batnaId: 'portugues', reserva: 48, objetivo: 82, apertura: [0, 1, 3] }
      },
      introduccion: 'Así jugaría una negociadora experta. Fíjate en el orden: primero información y confianza, después un ancla ambiciosa y justificada, y solo al final las concesiones, siempre en lo que a ti te importa poco.',
      comentariosPreparacion: [
        'Invierte en las dos fichas clave: las cuentas de Aceros Levante (revelan su problema de tesorería) y los proveedores alternativos (mejoran su BATNA de 34 a 48 puntos).',
        'Con el punto restante consulta el índice del acero: un criterio objetivo para justificar el precio. Y conoce a Jordi: es analítico.',
        'No elige «fabricar dentro» como BATNA: parece valer 52, pero nadie lo ha verificado. Su reserva coincide con su BATNA real (48) y su objetivo es ambicioso (82).'
      ],
      pasos: [
        { accion: { tipo: 'compartir', id: 'prioridades' }, comentario: 'Empieza compartiendo prioridades, no límites: el precio le importa mucho y el plazo de pago poco. Jordi gana confianza y puede proponer intercambios.' },
        { accion: { tipo: 'pregunta', id: 'planes' }, comentario: 'Pregunta abierta sobre sus planes. Descubre que el volumen interesa a ambos: es una cuestión compatible, no hay que «pelearla».' },
        { accion: { tipo: 'oferta', paquete: [0, 1, 3], criterio: 'indice-acero' }, comentario: 'Ancla ambiciosa pero creíble (780 €, 45 días, 14.000 t) y justificada con el índice del acero. Jordi, analítico, la toma en serio.' },
        { accion: { tipo: 'pregunta', id: 'preocupa' }, comentario: 'Confirma lo que ya intuía por las cuentas: la tesorería les ahoga. El plazo de pago es su prioridad… y para ti vale poco.' },
        { accion: { tipo: 'concesion', variable: 1 }, comentario: 'Ahora sí, una concesión pequeña y en lo que menos le importa: pago a 30 días. Para Jordi vale muchísimo; para ella, apenas nada.' },
        { accion: { tipo: 'aceptar' }, comentario: 'Cuando la propuesta de Jordi supera su objetivo, cierra. Intentar exprimir más arriesgaría la relación con un proveedor clave.' }
      ],
      eventos: { llamada: 'preguntar', cfo: 'plan' }
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
