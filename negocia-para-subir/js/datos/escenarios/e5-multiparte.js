/* =====================================================================
 * NEGOCIA · Escenario 5 · «Plan Horizonte» (multiparte, nivel experto)
 * Tú representas a la dirección. Necesitas el sí del sindicato Y del
 * fondo inversor para aprobar un plan de viabilidad.
 * Enseña: coaliciones, intereses en conflicto entre terceros,
 * compromisos laterales y por qué una propuesta que perjudica a todos
 * a la vez los une contra ti.
 * Estructura oculta: el capital interesa a dirección y sindicato (y
 * cuesta al fondo); el control (participación) enfrenta a dirección con
 * el fondo; los despidos enfrentan al sindicato con el fondo. Cada parte
 * tiene "monedas" baratas para ti que valen mucho para ella.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};

  NG.Escenarios.registrar({
    id: 'e5-multiparte',
    orden: 5,
    titulo: 'Plan Horizonte',
    subtitulo: 'Sindicato, inversor y dirección en la misma mesa',
    dificultad: 5,
    duracionMin: 20,
    quienAbre: 'jugador',
    escena: { preparacion: 'despacho', negociacion: 'mesa-multiparte' },
    conceptos: ['coaliciones', 'crear-valor', 'intereses-posiciones', 'principios', 'confianza', 'ir-al-balcon'],
    mediadora: { nombre: 'Pilar Sanz', cargo: 'Mediadora laboral', avatar: { semilla: 77, genero: 'm', piel: 3, pelo: 'mono', colorPelo: '#9b9b9b', canas: 0.6, gafas: 'finas', ropa: 'blazer', colorRopa: '#4b4f58', colorCamisa: '#e8eef6', edad: 58, cara: 'ovalada' } },
    briefing: {
      rol: 'Dirección General · Textiles Miralles (Terrassa, 600 empleados)',
      contexto: 'La empresa pierde dinero desde hace dos años. Un fondo inversor, representado por Daniel Weber, está dispuesto a inyectar capital a cambio de una participación y de un ajuste de costes. El comité de empresa, liderado por Rosa Jiménez, defiende cada puesto de trabajo. Una mediadora laboral conduce la reunión. Sin el sí de ambos, no hay plan.',
      meta: 'Consigue un plan de viabilidad que firmen el sindicato y el fondo: ajuste de plantilla, congelación salarial, capital, participación del fondo y plan de recolocación.',
      aprenderas: ['Cómo se forman y se rompen las coaliciones', 'A detectar intereses comunes entre terceros', 'A usar compromisos laterales con cada parte', 'Por qué una propuesta que perjudica a todos los une contra ti']
    },
    notasIniciales: [
      { tipo: 'dato', titulo: 'La situación', texto: 'Pérdidas de 4 M€ al año. Sin capital nuevo, concurso de acreedores en seis meses.' },
      { tipo: 'dato', titulo: 'Las reglas', texto: 'El plan necesita la firma del comité de empresa y la del fondo. Hay hasta dos reuniones a solas (bilaterales).' },
      { tipo: 'dato', titulo: 'La propuesta inicial del fondo', texto: '80 despidos, un año de congelación y 10 M€ a cambio del 51 % de la empresa. El sindicato la ha rechazado en bloque.' }
    ],
    variables: [
      { id: 'ajuste', nombre: 'Ajuste de plantilla', icono: 'personas', opciones: ['Sin despidos', '40 puestos', '80 puestos', '120 puestos'], statusQuo: 2,
        jugador: { peso: 0.20, curva: [0.45, 1, 0.7, 0.2] } },
      { id: 'congelacion', nombre: 'Congelación salarial', icono: 'calendario', opciones: ['No', 'Un año', 'Dos años'], statusQuo: 1,
        jugador: { peso: 0.10, curva: [0, 0.6, 1] } },
      { id: 'capital', nombre: 'Capital del fondo', icono: 'euro', opciones: ['10 M€', '15 M€', '20 M€'], statusQuo: 0,
        jugador: { peso: 0.30, curva: 'asc' } },
      { id: 'participacion', nombre: 'Participación del fondo', icono: 'grafico', opciones: ['30 %', '40 %', '51 %'], statusQuo: 2,
        jugador: { peso: 0.25, curva: [1, 0.6, 0] } },
      { id: 'recolocacion', nombre: 'Plan de recolocación', icono: 'carpeta', opciones: ['Sin plan', 'Plan básico', 'Plan completo con formación'], statusQuo: 0,
        jugador: { peso: 0.15, curva: [1, 0.7, 0.3] } }
    ],
    jugador: {
      puntosPreparacion: 6,
      escalaBatna: [10, 40],
      batnas: [
        { id: 'concurso', corto: 'el concurso de acreedores', texto: 'Concurso de acreedores y liquidación parcial', valor: 14, conocida: true },
        { id: 'venta', corto: 'vender la marca', texto: 'Vender la marca a un competidor asiático', valor: 18, valorAparente: 46, conocida: true },
        { id: 'icf', corto: 'el préstamo de la banca pública', texto: 'Préstamo puente de la banca pública a cambio de avales y un plan propio', valor: 30, conocida: false }
      ]
    },
    contrapartes: [
      {
        id: 'rosa',
        nombre: 'Rosa Jiménez',
        cargo: 'Presidenta del comité de empresa',
        edad: 49,
        avatar: { semilla: 51, genero: 'm', piel: 2, pelo: 'melena', colorPelo: '#8c3d1f', canas: 0.15, gafas: null, ropa: 'jersey', colorRopa: '#7a3b52', colorCamisa: '#f4ece0', pendientes: 'aro', edad: 49, cara: 'ovalada' },
        personalidad: 'competitiva',
        pesos: { ajuste: 0.40, congelacion: 0.20, capital: 0.10, participacion: 0.10, recolocacion: 0.20 },
        curvas: { ajuste: [1, 0.6, 0.25, 0], congelacion: 'desc', capital: 'asc', participacion: [1, 0.7, 0.2], recolocacion: 'asc' },
        reserva: 43, aspiracion: 78, paciencia: 11, confianza: 40, tension: 45,
        batna: { texto: 'Huelga indefinida y presión política para una intervención pública', valor: 44 },
        susceptibilidad: { anclaje: 0.25, perdida: 0.35 },
        intereses: [
          { id: 'puestos', variable: 'ajuste', importancia: 'alta', direccion: 'opuesta', titulo: 'Cada puesto cuenta',
            texto: 'Su prioridad absoluta es minimizar los despidos: cada puesto perdido es una familia.' },
          { id: 'salida-digna', variable: 'recolocacion', importancia: 'alta', direccion: 'opuesta', titulo: 'Una salida digna',
            texto: 'Si hay despidos, necesita un plan de recolocación con formación para poder defenderlo ante la asamblea.',
            confesion: 'Le voy a ser clara: si hay salidas, tienen que ser con formación y recolocación. Sin eso, la asamblea no firma.' },
          { id: 'inversion', variable: 'capital', importancia: 'baja', direccion: 'igual', titulo: 'Quiere más inversión',
            texto: 'Más capital significa más futuro para la fábrica: en eso coincide con la dirección.' }
        ],
        dialogos: {
          saludo: ['Venimos a defender a 600 familias. Que nadie lo olvide.'],
          alianza: ['Eso es un gesto serio. Contará con nuestra predisposición… mientras lo cumpla.']
        }
      },
      {
        id: 'weber',
        nombre: 'Daniel Weber',
        cargo: 'Socio · Fondo Nordia Capital',
        edad: 44,
        avatar: { semilla: 52, genero: 'h', piel: 0, pelo: 'rapado', colorPelo: '#c8a05a', gafas: null, barba: null, ropa: 'traje', colorRopa: '#26324a', colorCamisa: '#eef2f7', corbata: '#5b8cff', edad: 44, cara: 'cuadrada' },
        personalidad: 'analitica',
        pesos: { ajuste: 0.25, congelacion: 0.10, capital: 0.25, participacion: 0.30, recolocacion: 0.10 },
        curvas: { ajuste: [0, 0.45, 0.85, 1], congelacion: 'asc', capital: 'desc', participacion: 'asc', recolocacion: [1, 0.8, 0.5] },
        reserva: 43, aspiracion: 76, paciencia: 12, confianza: 50, tension: 15,
        batna: { texto: 'Invertir en otra textil del Vallès que también busca capital', valor: 44 },
        susceptibilidad: { anclaje: 0.35, perdida: 0.2 },
        intereses: [
          { id: 'control', variable: 'participacion', importancia: 'alta', direccion: 'opuesta', titulo: 'Quiere control',
            texto: 'Su comité de inversión exige influencia real en las decisiones: la participación es su prioridad.' },
          { id: 'riesgo', variable: 'capital', importancia: 'media', direccion: 'opuesta', titulo: 'Limitar el riesgo',
            texto: 'Cuanto más capital ponga sin control, más riesgo asume ante sus inversores.' },
          { id: 'eficiencia', variable: 'ajuste', importancia: 'media', direccion: 'opuesta', titulo: 'Una estructura viable',
            texto: 'Necesita un ajuste que haga viable la empresa, aunque un plan de recolocación no le preocupa mucho.' }
        ],
        dialogos: {
          saludo: ['He revisado las cuentas tres veces. Hablemos de números y de gobierno corporativo.'],
          alianza: ['Eso responde a nuestra principal preocupación. Lo valoro.']
        }
      }
    ],
    compromisos: [
      { id: 'comite', con: 'rosa', texto: 'Crear un comité de seguimiento del plan con el sindicato', bonus: 10, coste: 2, confianza: 10,
        dicho: 'Le propongo algo: un comité de seguimiento del plan, con el sindicato dentro, que se reúna cada trimestre.',
        respuesta: 'Eso es un gesto serio. Con un comité así, puedo defender el plan ante la asamblea.' },
      { id: 'recontratacion', con: 'rosa', texto: 'Garantizar prioridad de recontratación si la nueva línea crece', bonus: 7, coste: 1, confianza: 8,
        dicho: 'Si la nueva línea crece, las personas que salgan tendrán prioridad para volver. Por escrito.',
        respuesta: 'Por escrito, ¿eh? Bien. Eso cambia el tono.' },
      { id: 'consejo', con: 'weber', texto: 'Ofrecer al fondo dos asientos en el consejo y veto sobre grandes inversiones', bonus: 12, coste: 3, confianza: 10,
        dicho: 'Le ofrezco dos asientos en el consejo y derecho de veto sobre inversiones grandes, sea cual sea su participación.',
        respuesta: 'Eso responde a nuestra principal preocupación: influencia real sin necesidad de controlar el capital.' },
      { id: 'dividendos', con: 'weber', texto: 'Dividendo preferente para el fondo cuando vuelvan los beneficios', bonus: 7, coste: 2, confianza: 6,
        dicho: 'Cuando vuelvan los beneficios, el fondo cobrará primero. Un dividendo preferente.',
        respuesta: 'Interesante. Mejora el perfil de retorno de forma significativa.' }
    ],
    investigacion: [
      { id: 'asamblea', titulo: 'Hablar con delegados sindicales', descripcion: 'Qué piensa realmente la plantilla.', coste: 2, clave: true, icono: 'personas',
        revela: { interes: ['salida-digna', 'inversion'] } },
      { id: 'fondo', titulo: 'Estudiar las inversiones previas de Nordia', descripcion: 'Qué condiciones suele exigir el fondo.', coste: 2, clave: true, icono: 'grafico',
        revela: { interes: 'control', pista: 'En sus últimas tres inversiones, Nordia aceptó participaciones minoritarias a cambio de asientos en el consejo y derechos de veto.' } },
      { id: 'icf', titulo: 'Sondear a la banca pública', descripcion: '¿Habría un préstamo puente si fracasa el plan?', coste: 2, icono: 'brujula',
        revela: { batna: 'icf' } },
      { id: 'verificar-venta', titulo: 'Contactar con el comprador asiático', descripcion: '¿Es real el interés por la marca?', coste: 1, icono: 'lupa',
        revela: { verifica: 'venta' }, nota: { texto: 'El interés era exploratorio: ofrecen una cifra simbólica y solo por la marca, no por la fábrica (18 pts).' } },
      { id: 'perfiles', titulo: 'Pedir a la mediadora un retrato de las partes', descripcion: 'Cómo negocia cada una.', coste: 1, icono: 'persona',
        revela: { personalidad: ['rosa', 'weber'] }, nota: { texto: 'Rosa es competitiva y desconfía; Weber es analítico y responde a datos.' } },
      { id: 'convenio', titulo: 'Revisar convenios del sector', descripcion: 'Qué se ha pactado en reestructuraciones similares.', coste: 1, icono: 'indice',
        revela: { criterio: 'precedentes' } }
    ],
    criterios: [
      { id: 'precedentes', nombre: 'precedentes del sector textil', texto: 'En las últimas reestructuraciones textiles de Cataluña se pactaron ajustes del 5–10 % de la plantilla con planes de recolocación completos.' }
    ],
    preguntas: [
      { id: 'rosa-salidas', a: 'rosa', tipo: 'abierta', texto: 'Rosa, si hubiera salidas, ¿qué necesitaría la asamblea para aceptarlas?', confianzaMin: 46, revela: { interes: 'salida-digna' },
        respuestas: { abierta: 'Recolocación y formación de verdad. No un cursillo de dos semanas.', evasiva: 'Que no las haya. Así de fácil.' } },
      { id: 'rosa-futuro', a: 'rosa', tipo: 'abierta', texto: '¿Qué le preocupa del futuro de la fábrica más allá de este año?', confianzaMin: 34, revela: { interes: 'inversion' },
        respuestas: { abierta: 'Que esto sea pan para hoy y hambre para mañana. Sin inversión, en dos años estamos igual.', evasiva: 'Me preocupa hoy. El futuro, ya veremos.' } },
      { id: 'weber-gobierno', a: 'weber', tipo: 'abierta', texto: 'Daniel, ¿qué necesita su comité de inversión para sentirse cómodo?', confianzaMin: 40, revela: { interes: 'control' },
        respuestas: { abierta: 'Influencia en las decisiones clave. La participación es una forma de tenerla, pero no la única.', evasiva: 'Retorno. Como cualquier inversor.' } },
      { id: 'weber-riesgo', a: 'weber', tipo: 'abierta', texto: '¿Cómo valoran el riesgo de poner más capital?', confianzaMin: 44, revela: { interes: 'riesgo' },
        respuestas: { abierta: 'Más capital sin control es más riesgo. Con control, podríamos poner más.', evasiva: 'Lo valoramos con mucho cuidado.' } },
      { id: 'weber-ajuste', a: 'weber', tipo: 'abierta', texto: '¿Qué ajuste considera imprescindible para la viabilidad?', confianzaMin: 46, revela: { interes: 'eficiencia' },
        respuestas: { abierta: 'Uno que haga viable la estructura. Si va acompañado de recolocación, por mí no hay problema.', evasiva: 'El que digan los números.' } },
      { id: 'egoista', a: 'rosa', tipo: 'sugestiva', texto: '¿No cree que el sindicato está anteponiendo sus intereses a los de la empresa?',
        respuestas: { evasiva: '¿Nuestros intereses? Los trabajadores SON la empresa. Empezamos bien.' } }
    ],
    informacion: [
      { id: 'capital-clave', tipo: 'prioridades', variables: ['capital', 'participacion'], texto: 'Explicar a ambos que necesitas capital suficiente y mantener el control de la empresa',
        dicho: 'Seré transparente con los dos: necesitamos capital suficiente para invertir en la nueva línea, y que la empresa siga teniendo un proyecto propio.' },
      { id: 'ajuste-minimo', tipo: 'prioridades', variables: ['ajuste', 'recolocacion'], texto: 'Contar que buscáis el ajuste mínimo viable y que un plan de recolocación es asumible',
        dicho: 'Buscamos el ajuste mínimo que haga viable la empresa. Y un plan de recolocación serio es asumible para nosotros.' },
      { id: 'cuentas', tipo: 'restriccion', texto: 'Abrir las cuentas a ambas partes con total transparencia',
        dicho: 'Les propongo algo: abrimos las cuentas a las dos partes. Todas. Sin trampas.' },
      { id: 'limite', tipo: 'reserva', texto: 'Confesar hasta dónde puede ceder la dirección',
        dicho: 'Mi límite es claro: no puedo ir más allá de esto o el consejo no lo aprueba.' }
    ],
    eventos: [
      {
        id: 'asamblea', tipo: 'mensaje', quien: 'rosa', icono: 'mensaje', temporizador: 20,
        cuando: { turnoMin: 3, prob: 0.7 },
        titulo: 'La asamblea vota huelga',
        texto: 'Rosa recibe un mensaje y lo lee en voz alta: «La asamblea ha votado huelga si no hay acuerdo en dos sesiones». Weber frunce el ceño.',
        opciones: [
          { id: 'reconocer', estilo: 'calma', texto: 'Reconocer la presión que tienen y proponer un calendario creíble',
            efectos: { confianza: { rosa: 6 }, tension: { rosa: -12, weber: -5 } }, respuesta: { quien: 'mediadora', texto: 'Bien. Fijemos un calendario y sigamos trabajando.' },
            juicio: 'acierto', conceptos: ['ir-al-balcon'], explicacion: 'Reconociste la presión sin dramatizarla: bajaste la tensión de ambas partes y mantuviste a todos en la mesa.' },
          { id: 'amenazar', estilo: 'presion', texto: 'Recordar que una huelga hundiría la empresa y sus propios empleos',
            efectos: { confianza: { rosa: -12, weber: 3 }, tension: { rosa: 20 } }, respuesta: { quien: 'rosa', texto: '¿Nos amenaza? Ahora sí que vamos a la huelga.' },
            juicio: 'error', conceptos: ['coaliciones'], explicacion: 'Amenazar a una parte competitiva con su propia BATNA solo la endurece. Y el fondo toma nota de tu estilo.' },
          { id: 'prometer', estilo: 'ceder', texto: 'Prometer que no habrá despidos sin consultar antes con el fondo',
            efectos: { confianza: { rosa: 6, weber: -14 }, tension: { weber: 15 } }, respuesta: { quien: 'weber', texto: '¿Sin consultarnos? Esto cambia las cosas.' },
            juicio: 'error', sesgo: 'aversionPerdida', conceptos: ['coaliciones'], explicacion: 'Por miedo a la huelga hiciste una concesión unilateral que dañó tu relación con la otra parte imprescindible.' }
        ],
        porDefecto: 'prometer'
      },
      {
        id: 'comite-inversion', tipo: 'mensaje', quien: 'weber', icono: 'mensaje', temporizador: 18,
        cuando: { turnoMin: 4, prob: 0.7 },
        titulo: 'Weber recibe un correo',
        texto: '«Mi comité de inversión no aprobará más de 15 M€ sin control del fondo», anuncia Weber tras leerlo.',
        opciones: [
          { id: 'preguntar', estilo: 'calma', texto: 'Preguntar qué condiciones harían posible más capital sin control del capital',
            efectos: { confianza: { weber: 4 }, revelar: { pista: 'Weber podría poner más capital si el fondo tiene influencia real (consejo, vetos) aunque no tenga la mayoría.', titulo: 'Hay otra vía', quien: 'weber' } },
            respuesta: { quien: 'weber', texto: 'Influencia real en el consejo, por ejemplo. No necesariamente el 51 %.' },
            juicio: 'acierto', conceptos: ['intereses-posiciones'], explicacion: 'Tras su posición («sin control, no») había un interés (influencia): preguntar abrió una vía que no pasaba por ceder la mayoría.' },
          { id: 'otro', estilo: 'presion', texto: 'Decirle que buscarás otro inversor',
            efectos: { confianza: { weber: -10 }, tension: { weber: 12 } }, respuesta: { quien: 'weber', texto: 'Suerte. En seis meses, sin capital, no habrá nada que invertir.' },
            juicio: 'error', sesgo: 'exceso', conceptos: ['batna'], explicacion: 'Tu BATNA (concurso o préstamo puente) era débil: amenazar con ella ante un analista que conoce tus números fue un farol evidente.' },
          { id: 'aceptar', estilo: 'neutral', texto: 'Tomar nota y seguir', efectos: {}, juicio: 'neutral', explicacion: 'Aceptar la restricción sin explorarla te dejó con menos opciones de las que había.' }
        ],
        porDefecto: 'aceptar'
      },
      {
        id: 'filtracion', tipo: 'noticia', quien: 'mediadora', icono: 'info', temporizador: 18,
        cuando: { turnoMin: 5, prob: 0.5 },
        titulo: 'Filtración a la prensa',
        texto: 'El diario local publica que la dirección «prepara 120 despidos». Rosa deja el periódico sobre la mesa. La mediadora pide calma.',
        opciones: [
          { id: 'desmentir', estilo: 'honesto', texto: 'Desmentirlo con datos delante de ambas partes',
            efectos: { confianza: { rosa: 6 }, tension: { rosa: -10 } }, respuesta: { quien: 'rosa', texto: 'Bien. Que conste en acta.' },
            juicio: 'acierto', conceptos: ['confianza'], explicacion: 'Responder a un rumor con datos y transparencia protege la confianza de todas las partes.' },
          { id: 'callar', estilo: 'neutral', texto: 'No comentar la noticia',
            efectos: { confianza: { rosa: -6 }, tension: { rosa: 14 } }, juicio: 'neutral', explicacion: 'El silencio ante un rumor así se interpreta como confirmación.' },
          { id: 'culpar', estilo: 'presion', texto: 'Insinuar que la filtración viene del sindicato',
            efectos: { confianza: { rosa: -20 }, tension: { rosa: 25 } }, respuesta: { quien: 'rosa', texto: '¿Nos acusa? Esto es intolerable.' },
            juicio: 'error', conceptos: ['principios'], explicacion: 'Acusar sin pruebas mezcla a las personas con el problema y convierte un rumor en una crisis.' }
        ],
        porDefecto: 'callar'
      }
    ],
    dialogos: {
      apertura_mediadora: ['Buenos días. Estamos aquí para buscar un plan de viabilidad que todas las partes puedan firmar. Cada parte hablará con respeto y yo velaré por ello. Dirección, tiene la palabra.'],
      bloque_roto: ['Parece que ya no todas las partes están en el mismo punto. Sigamos, que avanzamos.']
    },
    partidaModelo: {
      semilla: 5151,
      preparacion: {
        investigar: ['asamblea', 'fondo', 'convenio', 'perfiles'],
        definir: { batnaId: 'concurso', reserva: 14, objetivo: 62 }
      },
      introduccion: 'En una mesa con tres partes, cada propuesta mueve alianzas. La negociadora experta busca intereses comunes, construye apoyos a solas con cada parte, evita las propuestas que perjudican a todos a la vez… y tiene paciencia.',
      comentariosPreparacion: [
        'Habla con los delegados: si hay salidas, la asamblea necesita recolocación con formación, y también quiere más inversión (igual que la dirección).',
        'Estudia al fondo: acepta participaciones minoritarias si tiene asientos en el consejo y vetos. Esa es la clave del escenario.',
        'Revisa los precedentes del sector (ajustes del 5–10 % con recolocación) y pide a la mediadora un retrato de las partes.',
        'Renuncia a mejorar su BATNA: con un plan de viabilidad sobre la mesa, la información sobre las partes vale más. Su reserva es la del concurso (14).'
      ],
      pasos: [
        { accion: { tipo: 'compartir', id: 'ajuste-minimo' }, comentario: 'Abre compartiendo prioridades con las dos partes: el ajuste mínimo viable y un plan de recolocación asumible. Rosa y Weber ven que hay margen.' },
        { accion: { tipo: 'pregunta', id: 'weber-gobierno' }, comentario: 'Pregunta a Weber qué necesita su comité: influencia real, no necesariamente la mayoría.' },
        { accion: { tipo: 'bilateral', con: 'weber', sub: 'compromiso', id: 'consejo' }, comentario: 'A solas con Weber: asientos en el consejo y vetos. Satisface su interés (influencia) sin ceder la mayoría del capital.' },
        { accion: { tipo: 'bilateral', con: 'rosa', sub: 'compromiso', id: 'comite' }, comentario: 'A solas con Rosa: un comité de seguimiento con el sindicato dentro. Barato para la dirección y valioso para ella.' },
        { accion: { tipo: 'pregunta', id: 'rosa-futuro' }, comentario: 'Con la confianza ganada, pregunta a Rosa por el futuro: también quiere más inversión. Dirección y sindicato coinciden en algo.' },
        { accion: { tipo: 'oferta', paquete: [1, 1, 1, 1, 2], criterio: 'precedentes' }, comentario: 'Propuesta pública equilibrada y apoyada en los precedentes del sector: 40 puestos con recolocación completa, un año de congelación, 15 M€ y un 40 % para el fondo. Nadie gana a costa de los demás.' },
        { accion: { tipo: 'oferta', paquete: [1, 1, 1, 1, 2], criterio: 'precedentes' }, comentario: 'Paciencia: mantener una propuesta justa (sin retroceder ni ceder por nervios) deja que el tiempo trabaje. Las aspiraciones bajan.' },
        { accion: { tipo: 'oferta', paquete: [1, 1, 1, 1, 2], criterio: 'precedentes' }, comentario: 'Mantiene la propuesta. La mediadora resume: ambas partes se acercan.' },
        { accion: { tipo: 'oferta', paquete: [1, 1, 1, 1, 2], criterio: 'precedentes' }, comentario: 'Cuando ambas partes aceptan, el plan sale adelante sin que nadie quede aislado.' }
      ],
      eventos: { asamblea: 'reconocer', 'comite-inversion': 'preguntar', filtracion: 'desmentir' }
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
