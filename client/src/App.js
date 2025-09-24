import React, { useState } from 'react';
import { CssBaseline, Box, Typography, TextField, Button, Paper, List, ListItem, ListItemText, CircularProgress, Divider, Grid, IconButton } from '@mui/material';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import FileBrowser from './FileBrowser';
import Sidebar from './Sidebar';
import AttachFileIcon from '@mui/icons-material/AttachFile';



function App() {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are chatting with gpt-5-nano.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState(1);
  const [charLimit, setCharLimit] = useState(2000);
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedFileName, setAttachedFileName] = useState('');
  const [attachedFileContent, setAttachedFileContent] = useState('');

  const handleFileSelect = async (filePath, fileName) => {
    setAttachedFile(filePath);
    setAttachedFileName(fileName);
    // Fetch file content (limit to charLimit for preview/attachment)
    try {
      const res = await axios.get('/api/file', { params: { path: filePath } });
      setAttachedFileContent(res.data.content.slice(0, charLimit));
    } catch {
      setAttachedFileContent('');
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    let msgContent = input;
    let displayContent = input;
    if (attachedFile && attachedFileContent) {
      msgContent += `\n\n[Attached file: ${attachedFileName}]\n\n\u0060\u0060\u0060\n${attachedFileContent}\n\u0060\u0060\u0060`;
      // Only show icon and filename in chat UI, not the file content
      displayContent += `\n\n[Attached file: ${attachedFileName}]`;
    }
    const userMsg = { role: 'user', content: displayContent, attachments: attachedFile ? [{ name: attachedFileName }] : undefined };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setAttachedFile(null);
    setAttachedFileName('');
    setAttachedFileContent('');
    setLoading(true);
    try {
      // Send the full content to the backend, but only display the short version in the UI
      const sendMessages = newMessages.map(m => {
        if (m === userMsg) {
          return { ...m, content: msgContent };
        }
        return m;
      });
      const res = await axios.post('/api/chat', {
        messages: sendMessages.filter(m => m.role !== 'system'),
        temperature
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
      <Box sx={{ display: 'flex', height: '100vh' }}>
  <Sidebar temperature={temperature} setTemperature={setTemperature} charLimit={charLimit} setCharLimit={setCharLimit}>
          <FileBrowser onFileSelect={handleFileSelect} selectedFile={attachedFile} />
        </Sidebar>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            OpenAI API Broox Chat
          </Typography>
          <Paper variant="outlined" sx={{ minHeight: 300, maxHeight: 400, overflow: 'auto', mb: 2, width: '100%', maxWidth: 700 }}>
            <List>
              {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                <ListItem key={idx} alignItems="flex-start">
                  <ListItemText
                    primary={msg.role === 'user' ? 'You' : 'Assistant'}
                    secondary={
                      <>
                        {msg.role === 'assistant' ? (
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        ) : (
                          msg.content
                        )}
                        {msg.attachments && msg.attachments.map((att, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <AttachFileIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="caption">{att.name}</Typography>
                          </Box>
                        ))}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
            {loading && <Box textAlign="center" my={2}><CircularProgress size={24} /></Box>}
          </Paper>
          {attachedFile && (
            <Box sx={{ mb: 2, width: '100%', maxWidth: 700 }}>
              <Divider />
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <AttachFileIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="caption">Attached: {attachedFileName}</Typography>
                <Button size="small" onClick={() => { setAttachedFile(null); setAttachedFileName(''); setAttachedFileContent(''); }} sx={{ ml: 1 }}>Remove</Button>
              </Box>
              <Paper variant="outlined" sx={{ p: 1, maxHeight: 120, overflow: 'auto', whiteSpace: 'pre', fontFamily: 'monospace', fontSize: 13, mt: 1 }}>
                {attachedFileContent}
              </Paper>
            </Box>
          )}
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
            sx={{ mb: 2, maxWidth: 700 }}
          />
          <Button variant="contained" onClick={handleSend} disabled={loading || !input.trim()} sx={{ maxWidth: 700, alignSelf: 'flex-end' }}>
            Send
          </Button>
        </Box>
      </Box>
    </>
  );
}

export default App;
