#!/usr/bin/env node
/* =====================================================================
 * Simulación de balance: N partidas por escenario y agente con semillas
 * fijas. Escribe tests/informe_balance.md y muestra la tabla.
 * Uso: node tests/simulacion.js [N=1000] [filtroEscenario]
 * ===================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const NG = require('./cargar.js');
const { Agentes, jugar } = require('./agentes.js');

const N = parseInt(process.argv[2], 10) || 1000;
const filtro = process.argv[3] || '';

/* Técnicas desbloqueadas según la progresión normal de la campaña. */
function tecnicasPara(esc) {
  return { meso: esc.orden > 1, ofertaFinal: esc.orden > 2, bilateral: !!esc.multiparte };
}

function simular(esc, agente, n, semillaBase) {
  const r = { n, acuerdo: 0, ruptura: 0, abandono: 0, total: 0, superado: 0, tres: 0, dims: { valor: 0, conjunto: 0, relacion: 0, proceso: 0, sesgos: 0 }, totales: [], turnos: 0 };
  for (let i = 0; i < n; i++) {
    const { p, punt } = jugar(esc, agente, (semillaBase || 1000) + i, { tecnicas: tecnicasPara(esc) });
    r[p.resultado.tipo]++;
    r.total += punt.total; r.totales.push(punt.total);
    if (punt.superado) r.superado++;
    if (punt.estrellas === 3) r.tres++;
    Object.keys(r.dims).forEach((k) => { r.dims[k] += punt.dimensiones[k]; });
    r.turnos += p.turno;
  }
  const pct = (x) => Math.round((100 * x) / n);
  const media = r.total / n;
  const sd = Math.sqrt(r.totales.reduce((s, x) => s + (x - media) * (x - media), 0) / n);
  return {
    agente: agente.nombre, n,
    acuerdo: pct(r.acuerdo), ruptura: pct(r.ruptura), abandono: pct(r.abandono),
    total: Math.round(media * 10) / 10, sd: Math.round(sd * 10) / 10,
    superado: pct(r.superado), tres: pct(r.tres), turnos: Math.round((r.turnos / n) * 10) / 10,
    dims: Object.fromEntries(Object.entries(r.dims).map(([k, v]) => [k, Math.round(v / n)]))
  };
}

function jugarModelo(esc) {
  return jugar(esc, Agentes.modelo, esc.partidaModelo.semilla, { tecnicas: tecnicasPara(esc) }).punt.total;
}

function ejecutar(n, filtroEsc) {
  const salida = [];
  for (const esc of NG.Escenarios.todos()) {
    if (filtroEsc && !esc.id.includes(filtroEsc)) continue;
    const agentes = ['colaborativo', 'agresivo', 'blando', 'regateador', 'aleatorio'];
    const filas = agentes.map((k) => Object.assign({ clave: k }, simular(esc, Agentes[k], n)));
    if (esc.partidaModelo) filas.push(Object.assign({ clave: 'modelo' }, simular(esc, Agentes.modelo, Math.min(n, 50))));
    salida.push({ esc, filas });
  }
  return salida;
}

function tabla(resultados) {
  let md = '';
  for (const { esc, filas } of resultados) {
    md += '\n### ' + esc.orden + '. ' + esc.titulo + '\n\n';
    md += '| Agente | Acuerdo | Ruptura | Abandono | Total (σ) | Supera ≥50 | ★★★ | Valor | Conjunto | Relación | Proceso | Sesgos | Turnos |\n';
    md += '|---|---|---|---|---|---|---|---|---|---|---|---|---|\n';
    for (const f of filas) {
      md += '| ' + f.agente + ' | ' + f.acuerdo + ' % | ' + f.ruptura + ' % | ' + f.abandono + ' % | **' + f.total + '** (' + f.sd + ') | ' + f.superado + ' % | ' + f.tres + ' % | ' +
        f.dims.valor + ' | ' + f.dims.conjunto + ' | ' + f.dims.relacion + ' | ' + f.dims.proceso + ' | ' + f.dims.sesgos + ' | ' + f.turnos + ' |\n';
    }
  }
  return md;
}

/* Criterios de balance del plan (también se comprueban en balance.test.js). */
function criterios(resultados) {
  const out = [];
  for (const { esc, filas } of resultados) {
    const f = Object.fromEntries(filas.map((x) => [x.clave, x]));
    const col = f.colaborativo, agr = f.agresivo;
    out.push({ esc: esc.titulo, criterio: 'Colaborativo ≥ agresivo + 10 (total)', ok: col.total >= agr.total + 10, valor: col.total + ' vs ' + agr.total });
    out.push({ esc: esc.titulo, criterio: 'Colaborativo > agresivo (valor conjunto)', ok: col.dims.conjunto > agr.dims.conjunto, valor: col.dims.conjunto + ' vs ' + agr.dims.conjunto });
    ['agresivo', 'blando', 'regateador', 'aleatorio'].forEach((k) => {
      out.push({ esc: esc.titulo, criterio: 'Trivial «' + k + '» supera < 60 %', ok: f[k].superado < 60, valor: f[k].superado + ' %' });
    });
    out.push({ esc: esc.titulo, criterio: 'Ganable: colaborativo supera ≥ 60 %', ok: col.superado >= 60, valor: col.superado + ' %' });
    out.push({ esc: esc.titulo, criterio: 'No obvio: colaborativo saca ★★★ en < 60 %', ok: col.tres < 60, valor: col.tres + ' %' });
    if (f.modelo) {
      const fija = jugarModelo(esc);
      out.push({ esc: esc.titulo, criterio: 'Partida modelo (semilla del juego) ≥ 85 (★★★)', ok: fija >= 85, valor: fija + ' (media en 50 semillas: ' + f.modelo.total + ')' });
    }
  }
  return out;
}

if (require.main === module) {
  const t0 = Date.now();
  const res = ejecutar(N, filtro);
  const md = tabla(res);
  const crit = criterios(res);
  console.log(md);
  crit.forEach((c) => console.log((c.ok ? '\x1b[32m✓' : '\x1b[31m✗') + '\x1b[0m ' + c.esc + ' · ' + c.criterio + ' → ' + c.valor));
  const informe = '# Informe de balance · NEGOCIA\n\nGenerado automáticamente por `tests/simulacion.js` con ' + N + ' partidas por agente y escenario (semillas 1000–' + (1000 + N - 1) + ').\n' +
    'Los agentes solo usan la información visible para el jugador.\n' + md + '\n## Criterios\n\n' +
    crit.map((c) => '- ' + (c.ok ? '✅' : '❌') + ' **' + c.esc + '** · ' + c.criterio + ' → ' + c.valor).join('\n') + '\n';
  if (!filtro) fs.writeFileSync(path.join(__dirname, 'informe_balance.md'), informe);
  console.log('\n(' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
}

module.exports = { ejecutar, criterios, simular, tecnicasPara };
