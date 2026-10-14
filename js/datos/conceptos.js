/* =====================================================================
 * NEGOCIA · datos/conceptos.js
 * Fichas de la Biblioteca: conceptos de negociación y sesgos cognitivos.
 * Cada ficha: definición breve, ejemplo, cómo aplicarla y fuente.
 * Los sesgos reutilizan el catálogo de núcleo/sesgos.js (id 'sesgo-…').
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};

  const C = [
    { id: 'batna', nombre: 'BATNA (MAAN)', categoria: 'Fundamentos', icono: 'escudo',
      definicion: 'Best Alternative To a Negotiated Agreement: tu mejor alternativa si no hay acuerdo (en español, MAAN). Es la fuente principal de tu poder en la mesa.',
      ejemplo: 'Si tienes una oferta firme de otra acería a 830 €/t, no tiene sentido aceptar nada peor de tu proveedor actual.',
      aplicar: 'Antes de negociar, identifica tus alternativas, verifícalas y trata de mejorarlas. Estima también la BATNA de la otra parte.',
      fuente: 'Fisher, Ury y Patton (1981), «Obtenga el sí».' },
    { id: 'punto-reserva', nombre: 'Punto de reserva', categoria: 'Fundamentos', icono: 'bandera',
      definicion: 'El peor acuerdo que estás dispuesto a aceptar. Se deriva de tu BATNA: por debajo de él, es mejor levantarse.',
      ejemplo: 'Si tu alternativa vale 48 puntos, tu punto de reserva debería rondar los 48.',
      aplicar: 'Fíjalo antes de sentarte y no lo cambies por presión, solo por información nueva sobre tu alternativa.',
      fuente: 'Raiffa (1982), «The Art and Science of Negotiation».' },
    { id: 'zopa', nombre: 'ZOPA', categoria: 'Fundamentos', icono: 'diana',
      definicion: 'Zone Of Possible Agreement: el conjunto de acuerdos que ambas partes prefieren a sus alternativas. Si no existe, lo racional es no acordar.',
      ejemplo: 'Si lo mínimo que acepta tu proveedor está por debajo de lo máximo que tú pagarías, hay ZOPA: la cuestión es quién se queda con cuánto.',
      aplicar: 'Estima los límites de ambos. Tu objetivo es acabar cerca del límite de la otra parte… sin romper la relación.',
      fuente: 'Raiffa (1982); Lax y Sebenius (1986), «The Manager as Negotiator».' },
    { id: 'anclaje', nombre: 'Primera oferta y anclaje', categoria: 'Táctica', icono: 'bandera',
      definicion: 'La primera cifra que se pone sobre la mesa arrastra las expectativas de ambas partes. Quien abre con una oferta ambiciosa pero creíble suele obtener mejores resultados.',
      ejemplo: 'Abrir pidiendo 780 €/t (justificado por el índice) hace que 820 parezca una concesión; abrir en 840 lo convierte en el techo.',
      aplicar: 'Si tienes buena información, abre tú. Si la otra parte ancla de forma extrema, no contraofertes a partir de su cifra: recházala y reancla.',
      fuente: 'Tversky y Kahneman (1974); Galinsky y Mussweiler (2001).' },
    { id: 'intereses-posiciones', nombre: 'Intereses frente a posiciones', categoria: 'Principios', icono: 'pregunta',
      definicion: 'La posición es lo que alguien pide («quiero un 20 % más»); el interés es por qué lo pide (flexibilidad, reconocimiento, seguridad). Los intereses admiten muchas soluciones; las posiciones, pocas.',
      ejemplo: 'Una ingeniera pide más sueldo, pero lo que necesita es teletrabajar para cuidar de su padre.',
      aplicar: 'Pregunta «¿por qué?», «¿qué te preocupa?», «¿qué pasaría si…?». Escucha más de lo que hablas.',
      fuente: 'Fisher, Ury y Patton (1981).' },
    { id: 'principios', nombre: 'Negociación basada en principios', categoria: 'Principios', icono: 'libro',
      definicion: 'Método de Harvard con cuatro ideas: separa a las personas del problema, céntrate en intereses, inventa opciones de mutuo beneficio e insiste en criterios objetivos.',
      ejemplo: 'En lugar de discutir quién tiene razón sobre los retrasos, se diseña juntos un plan de mejora con penalizaciones razonables.',
      aplicar: 'Sé duro con el problema y suave con las personas. Genera varias opciones antes de decidir.',
      fuente: 'Fisher, Ury y Patton (1981), Programa de Negociación de Harvard.' },
    { id: 'criterios-objetivos', nombre: 'Criterios objetivos', categoria: 'Principios', icono: 'indice',
      definicion: 'Referencias externas e independientes de la voluntad de las partes (precios de mercado, índices, precedentes, valoraciones expertas) que legitiman una propuesta.',
      ejemplo: '«El índice del acero ha caído un 6 %: por eso proponemos 800 €/t».',
      aplicar: 'Investiga criterios antes de negociar y preséntalos al ofertar. Pregunta a la otra parte qué criterio usa ella.',
      fuente: 'Fisher, Ury y Patton (1981).' },
    { id: 'crear-valor', nombre: 'Crear y reclamar valor', categoria: 'Estrategia', icono: 'apreton',
      definicion: 'Toda negociación tiene dos tareas en tensión: agrandar el pastel (crear valor) y repartirlo (reclamarlo). Quien solo reclama deja valor sin crear; quien solo crea puede ser explotado.',
      ejemplo: 'Pagar a 30 días vale mucho para un proveedor con problemas de tesorería y poco para ti: ese intercambio crea valor para ambos.',
      aplicar: 'Primero explora intereses y diferencias; luego reparte con criterios. Comparte prioridades, no límites.',
      fuente: 'Lax y Sebenius (1986), «The Manager as Negotiator».' },
    { id: 'intercambio-integrativo', nombre: 'Intercambio integrativo', categoria: 'Estrategia', icono: 'concesion',
      definicion: 'Ceder en lo que a ti te importa poco a cambio de lo que te importa mucho (y a la otra parte al revés). También llamado logrolling.',
      ejemplo: 'Aceptas pagar antes (te cuesta poco) a cambio de un precio más bajo (te importa mucho).',
      aplicar: 'Negocia varias variables a la vez, nunca de una en una. Usa concesiones condicionadas: «si… entonces…».',
      fuente: 'Pruitt (1981); Thompson (2015), «The Mind and Heart of the Negotiator».' },
    { id: 'concesiones-reciprocas', nombre: 'Concesiones recíprocas', categoria: 'Táctica', icono: 'concesion',
      definicion: 'La norma de reciprocidad hace que una concesión invite a otra. Pero una concesión grande, temprana e incondicional se lee como debilidad.',
      ejemplo: 'Si cedes dos veces seguidas sin que la otra parte se mueva, le estás enseñando a esperar.',
      aplicar: 'Concede poco a poco, de forma decreciente y siempre a cambio de algo. Señala tus concesiones para que se valoren.',
      fuente: 'Cialdini (1984), «Influencia»; Pruitt (1981).' },
    { id: 'meso', nombre: 'Ofertas múltiples equivalentes (MESO)', categoria: 'Táctica', icono: 'meso',
      definicion: 'Presentar a la vez dos o tres paquetes de igual valor para ti. La elección de la otra parte revela sus prioridades y transmite flexibilidad.',
      ejemplo: '«A: 800 €, 30 días; B: 780 €, 60 días; C: 790 €, 45 días y más volumen. ¿Cuál os encaja mejor?».',
      aplicar: 'Asegúrate de que todas te valen lo mismo. Usa la respuesta para afinar tu siguiente propuesta.',
      fuente: 'Medvec y Galinsky (2005), Programa de Negociación de Harvard.' },
    { id: 'contratos-contingentes', nombre: 'Contratos contingentes', categoria: 'Estrategia', icono: 'grafico',
      definicion: 'Acuerdos cuyo resultado depende de un hecho futuro (por ejemplo, un earn-out ligado a los resultados). Permiten cerrar cuando las partes tienen expectativas distintas.',
      ejemplo: 'El fundador cree que su empresa crecerá; tú lo dudas. Un earn-out le paga más… solo si crece.',
      aplicar: 'Cuando el desacuerdo es sobre el futuro, deja de discutir y apuesta: define métricas objetivas y verificables.',
      fuente: 'Bazerman y Gillespie (1999), «Betting on the Future», Harvard Business Review.' },
    { id: 'informacion-asimetrica', nombre: 'Información asimétrica', categoria: 'Estrategia', icono: 'ojo',
      definicion: 'Una parte sabe cosas que la otra no. Quien vende sabe más del producto; quien compra con prisa revela más de lo que debe. Puede provocar la «maldición del ganador».',
      ejemplo: 'Comprar una empresa sin due diligence: si aceptan tu primera oferta, quizá sabían algo que tú no.',
      aplicar: 'Investiga, pregunta y protege tus límites. Pregúntate: «¿por qué aceptan tan rápido?».',
      fuente: 'Akerlof (1970); Bazerman y Samuelson (1983).' },
    { id: 'coaliciones', nombre: 'Coaliciones', categoria: 'Multiparte', icono: 'personas',
      definicion: 'En negociaciones con más de dos partes, los acuerdos entre subgrupos cambian el poder de cada uno. Quien queda aislado pierde fuerza.',
      ejemplo: 'Si el sindicato y el fondo se alían contra la dirección, sus exigencias se suman; un compromiso lateral puede romper ese bloque.',
      aplicar: 'Mapea intereses comunes entre las partes, construye alianzas antes de la sesión plenaria y evita propuestas que perjudiquen a todos a la vez.',
      fuente: 'Raiffa (1982); Lax y Sebenius (2006), «3-D Negotiation».' },
    { id: 'ir-al-balcon', nombre: 'Ir al balcón', categoria: 'Emociones', icono: 'pausa',
      definicion: 'Tomar distancia mental (o física, con una pausa) cuando la tensión sube, para responder en lugar de reaccionar.',
      ejemplo: 'Ante un ataque, pides cinco minutos en lugar de contraatacar.',
      aplicar: 'Nombra la táctica, gana tiempo, no tomes decisiones importantes en caliente.',
      fuente: 'Ury (1991), «Supere el no».' },
    { id: 'confianza', nombre: 'Confianza y reputación', categoria: 'Emociones', icono: 'corazon',
      definicion: 'La confianza abre la puerta a compartir información y crear valor. Se construye despacio con coherencia y reciprocidad, y se destruye en segundos con una mentira.',
      ejemplo: 'Revelar un retraso antes de que el cliente lo descubra protege la relación.',
      aplicar: 'Cumple lo que dices, comparte primero algo de bajo riesgo y nunca mientas sobre hechos verificables.',
      fuente: 'Lewicki y Bunker (1996); Malhotra y Bazerman (2007), «Negotiation Genius».' },
    { id: 'credibilidad', nombre: 'Credibilidad de las amenazas', categoria: 'Táctica', icono: 'presion',
      definicion: 'Una amenaza (o una «oferta final») solo funciona si es creíble. Si no la cumples, pierdes poder para el resto de la negociación.',
      ejemplo: 'Decir «esta es mi última oferta» y seguir negociando enseña a la otra parte que tus límites son de papel.',
      aplicar: 'No amenaces con lo que no estés dispuesto a hacer. Apoya tu BATNA con hechos.',
      fuente: 'Schelling (1960), «The Strategy of Conflict».' },
    { id: 'encuadre', nombre: 'Encuadre (framing)', categoria: 'Sesgos', icono: 'cerebro',
      definicion: 'La misma propuesta se percibe distinta si se presenta como ganancia o como pérdida. Ante pérdidas, las personas asumen más riesgos.',
      ejemplo: '«Si no cerramos, perderéis el 30 % de vuestro volumen» empuja más que «si cerramos, mantendréis el 70 %».',
      aplicar: 'Detecta cuándo te encuadran en pérdidas y reformula la situación en términos neutros.',
      fuente: 'Tversky y Kahneman (1981); Kahneman (2011).' },
    { id: 'sistema-1-2', nombre: 'Sistema 1 y Sistema 2', categoria: 'Sesgos', icono: 'rayo',
      definicion: 'El Sistema 1 piensa rápido, intuitivo y emocional; el Sistema 2, despacio y deliberado. La prisa y la presión entregan las decisiones al Sistema 1, donde viven los sesgos.',
      ejemplo: 'Un mensaje urgente del director financiero te empuja a bajar tu reserva sin que haya cambiado nada.',
      aplicar: 'Ante una decisión importante con prisa, para y pregúntate qué ha cambiado realmente.',
      fuente: 'Kahneman (2011), «Pensar rápido, pensar despacio».' }
  ];

  const FUENTES_SESGOS = {
    anclaje: 'Tversky y Kahneman (1974), «Judgment under Uncertainty».',
    aversionPerdida: 'Kahneman y Tversky (1979), teoría de las perspectivas.',
    escalada: 'Staw (1976), «Knee-deep in the big muddy».',
    confirmacion: 'Nickerson (1998), revisión sobre el sesgo de confirmación.',
    exceso: 'Moore y Healy (2008), «The trouble with overconfidence».',
    costeHundido: 'Arkes y Blumer (1985), «The psychology of sunk cost».',
    pastelFijo: 'Bazerman y Neale (1992); Thompson y Hastie (1990).'
  };

  NG.Conceptos = {
    lista: () => {
      const sesgos = Object.keys(NG.Sesgos ? NG.Sesgos.catalogo : {}).map((id) => {
        const s = NG.Sesgos.catalogo[id];
        return { id: 'sesgo-' + id, nombre: s.nombre, categoria: 'Sesgos', icono: 'cerebro', definicion: s.definicion, ejemplo: '', aplicar: s.consejo, fuente: FUENTES_SESGOS[id] || '' };
      });
      return C.concat(sesgos);
    },
    obtener(id) { return NG.Conceptos.lista().find((c) => c.id === id) || null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
