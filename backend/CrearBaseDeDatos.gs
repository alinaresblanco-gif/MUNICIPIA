/* MUNICIPIA · Apps Script para crear la base de datos (Google Sheets)
 * Uso:
 *  1. Crea un Google Sheet en blanco.
 *  2. Abre Extensiones > Apps Script y pega este archivo.
 *  3. Ejecuta la función crearBaseDeDatos() una vez (autoriza los permisos que pida).
 *  4. Revisa el Sheet: se habrán creado todas las pestañas con sus cabeceras.
 */

/* Definición de tablas: nombre de hoja -> columnas exactas (en orden) */
var ESQUEMA = {
  usuarios: ['id', 'nombre', 'email', 'cargo', 'area', 'rol', 'estado', 'salt', 'hash', 'alta'],

  solicitudes: ['id', 'nombre', 'cargo', 'area', 'email', 'salt', 'hash', 'rol', 'estado', 'token', 'motivo', 'fecha', 'resuelta'],

  areas: ['id', 'nombre', 'icono', 'color', 'presupuesto', 'ejecutado'],

  incidencias: ['id', 'titulo', 'area', 'estado', 'prioridad', 'responsable', 'ubicacion', 'x', 'y', 'origen', 'fecha', 'estimada', 'descripcion', 'fotos'],
  incidencias_historial: ['id', 'incidencia_id', 'fecha', 'texto'],

  proyectos: ['id', 'nombre', 'area', 'estado', 'avance', 'presupuesto', 'gastado', 'inicio', 'fin', 'responsable', 'proveedor'],
  proyectos_equipo: ['id', 'proyecto_id', 'usuario_id'],
  proyectos_riesgos: ['id', 'proyecto_id', 'riesgo', 'nivel'],
  proyectos_hitos: ['id', 'proyecto_id', 'descripcion', 'completado'],

  documentos: ['id', 'nombre', 'carpeta', 'area', 'tipo', 'version', 'fecha', 'autor', 'tam', 'url_archivo'],

  eventos: ['id', 'titulo', 'fecha', 'hora', 'area', 'tipo', 'lugar'],

  comunicados: ['id', 'titulo', 'cuerpo', 'tipo', 'urgente', 'autor', 'fecha'],

  salas: ['id', 'nombre', 'tipo', 'area', 'ref', 'icono', 'miembros'],
  mensajes: ['id', 'sala', 'autor', 'texto', 'fecha'],

  tareas: ['id', 'titulo', 'usuario', 'area', 'prioridad', 'hecha', 'vence'],
  notas: ['id', 'usuario', 'texto', 'fecha'],

  votaciones: ['id', 'titulo', 'estado', 'cierre'],
  votaciones_opciones: ['id', 'votacion_id', 'opcion', 'votos'],
  votaciones_votos: ['id', 'votacion_id', 'usuario_id', 'opcion', 'fecha'],

  decisiones: ['id', 'titulo', 'quien', 'fecha', 'motivo', 'doc'],

  proveedores: ['id', 'nombre', 'cif', 'contacto', 'tel', 'contratos', 'valoracion'],

  alertas: ['id', 'texto', 'tipo', 'fecha', 'leida'],

  auditoria: ['id', 'accion', 'detalle', 'usuario', 'fecha']
};

function crearBaseDeDatos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(ESQUEMA).forEach(function (nombreHoja) {
    var columnas = ESQUEMA[nombreHoja];
    var hoja = ss.getSheetByName(nombreHoja) || ss.insertSheet(nombreHoja);

    hoja.clear();
    hoja.getRange(1, 1, 1, columnas.length).setValues([columnas]);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, columnas.length).setFontWeight('bold').setBackground('#1A4D8F').setFontColor('#FFFFFF');
    hoja.autoResizeColumns(1, columnas.length);
  });

  // Elimina la hoja por defecto "Hoja 1" si quedó vacía y sin usar.
  var porDefecto = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (porDefecto && ss.getSheets().length > 1) {
    ss.deleteSheet(porDefecto);
  }

  SpreadsheetApp.flush();
  Logger.log('Base de datos creada: ' + Object.keys(ESQUEMA).length + ' hojas.');
}
