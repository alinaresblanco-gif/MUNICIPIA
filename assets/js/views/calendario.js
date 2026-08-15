/* Vista · Calendario inteligente */
(function (global) {
  'use strict';
  global.Views = global.Views || {};

  var ref = new Date();

  global.Views.calendario = {
    titulo: 'Calendario',
    render: function () {
      var eventos = Store.get('eventos');
      var hoy = new Date().toISOString().slice(0, 10);
      var proximos = eventos.filter(function (e) { return e.fecha >= hoy; }).sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });

      var h = '<div class="page-head"><div><h2>Calendario municipal</h2><p>Reuniones, eventos y plazos administrativos</p></div>' +
        '<div class="row"><button class="btn btn-ghost" data-gcal>🔗 Sincronizar Google Calendar</button>' +
        '<button class="btn btn-primary" data-nuevo-ev>＋ Nueva cita</button></div></div>';

      h += '<div class="grid g-2-1"><div class="card">' +
        '<div class="spread" style="margin-bottom:14px"><button class="btn btn-ghost btn-sm" data-mes="-1">‹</button>' +
        '<h3 style="text-transform:capitalize">' + ref.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) + '</h3>' +
        '<button class="btn btn-ghost btn-sm" data-mes="1">›</button></div>' + grid(eventos) + '</div>';

      h += '<div class="stack">' +
        '<div class="card"><h3 class="card-t">⏭️ Próximas citas</h3><div class="list">' +
        (proximos.length ? proximos.slice(0, 6).map(function (e) {
          var a = UI.area(e.area);
          return '<div class="list-item" data-ev="' + e.id + '"><div class="li-ic" style="background:' + a.color + '1a;color:' + a.color + '">' +
            (e.tipo === 'Plazo' ? '⏳' : e.tipo === 'Evento' ? '🎪' : '👥') + '</div>' +
            '<div class="li-body"><div class="li-title">' + UI.esc(e.titulo) + '</div>' +
            '<div class="li-sub">' + UI.fmtFecha(e.fecha) + ' · ' + e.hora + ' · ' + UI.esc(e.lugar) + '</div></div></div>';
        }).join('') : UI.empty('📅', 'Sin citas')) + '</div></div>' +
        '<div class="card"><h3 class="card-t">🔔 Recordatorios automáticos</h3><div class="list">' +
        Store.get('alertas').map(function (a) {
          return '<div class="list-item"><div class="li-ic">' + (a.tipo === 'err' ? '🚨' : a.tipo === 'warn' ? '⚠️' : 'ℹ️') + '</div>' +
            '<div class="li-body"><div class="li-title" style="white-space:normal">' + UI.esc(a.texto) + '</div>' +
            '<div class="li-sub">' + UI.desde(a.fecha) + '</div></div></div>';
        }).join('') + '</div></div>' +
        '<div class="card"><h3 class="card-t">🎨 Leyenda por área</h3><div class="row">' +
        Store.get('areas').map(function (a) {
          return '<span class="chip" style="background:' + a.color + '1a;color:' + a.color + '">' + a.icono + ' ' + UI.esc(a.nombre) + '</span>';
        }).join('') + '</div></div></div></div>';
      return h;
    },
    mount: function (root) {
      root.querySelectorAll('[data-mes]').forEach(function (b) {
        b.addEventListener('click', function () { ref.setMonth(ref.getMonth() + (+b.dataset.mes)); App.go('calendario'); });
      });
      root.querySelectorAll('[data-ev]').forEach(function (el) {
        el.addEventListener('click', function () { verEvento(el.dataset.ev); });
      });
      root.querySelector('[data-nuevo-ev]').addEventListener('click', nuevo);
      root.querySelector('[data-gcal]').addEventListener('click', function () {
        UI.toast('Google Calendar', 'Sincronización programada (integración pendiente de credenciales).', 'warn');
      });
    }
  };

  function grid(eventos) {
    var y = ref.getFullYear(), m = ref.getMonth();
    var primero = new Date(y, m, 1);
    var offset = (primero.getDay() + 6) % 7;
    var diasMes = new Date(y, m + 1, 0).getDate();
    var hoy = new Date().toISOString().slice(0, 10);
    var h = '<div class="cal-grid">' + ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(function (d) { return '<div class="cal-h">' + d + '</div>'; }).join('');
    for (var i = 0; i < offset; i++) h += '<div class="cal-d out"></div>';
    for (var d = 1; d <= diasMes; d++) {
      var iso = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var evs = eventos.filter(function (e) { return e.fecha === iso; });
      h += '<div class="cal-d ' + (iso === hoy ? 'today' : '') + (evs.length ? ' has-ev' : '') + '"><div class="cal-n">' + d + '</div>' +
        evs.map(function (e) {
          return '<div class="cal-ev" data-ev="' + e.id + '" style="background:' + UI.area(e.area).color + '">' + e.hora + ' ' + UI.esc(e.titulo) + '</div>';
        }).join('') + '</div>';
    }
    return h + '</div>';
  }

  function verEvento(id) {
    var e = Store.find('eventos', id);
    var a = UI.area(e.area);
    UI.modal(e.titulo,
      '<div class="row" style="margin-bottom:14px"><span class="chip blue">' + e.tipo + '</span>' +
      '<span class="chip" style="background:' + a.color + '1a;color:' + a.color + '">' + a.icono + ' ' + UI.esc(a.nombre) + '</span></div>' +
      '<p><b>📅 ' + UI.fmtFecha(e.fecha) + '</b> · 🕐 ' + e.hora + '</p><p>📍 ' + UI.esc(e.lugar) + '</p>' +
      '<div class="row" style="margin-top:14px"><button class="btn btn-ghost btn-sm">✔ Confirmar asistencia</button>' +
      '<button class="btn btn-ghost btn-sm">📄 Documentación asociada</button></div>');
  }

  function nuevo() {
    var areas = Store.get('areas').map(function (a) { return '<option value="' + a.id + '">' + a.icono + ' ' + a.nombre + '</option>'; }).join('');
    var body = UI.modal('Nueva cita en el calendario',
      '<form id="f-ev"><label class="field"><span>Título</span><input name="titulo" required /></label>' +
      '<div class="grid-2"><label class="field"><span>Fecha</span><input type="date" name="fecha" required /></label>' +
      '<label class="field"><span>Hora</span><input type="time" name="hora" required /></label></div>' +
      '<div class="grid-2"><label class="field"><span>Tipo</span><select name="tipo"><option>Reunión</option><option>Evento</option><option>Plazo</option></select></label>' +
      '<label class="field"><span>Área</span><select name="area">' + areas + '</select></label></div>' +
      '<label class="field"><span>Lugar</span><input name="lugar" required /></label>' +
      '<button class="btn btn-primary btn-block">Añadir al calendario</button></form>');
    body.querySelector('#f-ev').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = new FormData(ev.target);
      Store.insert('eventos', {
        id: Store.uid('ev'), titulo: f.get('titulo'), fecha: f.get('fecha'), hora: f.get('hora'),
        area: f.get('area'), tipo: f.get('tipo'), lugar: f.get('lugar')
      });
      Store.log('evento_alta', f.get('titulo'));
      UI.closeModal();
      UI.toast('Cita creada', 'Añadida al calendario municipal.', 'ok');
      App.go('calendario');
    });
  }
})(window);
