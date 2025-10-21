import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Slider,
  Stack,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
} from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
  ArrowForward,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  FiberManualRecord,
  PlayArrow,
  Home,
  Speed,
} from '@mui/icons-material';

interface PTZControlsProps {
  cameraId: number;
  cameraName: string;
  onClose?: () => void;
}

export default function PTZControls({ cameraId, cameraName, onClose }: PTZControlsProps) {
  const [speed, setSpeed] = useState(5);
  const [zoom, setZoom] = useState(1);
  const [preset, setPreset] = useState<number | null>(null);
  const [presets] = useState([
    { id: 1, name: 'Entrance', position: { pan: 0, tilt: 0, zoom: 1 } },
    { id: 2, name: 'Parking', position: { pan: 90, tilt: -30, zoom: 2 } },
    { id: 3, name: 'Exit', position: { pan: 180, tilt: 0, zoom: 1 } },
    { id: 4, name: 'Overview', position: { pan: 0, tilt: 45, zoom: 0.5 } },
  ]);

  const handlePTZ = async (direction: string) => {
    try {
      await fetch(`/api/surveillance/ptz/${cameraId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction, speed }),
      });
    } catch (error) {
      console.error('PTZ control error:', error);
    }
  };

  const handleZoom = async (value: number) => {
    setZoom(value);
    try {
      await fetch(`/api/surveillance/ptz/${cameraId}/zoom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoom: value }),
      });
    } catch (error) {
      console.error('Zoom error:', error);
    }
  };

  const handlePreset = async (presetId: number) => {
    setPreset(presetId);
    try {
      await fetch(`/api/surveillance/ptz/${cameraId}/preset/${presetId}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Preset error:', error);
    }
  };

  const handleHome = async () => {
    try {
      await fetch(`/api/surveillance/ptz/${cameraId}/home`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Home error:', error);
    }
  };

  return (
    <Paper sx={{ p: 3, minWidth: 400 }}>
      <Typography variant="h6" gutterBottom>
        PTZ Controls - {cameraName}
      </Typography>
      
      <Divider sx={{ my: 2 }} />

      {/* Direction Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Box sx={{ position: 'relative', width: 200, height: 200 }}>
          {/* Center */}
          <IconButton
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
            onClick={handleHome}
          >
            <Home />
          </IconButton>

          {/* Up */}
          <IconButton
            sx={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            onMouseDown={() => handlePTZ('up')}
            onMouseUp={() => handlePTZ('stop')}
          >
            <ArrowUpward />
          </IconButton>

          {/* Down */}
          <IconButton
            sx={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            onMouseDown={() => handlePTZ('down')}
            onMouseUp={() => handlePTZ('stop')}
          >
            <ArrowDownward />
          </IconButton>

          {/* Left */}
          <IconButton
            sx={{
              position: 'absolute',
              top: '50%',
              left: 0,
              transform: 'translateY(-50%)',
            }}
            onMouseDown={() => handlePTZ('left')}
            onMouseUp={() => handlePTZ('stop')}
          >
            <ArrowBack />
          </IconButton>

          {/* Right */}
          <IconButton
            sx={{
              position: 'absolute',
              top: '50%',
              right: 0,
              transform: 'translateY(-50%)',
            }}
            onMouseDown={() => handlePTZ('right')}
            onMouseUp={() => handlePTZ('stop')}
          >
            <ArrowForward />
          </IconButton>
        </Box>
      </Box>

      {/* Speed Control */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Speed />
          <Typography variant="body2" sx={{ minWidth: 60 }}>
            Speed: {speed}
          </Typography>
          <Slider
            value={speed}
            onChange={(e, value) => setSpeed(value as number)}
            min={1}
            max={10}
            step={1}
            marks
            sx={{ flex: 1 }}
          />
        </Stack>
      </Box>

      {/* Zoom Controls */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton onClick={() => handleZoom(Math.max(0.5, zoom - 0.5))}>
            <ZoomOut />
          </IconButton>
          <Slider
            value={zoom}
            onChange={(e, value) => handleZoom(value as number)}
            min={0.5}
            max={10}
            step={0.5}
            marks={[
              { value: 0.5, label: '0.5x' },
              { value: 5, label: '5x' },
              { value: 10, label: '10x' },
            ]}
            sx={{ flex: 1 }}
          />
          <IconButton onClick={() => handleZoom(Math.min(10, zoom + 0.5))}>
            <ZoomIn />
          </IconButton>
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Presets */}
      <Typography variant="subtitle2" gutterBottom>
        Camera Presets
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
        {presets.map((p) => (
          <Chip
            key={p.id}
            label={p.name}
            onClick={() => handlePreset(p.id)}
            color={preset === p.id ? 'primary' : 'default'}
            variant={preset === p.id ? 'filled' : 'outlined'}
            icon={<PlayArrow />}
          />
        ))}
      </Stack>

      {/* Auto Patrol */}
      <Box sx={{ mt: 3 }}>
        <ToggleButtonGroup size="small" fullWidth>
          <ToggleButton value="patrol">
            <FiberManualRecord sx={{ mr: 0.5 }} />
            Auto Patrol
          </ToggleButton>
          <ToggleButton value="track">
            <CenterFocusStrong sx={{ mr: 0.5 }} />
            Auto Track
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Paper>
  );
}

