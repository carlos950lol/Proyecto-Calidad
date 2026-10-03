function fillLogin(email, pass, role){
  document.getElementById('login-email').value = email;
  document.getElementById('login-pass').value = pass;
  selectRole(role);
}
function selectRole(r){currentRole=r;document.getElementById('tab-teacher').classList.toggle('active',r==='teacher');document.getElementById('tab-student').classList.toggle('active',r==='student');document.getElementById('tab-jefe').classList.toggle('active',r==='jefe');document.getElementById('tab-registrador').classList.toggle('active',r==='registrador');document.getElementById('login-error').style.display='none';}
function doLogin(){
  const em=document.getElementById('login-email').value.trim();
  const pw=document.getElementById('login-pass').value.trim();
  const err=document.getElementById('login-error');
  if(!em||!pw){err.style.display='block';err.textContent='Ingresa tu correo y contrasena.';return;}
  // Buscar en lista de usuarios registrados
  const match=USUARIOS.find(u=>u.email===em&&u.pass===pw&&u.role===currentRole);
  if(!match){
    err.style.display='block';
    err.textContent='Correo o contrasena incorrectos. Verifica tus credenciales.';
    return;
  }
  CU={...match};
  err.style.display='none';
  showLoadingScreen(function(){ initPortal(); });
}
document.getElementById('login-pass').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});

function doLogout(){CU=null;allStudents=[];allGrades=[];allTasks=[];allMatriculas=[];allReclamos=[];allRegistros=[];['login-screen','portal-screen'].forEach((id,i)=>{document.getElementById(id).classList.toggle('active',i===0);});document.getElementById('login-email').value='';document.getElementById('login-pass').value='';}

async function initPortal(){
  await loadDataStore();
  checkApiConnection();
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('portal-screen').classList.add('active');
  document.getElementById('school-name-login').textContent=CFG.name;
  document.getElementById('school-name-sb').textContent=CFG.name;
  const now=new Date();
  document.getElementById('dash-date').textContent=now.toLocaleDateString('es-MX',{weekday:'long',year:'numeric',month:'long',day:'numeric'}).replace(/^\w/,c=>c.toUpperCase());
  document.getElementById('att-date').value=now.toISOString().split('T')[0];
  applyRoleUI();buildSidebar();buildDashboard();buildSchedule();buildDirectorio();buildProfile();populateSelects();
  showPage('dashboard');
  if(window.innerWidth<=960)document.getElementById('mobile-bar').style.display='flex';
}

function applyRoleUI(){
  const isT=CU.role==='teacher';
  const isS=CU.role==='student';
  const isJ=CU.role==='jefe';
  const isR=CU.role==='registrador';
  const isAdm=isJ||isR;
  const stats=dashboardStats;
  document.querySelectorAll('.teacher-only').forEach(el=>el.style.display=isT?'':'none');
  document.querySelectorAll('.admin-only').forEach(el=>el.style.display=isAdm?'':'none');
  document.querySelectorAll('.jefe-only').forEach(el=>el.style.display=isJ?'':'none');
  document.querySelectorAll('.registrador-only').forEach(el=>el.style.display=isR?'':'none');
  document.getElementById('nlbl-cal').textContent=isT?'Calificaciones':'Mis Calificaciones';
  document.getElementById('nlbl-att').textContent=isT?'Asistencia':'Mi Asistencia';
  document.getElementById('nlbl-tasks').textContent=isT?'Tareas':'Mis Tareas';
  document.getElementById('att-teacher-view').style.display=isT?'block':'none';
  document.getElementById('att-student-view').style.display=(!isT&&isS)?'block':'none';
  document.getElementById('tasks-restrict-notice').style.display=isT?'none':'flex';
  document.getElementById('horario-restrict').style.display=(isS)?'flex':'none';
  document.getElementById('cal-restrict-notice').style.display=isT?'none':'flex';
  document.getElementById('att-pg-title').innerHTML=isT?'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>Control de Asistencia':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>Mi Asistencia';
  document.getElementById('att-pg-sub').textContent=isT?'Registro diario por grupo':'Tu historial de asistencia';
  document.getElementById('tasks-pg-title').innerHTML=isT?'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><polyline points="3 6 4 7 6 5"/><polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/></svg>Tareas y Evaluaciones':'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><polyline points="3 6 4 7 6 5"/><polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/></svg>Mis Tareas';
  document.getElementById('tasks-pg-sub').textContent=isT?'Actividades de tus grupos':'Actividades pendientes y entregadas';
  document.getElementById('cal-title').innerHTML=isT?'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>Calificaciones':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>Mis Calificaciones';
  document.getElementById('cal-sub').textContent=isT?'Registro academico por grupo':'Tu desempeno academico';
  // Nuevas secciones: Sección y Reclamo visibles para teacher y student
  const showSecRec = isT || isS;
  document.getElementById('nav-seccion').style.display = showSecRec ? '' : 'none';
  document.getElementById('nav-reclamo').style.display = showSecRec ? '' : 'none';
  document.getElementById('nav-registro').style.display = isJ ? '' : 'none';
  document.getElementById('nav-matricula').style.display = isAdm ? '' : 'none';
  // Para admin: ocultar nav items de teacher/student que no aplican
  if(isAdm){
    const hideForAdmin=['calificaciones','asistencia','tareas','alumnos','horario'];
    hideForAdmin.forEach(p=>{
      const ni=document.querySelector('.nav-item[data-page="'+p+'"]');
      if(ni) ni.style.display='none';
    });
    // Ocultar separador "Principal" y mostrar separador "Administración"
    document.querySelectorAll('.nav-sec').forEach(s=>{
      if(s.textContent.trim()==='Principal') s.style.display='none';
    });
  } else {
    const showForUser=['calificaciones','asistencia','tareas','horario'];
    showForUser.forEach(p=>{
      const ni=document.querySelector('.nav-item[data-page="'+p+'"]');
      if(ni) ni.style.display='';
    });
    document.querySelectorAll('.nav-sec').forEach(s=>{
      if(s.textContent.trim()==='Principal') s.style.display='';
    });
  }
  // Actualizar texto de sección según rol
  if(isT){
    document.getElementById('seccion-pg-title').innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Mi Sección';
    document.getElementById('seccion-pg-sub').textContent='Tu grupo asignado y alumnos';
    document.getElementById('reclamo-pg-sub').textContent='Reclamos de tus alumnos';
    document.getElementById('reclamo-btn-text').textContent='Ver reclamos';
  } else if(isS){
    document.getElementById('seccion-pg-title').innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Mi Sección';
    document.getElementById('seccion-pg-sub').textContent='Información de tu sección y compañeros';
    document.getElementById('reclamo-pg-sub').textContent='Envía y consulta tus reclamos';
    document.getElementById('reclamo-btn-text').textContent='Nuevo reclamo';
  }
  // Para jefe y registrador, ajustar datos perfil
  if(isAdm){
    document.getElementById('cal-restrict-notice').style.display='flex';
    document.getElementById('att-teacher-view').style.display='none';
    document.getElementById('att-student-view').style.display='none';
  }
}

function buildSidebar(){
  const isT=CU.role==='teacher';
  const avClass = isT?'av-t':(CU.role==='jefe'||CU.role==='registrador')?'av-admin':'av-s';
  document.getElementById('sidebar-user').innerHTML=`<div class="u-av ${avClass}">${CU.initials}</div><div style="min-width:0"><div class="u-name">${CU.name.split(' ').slice(0,2).join(' ')}</div><div class="u-role">${CU.roleLabel}</div></div>`;
}

function buildDashboard(){
  const isT=CU.role==='teacher';
  const isS=CU.role==='student';
  const isJ=CU.role==='jefe';
  const isR=CU.role==='registrador';
  const isAdm=isJ||isR;
  const stats=dashboardStats;
  const nm=CU.name.split(' ')[0]||CU.name;
  document.getElementById('dash-greeting').innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Hola, ${nm}`;
  if(isT){
    document.getElementById('dash-stats').innerHTML=sc('si-blue','ti-users',stats.alumnos??allStudents.length,'Alumnos registrados')+sc('si-green','ti-clipboard-check',(stats.asistencia??0)+'%','Asistencia promedio')+sc('si-amber','ti-checklist',stats.tareas??allTasks.filter(t=>t.status==='pending'||t.status==='late').length,'Tareas por revisar')+sc('si-red','ti-user-x',stats.riesgo??allStudents.filter(s=>s.status==='En riesgo').length,'Alumnos en riesgo');
    document.getElementById('dash-quick').innerHTML=qb('ti-clipboard-list','Calificaciones','calificaciones')+qb('ti-user-check','Asistencia','asistencia')+qb('ti-users','Mis Alumnos','alumnos')+qb('ti-checklist','Tareas','tareas');
    document.getElementById('dash-left').innerHTML='<div class="card"><div class="card-header"><h2><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>Clases de hoy</h2></div><div class="empty-state" style="padding:28px"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg><h3>Sin clases programadas</h3><p>Configura tu horario para ver las clases del dia.</p></div></div>';
    document.getElementById('dash-right').innerHTML='<div class="card"><div class="card-header"><h2><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>Ultimas entregas</h2><button class="btn btn-sm" onclick="showPage(\'tareas\')">Ver todo</button></div><div class="empty-state" style="padding:28px"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg><h3>Sin entregas aun</h3><p>Las entregas de tareas apareceran aqui.</p></div></div>';
  } else if(isS) {
    const studentGrades=allGrades.map(g=>g.e1).filter(v=>v!=null).map(Number);
    const studentAverage=studentGrades.length?Math.round(studentGrades.reduce((a,b)=>a+b,0)/studentGrades.length):0;
    document.getElementById('dash-stats').innerHTML=sc('si-green','ti-award',studentAverage,'Promedio general')+sc('si-blue','ti-checklist',allTasks.filter(t=>t.status==='pending'||t.status==='late').length,'Tareas pendientes')+sc('si-teal','ti-calendar-check',(allStudents.find(s=>s.id===1)?.att??0)+'%','% Asistencia')+sc('si-amber','ti-star','—','Lugar en grupo');
    document.getElementById('dash-quick').innerHTML=qb('ti-clipboard-list','Mis Calificaciones','calificaciones')+qb('ti-user-check','Mi Asistencia','asistencia')+qb('ti-checklist','Mis Tareas','tareas')+qb('ti-calendar-event','Horario','horario');
    document.getElementById('dash-left').innerHTML='<div class="card"><div class="card-header"><h2><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Tareas proximas</h2><button class="btn btn-sm" onclick="showPage(\'tareas\')">Ver todas</button></div><div class="empty-state" style="padding:28px"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><polyline points="3 6 4 7 6 5"/><polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/></svg><h3>Sin tareas pendientes</h3><p>Todo al dia!</p></div></div>';
    document.getElementById('dash-right').innerHTML='<div class="card"><div class="card-header"><h2><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>Mis materias</h2></div><div class="empty-state" style="padding:28px"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg><h3>Sin calificaciones aun</h3><p>Apareceran cuando tu maestro las registre.</p></div></div>';
  }
  // Dashboard para Jefe Académico
  if(isJ){
    document.getElementById('dash-stats').innerHTML=sc('si-blue','ti-users',stats.alumnos??allStudents.length,'Alumnos registrados')+sc('si-green','ti-checklist',allMatriculas.filter(m=>m.estado==='activa').length,'Matrículas activas')+sc('si-amber','ti-clipboard-check',new Set(allStudents.map(s=>s.group)).size,'Secciones activas')+sc('si-red','ti-alert-triangle',allReclamos.filter(r=>r.estado==='pendiente').length,'Reclamos pendientes');
    document.getElementById('dash-quick').innerHTML=qb('ti-users','Registro','registro')+qb('ti-clipboard-list','Matrícula','matricula')+qb('ti-home','Sección','seccion')+qb('ti-message-circle','Reclamos','reclamo');
    document.getElementById('dash-left').innerHTML='<div class="card"><div class="card-header"><h2>Panel Jefe Académico</h2></div><div class="card-pad"><p style="font-size:13px;color:var(--muted);line-height:1.6">Bienvenido al panel de Jefe Académico. Aquí puedes gestionar el <b>Registro</b> de alumnos y personal, administrar las <b>Matrículas</b>, revisar las <b>Secciones</b> y atender los <b>Reclamos</b>.</p><div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap"><button class="btn btn-primary btn-sm" onclick="showPage(\'registro\')">Ir a Registro</button><button class="btn btn-sm" onclick="showPage(\'matricula\')">Ir a Matríccula</button></div></div></div>';
    document.getElementById('dash-right').innerHTML='';
  }
  // Dashboard para Registrador
  if(isR){
    document.getElementById('dash-stats').innerHTML=sc('si-blue','ti-users',stats.alumnos??allStudents.length,'Alumnos matriculados')+sc('si-green','ti-clipboard-check',allMatriculas.length,'Matrículas este mes')+sc('si-amber','ti-checklist',stats.tareas??0,'Pendientes')+sc('si-teal','ti-home',new Set(allStudents.map(s=>s.group)).size,'Secciones');
    document.getElementById('dash-quick').innerHTML=qb('ti-clipboard-list','Matrícula','matricula')+qb('ti-home','Sección','seccion')+qb('ti-message-circle','Reclamos','reclamo')+qb('ti-user','Mi Perfil','perfil');
    document.getElementById('dash-left').innerHTML='<div class="card"><div class="card-header"><h2>Panel Registrador</h2></div><div class="card-pad"><p style="font-size:13px;color:var(--muted);line-height:1.6">Bienvenido al panel de Registrador. Gestiona las <b>Matrículas</b> de alumnos, consulta las <b>Secciones</b> disponibles y atiende los <b>Reclamos</b>.</p><div style="display:flex;gap:10px;margin-top:14px"><button class="btn btn-primary btn-sm" onclick="showPage(\'matricula\')">Ir a Matrícula</button></div></div></div>';
    document.getElementById('dash-right').innerHTML='';
  }
}

const SVGS={
  'ti-users':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  'ti-clipboard-check':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><polyline points="9 12 11 14 15 10"/></svg>',
  'ti-checklist':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><polyline points="3 6 4 7 6 5"/><polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/></svg>',
  'ti-user-x':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="23" y2="14"/><line x1="23" y1="8" x2="17" y2="14"/></svg>',
  'ti-award':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>',
  'ti-star':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  'ti-calendar-check':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>',
  'ti-clipboard-list':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>',
  'ti-user-check':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>',
  'ti-calendar-event':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>',
  'ti-circle-check':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>',
  'ti-circle-x':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  'ti-clock':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  'ti-chart-pie':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',
  'ti-layout-dashboard':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
  'ti-books':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  'ti-inbox':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
};
function svgIcon(name){return SVGS[name]||'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';}
function sc(ic,icon,val,label){return '<div class="stat-card"><div class="stat-icon '+ic+'">'+svgIcon(icon)+'</div><div class="stat-val">'+val+'</div><div class="stat-label">'+label+'</div></div>';}
function qb(icon,label,page){return '<div class="quick-btn" onclick="showPage(\''+page+'\')"><span class="qi">'+svgIcon(icon)+'</span><span class="ql">'+label+'</span></div>';}

function loadAttGroup(){
  const g=document.getElementById('att-group-filter').value;
  const students=allStudents.filter(s=>!g||s.group===g);
  const tb=document.getElementById('att-tbody');
  if(!g){tb.innerHTML='<tr><td colspan="6"><div class="empty-state"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><h3>Selecciona un grupo</h3></div></td></tr>';return;}
  if(!students.length){tb.innerHTML='<tr><td colspan="6"><div class="empty-state"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><h3>Sin alumnos en este grupo</h3></div></td></tr>';return;}
  tb.innerHTML=students.map((s,i)=>'<tr><td>'+(i+1)+'</td><td><div style="display:flex;align-items:center;gap:8px">'+av(s.initials)+'<span class="td-bold">'+s.name+'</span></div></td><td><div class="att-rg"><button class="att-r sel-p" onclick="setAtt(this,\'P\')">P</button><button class="att-r" onclick="setAtt(this,\'A\')">A</button><button class="att-r" onclick="setAtt(this,\'L\')">T</button></div></td><td><div class="bar-wrap"><div class="bar-track"><div class="bar-fill bf-ex" style="width:'+(s.att||95)+'%"></div></div><span>'+(s.att||95)+'%</span></div></td><td>0</td><td><span class="badge b-success">Normal</span></td></tr>').join('');
}
function markAll(v){document.querySelectorAll('#att-tbody .att-rg').forEach(g=>{g.querySelectorAll('.att-r').forEach(b=>b.classList.remove('sel-p','sel-a','sel-l'));const t=g.querySelector('[onclick*="\''+v+'\'"]');if(t)t.classList.add(v==='P'?'sel-p':v==='A'?'sel-a':'sel-l');});}
function setAtt(btn,v){const g=btn.parentElement;g.querySelectorAll('.att-r').forEach(b=>b.classList.remove('sel-p','sel-a','sel-l'));btn.classList.add(v==='P'?'sel-p':v==='A'?'sel-a':'sel-l');}

function buildStudentAttCalendar(){
  const now=new Date();const y=now.getFullYear(),m=now.getMonth();
  const title=now.toLocaleDateString('es-MX',{month:'long',year:'numeric'}).replace(/^\w/,c=>c.toUpperCase());
  document.getElementById('att-cal-title').textContent=title;
  const days=['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];
  const fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),tod=now.getDate();
  let h=days.map(d=>'<div class="att-lbl">'+d+'</div>').join('');
  for(let i=0;i<fd;i++)h+='<div class="att-empty"></div>';
  for(let d=1;d<=dim;d++){const dow=new Date(y,m,d).getDay();if(dow===0||dow===6)h+='<div class="att-day att-h">'+d+'</div>';else if(d>tod)h+='<div class="att-day att-h" style="opacity:.35">'+d+'</div>';else h+='<div class="att-day att-p">'+d+'</div>';}
  document.getElementById('att-calendar').innerHTML=h;
  document.getElementById('att-student-stats').innerHTML=sc('si-green','ti-circle-check',tod,'Dias registrados')+sc('si-red','ti-circle-x','0','Faltas')+sc('si-amber','ti-clock','0','Llegadas tarde')+sc('si-teal','ti-chart-pie','100%','% Asistencia');
}

function renderTasks(){
  const isT=CU.role==='teacher';
  const tasks=taskFilter==='all'?allTasks:allTasks.filter(t=>t.status===taskFilter);
  const el=document.getElementById('tasks-list');
  if(!tasks.length){const msg=taskFilter==='late'?'Sin tareas atrasadas!':taskFilter==='done'?'Sin tareas entregadas.':'Sin tareas registradas.';el.innerHTML='<div class="empty-state"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><polyline points="3 6 4 7 6 5"/><polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/></svg><h3>'+msg+'</h3></div>';return;}
  el.innerHTML=tasks.map(t=>{const done=t.status==='done';
    return '<div class="task-item"><div class="task-check '+(done?'done ':'')+(isT?'editable':'readonly')+'"'+(isT?' onclick="toggleTask(this)"':' title="Solo el maestro puede modificar tareas"')+'>'+(done?'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':'')+'</div><div style="flex:1"><div class="task-title" style="'+(done?'text-decoration:line-through;opacity:.5':'')+'"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:'+(t.color||'var(--accent)')+';margin-right:7px;vertical-align:middle"></span>'+t.title+'</div><div class="task-meta">'+(t.subject||'General')+' - '+(t.type||'Tarea')+'</div></div><span class="task-due '+(t.status==='late'?'due-late':done?'due-ok':'due-soon')+'"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'+t.dueDate+'</span><span class="badge '+(done?'b-success':t.status==='late'?'b-danger':'b-info')+'" style="margin-left:8px">'+(done?'Entregada':t.status==='late'?'Atrasada':'Pendiente')+'</span></div>';
  }).join('');
}
function filterTasks(f,btn){taskFilter=f;document.querySelectorAll('#tasks-tabs .tab-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderTasks();}
function toggleTask(el){el.classList.toggle('done');el.innerHTML=el.classList.contains('done')?'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':'';}

function filterStudents(q){
  const gf=document.getElementById('students-group-filter').value;
  const sf=document.getElementById('students-status-filter').value;
  const f=allStudents.filter(s=>(!q||s.name.toLowerCase().includes(q.toLowerCase()))&&(!gf||s.group===gf)&&(!sf||s.status===sf));
  document.getElementById('students-count').textContent=f.length+' alumno'+(f.length!==1?'s':'');
  const tb=document.getElementById('students-tbody');
  if(!f.length){tb.innerHTML='<tr><td colspan="8"><div class="empty-state"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><h3>Sin resultados</h3></div></td></tr>';return;}
  tb.innerHTML=f.map((s,i)=>{const bc=s.status==='Excelente'?'b-success':s.status==='Bien'?'b-info':s.status==='Regular'?'b-warning':'b-danger';
    return '<tr><td>'+(i+1)+'</td><td><div style="display:flex;align-items:center;gap:8px">'+av(s.initials)+'<span class="td-bold">'+s.name+'</span></div></td><td><span class="badge b-gray">'+s.group+'</span></td><td><div class="bar-wrap"><div class="bar-track"><div class="bar-fill '+getBar(s.avg)+'" style="width:'+(s.avg?s.avg*5:0)+'%"></div></div><b>'+(s.avg??'—')+'</b></div></td><td>'+(s.att??'—')+'%</td><td>'+(s.pending===0?'<span class="badge b-success">Al dia</span>':'<span class="badge b-warning">'+s.pending+' pend.</span>')+'</td><td><span class="badge '+bc+'">'+(s.status||'Sin datos')+'</span></td><td style="font-size:12px;color:var(--info)">'+(s.parentPhone||'—')+'</td></tr>';
  }).join('');
}

function buildSchedule(){
  const times=['07:00','08:30','10:00','11:30','13:00'],days=['Lunes','Martes','Miercoles','Jueves','Viernes'];
  let h='<div class="sch-head"></div>';
  days.forEach(d=>h+='<div class="sch-head">'+d+'</div>');
  times.forEach(t=>{h+='<div class="sch-time">'+t+'</div>';for(let i=0;i<5;i++)h+='<div class="sch-cell sch-empty"></div>';});
  document.getElementById('schedule-grid').innerHTML=h;
}

function buildDirectorio(){
  document.getElementById('directorio').innerHTML=CFG.directorio.map((d,i,a)=>'<div style="display:flex;justify-content:space-between;font-size:13px;padding:7px 0;'+(i<a.length-1?'border-bottom:1px solid var(--border)':'')+'"><span style="color:var(--muted)"><i class="ti '+d.icon+'" style="margin-right:6px"></i>'+d.label+'</span><span style="font-weight:600;color:var(--navy)">'+d.val+'</span></div>').join('');
}

function buildProfile(){
  const isT=CU.role==='teacher';
  document.getElementById('profile-hero-section').innerHTML='<div class="profile-hero"><div class="ph-av '+(isT?'av-t':'av-s')+'">'+CU.initials+'</div><div style="position:relative;z-index:1"><div class="ph-name">'+CU.name+'</div><div class="ph-info">'+CU.roleLabel+(CU.group?' - '+CU.group:'')+'</div><div class="ph-badges"><span class="ph-badge"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'+CU.email+'</span><span class="ph-badge"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>'+CFG.name+'</span></div></div></div>';
  const firstStudent=allStudents.find(s=>s.id===1)||{};
  const fields=isT?[['Nombre completo',CU.name],['Correo',CU.email],['Materia','Programacion y bases de datos'],['Grupos',new Set(allStudents.map(s=>s.group)).size+' secciones'],['Telefono',CU.phone||'No registrado'],['Ingreso','2026']]:[['Nombre completo',CU.name],['Correo',CU.email],['Matricula','MAT-0001'],['Grupo',CU.group||firstStudent.group||'Sin grupo'],['Tutor','Docente asignado'],['Ciclo','2026-II']];
  document.getElementById('profile-info-section').innerHTML=fields.map(([l,v])=>'<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:13px;color:var(--muted)">'+l+'</span><span style="font-size:13px;font-weight:600;color:var(--navy)">'+v+'</span></div>').join('');
  const notifs=[['Nuevos avisos',true],['Calificaciones publicadas',true],['Recordatorio de tareas',true],['Mensajes',false]];
  document.getElementById('notif-settings').innerHTML=notifs.map(([l,on])=>'<div style="display:flex;align-items:center;justify-content:space-between"><span style="font-size:13px;color:var(--navy)">'+l+'</span><div class="toggle '+(on?'on':'off')+'" onclick="this.classList.toggle(\'on\');this.classList.toggle(\'off\')"><div class="t-knob"></div></div></div>').join('');
  document.getElementById('edit-name').value=CU.name;
  document.getElementById('edit-email').value=CU.email;
}
function saveProfile(){const n=document.getElementById('edit-name').value.trim();const e=document.getElementById('edit-email').value.trim();if(n)CU.name=n;if(e)CU.email=e;buildProfile();buildSidebar();closeModal('modal-edit-profile');}

function populateSelects(){
  const opts=CFG.groups.map(g=>'<option value="'+g+'">'+g+'</option>').join('');
  ['grades-group-filter','students-group-filter','att-group-filter','task-group-sel','new-student-group','ag-group'].forEach(id=>{const el=document.getElementById(id);if(!el)return;const base=el.options[0]&&el.options[0].value===''?el.options[0].outerHTML:'';el.innerHTML=base+opts;});
  renderMatriculaAlumnoOptions();
}



function showPage(id){
  // Redirigir admin a dashboard si intenta ver páginas de teacher/student
  if(CU&&(CU.role==='jefe'||CU.role==='registrador')){
    const blocked=['calificaciones','asistencia','tareas','alumnos','horario'];
    if(blocked.includes(id)){id='dashboard';}
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const el=document.getElementById('page-'+id);if(el)el.classList.add('active');
  const ni=document.querySelector('.nav-item[data-page="'+id+'"]');
  if(ni)ni.classList.add('active');else{const d=document.querySelector('.nav-item[data-page="dashboard"]');if(d)d.classList.add('active');}
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('main-content').scrollTop=0;
  if(id==='asistencia'&&CU.role==='student')buildStudentAttCalendar();
  if(id==='calificaciones'){buildGradesHeader();renderGrades(allGrades);}
  if(id==='alumnos')filterStudents('');
  if(id==='tareas')renderTasks();
  if(id==='matricula')renderMatriculaAlumnoOptions();
}
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.modal-overlay').forEach(m=>{m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');});});

function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');}

// ══════════════════════
// LOADING SCREEN
// ══════════════════════
function showLoadingScreen(callback){
  const screen=document.getElementById('loading-screen');
  const bar=document.getElementById('loading-bar');
  const msg=document.getElementById('loading-msg');
  const logoImg=document.getElementById('loading-logo');
  // Set logo src from sidebar logo
  const sidebarLogo=document.querySelector('.sidebar-logo img');
  if(sidebarLogo)logoImg.src=sidebarLogo.src;
  screen.style.display='flex';
  setTimeout(()=>logoImg.style.opacity='1',50);
  const messages=['Verificando credenciales...','Cargando datos...','Preparando tu panel...','Listo!'];
  let pct=0;
  const interval=setInterval(()=>{
    pct+=2;
    bar.style.width=pct+'%';
    if(pct===20)msg.textContent=messages[1];
    if(pct===55)msg.textContent=messages[2];
    if(pct===85)msg.textContent=messages[3];
    if(pct>=100){
      clearInterval(interval);
      setTimeout(()=>{
        screen.style.display='none';
        logoImg.style.opacity='0';
        bar.style.width='0%';
        msg.textContent='Iniciando sesion...';
        callback();
      },400);
    }
  },18);
}

// ══════════════════════
// LOGOUT CONFIRM
// ══════════════════════
function askLogout(){
  document.getElementById('modal-logout').style.display='flex';
}
function cancelLogout(){
  document.getElementById('modal-logout').style.display='none';
}
function confirmLogout(){
  document.getElementById('modal-logout').style.display='none';
  showLogoutScreen();
}
function showLogoutScreen(){
  const screen=document.getElementById('loading-screen');
  const bar=document.getElementById('loading-bar');
  const msg=document.getElementById('loading-msg');
  const logoImg=document.getElementById('loading-logo');
  const sidebarLogo=document.querySelector('.sidebar-logo img');
  if(sidebarLogo)logoImg.src=sidebarLogo.src;
  screen.style.display='flex';
  setTimeout(()=>logoImg.style.opacity='1',50);
  msg.textContent='Cerrando sesion...';
  let pct=0;
  const interval=setInterval(()=>{
    pct+=4;
    bar.style.width=pct+'%';
    if(pct>=100){
      clearInterval(interval);
      setTimeout(()=>{
        screen.style.display='none';
        logoImg.style.opacity='0';
        bar.style.width='0%';
        msg.textContent='Iniciando sesion...';
        doLogout();
      },300);
    }
  },15);
}
