require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());


const fs = require('fs');
const path = require('path');
const PROJECT_ROOT = path.resolve(__dirname, '../..');

// List files and folders in a directory
app.get('/api/files', (req, res) => {
  const relPath = req.query.path || '.';
  const absPath = path.resolve(PROJECT_ROOT, relPath);
  if (!absPath.startsWith(PROJECT_ROOT)) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  fs.readdir(absPath, { withFileTypes: true }, (err, entries) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(entries.map(e => ({
      name: e.name,
      isDirectory: e.isDirectory(),
      isFile: e.isFile()
    })));
  });
});

// Read file contents
app.get('/api/file', (req, res) => {
  const relPath = req.query.path;
  if (!relPath) return res.status(400).json({ error: 'Missing path' });
  const absPath = path.resolve(PROJECT_ROOT, relPath);
  if (!absPath.startsWith(PROJECT_ROOT)) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  fs.readFile(absPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ content: data });
  });
});

// Proxy endpoint for OpenAI API
app.post('/api/chat', async (req, res) => {
  const { messages, temperature } = req.body;
  // Attachments are passed through as part of messages, no special handling needed here
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-5-nano',
        messages,
        temperature: temperature || 1
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    // Log model, tokens, and message content
    const log = {
      time: new Date().toISOString(),
      model: response.data.model,
      usage: response.data.usage,
      user: req.ip,
      prompt: req.body.messages,
      reply: response.data.choices?.[0]?.message?.content
    };
    console.log('[OpenAI Chat]', JSON.stringify(log, null, 2));
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TODO: Add file/project management endpoints for WSL

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
