/* =====================================================================
 * NEGOCIA · datos/dialogos.js
 * Líneas genéricas de la contraparte por reacción × personalidad, con
 * variantes. Los escenarios y personajes pueden sobrescribir cualquier
 * clave con líneas propias. Nunca revelan números ocultos: transmiten
 * matices (tono, prioridades, lenguaje corporal).
 * Marcadores: {nombre} {variable} {paquete} {opcion} {texto} {batna}
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};

  const L = {
    saludo: {
      comun: ['Gracias por venir. Vamos a ver si encontramos algo que funcione para los dos.'],
      competitiva: ['Tengo la agenda apretada, así que vayamos al grano.', 'Bien. Usted dirá; nosotros tenemos las ideas claras.'],
      colaborativa: ['Me alegra que nos sentemos. Seguro que encontramos una fórmula que nos sirva a ambos.', 'Bienvenido. Cuénteme cómo lo ve; quiero entender su situación.'],
      evasiva: ['Sí, bueno… tenemos un rato. Veamos qué propone.', 'Hola. No sé si hoy podremos cerrar nada, pero escuchemos.'],
      emocional: ['Le confieso que llego con ganas de que esto salga bien… y algo preocupado.', 'Me alegro de verle. Esto es importante para mí, de verdad.'],
      analitica: ['He revisado los números del último año. Me gustaría que habláramos con datos.', 'Empecemos por los hechos y luego vemos las cifras.']
    },
    invita: {
      comun: ['Usted ha pedido esta reunión: ¿qué propone?'],
      competitiva: ['Pongan su propuesta sobre la mesa y la valoramos.'],
      colaborativa: ['¿Por qué no empieza contándome qué tiene en mente?'],
      analitica: ['Adelante con su propuesta. La analizaré punto por punto.']
    },
    apertura_contraparte: {
      comun: ['Nuestra propuesta de partida es esta: {paquete}.'],
      competitiva: ['Seré directa: {paquete}. Es lo razonable dada la situación.'],
      emocional: ['Le diré lo que necesito: {paquete}. Y créame que lo he pensado mucho.']
    },
    contraoferta: {
      comun: ['No podemos aceptarlo así. Lo que sí podríamos hacer es esto: {paquete}.', 'Estamos lejos todavía. Le propongo: {paquete}.'],
      competitiva: ['No. Esto no se sostiene. Mi propuesta: {paquete}.', 'Así no vamos a ningún sitio. {paquete}, y es generoso.'],
      colaborativa: ['Entiendo lo que busca, pero así no me encaja. ¿Qué le parece esta alternativa? {paquete}.', 'Nos vamos acercando. Probemos con esto: {paquete}.'],
      evasiva: ['Mmm… no sé. Tendría que consultarlo. Quizá algo como {paquete}.', 'No es el momento de comprometernos con eso. Tal vez {paquete}…'],
      emocional: ['¡Eso me lo pone muy difícil! Mire, lo máximo que puedo es esto: {paquete}.', 'Uf… no. Esto no me convence. ¿Y si probamos {paquete}?'],
      analitica: ['Con esos números no me salen las cuentas. Contrapropuesta: {paquete}.', 'He hecho el cálculo y no es viable. Esto sí lo sería: {paquete}.']
    },
    pensativo: {
      comun: ['Hmm. Estamos cerca… pero aún no. ¿Qué le parece {paquete}?'],
      competitiva: ['No está mal, pero me falta algo. {paquete} y lo hablamos.'],
      colaborativa: ['Esto ya se parece a algo. Si ajustamos un poco: {paquete}.'],
      evasiva: ['Puede que sí… o puede que no. Déjeme pensar. ¿Y {paquete}?'],
      emocional: ['Vale… esto ya me gusta más. Casi. ¿Podríamos llegar a {paquete}?'],
      analitica: ['Interesante. El diferencial es pequeño. Mi propuesta de ajuste: {paquete}.']
    },
    ofendido: {
      comun: ['Con todo respeto: esto no es una oferta seria.'],
      competitiva: ['¿Me está tomando el pelo? Si es así como empezamos, empezamos mal. {paquete}.', 'Eso es una falta de respeto. Mi posición: {paquete}.'],
      colaborativa: ['Me decepciona. Pensaba que buscábamos algo justo para ambos. {paquete} sería un punto de partida serio.'],
      evasiva: ['Bueno… creo que no estamos hablando de lo mismo. {paquete}.'],
      emocional: ['¿En serio? Después de tantos años, ¿esto es lo que valemos para ustedes? {paquete}, como mínimo.', '¡Me parece ofensivo! Así no. {paquete}.'],
      analitica: ['Esa cifra está fuera de cualquier referencia de mercado. Hablemos en serio: {paquete}.']
    },
    se_endurece: {
      comun: ['Después de lo de antes, necesito más garantías: {paquete}.'],
      competitiva: ['He cambiado de idea. Visto cómo va esto, mi propuesta es {paquete}.'],
      emocional: ['Lo siento, pero ya no me fío igual. {paquete}.'],
      analitica: ['Reviso mi posición a la vista de su comportamiento: {paquete}.']
    },
    reciproca: {
      comun: ['Le agradezco el gesto. Yo también me muevo: {paquete}.'],
      competitiva: ['Bien. Por esa parte puedo ceder algo: {paquete}.'],
      colaborativa: ['Eso ayuda mucho. Le correspondo: {paquete}.', 'Así sí. Yo también pongo de mi parte: {paquete}.'],
      evasiva: ['Vale… algo puedo hacer: {paquete}.'],
      emocional: ['¡Gracias! Eso me demuestra que vamos en serio. Mire: {paquete}.'],
      analitica: ['Concesión registrada. La correspondo proporcionalmente: {paquete}.']
    },
    queja_variable: {
      comun: ['Lo que de verdad me preocupa es {variable}.', 'Para nosotros, {variable} no es un detalle menor.'],
      competitiva: ['{variable}: ahí no voy a ceder fácilmente.'],
      colaborativa: ['Le seré franco: {variable} es lo que más nos importa.'],
      evasiva: ['Digamos que {variable} es… delicado.'],
      emocional: ['¡Es que {variable} es lo que me quita el sueño!'],
      analitica: ['El punto crítico de mi análisis es {variable}.']
    },
    retroceso: {
      comun: ['Un momento: antes me ofrecía más. ¿Qué ha cambiado?'],
      competitiva: ['¿Ahora retrocede? Así no se negocia.'],
      emocional: ['¿Cómo que ahora menos? ¡Esto no es serio!'],
      analitica: ['Su oferta es peor que la anterior. Necesito que me explique la lógica.']
    },
    final_incumplida: {
      comun: ['¿No era su oferta final? Ya veo cuánto valen sus ultimátums.'],
      competitiva: ['Vaya. Así que lo de «oferta final» era teatro. Tomo nota.'],
      emocional: ['Me dijo que era lo último… ya no sé qué creer.']
    },
    final_aceptada: { comun: ['Si de verdad es su última palabra… está bien.'] },
    acepta: {
      comun: ['De acuerdo. Creo que es un acuerdo razonable. Cerremos.'],
      competitiva: ['Hecho. Cerramos así.', 'Está bien. Trato hecho.'],
      colaborativa: ['¡Perfecto! Creo que los dos salimos ganando.', 'Me parece un buen acuerdo para ambos. Adelante.'],
      evasiva: ['Bueno… vale. Sí. Lo cerramos.'],
      emocional: ['¡Sí! Me quita un peso de encima. Trato hecho.', '¡Por fin! Me alegro mucho, de verdad.'],
      analitica: ['Los números cuadran. Aceptado.', 'Es una solución eficiente. Acepto.']
    },
    cierre_acepta_jugador: {
      comun: ['Me alegra que lo vea así. Hecho.'],
      competitiva: ['Sabía que entraría en razón. Cerramos.'],
      colaborativa: ['Estupendo. Ha sido un placer negociar con usted.'],
      emocional: ['¡Qué alivio! Gracias, de verdad.'],
      analitica: ['Correcto. Preparo el documento con estas condiciones.']
    },
    acepta_parcial: {
      comun: ['Por nuestra parte, podríamos firmar esto.', 'Esto nosotros lo podemos aceptar.']
    },
    apoyo_aliado: {
      comun: ['Nosotros lo apoyamos. Creo que es una base sensata para todos.']
    },
    exigencia: {
      comun: ['Así no. Para nosotros, {variable} tiene que ser: {opcion}.', 'Necesitamos que en {variable} se llegue a {opcion}.'],
      competitiva: ['Sin {opcion} en {variable} no hay acuerdo. Así de claro.'],
      analitica: ['Mi condición es {variable}: {opcion}. Los números no salen de otra forma.'],
      emocional: ['¡{variable}! ¡Necesito {opcion}! No me pidan lo imposible.']
    },
    bloque: {
      comun: ['En esto estamos de acuerdo las dos partes: así no se puede seguir.']
    },
    bloque_roto: {
      comun: ['Parece que ya no todas las partes están en el mismo punto. Sigamos.']
    },
    meso_acepta: {
      comun: ['De las propuestas, la {opcion} nos funciona. Acepto esa.'],
      analitica: ['He comparado las tres. La {opcion} es la más eficiente para nosotros. Aceptada.']
    },
    meso_preferencia: {
      comun: ['Ninguna me convence del todo, pero la {opcion} es la que más se acerca.'],
      competitiva: ['Ninguna. Aunque si tuviera que elegir, la {opcion}.'],
      colaborativa: ['Gracias por darme opciones. La {opcion} es la que mejor encaja con lo que necesitamos.'],
      analitica: ['Evaluadas las tres, la {opcion} es la menos alejada de nuestro objetivo.']
    },
    pregunta_sugestiva: {
      comun: ['¿Es una pregunta o una acusación?', 'Si ya tiene la respuesta, ¿para qué pregunta?'],
      emocional: ['¡Vaya forma de preguntar! Me pone a la defensiva.']
    },
    respuesta_generica: { comun: ['Buena pregunta. Le diré lo que puedo decirle…'] },
    evasiva: {
      comun: ['Prefiero no entrar en eso por ahora.', 'Eso es algo interno. Centrémonos en la propuesta.'],
      competitiva: ['Eso no le incumbe. Hablemos de números.'],
      evasiva: ['Uf, eso es complicado… ya lo veremos más adelante.', 'Bueno, hay muchas cosas en juego, ya sabe.'],
      emocional: ['Todavía no le conozco lo suficiente para contarle eso.'],
      analitica: ['No dispongo de esos datos para compartirlos ahora mismo.']
    },
    agradece_info: {
      comun: ['Gracias por la franqueza. Eso me ayuda a entender qué buscan.'],
      competitiva: ['Bien saberlo.'],
      colaborativa: ['Se lo agradezco mucho. Con eso podemos diseñar algo mejor para los dos.'],
      evasiva: ['Ah. De acuerdo. Lo tendré en cuenta.'],
      emocional: ['Gracias por confiar en mí. Eso cambia el tono de la conversación.'],
      analitica: ['Información útil. La incorporo al análisis.']
    },
    se_abre_reciproco: {
      comun: ['Ya que es sincero, yo también: {texto}'],
      colaborativa: ['Le corresponderé con la misma franqueza: {texto}'],
      emocional: ['Le voy a contar algo que no suelo decir: {texto}']
    },
    respeta_poder: {
      comun: ['Ya veo. Entiendo que tiene alternativas. Quizá podamos ser más flexibles.'],
      competitiva: ['Bien. Respeto a quien tiene alternativas. Hablemos en serio.'],
      colaborativa: ['Entiendo. No quiero que se vaya por eso; busquemos una salida.'],
      emocional: ['¿Se iría? Vaya… no quiero perder esta relación.'],
      analitica: ['Comprendo. Recalcularé mi posición teniendo eso en cuenta.']
    },
    batna_debil: {
      comun: ['¿Esa es su alternativa? Con todo respeto, no parece mucho mejor que nada.'],
      competitiva: ['¿Eso es todo lo que tiene? Entonces nos necesita más de lo que dice.']
    },
    sabe_reserva: {
      comun: ['Gracias por el dato. Ahora sé exactamente dónde estamos.'],
      competitiva: ['Interesante. Eso nos ahorra mucho tiempo… a nosotros.']
    },
    sabe_plazo: {
      comun: ['Vaya, así que tiene prisa. Nosotros no tanta.'],
      competitiva: ['¿Antes del jueves? Bien. Podemos esperar.']
    },
    llama_farol: {
      comun: ['Pues adelante, vaya con ellos. Pero los dos sabemos que no lo hará.'],
      competitiva: ['¿Ah, sí? Llámelos ahora mismo. Le espero.', 'No me venda humo. Conozco el mercado.'],
      colaborativa: ['Esperaba más sinceridad. Así es difícil construir algo juntos.'],
      evasiva: ['Ya… bueno. Eso habría que verlo.'],
      emocional: ['¿Me amenaza? ¡Después de todo lo que hemos hablado!'],
      analitica: ['He hecho mis números sobre esa alternativa y no se sostienen.']
    },
    farol_bloque: {
      comun: ['Puede amenazar todo lo que quiera; en esto vamos juntos.']
    },
    pausa: {
      comun: ['Sí, me vendrá bien un café.', 'De acuerdo, cinco minutos.'],
      emocional: ['Gracias… lo necesitaba, la verdad.'],
      competitiva: ['Cinco minutos. Ni uno más.']
    },
    despedida_abandono: {
      comun: ['Vaya. Lamento que no hayamos llegado a nada.'],
      competitiva: ['Usted sabrá. La puerta está abierta… por ahora.'],
      colaborativa: ['Es una pena. Si cambia algo, llámeme.'],
      emocional: ['¿Así, sin más? Me deja muy mal sabor de boca.']
    },
    alianza: {
      comun: ['Eso cambia las cosas. Puede contar con nuestro apoyo en la mesa.']
    },
    descubre_pacto: {
      comun: ['¿Qué se ha cocinado a nuestras espaldas? Exijo transparencia.']
    },
    impaciente: {
      comun: ['Tenemos que ir cerrando. No puedo dedicar mucho más tiempo a esto.'],
      competitiva: ['Se me acaba la paciencia. Decídase.'],
      emocional: ['Estoy agotado de dar vueltas a lo mismo…'],
      analitica: ['Llevamos demasiadas iteraciones. Necesito convergencia.']
    },
    ultimatum: {
      comun: ['Esta es mi última propuesta. O cerramos ahora, o lo dejamos aquí.'],
      competitiva: ['Última oportunidad. La toma o la deja.'],
      emocional: ['No puedo más. Es esto o nada.']
    },
    se_retira: {
      comun: ['Lo siento, pero no veo forma de llegar a un acuerdo. Lo dejamos aquí.'],
      competitiva: ['Hemos perdido demasiado tiempo. Buenas tardes.'],
      emocional: ['Me voy. Esto ha sido una decepción.']
    },
    retirada_tension: {
      comun: ['No pienso seguir en este tono. Me marcho.'],
      emocional: ['¡Basta! No voy a aguantar esto. Adiós.']
    },
    retirada_desconfianza: {
      comun: ['No puedo negociar con alguien en quien no confío. Lo dejamos aquí.'],
      competitiva: ['Se acabó. No hago tratos con quien juega sucio.'],
      emocional: ['Me siento engañado. No quiero seguir con esto.'],
      analitica: ['Sin confianza no hay base para un acuerdo. Damos la reunión por terminada.']
    },
    mentira_descubierta: {
      comun: ['Me he enterado de que lo que me dijo no era cierto. ¿Cómo voy a fiarme ahora de usted?']
    },
    // ---- Líneas del jugador (voz neutra) ----
    jugador_presiona: { comun: ['Le seré claro: tenemos otra opción encima de la mesa ({batna}). Si esto no avanza, la tomaremos.'] },
    jugador_acepta: { comun: ['De acuerdo. Acepto su propuesta.'] },
    jugador_abandona: { comun: ['Creo que hoy no vamos a llegar a un acuerdo que nos convenga. Lo dejamos aquí.'] }
  };

  /* Lenguaje corporal (narración en cursiva). Coherente con estadoVisual. */
  const G = {
    saludo: ['Le estrecha la mano con firmeza y se sienta.', 'Sonríe con cortesía y abre su carpeta.'],
    contraoferta: ['Se recoloca en la silla.', 'Anota algo sin levantar la vista.'],
    pensativo: ['Se lleva la mano a la barbilla.', 'Mira el documento en silencio unos segundos.'],
    ofendido: ['Se echa hacia atrás y cruza los brazos.', 'Aprieta la mandíbula.'],
    molesto: ['Frunce el ceño.', 'Resopla y deja el bolígrafo sobre la mesa.'],
    se_endurece: ['Su gesto se endurece.', 'Endereza la espalda y le mira fijamente.'],
    reciproca: ['Asiente despacio.', 'Relaja los hombros.'],
    acepta: ['Sonríe y le tiende la mano.', 'Asiente con energía.'],
    se_abre: ['Se inclina hacia delante.', 'Baja la voz, en tono confidencial.'],
    evasiva: ['Desvía la mirada hacia el móvil.', 'Ordena unos papeles que no necesitan orden.'],
    receptivo: ['Asiente con interés.', 'Toma nota con atención.'],
    confiado: ['Esboza media sonrisa.', 'Se recuesta, relajado.'],
    desconfiado: ['Entorna los ojos.', 'Le observa en silencio, con recelo.'],
    llama_farol: ['Le sostiene la mirada sin pestañear.', 'Se ríe por lo bajo.'],
    respeta_poder: ['Se queda pensativo.', 'Tamborilea los dedos sobre la mesa.'],
    pausa: ['Se levanta a servirse un café.', 'Estira la espalda y suspira.'],
    sorprendido: ['Arquea las cejas.', 'Se queda un momento sin palabras.'],
    impaciente: ['Mira el reloj.', 'Golpea la mesa con el bolígrafo.'],
    mira_reloj: ['Mira el reloj de reojo.'],
    se_retira: ['Recoge sus cosas y se levanta.', 'Cierra la carpeta de golpe y se pone en pie.']
  };

  function rellenar(t, ctx) {
    return t.replace(/\{(\w+)\}/g, (m, k) => (ctx && ctx[k] !== undefined ? ctx[k] : m));
  }

  /* Elige una línea: específicos (personaje/escenario) > personalidad > común. */
  function linea(rng, clave, personalidad, especificos, ctx) {
    let opciones = null;
    for (const e of especificos || []) {
      if (Array.isArray(e) && e.length) { opciones = e; break; }
      if (typeof e === 'string') { opciones = [e]; break; }
      if (e && typeof e === 'object' && (e[personalidad] || e.comun)) { opciones = e[personalidad] || e.comun; break; }
    }
    if (!opciones) {
      const grupo = L[clave];
      if (!grupo) return '';
      opciones = grupo[personalidad] || grupo.comun || [];
    }
    if (!opciones.length) return '';
    return rellenar(NG.Util.elegir(rng, opciones), ctx);
  }
  function gesto(rng, reaccion) {
    const g = G[reaccion];
    return g ? NG.Util.elegir(rng, g) : null;
  }

  NG.Dialogos = { lineas: L, gestos: G, linea, gesto, rellenar };
})(typeof window !== 'undefined' ? window : globalThis);
