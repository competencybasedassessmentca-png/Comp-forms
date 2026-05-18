import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { resolveForm, listFormKeys, listFormsCatalog } from './forms/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 4 },
});

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

app.get('/api/forms', (_req, res) => {
  res.json({ ok: true, forms: listFormsCatalog() });
});

function parseMultipart(req, res, next) {
  const ct = req.headers['content-type'] || '';
  if (!ct.includes('multipart/form-data')) {
    next();
    return;
  }
  upload.fields([
    { name: 'file_cv', maxCount: 1 },
    { name: 'file_cba', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      res.status(400).json({
        ok: false,
        error: err.code === 'LIMIT_FILE_SIZE' ? 'Each file must be 10 MB or smaller' : err.message,
      });
      return;
    }
    next();
  });
}

function normalizeUploadedFiles(files) {
  if (!files) return {};
  return {
    file_cv: files.file_cv?.[0],
    file_cba: files.file_cba?.[0],
  };
}

app.post('/api/forms/:formKey', parseMultipart, async (req, res) => {
  const form = resolveForm(req.params.formKey);
  if (!form) {
    res.status(404).json({ ok: false, error: 'Unknown form', formKey: req.params.formKey });
    return;
  }

  try {
    const uploaded = normalizeUploadedFiles(req.files);
    const result = await form.handle(req.body, uploaded);
    res.status(201).json({ ok: true, id: result?.id, filesUploaded: result?.filesUploaded });
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

export default app;
