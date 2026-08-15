/* Vista · Transparencia interna */
(function (global) {
  'use strict';
  global.Views = global.Views || {};

  global.Views.transparencia = {
    titulo: 'Transparencia interna',
    render: function () {
      var inc = Store.get('incidencias');
      var pro = Store.get('proyectos');
      var areas = Store.get('areas');
      var resueltas = inc.filter(function (i) { return i.estado === 'Resuelta'; }).length;
      var presu = areas.reduce(function (a, x) { return a + x.presupuesto; }, 0);
      var ejec = areas.reduce(function (a, x) { return a + x.ejecutado; }, 0);

      var h = '<div class="page-head"><div><h2>Panel de transparencia interna</h2><p>Indicadores de gestión de la corporación municipal</p></div>' +
        '<button class="btn btn-ghost" data-export>⬇ Exportar informe</button></div>';

      h += '<div class="grid g-4" style="margin-bottom:18px">' +
        kpi('green', 'Incidencias resueltas', resueltas + '/' + inc.length, UI.pct(resueltas, inc.length) + '% de resolución') +
        kpi('', 'Proyectos en curso', pro.filter(function (p) { return p.estado === 'En ejecución'; }).length, 'de ' + pro.length + ' totales') +
        kpi('amber', 'Gasto ejecutado', UI.eur(ejec), UI.pct(ejec, presu) + '% del presupuesto') +
        kpi('purple', 'Reuniones del mes', Store.get('eventos').filter(function (e) { return e.tipo === 'Reunión'; }).length, 'convocadas') +
        '</div>';

      h += '<div class="grid g-2" style="margin-bottom:16px">';
      h += '<div class="card"><h3 class="card-t">💶 Ejecución presupuestaria por área</h3>' +
        areas.map(function (a) {
          var p = UI.pct(a.ejecutado, a.presupuesto);
          return '<div style="margin-bottom:11px"><div class="spread mini"><span>' + a.icono + ' ' + UI.esc(a.nombre) + '</span>' +
            '<span>' + UI.eur(a.ejecutado) + ' / ' + UI.eur(a.presupuesto) + ' · <b>' + p + '%</b></span></div>' +
            '<div class="bar ' + (p > 90 ? 'red' : p > 70 ? 'amber' : 'green') + '"><i style="width:' + p + '%"></i></div></div>';
        }).join('') + '</div>';

      h += '<div class="card"><h3 class="card-t">🚧 Estado de incidencias</h3>' +
        '<div class="grid g-3" style="gap:12px">' +
        ['Abierta', 'En proceso', 'Resuelta'].map(function (e) {
          var n = inc.filter(function (i) { return i.estado === e; }).length;
          var p = UI.pct(n, inc.length);
          return '<div style="text-align:center"><div class="donut" style="background:conic-gradient(' + UI.colorEstado(e) + ' ' + (p * 3.6) + 'deg, var(--gris) 0)"><b>' + p + '%</b></div>' +
            '<div class="mini" style="margin-top:8px">' + e + ' · ' + n + '</div></div>';
        }).join('') + '</div>' +
        '<h4 style="font-size:.9rem;margin:18px 0 8px">Incidencias por área</h4>' +
        areas.filter(function (a) { return inc.some(function (i) { return i.area === a.id; }); }).map(function (a) {
          var n = inc.filter(function (i) { return i.area === a.id; }).length;
          return '<div style="margin-bottom:8px"><div class="spread mini"><span>' + a.icono + ' ' + UI.esc(a.nombre) + '</span><b>' + n + '</b></div>' +
            '<div class="bar"><i style="width:' + (n / inc.length * 100) + '%;background:' + a.color + '"></i></div></div>';
        }).join('') + '</div>';
      h += '</div>';

      h += '<div class="card"><h3 class="card-t">📈 Actividad por concejalía</h3><div style="overflow-x:auto">' +
        '<table class="table"><thead><tr><th>Concejalía</th><th>Incidencias</th><th>Resueltas</th><th>Proyectos</th><th>Documentos</th><th>Ejecución</th></tr></thead><tbody>' +
        areas.map(function (a) {
          var ia = inc.filter(function (i) { return i.area === a.id; });
          var p = UI.pct(a.ejecutado, a.presupuesto);
          return '<tr><td><b>' + a.icono + ' ' + UI.esc(a.nombre) + '</b></td><td>' + ia.length + '</td>' +
            '<td>' + ia.filter(function (i) { return i.estado === 'Resuelta'; }).length + '</td>' +
            '<td>' + pro.filter(function (x) { return x.area === a.id; }).length + '</td>' +
            '<td>' + Store.get('documentos').filter(function (d) { return d.area === a.id; }).length + '</td>' +
            '<td><div class="bar" style="min-width:90px"><i style="width:' + p + '%;background:' + a.color + '"></i></div><span class="mini">' + p + '%</span></td></tr>';
        }).join('') + '</tbody></table></div></div>';
      return h;
    },
    mount: function (root) {
      root.querySelector('[data-export]').addEventListener('click', function () {
        UI.toast('Informe generado', 'Se ha preparado el resumen de transparencia.', 'ok');
      });
    }
  };

  function kpi(c, l, v, d) {
    return '<div class="kpi ' + c + '"><div class="kpi-l">' + l + '</div><div class="kpi-v">' + v + '</div><div class="kpi-d">' + d + '</div></div>';
  }
})(window);
