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
      <Box sx={{ display: 'flex', height: '100vh', background: '#1e1e1e' }}>
        <Sidebar temperature={temperature} setTemperature={setTemperature} charLimit={charLimit} setCharLimit={setCharLimit}>
          <FileBrowser onFileSelect={handleFileSelect} selectedFile={attachedFile} />
        </Sidebar>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', p: 3, background: '#1e1e1e' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#d4d4d4', fontWeight: 600 }}>
            OpenAI API Broox Chat
          </Typography>
          <Paper variant="outlined" sx={{ minHeight: 500, maxHeight: 700, overflow: 'auto', mb: 2, width: '100%', maxWidth: 1100, background: '#252526', borderColor: '#333', boxShadow: '0 2px 12px #000a' }}>
            <List>
              {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                <ListItem key={idx} alignItems="flex-start" sx={{
                  background: msg.role === 'user' ? '#2d2d40' : '#23232e',
                  borderRadius: 3,
                  mb: 1.5,
                  color: '#e7e7e7',
                  boxShadow: '0 2px 8px #0002',
                  border: msg.role === 'assistant' ? '1px solid #6c3fc5' : '1px solid #222',
                }}>
                  <ListItemText
                    primary={<span style={{ color: msg.role === 'user' ? '#4fc3f7' : '#c792ea', fontWeight: 600, fontSize: 18 }}>{msg.role === 'user' ? 'You' : 'Assistant'}</span>}
                    secondary={
                      <>
                        {msg.role === 'assistant' ? (
                          <ReactMarkdown
                            components={{
                              code({node, inline, className, children, ...props}) {
                                const baseStyle = {
                                  background: '#181a1b',
                                  color: '#dcdcaa',
                                  borderRadius: 8,
                                  fontFamily: 'Fira Mono, Menlo, monospace',
                                  fontSize: 15,
                                  padding: inline ? '2px 6px' : '16px',
                                  margin: inline ? 0 : '8px 0',
                                  display: inline ? 'inline' : 'block',
                                  overflowX: 'auto',
                                  boxShadow: inline ? undefined : '0 2px 8px #000a',
                                  border: '1px solid #333',
                                  whiteSpace: inline ? 'pre' : 'pre-wrap',
                                };
                                return (
                                  <code style={baseStyle} {...props}>{children}</code>
                                );
                              },
                              p({node, ...props}) {
                                return <p style={{ color: '#e7e7e7', margin: 0, fontSize: 16 }} {...props} />;
                              },
                              span({node, ...props}) {
                                return <span style={{ color: '#e7e7e7' }} {...props} />;
                              },
                              li({node, ...props}) {
                                return <li style={{ color: '#bdbdbd', fontSize: 15, marginLeft: 16 }} {...props} />;
                              }
                            }}
                          >{msg.content}</ReactMarkdown>
                        ) : (
                          <span style={{ color: '#e7e7e7', fontSize: 16 }}>{msg.content}</span>
                        )}
                        {msg.attachments && msg.attachments.map((att, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <AttachFileIcon fontSize="small" sx={{ mr: 0.5, color: '#b0b0b0' }} />
                            <Typography variant="caption" sx={{ color: '#b0b0b0' }}>{att.name}</Typography>
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
            <Box sx={{
              width: '100%',
              maxWidth: 1100,
              display: 'flex',
              alignItems: 'center',
              mb: 1,
              background: 'transparent',
            }}>
              <AttachFileIcon fontSize="small" sx={{ mr: 0.5, color: '#b0b0b0' }} />
              <Typography variant="caption" sx={{ color: '#b0b0b0' }}>Attached: {attachedFileName}</Typography>
              <Button size="small" onClick={() => { setAttachedFile(null); setAttachedFileName(''); setAttachedFileContent(''); }} sx={{ ml: 1 }}>Remove</Button>
            </Box>
          )}
          <Box sx={{ width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 2, mb: 2 }}>
            <TextField
              label="Type your message..."
              multiline
              minRows={1}
              maxRows={3}
              fullWidth
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              sx={{
                background: '#23232e',
                borderRadius: 2,
                '& .MuiInputBase-input': { color: '#d4d4d4' },
                '& .MuiInputLabel-root': { color: '#b0b0b0' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' },
              }}
            />
            <Button
              variant="outlined"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              sx={{
                height: 48,
                minWidth: 90,
                borderColor: (loading || !input.trim()) ? '#888' : '#007acc',
                color: (loading || !input.trim()) ? '#bbb' : '#007acc',
                background: (loading || !input.trim()) ? 'rgba(255,255,255,0.06)' : 'transparent',
                fontWeight: 600,
                opacity: (loading || !input.trim()) ? 0.85 : 1,
                letterSpacing: 1,
                '&.Mui-disabled': {
                  borderColor: '#888',
                  color: '#bbb',
                  background: 'rgba(255,255,255,0.06)',
                  opacity: 0.85,
                },
                '&:hover': {
                  borderColor: '#005fa3',
                  background: '#23232e',
                  color: '#005fa3',
                },
              }}
            >
              Send
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default App;
