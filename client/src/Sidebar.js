import React from 'react';
import { Box, Typography, Slider, Paper, TextField } from '@mui/material';

export default function Sidebar({ temperature, setTemperature, charLimit, setCharLimit, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, width: 240, minHeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Settings</Typography>
      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Temperature: {temperature}</Typography>
        <Slider
          value={temperature}
          min={0}
          max={2}
          step={0.01}
          onChange={(_, v) => setTemperature(Number(v))}
          valueLabelDisplay="auto"
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>File Attach Limit (chars):</Typography>
        <TextField
          type="number"
          value={charLimit}
          onChange={e => setCharLimit(Number(e.target.value))}
          inputProps={{ min: 100, max: 1000000, step: 100 }}
          size="small"
        />
      </Box>
      {children}
    </Paper>
  );
}
