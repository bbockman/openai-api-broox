import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, List, ListItemButton, ListItemText, Button, Divider } from '@mui/material';
import axios from 'axios';

export default function FileBrowser({ onFileSelect, selectedFile }) {
  const [path, setPath] = useState('.')
  const [entries, setEntries] = useState([])
  useEffect(() => {
    axios.get('/api/files', { params: { path } })
      .then(res => setEntries(res.data))
      .catch(() => setEntries([]));
  }, [path]);

  const openEntry = (entry) => {
    if (entry.isDirectory) {
      setPath(path === '.' ? entry.name : path + '/' + entry.name);
    } else if (entry.isFile) {
      onFileSelect(path === '.' ? entry.name : path + '/' + entry.name, entry.name);
    }
  };

  const goUp = () => {
    if (path === '.' || path === '') return;
    setPath(path.split('/').slice(0, -1).join('/') || '.');
  };

  return (
    <Paper variant="outlined" sx={{ mb: 2, p: 1, width: 220, minHeight: 300, maxHeight: 500, overflow: 'auto' }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Files</Typography>
      <Button onClick={goUp} size="small" sx={{ mb: 1 }} disabled={path === '.'}>Up</Button>
      <List dense>
        {entries.map((entry, idx) => (
          <ListItemButton key={idx} selected={selectedFile === (path === '.' ? entry.name : path + '/' + entry.name)} onClick={() => openEntry(entry)}>
            <ListItemText
              primary={entry.name}
              secondary={entry.isDirectory ? 'Directory' : entry.isFile ? 'File' : ''}
            />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}
