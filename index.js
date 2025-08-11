const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;
const SHEET_ID = process.env.SHEET_ID;

// Auth Google Sheets
const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  null,
  (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets']
);
const sheets = google.sheets({ version: 'v4', auth });

async function appendRow(tabName, values) {
  return sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A:Z`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] }
  });
}

app.get('/health', (_req, res) => res.json({ ok: true }));

// ========= PACIENTES =========
// Columns: timestamp | nombre | rut | edad | dolor | lado
app.post('/api/pacientes', async (req, res) => {
  try {
    const { nombre, rut, edad, dolor, lado } = req.body || {};
    if (!nombre || !rut || !edad || !dolor || !lado) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });
    }
    const timestamp = new Date().toISOString();
    const row = [timestamp, String(nombre), String(rut), String(edad), String(dolor), String(lado)];
    await appendRow('Pacientes', row);
    res.json({ ok: true });
  } catch (e) {
    console.error('Pacientes error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ========= TRAUMATOLOGO =========
// Columns: timestamp | pacienteNombre | rut | edad | examenSolicitado | nombreMedico | especialidad
app.post('/api/traumatologo', async (req, res) => {
  try {
    const { pacienteNombre, rut, edad, examenSolicitado, nombreMedico } = req.body || {};
    if (!pacienteNombre || !rut || !edad || !examenSolicitado || !nombreMedico) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });
    }
    const timestamp = new Date().toISOString();
    const especialidad = 'Traumatólogo';
    const row = [
      timestamp,
      String(pacienteNombre),
      String(rut),
      String(edad),
      String(examenSolicitado),
      String(nombreMedico),
      especialidad
    ];
    await appendRow('Traumatologo', row);
    res.json({ ok: true });
  } catch (e) {
    console.error('Traumatologo error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ========= MEDICO GENERAL =========
// Columns: timestamp | pacienteNombre | rut | edad | examenSolicitado | nombreMedico | especialidad
app.post('/api/medico-general', async (req, res) => {
  try {
    const { pacienteNombre, rut, edad, examenSolicitado, nombreMedico } = req.body || {};
    if (!pacienteNombre || !rut || !edad || !examenSolicitado || !nombreMedico) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });
    }
    const timestamp = new Date().toISOString();
    const especialidad = 'Medicina general';
    const row = [
      timestamp,
      String(pacienteNombre),
      String(rut),
      String(edad),
      String(examenSolicitado),
      String(nombreMedico),
      especialidad
    ];
    await appendRow('MedicoGeneral', row);
    res.json({ ok: true });
  } catch (e) {
    console.error('MedicoGeneral error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`API escuchando en puerto ${PORT}`);
});
