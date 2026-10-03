let CU=null,currentRole='teacher',allStudents=[],allGrades=[],allTasks=[],taskFilter='all',allMatriculas=[],allReclamos=[],allRegistros=[],dashboardStats={};

const DATA_KEY='academia_decam_data_v2';
const DATA_COLLECTIONS={
  allStudents:{get:()=>allStudents,set:value=>allStudents=value},
  allGrades:{get:()=>allGrades,set:value=>allGrades=value},
  allTasks:{get:()=>allTasks,set:value=>allTasks=value},
  allMatriculas:{get:()=>allMatriculas,set:value=>allMatriculas=value},
  allReclamos:{get:()=>allReclamos,set:value=>allReclamos=value},
  allRegistros:{get:()=>allRegistros,set:value=>allRegistros=value}
};
async function loadDataStore(){
  try{
    const stored=JSON.parse(localStorage.getItem(DATA_KEY)||'{}');
    Object.entries(DATA_COLLECTIONS).forEach(([key,accessors])=>{
      if(Array.isArray(stored[key]))accessors.set(stored[key]);
    });
  }catch(error){console.warn('No se pudo cargar el almacenamiento local',error);}
  try{
    const response=await fetch(CFG.apiUrl+'/api/dashboard');
    if(!response.ok)throw new Error('Respuesta API '+response.status);
    const data=await response.json();
    allStudents=(data.students||[]).map(student=>({...student,group:student.group||'Sin grupo'}));
    allGrades=CU&&CU.role==='student'?(data.gradesStudent||[]):(data.gradesTeacher||[]);
    allTasks=(data.tasks||[]).map(t=>({
      id:t.idTarea,title:t.titulo,subject:t.materia||'General',type:t.tipo||'Tarea',
      dueDate:t.fechaEntrega,status:t.estado==='atrasada'?'late':t.estado==='entregada'?'done':'pending',color:t.color
    }));
    allMatriculas=(data.matriculas||[]).map(m=>({id:m.idMatricula,alumnoId:m.idAlumno,nro:'MAT-'+String(m.idMatricula).padStart(4,'0'),nombre:m.nombreAlumno,grupo:m.grupo||'Sin grupo',seccion:m.nombreSeccion||'Sin sección',anio:m.periodoAcademico,fecha:m.fecha,estado:m.estado}));
    allReclamos=(data.reclamos||[]).map(r=>({id:r.idReclamo,asunto:r.motivo,tipo:'academico',prioridad:r.prioridad||'normal',desc:r.descripcion||'',autor:r.nombreAlumno,fecha:r.fecha,estado:r.estado==='en_revision'?'revision':r.estado}));
    allRegistros=[...(data.alumnos||[]).map(a=>({id:'alumno-'+a.idAlumno,nombre:`${a.nombre} ${a.apellido}`.trim(),tipo:'alumno',dni:a.dni,email:a.correo||'',tel:a.telefono||'',fechanac:a.fechaNacimiento||'',sexo:a.sexo||'',direccion:a.direccion||'',fecha:'Base de datos'})),...(data.docentes||[]).map(d=>({id:'docente-'+d.idDocente,nombre:`${d.nombre} ${d.apellido}`.trim(),tipo:'docente',email:d.correo||'',tel:d.telefono||'',fecha:'Base de datos'}))];
    dashboardStats=data.stats||{};
    localStorage.setItem(DATA_KEY,JSON.stringify({allStudents,allGrades,allTasks,allMatriculas,allReclamos,allRegistros}));
  }catch(error){console.warn('No se pudo cargar MySQL; se usa la copia local.',error);}
  updateDataStatus();
}
function saveDataStore(){
  const payload=Object.fromEntries(
    Object.entries(DATA_COLLECTIONS).map(([key,accessors])=>[key,accessors.get()])
  );
  localStorage.setItem(DATA_KEY,JSON.stringify(payload));
  updateDataStatus();
  if(CFG.apiUrl) syncDataWithApi(payload);
}
function updateDataStatus(){
  const status=document.getElementById('data-status');
  const label=document.getElementById('data-status-label');
  if(!status||!label)return;
  const connected=status.dataset.connected==='true';
  status.classList.toggle('api',connected);
  label.textContent=connected?'MySQL local conectado':'Datos locales';
  status.title=connected?'Dashboard conectado a '+CFG.apiUrl:'El dashboard funciona en modo local. Inicia el servidor Node y MySQL para conectar la base de datos.';
}
async function syncDataWithApi(payload){
  try{await fetch(CFG.apiUrl+'/api/salud');}catch(error){console.warn('MySQL local no esta disponible; se conserva la copia local.',error);}
}
async function checkApiConnection(){
  const status=document.getElementById('data-status');
  if(!status||!CFG.apiUrl)return;
  try{
    const response=await fetch(CFG.apiUrl+'/api/salud');
    const data=await response.json();
    status.dataset.connected=String(Boolean(response.ok&&data.mysql));
  }catch(error){
    status.dataset.connected='false';
  }
  updateDataStatus();
}

