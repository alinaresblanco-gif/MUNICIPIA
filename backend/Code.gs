/* MUNICIPIA · API backend (Google Sheets como base de datos)
 * CRUD genérico por nombre de tabla, reutiliza el ESQUEMA definido en CrearBaseDeDatos.gs
 *
 * Peticiones GET  (lectura):  ?accion=listar&tabla=usuarios
 *                             ?accion=buscar&tabla=usuarios&id=u-admin
 *                             ?accion=buscarPorCampo&tabla=usuarios&campo=email&valor=x@y.com
 *
 * Peticiones POST (escritura), body JSON (Content-Type: text/plain para evitar preflight CORS):
 *   { "accion": "insertar",   "tabla": "incidencias", "datos": {...} }
 *   { "accion": "actualizar", "tabla": "incidencias", "id": "inc-1001", "datos": {...} }
 *   { "accion": "eliminar",   "tabla": "incidencias", "id": "inc-1001" }
 */

var PREFIJOS_ID = {
  usuarios: 'u', solicitudes: 'sol', incidencias: 'inc', incidencias_historial: 'inc-h',
  proyectos: 'pro', proyectos_equipo: 'pro-eq', proyectos_riesgos: 'pro-r', proyectos_hitos: 'pro-h',
  documentos: 'doc', eventos: 'ev', comunicados: 'com', salas: 'sala', mensajes: 'm',
  tareas: 't', notas: 'n', votaciones: 'vot', votaciones_opciones: 'vot-op', votaciones_votos: 'vot-v',
  decisiones: 'dec', proveedores: 'pv', alertas: 'al', auditoria: 'log'
};

function doGet(e) {
  try {
    var accion = e.parameter.accion;
    var tabla = e.parameter.tabla;
    if (accion === 'listar') return responder(listar(tabla));
    if (accion === 'buscar') return responder(buscarPorId(tabla, e.parameter.id));
    if (accion === 'buscarPorCampo') return responder(buscarPorCampo(tabla, e.parameter.campo, e.parameter.valor));
    return responderError('Acción no soportada en GET: ' + accion);
  } catch (err) {
    return responderError(err.message);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var body = JSON.parse(e.postData.contents);
    var accion = body.accion;
    var tabla = body.tabla;
    var resultado;
    switch (accion) {
      case 'insertar': resultado = insertar(tabla, body.datos || {}); break;
      case 'actualizar': resultado = actualizar(tabla, body.id, body.datos || {}); break;
      case 'eliminar': resultado = eliminar(tabla, body.id); break;
      case 'listar': resultado = listar(tabla); break;
      case 'buscar': resultado = buscarPorId(tabla, body.id); break;
      case 'buscarPorCampo': resultado = buscarPorCampo(tabla, body.campo, body.valor); break;
      default: throw new Error('Acción no soportada: ' + accion);
    }
    return responder(resultado);
  } catch (err) {
    return responderError(err.message);
  } finally {
    lock.releaseLock();
  }
}

/* ---- Acceso a hojas ---- */

function obtenerHoja(tabla) {
  if (!ESQUEMA.hasOwnProperty(tabla)) throw new Error('Tabla no válida: ' + tabla);
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tabla);
  if (!hoja) throw new Error('Hoja no encontrada: ' + tabla);
  return hoja;
}

function filaAObjeto(columnas, fila) {
  var obj = {};
  columnas.forEach(function (c, i) { obj[c] = fila[i] !== undefined ? fila[i] : ''; });
  return obj;
}

function listar(tabla) {
  var hoja = obtenerHoja(tabla);
  var columnas = ESQUEMA[tabla];
  var filas = hoja.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < filas.length; i++) {
    if (filas[i].join('') === '') continue;
    out.push(filaAObjeto(columnas, filas[i]));
  }
  return out;
}

function buscarPorId(tabla, id) {
  var registros = listar(tabla);
  for (var i = 0; i < registros.length; i++) {
    if (String(registros[i].id) === String(id)) return registros[i];
  }
  return null;
}

function buscarPorCampo(tabla, campo, valor) {
  var columnas = ESQUEMA[tabla];
  if (columnas.indexOf(campo) === -1) throw new Error('Campo no válido: ' + campo);
  return listar(tabla).filter(function (r) {
    return String(r[campo]).toLowerCase() === String(valor).toLowerCase();
  });
}

function insertar(tabla, datos) {
  var hoja = obtenerHoja(tabla);
  var columnas = ESQUEMA[tabla];
  if (!datos.id) datos.id = generarId(tabla);
  var fila = columnas.map(function (c) { return datos[c] !== undefined ? datos[c] : ''; });
  hoja.appendRow(fila);
  return datos;
}

function actualizar(tabla, id, patch) {
  var hoja = obtenerHoja(tabla);
  var columnas = ESQUEMA[tabla];
  var filas = hoja.getDataRange().getValues();
  var idCol = columnas.indexOf('id');
  for (var i = 1; i < filas.length; i++) {
    if (String(filas[i][idCol]) === String(id)) {
      var actual = filaAObjeto(columnas, filas[i]);
      Object.keys(patch).forEach(function (k) { actual[k] = patch[k]; });
      var nuevaFila = columnas.map(function (c) { return actual[c] !== undefined ? actual[c] : ''; });
      hoja.getRange(i + 1, 1, 1, columnas.length).setValues([nuevaFila]);
      return actual;
    }
  }
  throw new Error('Registro no encontrado: ' + id);
}

function eliminar(tabla, id) {
  var hoja = obtenerHoja(tabla);
  var columnas = ESQUEMA[tabla];
  var filas = hoja.getDataRange().getValues();
  var idCol = columnas.indexOf('id');
  for (var i = 1; i < filas.length; i++) {
    if (String(filas[i][idCol]) === String(id)) {
      hoja.deleteRow(i + 1);
      return { id: id, eliminado: true };
    }
  }
  throw new Error('Registro no encontrado: ' + id);
}

function generarId(tabla) {
  var prefijo = PREFIJOS_ID[tabla] || tabla;
  return prefijo + '-' + Utilities.getUuid().split('-')[0];
}

/* ---- Respuestas ---- */

function responder(datos) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, datos: datos })).setMimeType(ContentService.MimeType.JSON);
}

function responderError(msg) {
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: msg })).setMimeType(ContentService.MimeType.JSON);
}
