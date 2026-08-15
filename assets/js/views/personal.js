/* Vista · Zona de trabajo personal */
(function (global) {
  'use strict';
  global.Views = global.Views || {};

  global.Views.personal = {
    titulo: 'Zona personal',
    render: function () {
      var u = Auth.actual();
      var tareas = Store.get('tareas').filter(function (t) { return t.usuario === u.id; });
      var pend = tareas.filter(function (t) { return !t.hecha; });
      var notas = Store.get('notas').filter(function (n) { return n.usuario === u.id; });
      var docs = Store.get('documentos').filter(function (d) { return d.autor === u.id; });
      var inc = Store.get('incidencias').filter(function (i) { return i.responsable === u.id; });
      var hoy = new Date().toISOString().slice(0, 10);
      var agenda = Store.get('eventos').filter(function (e) { return e.area === u.area && e.fecha >= hoy; });

      var h = '<div class="page-head"><div><h2>Mi zona de trabajo</h2><p>' + UI.esc(u.nombre) + ' · ' + UI.esc(u.cargo) + '</p></div>' +
        '<div class="row"><button class="btn btn-ghost" data-nota>＋ Nota rápida</button>' +
        '<button class="btn btn-primary" data-tarea-nueva>＋ Nueva tarea</button></div></div>';

      h += '<div class="grid g-4" style="margin-bottom:16px">' +
        kpi('amber', 'Tareas pendientes', pend.length, tareas.filter(function (t) { return t.hecha; }).length + ' completadas') +
        kpi('red', 'Incidencias asignadas', inc.filter(function (i) { return i.estado !== 'Resuelta'; }).length, inc.length + ' históricas') +
        kpi('', 'Documentos propios', docs.length, 'en la documentoteca') +
        kpi('green', 'Citas próximas', agenda.length, 'en mi área') + '</div>';

      h += '<div class="grid g-2-1"><div class="stack">';
      h += '<div class="card"><h3 class="card-t">✅ Mis tareas</h3><div class="list">' +
        (tareas.length ? tareas.map(function (t) {
          return '<div class="list-item"><button class="li-ic" data-check="' + t.id + '" style="border:0;cursor:pointer;' +
            (t.hecha ? 'background:var(--verde-100);color:var(--verde)' : '') + '">' + (t.hecha ? '✔' : '☐') + '</button>' +
            '<div class="li-body"><div class="li-title" style="' + (t.hecha ? 'text-decoration:line-through;color:var(--texto-2)' : '') + '">' + UI.esc(t.titulo) + '</div>' +
            '<div class="li-sub">' + UI.area(t.area).nombre + ' · vence ' + UI.fmtFecha(t.vence) + '</div></div>' +
            UI.chipPrioridad(t.prioridad) + '</div>';
        }).join('') : UI.empty('🎉', 'Sin tareas asignadas')) + '</div></div>';

      h += '<div class="card"><h3 class="card-t">🚧 Incidencias a mi cargo</h3><div class="list">' +
        (inc.length ? inc.map(function (i) {
          return '<div class="list-item" data-inc="' + i.id + '"><div class="li-ic">' + UI.area(i.area).icono + '</div>' +
            '<div class="li-body"><div class="li-title">' + UI.esc(i.titulo) + '</div><div class="li-sub">' + UI.esc(i.ubicacion) + '</div></div>' +
            UI.chipEstado(i.estado) + '</div>';
        }).join('') : UI.empty('✅', 'Ninguna incidencia asignada')) + '</div></div>';
      h += '</div><div class="stack">';

      h += '<div class="card"><h3 class="card-t">📝 Mis notas</h3><div class="list">' +
        (notas.length ? notas.map(function (n) {
          return '<div class="list-item"><div class="li-ic">📌</div><div class="li-body"><div class="li-title" style="white-space:normal">' + UI.esc(n.texto) + '</div>' +
            '<div class="li-sub">' + UI.desde(n.fecha) + '</div></div>' +
            '<button class="btn btn-ghost btn-sm" data-del-nota="' + n.id + '">✕</button></div>';
        }).join('') : UI.empty('📝', 'Sin notas')) + '</div></div>';

      h += '<div class="card"><h3 class="card-t">📊 Mis KPIs</h3>' +
        bar('Tareas completadas', UI.pct(tareas.filter(function (t) { return t.hecha; }).length, tareas.length || 1)) +
        bar('Incidencias resueltas', UI.pct(inc.filter(function (i) { return i.estado === 'Resuelta'; }).length, inc.length || 1)) +
        bar('Aportación documental', Math.min(100, docs.length * 25)) + '</div>';

      h += '<div class="card"><h3 class="card-t">🗓️ Mi agenda</h3><div class="list">' +
        (agenda.length ? agenda.slice(0, 5).map(function (e) {
          return '<div class="list-item"><div class="li-ic">📅</div><div class="li-body"><div class="li-title">' + UI.esc(e.titulo) + '</div>' +
            '<div class="li-sub">' + UI.fmtFecha(e.fecha) + ' · ' + e.hora + '</div></div></div>';
        }).join('') : UI.empty('📅', 'Sin citas próximas')) + '</div></div>';

      h += '</div></div>';
      return h;
    },
    mount: function (root) {
      root.querySelectorAll('[data-check]').forEach(function (b) {
        b.addEventListener('click', function () {
          var t = Store.find('tareas', b.dataset.check);
          Store.update('tareas', t.id, { hecha: !t.hecha });
          App.go('personal');
        });
      });
      root.querySelectorAll('[data-inc]').forEach(function (el) {
        el.addEventListener('click', function () { App.go('incidencias', { id: el.dataset.inc }); });
      });
      root.querySelectorAll('[data-del-nota]').forEach(function (b) {
        b.addEventListener('click', function () { Store.remove('notas', b.dataset.delNota); App.go('personal'); });
      });
      root.querySelector('[data-nota]').addEventListener('click', function () {
        var body = UI.modal('Nueva nota', '<form id="f-nota"><label class="field"><span>Nota</span><textarea name="texto" rows="4" required></textarea></label><button class="btn btn-primary btn-block">Guardar</button></form>');
        body.querySelector('#f-nota').addEventListener('submit', function (e) {
          e.preventDefault();
          Store.insert('notas', { id: Store.uid('n'), usuario: Auth.actual().id, texto: new FormData(e.target).get('texto'), fecha: new Date().toISOString() });
          UI.closeModal(); App.go('personal');
        });
      });
      root.querySelector('[data-tarea-nueva]').addEventListener('click', function () {
        var areas = Store.get('areas').map(function (a) { return '<option value="' + a.id + '">' + a.icono + ' ' + a.nombre + '</option>'; }).join('');
        var body = UI.modal('Nueva tarea',
          '<form id="f-t"><label class="field"><span>Título</span><input name="titulo" required /></label>' +
          '<div class="grid-2"><label class="field"><span>Prioridad</span><select name="prioridad"><option>Baja</option><option selected>Media</option><option>Alta</option></select></label>' +
          '<label class="field"><span>Vence</span><input type="date" name="vence" required /></label></div>' +
          '<label class="field"><span>Área</span><select name="area">' + areas + '</select></label>' +
          '<button class="btn btn-primary btn-block">Crear tarea</button></form>');
        body.querySelector('#f-t').addEventListener('submit', function (e) {
          e.preventDefault();
          var f = new FormData(e.target);
          Store.insert('tareas', {
            id: Store.uid('t'), titulo: f.get('titulo'), usuario: Auth.actual().id, area: f.get('area'),
            prioridad: f.get('prioridad'), hecha: false, vence: f.get('vence')
          });
          UI.closeModal(); UI.toast('Tarea creada', '', 'ok'); App.go('personal');
        });
      });
    }
  };

  function kpi(c, l, v, d) {
    return '<div class="kpi ' + c + '"><div class="kpi-l">' + l + '</div><div class="kpi-v">' + v + '</div><div class="kpi-d">' + d + '</div></div>';
  }
  function bar(l, p) {
    return '<div style="margin-bottom:12px"><div class="spread mini"><span>' + l + '</span><b>' + p + '%</b></div><div class="bar green"><i style="width:' + p + '%"></i></div></div>';
  }
})(window);
