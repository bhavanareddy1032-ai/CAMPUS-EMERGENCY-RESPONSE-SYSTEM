// -------------------------------------------------------------
// Campus Emergency Response System (CERS) Front-End Engine
// -------------------------------------------------------------

const DEFAULT_CONTACTS = [
  { id: 1, title: 'Campus Security Control Room', phone: '+91 98765 43210', location: 'Gate 1 Admin Block', available: '24/7' },
  { id: 2, title: 'Campus Medical Centre / Ambulance', phone: '+91 98765 43211', location: 'Health Centre Block D', available: '24/7' },
  { id: 3, title: "Women's Safety & Anti-Harassment Cell", phone: '+91 98765 43212', location: 'Dean Office Room 104', available: '24/7' },
  { id: 4, title: 'Chief Hostel Warden', phone: '+91 98765 43213', location: 'Hostel Block A Office', available: '6:00 AM - 11:00 PM' },
  { id: 5, title: 'Campus Fire & Disaster Squad', phone: '+91 98765 43214', location: 'Main Utility Gate 3', available: '24/7' }
];

const DEFAULT_ALERTS = [
  {
    id: 101,
    type: 'Medical Emergency',
    priority: 'HIGH',
    location: 'Central Library 2nd Floor',
    description: 'Student experiencing severe dizziness and fainting near reading table 12.',
    studentName: 'Rahul Verma',
    studentPhone: '+91 98451 23456',
    status: 'DISPATCHED',
    responder: 'Campus Ambulance Unit 1',
    createdAt: new Date(Date.now() - 18 * 60000).toISOString()
  },
  {
    id: 102,
    type: 'Security Alert',
    priority: 'MEDIUM',
    location: 'Hostel Block B Parking',
    description: 'Suspicious unattended vehicle near the electrical transformer.',
    studentName: 'Arjun Das',
    studentPhone: '+91 97321 65498',
    status: 'INVESTIGATING',
    responder: 'Security Guard Patrol Team 3',
    createdAt: new Date(Date.now() - 42 * 60000).toISOString()
  },
  {
    id: 103,
    type: 'Fire & Hazard',
    priority: 'CRITICAL',
    location: 'Chemistry Lab Block C Room 204',
    description: 'Minor electrical smoke from lab exhaust panel. Area evacuated safely.',
    studentName: 'Dr. Ramesh (Lab In-charge)',
    studentPhone: '+91 91234 56789',
    status: 'RESOLVED',
    responder: 'Campus Fire & Safety Squad',
    createdAt: new Date(Date.now() - 120 * 60000).toISOString()
  }
];

let currentFilter = 'ALL';
let allAlerts = [];

// LocalStorage helpers for Zero-Downtime Static Hosting (GitHub Pages)
function getStoredAlerts() {
  const data = localStorage.getItem('cers_alerts_v1');
  if (data) {
    try { return JSON.parse(data); } catch(e) {}
  }
  localStorage.setItem('cers_alerts_v1', JSON.stringify(DEFAULT_ALERTS));
  return DEFAULT_ALERTS;
}

function saveStoredAlerts(list) {
  localStorage.setItem('cers_alerts_v1', JSON.stringify(list));
}

// -------------------------------------------------------------
// Fetch Alerts & Contacts (Hybrid Network + Local Fallback)
// -------------------------------------------------------------
async function loadAlerts() {
  const isStatic = window.location.hostname.includes('github.io') || window.location.protocol === 'file:';

  if (!isStatic) {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        allAlerts = await res.json();
        renderAlerts();
        updateStats();
        return;
      }
    } catch (e) {
      console.warn('Backend offline, using local storage.');
    }
  }

  allAlerts = getStoredAlerts();
  renderAlerts();
  updateStats();
}

async function loadContacts() {
  let contacts = DEFAULT_CONTACTS;
  const isStatic = window.location.hostname.includes('github.io') || window.location.protocol === 'file:';

  if (!isStatic) {
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) contacts = await res.json();
    } catch(e) {}
  }

  const container = document.getElementById('contactsContainer');
  container.innerHTML = contacts.map(c => `
    <div class="col-md-6 col-lg-4">
      <div class="contact-card h-100">
        <div>
          <div class="fw-bold text-dark">${escapeHtml(c.title)}</div>
          <div class="small text-secondary"><i class="fas fa-location-dot text-danger me-1"></i>${escapeHtml(c.location)}</div>
          <div class="badge bg-light text-dark border mt-2"><i class="fas fa-clock text-success me-1"></i>${escapeHtml(c.available)}</div>
        </div>
        <a href="tel:${c.phone.replace(/[^0-9+]/g, '')}" class="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold">
          <i class="fas fa-phone me-1"></i> Call
        </a>
      </div>
    </div>
  `).join('');
}

// -------------------------------------------------------------
// Render Alerts
// -------------------------------------------------------------
function renderAlerts() {
  const container = document.getElementById('alertsContainer');
  let filtered = allAlerts;

  if (currentFilter === 'ACTIVE') {
    filtered = allAlerts.filter(a => a.status === 'PENDING' || a.status === 'DISPATCHED' || a.status === 'INVESTIGATING');
  } else if (currentFilter === 'RESOLVED') {
    filtered = allAlerts.filter(a => a.status === 'RESOLVED');
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="card p-5 text-center text-muted border-dashed rounded-4">
          <i class="fas fa-shield-cat fs-1 text-secondary opacity-50 mb-3"></i>
          <h5>No ${currentFilter.toLowerCase()} emergencies currently reported.</h5>
          <p class="small mb-0">Campus safety patrols are operating normally.</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(a => {
    const isResolved = a.status === 'RESOLVED';
    let statusClass = 'pending';
    let badgeClass = 'bg-danger';

    if (a.status === 'DISPATCHED' || a.status === 'INVESTIGATING') {
      statusClass = 'dispatched';
      badgeClass = 'bg-warning text-dark';
    } else if (isResolved) {
      statusClass = 'resolved';
      badgeClass = 'bg-success';
    }

    const timeAgo = formatTimeAgo(a.createdAt);

    return `
      <div class="col-md-6 col-lg-4">
        <div class="incident-card ${statusClass} h-100 d-flex flex-column justify-content-between">
          <div>
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="badge ${badgeClass} text-uppercase fw-bold">${a.status}</span>
              <span class="text-secondary small"><i class="far fa-clock me-1"></i>${timeAgo}</span>
            </div>
            <h5 class="fw-bold mb-1 text-dark">${escapeHtml(a.type)}</h5>
            <div class="text-danger fw-semibold small mb-2">
              <i class="fas fa-location-crosshairs me-1"></i>${escapeHtml(a.location)}
            </div>
            <p class="text-secondary small mb-3">${escapeHtml(a.description || 'Assistance requested.')}</p>
          </div>

          <div class="pt-2 border-top border-light-subtle">
            <div class="d-flex justify-content-between align-items-center mb-3 small">
              <span class="text-muted"><i class="fas fa-user me-1"></i>${escapeHtml(a.studentName)}</span>
              ${a.studentPhone ? `<span class="text-muted"><i class="fas fa-phone me-1"></i>${escapeHtml(a.studentPhone)}</span>` : ''}
            </div>

            ${!isResolved ? `
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-warning w-50 fw-semibold" onclick="updateAlertStatus(${a.id}, 'DISPATCHED')">
                  <i class="fas fa-truck-fast me-1"></i> Dispatch
                </button>
                <button class="btn btn-sm btn-success w-50 fw-semibold" onclick="updateAlertStatus(${a.id}, 'RESOLVED')">
                  <i class="fas fa-check me-1"></i> Resolve
                </button>
              </div>
            ` : `
              <div class="text-success small fw-bold text-center py-1">
                <i class="fas fa-circle-check me-1"></i> Incident Closed & Verified
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// -------------------------------------------------------------
// Update Alert Status
// -------------------------------------------------------------
async function updateAlertStatus(id, newStatus) {
  const isStatic = window.location.hostname.includes('github.io') || window.location.protocol === 'file:';

  if (!isStatic) {
    try {
      const res = await fetch(`/api/alerts/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Incident #${id} marked as ${newStatus}!`);
        loadAlerts();
        return;
      }
    } catch(e) {}
  }

  // Local fallback
  const idx = allAlerts.findIndex(a => a.id === id);
  if (idx !== -1) {
    allAlerts[idx].status = newStatus;
    saveStoredAlerts(allAlerts);
    showToast(`Incident #${id} marked as ${newStatus}!`);
    renderAlerts();
    updateStats();
  }
}

// -------------------------------------------------------------
// Handle SOS Broadcast Submit
// -------------------------------------------------------------
document.getElementById('emergencyForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const typeRadio = document.querySelector('input[name="emergencyType"]:checked');
  const type = typeRadio ? typeRadio.value : 'Medical Emergency';
  const location = document.getElementById('alertLocation').value;
  const priority = document.getElementById('alertPriority').value;
  const studentName = document.getElementById('alertStudentName').value.trim();
  const studentPhone = document.getElementById('alertStudentPhone').value.trim();
  const description = document.getElementById('alertDescription').value.trim();

  if (!location || !studentName) {
    showToast('Please select campus location and enter your name.', true);
    return;
  }

  const payload = {
    type,
    location,
    priority,
    studentName,
    studentPhone,
    description
  };

  const btnText = document.getElementById('submitBtnText');
  btnText.textContent = 'DISPATCHING EMERGENCY ALERT...';

  const isStatic = window.location.hostname.includes('github.io') || window.location.protocol === 'file:';

  let alertCreated = false;
  if (!isStatic) {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alertCreated = true;
      }
    } catch(e) {}
  }

  if (!alertCreated) {
    // Local creation
    const newAlert = {
      id: Date.now(),
      ...payload,
      status: 'PENDING',
      responder: 'Assigning nearest campus patrol...',
      createdAt: new Date().toISOString()
    };
    allAlerts.unshift(newAlert);
    saveStoredAlerts(allAlerts);
  }

  btnText.textContent = 'BROADCAST EMERGENCY SOS DISPATCH NOW';
  document.getElementById('emergencyForm').reset();
  showToast('🚨 SOS ALERT BROADCASTED! First responders notified.');
  loadAlerts();

  // Scroll to feed
  document.getElementById('alertsContainer').scrollIntoView({ behavior: 'smooth' });
});

// -------------------------------------------------------------
// Filters & Metrics
// -------------------------------------------------------------
function filterAlerts(type) {
  currentFilter = type;
  document.querySelectorAll('.btn-group .btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.toUpperCase().includes(type) || (type === 'ALL' && btn.textContent === 'All')) {
      btn.classList.add('active');
    }
  });
  renderAlerts();
}

function updateStats() {
  const activeCount = allAlerts.filter(a => a.status === 'PENDING' || a.status === 'DISPATCHED' || a.status === 'INVESTIGATING').length;
  const resolvedCount = allAlerts.filter(a => a.status === 'RESOLVED').length;

  document.getElementById('statActive').textContent = activeCount;
  document.getElementById('statResolved').textContent = resolvedCount;
}

// -------------------------------------------------------------
// Helpers: Toast, Escape, Time
// -------------------------------------------------------------
function showToast(message, isError = false) {
  const toastEl = document.getElementById('liveToast');
  const toastMsg = document.getElementById('toastMessage');

  toastEl.className = `toast align-items-center text-bg-${isError ? 'warning' : 'danger'} border-0`;
  toastMsg.textContent = message;

  const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
  toast.show();
}

function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
  }[c]));
}

function formatTimeAgo(isoStr) {
  if (!isoStr) return 'Just now';
  const diffMs = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  loadAlerts();
  loadContacts();
});
