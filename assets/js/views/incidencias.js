/* Vista · Gestor de incidencias con mapa vivo */
(function (global) {
  'use strict';
  global.Views = global.Views || {};

  var filtro = 'Todas';
  var busca = '';

  global.Views.incidencias = {
    titulo: 'Incidencias',
    render: function (params) {
      var lista = filtrar();
      var h = '<div class="page-head"><div><h2>Gestor de incidencias</h2><p>Mapa vivo, seguimiento y asignación de responsables</p></div>' +
        '<button class="btn btn-primary" data-nueva-incidencia>＋ Nueva incidencia</button></div>';

      h += '<div class="grid g-4" style="margin-bottom:16px">' +
        k('red', 'Abiertas', cont('Abierta')) + k('amber', 'En proceso', cont('En proceso')) +
        k('green', 'Resueltas', cont('Resuelta')) +
        k('', 'Tiempo medio', '3,2 d') + '</div>';

      h += '<div class="card" style="margin-bottom:16px"><h3 class="card-t">🗺️ Mapa vivo del municipio</h3>' + mapa(lista) + '</div>';

      h += '<div class="toolbar"><div class="search"><input id="inc-busca" placeholder="Buscar por título, calle o responsable…" value="' + UI.esc(busca) + '" /></div>' +
        '<div class="seg">' + ['Todas', 'Abierta', 'En proceso', 'Resuelta'].map(function (f) {
          return '<button data-f="' + f + '" class="' + (filtro === f ? 'is-active' : '') + '">' + f + '</button>';
        }).join('') + '</div></div>';

      h += '<div class="card"><div class="list">' + (lista.length ? lista.map(fila).join('') : UI.empty('🔍', 'No hay incidencias con esos criterios')) + '</div></div>';

      if (params && params.id) setTimeout(function () { detalle(params.id); }, 60);
      return h;
    },
    mount: function (root) {
      var b = root.querySelector('#inc-busca');
      if (b) b.addEventListener('input', function () {
        busca = b.value;
        var lista = filtrar();
        root.querySelector('.card:last-child .list').innerHTML = lista.length ? lista.map(fila).join('') : UI.empty('🔍', 'Sin resultados');
        enlazar(root);
      });
      root.querySelectorAll('[data-f]').forEach(function (x) {
        x.addEventListener('click', function () { filtro = x.dataset.f; App.go('incidencias'); });
      });
      enlazar(root);
    }
  };

  function enlazar(root) {
    root.querySelectorAll('[data-inc]').forEach(function (el) {
      el.addEventListener('click', function () { detalle(el.dataset.inc); });
    });
  }

  function cont(e) { return Store.get('incidencias').filter(function (i) { return i.estado === e; }).length; }
  function k(c, l, v) { return '<div class="kpi ' + c + '"><div class="kpi-l">' + l + '</div><div class="kpi-v">' + v + '</div></div>'; }

  function filtrar() {
    var q = busca.toLowerCase();
    return Store.get('incidencias').filter(function (i) {
      var okF = filtro === 'Todas' || i.estado === filtro;
      var okQ = !q || (i.titulo + ' ' + i.ubicacion + ' ' + UI.usuario(i.responsable).nombre).toLowerCase().indexOf(q) !== -1;
      return okF && okQ;
    });
  }

  function fila(i) {
    return '<div class="list-item" data-inc="' + i.id + '">' +
      '<div class="li-ic" style="background:' + UI.colorEstado(i.estado) + '1f;color:' + UI.colorEstado(i.estado) + '">' + UI.area(i.area).icono + '</div>' +
      '<div class="li-body"><div class="li-title">' + UI.esc(i.titulo) + '</div>' +
      '<div class="li-sub">' + UI.esc(i.ubicacion) + ' · ' + UI.esc(UI.usuario(i.responsable).nombre) + ' · ' + UI.fmtFecha(i.fecha) + '</div></div>' +
      '<div class="row">' + UI.chipPrioridad(i.prioridad) + UI.chipEstado(i.estado) + '</div></div>';
  }

  function mapa(lista) {
    var h = '<div class="mapa">' +
      '<div class="road" style="left:0;right:0;top:46%;height:14px"></div>' +
      '<div class="road" style="top:0;bottom:0;left:38%;width:12px"></div>' +
      '<div class="road" style="top:0;bottom:0;left:72%;width:9px"></div>' +
      '<div class="road" style="left:0;right:0;top:78%;height:9px"></div>';
    h += lista.map(function (i) {
      var c = UI.colorEstado(i.estado);
      var urg = i.prioridad === 'Crítica' ? ' pulse' : '';
      return '<div class="pin' + urg + '" data-inc="' + i.id + '" title="' + UI.esc(i.titulo) + '" ' +
        'style="left:' + i.x + '%;top:' + i.y + '%;background:' + c + ';color:' + c + '"><span>' + i.prioridad[0] + '</span></div>';
    }).join('');
    h += '<div class="mapa-leyenda">' +
      '<span><i style="background:#D93A3A"></i>Abierta</span>' +
      '<span><i style="background:#E9A319"></i>En proceso</span>' +
      '<span><i style="background:#3FA66B"></i>Resuelta</span></div>';
    return h + '</div>';
  }

  function detalle(id) {
    var i = Store.find('incidencias', id);
    if (!i) return;
    var a = UI.area(i.area);
    var body = UI.modal(i.titulo,
      '<div class="row" style="margin-bottom:14px">' + UI.chipEstado(i.estado) + UI.chipPrioridad(i.prioridad) +
      '<span class="chip blue">' + a.icono + ' ' + UI.esc(a.nombre) + '</span><span class="chip gray">' + UI.esc(i.origen) + '</span></div>' +
      '<p style="line-height:1.6;font-size:.92rem">' + UI.esc(i.descripcion) + '</p>' +
      '<div class="grid g-2" style="gap:10px;margin:14px 0">' +
      dato('📍 Ubicación', i.ubicacion) + dato('👤 Responsable', UI.usuario(i.responsable).nombre) +
      dato('📅 Creada', UI.fmtFecha(i.fecha)) + dato('⏳ Resolución estimada', UI.fmtFecha(i.estimada)) +
      dato('📷 Fotos adjuntas', i.fotos + ' imágenes') + dato('🆔 Referencia', i.id.toUpperCase()) + '</div>' +
      '<h4 style="font-size:.95rem;margin-bottom:10px">Historial</h4><div class="timeline">' +
      i.historial.map(function (x) { return '<div class="tl-item"><div class="mini">' + UI.fmtFecha(x.f) + '</div><div style="font-size:.88rem">' + UI.esc(x.t) + '</div></div>'; }).join('') +
      '</div>' +
      '<div class="row" style="margin-top:16px">' +
      '<select id="inc-estado" style="flex:1;padding:11px;border:1px solid var(--linea);border-radius:10px">' +
      ['Abierta', 'En proceso', 'Resuelta', 'Cerrada'].map(function (e) {
        return '<option ' + (e === i.estado ? 'selected' : '') + '>' + e + '</option>';
      }).join('') + '</select>' +
      '<button class="btn btn-primary" id="inc-guardar">Actualizar estado</button></div>');

    body.querySelector('#inc-guardar').addEventListener('click', function () {
      var nuevo = body.querySelector('#inc-estado').value;
      var hist = i.historial.concat([{ f: new Date().toISOString().slice(0, 10), t: 'Estado cambiado a ' + nuevo + ' por ' + Auth.actual().nombre }]);
      Store.update('incidencias', id, { estado: nuevo, historial: hist });
      Store.log('incidencia_estado', id + ' → ' + nuevo);
      UI.closeModal();
      UI.toast('Incidencia actualizada', 'Nuevo estado: ' + nuevo, 'ok');
      App.go('incidencias');
    });
  }

  function dato(l, v) {
    return '<div style="background:var(--gris);border-radius:10px;padding:10px 12px"><div class="mini">' + l + '</div>' +
      '<div style="font-weight:600;font-size:.88rem;margin-top:2px">' + UI.esc(v) + '</div></div>';
  }

  /* Formulario global de creación (usado también desde el dashboard) */
  global.nuevaIncidencia = function () {
    var areas = Store.get('areas').map(function (a) { return '<option value="' + a.id + '">' + a.icono + ' ' + a.nombre + '</option>'; }).join('');
    var users = Store.get('usuarios').map(function (u) { return '<option value="' + u.id + '">' + UI.esc(u.nombre) + '</option>'; }).join('');
    var body = UI.modal('Nueva incidencia',
      '<form id="f-inc"><label class="field"><span>Título</span><input name="titulo" required placeholder="Ej. Alcorque levantado en C/ Nueva" /></label>' +
      '<div class="grid-2"><label class="field"><span>Área responsable</span><select name="area">' + areas + '</select></label>' +
      '<label class="field"><span>Prioridad</span><select name="prioridad"><option>Baja</option><option selected>Media</option><option>Alta</option><option>Crítica</option></select></label></div>' +
      '<div class="grid-2"><label class="field"><span>Ubicación</span><input name="ubicacion" required placeholder="Calle y número" /></label>' +
      '<label class="field"><span>Responsable</span><select name="responsable">' + users + '</select></label></div>' +
      '<label class="field"><span>Descripción</span><textarea name="descripcion" rows="4" required></textarea></label>' +
      '<div class="grid-2"><label class="field"><span>Origen</span><select name="origen"><option>Interna</option><option>Buzón ciudadano</option><option>Policía Local</option></select></label>' +
      '<label class="field"><span>Resolución estimada</span><input type="date" name="estimada" /></label></div>' +
      '<button class="btn btn-primary btn-block">Registrar incidencia</button></form>');

    body.querySelector('#f-inc').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(e.target);
      var id = 'inc-' + (1000 + Store.get('incidencias').length + 1);
      Store.insert('incidencias', {
        id: id, titulo: f.get('titulo'), area: f.get('area'), estado: 'Abierta',
        prioridad: f.get('prioridad'), responsable: f.get('responsable'), ubicacion: f.get('ubicacion'),
        x: 10 + Math.random() * 80, y: 12 + Math.random() * 70, origen: f.get('origen'),
        fecha: new Date().toISOString().slice(0, 10), estimada: f.get('estimada') || '',
        descripcion: f.get('descripcion'), fotos: 0,
        historial: [{ f: new Date().toISOString().slice(0, 10), t: 'Incidencia creada por ' + Auth.actual().nombre }]
      });
      Store.insert('alertas', { id: Store.uid('al'), texto: 'Nueva incidencia: ' + f.get('titulo'), tipo: 'warn', fecha: new Date().toISOString(), leida: false });
      Store.log('incidencia_alta', id);
      UI.closeModal();
      UI.toast('Incidencia registrada', 'Referencia ' + id.toUpperCase(), 'ok');
      App.go('incidencias');
    });
  };
})(window);
