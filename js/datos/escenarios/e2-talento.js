/* =====================================================================
 * NEGOCIA · Escenario 2 · «La oferta» (retención de talento)
 * Enseña: intereses frente a posiciones y valor no monetario.
 * Estructura oculta: Samuel pide +20 % (posición), pero lo que necesita
 * es teletrabajar para cuidar de su padre y liderar algo propio
 * (intereses). El rol de IA es una cuestión COMPATIBLE; el teletrabajo
 * vale poco para la empresa y mucho para él; la permanencia vale mucho
 * para la empresa y poco para él.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};

  NG.Escenarios.registrar({
    id: 'e2-talento',
    orden: 2,
    titulo: 'La oferta',
    subtitulo: 'Retener a un empleado estrella',
    dificultad: 2,
    duracionMin: 14,
    quienAbre: 'contraparte',
    escena: { preparacion: 'despacho', negociacion: 'oficina-rrhh' },
    conceptos: ['intereses-posiciones', 'crear-valor', 'intercambio-integrativo', 'batna', 'criterios-objetivos'],
    briefing: {
      rol: 'Dirección de Ingeniería · Kora Software (Barcelona)',
      contexto: 'Samuel Okafor es el ingeniero de datos que sostiene el proyecto estrella de la empresa. Ayer te dijo que tiene una oferta de la competencia con un 20 % más de sueldo. Hoy os sentáis a hablar. Si se va, el proyecto se retrasa meses.',
      meta: 'Consigue que Samuel se quede con un acuerdo sostenible para la empresa: sueldo, teletrabajo, rol, formación y compromiso de permanencia.',
      aprenderas: ['A distinguir lo que alguien pide (posición) de lo que necesita (interés)', 'Que el valor no monetario puede pesar más que el dinero', 'A crear valor con lo que te cuesta poco y al otro le importa mucho', 'A usar un criterio de mercado frente a una cifra']
    },
    notasIniciales: [
      { tipo: 'dato', titulo: 'Situación actual', texto: 'Sueldo base sin cambios en dos años · 1 día de teletrabajo · mismo puesto · sin plan de formación.' },
      { tipo: 'dato', titulo: 'Lo que dijo Samuel', texto: '«Me ofrecen un 20 % más. No quiero irme, pero no puedo dejar pasar algo así.»' }
    ],
    variables: [
      { id: 'salario', nombre: 'Subida salarial', icono: 'euro', opciones: ['+0 %', '+5 %', '+10 %', '+15 %', '+20 %'], statusQuo: 0,
        jugador: { peso: 0.30, curva: 'desc' } },
      { id: 'teletrabajo', nombre: 'Teletrabajo', icono: 'calendario', opciones: ['1 día', '2 días', '3 días', '4 días', '100 % remoto'], statusQuo: 0,
        jugador: { peso: 0.10, curva: [1, 0.9, 0.75, 0.45, 0] } },
      { id: 'rol', nombre: 'Rol', icono: 'persona', opciones: ['Mismo puesto', 'Líder técnico', 'Lidera el proyecto de IA'], statusQuo: 0,
        jugador: { peso: 0.20, curva: [0.25, 0.8, 1] } },
      { id: 'formacion', nombre: 'Presupuesto de formación', icono: 'libro', opciones: ['0 €', '3.000 €', '6.000 €'], statusQuo: 0,
        jugador: { peso: 0.10, curva: 'desc' } },
      { id: 'permanencia', nombre: 'Compromiso de permanencia', icono: 'escudo', opciones: ['Sin compromiso', '1 año', '2 años'], statusQuo: 0,
        jugador: { peso: 0.30, curva: [0, 0.6, 1] } }
    ],
    jugador: {
      puntosPreparacion: 5,
      escalaBatna: [20, 50],
      batnas: [
        { id: 'reemplazo', corto: 'contratar a alguien de fuera', texto: 'Dejarle ir y contratar fuera: seis meses de vacante y 30.000 € de selección', valor: 26, conocida: true },
        { id: 'consultora', corto: 'subcontratar a una consultora', texto: 'Cubrir su trabajo con una consultora externa', valor: 22, valorAparente: 52, conocida: true },
        { id: 'interna', corto: 'promocionar a Irene', texto: 'Promocionar a Irene, de su equipo, y reforzarla con un perfil júnior', valor: 38, conocida: false }
      ]
    },
    contrapartes: [{
      id: 'samuel',
      nombre: 'Samuel Okafor',
      cargo: 'Ingeniero de datos sénior · Kora Software',
      edad: 32,
      avatar: { semilla: 23, genero: 'h', piel: 5, pelo: 'rizado', colorPelo: '#1f1a17', gafas: null, barba: 'sombra', ropa: 'jersey', colorRopa: '#2e5a52', colorCamisa: '#e9e4f2', cara: 'ovalada', edad: 32, colorOjos: '#3b2a1d' },
      personalidad: 'emocional',
      pesos: { salario: 0.20, teletrabajo: 0.32, rol: 0.25, formacion: 0.08, permanencia: 0.15 },
      curvas: { salario: 'asc', teletrabajo: [0, 0.35, 0.7, 0.9, 1], rol: 'asc', formacion: 'asc', permanencia: 'desc' },
      reserva: 44, aspiracion: 86, paciencia: 9, confianza: 46, tension: 30,
      batna: { texto: 'Aceptar la oferta de la competencia: +20 %, 2 días de teletrabajo y un puesto similar', valor: 44 },
      susceptibilidad: { anclaje: 0.3, perdida: 0.3 },
      intereses: [
        { id: 'familia', variable: 'teletrabajo', importancia: 'alta', direccion: 'opuesta', titulo: 'Su padre está enfermo',
          texto: 'Su padre está enfermo en Valencia y necesita pasar allí buena parte de la semana. Más que el dinero, necesita flexibilidad.',
          confesion: 'No te lo he contado, pero mi padre está enfermo en Valencia. Necesito poder estar allí. Por eso la oferta me tienta tanto.' },
        { id: 'crecimiento', variable: 'rol', importancia: 'alta', direccion: 'igual', titulo: 'Quiere liderar',
          texto: 'Se siente estancado: liderar el proyecto de IA le motiva más que el sueldo. A la empresa también le conviene.',
          confesion: 'Llevo tres años haciendo lo mismo. Si pudiera liderar algo propio… eso valdría más que muchos euros.' },
        { id: 'reconocimiento', variable: 'salario', importancia: 'media', direccion: 'opuesta', titulo: 'Necesita sentirse valorado',
          texto: 'Siente que su sueldo no refleja su impacto. Le importa la señal de reconocimiento más que la cifra exacta.' },
        { id: 'atadura', variable: 'permanencia', importancia: 'baja', direccion: 'opuesta', titulo: 'Miedo a atarse',
          texto: 'No le asusta comprometerse si tiene flexibilidad: su miedo es quedar atado si la situación familiar empeora.' }
      ],
      dialogos: {
        saludo: ['Gracias por sacar tiempo… Sé que esto es incómodo para los dos.'],
        apertura_contraparte: ['Te seré sincero: tengo una oferta muy buena fuera. Para quedarme necesitaría algo así: {paquete}.']
      }
    }],
    investigacion: [
      { id: 'companeros', titulo: 'Hablar con Irene, su compañera', descripcion: 'Le conoce bien y sabe qué le preocupa últimamente.', coste: 2, clave: true, icono: 'personas',
        revela: { interes: 'familia' } },
      { id: 'evaluaciones', titulo: 'Revisar sus evaluaciones de desempeño', descripcion: 'Qué ha pedido en las últimas conversaciones de carrera.', coste: 1, icono: 'carpeta',
        revela: { interes: 'crecimiento' } },
      { id: 'mercado', titulo: 'Estudio salarial del sector', descripcion: 'Banda de mercado para su perfil y antigüedad.', coste: 1, icono: 'indice',
        revela: { criterio: 'banda-salarial' } },
      { id: 'sucesion', titulo: 'Analizar el plan de sucesión del equipo', descripcion: '¿Quién podría asumir su trabajo si se va?', coste: 2, clave: true, icono: 'brujula',
        revela: { batna: 'interna' } },
      { id: 'verificar-consultora', titulo: 'Pedir presupuesto a una consultora', descripcion: '¿Es viable externalizar lo que hace Samuel?', coste: 1, icono: 'fabrica',
        revela: { verifica: 'consultora' }, nota: { texto: 'La consultora pide 14.000 €/mes y tres meses de arranque: no sustituye a Samuel (22 pts).' } },
      { id: 'competidor', titulo: 'Averiguar los detalles de la otra oferta', descripcion: 'A través de un contacto en la empresa rival.', coste: 1, icono: 'lupa',
        revela: { batnaContraparte: 'samuel' }, nota: { titulo: 'La otra oferta', texto: '+20 % de sueldo, pero solo 2 días de teletrabajo y un puesto similar al actual. Nada de liderar proyectos.' } }
    ],
    criterios: [
      { id: 'banda-salarial', nombre: 'banda salarial de mercado', texto: 'Para su perfil y antigüedad, el mercado paga entre un 8 % y un 12 % más que su sueldo actual.' }
    ],
    preguntas: [
      { id: 'por-que-ahora', tipo: 'abierta', texto: '¿Qué ha cambiado para que ahora te plantees irte?', confianzaMin: 44, revela: { interes: 'reconocimiento' },
        respuestas: { abierta: 'Supongo que me he sentido poco valorado. Llevo dos años sin subida y el proyecto funciona gracias a mi equipo.', evasiva: 'Nada en especial. Es una buena oferta, sin más.' } },
      { id: 'como-estas', tipo: 'abierta', texto: 'Y tú, ¿cómo estás? Más allá del trabajo.', confianzaMin: 54, revela: { interes: 'familia' },
        respuestas: { abierta: 'Uf… no muy bien. Mi padre está enfermo en Valencia. Necesito estar allí más tiempo. Por eso la flexibilidad es lo que más me importa.', evasiva: 'Bien, bien. Con mucho lío, como todos.' } },
      { id: 'que-necesitas', tipo: 'abierta', texto: '¿Qué necesitarías para estar a gusto aquí los próximos años?', confianzaMin: 40, revela: { interes: 'crecimiento' },
        respuestas: { abierta: 'Crecer. Liderar algo propio. El proyecto de IA, por ejemplo: sé que puedo sacarlo adelante.', evasiva: 'Que se me pague lo que valgo, básicamente.' } },
      { id: 'compromiso', tipo: 'abierta', texto: '¿Qué te preocupa de comprometerte a largo plazo con nosotros?', confianzaMin: 50, revela: { interes: 'atadura' },
        respuestas: { abierta: 'No me importa comprometerme… si tengo margen para organizarme. Lo que no quiero es quedarme atado si las cosas en casa empeoran.', evasiva: 'Prefiero no pensar en eso ahora.' } },
      { id: 'pasarse', tipo: 'sugestiva', texto: '¿No crees que pedir un 20 % es pasarse un poco?',
        respuestas: { evasiva: '¿Pasarse? Es lo que me ofrecen fuera. Si te parece mucho, quizá ya tengo mi respuesta.' } },
      { id: 'diez', tipo: 'cerrada', texto: '¿Te quedarías con un 10 % más?', confianzaMin: 30,
        respuestas: { abierta: 'No lo sé. Depende de lo demás.', evasiva: 'Lo dudo.' } }
    ],
    informacion: [
      { id: 'estabilidad', tipo: 'prioridades', variables: ['permanencia', 'salario'], texto: 'Explicar que lo que más necesitas es estabilidad en el equipo y que el presupuesto salarial es limitado',
        dicho: 'Con franqueza: lo que más necesito es estabilidad en el equipo los próximos dos años. Y el presupuesto salarial es muy ajustado.' },
      { id: 'proyecto-ia', tipo: 'prioridades', variables: ['rol', 'teletrabajo'], texto: 'Contarle que el proyecto de IA necesita a alguien como él al frente, y que dónde trabaje te importa poco',
        dicho: 'El proyecto de IA necesita a alguien como tú al frente. Y, sinceramente, me da igual desde dónde trabajes si el proyecto avanza.' },
      { id: 'banda', tipo: 'restriccion', texto: 'Explicar que RR. HH. tiene una banda salarial y por encima necesitas la firma del CEO',
        dicho: 'Para ser transparente: hay una banda salarial, y por encima necesito la firma del CEO. No es una excusa, es cómo funciona.' },
      { id: 'tope', tipo: 'reserva', texto: 'Confesar hasta dónde puedes llegar en sueldo',
        dicho: 'Mira, si hace falta puedo llegar hasta un +15 %. Pero de ahí no paso.' },
      { id: 'urgencia', tipo: 'plazo', texto: 'Decirle que necesitas su respuesta esta semana porque el proyecto arranca',
        dicho: 'Necesito tu respuesta esta semana: el proyecto arranca el lunes y no puedo esperar.' }
    ],
    eventos: [
      {
        id: 'headhunter', tipo: 'movil', quien: 'samuel', icono: 'movil', temporizador: 15,
        cuando: { turnoMin: 2, turnoMax: 5, prob: 0.55 },
        titulo: 'El móvil de Samuel vibra',
        texto: 'Samuel mira la pantalla y suspira: «Es la headhunter. Dice que la oferta caduca el viernes».',
        opciones: [
          { id: 'empatizar', estilo: 'calma', texto: 'Reconocer la presión que tiene y preguntarle qué necesita para decidir tranquilo',
            efectos: { confianza: 6, tension: -12 }, respuesta: { quien: 'samuel', texto: 'Gracias… Necesito sentir que esto va en serio, no solo por la cifra.' },
            juicio: 'acierto', conceptos: ['ir-al-balcon', 'intereses-posiciones'], explicacion: 'Ante la presión, empatizaste y preguntaste por sus intereses en lugar de pujar. Con una persona emocional, sentirse escuchada vale más que una cifra.' },
          { id: 'subir', estilo: 'ceder', texto: 'Subirle el sueldo en el acto para que no se vaya',
            efectos: { aspiracion: 6 }, respuesta: { quien: 'samuel', texto: 'Vaya… así que sí había margen. Interesante.' },
            juicio: 'error', sesgo: 'aversionPerdida', conceptos: ['concesiones-reciprocas'], explicacion: 'El miedo a perderle te hizo pujar contra una oferta que no habías examinado. Una concesión precipitada sube las expectativas del otro.' },
          { id: 'retar', estilo: 'presion', texto: 'Decirle que si se lo piensa tanto, quizá este no es su sitio',
            efectos: { confianza: -15, tension: 25 }, respuesta: { quien: 'samuel', texto: '¿En serio me dices eso? Después de tres años…' },
            juicio: 'error', sesgo: 'exceso', conceptos: ['confianza'], explicacion: 'Retar a alguien que ya tiene una salida es exceso de confianza: su BATNA es buena y tu presión solo dañó la relación.' },
          { id: 'ignorar', estilo: 'neutral', texto: 'Hacer como si nada y seguir', efectos: {},
            juicio: 'neutral', explicacion: 'No reaccionar evita errores, pero perdiste la ocasión de conectar con lo que le preocupa.' }
        ],
        porDefecto: 'ignorar'
      },
      {
        id: 'rrhh', tipo: 'mensaje', quien: 'rrhh', icono: 'mensaje', temporizador: 18,
        cuando: { turnoMin: 3, prob: 0.75 },
        titulo: 'Mensaje de la directora de RR. HH.',
        texto: '«Recuerda: por encima de +12 % necesitas la firma del CEO, y está de viaje hasta el mes que viene.»',
        opciones: [
          { id: 'creativo', estilo: 'calma', texto: 'Asumirlo y buscar valor fuera del sueldo: rol, teletrabajo, formación',
            efectos: { perfilJugador: { curvas: { salario: [1, 0.78, 0.55, 0.12, 0] }, aviso: 'Las subidas por encima del +12 % ahora te cuestan mucho más (requieren al CEO).' } },
            juicio: 'acierto', conceptos: ['crear-valor'], explicacion: 'Una restricción en una variable es una invitación a crear valor en las demás.' },
          { id: 'contar', estilo: 'honesto', texto: 'Contarle a Samuel la restricción con transparencia',
            efectos: { perfilJugador: { curvas: { salario: [1, 0.78, 0.55, 0.12, 0] }, aviso: 'Las subidas por encima del +12 % ahora te cuestan mucho más (requieren al CEO).' }, reciprocidad: 3, confianza: 4 },
            respuesta: { quien: 'samuel', texto: 'Vale. Agradezco que me lo digas claro. Entonces hablemos de lo demás.' },
            juicio: 'acierto', conceptos: ['criterios-objetivos', 'confianza'], explicacion: 'Una restricción real, contada con transparencia, es un límite creíble que la otra parte respeta.' },
          { id: 'prometer', estilo: 'mentir', texto: 'Prometerle +15 % igualmente: ya lo arreglarás con el CEO',
            efectos: { perfilJugador: { curvas: { salario: [1, 0.78, 0.55, 0.12, 0] }, aviso: 'Las subidas por encima del +12 % ahora te cuestan mucho más (requieren al CEO).' }, mentira: { prob: 0.5, turnos: 3, texto: 'prometiste algo que no podías firmar' } },
            juicio: 'error', sesgo: 'exceso', conceptos: ['confianza'], explicacion: 'Prometer lo que no controlas es una mentira aplazada: si sale a la luz, destruye la confianza.' }
        ],
        porDefecto: 'creativo'
      },
      {
        id: 'irene', tipo: 'puerta', quien: 'irene', icono: 'puerta',
        cuando: { turnoMin: 4, prob: 0.45 },
        titulo: 'Irene asoma por la puerta',
        texto: '«Perdón por interrumpir… Solo quería decir que sin Samuel el proyecto de IA se cae.» Cierra la puerta. Samuel sonríe, algo incómodo.',
        opciones: [
          { id: 'reconocer', estilo: 'honesto', texto: 'Aprovechar para reconocer, de verdad, lo que Samuel aporta',
            efectos: { confianza: 8, tension: -8 }, respuesta: { quien: 'samuel', texto: 'Gracias. No sabes lo que necesitaba oír eso.' },
            juicio: 'acierto', conceptos: ['intereses-posiciones'], explicacion: 'El reconocimiento era uno de sus intereses: satisfacerlo no cuesta dinero y transforma la conversación.' },
          { id: 'restar', estilo: 'presion', texto: 'Restarle importancia: «Nadie es imprescindible»',
            efectos: { confianza: -12, tension: 15 }, respuesta: { quien: 'samuel', texto: 'Ya. Nadie es imprescindible. Lo tendré en cuenta.' },
            juicio: 'error', conceptos: ['confianza'], explicacion: 'Intentaste debilitar su posición atacando su valor: con una persona emocional, el golpe a la relación cuesta más que la ventaja que ganas.' }
        ],
        porDefecto: 'restar'
      }
    ],
    dialogos: {},
    partidaModelo: {
      semilla: 2024,
      preparacion: {
        investigar: ['companeros', 'sucesion', 'mercado'],
        definir: { batnaId: 'interna', reserva: 38, objetivo: 72 }
      },
      introduccion: 'La clave de este escenario no es el sueldo. La negociadora experta trata la cifra de Samuel como una posición y busca los intereses que hay detrás.',
      comentariosPreparacion: [
        'Habla con Irene (descubre la situación familiar de Samuel) y analiza el plan de sucesión: su BATNA pasa de 26 a 38 puntos.',
        'Con el punto restante consulta la banda salarial de mercado: un criterio objetivo contra el «+20 %».',
        'Fija su reserva en su BATNA real y un objetivo ambicioso pero realista.'
      ],
      pasos: [
        { accion: { tipo: 'compartir', id: 'proyecto-ia' }, comentario: 'Antes de hablar de dinero, comparte tus prioridades: quieres que lidere el proyecto de IA y te da igual desde dónde trabaje. Samuel gana confianza y descubre que hay margen.' },
        { accion: { tipo: 'pregunta', id: 'que-necesitas' }, comentario: 'Pregunta abierta: ¿qué necesitaría para quedarse? Confirma que quiere crecer, y eso a la empresa también le conviene.' },
        { accion: { tipo: 'compartir', id: 'estabilidad' }, comentario: 'Ahora le cuenta lo que ella necesita: estabilidad (permanencia) y un presupuesto salarial ajustado.' },
        { accion: { tipo: 'pregunta', id: 'como-estas' }, comentario: 'Con la confianza ganada, una pregunta personal y genuina: «¿Cómo estás tú?». Aparece el interés real: su padre enfermo y la necesidad de flexibilidad.' },
        { accion: { tipo: 'oferta', paquete: [1, 3, 2, 1, 2], criterio: 'banda-salarial' }, comentario: 'Oferta en paquete: +5 %, 4 días de teletrabajo, liderar la IA, 3.000 € de formación… y 2 años de permanencia. Mucho valor para él a bajo coste para la empresa.' },
        { accion: { tipo: 'concesion', variable: 0, pedir: 3 }, comentario: 'Si hace falta, una concesión condicionada: sube al +10 % (dentro de la banda de mercado) a cambio de recortar la formación.' },
        { accion: { tipo: 'aceptar' }, comentario: 'Cuando la propuesta de Samuel supera su objetivo, cierra. Un empleado que se queda contento vale más que unos euros ahorrados.' }
      ],
      eventos: { headhunter: 'empatizar', rrhh: 'contar', irene: 'reconocer' }
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
