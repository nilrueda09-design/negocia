# NEGOCIA · Documento de diseño

Este documento explica **por qué** el juego es como es: qué teoría de negociación y de toma de decisiones aplica y dónde, cómo funciona el motor que mueve a las contrapartes, cómo se traduce ese estado en lo que el jugador ve y qué resultados dieron las pruebas de balance.

---

## 1. Objetivo pedagógico

El público son directivos y mandos intermedios sin formación previa en negociación. Tras jugar deberían poder explicar con sus palabras:

1. **Qué es su BATNA** y por qué mejorarla antes de sentarse vale más que cualquier táctica en la mesa.
2. **Por qué anclar importa**: la primera cifra arrastra las expectativas, pero un ancla extrema ofende.
3. **Cuándo conviene ceder**: en lo que a ti te importa poco y al otro mucho, de forma condicionada y recíproca.
4. **Que negociar no es repartir un pastel fijo**: preguntando por intereses se descubre valor que no estaba sobre la mesa.
5. **Que la prisa y el miedo deciden por ti** (Sistema 1) y producen sesgos reconocibles.

El juego no enseña estas ideas con texto, sino haciendo que **sean la estrategia ganadora**. Las simulaciones (sección 6) lo demuestran: la estrategia que crea valor supera sistemáticamente a las triviales.

---

## 2. Fundamentos teóricos y dónde se aplican

| Concepto | Fuente | Dónde vive en el juego |
|---|---|---|
| **BATNA / MAAN** | Fisher, Ury y Patton (1981) | Preparación: cada escenario tiene una alternativa conocida, otra que se descubre investigando y otra **que parece buena pero no está verificada** (espejismo). Al abandonar te llevas el valor **real** de la BATNA elegida. La fuerza de tu BATNA determina si «presionar» funciona o si te descubren el farol. |
| **Punto de reserva y ZOPA** | Raiffa (1982); Lax y Sebenius (1986) | Escala visual en la preparación (BATNA → reserva → objetivo) y medidor «Valor para ti» en cada oferta. En el debrief, el mapa del espacio de acuerdos dibuja la ZOPA real. |
| **Anclaje** | Tversky y Kahneman (1974); Galinsky y Mussweiler (2001) | Si tu apertura es ambiciosa pero creíble, la aspiración inicial de la contraparte baja (`A0' = A0 − s·min(25, A0 − U_c)`). Si es extrema (más de 20 puntos por debajo de su reserva), ofende: sin efecto ancla, pierde confianza, sube la tensión y se endurece. Si la contraparte abre, el detector de sesgos mira si tu respuesta quedó más cerca de su ancla que de tu objetivo. |
| **Intereses frente a posiciones** | Fisher, Ury y Patton (1981) | Cada contraparte tiene intereses ocultos ligados a variables. Las preguntas abiertas los revelan si hay confianza suficiente; las sugestivas penalizan. E2 está construido sobre esta idea: Samuel pide +20 % (posición), pero necesita flexibilidad y crecer (intereses). |
| **Criterios objetivos** | Fisher, Ury y Patton (1981) | Fichas de investigación que desbloquean un criterio (índice del acero, banda salarial, múltiplos del sector…). Citarlo al ofertar rebaja el umbral de aceptación (×1,6 con perfiles analíticos) y sube la confianza. |
| **Crear y reclamar valor; intercambio integrativo** | Lax y Sebenius (1986); Pruitt (1981) | Los pesos de las partes difieren por variable y existen **cuestiones compatibles** (ambas partes quieren lo mismo). Negociar solo el precio deja valor sin crear: en E1, quien solo regatea el precio no puede pasar de ~47 puntos; con un intercambio integrativo se llega a 85 sin perjudicar a Jordi. |
| **Pastel fijo y resultados perder-perder** | Bazerman y Neale (1992); Thompson y Hastie (1990) | La contraparte **también** tiene este sesgo: supone que en todo quieres lo contrario que ella, salvo que le compartas tus prioridades. Por eso las cuestiones compatibles solo se descubren compartiendo información (ver 3.4). |
| **Reciprocidad y concesiones** | Cialdini (1984); Pruitt (1981) | Cada concesión genera «crédito de reciprocidad» (`K += ρ·Δ`). Una concesión grande, temprana e incondicional se lee como debilidad con perfiles competitivos (`A0 += 0,35·Δ`). Las concesiones condicionadas («si… entonces…») se registran y puntúan. |
| **MESO** | Medvec y Galinsky (2005) | Técnica desbloqueable tras E1: varias ofertas equivalentes a la vez. Si ninguna se acepta, la elegida revela una prioridad en la pizarra. |
| **Contratos contingentes** | Bazerman y Gillespie (1999) | E4: el earn-out es una cuestión compatible porque Ramón cree en el futuro de su línea gourmet y a Atlas le reduce el riesgo, sobre todo tras la due diligence. |
| **Información asimétrica** | Akerlof (1970); Bazerman y Samuelson (1983) | E4: la due diligence cambia la hoja de puntos del jugador a mitad de partida. Revelar tu reserva o tu fecha límite hace que la contraparte ajuste sus ofertas a tu límite. |
| **Coaliciones** | Raiffa (1982); Lax y Sebenius (2006) | E5: si dos rechazos seguidos perjudican a ambas partes, forman un **bloque** (suben sus exigencias y tu presión deja de funcionar). Una oferta que satisface a una rompe el bloque. Los **compromisos laterales** en reuniones bilaterales crean aliados, con riesgo de que la otra parte se entere. |
| **Ir al balcón** | Ury (1991) | La pausa rebaja la tensión sin gastar paciencia (máximo dos). Es más útil con perfiles emocionales. |
| **Credibilidad de las amenazas** | Schelling (1960) | La «oferta final» baja el umbral de aceptación, pero si la rechazan y sigues negociando pierdes credibilidad para siempre. |
| **Sistema 1 / Sistema 2; encuadre; aversión a la pérdida** | Kahneman (2011); Kahneman y Tversky (1979) | Los imprevistos con temporizador («el comité es el jueves», «la oferta caduca el viernes», «igualad el 15 % o os perdemos») empujan a decisiones rápidas, a menudo con encuadre de pérdida. Cada opción tiene un juicio y una explicación. |
| **Escalada de compromiso; coste hundido; exceso de confianza; confirmación** | Staw (1976); Arkes y Blumer (1985); Moore y Healy (2008); Nickerson (1998) | Detectados a partir del registro de la partida (sección 4.2), cada uno con un ejemplo concreto de lo que hizo el jugador. |

---

## 3. El motor de negociación

Todo el motor es **lógica pura** (`js/nucleo/`), sin acceso al DOM, y se prueba en Node. Usa un generador aleatorio con semilla (mulberry32), así que la misma semilla y las mismas acciones producen la misma partida. Eso es lo que permite la partida modelo reproducible y los tests deterministas. Los textos usan un flujo aleatorio aparte para que cambiar una frase no altere el balance.

### 3.1 Utilidad y espacio de acuerdos

Cada variable tiene opciones discretas. Cada parte tiene un peso por variable (suman 1) y una curva de utilidad por opción en [0, 1]:

```
U_k(paquete) = 100 · Σ_i  w_k,i · u_k,i(opción_i)
```

Como las opciones son discretas, el espacio se enumera entero (96 paquetes en E1, 675 en E2). Así el análisis es **exacto**: frontera de Pareto, ZOPA, solución de Nash y «mejor acuerdo para ti sin perjudicar a la otra parte».

### 3.2 Aspiración de la contraparte (concesión en el tiempo)

Inspirada en las tácticas dependientes del tiempo de Faratin, Sierra y Jennings (1998):

```
τ = 1 − P / P0                                   (presión temporal)
A = A0' − (A0' − R)·τ^e + H − K + ajusteConfianza
A ∈ [R_efectiva, 100]
```

- `e` según personalidad: competitiva 2,4 (cede tarde, *Boulware*), evasiva 1,8, analítica 1,6, emocional 1,2, colaborativa 1,0.
- `H` = endurecimiento por ofensas, faroles o retrocesos (se disipa despacio).
- `K` = crédito por reciprocidad y por una BATNA tuya creíble.
- `ajusteConfianza`: con mucha confianza se conforma con hasta 6 puntos menos; con poca exige hasta 12 más.
- `R_efectiva` sube si no se fía de ti (prima de riesgo) o si le revelaste tu reserva.

**Variación por partida.** Los parámetros ocultos varían algo con cada semilla (reserva ±4, aspiración ±5, paciencia ±1, confianza ±6): rejugar no es memorizar.

### 3.3 Aceptación

```
umbral = max(R_efectiva,  A − 3·criterio·(si justificas) − ½·(A − R)·(si es oferta final creíble))
acepta si  U_c(oferta) + ε ≥ umbral        (ε ~ U(−1,5, 1,5))
       o si  U_c(oferta) ≥ U_c(la contraoferta que iba a hacer)
```

En multiparte hace falta el sí de todas las partes.

### 3.4 Contraoferta (estrategia *trade-off*)

Entre los paquetes con `U_c ∈ [A, A + 9]` que no sean ineficientes (según lo que la contraparte cree), elige el que maximiza:

```
λ · Û_jugador(p) + (1 − λ) · similitud(p, tu última oferta) + 0,3 · similitud(p, su oferta anterior) − 0,012 · (U_c − A)
λ = cooperación_personalidad · (0,3 + C/100) · (0,25 + 0,75 · conocimiento)
```

`Û_jugador` es lo que la contraparte **cree** que vale cada paquete para ti. Por defecto supone que en todo quieres lo contrario que ella (pastel fijo). Al compartir tus prioridades aprende tus pesos y el sentido real de tus preferencias, y entonces sus contraofertas descubren las cuestiones compatibles.

**Lección de diseño (sección 7):** sin esta suposición, una contraparte «perfectamente racional» hacía todo el trabajo integrativo por el jugador, y regatear solo el precio funcionaba. Con ella, el motor reproduce lo que describe la literatura: quien no comparte información obtiene resultados perder-perder.

### 3.5 Confianza, tensión y paciencia

| Acción | ΔConfianza base (× multiplicador de personalidad) |
|---|---|
| Pregunta abierta respondida | +4 |
| Compartir prioridades | +6 (y a veces la otra parte corresponde revelando un interés) |
| Concesión / concesión condicionada | +3 / +2 |
| Justificar con un criterio | +3 (×1,6 analítica) |
| Oferta ofensiva | −8 (y tensión +25) |
| Retroceder (recuperar valor para ti) | −10 |
| Presionar con la BATNA | de −2 (competitiva) a −5,6 (colaborativa) |
| Farol descubierto | −20 |
| Mentira descubierta | −30 |

- **Tensión**: se disipa un 15 % por turno. Por encima de 90, una contraparte volátil puede levantarse de la mesa.
- **Desconfianza total**: con la confianza en 10 o menos, la contraparte se marcha con probabilidad 0,4–0,6 por turno.
- **Paciencia**: cada acción cuesta 1 turno (2 tras una ofensa o una presión). Al agotarse llega un ultimátum (una última acción) y después la ruptura.

### 3.6 Eventos

Cada escenario declara imprevistos con disparadores (turno, probabilidad, condición), temporizador opcional y opciones con efectos declarativos: confianza, tensión, paciencia, aspiración, reserva, BATNA del jugador, revelaciones, cambios en tu hoja de puntos, mentiras con probabilidad de descubrirse… Cada opción lleva un **estilo** legible (calma, ceder, presión, honesto, mentir, contrastar) y un **juicio** con su explicación y el sesgo asociado.

### 3.7 Contrato con la interfaz

`ejecutar(partida, acción)` devuelve una **cola de salidas** (`dialogo`, `reaccion`, `delta`, `oferta`, `pizarra`, `juicio`, `evento`, `coalicion`, `fin`…) que la interfaz reproduce en orden con animaciones. La interfaz **nunca decide nada**: solo representa. Los agentes de simulación usan exactamente la misma API y solo la `observacion()` que tendría un jugador humano.

---

## 4. Puntuación y debrief

### 4.1 Cinco dimensiones (0–100)

| Dimensión | Cálculo | Peso |
|---|---|---|
| Valor obtenido | `(U_jugador − BATNA_ref) / (máximo realista − BATNA_ref)`. El máximo realista deja a cada contraparte al menos el 20 % de su margen (35 % en multiparte, donde cualquiera puede vetar). | 25 % |
| Valor conjunto | Posición del acuerdo entre el peor y el mejor acuerdo conjunto de la ZOPA. | 15 % |
| Relación | `0,6·confianza final + 25·excedente de la otra parte + 15·(1 − tensión que añadiste) − 20·mentiras descubiertas` | 20 % |
| Proceso | Lista de comprobación: preparación (fichas clave, BATNA verificada, reserva ≈ BATNA, objetivo realista), preguntas, compartir prioridades, sin retrocesos ni ofensas, criterios, paquetes, reciprocidad, ritmo. | 20 % |
| Sesgos | 100 − penalizaciones (8/15/25 según gravedad) ± decisiones en imprevistos. | 20 % |

Estrellas: ★ ≥ 50 (supera el escenario y desbloquea el siguiente), ★★ ≥ 70, ★★★ ≥ 85. La relación pesa un 20 % porque el público son directivos con relaciones de largo plazo: un acuerdo que quema al proveedor no es un buen acuerdo.

### 4.2 Detección de sesgos

Cada sesgo detectado incluye un **ejemplo concreto con cifras de la partida**. Si se repite (tres o más veces), aumenta de gravedad.

- **Anclaje**: tu primera contraoferta quedó más cerca de su ancla que de tu objetivo, o aceptaste su primera contraoferta sin explorar.
- **Pastel fijo**: moviste una sola variable en tres o más ofertas, o el acuerdo dejó una cuestión compatible en un valor malo para ambos.
- **Confirmación**: descubriste que una variable era clave para la otra parte y nunca la moviste hacia ella (salvo que atendieras ese interés con un compromiso lateral), o hiciste preguntas sugestivas, o seguiste un consejo sin contrastarlo.
- **Aversión a la pérdida**: te aferraste a algo que valías poco y ellos mucho, o reaccionaste a un encuadre de pérdida cediendo.
- **Escalada de compromiso**: tres o más concesiones seguidas sin reciprocidad, o aceptar por debajo de tu reserva.
- **Coste hundido**: cerrar por debajo de tu BATNA tras muchos turnos, o dejar que «lo ya invertido» moviera tu límite.
- **Exceso de confianza**: BATNA sin verificar, farol descubierto, apertura ofensiva, objetivo imposible o apenas preparar.

### 4.3 Lo que quedó sobre la mesa

El debrief voltea las cartas ocultas de la contraparte (sus pesos frente a los tuyos, su reserva, su BATNA, su perfil y qué intereses descubriste) y dibuja el **mapa del espacio de acuerdos**:

- nube de acuerdos posibles;
- frontera de Pareto;
- ZOPA;
- la «danza» de ofertas de ambos, numerada;
- tu acuerdo, la solución de Nash y el mejor acuerdo para ti que no perjudicaba a la otra parte, con una flecha.

Una frase resume los puntos que dejaste y qué cambio concreto los habría ganado.

---

## 5. Sistema visual

- **Avatares paramétricos** (`js/visual/avatar.js`): cara, piel (7 tonos), pelo (10 estilos), canas, barba, gafas, edad, ropa y accesorios. Cada personaje se genera **una sola vez** en dos capas, cuerpo (detrás de la mesa) y brazos (sobre la mesa). El estado se aplica con atributos `data-expresion`, `data-postura` y `data-mirada`, y el CSS hace las transiciones. Animaciones idle (respiración, parpadeo, balanceo) y gestos puntuales (asentir, negar, tensarse, relajarse, suspirar, sobresalto), solo con `transform` y `opacity`.
- **`estadoMotor → estadoVisual`** (`js/nucleo/estadoVisual.js`): función pura con 14 tests. Prioridad: reacción puntual > tensión > desconfianza > urgencia > sintonía > hábitos de la personalidad (el evasivo mira el móvil, el analítico se lleva la mano a la barbilla, el competitivo se recuesta). Garantiza coherencia: con tensión alta nadie aparece entusiasmado. Tras una reacción, el personaje vuelve a su estado sostenido.
- **Escenas por capas** (`js/visual/escenas.js`): fondo, escenario (sillas, cuerpos, mesa, objetos, manos) y primer plano, con parallax del puntero y entrada tipo cámara. Siete salas, con objetos vivos:
  - un reloj de mesa cuya aguja marca la paciencia de la contraparte;
  - café con vapor;
  - un móvil que vibra en los imprevistos;
  - el arco de coalición en la mesa multiparte.
- **Cinemáticas**: apretón de manos con destellos en el acuerdo; la contraparte se levanta, la silla queda vacía y la sala se oscurece en la ruptura.
- **Sonido**: efectos sintetizados con Web Audio (sin archivos). El contexto de audio se crea con el primer gesto y hay un botón de silencio siempre visible.
- **Accesibilidad**:
  - `prefers-reduced-motion` y un ajuste propio de animaciones reducidas;
  - temporizadores ampliables o desactivables (WCAG 2.2.1);
  - foco atrapado en modales y Escape para cerrarlos;
  - anunciador ARIA con el texto completo de cada diálogo;
  - medidores con `role="meter"`;
  - navegación completa por teclado, verificada con eventos de teclado reales.

---

## 6. Pruebas de balance

`tests/simulacion.js` juega **1.000 partidas por agente y escenario** con semillas fijas. Los agentes solo ven lo que vería un jugador.

| Agente | Estrategia |
|---|---|
| Colaborativo | Investiga intereses, pregunta, comparte prioridades, negocia paquetes, concede de forma decreciente. |
| Agresivo | No investiga, elige la BATNA más optimista, ancla extremo, presiona y concede lo mínimo. |
| Blando | Cede rápido para cerrar. |
| Regateador | Prepara bien el precio pero solo mueve su variable principal (pastel fijo). |
| Aleatorio | Acciones válidas al azar. |
| Modelo | El guion comentado de cada escenario. |

### 6.1 Antes del ajuste (primera simulación, solo E1)

| Agente | Total | Supera ≥ 50 |
|---|---|---|
| Colaborativo | 84,9 | 100 % |
| Agresivo | 57,9 | 75 % |
| Blando | 59,2 | 100 % |
| Regateador | 63,6 | 100 % |
| Aleatorio | 42,9 | 38 % |

Crear valor ya puntuaba más, pero **tres estrategias triviales superaban el escenario casi siempre**.

### 6.2 Después del ajuste (todos los escenarios, 1.000 partidas por agente)

| Escenario | Colaborativo | Agresivo | Blando | Regateador | Aleatorio | Modelo (semilla del juego) |
|---|---|---|---|---|---|---|
| 1 · Acero a tiempo | **83,0** · supera 100 % · ★★★ 13 % | 45,0 · 53 % | 45,2 · 9 % | 47,7 · 27 % | 40,0 · 23 % | **92** |
| 2 · La oferta | **80,2** · 100 % · ★★★ 0 % | 27,3 · 21 % | 44,7 · 2 % | 32,1 · 12 % | 41,1 · 25 % | **91** |
| 3 · Cliente en riesgo | **72,9** · 100 % · ★★★ 0 % | 15,1 · 0 % | 41,5 · 34 % | 43,6 · 44 % | 33,2 · 13 % | **86** |
| 4 · Conservas Ferrán | **84,5** · 100 % · ★★★ 45 % | 17,0 · 1 % | 45,3 · 27 % | 22,2 · 0 % | 36,6 · 19 % | **88** |
| 5 · Plan Horizonte | **73,9** · 100 % · ★★★ 0 % | 24,1 · 0 % | 30,8 · 0 % | 44,8 · 13 % | 29,8 · 7 % | **86** |

La primera cifra es la media de la puntuación total; el porcentaje, cuántas partidas superan el escenario. El informe completo, con las cinco dimensiones, está en `tests/informe_balance.md`.

**Criterios comprobados** (también como tests en `tests/balance.test.js`): **45 de 45 cumplidos**.

- **Crear valor puntúa más que solo presionar**: el colaborativo supera al agresivo por ≥ 10 puntos en total y también en valor conjunto, en los cinco escenarios.
- **Ninguna estrategia trivial gana siempre**: agresivo, blando, regateador y aleatorio superan menos del 60 % de las partidas en todos los escenarios.
- **Ganable**: la estrategia que crea valor supera el escenario (≥ 60 % de las partidas).
- **No obvio**: la excelencia no sale sola; el colaborativo saca ★★★ en menos del 60 % de las partidas.
- **Partida modelo ≥ 85**: lo cumple la semilla que ve el jugador. Medianas en 40 semillas: 93, 91, 85, 89 y 83.

**Por qué cambió el criterio de «no obvio».** El plan inicial pedía que la estrategia colaborativa superase entre el 60 % y el 95 % de las partidas. Resultó demasiado robusta: no baja de 65 puntos en ningún escenario. Un buen método de negociación *debería* funcionar de forma fiable. Por eso «no obvio» se redefinió así: ninguna estrategia trivial gana y las ★★★ exigen algo más que la receta genérica. La decisión está documentada en `PROCESO_IA.md`.

### 6.3 Cambios que produjo el balance

1. **Prima por desconfianza.** Con poca confianza la contraparte exige más y sube su reserva efectiva. Esto impide que «insultar y esperar al final» funcione.
2. **Sesgo de pastel fijo de la contraparte** (3.4). Sin él, el regateador aprobaba siempre porque la contraparte proponía los intercambios por él.
3. **Las contrapartes no proponen paquetes ineficientes según lo que creen.** Se descubrió en una prueba visual: Jordi contraofertaba 8.000 t cuando ambos querían más volumen.
4. **Retirada por desconfianza total.**
5. **La repetición agrava los sesgos.**
6. **Más peso a la relación.**
7. **Variación oculta por partida.**
8. **«Retroceso» solo si recuperas valor para ti.** En una mesa multiparte, redistribuir valor entre las partes no es mala fe.
9. **Valor obtenido sobre un máximo realista.**
10. **Statu quo de E5.** Se sustituyó por la propuesta inicial del fondo: el anterior era aceptable para todos y premiaba no negociar.
11. **Exigencias que informan (E5).** Cada parte exigía en la variable que más le dolía de tu oferta, pero con el valor de su contraoferta ideal. A veces ese valor coincidía con lo ofrecido («Sin *Sin plan* en plan de recolocación…»). Ahora exige en la variable donde su propuesta ideal más mejora la tuya, así que siempre pide algo distinto. Se descubrió en la prueba del Modo IA y lo cubre un test. El colaborativo de E5 pasó de 72,3 a 73,9, y su valor conjunto de 54 a 60, porque las exigencias ya le dan información útil.

---

## 7. Cómo añadir contenido

- **Escenarios**: ver README. Los tests de datos validan automáticamente que los pesos sumen 1, que exista ZOPA, las referencias internas, que cada opción de evento tenga estilo y que la partida modelo saque ★★★.
- **Personalidades**: `js/nucleo/personalidades.js` (13 parámetros con significado pedagógico documentado).
- **Diálogos**: `js/datos/dialogos.js` (líneas por reacción × personalidad). Cada personaje o escenario puede sobrescribir cualquier clave.

## 8. Modo IA (fase 2, opcional)

La contraparte conversa en lenguaje natural mediante la API de Anthropic. El principio de diseño es que **el motor sigue siendo la única fuente de verdad**: Claude no decide si la contraparte acepta, qué contraoferta hace ni qué revela. Solo traduce y da voz.

### 8.1 Flujo de un turno

```
Jugador escribe ──► [servidor] Claude INTERPRETA ──► acción del motor (validada dos veces)
                                                          │
                     Motor.ejecutar(acción)  ◄────────────┘   ← variables ocultas, igual que en modo clásico
                          │
                          ▼  cola de salidas: reacción, deltas, oferta, pizarra, diálogo…
                    [servidor] Claude NARRA solo los diálogos de las contrapartes
                          │
                          ▼
                    La interfaz reproduce la MISMA cola: el avatar reacciona igual
```

1. **Interpretar** (`servidor/ia.mjs → interpretar`). Claude recibe el mensaje y lo visible para el jugador: variables y opciones, su última oferta, la propuesta sobre la mesa, las preguntas e informaciones disponibles, el criterio objetivo investigado y las acciones permitidas en ese momento. Devuelve JSON con un **esquema estricto** (*structured outputs*): `tipo` (oferta, pregunta, compartir, presionar, pausa, aceptar, abandonar o charla), `paquete`, `id`, `justifica`, `final` y `explicacion`.
2. **Validar dos veces.** El servidor (`validarAccion`) y el navegador (`NG.IA.accionMotor`) comprueban que la acción está disponible, que los índices existen y que las técnicas están desbloqueadas. Si algo no encaja, se trata como «charla»: se responde con cortesía y no cambia nada del estado.
3. **Confirmar lo irreversible.** «Acepto» o «me levanto» abren siempre el mismo diálogo de confirmación que los botones.
4. **El motor decide** con `Motor.ejecutar`, exactamente como en modo clásico.
5. **Narrar** (`narrar`). De la cola de salidas se extrae, por cada contraparte, la reacción, la línea clásica que el motor eligió, la propuesta exacta y lo que ha revelado este turno. Claude la reformula como respuesta natural al mensaje del jugador, con la personalidad del personaje y la regla de no inventar ni revelar nada más.
6. **Sustituir solo textos** (`NG.IA.aplicarNarracion`). Reacciones, deltas de confianza y paciencia, ofertas, notas de la pizarra, eventos y final quedan intactos. Un test lo verifica. Mientras Claude redacta, ya se muestra el globo del jugador.

Los imprevistos y sus respuestas mantienen su texto guionizado. La concesión condicionada, MESO y las reuniones bilaterales siguen en sus botones, porque necesitan una precisión que el editor da mejor que el texto libre.

### 8.2 Qué viaja al servidor (y qué no)

| Se envía | No se envía nunca |
|---|---|
| Variables y opciones, tu hoja visible, tus ofertas, la propuesta sobre la mesa | Pesos, curvas, reserva, aspiración y BATNA de la contraparte |
| Preguntas e informaciones disponibles, criterio investigado | Confianza, tensión y paciencia numéricas |
| Nombre, cargo y estilo del personaje; intereses **ya descubiertos** | Intereses no descubiertos y sesgos de la contraparte |
| La línea, reacción y propuesta que el motor ya ha decidido | La clave de la API (vive solo en el entorno del servidor) |

### 8.3 Llamada a la API

- SDK oficial `@anthropic-ai/sdk` (0.133), modelo `claude-opus-5-5` (configurable con `NEGOCIA_MODELO`). Formato consultado en la documentación actual antes de implementar.
- Salida estructurada con `output_config.format` (`json_schema` con `additionalProperties: false`). El razonamiento está siempre activo en este modelo; se usa `effort: "low"` porque son respuestas cortas de un personaje y la latencia importa.
- `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`): si los filtros de seguridad declinan una petición, la API la reintenta en el servidor con el modelo recomendado.
- Antes de leer el contenido se comprueba `stop_reason` (`refusal`, `max_tokens`) y se ignoran los bloques de razonamiento. Los errores tipados del SDK (autenticación, límite de uso, conexión) se traducen a mensajes para el jugador sin detalles internos.
- Si algo falla, el juego avisa una vez y sigue con las líneas clásicas. Si falla la interpretación, no se juega nada y se conserva el borrador.

### 8.4 Seguridad del proxy local

- Solo escucha en `127.0.0.1`.
- Exige la cabecera `X-Negocia: 1`, que obliga al navegador a hacer una comprobación CORS previa que el servidor nunca concede, y un `Origin` local. Así otra web abierta en el navegador no puede gastar la clave.
- Comprueba también la cabecera `Host` contra el *DNS rebinding*.
- Limita el cuerpo a 64 KB y las peticiones a 40 por minuto.
- No sirve su propio código, archivos ocultos (`.git`, `.tools`), `node_modules` ni nada fuera del proyecto.
- El mensaje del jugador se envía delimitado y el *prompt* lo declara contenido del juego, no instrucciones.

### 8.5 Pruebas

- `tests/ia.test.js` (6 tests):
  - el contexto no contiene variables ocultas;
  - la validación rechaza acciones imposibles;
  - la narración solo cambia textos;
  - multiparte.
- `servidor/pruebas.mjs` (12 tests), con un **cliente simulado** que imita la forma de `client.beta.messages.create`:
  - esquemas y bloques de razonamiento;
  - `refusal`;
  - seguridad del proxy (cabecera, origen, tamaño, rutas prohibidas);
  - funcionamiento sin clave y sin SDK;
  - flujo completo.
- `herramientas/e2e-ia.js` juega E1 escribiendo frases en Chrome y hace 22 comprobaciones:
  - charla sin coste de turno, pregunta, compartir y oferta en lenguaje natural;
  - fallo de la API;
  - interruptor;
  - confirmación al aceptar y cinemática;
  - móvil;
  - modo clásico sin clave y con `file://`.

**Limitación honesta:** en el equipo de desarrollo no había clave de API, así que **no se ha probado contra la API real**. Lo verificado es todo lo demás: esquemas, validación, proxy, interfaz y degradación. La primera partida con clave debería revisar el tono de las respuestas y la latencia.

## 9. Modo equipo «Mesa de crisis» (simulación de decisiones en equipo)

Responde a la actividad: **tres roles jugables** con información privada y objetivos que no coinciden, una **misión compartida**, **cuatro fases** con consecuencias y una **IA con funciones reales**.

### 9.1 Roles

| Rol | Responsabilidad | Información privada | Objetivo secreto |
|---|---|---|---|
| Dirección General | Presentar un plan viable y conseguir las tres firmas | Hoja de puntos (capital y control), mínimo 50 | El banco exige ≥ 15 M€ de capital |
| Comité de empresa | Defender a la plantilla y lograr la ratificación | Hoja de puntos (despidos y recolocación), mínimo 47 | Si hay despidos, plan completo con formación |
| Fondo Nordia | Invertir con control y retorno | Hoja de puntos (participación y capital), mínimo 47 | ≥ 40 % o asientos en el consejo |

Las hojas reutilizan las utilidades del escenario 5, de modo que los intereses están enfrentados de verdad. La propuesta inicial del fondo vale 35, 22 y 91 puntos para dirección, sindicato y fondo. Solo el 8 % de los 324 planes posibles supera los tres mínimos.

### 9.2 Fases y consecuencias

1. **Posturas** (privado, se revelan a la vez):
   - *Firme* pone tu exigencia sobre la mesa (clima +6, confianza −4).
   - *Abierta* da confianza +3.
   - *Colaborativa* revela tu prioridad (confianza +6, clima −4).
2. **Rondas** (máx. 7). Propone un rol por turno, con compromisos laterales opcionales; los otros dos votan en secreto y pueden publicar una exigencia. Un rechazo tiene estas consecuencias:
   - caja −1 mes;
   - clima social +9 a +16 si rechaza el sindicato;
   - confianza ±.
   - Con clima ≥ 80 hay **huelga** (caja −1, confianza −10). Con confianza < 40 **no se pueden ofrecer compromisos laterales**. Con la caja a 0 llega el **concurso**: pierden todos.
3. **Ratificación** (juego a dos niveles, Putnam, 1988). Cada parte defiende el plan ante los suyos. Si alguien firmó por debajo de su mínimo (con 3 puntos de margen si cumple su objetivo secreto), se lo tumban y se vuelve a la mesa.
4. **Evaluación.**
   - Puntuación individual: valor sobre el mínimo, normalizado a la ZOPA, +10 si se cumple el objetivo secreto.
   - Misión: acuerdo, caja restante, clima y confianza.
   - Equipo: media de la misión y de las puntuaciones individuales.
   - Se revela el plan que más valor creaba (solución de Nash).

Simulación (60 partidas por política, `tests/equipo.test.js`): un equipo que coopera firma casi siempre; uno egoísta (cada rol propone lo mejor para sí y vota solo por su mínimo) casi nunca, y acaba en concurso.

### 9.3 La mediadora IA

| Función | Qué decide | Cómo se controla |
|---|---|---|
| Directora de partida | Qué imprevisto abre la ronda siguiente (pedido, filtración, asamblea, otra textil, comité de inversión, banco) o ninguno | Solo puede elegir entre los que las reglas permiten en ese estado. Los efectos los aplica el motor. |
| Asesora | Análisis público del rechazo y un plan concreto que el siguiente rol puede adoptar con un clic | Índices validados. Si el texto cita puntos o datos confidenciales, se descarta. |
| Evaluadora | Resumen del equipo, un acierto y una mejora por rol, y una lección | Formato validado; solo puede usar los datos que recibe |

**Prompt estructurado** (`js/ia/mediadora.js`), con estas secciones:
- `<instrucciones>`;
- `<reglas>`;
- `<estado_partida>` (solo información pública, en JSON);
- `<informacion_de_roles>`, que separa `<publica>` de `<confidencial>` (prioridades, nunca mínimos ni secretos);
- `<eventos_disponibles>`;
- `<formato_salida>`, con un ejemplo.

**Validación antes de tocar el juego:**
- JSON con los campos esperados;
- paquete con índices válidos;
- imprevisto dentro de la lista permitida;
- filtro de fugas (cifras de puntos, «reserva», «mínimo» y frases de la información confidencial).

Según el fallo, la respuesta se acepta, se corrige (lo inválido se completa con la mediadora local) o se descarta. Todo queda en el «Registro de la IA», con el prompt (sin la parte confidencial) y la respuesta.

**Proveedores**, por orden:
1. Claude dentro de claude.ai (capacidad `sample` del Artifact, `modelTier: "quick"`, con la cuenta de quien juega y sin ninguna clave);
2. Claude a través de `servidor/` (`/api/ia/mediar`, con la clave en el entorno del servidor);
3. una mediadora local sin conexión: solución de Nash con mínimos *estimados*, porque una mediadora real conoce las prioridades pero no los límites de cada parte.

Si la IA falla o tarda, «Continuar sin esperar» pasa a la mediadora local y la partida nunca se bloquea.

## Referencias

- Akerlof, G. (1970). The market for «lemons». *Quarterly Journal of Economics*.
- Arkes, H. y Blumer, C. (1985). The psychology of sunk cost. *OBHDP*.
- Bazerman, M. y Gillespie, J. (1999). Betting on the future: The virtues of contingent contracts. *Harvard Business Review*.
- Bazerman, M. y Neale, M. (1992). *Negotiating Rationally*. Free Press.
- Bazerman, M. y Samuelson, W. (1983). I won the auction but don't want the prize. *Journal of Conflict Resolution*.
- Cialdini, R. (1984). *Influence: The Psychology of Persuasion*.
- Faratin, P., Sierra, C. y Jennings, N. (1998). Negotiation decision functions for autonomous agents. *Robotics and Autonomous Systems*.
- Fisher, R., Ury, W. y Patton, B. (1981). *Getting to Yes* (*Obtenga el sí*).
- Galinsky, A. y Mussweiler, T. (2001). First offers as anchors. *Journal of Personality and Social Psychology*.
- Kahneman, D. (2011). *Thinking, Fast and Slow* (*Pensar rápido, pensar despacio*).
- Kahneman, D. y Tversky, A. (1979). Prospect theory. *Econometrica*.
- Lax, D. y Sebenius, J. (1986). *The Manager as Negotiator*; (2006) *3-D Negotiation*.
- Medvec, V. y Galinsky, A. (2005). Putting more on the table: How making multiple offers can increase the final value of the deal. *Negotiation* (Harvard PON).
- Moore, D. y Healy, P. (2008). The trouble with overconfidence. *Psychological Review*.
- Nickerson, R. (1998). Confirmation bias: A ubiquitous phenomenon in many guises. *Review of General Psychology*.
- Pruitt, D. (1981). *Negotiation Behavior*.
- Putnam, R. (1988). Diplomacy and domestic politics: The logic of two-level games. *International Organization*.
- Raiffa, H. (1982). *The Art and Science of Negotiation*.
- Schelling, T. (1960). *The Strategy of Conflict*.
- Staw, B. (1976). Knee-deep in the big muddy. *OBHP*.
- Thompson, L. y Hastie, R. (1990). Social perception in negotiation. *OBHDP*.
- Tversky, A. y Kahneman, D. (1974). Judgment under uncertainty: Heuristics and biases. *Science*.
- Ury, W. (1991). *Getting Past No* (*Supere el no*).
