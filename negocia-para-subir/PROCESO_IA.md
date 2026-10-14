# Cómo se construyó NEGOCIA con IA

Registro breve del proceso para presentar en clase: qué se pidió, cómo se trabajó con el asistente (Claude, en Claude Code), qué decisiones se tomaron, qué funcionó y qué hubo que corregir.

## 1. Punto de partida

Un único *prompt* largo y estructurado definía el rol (equipo de *game designer*, desarrollo *front-end* y experto en negociación), el objetivo, la mecánica, la capa visual, los requisitos técnicos, el método de trabajo y los criterios de éxito. Dos peticiones explícitas marcaron el proceso:

- **Planificar antes de programar** y esperar aprobación.
- **Trabajar por fases con un commit al terminar cada una**, probando el motor con partidas simuladas y comprobando visualmente el resultado.

## 2. Método

| Fase | Qué se hizo | Commit |
|---|---|---|
| Plan | Arquitectura, modelo de datos, fórmulas del motor, sistema visual y orden de trabajo. Dos preguntas al usuario: cómo instalar Node (no estaba en el equipo) y dónde crear el proyecto. | — |
| A · Motor | Núcleo puro (utilidad, Pareto/ZOPA/Nash, preparación, motor, sesgos, puntuación), escenario 1, mini-runner de tests y agentes de simulación. | `7d30b36` |
| B · Visual base | Avatares paramétricos SVG, función `estadoMotor → estadoVisual`, escenas por capas, menú, sonido. | `3abc6bd` |
| C · E1 jugable | Preparación, negociación, imprevistos, tutorial, cinemáticas. | `641af4e` |
| D · Debrief | Cartas ocultas, mapa del espacio de acuerdos, línea de tiempo, sesgos, conceptos, partida modelo. | `ea2581d` |
| E · E2–E5 | Cuatro escenarios con sus personajes, asesor (E4) y multiparte (E5); balance completo. | `2e35bcd` |
| F · Progresión | Mapa de campaña, biblioteca, logros, rangos, desbloqueos. | `11992aa` |
| G · Pulido | Responsive, accesibilidad, pruebas `file://`, documentación. | `cf755e8` y siguientes |
| Fase 2 · Modo IA | Servidor proxy local, interpretación y narración con Claude, cliente simulado para pruebas, caja de texto en la negociación. | `108e608` |

## 3. Decisiones tomadas (y por qué)

- **Node portable dentro del proyecto** (`.tools/`, ignorado por git), descargado de nodejs.org con verificación SHA-256. No toca el sistema del usuario.
- **Scripts clásicos con un espacio de nombres global `NG`**, no módulos ES. Así funciona con doble clic (`file://`) y el mismo archivo se carga en Node para los tests.
- **Variables con opciones discretas.** Permiten enumerar todo el espacio de acuerdos y calcular la frontera de Pareto exacta, lo que hace posible el debrief de «lo que quedó sobre la mesa».
- **El motor devuelve una cola de salidas** y la interfaz solo la anima. Esto separa por completo la lógica de la presentación y permite que los agentes de simulación jueguen con la misma API que el jugador.
- **Aleatoriedad con semilla, y aparte la de los textos.** La partida modelo es reproducible y cambiar un diálogo no altera el balance.
- **Personajes en dos capas** (cuerpo detrás de la mesa, brazos encima). Era necesario para que las manos se apoyaran sobre la mesa.
- **El jugador ve su propia hoja de puntos**, como en los ejercicios del Programa de Negociación de Harvard (*New Recruit*): así se entiende la ZOPA sin fórmulas.
- **E5 con tres partes** (dirección = jugador, sindicato y fondo) más una mediadora como personaje no negociador. Es fiel al enunciado y añade un personaje a la mesa.
- **Modo IA: Claude traduce y narra, pero no decide.** Se descartó dejar que el modelo «jugara» de contraparte. Las variables ocultas, el balance probado con 1.000 partidas y el debrief dependen de que el motor sea determinista y verificable. Claude interpreta el texto del jugador como una jugada y redacta la respuesta que el motor ya ha elegido.
- **Documentación antes que memoria.** Antes de escribir la llamada a la API se consultó la documentación vigente (skill `claude-api` de Claude Code) y la versión publicada del SDK (`npm view`). Así se usaron el modelo actual, la salida estructurada con `output_config.format`, `fallbacks: "default"` y la comprobación de `stop_reason: "refusal"`, en lugar de patrones antiguos recordados.
- **Un cliente simulado para probar sin clave.** No había clave de API en el equipo. Se escribió un cliente falso con la misma forma que el SDK, que permite probar de verdad el proxy, los esquemas, la interfaz y los fallos. Lo único que queda sin probar es la respuesta del modelo real.
- **Criterio de «no obvio» revisado** (ver `DISENO.md` §6.2). El criterio inicial (que la buena estrategia aprobase como mucho el 95 %) castigaba que un buen método funcione de forma fiable. Se sustituyó por: ninguna estrategia trivial gana y las ★★★ no salen solas.

## 4. Iteraciones: lo que no salió bien a la primera

Lo más valioso del proceso fue que **las pruebas automáticas y visuales detectaron problemas que el diseño teórico no había previsto**:

1. **El tutorial era demasiado fácil y las estrategias triviales aprobaban.** En la primera simulación, el blando y el regateador superaban el 100 % de las partidas y el agresivo el 75 %. Se añadieron:
   - una prima por desconfianza;
   - que la contraparte solo proponga intercambios beneficiosos para ti si sabe lo que valoras;
   - variación oculta por partida;
   - más detección del anclaje.
2. **Una contraoferta absurda que solo se vio en pantalla.** Jugando E1 por la interfaz, Jordi propuso 8.000 t cuando ambos querían más volumen. Era un caso del 7 % de las partidas en que el objetivo caía en un «hueco» del espacio discreto. La primera corrección (que la contraparte mejorase gratis el paquete) regalaba demasiado y rompía el balance. La solución final se apoya en la literatura: **la contraparte también tiene el sesgo del pastel fijo** (Thompson y Hastie) y solo descubre las cuestiones compatibles si compartes información. Así se arregló el fallo *y* el regateador dejó de ganar.
3. **El agresivo seguía ganando con paciencia**: insultaba y esperaba a que la aspiración de la contraparte cayera al final. Se añadió la retirada por desconfianza total, la gravedad creciente de los sesgos repetidos y más peso a la relación.
4. **Falsos positivos en la detección de sesgos.** Las partidas modelo «cometían» sesgo de confirmación por no mover una variable respecto a su primera oferta, cuando ya la habían cedido desde el principio. Se corrigió comparando con el statu quo, y considerando los compromisos laterales como una forma de atender un interés.
5. **El «retroceso» castigaba la redistribución en multiparte.** Ahora solo es mala fe si recuperas valor para ti.
6. **E5: el statu quo era demasiado bueno.** Aceptable para todos, así que el regateador ganaba sin negociar. Se sustituyó por la propuesta inicial del fondo.
7. **Fallos visuales detectados en capturas:**
   - las expresiones del retrato no cambiaban por un atributo duplicado;
   - el emblema no se veía porque sus degradados compartían `id` con uno oculto;
   - el reloj de la mesa saltaba porque la animación CSS sustituía el `transform` de posición;
   - los títulos de las notas del tablón eran invisibles;
   - en móvil, las acciones quedaban al final de la página.
8. **La prueba del Modo IA destapó un fallo del modo clásico.** Al leer las exigencias narradas en E5 apareció «Sin *Sin plan* en plan de recolocación no hay acuerdo». Rosa exigía justo lo que ya se le ofrecía: el motor tomaba la variable que más le dolía de tu oferta, pero el valor salía de su contraoferta, que compensaba en otras variables. Se corrigió con un test de regresión (falla con el motor anterior y pasa con el nuevo) y se repitió la simulación: los 45 criterios se siguen cumpliendo.
9. **El panel del navegador integrado estaba oculto** y sus capturas salían desfasadas. Se escribió una herramienta propia de pruebas de extremo a extremo (`herramientas/e2e.js`) que controla Chrome *headless* por el protocolo DevTools, sin dependencias. Hace clic, pulsa teclas reales, captura pantallas y recoge errores de consola. Con ella se jugaron los cinco escenarios completos por `file://` y por servidor, en escritorio y en móvil.

## 5. Qué funcionó especialmente bien

- **Simular antes de diseñar a ojo.** Los agentes (agresivo, blando, regateador, aleatorio, colaborativo) convirtieron el «¿está equilibrado?» en tablas medibles con 1.000 partidas por agente en menos de un minuto.
- **Una función pura para el estado visual.** Probar con tests que «con tensión alta nadie aparece entusiasmado» garantiza que la cara del personaje dice la verdad sobre el motor.
- **Partidas modelo como tests.** Si un cambio de balance rompe la demostración comentada, un test falla.
- **Comprobar visualmente cada fase** con capturas reales, en lugar de dar por bueno el código.

## 6. Cifras finales

- Unas 8.600 líneas de juego (JavaScript, CSS y datos) y 1.850 de tests y herramientas, sin una sola dependencia externa.
- Modo IA opcional: unas 570 líneas de servidor en `servidor/`, con una única dependencia, el SDK oficial de Anthropic.
- 108 tests del núcleo, 12 del servidor, 22 comprobaciones E2E del Modo IA y 45 criterios de balance cumplidos.
- 5 escenarios, 7 escenas ilustradas, 9 personajes, 26 fichas de biblioteca, 16 logros.
- Partidas completas por la interfaz sin errores de consola en Chrome (`file://` y servidor, escritorio y móvil 375 px).
- Pendiente de verificar en navegadores no disponibles en el equipo de desarrollo (Firefox). El código usa solo APIs estándar.
- Pendiente de verificar el Modo IA contra la API real: no había clave en el equipo de desarrollo (ver `DISENO.md` §8.5).
