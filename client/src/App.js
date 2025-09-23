import React, { useState } from 'react';
import { Container, CssBaseline, Box, Typography, TextField, Button, Paper, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import axios from 'axios';


function App() {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are chatting with gpt-5-nano.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await axios.post('/api/chat', {
        messages: newMessages.filter(m => m.role !== 'system'),
      });
      const reply = res.data.choices?.[0]?.message?.content || 'No response.';
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Error: ' + (err.response?.data?.error || err.message) }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <CssBaseline />
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            OpenAI API Broox Chat
          </Typography>
          <Paper variant="outlined" sx={{ minHeight: 300, maxHeight: 400, overflow: 'auto', mb: 2 }}>
            <List>
              {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                <ListItem key={idx} alignItems="flex-start">
                  <ListItemText
                    primary={msg.role === 'user' ? 'You' : 'Assistant'}
                    secondary={msg.content}
                  />
                </ListItem>
              ))}
            </List>
            {loading && <Box textAlign="center" my={2}><CircularProgress size={24} /></Box>}
          </Paper>
          <TextField
            label="Type your message..."
            multiline
            minRows={2}
            maxRows={4}
            fullWidth
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={handleSend} disabled={loading || !input.trim()}>
            Send
          </Button>
        </Box>
      </Container>
    </>
  );
}

export default App;
