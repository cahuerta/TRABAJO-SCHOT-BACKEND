const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;

// === ID de la planilla ===
// En Render debes tener GOOGLE_SHEETS_ID con el ID de la Sheet.
// Opcionalmente puedes usar SHEET_ID en local.
const SHEET_ID = process.env.GOOGLE_SHEETS_ID || process.env.SHEET_ID;

if (!SHEET_ID) {
  console.error('Falta GOOGLE_SHEETS_ID (o SHEET_ID) en las variables de entorno');
} else {
  console.log('Usando SHEET_ID:', SHEET_ID);
}

// ======== AUTH GOOGLE (robusto: JSON único en ENV) ========
if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  console.error('Falta GOOGLE_SERVICE_ACCOUNT_JSON en las variables de entorno');
}

let credentials;
try {
  credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');
} catch (e) {
  console.error('GOOGLE_SERVICE_ACCOUNT_JSON inválido:', e);
  credentials = {};
}

const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
const jwtClient = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  scopes
);

const sheets = google.sheets({ version: 'v4', auth: jwtClient });

// Helper para escribir una fila
async function appendRow(tabName, values) {
  return sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A:Z`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] }
  });
}

app.get('/health', (_req, res) => res.json({ ok: true }));

// ========== DEBUG AUTH (TEMPORAL) ==========
app.get('/_debug/auth', async (_req, res) => {
  try {
    const token = await jwtClient.getAccessToken(); // fuerza el intercambio JWT
    res.json({
      ok: true,
      email: credentials.client_email || null,
      sheetId: SHEET_ID || null,
      tokenSample: String(token).slice(-12) // solo para confirmar que existe
    });
  } catch (e) {
    console.error('Auth debug error:', e);
    res.status(500).json({ ok: false, message: e.message });
  }
});

// ========= REGISTRO ÚNICO EN "LISTA" =========
// Columnas en la Sheet (LISTA):
// A  timestamp
// B  pacienteNombre
// C  rut
// D  edad
// E  Dolor
// F  Lado
// G  examenSolicitadoMedico
// H  examenSolicitadoIA
// I  nombreMedico
// J  especialidad
// K  modulo usado        (NUEVO)
// L  tipo cirugia        (NUEVO)
app.post('/api/registrar', async (req, res) => {
  try {
    const {
      pacienteNombre,
      rut,
      edad,
      dolor,
      lado,
      examenSolicitadoMedico,
      examenSolicitadoIA,
      nombreMedico,
      especialidad,
      // NUEVOS CAMPOS (opcionales, vienen desde el frontend)
      moduloUsado,
      tipoCirugia
    } = req.body || {};

    // Validación mínima de datos del paciente
    if (!pacienteNombre || !rut || !edad || !dolor || !lado) {
      return res
        .status(400)
        .json({ ok: false, error: 'Faltan datos obligatorios del paciente' });
    }

    const timestamp = new Date().toISOString();

    const row = [
      timestamp,                           // A
      String(pacienteNombre),              // B
      String(rut),                         // C
      String(edad),                        // D
      String(dolor),                       // E
      String(lado),                        // F
      String(examenSolicitadoMedico || ''),// G
      String(examenSolicitadoIA || ''),    // H
      String(nombreMedico || ''),          // I
      String(especialidad || ''),          // J
      String(moduloUsado || ''),           // K - modulo usado
      String(tipoCirugia || '')            // L - tipo cirugia
    ];

    await appendRow('LISTA', row);

    res.json({ ok: true });
  } catch (e) {
    console.error('Error LISTA:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`API escuchando en puerto ${PORT}`);
});
