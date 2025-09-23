require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Proxy endpoint for OpenAI API
app.post('/api/chat', async (req, res) => {
  const { messages, temperature } = req.body;
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
