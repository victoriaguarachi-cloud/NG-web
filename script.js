/* ==========================================================================
   NG ALQUILERES - LÓGICA DE INTERACCIÓN Y NUBE CON FIREBASE FIRESTORE
   ========================================================================== */

// IMPORTAR MÓDULOS OFICIALES DE FIREBASE (v10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ⚠️ REEMPLAZÁ ESTOS DATOS CON TU CONFIGURACIÓN REAL DE FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyBLhju5q_ObCh91zixYRxBCJ8445N56dk8",
  authDomain: "ng-web-30e6d.firebaseapp.com",
  projectId: "ng-web-30e6d",
  storageBucket: "ng-web-30e6d.firebasestorage.app",
  messagingSenderId: "485316063976",
  appId: "1:485316063976:web:67f50d6a94269f0d71cf5d",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const toolsCollection = collection(db, "herramientas");

let editingToolId = null;
const defaultImage = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';

// --------------------------------------------------------------------------
// 1. SINCRONIZACIÓN EN TIEMPO REAL CON LA NUBE
// --------------------------------------------------------------------------

// Escuchar cambios en la base de datos en tiempo real
let currentCategory = 'todos';
let cachedTools = [];

onSnapshot(toolsCollection, (snapshot) => {
  cachedTools = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  renderCustomerTools(currentCategory);
  renderAdminTools();
});

// DIBUJAR CATÁLOGO PÚBLICO (INDEX.HTML)
function renderCustomerTools(category = 'todos') {
  currentCategory = category;
  const grid = document.getElementById('toolsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const filtered = category === 'todos' 
    ? cachedTools 
    : cachedTools.filter(t => t.category === category);

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="text-align:center; color:var(--text-muted); grid-column:1/-1;">No hay herramientas disponibles en esta categoría.</p>';
    return;
  }

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
          <a href="https://wa.me/5492254615250?text=${msg}" target="_blank" rel="noopener" class="btn btn-whatsapp" style="margin-top:auto;">
            <i class="fa-brands fa-whatsapp"></i> Consultar por WhatsApp
          </a>
        </div>
      </article>
    `;
    grid.insertAdjacentHTML('beforeend', card);
  });
}

// DIBUJAR LISTA DE GESTIÓN (ADMIN.HTML)
function renderAdminTools() {
  const list = document.getElementById('adminToolsList');
  if (!list) return;
  list.innerHTML = '';

  if (cachedTools.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No hay herramientas en la base de datos.</p>';
    return;
  }

  cachedTools.forEach(tool => {
    const item = `
      <div class="admin-item">
        <span><strong>${tool.name}</strong> (${tool.brand || 's/d'})</span>
        <div class="admin-actions-btns">
          <button type="button" class="btn-edit" onclick="startEditTool('${tool.id}')">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button type="button" class="btn-delete" onclick="deleteTool('${tool.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    list.insertAdjacentHTML('beforeend', item);
  });
}

// --------------------------------------------------------------------------
// 2. FUNCIONES DE ADMINISTRACIÓN
// --------------------------------------------------------------------------

window.startEditTool = function(id) {
  const tool = cachedTools.find(t => t.id === id);
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

window.deleteTool = async function(id) {
  if (confirm('¿Seguro que querés eliminar esta herramienta del catálogo global?')) {
    try {
      await deleteDoc(doc(db, "herramientas", id));
      if (editingToolId === id) resetAdminForm();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
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

// GUARDAR / ACTUALIZAR EN FIRESTORE
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

    const payload = {
      name: document.getElementById('toolName').value,
      brand: document.getElementById('toolBrand').value,
      category: document.getElementById('toolCategory').value,
      updatedAt: new Date().toISOString()
    };

    if (finalImageUrl !== '') {
      payload.image = finalImageUrl;
    }

    try {
      if (editingToolId !== null) {
        await updateDoc(doc(db, "herramientas", editingToolId), payload);
        alert('¡Herramienta actualizada en la nube!');
      } else {
        payload.createdAt = new Date().toISOString();
        if (!payload.image) payload.image = defaultImage;
        await addDoc(toolsCollection, payload);
        alert('¡Herramienta publicada exitosamente en todo internet!');
      }
      resetAdminForm();
    } catch (err) {
      alert('Error al guardar en la nube: ' + err.message);
    }
  });
}

// --------------------------------------------------------------------------
// 3. EVENTOS DE INTERFAZ Y NAVEGACIÓN
// --------------------------------------------------------------------------

// LOGIN DE ADMIN
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