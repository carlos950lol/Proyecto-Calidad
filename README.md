# Sistema Academico Local

## Inicio

```powershell
npm.cmd start
```

Abrir `http://localhost:3000` en el navegador. La API usa las variables de `.env` y MySQL en el puerto `3308`.

## Archivos

- `dashboard.html`: composición HTML de login y portal; contiene las vistas de dashboard, calificaciones, asistencia, tareas, alumnos, matricula, registro, reclamos, horario y perfil.
- `public/css/estilos.css`: estilos globales y responsive del portal.
- `public/js/configuracion.js`: nombre institucional, grupos y usuarios demo.
- `public/js/estado-datos.js`: estado de sesión, almacenamiento local y sincronización con la API.
- `public/js/gestion-academica.js`: matrículas, registros, reclamos y secciones.
- `public/js/calificaciones.js`: cálculos, filtros, edición y exportación de calificaciones.
- `public/js/aplicacion.js`: acceso, navegación, dashboard y vistas compartidas.
- `servidor.js`: servidor HTTP, recursos estáticos y rutas `/api`.
- `consultas.js`: conexión MySQL, consultas del dashboard y clasificación de errores de base de datos.
- `sistema_academico.sql`: crea la base completa, relaciones, cuentas demo y datos iniciales.
- `.env`: configuracion local de MySQL y del puerto de la API.
- `package.json`: dependencias y comando de inicio.

## Datos y roles

La ruta `GET /api/dashboard` entrega una sola respuesta consistente para maestro, alumno, jefe academico y registrador. El cliente la carga al iniciar sesion y conserva una copia local como respaldo si MySQL no esta disponible.

Cuentas demo:

- Maestro: `prof@acadecam.edu.pe` / `decam2024`
- Alumno: `alumno@acadecam.edu.pe` / `alumno2024`
- Jefe academico: `jefe@acadecam.edu.pe` / `jefe2024`
- Registrador: `registrador@acadecam.edu.pe` / `reg2024`

## Apartados que crean registros

- Maestro: nueva tarea, agregar alumno a calificaciones y edicion de notas.
- Jefe academico: nuevo registro de alumno, docente o administrativo.
- Registrador: nueva matricula.
- Alumno: nuevo reclamo.
- Asistencia: marca diaria de presente, falta o tardanza.

El SQL persiste las entidades principales en `alumno`, `docente`, `matricula`, `calificacion`, `asistencia`, `reclamo`, `respuesta_reclamo`, `pago`, `constancia`, `usuario` y `tarea`.
