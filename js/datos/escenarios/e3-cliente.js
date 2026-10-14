/* =====================================================================
 * NEGOCIA · Escenario 3 · «Cliente en riesgo»
 * Enseña: gestión de crisis, concesiones condicionadas y reciprocidad.
 * Estructura oculta: Carmen amenaza con irse, pero su alternativa
 * (TransRápido) no tiene capacidad hasta dentro de 6 meses. Lo que de
 * verdad necesita es un plan creíble y garantías para defenderse ante
 * su comité. La duración del contrato vale mucho para ti y poco para
 * ella. Es competitiva: castiga las concesiones grandes e incondicionales.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};

  NG.Escenarios.registrar({
    id: 'e3-cliente',
    orden: 3,
    titulo: 'Cliente en riesgo',
    subtitulo: 'Salvar una cuenta clave en plena crisis',
    dificultad: 3,
    duracionMin: 15,
    quienAbre: 'contraparte',
    escena: { preparacion: 'despacho', negociacion: 'sala-juntas' },
    conceptos: ['concesiones-reciprocas', 'confianza', 'batna', 'principios', 'encuadre', 'credibilidad'],
    briefing: {
      rol: 'Dirección de Cuentas Clave · LogiNorte (logística)',
      contexto: 'Tras tres meses de retrasos en las entregas, Supermercados Hiperdía —vuestro mayor cliente, el 30 % de la facturación— amenaza con irse a TransRápido. Carmen Velasco, su directora de compras, te ha citado en su sala de juntas. Llega enfadada y con poco tiempo.',
      meta: 'Renueva el contrato sin regalar el margen: descuento, penalizaciones por retraso, duración y plan de mejora.',
      aprenderas: ['A gestionar una crisis: reconocer antes de negociar', 'Por qué una concesión grande y sin condiciones alimenta el apetito del otro', 'A usar concesiones condicionadas («si… entonces…»)', 'A comprobar si la amenaza de la otra parte es creíble']
    },
    notasIniciales: [
      { tipo: 'dato', titulo: 'Contrato actual', texto: 'Sin descuento ni penalizaciones · renovación anual · sin plan de mejora. Vence este mes.' },
      { tipo: 'dato', titulo: 'Los hechos', texto: '27 retrasos en tres meses. Hiperdía es el 30 % de vuestra facturación.' }
    ],
    variables: [
      { id: 'descuento', nombre: 'Descuento compensatorio', icono: 'euro', opciones: ['0 %', '3 %', '6 %', '9 %', '12 %'], statusQuo: 0,
        jugador: { peso: 0.30, curva: 'desc' } },
      { id: 'penalizacion', nombre: 'Penalización por retraso', icono: 'reloj', opciones: ['Sin penalización', '1 % por incidencia', '3 % por incidencia', '5 % por incidencia'], statusQuo: 0,
        jugador: { peso: 0.15, curva: [1, 0.8, 0.45, 0] } },
      { id: 'duracion', nombre: 'Duración de la renovación', icono: 'calendario', opciones: ['1 año', '2 años', '3 años'], statusQuo: 0,
        jugador: { peso: 0.35, curva: [0, 0.65, 1] } },
      { id: 'plan', nombre: 'Plan de mejora', icono: 'carpeta', opciones: ['Sin cambios', 'Plan de mejora', 'Plan + gestor dedicado'], statusQuo: 0,
        jugador: { peso: 0.20, curva: [1, 0.65, 0.3] } }
    ],
    jugador: {
      puntosPreparacion: 5,
      escalaBatna: [15, 45],
      batnas: [
        { id: 'perder', corto: 'perder la cuenta', texto: 'Perder la cuenta y recolocar la flota en clientes pequeños', valor: 22, conocida: true },
        { id: 'tribunales', corto: 'reclamar la penalización de salida', texto: 'Reclamar por contrato la penalización por rescisión anticipada', valor: 14, valorAparente: 48, conocida: true },
        { id: 'cadena-norte', corto: 'Supermercados del Norte', texto: 'Ofrecer la capacidad a Supermercados del Norte, que busca operador logístico', valor: 34, conocida: false }
      ]
    },
    contrapartes: [{
      id: 'carmen',
      nombre: 'Carmen Velasco',
      cargo: 'Directora de Compras · Supermercados Hiperdía',
      edad: 54,
      avatar: { semilla: 31, genero: 'm', piel: 1, pelo: 'mono', colorPelo: '#3a281d', canas: 0.35, gafas: 'finas', ropa: 'blazer', colorRopa: '#5a2f3c', colorCamisa: '#f4ece0', pendientes: 'perla', cara: 'alargada', edad: 54, pintalabios: '#9a3b4a' },
      personalidad: 'competitiva',
      pesos: { descuento: 0.25, penalizacion: 0.30, duracion: 0.10, plan: 0.35 },
      curvas: { descuento: 'asc', penalizacion: 'asc', duracion: [1, 0.7, 0.3], plan: 'asc' },
      reserva: 40, aspiracion: 88, paciencia: 8, confianza: 26, tension: 55,
      batna: { texto: 'Pasarse a TransRápido, que no tendrá capacidad para todo su volumen hasta dentro de seis meses', valor: 40 },
      susceptibilidad: { anclaje: 0.25, perdida: 0.3 },
      intereses: [
        { id: 'culpa', variable: 'plan', importancia: 'alta', direccion: 'opuesta', titulo: 'La señalan a ella',
          texto: 'Su director general la culpa de los retrasos: necesita volver con un plan creíble, no solo con un descuento.',
          confesion: 'Mire, mi director general me ha puesto en la diana por esto. Necesito llevarle algo más que un descuento: necesito un plan.' },
        { id: 'garantias', variable: 'penalizacion', importancia: 'alta', direccion: 'opuesta', titulo: 'Quiere garantías por escrito',
          texto: 'Necesita penalizaciones por escrito para justificar ante su comité que se queda con vosotros.' },
        { id: 'flexibilidad', variable: 'duracion', importancia: 'baja', direccion: 'opuesta', titulo: 'La duración le importa poco',
          texto: 'Prefiere contratos cortos por costumbre, pero un compromiso largo no le preocupa si hay garantías.' },
        { id: 'presupuesto', variable: 'descuento', importancia: 'media', direccion: 'opuesta', titulo: 'Presupuesto ajustado',
          texto: 'Un descuento le ayuda con su presupuesto, pero no es lo que resolverá su problema interno.' }
      ],
      dialogos: {
        saludo: ['Tengo media hora. Usted dirá cómo piensan arreglar esto.'],
        apertura_contraparte: ['Vamos al grano. O me dan esto, o firmo con TransRápido el lunes: {paquete}.']
      }
    }],
    investigacion: [
      { id: 'incidencias', titulo: 'Analizar las 27 incidencias', descripcion: 'Dónde, cuándo y por qué se produjeron los retrasos.', coste: 1, clave: true, icono: 'grafico',
        revela: { criterio: 'datos-incidencias', pista: 'El 70 % de los retrasos vienen de una sola ruta: un plan de mejora sería barato y muy eficaz.' },
        nota: { titulo: 'Diagnóstico' } },
      { id: 'competidor', titulo: 'Investigar a TransRápido', descripcion: '¿Puede realmente asumir el volumen de Hiperdía?', coste: 2, clave: true, icono: 'lupa',
        revela: { batnaContraparte: 'carmen' }, nota: { titulo: 'Su alternativa', texto: 'TransRápido no tendrá capacidad para todo el volumen de Hiperdía hasta dentro de seis meses: su alternativa es más débil de lo que dice.' } },
      { id: 'operaciones', titulo: 'Hablar con el jefe de operaciones de Hiperdía', descripcion: 'Un contacto de confianza en su lado.', coste: 2, clave: true, icono: 'personas',
        revela: { interes: 'culpa' } },
      { id: 'otros-clientes', titulo: 'Sondear a otros clientes potenciales', descripcion: '¿Quién podría absorber la capacidad si perdéis Hiperdía?', coste: 2, icono: 'brujula',
        revela: { batna: 'cadena-norte' } },
      { id: 'legal', titulo: 'Consultar a la asesoría jurídica', descripcion: '¿Se puede reclamar la penalización de salida?', coste: 1, icono: 'escudo',
        revela: { verifica: 'tribunales' }, nota: { texto: 'Jurídica lo desaconseja: la cláusula es dudosa tras vuestros incumplimientos y el pleito destruiría la relación (14 pts).' } },
      { id: 'perfil', titulo: 'Preguntar por Carmen en el sector', descripcion: 'Cómo negocia, qué respeta.', coste: 1, icono: 'persona',
        revela: { personalidad: 'carmen' }, nota: { texto: 'Competitiva: dura, respeta la firmeza y huele la debilidad. Las concesiones gratis no le ablandan: le abren el apetito.' } }
    ],
    criterios: [
      { id: 'datos-incidencias', nombre: 'datos de las incidencias', texto: 'El 70 % de los retrasos se concentran en la ruta Burgos–Santander: el problema es acotado y tiene solución.' }
    ],
    preguntas: [
      { id: 'que-necesita', tipo: 'abierta', texto: '¿Qué necesita llevarle a su comité para sentirse segura con nosotros?', confianzaMin: 42, revela: { interes: 'culpa' },
        respuestas: { abierta: 'Un plan. Hechos. Mi director general no quiere oír más disculpas: quiere ver que esto no vuelve a pasar.', evasiva: 'Necesito que dejen de fallar. Así de simple.' } },
      { id: 'garantias', tipo: 'abierta', texto: '¿Qué garantías le darían tranquilidad?', confianzaMin: 38, revela: { interes: 'garantias' },
        respuestas: { abierta: 'Penalizaciones por escrito. Si vuelven a fallar, que les cueste. Es lo único que mi comité entenderá.', evasiva: 'Las que ustedes no han sabido dar.' } },
      { id: 'duracion', tipo: 'abierta', texto: '¿Cómo ve un compromiso a más largo plazo, si el servicio mejora?', confianzaMin: 50, revela: { interes: 'flexibilidad' },
        respuestas: { abierta: 'Si hay garantías, la duración me da igual. Cambiar de operador también es un dolor de cabeza.', evasiva: 'Primero demuestren que pueden cumplir un mes.' } },
      { id: 'transrapido', tipo: 'abierta', texto: '¿Cuándo podría TransRápido asumir todo su volumen?', confianzaMin: 55,
        revela: { pista: 'Carmen titubea: TransRápido necesitaría meses para asumir todo el volumen. Su amenaza tiene menos fuerza de la que aparenta.', titulo: 'Su BATNA es débil', quien: 'carmen' },
        respuestas: { abierta: 'Bueno… no de inmediato, no. Pero eso es asunto mío.', evasiva: 'Antes de lo que usted cree.' } },
      { id: 'exagera', tipo: 'sugestiva', texto: '¿No cree que está exagerando con lo de irse?',
        respuestas: { evasiva: '¿Exagerando? Veintisiete retrasos. Haga usted la cuenta.' } },
      { id: 'cinco', tipo: 'cerrada', texto: '¿Le valdría un 5 % de descuento?', confianzaMin: 30,
        respuestas: { abierta: 'Ni de lejos, si es lo único que ofrecen.', evasiva: 'No.' } }
    ],
    informacion: [
      { id: 'reconocer', tipo: 'disculpa', texto: 'Reconocer los fallos sin excusas y explicar qué los causó',
        dicho: 'Antes de nada: les hemos fallado. Sin excusas. Hemos analizado las 27 incidencias y sabemos exactamente qué pasó.',
        efectos: { confianza: 14, tension: -18 }, respuesta: 'Bien. Es la primera vez que alguien de su empresa lo dice así de claro.',
        juicio: 'acierto', explicacion: 'Reconocer el problema sin excusas desactiva la emoción y separa a las personas del problema (Fisher y Ury). En una crisis, primero se escucha y se reconoce; después se negocia.', conceptos: ['principios', 'confianza'] },
      { id: 'prioridad-duracion', tipo: 'prioridades', variables: ['duracion', 'descuento'], texto: 'Explicar que para vosotros lo clave es un compromiso a largo plazo, más que el precio',
        dicho: 'Le seré transparente: para nosotros lo crítico es la continuidad. Un compromiso largo nos permite invertir en la ruta. El precio nos importa, pero menos.' },
      { id: 'plan-barato', tipo: 'prioridades', variables: ['plan', 'penalizacion'], texto: 'Contar que un plan de mejora y unas penalizaciones razonables son asumibles',
        dicho: 'Un plan de mejora con un gestor dedicado es asumible para nosotros. Y aceptamos penalizaciones razonables: confiamos en el plan.' },
      { id: 'alternativa', tipo: 'batna', texto: 'Mencionar, sin amenazar, que hay otros clientes interesados en vuestra capacidad',
        dicho: 'No es una amenaza, pero tiene que saberlo: hay otras cadenas interesadas en nuestra capacidad.' },
      { id: 'limite', tipo: 'reserva', texto: 'Confesar hasta dónde puedes llegar en descuento',
        dicho: 'Con total franqueza: como mucho podríamos llegar a un 9 %. Más, imposible.' }
    ],
    eventos: [
      {
        id: 'oferta-competidor', tipo: 'mensaje', quien: 'carmen', icono: 'mensaje', temporizador: 15,
        cuando: { turnoMin: 2, turnoMax: 5, prob: 0.6 },
        titulo: 'Carmen gira su portátil',
        texto: 'En la pantalla, un correo de TransRápido: una oferta un 15 % más barata. «Esto es lo que tengo encima de la mesa», dice.',
        opciones: [
          { id: 'preguntar', estilo: 'calma', texto: 'Preguntar con calma por la capacidad y los plazos de TransRápido',
            efectos: { confianza: 2, revelar: { pista: 'Al preguntarle por plazos y capacidad, Carmen admite que TransRápido no podría asumirlo todo antes de seis meses.', titulo: 'La oferta tiene letra pequeña', quien: 'carmen' } },
            respuesta: { quien: 'carmen', texto: 'La capacidad… la irían aumentando. En unos meses.' },
            juicio: 'acierto', conceptos: ['batna', 'encuadre'], explicacion: 'Antes de reaccionar ante una amenaza, compruébala: su alternativa tenía letra pequeña.' },
          { id: 'igualar', estilo: 'ceder', texto: 'Igualar el 15 % para no perderla',
            efectos: { aspiracion: 7 }, respuesta: { quien: 'carmen', texto: 'Vaya. Así que tenían margen y no lo habían dicho.' },
            juicio: 'error', sesgo: 'aversionPerdida', conceptos: ['encuadre', 'concesiones-reciprocas'], explicacion: 'El encuadre en pérdidas («o igualáis o os perdemos») te empujó a una concesión enorme sin comprobar nada. Con una competitiva, eso solo sube sus exigencias.' },
          { id: 'desafiar', estilo: 'presion', texto: 'Decirle que se vaya con ellos si tan buenos son',
            efectos: { confianza: -14, tension: 22 }, respuesta: { quien: 'carmen', texto: 'No me tiente.' },
            juicio: 'error', sesgo: 'exceso', conceptos: ['credibilidad'], explicacion: 'Desafiar sin conocer la fuerza real de su alternativa es apostar a ciegas, y tensa una relación ya rota.' }
        ],
        porDefecto: 'igualar'
      },
      {
        id: 'retraso-hoy', tipo: 'llamada', quien: 'operaciones', icono: 'telefono', temporizador: 20,
        cuando: { turnoMin: 3, prob: 0.6 },
        titulo: 'Te llama Operaciones',
        texto: '«Hoy ha habido otro retraso en una tienda de Hiperdía en Santander. Ya está resuelto, pero ella aún no lo sabe.»',
        opciones: [
          { id: 'contar', estilo: 'honesto', texto: 'Contárselo ahora, con la solución ya en marcha',
            efectos: { confianza: 8, tension: 5 }, respuesta: { quien: 'carmen', texto: '¿Otro más? … Bueno. Al menos me lo cuenta usted antes de que me entere por otro lado.' },
            juicio: 'acierto', conceptos: ['confianza'], explicacion: 'La transparencia en plena crisis cuesta un mal momento, pero gana credibilidad. Ocultarlo habría sido una bomba de relojería.' },
          { id: 'ocultar', estilo: 'mentir', texto: 'No decir nada y seguir negociando',
            efectos: { mentira: { prob: 0.65, turnos: 3, texto: 'ocultaste el retraso de hoy' } },
            juicio: 'error', sesgo: 'exceso', conceptos: ['confianza'], explicacion: 'Ocultar un hecho verificable a quien ya desconfía de ti es una apuesta muy arriesgada: si se descubre, la relación no se recupera.' },
          { id: 'minimizar', estilo: 'neutral', texto: 'Mencionarlo de pasada como algo sin importancia',
            efectos: { confianza: -4, tension: 8 }, respuesta: { quien: 'carmen', texto: '¿Sin importancia? Para usted, quizá.' },
            juicio: 'neutral', explicacion: 'Contarlo fue correcto; quitarle importancia, no: minimizar un problema delante de quien lo sufre irrita.' }
        ],
        porDefecto: 'ocultar'
      },
      {
        id: 'director', tipo: 'mensaje', quien: 'director', icono: 'mensaje', temporizador: 18,
        cuando: { turnoMin: 5, prob: 0.55 },
        titulo: 'Mensaje de tu director general',
        texto: '«No podemos perder Hiperdía. Haz lo que haga falta, aunque sea a pérdidas.»',
        opciones: [
          { id: 'mantener', estilo: 'calma', texto: 'Mantener tu punto de reserva: un cliente a pérdidas no es un cliente',
            efectos: {}, juicio: 'acierto', conceptos: ['punto-reserva', 'sistema-1-2'], explicacion: 'Nada había cambiado en tu BATNA: cambiar el límite por miedo a perder es dejar que el Sistema 1 negocie por ti.' },
          { id: 'bajar', estilo: 'ceder', texto: 'Bajar tu punto de reserva',
            efectos: { reservaJugador: -10 }, juicio: 'error', sesgo: 'aversionPerdida', conceptos: ['punto-reserva', 'encuadre'], explicacion: 'Bajaste tu límite por el miedo a perder, no por información nueva. «Aunque sea a pérdidas» es aversión a la pérdida en estado puro.' }
        ],
        porDefecto: 'bajar'
      }
    ],
    dialogos: {},
    partidaModelo: {
      semilla: 3033,
      preparacion: {
        investigar: ['incidencias', 'competidor', 'operaciones'],
        definir: { batnaId: 'perder', reserva: 24, objetivo: 66 }
      },
      introduccion: 'En una crisis, el orden importa: primero reconocer, después entender qué necesita la otra parte y solo al final negociar, siempre con concesiones condicionadas. Carmen es competitiva: cada regalo le abre el apetito.',
      comentariosPreparacion: [
        'Analiza las incidencias: el problema está acotado (una ruta) y le da un criterio objetivo.',
        'Investiga a TransRápido: la amenaza de Carmen es débil, así que no hay que ceder por miedo.',
        'Habla con el jefe de operaciones de Hiperdía: Carmen necesita un plan para defenderse ante su director.',
        'Su BATNA es mala (perder la cuenta): reserva baja, pero objetivo ambicioso porque sabe que la amenaza de Carmen es débil.'
      ],
      pasos: [
        { accion: { tipo: 'compartir', id: 'reconocer' }, comentario: 'Lo primero, reconocer el fallo sin excusas. La tensión baja y la confianza sube: ahora sí se puede negociar.' },
        { accion: { tipo: 'compartir', id: 'prioridad-duracion' }, comentario: 'Comparte prioridades, no límites: lo que más te importa es la continuidad (duración), más que el precio. Con una competitiva, la confianza se gana dando información útil y segura.' },
        { accion: { tipo: 'pregunta', id: 'garantias' }, comentario: 'Pregunta abierta: ¿qué garantías le darían tranquilidad? Penalizaciones por escrito: algo asumible si confías en tu plan (y los datos dicen que el problema es una sola ruta).' },
        { accion: { tipo: 'pregunta', id: 'que-necesita' }, comentario: 'Segunda pregunta: ¿qué necesita llevarle a su comité? Un plan creíble. Ya sabes cómo «pagarle» sin tocar el precio.' },
        { accion: { tipo: 'oferta', paquete: [0, 3, 2, 2], criterio: 'datos-incidencias' }, comentario: 'Paquete integrativo: plan con gestor dedicado y la penalización máxima (lo que ella necesita para defenderse) a cambio de tres años y sin descuento. Justificado con los datos de las incidencias.' },
        { accion: { tipo: 'concesion', variable: 0, pedir: 1 }, comentario: 'Si aprieta, concesión condicionada: algo de descuento, pero solo a cambio de suavizar la penalización. Nada gratis con una competitiva.' },
        { accion: { tipo: 'aceptar' }, comentario: 'Cuando su propuesta supera el objetivo, cierra. Has salvado la cuenta, el margen y la relación.' }
      ],
      eventos: { 'oferta-competidor': 'preguntar', 'retraso-hoy': 'contar', director: 'mantener' }
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
