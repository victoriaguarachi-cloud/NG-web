/* ==========================================================================
   NG ALQUILERES - LÓGICA DE INTERACCIÓN Y CATÁLOGO INFORMATIVO (SIN PRECIOS)
   ========================================================================== */

let editingToolId = null;
const defaultImage = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';

const initialTools = [
  { id: 1, name: "Rotomartillo SDS Max 1500W", brand: "Bosch GBH 5-40 DCE", category: "electricas", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80" },
  { id: 2, name: "Cuerpo de Andamio Estándar", brand: "Tubular Profesional", category: "andamios", image: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80" },
  { id: 3, name: "Hormigonera 130 Litros", brand: "DeMisa 3/4 HP", category: "maquinaria", image: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=800&q=80" }
];

function getTools() {
  const stored = localStorage.getItem('ng_tools');
  if (!stored) {
    localStorage.setItem('ng_tools', JSON.stringify(initialTools));
    return initialTools;
  }
  return JSON.parse(stored);
}

function saveTools(tools) {
  localStorage.setItem('ng_tools', JSON.stringify(tools));
}

// --------------------------------------------------------------------------
// 1. DIBUJAR CATÁLOGO PÚBLICO (INDEX.HTML)
// --------------------------------------------------------------------------
function renderCustomerTools(category = 'todos') {
  const grid = document.getElementById('toolsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const tools = getTools();
  const filtered = category === 'todos' ? tools : tools.filter(t => t.category === category);

  filtered.forEach(tool => {
    const msg = encodeURIComponent(`Hola NG Alquileres, quisiera consultar disponibilidad por: ${tool.name} (${tool.brand || 's/d'})`);
    const imgSrc = tool.image && tool.image.trim() !== '' ? tool.image : defaultImage;

    const card = `
      <article class="tool-card">
        <div class="tool-image-wrapper">
          <img src="${imgSrc}" 
               alt="${tool.name}" 
               class="tool-image" 
               loading="lazy" 
               onerror="this.onerror=null; this.src='${defaultImage}';">
          <span class="tool-status">Disponible</span>
        </div>
        <div class="tool-content">
          <span class="tool-category">${tool.category}</span>
          <h3 class="tool-title">${tool.name}</h3>
          <p class="tool-model">Marca / Modelo: ${tool.brand || 's/d'}</p>
          <a href="https://wa.me/5492254585601?text=${msg}" target="_blank" rel="noopener" class="btn btn-whatsapp" style="margin-top:auto;">
            <i class="fa-brands fa-whatsapp"></i> Consultar por WhatsApp
          </a>
        </div>
      </article>
    `;
    grid.insertAdjacentHTML('beforeend', card);
  });
}

// --------------------------------------------------------------------------
// 2. DIBUJAR PANEL DE GESTIÓN (ADMIN.HTML)
// --------------------------------------------------------------------------
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

window.startEditTool = function(id) {
  const tools = getTools();
  const tool = tools.find(t => String(t.id) === String(id));
  if (!tool) return;

  editingToolId = tool.id;

  document.getElementById('toolName').value = tool.name || '';
  document.getElementById('toolBrand').value = tool.brand || '';
  document.getElementById('toolCategory').value = tool.category || 'electricas';
  
  const urlInput = document.getElementById('toolImage');
  if (urlInput) {
    urlInput.value = tool.image && !tool.image.startsWith('data:') ? tool.image : '';
  }

  const submitBtn = document.querySelector('#addToolForm button[type="submit"]');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Guardar Cambios';
  }
};

window.deleteTool = function(id) {
  if (confirm('¿Seguro que querés eliminar esta herramienta del catálogo?')) {
    let tools = getTools();
    tools = tools.filter(t => String(t.id) !== String(id));
    saveTools(tools);
    
    if (editingToolId === id) {
      resetAdminForm();
    }

    renderAdminTools();
  }
};

function resetAdminForm() {
  editingToolId = null;
  const form = document.getElementById('addToolForm');
  if (form) form.reset();
  
  const fileInput = document.getElementById('toolImageFile');
  if (fileInput) fileInput.value = '';

  const submitBtn = document.querySelector('#addToolForm button[type="submit"]');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Publicar Herramienta';
  }
}

// SUBMIT FORMULARIO ADMIN
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
      tools = tools.map(t => {
        if (String(t.id) === String(editingToolId)) {
          return {
            ...t,
            name: document.getElementById('toolName').value,
            brand: document.getElementById('toolBrand').value,
            category: document.getElementById('toolCategory').value,
            image: finalImageUrl !== '' ? finalImageUrl : t.image
          };
        }
        return t;
      });
      alert('¡Herramienta actualizada con éxito!');
    } else {
      tools.push({
        id: Date.now(),
        name: document.getElementById('toolName').value,
        brand: document.getElementById('toolBrand').value,
        category: document.getElementById('toolCategory').value,
        image: finalImageUrl
      });
      alert('¡Herramienta guardada con éxito!');
    }

    saveTools(tools);
    resetAdminForm();
    renderAdminTools();
  });
}

// --------------------------------------------------------------------------
// 3. EVENTOS GLOBALES
// --------------------------------------------------------------------------

// LOGIN PARA ADMIN.HTML
const loginAdminBtn = document.getElementById('loginAdminBtn');
if (loginAdminBtn) {
  loginAdminBtn.addEventListener('click', () => {
    const pin = document.getElementById('adminPinInput').value;
    if (pin === '1234') {
      document.getElementById('authBox').classList.add('hidden');
      document.getElementById('adminMainContent').classList.remove('hidden');
      renderAdminTools();
    } else {
      alert('PIN incorrecto. Intentá nuevamente.');
    }
  });
}

// MODO OSCURO
const themeBtn = document.getElementById('themeToggleBtn');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeBtn.innerHTML = newTheme === 'light' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  });
}

// MENÚ CELULAR
const mobileBtn = document.getElementById('mobileMenuBtn');
if (mobileBtn) {
  mobileBtn.addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('active');
  });
}

// FILTROS
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    renderCustomerTools(e.target.getAttribute('data-category'));
  });
});

// INICIALIZAR
document.addEventListener('DOMContentLoaded', () => {
  renderCustomerTools();
});