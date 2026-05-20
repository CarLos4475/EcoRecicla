const API = '/api';

const POINTS_PER = {
  plastico: 5, vidrio: 4, papel: 3, metal: 8, organico: 2, electronico: 20
};

let currentUser = null;
let adminToken = null;

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data.error || 'Error del servidor');
    return data;
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error(`Respuesta inválida del servidor (${res.status})`);
    }
    throw e;
  }
}

/* ---- Tabs ---- */
function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
  document.getElementById(`panel-${tabId}`).classList.add('active');
}

function switchAdminTab(tabId) {
  document.querySelectorAll('.admin__tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin__panel').forEach(p => p.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById(`admin-panel-${tabId}`).classList.add('active');
}

/* ---- Material selector label ---- */
document.addEventListener('DOMContentLoaded', function () {
  const sel = document.getElementById('reg-material');
  if (sel) {
    sel.addEventListener('change', function () {
      const label = document.getElementById('reg-cantidad-label');
      label.textContent = this.value === 'electronico' ? 'Cantidad (piezas)' : 'Cantidad (gramos)';
    });
  }
  loadInitialData();
});

/* ---- Load initial data ---- */
async function loadInitialData() {
  try {
    const [rewards, gps, metrics] = await Promise.all([
      api('/recompensas'),
      api('/puntos_verdes'),
      api('/admin/metrics'),
    ]);
    renderRewards(rewards);
    renderGreenPoints(gps);
    renderMetrics(metrics);
  } catch (e) {
    console.warn('Error cargando datos iniciales:', e);
  }
}

/* ---- Register Delivery ---- */
async function registerDelivery() {
  const email = document.getElementById('reg-email').value;
  const material = document.getElementById('reg-material').value;
  const cantidad = parseFloat(document.getElementById('reg-cantidad').value);
  const puntoId = document.getElementById('reg-punto').value;
  const result = document.getElementById('points-result');

  if (!email || !material || !cantidad || cantidad <= 0 || !puntoId) {
    showToast('Completa todos los campos correctamente', 'error');
    return;
  }

  try {
    const user = await api(`/usuarios?email=${encodeURIComponent(email)}`);
    const pts = material === 'electronico'
      ? cantidad * POINTS_PER[material]
      : Math.floor(cantidad / 100) * POINTS_PER[material];

    await api('/entregas', {
      method: 'POST',
      body: JSON.stringify({
        usuario_id: user.id,
        punto_verde_id: parseInt(puntoId),
        material_tipo: material,
        cantidad: cantidad,
      }),
    });

    result.textContent = `+${pts} ecopuntos estimados — Entrega registrada`;
    result.classList.add('show');
    showToast(`Entrega registrada: +${pts} ecopuntos`, 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

/* ---- Consult Points ---- */
async function consultPoints() {
  const email = document.getElementById('cons-email').value;
  const result = document.getElementById('consult-result');

  if (!email) {
    showToast('Ingresa un email', 'error');
    return;
  }

  try {
    const user = await api(`/usuarios?email=${encodeURIComponent(email)}`);
    currentUser = user;
    result.innerHTML = `<strong>${user.nombre} ${user.apellido}</strong><br>
      Ecopuntos: <strong>${user.ecopuntos}</strong><br>
      KG reciclados: ${user.kg_reciclados}<br>
      CO₂ evitado: ${user.co2_evitado} kg`;
    result.classList.add('show');
    document.getElementById('user-balance').textContent = user.ecopuntos;
    showToast(`Puntos encontrados: ${user.ecopuntos}`, 'success');
  } catch (e) {
    result.innerHTML = 'No se encontró una cuenta con ese email.';
    result.classList.add('show');
    showToast('Cuenta no encontrada', 'error');
  }
}

/* ---- History ---- */
async function showHistory() {
  const email = document.getElementById('hist-email').value;
  const container = document.getElementById('history-content');

  if (!email) {
    showToast('Ingresa un email', 'error');
    return;
  }

  try {
    const user = await api(`/usuarios?email=${encodeURIComponent(email)}`);
    const deliveries = await api(`/entregas?usuario_id=${user.id}`);

    if (deliveries.length === 0) {
      container.innerHTML = '<p style="color:var(--muted);">Sin entregas registradas.</p>';
      return;
    }

    const materialLabels = { plastico: 'Plástico', vidrio: 'Vidrio', papel: 'Papel', metal: 'Metal', organico: 'Orgánico', electronico: 'Electrónico' };
    let html = `<table class="history-table"><thead><tr><th>Fecha</th><th>Material</th><th>Cantidad</th><th>Puntos</th><th>Estado</th></tr></thead><tbody>`;
    deliveries.forEach(d => {
      html += `<tr>
        <td>${d.fecha}</td>
        <td>${materialLabels[d.material_tipo]}</td>
        <td>${d.material_tipo === 'electronico' ? d.cantidad + ' pzas' : d.cantidad + 'g'}</td>
        <td>${d.puntos_otorgados}</td>
        <td><span class="status-badge status-badge--${d.estado}">${d.estado}</span></td>
      </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
    showToast(`${deliveries.length} entregas encontradas`, 'success');
  } catch (e) {
    container.innerHTML = '<p style="color:var(--muted);">No se encontró una cuenta con ese email.</p>';
    showToast('Cuenta no encontrada', 'error');
  }
}

/* ---- Render Rewards ---- */
function renderRewards(rewards) {
  const grid = document.getElementById('rewards-grid');
  if (!grid) return;

  const categoryClass = {
    alimentos: 'tag--green',
    transporte: 'tag--teal',
    ambiental: 'tag--amber',
    descuento: 'tag--teal',
  };
  const categoryLabel = {
    alimentos: 'ALIMENTOS',
    transporte: 'TRANSPORTE',
    ambiental: 'AMBIENTAL',
    descuento: 'DESCUENTO',
  };
  const btnClass = {
    alimentos: 'btn--primary',
    transporte: 'btn--teal',
    ambiental: 'btn--dark',
    descuento: 'btn--teal',
  };

  grid.innerHTML = rewards.map(r => `
    <div class="reward-card">
      <span class="tag ${categoryClass[r.categoria] || 'tag--green'}">${categoryLabel[r.categoria] || r.categoria.toUpperCase()}</span>
      <div class="reward-card__cost">${r.costo_puntos} pts</div>
      <div class="reward-card__name">${r.nombre}</div>
      <div class="reward-card__cat">${r.descripcion || ''}</div>
      <button class="btn ${btnClass[r.categoria] || 'btn--primary'}" style="margin-top:var(--space-sm);font-size:0.6rem;padding:0.5em 1em;" onclick="redeemReward(${r.id}, '${r.nombre}', ${r.costo_puntos})">Canjear</button>
    </div>
  `).join('');
}

/* ---- Render Green Points ---- */
function renderGreenPoints(puntos) {
  const list = document.getElementById('gp-list');
  if (!list) return;

  list.innerHTML = puntos.map(gp => {
    const estadoClass = gp.estado === 'activo' ? 'tag--green' : gp.estado === 'mantenimiento' ? 'tag--amber' : 'tag--amber';
    return `<div class="gp-item">
      <div class="gp-item__name">${gp.nombre}</div>
      <div class="gp-item__addr">${gp.direccion}, Del. ${gp.delegacion}</div>
      <div class="gp-item__meta">
        <span class="tag ${estadoClass}">${gp.horario}</span>
        ${gp.acepta_electronicos ? '<span class="tag tag--teal">Electrónicos</span>' : ''}
        ${gp.estado === 'mantenimiento' ? '<span class="tag tag--amber">Mantenimiento</span>' : ''}
      </div>
    </div>`;
  }).join('');
}

/* ---- Redeem ---- */
async function redeemReward(id, name, cost) {
  if (!currentUser) {
    showToast('Primero consulta tu saldo en la pestaña "Consultar puntos"', 'info');
    return;
  }

  try {
    const result = await api('/canjes', {
      method: 'POST',
      body: JSON.stringify({
        usuario_id: currentUser.id,
        recompensa_id: id,
      }),
    });
    currentUser.ecopuntos = result.saldo_restante;
    document.getElementById('user-balance').textContent = result.saldo_restante;
    showToast(`¡Canjeado! ${name} — Código: ${result.codigo_canje}`, 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

/* ---- Admin Login ---- */
async function adminLogin() {
  const user = document.getElementById('admin-user').value;
  const pass = document.getElementById('admin-pass').value;

  try {
    const result = await api('/auth', {
      method: 'POST',
      body: JSON.stringify({ user, pass }),
    });
    adminToken = result.token;
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-dashboard').classList.add('show');
    await loadAdminData();
    showToast('Bienvenido, administrador', 'success');
  } catch (e) {
    showToast('Credenciales incorrectas', 'error');
  }
}

/* ---- Admin Data ---- */
async function loadAdminData() {
  try {
    const [users, gps, deliveries, metrics] = await Promise.all([
      api('/usuarios'),
      api('/puntos_verdes'),
      api('/entregas'),
      api('/admin/metrics'),
    ]);
    renderAdminUsers(users);
    renderAdminGreenPoints(gps);
    renderAdminDeliveries(deliveries, users);
    renderMetrics(metrics);
  } catch (e) {
    showToast('Error cargando datos del admin', 'error');
  }
}

function renderMetrics(metrics) {
  document.getElementById('metric-users').textContent = metrics.usuarios.toLocaleString();
  document.getElementById('metric-points').textContent = metrics.puntos_verdes;
  document.getElementById('metric-deliveries').textContent = metrics.entregas.toLocaleString();
  document.getElementById('metric-tons').textContent = metrics.toneladas + ' T';
}

function renderAdminUsers(users) {
  const body = document.getElementById('admin-users-body');
  body.innerHTML = users.map(u => `
    <tr>
      <td>${u.nombre} ${u.apellido}</td>
      <td>${u.email}</td>
      <td>${u.delegacion}</td>
      <td>${u.ecopuntos}</td>
      <td>${u.kg_reciclados}</td>
      <td class="admin__actions">
        <button class="edit-btn" onclick="editUser(${u.id})">Editar</button>
        <button class="del-btn" onclick="deleteUser(${u.id})">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

/* ---- Admin CRUD Users ---- */
async function addUser() {
  const nombre = document.getElementById('new-user-name').value;
  const apellido = document.getElementById('new-user-lastname').value;
  const email = document.getElementById('new-user-email').value;
  const delegacion = document.getElementById('new-user-delegacion').value;

  if (!nombre || !apellido || !email || !delegacion) {
    showToast('Completa todos los campos', 'error');
    return;
  }

  try {
    await api('/usuarios', {
      method: 'POST',
      body: JSON.stringify({ nombre, apellido, email, password: 'eco2024', delegacion }),
    });
    const users = await api('/usuarios');
    renderAdminUsers(users);
    showToast(`Usuario ${nombre} ${apellido} agregado`, 'success');
    document.getElementById('new-user-name').value = '';
    document.getElementById('new-user-lastname').value = '';
    document.getElementById('new-user-email').value = '';
    document.getElementById('new-user-delegacion').value = '';
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function editUser(id) {
  const newPoints = prompt('Nuevos ecopuntos:');
  if (newPoints !== null && !isNaN(newPoints)) {
    try {
      await api(`/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ecopuntos: parseInt(newPoints) }),
      });
      const users = await api('/usuarios');
      renderAdminUsers(users);
      showToast('Puntos actualizados', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  }
}

async function deleteUser(id) {
  if (!confirm('¿Eliminar este usuario?')) return;
  try {
    await api(`/usuarios/${id}`, { method: 'DELETE' });
    const users = await api('/usuarios');
    renderAdminUsers(users);
    showToast('Usuario eliminado', 'info');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

/* ---- Admin CRUD Green Points ---- */
function renderAdminGreenPoints(gps) {
  const body = document.getElementById('admin-gp-body');
  body.innerHTML = gps.map(gp => {
    const badgeClass = gp.estado === 'activo' ? 'acreditado' : gp.estado === 'mantenimiento' ? 'pendiente' : 'rechazado';
    return `<tr>
      <td>${gp.nombre}</td>
      <td>${gp.direccion}</td>
      <td>${gp.delegacion}</td>
      <td>${gp.horario}</td>
      <td><span class="status-badge status-badge--${badgeClass}">${gp.estado}</span></td>
      <td class="admin__actions">
        <button class="edit-btn" onclick="editGreenPoint(${gp.id})">Editar</button>
        <button class="del-btn" onclick="deleteGreenPoint(${gp.id})">Eliminar</button>
      </td>
    </tr>`;
  }).join('');
}

async function addGreenPoint() {
  const nombre = document.getElementById('new-gp-name').value;
  const direccion = document.getElementById('new-gp-addr').value;
  const delegacion = document.getElementById('new-gp-delegacion').value;
  const horario = document.getElementById('new-gp-hours').value;

  if (!nombre || !direccion || !delegacion || !horario) {
    showToast('Completa todos los campos', 'error');
    return;
  }

  try {
    await api('/puntos_verdes', {
      method: 'POST',
      body: JSON.stringify({ nombre, direccion, delegacion, horario }),
    });
    const gps = await api('/puntos_verdes');
    renderAdminGreenPoints(gps);
    showToast(`Punto verde ${nombre} agregado`, 'success');
    document.getElementById('new-gp-name').value = '';
    document.getElementById('new-gp-addr').value = '';
    document.getElementById('new-gp-delegacion').value = '';
    document.getElementById('new-gp-hours').value = '';
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function editGreenPoint(id) {
  const newEstado = prompt('Nuevo estado (activo/mantenimiento/cerrado):');
  if (newEstado && ['activo', 'mantenimiento', 'cerrado'].includes(newEstado)) {
    try {
      await api(`/puntos_verdes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: newEstado }),
      });
      const gps = await api('/puntos_verdes');
      renderAdminGreenPoints(gps);
      showToast('Estado actualizado', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  }
}

async function deleteGreenPoint(id) {
  if (!confirm('¿Eliminar este punto verde?')) return;
  try {
    await api(`/puntos_verdes/${id}`, { method: 'DELETE' });
    const gps = await api('/puntos_verdes');
    renderAdminGreenPoints(gps);
    showToast('Punto verde eliminado', 'info');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

/* ---- Admin CRUD Deliveries ---- */
function renderAdminDeliveries(deliveries, users) {
  const body = document.getElementById('admin-deliveries-body');
  const materialLabels = { plastico: 'Plástico', vidrio: 'Vidrio', papel: 'Papel', metal: 'Metal', organico: 'Orgánico', electronico: 'Electrónico' };

  body.innerHTML = deliveries.map(d => {
    const user = users.find(u => u.id === d.usuario_id);
    return `<tr>
      <td>${d.id}</td>
      <td>${user ? user.nombre + ' ' + user.apellido : '—'}</td>
      <td>${materialLabels[d.material_tipo]}</td>
      <td>${d.material_tipo === 'electronico' ? d.cantidad + ' pzas' : d.cantidad + 'g'}</td>
      <td>${d.puntos_otorgados}</td>
      <td>${d.fecha}</td>
      <td><span class="status-badge status-badge--${d.estado}">${d.estado}</span></td>
      <td class="admin__actions">
        <button class="edit-btn" onclick="updateDeliveryStatus(${d.id})">Actualizar</button>
      </td>
    </tr>`;
  }).join('');
}

async function updateDeliveryStatus(id) {
  const newStatus = prompt('Nuevo estado (pendiente/acreditado/rechazado):');
  if (newStatus && ['pendiente', 'acreditado', 'rechazado'].includes(newStatus)) {
    try {
      await api(`/entregas/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: newStatus }),
      });
      const [deliveries, users] = await Promise.all([
        api('/entregas'),
        api('/usuarios'),
      ]);
      renderAdminDeliveries(deliveries, users);
      showToast(`Entrega #${id} actualizada`, 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  }
}

/* ---- Export CSV ---- */
async function exportCSV(type) {
  try {
    const res = await fetch(`${API}/admin/export/${type}`);
    if (!res.ok) throw new Error('Error al exportar');
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ecorecicla-${type}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast(`${type} exportado como CSV`, 'success');
  } catch (e) {
    showToast('Error al exportar', 'error');
  }
}

/* ---- Register ---- */
function openRegister() {
  document.getElementById('register-overlay').classList.add('open');
}

function closeRegister() {
  document.getElementById('register-overlay').classList.remove('open');
}

function closeRegisterOutside(e) {
  if (e.target === document.getElementById('register-overlay')) closeRegister();
}

async function registerUser() {
  const nombre = document.getElementById('reg-name').value;
  const apellido = document.getElementById('reg-lastname').value;
  const email = document.getElementById('reg-email-reg').value;
  const password = document.getElementById('reg-password').value;
  const delegacion = document.getElementById('reg-delegacion').value;

  if (!nombre || !apellido || !email || !password || !delegacion) {
    showToast('Completa todos los campos', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('La contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }

  try {
    await api('/usuarios', {
      method: 'POST',
      body: JSON.stringify({ nombre, apellido, email, password, delegacion }),
    });
    showToast(`Cuenta creada: ${nombre}, ya puedes consultar tus puntos`, 'success');
    closeRegister();
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-lastname').value = '';
    document.getElementById('reg-email-reg').value = '';
    document.getElementById('reg-password').value = '';
    document.getElementById('reg-delegacion').value = '';
  } catch (e) {
    showToast(e.message, 'error');
  }
}

/* ---- Search ---- */
const searchIndex = [
  { text: 'Registrar entrega de reciclaje', section: '#consultas' },
  { text: 'Consultar ecopuntos y saldo', section: '#consultas' },
  { text: 'Historial de entregas', section: '#consultas' },
  { text: 'Canjear recompensas — Café gratis', section: '#consultas' },
  { text: 'Canjear descuento Metrobús', section: '#consultas' },
  { text: 'Canjear kit de compostaje', section: '#consultas' },
  { text: 'Punto verde Coyoacán — Av. Universidad', section: '#puntos-verdes' },
  { text: 'Punto verde Del Valle — Insurgentes Sur', section: '#puntos-verdes' },
  { text: 'Punto verde Polanco — Av. Homero', section: '#puntos-verdes' },
  { text: 'Punto verde Xochimilco — Calz. de las Flores', section: '#puntos-verdes' },
  { text: 'Plástico PET — 5 puntos por 100g', section: '#materiales' },
  { text: 'Vidrio — 4 puntos por 100g', section: '#materiales' },
  { text: 'Papel y cartón — 3 puntos por 100g', section: '#materiales' },
  { text: 'Metal — 8 puntos por 100g', section: '#materiales' },
  { text: 'Orgánicos — 2 puntos por 100g', section: '#materiales' },
  { text: 'Electrónicos RAEE — 20 puntos por pieza', section: '#materiales' },
  { text: 'Panel de administración', section: '#admin' },
  { text: 'Cómo funciona el sistema de ecopuntos', section: '#como-funciona' },
  { text: 'Promoción doble puntos en electrónicos', section: '#novedades' },
  { text: 'Evento de reciclaje Xochimilco junio', section: '#novedades' },
];

function openSearch() {
  document.getElementById('search-overlay').classList.add('open');
  setTimeout(() => document.getElementById('search-input').focus(), 100);
}

function closeSearch() {
  document.getElementById('search-overlay').classList.remove('open');
  document.getElementById('search-input').value = '';
  document.getElementById('search-results').innerHTML = '<div class="search-box__empty">Escribe para buscar en el sitio</div>';
}

function closeSearchOutside(e) {
  if (e.target === document.getElementById('search-overlay')) closeSearch();
}

function performSearch(query) {
  const container = document.getElementById('search-results');
  if (!query || query.length < 2) {
    container.innerHTML = '<div class="search-box__empty">Escribe para buscar en el sitio</div>';
    return;
  }

  const q = query.toLowerCase();
  const results = searchIndex.filter(item => item.text.toLowerCase().includes(q));

  if (results.length === 0) {
    container.innerHTML = '<div class="search-box__empty">Sin resultados para "' + query + '"</div>';
    return;
  }

  container.innerHTML = results.map(r => {
    const highlighted = r.text.replace(new RegExp(`(${query})`, 'gi'), '<mark>$1</mark>');
    return `<div class="search-box__result" onclick="navigateToResult('${r.section}')">
      <svg class="search-box__result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="m8 12 3 3 5-5"/></svg>
      <span class="search-box__result-text">${highlighted}</span>
    </div>`;
  }).join('');
}

function navigateToResult(section) {
  closeSearch();
  const el = document.querySelector(section);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('keydown', function (e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  if (e.key === 'Escape') closeSearch();
});

/* ---- Toast ---- */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => { toast.classList.add('show'); });
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

/* ---- Mobile Menu ---- */
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const hamburger = document.getElementById('hamburger');
  menu.classList.toggle('open');
  const isOpen = menu.classList.contains('open');
  hamburger.children[0].style.transform = isOpen ? 'rotate(45deg) translate(4px, 4px)' : '';
  hamburger.children[1].style.opacity = isOpen ? '0' : '1';
  hamburger.children[2].style.transform = isOpen ? 'rotate(-45deg) translate(4px, -4px)' : '';
}

function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const hamburger = document.getElementById('hamburger');
  menu.classList.remove('open');
  hamburger.children[0].style.transform = '';
  hamburger.children[1].style.opacity = '';
  hamburger.children[2].style.transform = '';
}

/* ---- Scroll Animations ---- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

/* ---- Nav Scroll Effect ---- */
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 20);
});

/* ---- Counter Animation ---- */
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const isDecimal = target % 1 !== 0;
    const duration = 1500;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;

      if (isDecimal) {
        el.textContent = prefix + current.toFixed(1) + suffix;
      } else {
        el.textContent = prefix + Math.floor(current).toLocaleString() + suffix;
      }

      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

const heroObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounters();
      heroObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

const heroStats = document.querySelector('.hero__stats');
if (heroStats) heroObserver.observe(heroStats);
