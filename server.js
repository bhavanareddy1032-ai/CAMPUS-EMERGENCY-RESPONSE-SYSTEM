const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initial Emergency Contacts
const EMERGENCY_CONTACTS = [
  { id: 1, title: 'Campus Security Control Room', phone: '+91 98765 43210', location: 'Gate 1 Admin Block', available: '24/7' },
  { id: 2, title: 'Campus Medical Centre / Ambulance', phone: '+91 98765 43211', location: 'Health Centre Block D', available: '24/7' },
  { id: 3, title: "Women's Safety & Anti-Harassment Cell", phone: '+91 98765 43212', location: 'Dean Office Room 104', available: '24/7' },
  { id: 4, title: 'Chief Hostel Warden', phone: '+91 98765 43213', location: 'Hostel Block A Office', available: '6:00 AM - 11:00 PM' },
  { id: 5, title: 'Campus Fire & Disaster Squad', phone: '+91 98765 43214', location: 'Main Utility Gate 3', available: '24/7' }
];

// Initial Alerts Data
const dataFile = path.join(__dirname, 'data.json');
let alerts = [
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

if (fs.existsSync(dataFile)) {
  try {
    alerts = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (e) {
    console.warn('Could not read data.json, using defaults.');
  }
}

function saveData() {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(alerts, null, 2), 'utf8');
  } catch (e) {
    // Read-only filesystem safe
  }
}

// Router
const router = express.Router();

router.get('/contacts', (req, res) => {
  res.json(EMERGENCY_CONTACTS);
});

router.get('/alerts', (req, res) => {
  res.json(alerts);
});

router.post('/alerts', (req, res) => {
  const { type, location, description, studentName, studentPhone, priority } = req.body;

  if (!type || !location || !studentName) {
    return res.status(400).json({ error: 'Emergency type, location, and student name are required' });
  }

  const newAlert = {
    id: Date.now(),
    type,
    priority: priority || 'HIGH',
    location,
    description: description || 'Immediate campus assistance requested.',
    studentName,
    studentPhone: studentPhone || 'Not provided',
    status: 'PENDING',
    responder: 'Assigning nearest campus patrol...',
    createdAt: new Date().toISOString()
  };

  alerts.unshift(newAlert);
  saveData();

  return res.status(201).json({
    success: true,
    alert: newAlert,
    message: 'SOS Alert broadcasted successfully. Response team notified.'
  });
});

router.put('/alerts/:id/status', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status, responder } = req.body;

  const alert = alerts.find(a => a.id === id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  if (status) alert.status = status;
  if (responder) alert.responder = responder;
  alert.updatedAt = new Date().toISOString();

  saveData();
  return res.json({ success: true, alert });
});

router.get('/stats', (req, res) => {
  const activeCount = alerts.filter(a => a.status === 'PENDING' || a.status === 'DISPATCHED' || a.status === 'INVESTIGATING').length;
  const resolvedCount = alerts.filter(a => a.status === 'RESOLVED').length;

  res.json({
    activeEmergencies: activeCount,
    resolvedToday: resolvedCount,
    avgResponseMinutes: '3.8 mins',
    safetyIndex: '99.4%',
    totalAlerts: alerts.length
  });
});

app.use('/api', router);
app.use(router);

// Serve static frontend
app.use(express.static(__dirname));

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.status(404).send('Page not found');
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  🚨 CAMPUS EMERGENCY RESPONSE SYSTEM (NODE.JS + EXPRESS)`);
    console.log(`  🌐 Server running at: http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}
