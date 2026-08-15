/* Vista · Proyectos */
(function (global) {
  'use strict';
  global.Views = global.Views || {};

  global.Views.proyectos = {
    titulo: 'Proyectos',
    render: function () {
      var pro = Store.get('proyectos');
      var h = '<div class="page-head"><div><h2>Área de proyectos</h2><p>Obras, actividades y mejoras con cronograma y presupuesto</p></div>' +
        '<button class="btn btn-primary" data-nuevo-pro>＋ Nuevo proyecto</button></div>';

      h += '<div class="grid g-4" style="margin-bottom:16px">' +
        kpi('', 'Proyectos', pro.length, 'en cartera') +
        kpi('green', 'En ejecución', pro.filter(function (p) { return p.estado === 'En ejecución'; }).length, 'activos') +
        kpi('amber', 'Avance medio', Math.round(pro.reduce(function (a, p) { return a + p.avance; }, 0) / pro.length) + '%', 'del conjunto') +
        kpi('purple', 'Inversión', UI.eur(pro.reduce(function (a, p) { return a + p.presupuesto; }, 0)), UI.eur(pro.reduce(function (a, p) { return a + p.gastado; }, 0)) + ' ejecutado') +
        '</div>';

      h += '<div class="card" style="margin-bottom:16px"><h3 class="card-t">📊 Cronograma general</h3><div class="gantt">' +
        pro.map(function (p) {
          var ini = new Date(p.inicio).getTime(), fin = new Date(p.fin).getTime();
          var min = Math.min.apply(null, pro.map(function (x) { return new Date(x.inicio).getTime(); }));
          var max = Math.max.apply(null, pro.map(function (x) { return new Date(x.fin).getTime(); }));
          var l = (ini - min) / (max - min) * 100, w = (fin - ini) / (max - min) * 100;
          return '<div class="gantt-row"><span style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + UI.esc(p.nombre) + '</span>' +
            '<div class="gantt-track"><div class="gantt-bar" style="left:' + l + '%;width:' + w + '%;background:' + UI.area(p.area).color + '">' + p.avance + '%</div></div></div>';
        }).join('') + '</div></div>';

      h += '<div class="grid g-2">' + pro.map(function (p) {
        var a = UI.area(p.area);
        return '<div class="card" data-pro="' + p.id + '" style="cursor:pointer">' +
          '<div class="spread" style="margin-bottom:10px"><div class="row"><span style="font-size:1.3rem">' + a.icono + '</span>' +
          '<div><h4>' + UI.esc(p.nombre) + '</h4><p class="mini">' + UI.esc(a.nombre) + ' · ' + UI.esc(p.proveedor) + '</p></div></div>' + UI.chipEstado(p.estado) + '</div>' +
          '<div class="spread mini"><span>Avance</span><b>' + p.avance + '%</b></div><div class="bar"><i style="width:' + p.avance + '%"></i></div>' +
          '<div class="spread mini" style="margin-top:10px"><span>Presupuesto</span><b>' + UI.pct(p.gastado, p.presupuesto) + '% · ' + UI.eur(p.gastado) + '</b></div>' +
          '<div class="bar green"><i style="width:' + UI.pct(p.gastado, p.presupuesto) + '%"></i></div>' +
          '<div class="area-meta"><span><b>' + p.hitos.filter(function (x) { return x.ok; }).length + '/' + p.hitos.length + '</b>Hitos</span>' +
          '<span><b>' + p.equipo.length + '</b>Equipo</span><span><b>' + p.riesgos.length + '</b>Riesgos</span>' +
          '<span><b>' + UI.fmtFecha(p.fin) + '</b>Fin previsto</span></div></div>';
      }).join('') + '</div>';
      return h;
    },
    mount: function (root) {
      root.querySelectorAll('[data-pro]').forEach(function (el) {
        el.addEventListener('click', function () { detalle(el.dataset.pro); });
      });
      root.querySelector('[data-nuevo-pro]').addEventListener('click', nuevo);
    }
  };

  function kpi(c, l, v, d) {
    return '<div class="kpi ' + c + '"><div class="kpi-l">' + l + '</div><div class="kpi-v">' + v + '</div><div class="kpi-d">' + d + '</div></div>';
  }

  function detalle(id) {
    var p = Store.find('proyectos', id);
    var body = UI.modal(p.nombre,
      '<div class="row" style="margin-bottom:14px">' + UI.chipEstado(p.estado) +
      '<span class="chip blue">' + UI.area(p.area).icono + ' ' + UI.esc(UI.area(p.area).nombre) + '</span>' +
      '<span class="chip gray">' + UI.fmtFecha(p.inicio) + ' → ' + UI.fmtFecha(p.fin) + '</span></div>' +
      '<div class="grid g-2" style="gap:10px;margin-bottom:16px">' +
      d('Presupuesto', UI.eur(p.presupuesto)) + d('Ejecutado', UI.eur(p.gastado) + ' (' + UI.pct(p.gastado, p.presupuesto) + '%)') +
      d('Responsable', UI.usuario(p.responsable).nombre) + d('Proveedor', p.proveedor) + '</div>' +
      '<h4 style="font-size:.95rem;margin-bottom:8px">Hitos</h4><div class="timeline">' +
      p.hitos.map(function (h) {
        return '<div class="tl-item ' + (h.ok ? 'green' : '') + '"><div style="font-size:.9rem;' + (h.ok ? 'color:var(--texto-2);text-decoration:line-through' : 'font-weight:600') + '">' +
          UI.esc(h.h) + '</div></div>';
      }).join('') + '</div>' +
      '<h4 style="font-size:.95rem;margin:14px 0 8px">Riesgos</h4>' +
      (p.riesgos.length ? p.riesgos.map(function (r) {
        return '<div class="list-item"><div class="li-ic" style="background:#FDF3E0;color:#8A5F0B">⚠️</div><div class="li-body"><div class="li-title">' + UI.esc(r.r) + '</div></div><span class="chip amber">' + r.n + '</span></div>';
      }).join('') : '<p class="muted">Sin riesgos registrados.</p>') +
      '<div class="row" style="margin-top:16px"><label class="field" style="flex:1;margin:0"><span>Actualizar avance (%)</span>' +
      '<input type="range" id="pro-av" min="0" max="100" value="' + p.avance + '" /></label>' +
      '<button class="btn btn-primary" id="pro-save" style="align-self:flex-end">Guardar</button></div>');

    body.querySelector('#pro-save').addEventListener('click', function () {
      var v = parseInt(body.querySelector('#pro-av').value, 10);
      Store.update('proyectos', id, { avance: v, estado: v >= 100 ? 'Finalizado' : p.estado });
      Store.log('proyecto_avance', id + ' → ' + v + '%');
      UI.closeModal();
      UI.toast('Proyecto actualizado', 'Avance: ' + v + '%', 'ok');
      App.go('proyectos');
    });
  }

  function d(l, v) {
    return '<div style="background:var(--gris);border-radius:10px;padding:10px 12px"><div class="mini">' + l + '</div><div style="font-weight:600;font-size:.88rem">' + UI.esc(v) + '</div></div>';
  }

  function nuevo() {
    var areas = Store.get('areas').map(function (a) { return '<option value="' + a.id + '">' + a.icono + ' ' + a.nombre + '</option>'; }).join('');
    var body = UI.modal('Nuevo proyecto',
      '<form id="f-pro"><label class="field"><span>Nombre del proyecto</span><input name="nombre" required /></label>' +
      '<div class="grid-2"><label class="field"><span>Área</span><select name="area">' + areas + '</select></label>' +
      '<label class="field"><span>Presupuesto (€)</span><input type="number" name="presupuesto" required min="0" /></label></div>' +
      '<div class="grid-2"><label class="field"><span>Inicio</span><input type="date" name="inicio" required /></label>' +
      '<label class="field"><span>Fin previsto</span><input type="date" name="fin" required /></label></div>' +
      '<label class="field"><span>Proveedor</span><input name="proveedor" placeholder="Empresa adjudicataria" /></label>' +
      '<button class="btn btn-primary btn-block">Crear proyecto</button></form>');
    body.querySelector('#f-pro').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(e.target);
      Store.insert('proyectos', {
        id: Store.uid('pro'), nombre: f.get('nombre'), area: f.get('area'), estado: 'Planificación',
        avance: 0, presupuesto: +f.get('presupuesto'), gastado: 0, inicio: f.get('inicio'), fin: f.get('fin'),
        responsable: Auth.actual().id, equipo: [Auth.actual().id], proveedor: f.get('proveedor') || '—',
        riesgos: [], hitos: [{ h: 'Definición y planificación', ok: false }]
      });
      Store.log('proyecto_alta', f.get('nombre'));
      UI.closeModal();
      UI.toast('Proyecto creado', f.get('nombre'), 'ok');
      App.go('proyectos');
    });
  }
})(window);
