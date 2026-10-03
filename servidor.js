const http = require('http');
const fs = require('fs');
const path = require('path');
const { pool, obtenerDatosDashboard, mysqlUnavailable } = require('./consultas');

const PORT = Number(process.env.API_PORT || 3000);
const DIRECTORIO = __dirname;

const tablas = new Set([
  'alumno', 'docente', 'curso', 'seccion', 'matricula', 'calificacion',
  'asistencia', 'reclamo', 'respuesta_reclamo', 'pago', 'constancia', 'usuario', 'tarea'
]);
const claves = {
  alumno: 'idAlumno', docente: 'idDocente', curso: 'nrcCurso', seccion: 'idSeccion',
  matricula: 'idMatricula', calificacion: 'idCalificacion', asistencia: 'idAsistencia',
  reclamo: 'idReclamo', respuesta_reclamo: 'idRespuesta', pago: 'idPago', constancia: 'idConstancia',
  usuario: 'idUsuario', tarea: 'idTarea'
};

function json(res, status, body) {
  res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'});
  res.end(JSON.stringify(body));
}
function serveDashboard(res) {
  const archivo = path.join(DIRECTORIO, 'dashboard.html');
  fs.readFile(archivo, (error, contenido) => {
    if (error) return json(res, 500, {error: 'No se pudo cargar el dashboard'});
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(contenido);
  });
}
function serveAsset(res, pathname) {
  const relativePath = pathname.replace(/^\/+/, '');
  const directorioPublico = path.join(DIRECTORIO, 'public');
  const archivo = path.normalize(path.join(directorioPublico, relativePath));
  if (!archivo.startsWith(directorioPublico + path.sep)) return json(res, 403, {error: 'Archivo no permitido'});
  const tipos = {'.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8'};
  const tipo = tipos[path.extname(archivo).toLowerCase()];
  if (!tipo) return json(res, 404, {error: 'Recurso no encontrado'});
  fs.readFile(archivo, (error, contenido) => {
    if (error) return json(res, 404, {error: 'Recurso no encontrado'});
    res.writeHead(200, {'Content-Type': tipo, 'Cache-Control': 'no-cache'});
    res.end(contenido);
  });
}
function body(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (error) { reject(error); } });
    req.on('error', reject);
  });
}
function tableFrom(pathname) {
  const value = pathname.replace(/^\/api\//, '').replace(/\/$/, '').replace(/-/g, '_');
  return tablas.has(value) ? value : null;
}

async function request(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS'});
    return res.end();
  }
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if ((url.pathname === '/' || url.pathname === '/dashboard.html') && req.method === 'GET') {
      return serveDashboard(res);
    }
    if ((url.pathname.startsWith('/css/') || url.pathname.startsWith('/js/')) && req.method === 'GET') {
      return serveAsset(res, url.pathname);
    }
    if (url.pathname === '/api/salud' && req.method === 'GET') {
      try {
        const [rows] = await pool.query('SELECT 1 AS conectado');
        return json(res, 200, {ok: true, mysql: rows[0].conectado === 1, baseDatos: process.env.MYSQL_DATABASE || 'sistema_academico'});
      } catch (error) {
        return json(res, 200, {
          ok: true,
          mysql: false,
          baseDatos: process.env.MYSQL_DATABASE || 'sistema_academico',
          fallback: true,
          mensaje: 'MySQL no disponible; el dashboard continua en modo local.'
        });
      }
    }
    if (url.pathname === '/api/dashboard' && req.method === 'GET') {
      return json(res, 200, await obtenerDatosDashboard());
    }
    const tabla = tableFrom(url.pathname);
    if (!tabla) return json(res, 404, {error: 'Ruta no encontrada'});

    if (req.method === 'GET') {
      try {
        const limite = Math.min(Number(url.searchParams.get('limite') || 100), 500);
        const [rows] = await pool.query(`SELECT * FROM \`${tabla}\` ORDER BY \`${claves[tabla]}\` DESC LIMIT ?`, [limite]);
        return json(res, 200, rows);
      } catch (error) {
        if (mysqlUnavailable(error)) return json(res, 200, []);
        throw error;
      }
    }
    if (req.method === 'POST') {
      try {
        const data = await body(req);
        const columnas = Object.keys(data).filter(key => key !== claves[tabla] && /^[A-Za-z][A-Za-z0-9]*$/.test(key));
        if (!columnas.length) return json(res, 400, {error: 'No hay campos para insertar'});
        const valores = columnas.map(key => data[key]);
        const marcas = columnas.map(() => '?').join(', ');
        const [result] = await pool.query(`INSERT INTO \`${tabla}\` (${columnas.map(key => `\`${key}\``).join(', ')}) VALUES (${marcas})`, valores);
        return json(res, 201, {id: result.insertId, mensaje: 'Registro creado'});
      } catch (error) {
        if (mysqlUnavailable(error)) return json(res, 200, {ok: false, fallback: true, mensaje: 'MySQL no disponible; la operación se guardó solo en modo local.'});
        throw error;
      }
    }
    return json(res, 405, {error: 'Metodo no permitido'});
  } catch (error) {
    if (mysqlUnavailable(error)) {
      return json(res, 200, {ok: false, fallback: true, mensaje: 'MySQL no disponible; el dashboard sigue funcionando en local.'});
    }
    console.error(error.message);
    return json(res, 500, {error: 'Error de base de datos', detalle: error.message});
  }
}

http.createServer(request).listen(PORT, () => {
  console.log(`API academica disponible en http://localhost:${PORT}`);
});
