import './bootEnv.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveForm, listFormKeys } from './forms/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const app = express();
const rawOrigins = process.env.ALLOWED_ORIGINS;
const corsOptions =
  !rawOrigins || rawOrigins.trim() === '*'
    ? { origin: true }
    : { origin: rawOrigins.split(',').map((o) => o.trim()).filter(Boolean) };

app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

app.use(express.static(path.join(rootDir, 'public')));

app.get('/health', (_req, res) => {
  res.json({ ok: true, forms: listFormKeys() });
});

/**
 * POST /api/forms/:formKey
 * Content-Type: application/json (recommended) or application/x-www-form-urlencoded
 */
app.post('/api/forms/:formKey', async (req, res) => {
  const form = resolveForm(req.params.formKey);
  if (!form) {
    res.status(404).json({ ok: false, error: 'Unknown form', formKey: req.params.formKey });
    return;
  }

  try {
    const result = await form.handle(req.body);
    res.status(201).json({ ok: true, id: result?.id });
  } catch (err) {
    if (err.name === 'ZodError' || err.zodError) {
      const zod = err.zodError;
      res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: zod?.flatten?.() ?? zod?.issues ?? zod,
      });
      return;
    }

    const status = err.status && Number.isInteger(err.status) ? err.status : 502;
    console.error('[form submit]', req.params.formKey, err.message, err.details || '');
    res.status(status >= 400 && status < 600 ? status : 502).json({
      ok: false,
      error: status === 400 ? err.message : 'Unable to save your submission. Please try again later.',
    });
  }
});

const preferredPort = Number(process.env.PORT) || 3000;
const maxPortTries = 30;

function startListening(port) {
  if (port > preferredPort + maxPortTries) {
    console.error(
      `No free port between ${preferredPort} and ${preferredPort + maxPortTries}. Close whatever is using port ${preferredPort} (often another \`node\` / old dev server) or set PORT in .env.local.`,
    );
    process.exit(1);
  }

  const server = app.listen(port, () => {
    const addr = server.address();
    const actual = typeof addr === 'object' && addr ? addr.port : port;
    if (actual !== preferredPort) {
      console.warn(
        `Port ${preferredPort} was in use; using ${actual} instead. Open http://localhost:${actual}/forms/cba-rejection.html`,
      );
    }
    console.log(`CertNova Brevo forms listening on http://localhost:${actual}`);
    console.log(`Form preview: http://localhost:${actual}/forms/cba-rejection.html`);
    console.log(`Health: http://localhost:${actual}/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is already in use, trying ${port + 1}…`);
      server.close(() => startListening(port + 1));
      return;
    }
    console.error(err);
    process.exit(1);
  });
}

startListening(preferredPort);
