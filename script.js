/* ==========================================================================
   NG ALQUILERES - LÓGICA DE INTERACCIÓN, CATÁLOGO Y PANEL ADMIN
   ========================================================================== */

// Variable global para controlar qué herramienta se está editando
let editingToolId = null;

// Imagen por defecto si la foto falla o está vacía
const defaultImage = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';

// Productos iniciales por defecto
const initialTools = [
  { id: 1, name: "Rotomartillo SDS Max 1500W", brand: "Bosch GBH 5-40 DCE", category: "electricas", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80", dayPrice: "$12.000", weekPrice: "$60.000" },
  { id: 2, name: "Cuerpo de Andamio Estándar", brand: "Tubular Profesional", category: "andamios", image: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80", dayPrice: "$3.500", weekPrice: "$17.500" },
  { id: 3, name: "Hormigonera 130 Litros", brand: "DeMisa 3/4 HP", category: "maquinaria", image: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=800&q=80", dayPrice: "$10.000", weekPrice: "$50.000" }
];

// Obtener herramientas desde localStorage
function getTools() {
  const stored = localStorage.getItem('ng_tools');
  if (!stored) {
    localStorage.setItem('ng_tools', JSON.stringify(initialTools));
    return initialTools;
  }
  return JSON.parse(stored);
}

// Guardar herramientas en localStorage
function saveTools(tools) {
  localStorage.setItem('ng_tools', JSON.stringify(tools));
}

// RENDERIZAR VISTA PÚBLICA DE CLIENTES
function renderCustomerTools(category = 'todos') {
  const grid = document.getElementById('toolsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const tools = getTools();
  const filtered = category === 'todos' ? tools : tools.filter(t => t.category === category);

  filtered.forEach(tool => {
    const msg = encodeURIComponent(`Hola NG Alquileres, quisiera consultar por: ${tool.name} (${tool.brand || 's/d'})`);
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
          <div class="tool-pricing">
            <div class="price-item"><span class="price-label">Por Día</span><span class="price-value">${tool.dayPrice}</span></div>
            <div class="price-item"><span class="price-label">Por Semana</span><span class="price-value">${tool.weekPrice}</span></div>
          </div>
          <a href="https://wa.me/5492254615250?text=${msg}" target="_blank" rel="noopener" class="btn btn-whatsapp">
            <i class="fa-brands fa-whatsapp"></i> Consultar por WhatsApp
          </a>
        </div>
      </article>
    `;
    grid.insertAdjacentHTML('beforeend', card);
  });
}

// RENDERIZAR LISTA EN PANEL ADMINISTRADOR
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

// CARGAR DATOS EN FORMULARIO PARA EDITAR
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
  
  const urlInput = document.getElementById('toolImage');
  if (urlInput) {
    urlInput.value = tool.image && !tool.image.startsWith('data:') ? tool.image : '';
  }

  const submitBtn = document.querySelector('#addToolForm button[type="submit"]');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Guardar Cambios';
  }
};

// ELIMINAR HERRAMIENTA
window.deleteTool = function(id) {
  if (confirm('¿Seguro que querés eliminar esta herramienta del catálogo?')) {
    let tools = getTools();
    tools = tools.filter(t => String(t.id) !== String(id));
    saveTools(tools);
    
    if (editingToolId === id) {
      resetAdminForm();
    }

    renderAdminTools();
    renderCustomerTools();
  }
};

// LIMPIAR FORMULARIO DE ADMIN
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

// GUARDAR O ACTUALIZAR HERRAMIENTA (SUBMIT FORM)
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
            dayPrice: document.getElementById('dayPrice').value,
            weekPrice: document.getElementById('weekPrice').value,
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

// --------------------------------------------------------------------------
// EVENTOS GLOBALES DE LA INTERFAZ
// --------------------------------------------------------------------------

// 1. MODO OSCURO / CLARO
const themeBtn = document.getElementById('themeToggleBtn');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    themeBtn.innerHTML = newTheme === 'light' 
      ? '<i class="fa-solid fa-sun"></i>' 
      : '<i class="fa-solid fa-moon"></i>';
  });
}

// 2. MENÚ DESPLEGABLE EN CELULARES
const mobileBtn = document.getElementById('mobileMenuBtn');
if (mobileBtn) {
  mobileBtn.addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('active');
  });
}

// 3. FILTROS DE CATEGORÍAS
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    renderCustomerTools(e.target.getAttribute('data-category'));
  });
});

// 4. TRIPLE CLIC SECRETO SOBRE EL LOGO (PIN: 1234)
let clickCount = 0;
let clickTimer;
const logoTrigger = document.getElementById('secretLogoTrigger');

if (logoTrigger) {
  logoTrigger.addEventListener('click', () => {
    clickCount++;
    clearTimeout(clickTimer);

    if (clickCount === 3) {
      clickCount = 0;
      const pin = prompt('Ingrese la clave de administrador:');
      if (pin === '1234') {
        renderAdminTools();
        document.getElementById('adminModal').classList.add('active');
      } else if (pin !== null) {
        alert('Clave incorrecta');
      }
    } else {
      clickTimer = setTimeout(() => {
        clickCount = 0;
      }, 500); // 500ms ventana de tiempo para los 3 clics
    }
  });
}

// 5. CERRAR MODAL
const closeBtn = document.getElementById('closeModalBtn');
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    resetAdminForm();
    document.getElementById('adminModal').classList.remove('active');
  });
}

// 6. CARGA INICIAL
document.addEventListener('DOMContentLoaded', () => {
  renderCustomerTools();
});