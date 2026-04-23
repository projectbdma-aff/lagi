const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET_BASE = 'https://api.koboillm.com/v1';

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Proxy semua request ke koboillm
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
