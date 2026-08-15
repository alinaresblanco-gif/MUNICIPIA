/* Vista · Inicio / Dashboard */
(function (global) {
  'use strict';
  global.Views = global.Views || {};

  global.Views.dashboard = {
    titulo: 'Inicio',
    render: function () {
      var u = Auth.actual();
      var incidencias = Store.get('incidencias');
      var abiertas = incidencias.filter(function (i) { return i.estado !== 'Resuelta' && i.estado !== 'Cerrada'; });
      var urgentes = incidencias.filter(function (i) { return (i.prioridad === 'Crítica' || i.prioridad === 'Alta') && i.estado !== 'Resuelta'; });
      var proyectos = Store.get('proyectos');
      var activos = proyectos.filter(function (p) { return p.estado === 'En ejecución'; });
      var hoy = new Date().toISOString().slice(0, 10);
      var proximos = Store.get('eventos').filter(function (e) { return e.fecha >= hoy; })
        .sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; }).slice(0, 4);
      var docs = Store.get('documentos').slice().sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; }).slice(0, 4);
      var misTareas = Store.get('tareas').filter(function (t) { return t.usuario === u.id && !t.hecha; });
      var presu = Store.get('areas').reduce(function (a, x) { return a + x.presupuesto; }, 0);
      var ejec = Store.get('areas').reduce(function (a, x) { return a + x.ejecutado; }, 0);
      var hora = new Date().getHours();
      var saludo = hora < 13 ? 'Buenos días' : hora < 21 ? 'Buenas tardes' : 'Buenas noches';

      var html = '';
      html += '<div class="page-head">' +
        '<div><h2>' + saludo + ', ' + UI.esc(u.nombre.split(' ')[0]) + '</h2>' +
        '<p>' + UI.esc(u.cargo) + ' · ' + UI.esc(UI.area(u.area).nombre) + ' · ' +
        new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) + '</p></div>' +
        '<div class="row"><button class="btn btn-ghost" data-go="calendario">📅 Mi agenda</button>' +
        '<button class="btn btn-primary" data-nueva-incidencia>＋ Crear incidencia</button></div></div>';

      html += '<div class="grid g-4" style="margin-bottom:16px">' +
        kpi('red', 'Incidencias abiertas', abiertas.length, urgentes.length + ' urgentes') +
        kpi('', 'Proyectos activos', activos.length, proyectos.length + ' en total') +
        kpi('green', 'Ejecución presupuestaria', UI.pct(ejec, presu) + '%', UI.eur(ejec) + ' de ' + UI.eur(presu)) +
        kpi('amber', 'Mis tareas pendientes', misTareas.length, misTareas.filter(function (t) { return t.prioridad === 'Alta'; }).length + ' de prioridad alta') +
        '</div>';

      html += '<div class="grid g-2-1">';

      /* Columna izquierda */
      html += '<div class="stack">';

      html += '<div class="card"><h3 class="card-t">🚨 Incidencias urgentes <button class="btn btn-ghost btn-sm" data-go="incidencias">Ver todas</button></h3><div class="list">';
      html += urgentes.length ? urgentes.slice(0, 4).map(function (i) {
        return '<div class="list-item" data-inc="' + i.id + '">' +
          '<div class="li-ic" style="background:' + UI.colorEstado(i.estado) + '22;color:' + UI.colorEstado(i.estado) + '">' + UI.area(i.area).icono + '</div>' +
          '<div class="li-body"><div class="li-title">' + UI.esc(i.titulo) + '</div>' +
          '<div class="li-sub">' + UI.esc(i.ubicacion) + ' · ' + UI.esc(UI.usuario(i.responsable).nombre) + '</div></div>' +
          UI.chipPrioridad(i.prioridad) + '</div>';
      }).join('') : UI.empty('✅', 'Sin incidencias urgentes. Buen trabajo.');
      html += '</div></div>';

      html += '<div class="card"><h3 class="card-t">📢 Comunicados internos <button class="btn btn-ghost btn-sm" data-go="concejalias">Zona común</button></h3><div class="list">' +
        Store.get('comunicados').slice(0, 3).map(function (c) {
          return '<div class="list-item" data-com="' + c.id + '">' +
            '<div class="li-ic" style="' + (c.urgente ? 'background:#FDECEC;color:#D93A3A' : '') + '">' + (c.urgente ? '⚠️' : '📄') + '</div>' +
            '<div class="li-body"><div class="li-title">' + UI.esc(c.titulo) + '</div>' +
            '<div class="li-sub">' + UI.esc(UI.usuario(c.autor).nombre) + ' · ' + UI.desde(c.fecha) + '</div></div>' +
            '<span class="chip ' + (c.urgente ? 'red' : 'blue') + '">' + UI.esc(c.tipo) + '</span></div>';
        }).join('') + '</div></div>';

      html += '<div class="card"><h3 class="card-t">📊 Actividad por concejalía</h3>' +
        Store.get('areas').slice(0, 6).map(function (a) {
          var n = Store.get('incidencias').filter(function (i) { return i.area === a.id; }).length;
          var p = UI.pct(a.ejecutado, a.presupuesto);
          return '<div style="margin-bottom:12px"><div class="spread" style="margin-bottom:5px">' +
            '<span style="font-size:.86rem;font-weight:600">' + a.icono + ' ' + UI.esc(a.nombre) + '</span>' +
            '<span class="mini">' + n + ' incid. · ' + p + '% ejec.</span></div>' +
            '<div class="bar"><i style="width:' + p + '%;background:' + a.color + '"></i></div></div>';
        }).join('') + '</div>';

      html += '</div>';

      /* Columna derecha */
      html += '<div class="stack">';

      html += '<div class="card"><h3 class="card-t">🗓️ Próximas citas</h3><div class="list">' +
        (proximos.length ? proximos.map(function (e) {
          var a = UI.area(e.area);
          return '<div class="list-item" data-go="calendario"><div class="li-ic" style="background:' + a.color + '1a;color:' + a.color + '">' + a.icono + '</div>' +
            '<div class="li-body"><div class="li-title">' + UI.esc(e.titulo) + '</div>' +
            '<div class="li-sub">' + UI.fmtFecha(e.fecha) + ' · ' + e.hora + ' · ' + UI.esc(e.lugar) + '</div></div></div>';
        }).join('') : UI.empty('📅', 'Sin citas próximas')) + '</div></div>';

      html += '<div class="card"><h3 class="card-t">✅ Mi día <button class="btn btn-ghost btn-sm" data-go="personal">Zona personal</button></h3><div class="list">' +
        (misTareas.length ? misTareas.slice(0, 5).map(function (t) {
          return '<div class="list-item" data-tarea="' + t.id + '"><div class="li-ic">☐</div>' +
            '<div class="li-body"><div class="li-title">' + UI.esc(t.titulo) + '</div>' +
            '<div class="li-sub">Vence ' + UI.fmtFecha(t.vence) + '</div></div>' + UI.chipPrioridad(t.prioridad) + '</div>';
        }).join('') : UI.empty('🎉', 'No tienes tareas pendientes')) + '</div></div>';

      html += '<div class="card"><h3 class="card-t">📁 Documentos recientes <button class="btn btn-ghost btn-sm" data-go="documentos">Abrir</button></h3><div class="list">' +
        docs.map(function (d) {
          var ic = { pdf: '📕', doc: '📘', xls: '📗' }[d.tipo] || '📄';
          return '<div class="list-item" data-go="documentos"><div class="li-ic">' + ic + '</div>' +
            '<div class="li-body"><div class="li-title">' + UI.esc(d.nombre) + '</div>' +
            '<div class="li-sub">' + UI.esc(d.carpeta) + ' · ' + d.version + ' · ' + UI.fmtFecha(d.fecha) + '</div></div></div>';
        }).join('') + '</div></div>';

      html += '<div class="card" style="background:linear-gradient(135deg,#123566,#1A4D8F);border:0;color:#fff">' +
        '<h3 class="card-t" style="color:#fff">🤖 Resumen IA del día</h3>' +
        '<p style="font-size:.87rem;line-height:1.6;margin:0;color:#DCE7F5">Hay <b>' + abiertas.length + '</b> incidencias abiertas, ' +
        '<b>' + urgentes.length + '</b> de atención prioritaria. Los proyectos en ejecución avanzan a un ' +
        '<b>' + Math.round(activos.reduce(function (a, p) { return a + p.avance; }, 0) / (activos.length || 1)) + '%</b> medio. ' +
        'Tienes <b>' + proximos.length + '</b> citas próximas y <b>' + misTareas.length + '</b> tareas pendientes.</p>' +
        '<button class="btn btn-green btn-sm" style="margin-top:12px" data-resumen>Generar informe completo</button></div>';

      html += '</div></div>';
      return html;
    },

    mount: function (root) {
      root.querySelectorAll('[data-inc]').forEach(function (el) {
        el.addEventListener('click', function () { App.go('incidencias', { id: el.dataset.inc }); });
      });
      root.querySelectorAll('[data-com]').forEach(function (el) {
        el.addEventListener('click', function () {
          var c = Store.find('comunicados', el.dataset.com);
          UI.modal(c.titulo, '<p class="muted">' + UI.esc(UI.usuario(c.autor).nombre) + ' · ' + UI.fmtFecha(c.fecha) + '</p><p style="line-height:1.6">' + UI.esc(c.cuerpo) + '</p>');
        });
      });
      root.querySelectorAll('[data-tarea]').forEach(function (el) {
        el.addEventListener('click', function () {
          Store.update('tareas', el.dataset.tarea, { hecha: true });
          UI.toast('Tarea completada', 'Se ha marcado como hecha.', 'ok');
          App.go('dashboard');
        });
      });
      var r = root.querySelector('[data-resumen]');
      if (r) r.addEventListener('click', function () {
        UI.modal('Informe automático del día', informe());
      });
    }
  };

  function kpi(clase, label, valor, detalle) {
    return '<div class="kpi ' + clase + '"><div class="kpi-l">' + label + '</div>' +
      '<div class="kpi-v">' + valor + '</div><div class="kpi-d">' + detalle + '</div></div>';
  }

  function informe() {
    var inc = Store.get('incidencias');
    var pro = Store.get('proyectos');
    var out = '<div class="stack">';
    out += '<div class="card"><h4>Incidencias</h4><ul style="line-height:1.8;font-size:.9rem">' +
      ['Abiertas', 'En proceso', 'Resuelta'].map(function (e) {
        return '<li>' + e + ': <b>' + inc.filter(function (i) { return i.estado === e; }).length + '</b></li>';
      }).join('') + '</ul></div>';
    out += '<div class="card"><h4>Proyectos</h4><ul style="line-height:1.8;font-size:.9rem">' +
      pro.map(function (p) { return '<li>' + UI.esc(p.nombre) + ' — ' + p.avance + '% (' + UI.eur(p.gastado) + ')</li>'; }).join('') + '</ul></div>';
    out += '<div class="card"><h4>Recomendaciones</h4><p style="font-size:.9rem;line-height:1.6">Priorizar la incidencia crítica de C/ Real, cerrar el plazo de licitación del Paseo Central y revisar la ejecución de Festejos (superior al 90%).</p></div>';
    return out + '</div>';
  }
})(window);
