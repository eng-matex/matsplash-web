import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Button,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tooltip,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Download,
  Delete,
  Search,
  FilterList,
  CloudDownload,
  Storage,
  FiberManualRecord,
  Videocam,
  DateRange,
  Schedule,
} from '@mui/icons-material';

interface Recording {
  id: number;
  cameraId: number;
  cameraName: string;
  startTime: string;
  endTime: string;
  duration: number;
  size: number;
  quality: string;
  status: 'recording' | 'completed' | 'archived';
}

export default function RecordingManager() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [playbackOpen, setPlaybackOpen] = useState(false);
  const [filterCamera, setFilterCamera] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    total: 100,
    recordings: 0,
  });

  useEffect(() => {
    fetchRecordings();
    fetchStorageInfo();
  }, []);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/surveillance/recordings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setRecordings(data.recordings || []);
      }
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/surveillance/storage', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setStorageInfo({
          used: data.storageUsedGB || 0,
          total: data.totalCapacityGB || 500,
          free: data.freeSpaceGB || 500
        });
      }
    } catch (error) {
      console.error('Failed to fetch storage info:', error);
    }
  };

  const handleDownload = async (recording: Recording) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/surveillance/recordings/${recording.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        // For now, show download info since we don't have actual video files
        alert(`Download initiated for ${data.fileName}\nCamera: ${data.cameraName}\nDuration: ${recording.duration} minutes`);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleDelete = async (recordingId: number) => {
    if (confirm('Are you sure you want to delete this recording?')) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:3002/api/surveillance/recordings/${recordingId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        fetchRecordings();
        fetchStorageInfo();
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const handlePlayback = (recording: Recording) => {
    setSelectedRecording(recording);
    setPlaybackOpen(true);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const filteredRecordings = recordings.filter((rec) => {
    const matchesCamera = filterCamera === 'all' || rec.cameraId.toString() === filterCamera;
    const matchesSearch = rec.cameraName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCamera && matchesSearch;
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Storage Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Storage sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Storage Used
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {storageInfo?.used?.toFixed(1) || '0.0'} GB / {storageInfo?.total || '500'} GB
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={storageInfo ? (storageInfo.used / storageInfo.total) * 100 : 0}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <FiberManualRecord sx={{ fontSize: 40, color: 'error.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Recordings
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {storageInfo.recordings}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <CloudDownload sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Available Space
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {(storageInfo.total - storageInfo.used).toFixed(1)} GB
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search recordings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ flex: 1 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Camera</InputLabel>
            <Select
              value={filterCamera}
              onChange={(e) => setFilterCamera(e.target.value)}
              label="Filter by Camera"
            >
              <MenuItem value="all">All Cameras</MenuItem>
              <MenuItem value="1">Camera 1</MenuItem>
              <MenuItem value="2">Camera 2</MenuItem>
              <MenuItem value="3">Camera 3</MenuItem>
            </Select>
          </FormControl>

          <Button
            startIcon={<DateRange />}
            variant="outlined"
          >
            Date Range
          </Button>
        </Stack>
      </Paper>

      {/* Recordings Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Camera</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Quality</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <LinearProgress />
                </TableCell>
              </TableRow>
            ) : filteredRecordings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary">No recordings found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRecordings.map((recording) => (
                <TableRow key={recording.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Videocam fontSize="small" />
                      <Typography variant="body2">{recording.cameraName}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{new Date(recording.startTime).toLocaleString()}</TableCell>
                  <TableCell>{new Date(recording.endTime).toLocaleString()}</TableCell>
                  <TableCell>{formatDuration(recording.duration)}</TableCell>
                  <TableCell>{formatSize(recording.size)}</TableCell>
                  <TableCell>
                    <Chip label={recording.quality} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={recording.status}
                      size="small"
                      color={
                        recording.status === 'recording'
                          ? 'error'
                          : recording.status === 'completed'
                          ? 'success'
                          : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Play">
                        <IconButton
                          size="small"
                          onClick={() => handlePlayback(recording)}
                          disabled={recording.status === 'recording'}
                        >
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(recording)}
                          disabled={recording.status === 'recording'}
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(recording.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Playback Dialog */}
      <Dialog
        open={playbackOpen}
        onClose={() => setPlaybackOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Recording Playback - {selectedRecording?.cameraName}
        </DialogTitle>
        <DialogContent>
          {selectedRecording && (
            <Box sx={{ bgcolor: '#000', height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video
                controls
                autoPlay
                style={{ maxWidth: '100%', maxHeight: '100%' }}
                src={`http://localhost:3002/api/surveillance/recordings/${selectedRecording.id}/stream`}
              >
                Your browser does not support video playback.
              </video>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlaybackOpen(false)}>Close</Button>
          <Button
            startIcon={<Download />}
            onClick={() => selectedRecording && handleDownload(selectedRecording)}
            variant="contained"
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

