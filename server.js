const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const multer = require('multer');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET_BASE = 'https://api.koboillm.com/v1';

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Multer untuk handle multipart/form-data (images/edits)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ── Route: images/edits (multipart) ───────────────────
app.post('/proxy/images/edits', upload.any(), async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || '';
    const formData = new FormData();

    // Forward semua fields
    if (req.body) {
      for (const [key, value] of Object.entries(req.body)) {
        formData.append(key, value);
      }
    }

    // Forward semua files
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        formData.append(file.fieldname, file.buffer, {
          filename: file.originalname || 'image.png',
          contentType: file.mimetype || 'image/png',
        });
      }
    }

    const response = await fetch(`${TARGET_BASE}/images/edits`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        ...formData.getHeaders()
      },
      body: formData
    });

    const data = await response.text();
    res.status(response.status).set('Content-Type', 'application/json').send(data);

  } catch (err) {
    console.error('Edit proxy error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Route: semua request JSON lainnya ─────────────────
app.all('/proxy/*', async (req, res) => {
  const targetPath = req.path.replace('/proxy/', '');
  const targetUrl = `${TARGET_BASE}/${targetPath}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers['authorization'] || '',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();
    res.status(response.status).set('Content-Type', 'application/json').send(data);

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('PixelForge Proxy OK'));

app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
