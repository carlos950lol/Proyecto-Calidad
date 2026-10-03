// ========================
// FUNCIONES NUEVAS PÁGINAS
// ========================
function saveMatricula(){
  const nombre = document.getElementById('mat-nombre').value.trim();
  const seccion = document.getElementById('mat-seccion').value;
  if(!nombre || !seccion){alert('Completa los campos obligatorios (*)');return;}
  const mat = {
    id: Date.now(),
    nro: 'MAT-' + String(allMatriculas.length+1).padStart(4,'0'),
    nombre,
    dni: document.getElementById('mat-dni').value.trim(),
    seccion,
    anio: document.getElementById('mat-anio').value||'2025',
    apoderado: document.getElementById('mat-apoderado').value.trim(),
    obs: document.getElementById('mat-obs').value.trim(),
    fecha: new Date().toLocaleDateString('es-PE'),
    estado: 'activa'
  };
  allMatriculas.push(mat);
  saveDataStore();
  renderMatriculas();
  closeModal('modal-new-matricula');
  ['mat-nombre','mat-dni','mat-apoderado','mat-obs'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('mat-seccion').value='';
}
// Opciones de grado según nivel (Primaria 1-6, Secundaria 1-5)
function updateGradoOptions(nivelId, gradoId){
  const nivel = document.getElementById(nivelId)?.value;
  const gradoSel = document.getElementById(gradoId);
  if(!gradoSel) return;
  if(!nivel){
    gradoSel.innerHTML = '<option value="">Selecciona nivel primero</option>';
    gradoSel.disabled = true;
    return;
  }
  const max = nivel === 'Primaria' ? 6 : 5;
  let opts = '<option value="">Seleccionar...</option>';
  for(let i=1;i<=max;i++){ opts += `<option value="${i}">${i}°</option>`; }
  gradoSel.innerHTML = opts;
  gradoSel.disabled = false;
}

function bloquearCamposAlumnoMatricula(bloquear = true){
  const campos = [
    'ci-mat-nombre','ci-mat-dni','ci-mat-fechanac','ci-mat-sexo','ci-mat-procedencia',
    'ci-mat-direccion','ci-mat-apoderado','ci-mat-apo-dni','ci-mat-apo-tel','ci-mat-apo-email','ci-mat-obs'
  ];
  campos.forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.disabled = bloquear;
    if(bloquear){
      el.style.background = 'var(--input-disabled, #f8fafc)';
    } else {
      el.style.background = '';
    }
  });
}

function renderMatriculaAlumnoOptions(filtro = ''){
  const select = document.getElementById('ci-mat-alumno-registrado');
  const busqueda = document.getElementById('ci-mat-buscar-alumno');
  const sugerencias = document.getElementById('ci-mat-alumno-sugerencias');
  if(!select) return;
  const texto = (filtro || busqueda?.value || '').toLowerCase().trim();
  const alumnos = allRegistros.filter(r => r.tipo === 'alumno').sort((a,b) => a.nombre.localeCompare(b.nombre));
  const filtrados = texto
    ? alumnos.filter(alumno => {
        const nombre = (alumno.nombre || '').toLowerCase();
        const dni = (alumno.dni || '').toLowerCase();
        return nombre.includes(texto) || dni.includes(texto);
      })
    : alumnos;

  if(sugerencias){
    if(!texto || !filtrados.length){
      sugerencias.style.display = 'none';
      sugerencias.innerHTML = '';
    } else {
      sugerencias.style.display = 'block';
      sugerencias.innerHTML = filtrados.slice(0, 8).map(alumno => {
        const label = alumno.dni ? `${alumno.dni} - ${alumno.nombre}` : alumno.nombre;
        return `<button type="button" data-alumno-id="${String(alumno.id)}" onclick="seleccionarAlumnoMatricula('${String(alumno.id)}')" style="display:block;width:100%;text-align:left;padding:9px 10px;border:0;background:transparent;color:#0f172a;cursor:pointer;border-radius:8px;font-size:13px;line-height:1.3;transition:all .15s ease;">${label}</button>`;
      }).join('');
      const buttons = sugerencias.querySelectorAll('button');
      buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
          button.style.background = 'rgba(79, 70, 229, 0.08)';
          button.style.color = '#312e81';
        });
        button.addEventListener('mouseleave', () => {
          button.style.background = 'transparent';
          button.style.color = '#0f172a';
        });
      });
    }
  }

  if(!filtrados.length){
    select.innerHTML = '<option value="">No hay coincidencias</option>';
    select.disabled = true;
    bloquearCamposAlumnoMatricula(true);
    return;
  }
  select.innerHTML = '<option value="">Seleccionar alumno existente...</option>' + filtrados.map(alumno => {
    const label = alumno.dni ? `${alumno.dni} - ${alumno.nombre}` : alumno.nombre;
    return `<option value="${String(alumno.id)}">${label}</option>`;
  }).join('');
  select.disabled = false;
  bloquearCamposAlumnoMatricula(true);
}

function seleccionarAlumnoMatricula(id){
  const select = document.getElementById('ci-mat-alumno-registrado');
  const busqueda = document.getElementById('ci-mat-buscar-alumno');
  const sugerencias = document.getElementById('ci-mat-alumno-sugerencias');
  if(!select || !busqueda) return;
  const alumno = allRegistros.find(r => String(r.id) === String(id) && r.tipo === 'alumno');
  if(!alumno) return;
  select.value = String(id);
  busqueda.value = alumno.nombre || '';
  if(sugerencias){
    sugerencias.style.display = 'none';
    sugerencias.innerHTML = '';
  }
  cargarAlumnoMatriculaSeleccionado();
}

function filtrarAlumnosMatricula(){
  const valor = document.getElementById('ci-mat-buscar-alumno')?.value || '';
  renderMatriculaAlumnoOptions(valor);
}

function cargarAlumnoMatriculaSeleccionado(){
  const select = document.getElementById('ci-mat-alumno-registrado');
  if(!select) return;
  if(!select.value){
    bloquearCamposAlumnoMatricula(true);
    return;
  }

  const alumno = allRegistros.find(r => String(r.id) === String(select.value) && r.tipo === 'alumno');
  if(!alumno) return;

  const campos = {
    'ci-mat-nombre': alumno.nombre || '',
    'ci-mat-dni': alumno.dni || '',
    'ci-mat-fechanac': alumno.fechanac || '',
    'ci-mat-sexo': alumno.sexo || '',
    'ci-mat-procedencia': alumno.procedencia || 'nuevo',
    'ci-mat-direccion': alumno.direccion || '',
    'ci-mat-apoderado': alumno.apoderado || '',
    'ci-mat-apo-dni': alumno.apoDni || '',
    'ci-mat-apo-tel': alumno.apoTel || '',
    'ci-mat-apo-email': alumno.apoEmail || '',
    'ci-mat-obs': alumno.obs || ''
  };

  Object.entries(campos).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if(!el) return;
    el.value = value;
  });

  bloquearCamposAlumnoMatricula(true);
}

function resetMatriculaAlumno(){
  ['ci-mat-buscar-alumno','ci-mat-nombre','ci-mat-dni','ci-mat-fechanac','ci-mat-direccion','ci-mat-apoderado','ci-mat-apo-dni','ci-mat-apo-tel','ci-mat-apo-email','ci-mat-obs','ci-mat-sexo','ci-mat-procedencia','ci-mat-alumno-registrado'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const sugerencias = document.getElementById('ci-mat-alumno-sugerencias');
  if(sugerencias){
    sugerencias.style.display = 'none';
    sugerencias.innerHTML = '';
  }
  bloquearCamposAlumnoMatricula(true);
  renderMatriculaAlumnoOptions();
  showMatriculaStep(1);
}

function showMatriculaStep(step){
  if(step === 2){
    const alumno = document.getElementById('ci-mat-alumno-registrado')?.value;
    const nivel = document.getElementById('ci-mat-nivel')?.value;
    const grado = document.getElementById('ci-mat-grado')?.value;
    const seccion = document.getElementById('ci-mat-seccion')?.value;
    if(!alumno || !nivel || !grado || !seccion){
      alert('Completa el alumno, nivel, grado y sección antes de continuar.');
      return;
    }
  }

  const steps = ['matricula-step-1','matricula-step-2'];
  steps.forEach((id, index) => {
    const el = document.getElementById(id);
    if(!el) return;
    el.style.display = index === (step - 1) ? 'block' : 'none';
  });

  const buttons = document.querySelectorAll('#page-matricula .matricula-step-nav');
  buttons.forEach(btn => {
    const buttonStep = Number(btn.dataset.step);
    btn.classList.toggle('is-active', buttonStep === step);
    btn.classList.toggle('is-complete', buttonStep < step);
  });

  if(step === 2){
    const select = document.getElementById('ci-mat-alumno-registrado');
    const alumno = select && select.value ? allRegistros.find(r => String(r.id) === String(select.value) && r.tipo === 'alumno') : null;
    const nivel = document.getElementById('ci-mat-nivel')?.value || '—';
    const grado = document.getElementById('ci-mat-grado')?.value || '—';
    const seccion = document.getElementById('ci-mat-seccion')?.value || '—';
    const anio = document.getElementById('ci-mat-anio')?.value || '—';
    const turno = document.getElementById('ci-mat-turno')?.value || '—';
    const resumen = document.getElementById('matricula-resumen-content');
    if(resumen){
      resumen.innerHTML = `<div style="display:grid;gap:10px">
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Alumno</span><span style="font-size:13px;font-weight:600;color:var(--navy)">${alumno ? alumno.nombre : 'No seleccionado'}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">DNI</span><span style="font-size:13px;color:var(--navy)">${alumno ? (alumno.dni || '—') : '—'}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Nivel</span><span style="font-size:13px;color:var(--navy)">${nivel}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Grado</span><span style="font-size:13px;color:var(--navy)">${grado}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Sección</span><span style="font-size:13px;color:var(--navy)">${seccion}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Año lectivo</span><span style="font-size:13px;color:var(--navy)">${anio}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0"><span style="font-size:12px;color:var(--muted)">Turno</span><span style="font-size:13px;color:var(--navy)">${turno}</span></div>
      </div>`;
    }
  }
}
// Formulario inline CI_Matricula
function submitMatriculaForm(){
  const select = document.getElementById('ci-mat-alumno-registrado');
  const alumnoSeleccionado = select && select.value ? allRegistros.find(r => String(r.id) === String(select.value) && r.tipo === 'alumno') : null;
  if(!alumnoSeleccionado){
    alert('Debes seleccionar un alumno ya registrado. No se permite registrar uno nuevo desde matrícula.');
    return;
  }

  const nombre = alumnoSeleccionado.nombre || '';
  const dni = alumnoSeleccionado.dni || '';
  const nivel = document.getElementById('ci-mat-nivel')?.value;
  const grado = document.getElementById('ci-mat-grado')?.value;
  const seccionLetra = document.getElementById('ci-mat-seccion')?.value;
  if(!nombre || !nivel || !grado || !seccionLetra){alert('Debe seleccionar el alumno, el nivel, el grado y la sección.');return;}

  const seccion = nivel.charAt(0) + grado + '°' + seccionLetra;
  const mat = {
    id: Date.now(),
    alumnoId: alumnoSeleccionado.id,
    nro: 'MAT-' + String(allMatriculas.length+1).padStart(4,'0'),
    nombre,
    dni,
    fechanac: alumnoSeleccionado.fechanac || '',
    sexo: alumnoSeleccionado.sexo || '',
    procedencia: alumnoSeleccionado.procedencia || 'nuevo',
    direccion: alumnoSeleccionado.direccion || '',
    nivel,
    grado,
    seccionLetra,
    seccion,
    anio: document.getElementById('ci-mat-anio')?.value||'2026',
    turno: document.getElementById('ci-mat-turno')?.value||'Mañana',
    apoderado: alumnoSeleccionado.apoderado || '',
    apoDni: alumnoSeleccionado.apoDni || '',
    apoTel: alumnoSeleccionado.apoTel || '',
    apoEmail: alumnoSeleccionado.apoEmail || '',
    obs: alumnoSeleccionado.obs || '',
    fecha: new Date().toLocaleDateString('es-PE'),
    estado: 'activa'
  };
  allMatriculas.push(mat);
  renderMatriculas();
  updateMatriculaCount();
  resetMatriculaAlumno();
  updateGradoOptions('ci-mat-nivel','ci-mat-grado');
  showDtMatricula(mat);
}
function showDtMatricula(mat){
  const el = document.getElementById('dt-matricula-detalle');
  if(!el) return;
  const estadoBadge = e=>({activa:'b-green',pendiente:'b-amber',anulada:'b-red'}[e]||'b-gray');
  const procLabel = p=>({nuevo:'Alumno nuevo',traslado:'Traslado',promocion:'Promoción interna'}[p]||p||'—');
  const sexoLabel = s=>({M:'Masculino',F:'Femenino'}[s]||'—');
  el.innerHTML=`<div style="display:grid;gap:10px">
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">N° Matrícula</span><span style="font-size:13px;font-weight:700;color:var(--accent)">${mat.nro}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Alumno</span><span style="font-size:13px;font-weight:600;color:var(--navy)">${mat.nombre}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">DNI</span><span style="font-size:13px;color:var(--navy)">${mat.dni||'—'}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Fecha de nacimiento</span><span style="font-size:13px;color:var(--navy)">${mat.fechanac||'—'}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Sexo</span><span style="font-size:13px;color:var(--navy)">${sexoLabel(mat.sexo)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Procedencia</span><span style="font-size:13px;color:var(--navy)">${procLabel(mat.procedencia)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Dirección</span><span style="font-size:13px;color:var(--navy);text-align:right;max-width:60%">${mat.direccion||'—'}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Nivel</span><span style="font-size:13px;color:var(--navy)">${mat.nivel||'—'}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Sección</span><span class="badge b-gray">${mat.seccion}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Año lectivo</span><span style="font-size:13px;color:var(--navy)">${mat.anio}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Turno</span><span style="font-size:13px;color:var(--navy)">${mat.turno||'—'}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Apoderado</span><span style="font-size:13px;color:var(--navy)">${mat.apoderado||'—'}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">DNI apoderado</span><span style="font-size:13px;color:var(--navy)">${mat.apoDni||'—'}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Teléfono apoderado</span><span style="font-size:13px;color:var(--navy)">${mat.apoTel||'—'}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Correo apoderado</span><span style="font-size:13px;color:var(--navy)">${mat.apoEmail||'—'}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0"><span style="font-size:12px;color:var(--muted)">Estado</span><span class="badge ${estadoBadge(mat.estado)}">${mat.estado.charAt(0).toUpperCase()+mat.estado.slice(1)}</span></div>
    ${mat.obs?`<div style="padding:8px;background:var(--cream);border-radius:var(--r);font-size:12px;color:var(--muted)">${mat.obs}</div>`:''}
  </div><div style="margin-top:10px;padding:8px 12px;background:#f0fdf4;border-radius:var(--r);font-size:12px;color:#16a34a">✓ Matrícula registrada el ${mat.fecha}</div>`;
}
function updateMatriculaCount(){
  const el = document.getElementById('matricula-count');
  if(el) el.textContent = allMatriculas.length+' matrículas';
}

function renderMatriculas(){
  const tbody = document.getElementById('matricula-tbody');
  const f = document.getElementById('matricula-filter-estado')?.value||'all';
  const q = (document.getElementById('matricula-search')?.value||'').toLowerCase();
  let data = allMatriculas.filter(m=>(f==='all'||m.estado===f)&&(!q||(m.nombre+m.seccion).toLowerCase().includes(q)));
  if(!data.length){
    tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">No hay matrículas que coincidan.</td></tr>';
    return;
  }
  const estadoBadge = e=>({activa:'b-green',pendiente:'b-amber',anulada:'b-red'}[e]||'b-gray');
  tbody.innerHTML=data.map(m=>`<tr style="border-bottom:1px solid var(--border)">
    <td style="padding:10px 16px;font-size:12px;color:var(--muted);white-space:nowrap">${m.nro}</td>
    <td style="padding:10px 16px;font-size:13px;font-weight:500;color:var(--navy)">${m.nombre}</td>
    <td style="padding:10px 16px;font-size:13px"><span class="badge b-gray">${m.seccion}</span></td>
    <td style="padding:10px 16px;font-size:13px;color:var(--muted)">${m.anio}</td>
    <td style="padding:10px 16px;font-size:13px;color:var(--muted);white-space:nowrap">${m.fecha}</td>
    <td style="padding:10px 16px"><span class="badge ${estadoBadge(m.estado)}" onclick="toggleMatriculaEstado(${m.id})" style="cursor:pointer" title="Cambiar estado">${m.estado.charAt(0).toUpperCase()+m.estado.slice(1)}</span></td>
    <td style="padding:10px 16px">
      <button class="btn btn-sm" onclick="showDtMatricula(allMatriculas.find(x=>x.id===${m.id}))" title="Ver detalle">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        Ver
      </button>
        saveDataStore();
    </td>
  </tr>`).join('');
  updateMatriculaCount();
        saveDataStore();
}

function toggleMatriculaEstado(id){
  const matricula = allMatriculas.find(item=>item.id===id);
  if(!matricula) return;
  const estados = ['activa','pendiente','anulada'];
  matricula.estado = estados[(estados.indexOf(matricula.estado)+1)%estados.length];
  saveDataStore();
  renderMatriculas();
}

function filterMatriculas(){ renderMatriculas(); }

function saveRegistro(){
  const nombre = document.getElementById('reg-nombre').value.trim();
  if(!nombre){alert('El nombre es obligatorio');return;}
  const reg = {
    id: Date.now(),
    nombre,
    tipo: document.getElementById('reg-tipo').value,
    dni: document.getElementById('reg-dni').value.trim(),
    email: document.getElementById('reg-email').value.trim(),
    tel: document.getElementById('reg-tel').value.trim(),
    fecha: new Date().toLocaleDateString('es-PE')
  };
  allRegistros.push(reg);
  renderRegistro();
  renderMatriculaAlumnoOptions();
  closeModal('modal-new-registro');
  ['reg-nombre','reg-dni','reg-email','reg-tel'].forEach(id=>document.getElementById(id).value='');
}
// Función para el formulario inline de CI_Registro
function toggleRegistroAlumnoFields(){
  const tipo = document.getElementById('ci-reg-tipo').value;
  const isAlumno = tipo === 'alumno';
  ['ci-reg-sexo-wrap','ci-reg-seccion-wrap','ci-reg-direccion-wrap','ci-reg-apoderado-wrap','ci-reg-fechanac-wrap'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.style.display = isAlumno ? '' : 'none';
  });
}
function submitRegistroForm(){
  const nombre = document.getElementById('ci-reg-nombre').value.trim();
  if(!nombre){alert('El nombre es obligatorio');return;}
  const tipo = document.getElementById('ci-reg-tipo').value;
  const nivel = document.getElementById('ci-reg-nivel')?.value||'';
  const gradoNum = document.getElementById('ci-reg-grado')?.value||'';
  const seccionLetra = document.getElementById('ci-reg-seccionletra')?.value||'';
  const seccion = (nivel&&gradoNum&&seccionLetra) ? (nivel.charAt(0)+gradoNum+'°'+seccionLetra) : '';
  const reg = {
    id: Date.now(),
    nombre,
    tipo,
    dni: document.getElementById('ci-reg-dni').value.trim(),
    fechanac: document.getElementById('ci-reg-fechanac')?.value||'',
    sexo: document.getElementById('ci-reg-sexo')?.value||'',
    nivel,
    grado: gradoNum,
    seccionLetra,
    seccion,
    direccion: document.getElementById('ci-reg-direccion')?.value.trim()||'',
    email: document.getElementById('ci-reg-email').value.trim(),
    tel: document.getElementById('ci-reg-tel').value.trim(),
    apoderado: document.getElementById('ci-reg-apoderado')?.value.trim()||'',
    apoTel: document.getElementById('ci-reg-apo-tel')?.value.trim()||'',
    fecha: new Date().toLocaleDateString('es-PE')
  };
  allRegistros.push(reg);
  renderRegistro();
  renderMatriculaAlumnoOptions();
  updateRegistroCount();
  ['ci-reg-nombre','ci-reg-dni','ci-reg-fechanac','ci-reg-direccion','ci-reg-email','ci-reg-tel','ci-reg-apoderado','ci-reg-apo-tel'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  ['ci-reg-sexo','ci-reg-nivel','ci-reg-seccionletra'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  updateGradoOptions('ci-reg-nivel','ci-reg-grado');
  // Mostrar detalle del registro recién creado
  showDtRegistro(reg);
}
function showDtRegistro(reg){
  const el = document.getElementById('dt-registro-detalle');
  if(!el) return;
  const tipoBadge = t=>({alumno:'b-blue',docente:'b-green',administrativo:'b-amber'}[t]||'b-gray');
  const sexoLabel = s=>({M:'Masculino',F:'Femenino'}[s]||'—');
  const isAlumno = reg.tipo === 'alumno';
  el.innerHTML=`<div style="display:grid;gap:10px">
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Nombre</span><span style="font-size:13px;font-weight:600;color:var(--navy)">${reg.nombre}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Tipo</span><span class="badge ${tipoBadge(reg.tipo)}">${reg.tipo.charAt(0).toUpperCase()+reg.tipo.slice(1)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">DNI</span><span style="font-size:13px;color:var(--navy)">${reg.dni||'—'}</span></div>
    ${isAlumno?`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Fecha de nacimiento</span><span style="font-size:13px;color:var(--navy)">${reg.fechanac||'—'}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Sexo</span><span style="font-size:13px;color:var(--navy)">${sexoLabel(reg.sexo)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Sección</span><span class="badge b-gray">${reg.seccion||'—'}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Dirección</span><span style="font-size:13px;color:var(--navy);text-align:right;max-width:60%">${reg.direccion||'—'}</span></div>`:''}
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Correo</span><span style="font-size:13px;color:var(--navy)">${reg.email||'—'}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0${isAlumno?';border-bottom:1px solid var(--border)':''}"><span style="font-size:12px;color:var(--muted)">Teléfono</span><span style="font-size:13px;color:var(--navy)">${reg.tel||'—'}</span></div>
    ${isAlumno?`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">Apoderado</span><span style="font-size:13px;color:var(--navy)">${reg.apoderado||'—'}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0"><span style="font-size:12px;color:var(--muted)">Tel. apoderado</span><span style="font-size:13px;color:var(--navy)">${reg.apoTel||'—'}</span></div>`:''}
  </div><div style="margin-top:10px;padding:8px 12px;background:var(--accent-light);border-radius:var(--r);font-size:12px;color:var(--accent)">✓ Registro guardado el ${reg.fecha}</div>`;
}
function updateRegistroCount(){
  const el = document.getElementById('registro-count');
  if(el) el.textContent = allRegistros.length+' registros';
}

function renderRegistro(){
  const el = document.getElementById('registro-list');
  const q = (document.getElementById('registro-search')?.value||'').toLowerCase();
  let data = allRegistros.filter(r=>!q||r.nombre.toLowerCase().includes(q)||r.tipo.toLowerCase().includes(q));
  if(!data.length){
    el.innerHTML='<div class="empty-state"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><p>No hay registros que coincidan.</p></div>';
    return;
  }
  const tipoBadge = t=>({alumno:'b-blue',docente:'b-green',administrativo:'b-amber'}[t]||'b-gray');
  el.innerHTML=data.map(r=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="showDtRegistro(allRegistros.find(x=>x.id===${r.id}))">
    <div><div style="font-size:13px;font-weight:500;color:var(--navy)">${r.nombre}</div><div style="font-size:12px;color:var(--muted)">${r.email||r.tel||r.dni||'—'}</div></div>
    <div style="display:flex;align-items:center;gap:8px"><span class="badge ${tipoBadge(r.tipo)}">${r.tipo.charAt(0).toUpperCase()+r.tipo.slice(1)}</span><span style="font-size:11px;color:var(--muted)">${r.fecha}</span></div>
  </div>`).join('');
  updateRegistroCount();
}

function filterRegistro(){ renderRegistro(); }

function saveReclamo(){
  const asunto = document.getElementById('rec-asunto').value.trim();
  const desc = document.getElementById('rec-desc').value.trim();
  if(!asunto||!desc){alert('Completa los campos obligatorios');return;}
  const rec = {
    id: Date.now(),
    asunto,
    tipo: document.getElementById('rec-tipo').value,
    prioridad: document.getElementById('rec-prioridad').value,
    desc,
    autor: CU.name,
    fecha: new Date().toLocaleDateString('es-PE'),
    estado: 'pendiente'
  };
  allReclamos.push(rec);
  saveDataStore();
  renderReclamos();
  closeModal('modal-new-reclamo');
  document.getElementById('rec-asunto').value='';
  document.getElementById('rec-desc').value='';
}

function renderReclamos(){
  const el = document.getElementById('reclamo-list');
  const f = document.getElementById('reclamo-filter')?.value||'all';
  let data = allReclamos.filter(r=>f==='all'||r.estado===f);
  if(!data.length){
    el.innerHTML='<div class="empty-state"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><p>No hay reclamos. Usa el botón para agregar uno.</p></div>';
    return;
  }
  const est = e=>({pendiente:'b-amber',revision:'b-blue',resuelto:'b-green'}[e]||'b-gray');
  const pri = p=>({normal:'',alta:'color:var(--danger)',urgente:'color:var(--danger);font-weight:700'}[p]||'');
  el.innerHTML=data.map(r=>`<div style="padding:14px;border:1px solid var(--border);border-radius:var(--r);margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:6px">
      <div style="font-size:13px;font-weight:600;color:var(--navy)">${r.asunto}</div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <span class="badge ${est(r.estado)}">${r.estado.charAt(0).toUpperCase()+r.estado.slice(1)}</span>
        <button class="btn btn-sm" onclick="advanceReclamo(${r.id})">→</button>
      </div>
    </div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:6px">${r.desc.substring(0,120)}${r.desc.length>120?'...':''}</div>
    <div style="display:flex;gap:12px;font-size:11px;color:var(--muted)">
      <span>${r.tipo.charAt(0).toUpperCase()+r.tipo.slice(1)}</span>
      <span style="${pri(r.prioridad)}">⚡ ${r.prioridad.charAt(0).toUpperCase()+r.prioridad.slice(1)}</span>
      <span>${r.autor} · ${r.fecha}</span>
    </div>
  </div>`).join('');
}

function advanceReclamo(id){
  const r = allReclamos.find(x=>x.id===id);
  if(!r) return;
  const estados=['pendiente','revision','resuelto'];
  r.estado = estados[(estados.indexOf(r.estado)+1)%estados.length];
  saveDataStore();
  renderReclamos();
}

function filterReclamos(){ renderReclamos(); }

function saveSeccionEdit(){
  const aula = document.getElementById('edit-sec-aula').value.trim();
  const turno = document.getElementById('edit-sec-turno').value;
  if(aula) document.getElementById('sec-aula').textContent=aula;
  document.getElementById('sec-turno').textContent=turno;
  closeModal('modal-edit-seccion');
}

function buildSeccion(){
  // Actualizar datos de sección basados en el usuario actual
  if(CU.role==='teacher'){
    document.getElementById('sec-tutor').textContent=CU.name;
    document.getElementById('sec-grado').textContent='6-A';
    document.getElementById('sec-total').textContent=allStudents.length+' alumnos';
    // Listar alumnos
    const el = document.getElementById('seccion-alumnos-list');
    if(allStudents.length){
      el.innerHTML=allStudents.map(s=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)"><div class="u-av av-s" style="width:32px;height:32px;font-size:11px;flex-shrink:0">${s.initials||s.name.charAt(0)}</div><div><div style="font-size:13px;font-weight:500;color:var(--navy)">${s.name}</div><div style="font-size:12px;color:var(--muted)">${s.group||'Sin grupo'}</div></div></div>`).join('');
    }
  } else if(CU.role==='student'){
    document.getElementById('sec-grado').textContent=CU.group||'6-A';
    document.getElementById('sec-total').textContent='—';
  }
}

