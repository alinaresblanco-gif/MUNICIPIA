/* Vista · Concejalías y Zona Común */
(function (global) {
  'use strict';
  global.Views = global.Views || {};

  var tab = 'areas';
  var areaSel = null;

  global.Views.concejalias = {
    titulo: 'Concejalías',
    render: function (params) {
      if (params && params.id) { areaSel = params.id; tab = 'areas'; }
      var html = '<div class="page-head"><div><h2>Concejalías</h2><p>Áreas municipales, equipos y zona común del Ayuntamiento</p></div></div>';
      html += '<div class="seg" style="margin-bottom:18px;width:max-content">' +
        seg('areas', '🏛️ Áreas') + seg('comun', '📣 Zona común') + seg('panel', '👤 Panel de concejales') + '</div>';

      if (tab === 'areas') html += areaSel ? ficha(areaSel) : listaAreas();
      else if (tab === 'comun') html += zonaComun();
      else html += panelConcejales();
      return html;
    },
    mount: function (root) {
      root.querySelectorAll('[data-seg]').forEach(function (b) {
        b.addEventListener('click', function () { tab = b.dataset.seg; areaSel = null; App.go('concejalias'); });
      });
      root.querySelectorAll('[data-area]').forEach(function (c) {
        c.addEventListener('click', function () { areaSel = c.dataset.area; App.go('concejalias'); });
      });
      var v = root.querySelector('[data-volver]');
      if (v) v.addEventListener('click', function () { areaSel = null; App.go('concejalias'); });
      var nc = root.querySelector('[data-nuevo-comunicado]');
      if (nc) nc.addEventListener('click', nuevoComunicado);
      root.querySelectorAll('[data-com]').forEach(function (el) {
        el.addEventListener('click', function () {
          var c = Store.find('comunicados', el.dataset.com);
          UI.modal(c.titulo, '<p class="muted">' + UI.esc(UI.usuario(c.autor).nombre) + ' · ' + UI.fmtFecha(c.fecha) + '</p><p style="line-height:1.6">' + UI.esc(c.cuerpo) + '</p>');
        });
      });
    }
  };

  function seg(id, txt) {
    return '<button data-seg="' + id + '" class="' + (tab === id ? 'is-active' : '') + '">' + txt + '</button>';
  }

  function listaAreas() {
    return '<div class="grid g-3">' + Store.get('areas').map(function (a) {
      var inc = Store.get('incidencias').filter(function (i) { return i.area === a.id && i.estado !== 'Resuelta'; }).length;
      var pro = Store.get('proyectos').filter(function (p) { return p.area === a.id; }).length;
      var doc = Store.get('documentos').filter(function (d) { return d.area === a.id; }).length;
      return '<div class="area-card" data-area="' + a.id + '">' +
        '<div class="area-ic" style="background:' + a.color + '1a;color:' + a.color + '">' + a.icono + '</div>' +
        '<h4>' + UI.esc(a.nombre) + '</h4>' +
        '<p class="mini" style="margin:4px 0 0">' + UI.pct(a.ejecutado, a.presupuesto) + '% del presupuesto ejecutado</p>' +
        '<div class="bar" style="margin-top:8px"><i style="width:' + UI.pct(a.ejecutado, a.presupuesto) + '%;background:' + a.color + '"></i></div>' +
        '<div class="area-meta"><span><b>' + inc + '</b>Incidencias</span><span><b>' + pro + '</b>Proyectos</span><span><b>' + doc + '</b>Documentos</span></div>' +
        '</div>';
    }).join('') + '</div>';
  }

  function ficha(id) {
    var a = UI.area(id);
    var inc = Store.get('incidencias').filter(function (i) { return i.area === id; });
    var pro = Store.get('proyectos').filter(function (p) { return p.area === id; });
    var doc = Store.get('documentos').filter(function (d) { return d.area === id; });
    var ev = Store.get('eventos').filter(function (e) { return e.area === id; });
    var eq = Store.get('usuarios').filter(function (u) { return u.area === id; });

    var h = '<button class="btn btn-ghost btn-sm" data-volver style="margin-bottom:16px">← Volver a áreas</button>';
    h += '<div class="card" style="margin-bottom:16px;border-left:5px solid ' + a.color + '">' +
      '<div class="spread"><div class="row"><div class="area-ic" style="margin:0;background:' + a.color + '1a;color:' + a.color + '">' + a.icono + '</div>' +
      '<div><h2>Concejalía de ' + UI.esc(a.nombre) + '</h2><p class="muted">Presupuesto ' + UI.eur(a.presupuesto) + ' · Ejecutado ' + UI.eur(a.ejecutado) + '</p></div></div>' +
      '<div style="min-width:190px"><div class="spread mini"><span>Ejecución</span><b>' + UI.pct(a.ejecutado, a.presupuesto) + '%</b></div>' +
      '<div class="bar"><i style="width:' + UI.pct(a.ejecutado, a.presupuesto) + '%;background:' + a.color + '"></i></div></div></div></div>';

    h += '<div class="grid g-2">';
    h += bloque('🚧 Incidencias (' + inc.length + ')', inc.length ? inc.map(function (i) {
      return item(UI.area(i.area).icono, i.titulo, i.ubicacion + ' · ' + UI.fmtFecha(i.fecha), UI.chipEstado(i.estado));
    }).join('') : UI.empty('✅', 'Sin incidencias'));
    h += bloque('📌 Proyectos (' + pro.length + ')', pro.length ? pro.map(function (p) {
      return item('📌', p.nombre, p.avance + '% · ' + UI.eur(p.presupuesto), UI.chipEstado(p.estado));
    }).join('') : UI.empty('📌', 'Sin proyectos'));
    h += bloque('📁 Documentos (' + doc.length + ')', doc.length ? doc.map(function (d) {
      return item('📄', d.nombre, d.carpeta + ' · ' + d.version, '<span class="chip gray">' + d.tam + '</span>');
    }).join('') : UI.empty('📁', 'Sin documentos'));
    h += bloque('🗓️ Agenda (' + ev.length + ')', ev.length ? ev.map(function (e) {
      return item('📅', e.titulo, UI.fmtFecha(e.fecha) + ' · ' + e.hora, '<span class="chip blue">' + e.tipo + '</span>');
    }).join('') : UI.empty('📅', 'Sin citas'));
    h += bloque('👥 Personal asignado (' + eq.length + ')', eq.length ? eq.map(function (u) {
      return item(UI.iniciales(u.nombre), u.nombre, u.cargo, '<span class="chip blue">' + (Auth.ROLES[u.rol] || {}).etiqueta + '</span>');
    }).join('') : UI.empty('👥', 'Sin personal'));
    h += bloque('📈 Indicadores', '<div class="grid g-2" style="gap:10px">' +
      mini('Incidencias resueltas', inc.filter(function (i) { return i.estado === 'Resuelta'; }).length) +
      mini('Proyectos activos', pro.filter(function (p) { return p.estado === 'En ejecución'; }).length) +
      mini('Presupuesto restante', UI.eur(a.presupuesto - a.ejecutado)) +
      mini('Documentos', doc.length) + '</div>');
    h += '</div>';
    return h;
  }

  function panelConcejales() {
    return '<div class="grid g-2">' + Store.get('usuarios').filter(function (u) { return u.rol !== 'admin'; }).map(function (u) {
      var a = UI.area(u.area);
      var tareas = Store.get('tareas').filter(function (t) { return t.usuario === u.id; });
      var inc = Store.get('incidencias').filter(function (i) { return i.responsable === u.id && i.estado !== 'Resuelta'; });
      var act = Math.min(100, tareas.length * 12 + inc.length * 15 + 30);
      return '<div class="card"><div class="row" style="align-items:flex-start">' +
        '<div class="li-ic" style="width:48px;height:48px;background:' + a.color + ';color:#fff;font-weight:700">' + UI.iniciales(u.nombre) + '</div>' +
        '<div style="flex:1"><div class="spread"><div><h4>' + UI.esc(u.nombre) + '</h4>' +
        '<p class="mini">' + UI.esc(u.cargo) + '</p></div><span class="chip blue">' + a.icono + ' ' + UI.esc(a.nombre) + '</span></div>' +
        '<div class="grid g-4" style="gap:8px;margin-top:12px">' +
        mini('Tareas', tareas.filter(function (t) { return !t.hecha; }).length) +
        mini('Incidencias', inc.length) +
        mini('Proyectos', Store.get('proyectos').filter(function (p) { return p.equipo.indexOf(u.id) !== -1; }).length) +
        mini('Documentos', Store.get('documentos').filter(function (d) { return d.autor === u.id; }).length) + '</div>' +
        '<div style="margin-top:12px"><div class="spread mini"><span>Indicador de actividad</span><b>' + act + '%</b></div>' +
        '<div class="bar green"><i style="width:' + act + '%"></i></div></div></div></div></div>';
    }).join('') + '</div>';
  }

  function zonaComun() {
    var h = '<div class="grid g-2-1"><div class="stack">';
    h += '<div class="card"><h3 class="card-t">📣 Tablón de comunicados <button class="btn btn-primary btn-sm" data-nuevo-comunicado>＋ Publicar</button></h3><div class="list">' +
      Store.get('comunicados').map(function (c) {
        return '<div class="list-item" data-com="' + c.id + '">' +
          '<div class="li-ic" style="' + (c.urgente ? 'background:#FDECEC;color:#D93A3A' : '') + '">' + (c.urgente ? '⚠️' : '📄') + '</div>' +
          '<div class="li-body"><div class="li-title">' + UI.esc(c.titulo) + '</div>' +
          '<div class="li-sub">' + UI.esc(UI.usuario(c.autor).nombre) + ' · ' + UI.desde(c.fecha) + '</div></div>' +
          '<span class="chip ' + (c.urgente ? 'red' : 'blue') + '">' + UI.esc(c.tipo) + '</span></div>';
      }).join('') + '</div></div>';
    h += '<div class="card"><h3 class="card-t">📜 Actas y circulares</h3><div class="list">' +
      Store.get('documentos').filter(function (d) { return d.carpeta === 'Actas' || d.carpeta === 'Normativas'; })
        .map(function (d) { return item('📄', d.nombre, d.carpeta + ' · ' + UI.fmtFecha(d.fecha), '<span class="chip gray">' + d.version + '</span>'); }).join('') +
      '</div></div>';
    h += '</div><div class="stack">';
    h += '<div class="card"><h3 class="card-t">🗳️ Votaciones internas</h3>' + Store.get('votaciones').map(function (v) {
      var total = v.opciones.reduce(function (a, o) { return a + o.v; }, 0) || 1;
      return '<div><h4 style="font-size:.95rem">' + UI.esc(v.titulo) + '</h4>' +
        '<p class="mini" style="margin:4px 0 12px">Cierra el ' + UI.fmtFecha(v.cierre) + '</p>' +
        v.opciones.map(function (o) {
          return '<div style="margin-bottom:10px"><div class="spread mini"><span>' + UI.esc(o.o) + '</span><b>' + Math.round(o.v / total * 100) + '%</b></div>' +
            '<div class="bar green"><i style="width:' + (o.v / total * 100) + '%"></i></div></div>';
        }).join('') + '</div>';
    }).join('') + '</div>';
    h += '<div class="card"><h3 class="card-t">📚 Historial de decisiones</h3><div class="timeline">' +
      Store.get('decisiones').map(function (d) {
        return '<div class="tl-item green"><div style="font-weight:600;font-size:.9rem">' + UI.esc(d.titulo) + '</div>' +
          '<div class="mini">' + UI.esc(UI.usuario(d.quien).nombre) + ' · ' + UI.fmtFecha(d.fecha) + '</div>' +
          '<div class="mini" style="margin-top:4px">' + UI.esc(d.motivo) + '</div></div>';
      }).join('') + '</div></div>';
    h += '</div></div>';
    return h;
  }

  function nuevoComunicado() {
    var body = UI.modal('Publicar comunicado interno',
      '<form id="f-com"><label class="field"><span>Título</span><input name="titulo" required /></label>' +
      '<label class="field"><span>Tipo</span><select name="tipo"><option>Comunicado</option><option>Convocatoria</option><option>Circular</option><option>Aviso urgente</option></select></label>' +
      '<label class="field"><span>Mensaje</span><textarea name="cuerpo" rows="5" required></textarea></label>' +
      '<label class="check"><input type="checkbox" name="urgente" /><span>Marcar como urgente</span></label>' +
      '<button class="btn btn-primary btn-block">Publicar</button></form>');
    body.querySelector('#f-com').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(e.target);
      Store.insert('comunicados', {
        id: Store.uid('com'), titulo: f.get('titulo'), cuerpo: f.get('cuerpo'), tipo: f.get('tipo'),
        urgente: !!f.get('urgente'), autor: Auth.actual().id, fecha: new Date().toISOString()
      });
      Store.log('comunicado', f.get('titulo'));
      UI.closeModal();
      UI.toast('Comunicado publicado', 'Visible para toda la corporación.', 'ok');
      App.go('concejalias');
    });
  }

  function bloque(t, contenido) {
    return '<div class="card"><h3 class="card-t">' + t + '</h3><div class="list">' + contenido + '</div></div>';
  }
  function item(ic, titulo, sub, extra) {
    return '<div class="list-item"><div class="li-ic">' + ic + '</div><div class="li-body">' +
      '<div class="li-title">' + UI.esc(titulo) + '</div><div class="li-sub">' + UI.esc(sub) + '</div></div>' + (extra || '') + '</div>';
  }
  function mini(l, v) {
    return '<div style="background:var(--gris);border-radius:10px;padding:10px"><div class="mini">' + l + '</div>' +
      '<div style="font-family:var(--f-tit);font-weight:700;font-size:1.05rem">' + v + '</div></div>';
  }
})(window);
