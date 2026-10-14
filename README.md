# NEGOCIA · El arte de negociar

Serious game web 2D para que directivos y mandos entrenen **negociación** y **toma de decisiones bajo presión**. Cinco escenarios de dificultad creciente, escenas ilustradas en SVG, personajes con expresiones ligadas al estado oculto del motor y un debrief que explica qué quedó sobre la mesa y qué sesgos cometiste.

## Para el profesor: cómo probarlo en 2 minutos

1. **Abre `index.html` con doble clic** (o la web publicada). No hace falta instalar nada.
2. Pulsa **«Mesa de crisis · 3 jugadores»**: es la simulación de decisiones en equipo de la actividad. Puede jugarla una sola persona alternando los tres roles (casilla «Juega una sola persona»).
3. **IA sin claves:** abriendo el enlace del Artifact en claude.ai, la mediadora usa **Claude** con la cuenta de quien juega (no hay ninguna clave en el código). Fuera de claude.ai (doble clic, GitHub) la mediadora funciona con un agente local sin conexión, y la partida es la misma. En cada intervención, «Ver cómo ha trabajado la IA» muestra el prompt por secciones, la respuesta y si se validó, corrigió o descartó.

## Mesa de crisis (modo equipo, 10–15 min)

Textiles Miralles tiene 6 meses de caja. **Dirección**, **Comité de empresa** y **Fondo Nordia** deben firmar un plan de viabilidad.
- **Roles con información privada:** cada uno tiene su hoja de puntos, su mínimo, un objetivo secreto y datos confidenciales, que solo ve en su turno tras una pantalla de «pasa el dispositivo».
- **Cuatro fases:**
  1. **Posturas** secretas: firme, abierta o colaborativa.
  2. **Rondas** de propuestas: cada ronda propone un rol y los otros votan en secreto.
  3. **Ratificación** ante los suyos (consejo, asamblea, comité de inversión).
  4. **Evaluación**.
- **Recursos compartidos:** caja, clima social y confianza. Las decisiones tienen consecuencias:
  - cada rechazo cuesta un mes de caja;
  - con clima 80 hay huelga;
  - sin confianza no se pueden ofrecer compromisos laterales;
  - un plan firmado por debajo del mínimo de alguien no se ratifica.
- **Mediadora IA (Pilar Sanz):**
  - elige qué imprevisto abre cada ronda, entre los que permiten las reglas;
  - analiza cada rechazo y propone un plan concreto que se puede adoptar con un clic;
  - al final evalúa a cada rol.

Sus respuestas se validan antes de cambiar el juego: índices válidos, imprevistos permitidos y nada de información privada filtrada.

## Cómo jugar

- **Doble clic en `index.html`**: funciona sin servidor ni conexión (scripts clásicos, sin dependencias).
- Opcional, con servidor local: `node herramientas/servidor-estatico.js` y abre http://localhost:5173

## Modo IA (opcional)

La contraparte también puede **conversar en lenguaje natural**: escribes lo que dirías en la mesa, Claude lo traduce a una jugada, el motor decide la respuesta (con sus variables ocultas, igual que en modo clásico) y Claude le pone voz. El avatar reacciona exactamente igual. Sin clave, o abriendo con doble clic, el juego funciona completo en modo clásico.

```bash
export ANTHROPIC_API_KEY=tu-clave        # solo en el entorno del servidor, nunca en el código
cd servidor && npm install && cd ..      # una vez: instala @anthropic-ai/sdk
node servidor/servidor.mjs               # sirve el juego y hace de proxy → http://localhost:5173
```

- Modelo por defecto: `claude-opus-5-5` (cámbialo con `NEGOCIA_MODELO`). Si una respuesta es declinada por los filtros de seguridad, la API la reintenta automáticamente con otro modelo (*fallbacks*).
- En la negociación aparece la caja **«Dilo con tus palabras»** encima de los botones, con un interruptor para desactivarla. Los botones clásicos siguen disponibles.
- Al servidor solo viaja lo que el jugador ya ve y las líneas que el motor ha decidido: nunca reservas, pesos ni BATNA de la contraparte. Detalles en `DISENO.md` §8.

## Pruebas

```bash
node tests/ejecutar.js          # 125 tests (motor, modo equipo, mediadora IA, sesgos, puntuación, estado visual, datos, balance)
node tests/simulacion.js 1000   # simulación de balance → tests/informe_balance.md
node herramientas/e2e-partida.js capturas http://localhost:5173/ e1-proveedor   # partida completa por la interfaz (Chrome headless)
node servidor/pruebas.mjs       # Modo IA: proxy, seguridad y esquemas con un cliente simulado (sin clave ni coste)
node herramientas/e2e-ia.js     # Modo IA por la interfaz con el cliente simulado
node herramientas/e2e-equipo.js # partida completa del modo equipo (añade 1 para simular Claude dentro de claude.ai)
```

En este equipo Node está en `.tools/node/bin/node` (portable, ignorado por git).

## Estructura

```
js/nucleo/     Lógica pura sin DOM (también en Node): util, analisis (Pareto/ZOPA/Nash), personalidades,
               preparacion, motor, sesgos, puntuacion, progreso, estadoVisual (estadoMotor → estadoVisual)
js/datos/      Diálogos, conceptos, logros y un archivo por escenario (escenarios/e1…e5)
js/visual/     Avatares paramétricos SVG, escenas por capas, objetos, efectos y cinemáticas
js/audio/      Sonido sintetizado con Web Audio
js/ui/         Pantallas: menú, mapa, briefing, preparación, negociación, imprevistos, debrief, biblioteca, logros
js/ia/         Mediadora IA del modo equipo (prompts por secciones, validación, proveedores) y Modo IA de la campaña
servidor/      Servidor local opcional (Node + @anthropic-ai/sdk): proxy hacia la API, con la clave en el entorno
css/           base (tokens), ui, escena (personajes y animaciones), pantallas
tests/         Mini-runner, tests, agentes de simulación e informe de balance
herramientas/  Servidor estático, galería de personajes y pruebas E2E sin dependencias
```

## Añadir un escenario

1. Copia `js/datos/escenarios/e1-proveedor.js` y edita sus datos con `NG.Escenarios.registrar({...})`: variables con opciones discretas y la curva y el peso del jugador; contrapartes con pesos, curvas, reserva, aspiración, paciencia, personalidad e intereses; fichas de investigación, preguntas, información, eventos y la partida modelo.
2. Añade su `<script>` en `index.html` (después de los demás escenarios) y en `tests/cargar.js`.
3. Elige una escena existente en `escena.negociacion` o crea una nueva en `js/visual/escenas.js`.
4. Ejecuta `node tests/ejecutar.js`: los tests de datos validan pesos, ZOPA, referencias internas y que la partida modelo saque ★★★.
