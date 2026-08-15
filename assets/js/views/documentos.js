/* Vista · Documentoteca municipal */
(function (global) {
  'use strict';
  global.Views = global.Views || {};

  var CARPETAS = ['Contratos', 'Pliegos', 'Informes', 'Actas', 'Presupuestos', 'Normativas', 'Planes estratégicos'];
  var ICONOS = { 'Contratos': '📑', 'Pliegos': '📐', 'Informes': '📊', 'Actas': '📜', 'Presupuestos': '💶', 'Normativas': '⚖️', 'Planes estratégicos': '🧭' };
  var carpeta = null;
  var q = '';

  global.Views.documentos = {
    titulo: 'Documentoteca',
    render: function () {
      var docs = Store.get('documentos').filter(function (d) {
        var okC = !carpeta || d.carpeta === carpeta;
        var okQ = !q || (d.nombre + ' ' + d.carpeta + ' ' + UI.area(d.area).nombre).toLowerCase().indexOf(q.toLowerCase()) !== -1;
        return okC && okQ;
      });

      var h = '<div class="page-head"><div><h2>Documentoteca municipal</h2><p>Archivo documental con versionado y buscador inteligente</p></div>' +
        '<button class="btn btn-primary" data-subir>⬆ Subir documento</button></div>';

      h += '<div class="toolbar"><div class="search"><input id="doc-q" placeholder="Buscar documentos por nombre, carpeta o área…" value="' + UI.esc(q) + '" /></div>' +
        (carpeta ? '<button class="btn btn-ghost btn-sm" data-todas>✕ ' + UI.esc(carpeta) + '</button>' : '') + '</div>';

      if (!carpeta) {
        h += '<div class="grid g-4" style="margin-bottom:18px">' + CARPETAS.map(function (c) {
          var n = Store.get('documentos').filter(function (d) { return d.carpeta === c; }).length;
          return '<div class="folder" data-carpeta="' + c + '"><div class="fi">' + ICONOS[c] + '</div><h4>' + c + '</h4><p class="mini">' + n + ' documentos</p></div>';
        }).join('') + '</div>';
      }

      h += '<div class="card"><h3 class="card-t">' + (carpeta ? UI.esc(carpeta) : 'Todos los documentos') + ' (' + docs.length + ')</h3>' +
        '<div style="overflow-x:auto"><table class="table"><thead><tr><th>Documento</th><th>Carpeta</th><th>Área</th><th>Versión</th><th>Autor</th><th>Fecha</th><th></th></tr></thead><tbody>' +
        (docs.length ? docs.map(function (d) {
          var ic = { pdf: '📕', doc: '📘', xls: '📗' }[d.tipo] || '📄';
          return '<tr><td><b>' + ic + ' ' + UI.esc(d.nombre) + '</b><div class="mini">' + d.tam + '</div></td>' +
            '<td>' + UI.esc(d.carpeta) + '</td><td>' + UI.area(d.area).icono + ' ' + UI.esc(UI.area(d.area).nombre) + '</td>' +
            '<td><span class="chip blue">' + d.version + '</span></td><td>' + UI.esc(UI.usuario(d.autor).nombre) + '</td>' +
            '<td>' + UI.fmtFecha(d.fecha) + '</td>' +
            '<td><button class="btn btn-ghost btn-sm" data-doc="' + d.id + '">Ver</button></td></tr>';
        }).join('') : '<tr><td colspan="7">' + UI.empty('🔍', 'Sin documentos') + '</td></tr>') +
        '</tbody></table></div></div>';
      return h;
    },
    mount: function (root) {
      root.querySelectorAll('[data-carpeta]').forEach(function (el) {
        el.addEventListener('click', function () { carpeta = el.dataset.carpeta; App.go('documentos'); });
      });
      var t = root.querySelector('[data-todas]');
      if (t) t.addEventListener('click', function () { carpeta = null; App.go('documentos'); });
      var s = root.querySelector('#doc-q');
      s.addEventListener('input', function () { q = s.value; App.go('documentos'); setTimeout(function () { var i = document.querySelector('#doc-q'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 0); });
      root.querySelectorAll('[data-doc]').forEach(function (el) {
        el.addEventListener('click', function () {
          var d = Store.find('documentos', el.dataset.doc);
          UI.modal(d.nombre,
            '<div class="row" style="margin-bottom:14px"><span class="chip blue">' + d.version + '</span>' +
            '<span class="chip gray">' + d.carpeta + '</span><span class="chip green">' + d.tam + '</span></div>' +
            '<p class="muted">Subido por ' + UI.esc(UI.usuario(d.autor).nombre) + ' el ' + UI.fmtFecha(d.fecha) + '</p>' +
            '<div style="height:180px;border:2px dashed var(--linea);border-radius:14px;display:grid;place-items:center;color:var(--texto-2);margin:14px 0">Vista previa del documento</div>' +
            '<div class="row"><button class="btn btn-primary btn-sm">⬇ Descargar</button>' +
            '<button class="btn btn-ghost btn-sm">🔗 Compartir con el área</button>' +
            '<button class="btn btn-ghost btn-sm">🕘 Historial de versiones</button></div>');
        });
      });
      root.querySelector('[data-subir]').addEventListener('click', subir);
    }
  };

  function subir() {
    var areas = Store.get('areas').map(function (a) { return '<option value="' + a.id + '">' + a.icono + ' ' + a.nombre + '</option>'; }).join('');
    var body = UI.modal('Subir documento',
      '<form id="f-doc"><label class="field"><span>Nombre del documento</span><input name="nombre" required /></label>' +
      '<div class="grid-2"><label class="field"><span>Carpeta</span><select name="carpeta">' + CARPETAS.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></label>' +
      '<label class="field"><span>Área</span><select name="area">' + areas + '</select></label></div>' +
      '<div class="grid-2"><label class="field"><span>Tipo</span><select name="tipo"><option value="pdf">PDF</option><option value="doc">Word</option><option value="xls">Excel</option></select></label>' +
      '<label class="field"><span>Archivo</span><input type="file" name="archivo" /></label></div>' +
      '<button class="btn btn-primary btn-block">Subir y versionar</button></form>');
    body.querySelector('#f-doc').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(e.target);
      Store.insert('documentos', {
        id: Store.uid('doc'), nombre: f.get('nombre'), carpeta: f.get('carpeta'), area: f.get('area'),
        tipo: f.get('tipo'), version: 'v1', fecha: new Date().toISOString().slice(0, 10),
        autor: Auth.actual().id, tam: '— KB'
      });
      Store.log('documento_alta', f.get('nombre'));
      UI.closeModal();
      UI.toast('Documento subido', 'Versionado como v1.', 'ok');
      App.go('documentos');
    });
  }
})(window);
