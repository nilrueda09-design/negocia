/* =====================================================================
 * NEGOCIA · Escenario 4 · «Conservas Ferrán» (adquisición)
 * Enseña: ZOPA, creación de valor con muchas variables, contratos
 * contingentes (earn-out) e información asimétrica. Un asesor da
 * consejos… no siempre buenos: hay que contrastarlos.
 * Estructura oculta: Ramón cree en el futuro de su línea gourmet (le
 * gusta el earn-out, que a ti te reduce riesgo: cuestión compatible);
 * su legado (papel, plantilla, marca) pesa tanto como el precio; la
 * marca «Ferrán» también tiene valor para Atlas. La due diligence
 * destapa una contingencia fiscal que reduce lo que vale para ti.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};

  NG.Escenarios.registrar({
    id: 'e4-adquisicion',
    orden: 4,
    titulo: 'Conservas Ferrán',
    subtitulo: 'Comprar una empresa familiar',
    dificultad: 4,
    duracionMin: 18,
    quienAbre: 'jugador',
    escena: { preparacion: 'despacho', negociacion: 'sala-adquisicion' },
    conceptos: ['zopa', 'contratos-contingentes', 'informacion-asimetrica', 'crear-valor', 'intereses-posiciones', 'sistema-1-2'],
    asesor: { nombre: 'Íñigo Larrea', cargo: 'Tu asesor de M&A', avatar: { semilla: 61, genero: 'h', piel: 1, pelo: 'corto', colorPelo: '#3a281d', gafas: 'cuadradas', barba: null, ropa: 'traje', colorRopa: '#26324a', colorCamisa: '#dfe9f5', corbata: '#8a2f3c', edad: 41, cara: 'cuadrada' } },
    briefing: {
      rol: 'Dirección de Desarrollo Corporativo · Grupo Atlas (alimentación)',
      contexto: 'Atlas quiere comprar Conservas Ferrán, una conservera gallega con 80 años de historia y una línea gourmet prometedora. Su fundador, Ramón Ferrán, tiene 68 años y ningún hijo quiere seguir… aunque su hija dirige la línea nueva. Te acompaña Íñigo, tu asesor. Sus consejos no siempre son buenos.',
      meta: 'Cierra la compra en condiciones razonables: múltiplo de precio, earn-out, papel del fundador, garantía de empleo y marca. O retírate si deja de tener sentido.',
      aprenderas: ['A calcular la ZOPA cuando hay muchas variables', 'A usar contratos contingentes cuando las partes ven el futuro distinto', 'A gestionar la información asimétrica (y la due diligence)', 'A contrastar consejos en lugar de seguirlos por autoridad']
    },
    notasIniciales: [
      { tipo: 'dato', titulo: 'La empresa', texto: '210 empleados en Vigo · EBITDA de 6 M€ · marca muy conocida en Galicia · línea gourmet en crecimiento.' },
      { tipo: 'dato', titulo: 'Tu consejo de administración', texto: '«Que no pase de 6,5 veces EBITDA sin una muy buena razón.»' }
    ],
    variables: [
      { id: 'precio', nombre: 'Precio (múltiplo de EBITDA)', icono: 'euro', opciones: ['5×', '5,5×', '6×', '6,5×', '7×', '7,5×'], statusQuo: 3,
        jugador: { peso: 0.40, curva: 'desc' } },
      { id: 'earnout', nombre: 'Earn-out (pago ligado a resultados)', icono: 'grafico', opciones: ['Sin earn-out', '10 %', '20 %', '30 %'], statusQuo: 0,
        jugador: { peso: 0.15, curva: [0, 0.5, 0.85, 1] } },
      { id: 'papel', nombre: 'Papel del fundador', icono: 'persona', opciones: ['Sale el primer día', 'Asesor un año', 'Presidente de honor tres años'], statusQuo: 0,
        jugador: { peso: 0.10, curva: [1, 0.8, 0.4] } },
      { id: 'empleo', nombre: 'Garantía de empleo', icono: 'personas', opciones: ['Sin garantía', 'Dos años', 'Cinco años'], statusQuo: 0,
        jugador: { peso: 0.20, curva: [1, 0.6, 0] } },
      { id: 'marca', nombre: 'Marca', icono: 'bandera', opciones: ['Se integra en Atlas', 'Se mantiene «Ferrán»'], statusQuo: 0,
        jugador: { peso: 0.15, curva: [0.2, 1] } }
    ],
    jugador: {
      puntosPreparacion: 6,
      escalaBatna: [20, 50],
      batnas: [
        { id: 'organico', corto: 'crecer por nuestra cuenta', texto: 'Crecer orgánicamente en conservas: cuatro años y bastante más riesgo', valor: 30, conocida: true },
        { id: 'fondo', corto: 'una oferta hostil con un fondo', texto: 'Aliarse con un fondo para presionar con una oferta hostil', valor: 18, valorAparente: 54, conocida: true },
        { id: 'cantabrico', corto: 'Conservas del Cantábrico', texto: 'Comprar Conservas del Cantábrico: más pequeña, peor marca, pero disponible', valor: 42, conocida: false }
      ]
    },
    contrapartes: [{
      id: 'ramon',
      nombre: 'Ramón Ferrán',
      cargo: 'Fundador y presidente · Conservas Ferrán',
      edad: 68,
      avatar: { semilla: 47, genero: 'h', piel: 2, pelo: 'calvo', colorPelo: '#dedede', canas: 1, gafas: 'redondas', barba: 'bigote', ropa: 'traje', colorRopa: '#4b4f58', colorCamisa: '#f4ece0', corbata: '#2e4a43', cara: 'redonda', edad: 68 },
      personalidad: 'emocional',
      pesos: { precio: 0.25, earnout: 0.10, papel: 0.25, empleo: 0.25, marca: 0.15 },
      curvas: { precio: 'asc', earnout: [0.3, 0.6, 1, 0.85], papel: 'asc', empleo: 'asc', marca: 'asc' },
      reserva: 47, aspiracion: 92, paciencia: 10, confianza: 48, tension: 25,
      batna: { texto: 'Vender a un fondo de capital riesgo que trocearía la empresa (lo que más teme)', valor: 45 },
      susceptibilidad: { anclaje: 0.25, perdida: 0.35 },
      intereses: [
        { id: 'legado', variable: 'papel', importancia: 'alta', direccion: 'opuesta', titulo: 'Su legado',
          texto: 'Ochenta años de historia familiar: necesita sentir que sigue vinculado, al menos simbólicamente.',
          confesion: 'Esta empresa la fundó mi padre en 1952. No quiero desaparecer de un día para otro como si nunca hubiera existido.' },
        { id: 'plantilla', variable: 'empleo', importancia: 'alta', direccion: 'opuesta', titulo: 'Su gente',
          texto: 'Conoce a casi todos sus empleados por su nombre. Garantizar el empleo le importa tanto como el precio.',
          confesion: 'Le diré algo: muchos de mis trabajadores eran ya hijos de trabajadores de mi padre. No puedo venderles.' },
        { id: 'marca-viva', variable: 'marca', importancia: 'media', direccion: 'igual', titulo: 'Que la marca siga viva',
          texto: 'Quiere que «Ferrán» siga en las latas. A Atlas también le interesa: la marca vale dinero.' },
        { id: 'futuro', variable: 'earnout', importancia: 'media', direccion: 'igual', titulo: 'Cree en la línea gourmet',
          texto: 'Está convencido de que la línea gourmet duplicará ventas: un pago ligado a resultados no le asusta, le parece justo.' }
      ],
      dialogos: {
        saludo: ['Bienvenidos a casa. Aquí empezó todo, ¿sabe? En esta misma sala.'],
        invita: ['Ustedes vienen a comprar. Les escucho.']
      }
    }],
    investigacion: [
      { id: 'hija', titulo: 'Conversar con Lucía Ferrán, su hija', descripcion: 'Dirige la línea gourmet y conoce a su padre mejor que nadie.', coste: 2, clave: true, icono: 'personas',
        revela: { interes: ['legado', 'futuro'] } },
      { id: 'fabrica', titulo: 'Visitar la fábrica y hablar con el comité', descripcion: 'Cómo es la relación entre el fundador y la plantilla.', coste: 1, icono: 'fabrica',
        revela: { interes: 'plantilla' } },
      { id: 'comparables', titulo: 'Estudiar operaciones comparables', descripcion: 'A qué múltiplos se han vendido conserveras similares.', coste: 1, icono: 'indice',
        revela: { criterio: 'multiplos-sector' } },
      { id: 'alternativa', titulo: 'Explorar otras empresas a la venta', descripcion: '¿Hay alguna alternativa real a Ferrán?', coste: 2, clave: true, icono: 'brujula',
        revela: { batna: 'cantabrico' } },
      { id: 'verificar-fondo', titulo: 'Consultar la vía hostil con los abogados', descripcion: '¿Es viable presionar con un fondo?', coste: 1, icono: 'escudo',
        revela: { verifica: 'fondo' }, nota: { texto: 'Imposible: la familia controla el 100 % del capital. No hay oferta hostil que valga (18 pts).' } },
      { id: 'perfil', titulo: 'Leer entrevistas a Ramón', descripcion: 'Su forma de pensar y de decidir.', coste: 1, icono: 'libro',
        revela: { personalidad: 'ramon' }, nota: { texto: 'Emocional: decide con el corazón. Se ofende si siente que se desprecia su obra; se abre si se siente escuchado.' } }
    ],
    criterios: [
      { id: 'multiplos-sector', nombre: 'múltiplos del sector', texto: 'Las conserveras comparables se han vendido entre 5,5 y 6,5 veces su EBITDA en los últimos tres años.' }
    ],
    preguntas: [
      { id: 'despues', tipo: 'abierta', texto: '¿Cómo se imagina su vida y la de la empresa dentro de cinco años?', confianzaMin: 46, revela: { interes: 'legado' },
        respuestas: { abierta: 'Me gustaría seguir pasándome por aquí. Que la gente me salude. Que esto siga siendo «Ferrán», aunque ya no sea mío.', evasiva: 'Jubilado, supongo. Como todos.' } },
      { id: 'trabajadores', tipo: 'abierta', texto: '¿Qué le preocupa de su equipo en esta operación?', confianzaMin: 42, revela: { interes: 'plantilla' },
        respuestas: { abierta: 'Que los echen. Que vengan ustedes con sus consultores y en un año no quede nadie de los de siempre.', evasiva: 'Mi equipo es asunto mío.' } },
      { id: 'gourmet', tipo: 'abierta', texto: '¿Qué espera de la línea gourmet en los próximos años?', confianzaMin: 38, revela: { interes: 'futuro' },
        respuestas: { abierta: 'Que doble las ventas. Lo tengo clarísimo: si quieren, me juego parte del precio a que lo hace.', evasiva: 'Va bien. Mejor de lo que ustedes creen.' } },
      { id: 'marca', tipo: 'abierta', texto: '¿Qué significa para usted la marca Ferrán?', confianzaMin: 40, revela: { interes: 'marca-viva' },
        respuestas: { abierta: 'Es el apellido de mi padre. Ver «Ferrán» en las latas del supermercado… eso no tiene precio. Bueno, sí lo tiene.', evasiva: 'Una marca. Valiosa.' } },
      { id: 'caro', tipo: 'sugestiva', texto: '¿No le parece que pide demasiado por una empresa tan tradicional?',
        respuestas: { evasiva: '¿Tradicional? ¿Sabe lo que es mantener una empresa viva ochenta años? Por favor.' } },
      { id: 'seis', tipo: 'cerrada', texto: '¿Aceptaría seis veces EBITDA?', confianzaMin: 30,
        respuestas: { abierta: 'Depende de lo que venga con ello.', evasiva: 'No lo sé.' } }
    ],
    informacion: [
      { id: 'respeto', tipo: 'prioridades', variables: ['marca', 'earnout'], texto: 'Contar que queréis mantener la marca y apostar por la línea gourmet',
        dicho: 'Queremos que Ferrán siga siendo Ferrán: la marca es parte de lo que compramos. Y creemos en la línea gourmet tanto como ustedes.' },
      { id: 'precio-clave', tipo: 'prioridades', variables: ['precio', 'empleo'], texto: 'Explicar que el precio es vuestra principal restricción y que el empleo os preocupa por su coste',
        dicho: 'Para ser transparentes: el precio es nuestra mayor restricción, y las garantías de empleo muy largas nos preocupan por su coste.' },
      { id: 'consejo', tipo: 'restriccion', texto: 'Explicar que vuestro consejo no aprobará más de 6,5× sin una buena razón',
        dicho: 'Mi consejo no aprobará más de 6,5 veces EBITDA sin una muy buena razón. Es un límite real.' },
      { id: 'alternativa', tipo: 'batna', texto: 'Mencionar que estáis estudiando otras operaciones',
        dicho: 'No es la única operación que estudiamos, aunque Ferrán es nuestra preferida.' },
      { id: 'limite', tipo: 'reserva', texto: 'Confesar el máximo que podríais pagar',
        dicho: 'Mire, como máximo absoluto llegaríamos a siete veces. De ahí no pasamos.' }
    ],
    eventos: [
      {
        id: 'asesor-ancla', tipo: 'asesor', quien: 'asesor', icono: 'persona',
        cuando: { turnoMin: 1, turnoMax: 2, prob: 0.9 },
        titulo: 'Íñigo te susurra',
        texto: '«Abre en 4,5 veces. Siempre lo hacemos así: el vendedor se asusta y luego subimos un poco.»',
        opciones: [
          { id: 'seguir', estilo: 'presion', texto: 'Seguir el consejo: decirle a Ramón que la empresa no vale más de 4,5 veces',
            efectos: { confianza: -14, tension: 24 }, respuesta: { quien: 'ramon', texto: '¿Cuatro y medio? ¿Me está tomando el pelo en mi propia casa?' },
            juicio: 'error', sesgo: 'confirmacion', conceptos: ['anclaje'], explicacion: 'Seguiste un consejo por autoridad, sin datos. Un ancla fuera del rango del mercado (5,5–6,5×) no ancla: ofende, sobre todo a un fundador emocional.' },
          { id: 'contrastar', estilo: 'contrastar', texto: 'Pedirle a Íñigo los datos que sostienen esa cifra',
            efectos: { revelar: { criterio: 'multiplos-sector' } }, respuesta: { quien: 'asesor', texto: 'Bueno… los comparables están entre 5,5 y 6,5. Lo del 4,5 era más bien táctico.' },
            juicio: 'acierto', conceptos: ['criterios-objetivos'], explicacion: 'Contrastaste el consejo con datos y descubriste que no se sostenía. Los criterios objetivos protegen de los consejos «de experto».' },
          { id: 'ignorar', estilo: 'neutral', texto: 'Ignorar el consejo y seguir con tu plan', efectos: {},
            juicio: 'neutral', explicacion: 'No seguirlo fue prudente; preguntarle en qué se basaba te habría dado información.' }
        ],
        porDefecto: 'ignorar'
      },
      {
        id: 'due-diligence', tipo: 'mensaje', quien: 'asesor', icono: 'mensaje', temporizador: 22,
        cuando: { turnoMin: 3, prob: 0.85 },
        titulo: 'Resultado de la due diligence',
        texto: 'El equipo jurídico ha encontrado una contingencia fiscal de 2 M€ que no está provisionada. Cambia lo que vale la empresa para ti.',
        opciones: [
          { id: 'plantear', estilo: 'honesto', texto: 'Plantearla con datos y proponer cubrir el riesgo con un earn-out o una garantía',
            efectos: { perfilJugador: { curvas: { precio: [1, 0.78, 0.55, 0.3, 0.08, 0] }, pesos: { earnout: 0.22, precio: 0.4 }, aviso: 'La contingencia fiscal reduce lo que vale la empresa: los múltiplos altos te valen menos y el earn-out, más.' }, confianza: 3 },
            respuesta: { quien: 'ramon', texto: 'Esa inspección es de hace años… Pero de acuerdo, entiendo que quieran cubrirse.' },
            juicio: 'acierto', conceptos: ['informacion-asimetrica', 'contratos-contingentes'], explicacion: 'Planteaste la nueva información sin atacar y con una solución: un contrato contingente reparte el riesgo en lugar de pelearlo.' },
          { id: 'arma', estilo: 'presion', texto: 'Usarla como arma para hundir el precio',
            efectos: { perfilJugador: { curvas: { precio: [1, 0.78, 0.55, 0.3, 0.08, 0] }, pesos: { earnout: 0.22, precio: 0.4 }, aviso: 'La contingencia fiscal reduce lo que vale la empresa: los múltiplos altos te valen menos y el earn-out, más.' }, confianza: -12, tension: 22 },
            respuesta: { quien: 'ramon', texto: '¿Ahora resulta que vendo una empresa podrida? Qué poca vergüenza.' },
            juicio: 'error', conceptos: ['principios'], explicacion: 'La información era legítima, pero usarla como golpe atacó a la persona en lugar del problema.' },
          { id: 'ignorar', estilo: 'neutral', texto: 'No decir nada y seguir como si nada',
            efectos: { perfilJugador: { curvas: { precio: [1, 0.78, 0.55, 0.3, 0.08, 0] }, pesos: { earnout: 0.22, precio: 0.4 }, aviso: 'La contingencia fiscal reduce lo que vale la empresa: los múltiplos altos te valen menos y el earn-out, más.' } },
            juicio: 'error', sesgo: 'confirmacion', conceptos: ['informacion-asimetrica'], explicacion: 'Ignoraste información que contradecía tu valoración: es sesgo de confirmación. Tu hoja de puntos ha cambiado aunque no quieras verlo.' }
        ],
        porDefecto: 'ignorar'
      },
      {
        id: 'asesor-earnout', tipo: 'asesor', quien: 'asesor', icono: 'persona',
        cuando: { turnoMin: 4, prob: 0.7 },
        titulo: 'Íñigo te pasa una nota',
        texto: '«Ramón está convencido de que la línea gourmet va a duplicar ventas. Si tanto cree en ella, ofrécele un earn-out.»',
        opciones: [
          { id: 'seguir', estilo: 'calma', texto: 'Seguir el consejo: preguntarle a Ramón si apostaría parte del precio a esa línea',
            efectos: { revelar: { interes: 'futuro' }, confianza: 3 }, respuesta: { quien: 'ramon', texto: '¿Apostar? Encantado. Yo sé lo que vale esa línea.' },
            juicio: 'acierto', conceptos: ['contratos-contingentes'], explicacion: 'Buen consejo y bien usado: cuando las partes ven el futuro de forma distinta, un contrato contingente convierte el desacuerdo en un acuerdo.' },
          { id: 'ignorar', estilo: 'neutral', texto: 'Descartarlo: los earn-outs complican la operación', efectos: {},
            juicio: 'error', sesgo: 'confirmacion', conceptos: ['contratos-contingentes'], explicacion: 'Este consejo sí era bueno. Los consejos se evalúan por sus argumentos, no por quién los da: ni todos son buenos ni todos son malos.' }
        ],
        porDefecto: 'ignorar'
      },
      {
        id: 'asesor-familia', tipo: 'asesor', quien: 'asesor', icono: 'persona',
        cuando: { turnoMin: 5, prob: 0.6 },
        titulo: 'Íñigo, en voz baja',
        texto: '«No pierdas tiempo con la plantilla ni con la marca: son sentimentalismos. Céntrate en el precio.»',
        opciones: [
          { id: 'seguir', estilo: 'presion', texto: 'Seguir el consejo y negociar solo el precio a partir de ahora',
            efectos: { aspiracion: 3 }, juicio: 'error', sesgo: 'confirmacion', conceptos: ['intereses-posiciones'], explicacion: 'Para Ramón, plantilla y legado son intereses centrales, no sentimentalismos. Ignorarlos convierte una negociación integrativa en un pulso por el precio.' },
          { id: 'contrastar', estilo: 'contrastar', texto: 'Recordarle a Íñigo lo que ha dicho Ramón de su gente y seguir con tu enfoque',
            efectos: {}, respuesta: { quien: 'asesor', texto: 'Vale, vale… tú le has escuchado más que yo.' },
            juicio: 'acierto', conceptos: ['intereses-posiciones'], explicacion: 'Contrastaste el consejo con lo que sabías de la otra parte. Un experto no conoce mejor que tú lo que has escuchado en la mesa.' }
        ],
        porDefecto: 'seguir'
      },
      {
        id: 'coste-hundido', tipo: 'mensaje', quien: 'ceo', icono: 'mensaje', temporizador: 18,
        cuando: { turnoMin: 6, prob: 0.6 },
        titulo: 'Mensaje de tu CEO',
        texto: '«Llevamos ocho meses y 400.000 € en asesores con esta operación. Ciérrala como sea.»',
        opciones: [
          { id: 'evaluar', estilo: 'calma', texto: 'Evaluar el acuerdo solo por lo que vale a partir de hoy',
            efectos: {}, juicio: 'acierto', conceptos: ['punto-reserva'], explicacion: 'Lo gastado no vuelve: la única pregunta es si este acuerdo es mejor que tu alternativa a partir de hoy.' },
          { id: 'cerrar', estilo: 'ceder', texto: 'Cerrar aunque haya que pasarse de tu límite',
            efectos: { reservaJugador: -12 }, juicio: 'error', sesgo: 'costeHundido', conceptos: ['punto-reserva'], explicacion: 'Dejaste que el dinero ya gastado moviera tu límite: es la falacia del coste hundido.' }
        ],
        porDefecto: 'cerrar'
      }
    ],
    dialogos: {},
    partidaModelo: {
      semilla: 1005,
      preparacion: {
        investigar: ['hija', 'alternativa', 'comparables', 'fabrica'],
        definir: { batnaId: 'cantabrico', reserva: 42, objetivo: 72, apertura: [0, 3, 2, 1, 1] }
      },
      introduccion: 'Con cinco variables y un fundador emocional, el precio es solo una parte. La negociadora experta respeta el legado de Ramón, usa el earn-out para salvar la diferencia de expectativas y no se deja llevar por los consejos sin datos.',
      comentariosPreparacion: [
        'Habla con la hija de Ramón: descubre su legado y su fe en la línea gourmet.',
        'Explora alternativas: Conservas del Cantábrico mejora su BATNA a 42 puntos.',
        'Estudia los comparables (5,5–6,5×) y visita la fábrica: la plantilla le importa mucho a Ramón.',
        'Prepara una apertura que hable de su legado, no solo de dinero: 5× con un earn-out del 30 %, presidencia de honor, dos años de empleo garantizado y la marca intacta.'
      ],
      pasos: [
        { accion: { tipo: 'pregunta', id: 'despues' }, comentario: 'Primero, escuchar: ¿cómo se imagina el futuro? Ramón habla de su legado. Para un fundador emocional, sentirse escuchado es el primer pago.' },
        { accion: { tipo: 'compartir', id: 'respeto' }, comentario: 'Comparte prioridades compatibles: queréis mantener la marca y creéis en la línea gourmet. Ramón descubre que no sois «los de los consultores».' },
        { accion: { tipo: 'pregunta', id: 'trabajadores' }, comentario: 'Pregunta por su gente: confirma que la plantilla le importa tanto como el precio.' },
        { accion: { tipo: 'oferta', paquete: [0, 3, 2, 1, 1], criterio: 'multiplos-sector' }, comentario: 'Oferta que paga en lo que él valora: 5× más un 30 % ligado a la línea gourmet (si es tan buena como dice, cobrará más; si no, Atlas no sobrepaga), presidencia de honor, dos años de empleo y la marca.' },
        { accion: { tipo: 'concesion', variable: 0, pedir: 1 }, comentario: 'Si pide más, una concesión pequeña y explícita en el múltiplo (5,5×), sin tocar la estructura contingente.' },
        { accion: { tipo: 'aceptar' }, comentario: 'Cuando su propuesta supera el objetivo, cierra: un buen acuerdo para Atlas que Ramón puede firmar con orgullo.' }
      ],
      eventos: { 'asesor-ancla': 'contrastar', 'due-diligence': 'plantear', 'asesor-earnout': 'seguir', 'asesor-familia': 'contrastar', 'coste-hundido': 'evaluar' }
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
