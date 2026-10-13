// Variable global para controlar qué herramienta se está editando
let editingToolId = null;

// DIBUJAR LISTA EN EL PANEL ADMIN CON BOTONES DE EDITAR Y ELIMINAR
function renderAdminTools() {
  const list = document.getElementById('adminToolsList');
  if (!list) return;
  list.innerHTML = '';
  const tools = getTools();

  if (tools.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No hay herramientas registradas.</p>';
    return;
  }

  tools.forEach(tool => {
    const item = `
      <div class="admin-item">
        <span><strong>${tool.name}</strong> (${tool.brand || 's/d'})</span>
        <div class="admin-actions-btns">
          <button type="button" class="btn-edit" onclick="startEditTool(${tool.id})">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button type="button" class="btn-delete" onclick="deleteTool(${tool.id})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    list.insertAdjacentHTML('beforeend', item);
  });
}

// ELIMINAR HERRAMIENTA CON MIGRACIÓN DE IDs
window.deleteTool = function(id) {
  if (confirm('¿Seguro que querés eliminar esta herramienta del catálogo?')) {
    let tools = getTools();
    // Se fuerza la comparación numérica/String por seguridad
    tools = tools.filter(t => String(t.id) !== String(id));
    saveTools(tools);
    
    // Si se estaba editando esta herramienta, resetea el formulario
    if (editingToolId === id) {
      resetAdminForm();
    }

    renderAdminTools();
    renderCustomerTools();
  }
};

// CARGAR DATOS EN EL FORMULARIO PARA EDITAR
window.startEditTool = function(id) {
  const tools = getTools();
  const tool = tools.find(t => String(t.id) === String(id));
  if (!tool) return;

  editingToolId = tool.id;

  document.getElementById('toolName').value = tool.name || '';
  document.getElementById('toolBrand').value = tool.brand || '';
  document.getElementById('toolCategory').value = tool.category || 'electricas';
  document.getElementById('dayPrice').value = tool.dayPrice || '';
  document.getElementById('weekPrice').value = tool.weekPrice || '';
  if (document.getElementById('toolImage')) {
    document.getElementById('toolImage').value = tool.image || '';
  }

  // Cambia el texto del botón del formulario
  const submitBtn = document.querySelector('#addToolForm button[type="submit"]');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Guardar Cambios';
  }
};

// LIMPIAR FORMULARIO
function resetAdminForm() {
  editingToolId = null;
  const form = document.getElementById('addToolForm');
  if (form) form.reset();
  const submitBtn = document.querySelector('#addToolForm button[type="submit"]');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Publicar Herramienta';
  }
}

// GUARDAR O ACTUALIZAR HERRAMIENTA
const addToolForm = document.getElementById('addToolForm');
if (addToolForm) {
  addToolForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById('toolImageFile');
    const urlInput = document.getElementById('toolImage');
    let finalImageUrl = urlInput ? urlInput.value.trim() : '';

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      finalImageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
    }

    let tools = getTools();

    if (editingToolId !== null) {
      // MODO EDICIÓN
      tools = tools.map(t => {
        if (String(t.id) === String(editingToolId)) {
          return {
            ...t,
            name: document.getElementById('toolName').value,
            brand: document.getElementById('toolBrand').value,
            category: document.getElementById('toolCategory').value,
            dayPrice: document.getElementById('dayPrice').value,
            weekPrice: document.getElementById('weekPrice').value,
            image: finalImageUrl !== '' ? finalImageUrl : t.image
          };
        }
        return t;
      });
      alert('¡Herramienta actualizada con éxito!');
    } else {
      // MODO CREACIÓN
      tools.push({
        id: Date.now(),
        name: document.getElementById('toolName').value,
        brand: document.getElementById('toolBrand').value,
        category: document.getElementById('toolCategory').value,
        dayPrice: document.getElementById('dayPrice').value,
        weekPrice: document.getElementById('weekPrice').value,
        image: finalImageUrl
      });
      alert('¡Herramienta guardada con éxito!');
    }

    saveTools(tools);
    resetAdminForm();
    renderAdminTools();
    renderCustomerTools();
  });
}