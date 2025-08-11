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
    requestBody: {
      values: [values]
    }
  });
}

app.get('/health', (req, res) => res.json({ ok: true }));

// ---------- Pacientes ----------
app.post('/api/pacientes', async (req, res) => {
  try {
    const { nombre, rut, edad, sexo, dolor, lado, observaciones } = req.body || {};
    const timestamp = new Date().toISOString();
    const row = [timestamp, nombre || '', rut || '', edad || '', sexo || '', dolor || '', lado || '', observaciones || ''];
    await appendRow('Pacientes', row);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---------- Traumatologo ----------
app.post('/api/traumatologo', async (req, res) => {
  try {
    const { pacienteNombre, rut, edad, diagnostico, examenSolicitado, observaciones } = req.body || {};
    const timestamp = new Date().toISOString();
    const row = [timestamp, pacienteNombre || '', rut || '', edad || '', diagnostico || '', examenSolicitado || '', observaciones || ''];
    await appendRow('Traumatologo', row);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---------- Medico General ----------
app.post('/api/medico-general', async (req, res) => {
  try {
    const { pacienteNombre, rut, edad, diagnosticoGeneral, examenSolicitado, tratamientoSugerido, observaciones } = req.body || {};
    const timestamp = new Date().toISOString();
    const row = [timestamp, pacienteNombre || '', rut || '', edad || '', diagnosticoGeneral || '', examenSolicitado || '', tratamientoSugerido || '', observaciones || ''];
    await appendRow('MedicoGeneral', row);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`API escuchando en puerto ${PORT}`);
});
