/* =====================================================================
 * NEGOCIA · datos/logros.js
 * Logros desbloqueables. Cada uno se comprueba al terminar una partida
 * con { progreso, esc, p (partida), punt (puntuación) }.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const reales = () => NG.Escenarios.todos().filter((e) => /^e\d/.test(e.id));

  NG.Logros = [
    { id: 'primer-apreton', nombre: 'Primer apretón', icono: 'apreton', descripcion: 'Cierra tu primer acuerdo.',
      comprobar: ({ p }) => p.resultado.tipo === 'acuerdo' },
    { id: 'saber-irse', nombre: 'Saber irse', icono: 'puerta', descripcion: 'Abandona cuando tu BATNA era mejor que cualquier acuerdo posible.',
      comprobar: ({ p }) => p.resultado.tipo === 'abandono' && p.registro.some((r) => r.tipo === 'juicio' && r.juicio === 'acierto' && /retirarse era la decisión correcta/.test(r.explicacion)) },
    { id: 'pastel-grande', nombre: 'Un pastel más grande', icono: 'diana', descripcion: 'Cierra un acuerdo con un 90 % o más del valor conjunto posible.',
      comprobar: ({ p, punt }) => p.resultado.tipo === 'acuerdo' && punt.dimensiones.conjunto >= 90 },
    { id: 'ancla-oro', nombre: 'Ancla de oro', icono: 'bandera', descripcion: 'Abre con una oferta ambiciosa pero creíble que rebaje las expectativas de la otra parte.',
      comprobar: ({ p }) => p.resultado.tipo === 'acuerdo' && p.stats.ofensas === 0 && p.contrapartes.some((c) => c.ancla >= 6) },
    { id: 'escucha-activa', nombre: 'Escucha activa', icono: 'pregunta', descripcion: 'Consigue que respondan a 3 preguntas abiertas en una misma partida.',
      comprobar: ({ p }) => p.stats.preguntasIntereses >= 3 },
    { id: 'quid-pro-quo', nombre: 'Quid pro quo', icono: 'concesion', descripcion: 'Haz 2 concesiones condicionadas («si… entonces…») en una partida.',
      comprobar: ({ p }) => p.stats.intercambiosCondicionados >= 2 },
    { id: 'sangre-fria', nombre: 'Sangre fría', icono: 'escudo', descripcion: 'Resuelve todos los imprevistos de una partida con la decisión correcta (al menos 2).',
      comprobar: ({ p }) => p.stats.eventosAcierto >= 2 && p.stats.eventosError === 0 },
    { id: 'mente-despejada', nombre: 'Mente despejada', icono: 'cerebro', descripcion: 'Termina una partida con acuerdo sin cometer ningún sesgo.',
      comprobar: ({ p, punt }) => p.resultado.tipo === 'acuerdo' && punt.sesgos.length === 0 },
    { id: 'relacion-oro', nombre: 'Relación de oro', icono: 'corazon', descripcion: 'Cierra con la confianza de la otra parte en 80 o más.',
      comprobar: ({ p }) => p.resultado.tipo === 'acuerdo' && p.contrapartes.every((c) => c.C >= 80) },
    { id: 'investigador', nombre: 'Investigador', icono: 'lupa', descripcion: 'Descubre todos los intereses ocultos de la otra parte.',
      comprobar: ({ p, esc }) => esc.contrapartes.every((c) => (c.intereses || []).every((it) => p.revelado.intereses.includes(it.id))) },
    { id: 'tres-estrellas', nombre: 'Tres estrellas', icono: 'estrella', descripcion: 'Consigue ★★★ en cualquier escenario.',
      comprobar: ({ punt }) => punt.estrellas === 3 },
    { id: 'meso', nombre: 'Varias puertas', icono: 'meso', descripcion: 'Usa ofertas múltiples equivalentes (MESO) y descubre una prioridad con ellas.',
      comprobar: ({ p }) => p.stats.mesosReveladores >= 1 },
    { id: 'contingente', nombre: 'Apuesta compartida', icono: 'grafico', descripcion: 'Cierra la adquisición con un earn-out que salve vuestras diferencias de expectativas.',
      comprobar: ({ p, esc }) => esc.id === 'e4-adquisicion' && p.resultado.tipo === 'acuerdo' && p.resultado.paquete[esc.variables.findIndex((v) => v.id === 'earnout')] > 0 },
    { id: 'divide', nombre: 'Divide y vencerás', icono: 'personas', descripcion: 'Rompe un bloque de las otras partes en la negociación multiparte.',
      comprobar: ({ p }) => p.bloquesRotos >= 1 },
    { id: 'campana', nombre: 'Campaña completa', icono: 'mapa', descripcion: 'Supera los cinco escenarios.',
      comprobar: ({ progreso }) => reales().every((e) => (progreso.escenarios[e.id] || {}).superado) },
    { id: 'maestro', nombre: 'Maestro negociador', icono: 'trofeo', descripcion: 'Alcanza el rango de Maestro.',
      comprobar: ({ progreso }) => NG.Progreso.rango(progreso).id === 'maestro' }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
