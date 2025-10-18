import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  LinearProgress,
  Badge,
  Avatar,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  CheckCircle,
  Cancel,
  Pending,
  Videocam,
  VideocamOff,
  Settings,
  Refresh,
  PlayArrow,
  Stop,
  Pause,
  Fullscreen,
  FullscreenExit,
  VolumeUp,
  VolumeOff,
  Security,
  Warning,
  Notifications,
  CameraAlt,
  CameraEnhance,
  LocationOn,
  NetworkCheck,
  Wifi,
  WifiOff,
  Storage,
  CloudUpload,
  CloudDownload,
  History,
  Assessment,
  Timeline,
  ExpandMore,
  FiberManualRecord,
  StopCircle,
  Schedule,
  MotionPhotosOn,
  MotionPhotosOff,
  List,
  GridView
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface SurveillanceManagementProps {
  selectedSection?: string;
  userRole?: string;
}

interface Camera {
  id: number;
  name: string;
  ip_address: string;
  port: number;
  username: string;
  password: string;
  stream_url: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  location: string;
  model: string;
  manufacturer: string;
  last_seen: string;
  resolution: string;
  fps: number;
  night_vision: boolean;
  motion_detection: boolean;
  audio_enabled: boolean;
  recording_enabled: boolean;
  continuous_recording: boolean;
  storage_used: number;
  storage_total: number;
  created_at: string;
  updated_at: string;
}

interface RecordingSession {
  id: string;
  camera_id: number;
  start_time: string;
  end_time?: string;
  status: 'recording' | 'stopped' | 'paused';
  recording_type: 'manual' | 'motion' | 'continuous' | 'scheduled';
  file_path?: string;
  duration?: number;
  file_size?: number;
  motion_events?: number;
}

interface NetworkDevice {
  ip: string;
  port: number;
  status: 'online' | 'offline';
  responseTime?: number;
  deviceType?: string;
  manufacturer?: string;
  model?: string;
}

const EnhancedSurveillanceManagement: React.FC<SurveillanceManagementProps> = ({ selectedSection, userRole }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [newCamera, setNewCamera] = useState<Partial<Camera>>({
    name: '',
    ip_address: '',
    port: 80,
    username: '',
    password: '',
    stream_url: '',
    location: '',
    model: '',
    manufacturer: '',
    resolution: '1920x1080',
    fps: 30,
    night_vision: false,
    motion_detection: true,
    audio_enabled: false,
    recording_enabled: true,
    continuous_recording: false
  });
  const [fullscreenCamera, setFullscreenCamera] = useState<Camera | null>(null);
  const [selectedView, setSelectedView] = useState('grid');
  const [networkDevices, setNetworkDevices] = useState<NetworkDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testResult, setTestResult] = useState<NetworkDevice | null>(null);
  const [testing, setTesting] = useState(false);
  const [recordingSessions, setRecordingSessions] = useState<RecordingSession[]>([]);
  const [activeRecordings, setActiveRecordings] = useState<Map<number, RecordingSession>>(new Map());

  const cameraLocations = [
    'Main Entrance',
    'Loading Bay',
    'Production Floor',
    'Warehouse',
    'Office Area',
    'Parking Lot',
    'Security Gate',
    'Storage Room',
    'Break Room',
    'Reception Area'
  ];

  const cameraModels = [
    'Hikvision DS-2CD2143G0-I',
    'Dahua IPC-HFW4431R-Z',
    'Axis M3046-V',
    'Foscam FI9821P',
    'D-Link DCS-8525LH',
    'TP-Link Tapo C200',
    'Netgear Arlo Pro 3',
    'Ring Stick Up Cam',
    'Wyze Cam v3',
    'Eufy Security Cam'
  ];

  const cameraManufacturers = [
    'Hikvision',
    'Dahua',
    'Axis',
    'Foscam',
    'D-Link',
    'TP-Link',
    'Netgear',
    'Ring',
    'Wyze',
    'Eufy',
    'Avigilon',
    'Uniview',
    'Tiandy'
  ];

  useEffect(() => {
    fetchData();
    fetchActiveRecordings();
  }, [selectedSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch real cameras from API
      const camerasResponse = await fetch('/api/surveillance/cameras');
      if (camerasResponse.ok) {
        const camerasData = await camerasResponse.json();
        if (camerasData.success) {
          setCameras(camerasData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching surveillance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveRecordings = async () => {
    try {
      const activeRecordingsMap = new Map<number, RecordingSession>();
      
      for (const camera of cameras) {
        const response = await fetch(`/api/surveillance/cameras/${camera.id}/recording-status`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.is_recording) {
            activeRecordingsMap.set(camera.id, data.data.recording_session);
          }
        }
      }
      
      setActiveRecordings(activeRecordingsMap);
    } catch (error) {
      console.error('Error fetching active recordings:', error);
    }
  };

  const handleStartRecording = async (cameraId: number, recordingType: 'manual' | 'continuous' = 'manual') => {
    try {
      const response = await fetch(`/api/surveillance/cameras/${cameraId}/start-recording`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recording_type: recordingType,
          userId: user?.id,
          userEmail: user?.email
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setActiveRecordings(prev => new Map(prev.set(cameraId, result.data)));
        await fetchData(); // Refresh camera data
      } else {
        console.error('Failed to start recording:', result.message);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const handleStopRecording = async (cameraId: number) => {
    try {
      const response = await fetch(`/api/surveillance/cameras/${cameraId}/stop-recording`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          userEmail: user?.email
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setActiveRecordings(prev => {
          const newMap = new Map(prev);
          newMap.delete(cameraId);
          return newMap;
        });
        await fetchData(); // Refresh camera data
      } else {
        console.error('Failed to stop recording:', result.message);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const handleConfigure247 = async (cameraId: number, enabled: boolean) => {
    try {
      const response = await fetch(`/api/surveillance/cameras/${cameraId}/configure-247`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled,
          motion_detection: true,
          audio_enabled: false,
          userId: user?.id,
          userEmail: user?.email
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchData(); // Refresh camera data
        if (enabled) {
          await fetchActiveRecordings(); // Refresh active recordings
        }
      } else {
        console.error('Failed to configure 24/7 recording:', result.message);
      }
    } catch (error) {
      console.error('Error configuring 24/7 recording:', error);
    }
  };

  // Network scanning functions
  const handleScanNetwork = async () => {
    setScanning(true);
    setScanProgress(0);
    setNetworkDevices([]);
    
    try {
      const response = await fetch('/api/surveillance/scan-network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          networkRange: '192.168.1.1-254',
          ports: [80, 8080, 554, 1935]
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setNetworkDevices(result.data);
        setScanDialogOpen(true);
      } else {
        console.error('Network scan failed:', result.message);
      }
    } catch (error) {
      console.error('Error scanning network:', error);
    } finally {
      setScanning(false);
      setScanProgress(100);
    }
  };

  const handleTestCamera = async (ip: string, port: number = 80, username?: string, password?: string) => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/surveillance/test-camera', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip_address: ip,
          port,
          username,
          password,
          timeout: 5000
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResult(result.data);
        setTestDialogOpen(true);
      } else {
        console.error('Camera test failed:', result.message);
      }
    } catch (error) {
      console.error('Error testing camera:', error);
    } finally {
      setTesting(false);
    }
  };

  const handleAddFromScan = (device: NetworkDevice) => {
    setNewCamera({
      name: `Camera ${device.ip}`,
      ip_address: device.ip,
      port: device.port,
      username: 'admin',
      password: '',
      location: '',
      model: device.model || 'Unknown',
      manufacturer: device.manufacturer || 'Unknown',
      resolution: '1920x1080',
      fps: 30,
      night_vision: false,
      motion_detection: true,
      audio_enabled: false,
      recording_enabled: true,
      continuous_recording: false
    });
    setDialogType('add');
    setDialogOpen(true);
    setScanDialogOpen(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleOpenDialog = (type: string, item?: Camera) => {
    setDialogType(type);
    if (type === 'edit' && item) {
      setSelectedCamera(item);
    } else {
      setSelectedCamera(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setSelectedCamera(null);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online': return 'success';
      case 'offline': return 'error';
      case 'maintenance': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online': return <Videocam />;
      case 'offline': return <VideocamOff />;
      case 'maintenance': return <Settings />;
      case 'error': return <Warning />;
      default: return <CameraAlt />;
    }
  };

  const filteredCameras = cameras.filter(camera => {
    const matchesSearch = camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         camera.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         camera.ip_address.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || camera.status === statusFilter;
    const matchesLocation = locationFilter === 'all' || camera.location === locationFilter;
    return matchesSearch && matchesStatus && matchesLocation;
  });

  const renderCameraGrid = () => (
    <Grid container spacing={3}>
      {filteredCameras.map((camera) => {
        const isRecording = activeRecordings.has(camera.id);
        const recordingSession = activeRecordings.get(camera.id);
        
        return (
          <Grid item xs={12} sm={6} md={4} key={camera.id}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              border: isRecording ? '2px solid #f44336' : '1px solid #e0e0e0',
              position: 'relative'
            }}>
              {isRecording && (
                <Box sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 1
                }}>
                  <Chip
                    icon={<FiberManualRecord />}
                    label="REC"
                    color="error"
                    size="small"
                    sx={{ animation: 'pulse 1s infinite' }}
                  />
                </Box>
              )}
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: getStatusColor(camera.status) === 'success' ? '#4caf50' : '#f44336', mr: 2 }}>
                    {getStatusIcon(camera.status)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" noWrap>
                      {camera.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {camera.location}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    IP: {camera.ip_address}:{camera.port}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Model: {camera.model}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Resolution: {camera.resolution} @ {camera.fps}fps
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={camera.status} 
                    color={getStatusColor(camera.status) as any}
                    size="small"
                  />
                  {camera.night_vision && <Chip label="Night Vision" size="small" />}
                  {camera.motion_detection && <Chip label="Motion" size="small" />}
                  {camera.audio_enabled && <Chip label="Audio" size="small" />}
                  {camera.continuous_recording && <Chip label="24/7" size="small" color="primary" />}
                </Box>

                {isRecording && recordingSession && (
                  <Box sx={{ mb: 2, p: 1, bgcolor: '#ffebee', borderRadius: 1 }}>
                    <Typography variant="body2" color="error">
                      Recording: {recordingSession.recording_type}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Started: {new Date(recordingSession.start_time).toLocaleTimeString()}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Tooltip title="View Live Feed">
                    <IconButton 
                      size="small" 
                      onClick={() => setFullscreenCamera(camera)}
                      disabled={camera.status !== 'online'}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title={isRecording ? "Stop Recording" : "Start Recording"}>
                    <IconButton 
                      size="small" 
                      onClick={() => isRecording ? handleStopRecording(camera.id) : handleStartRecording(camera.id)}
                      color={isRecording ? "error" : "primary"}
                    >
                      {isRecording ? <StopCircle /> : <FiberManualRecord />}
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Edit Camera">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog('edit', camera)}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete Camera">
                    <IconButton 
                      size="small" 
                      onClick={() => {/* TODO: Implement delete */}}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  const renderCameraList = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Camera</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>IP Address</TableCell>
            <TableCell>Recording</TableCell>
            <TableCell>Features</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredCameras.map((camera) => {
            const isRecording = activeRecordings.has(camera.id);
            const recordingSession = activeRecordings.get(camera.id);
            
            return (
              <TableRow key={camera.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: getStatusColor(camera.status) === 'success' ? '#4caf50' : '#f44336', mr: 2, width: 32, height: 32 }}>
                      {getStatusIcon(camera.status)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {camera.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {camera.model}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={camera.status} 
                    color={getStatusColor(camera.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{camera.location}</TableCell>
                <TableCell>{camera.ip_address}:{camera.port}</TableCell>
                <TableCell>
                  {isRecording ? (
                    <Box>
                      <Chip
                        icon={<FiberManualRecord />}
                        label="REC"
                        color="error"
                        size="small"
                        sx={{ mb: 0.5 }}
                      />
                      <Typography variant="caption" display="block">
                        {recordingSession?.recording_type}
                      </Typography>
                    </Box>
                  ) : (
                    <Chip label="Stopped" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {camera.night_vision && <Chip label="Night" size="small" />}
                    {camera.motion_detection && <Chip label="Motion" size="small" />}
                    {camera.audio_enabled && <Chip label="Audio" size="small" />}
                    {camera.continuous_recording && <Chip label="24/7" size="small" color="primary" />}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Live Feed">
                      <IconButton 
                        size="small" 
                        onClick={() => setFullscreenCamera(camera)}
                        disabled={camera.status !== 'online'}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={isRecording ? "Stop Recording" : "Start Recording"}>
                      <IconButton 
                        size="small" 
                        onClick={() => isRecording ? handleStopRecording(camera.id) : handleStartRecording(camera.id)}
                        color={isRecording ? "error" : "primary"}
                      >
                        {isRecording ? <StopCircle /> : <FiberManualRecord />}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Edit Camera">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog('edit', camera)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 0:
        return (
          <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                Camera Management
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setSelectedView('grid')}
                  startIcon={<GridView />}
                  color={selectedView === 'grid' ? 'primary' : 'inherit'}
                >
                  Grid View
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setSelectedView('list')}
                  startIcon={<List />}
                  color={selectedView === 'list' ? 'primary' : 'inherit'}
                >
                  List View
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog('add')}
                  sx={{ bgcolor: '#13bbc6' }}
                >
                  Add Camera
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<NetworkCheck />}
                  onClick={handleScanNetwork}
                  disabled={scanning}
                  sx={{ borderColor: '#13bbc6', color: '#13bbc6' }}
                >
                  {scanning ? 'Scanning...' : 'Scan Network'}
                </Button>
              </Box>
            </Box>

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: '#4caf50', mr: 2 }}>
                        <Videocam />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                          {cameras.filter(c => c.status === 'online').length}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Online Cameras
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: '#f44336', mr: 2 }}>
                        <FiberManualRecord />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                          {activeRecordings.size}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Active Recordings
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: '#ff9800', mr: 2 }}>
                        <MotionPhotosOn />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                          {cameras.filter(c => c.motion_detection).length}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Motion Detection
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: '#2196f3', mr: 2 }}>
                        <Schedule />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                          {cameras.filter(c => c.continuous_recording).length}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          24/7 Recording
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search cameras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Location</InputLabel>
                <Select
                  value={locationFilter}
                  label="Location"
                  onChange={(e) => setLocationFilter(e.target.value)}
                >
                  <MenuItem value="all">All Locations</MenuItem>
                  {cameraLocations.map((location) => (
                    <MenuItem key={location} value={location}>{location}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Camera Grid/List */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredCameras.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="h6" color="textSecondary">
                  No cameras found
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Try adjusting your search criteria or add a new camera
                </Typography>
              </Box>
            ) : (
              selectedView === 'grid' ? renderCameraGrid() : renderCameraList()
            )}
          </Box>
        );
      default:
        return (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" color="textSecondary">
              Coming Soon
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box>
      <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Cameras" />
        <Tab label="Recordings" />
        <Tab label="Motion Events" />
        <Tab label="Settings" />
      </Tabs>
      
      {renderContent()}
      
      {/* Fullscreen Camera Dialog */}
      <Dialog 
        open={!!fullscreenCamera} 
        onClose={() => setFullscreenCamera(null)} 
        maxWidth="lg" 
        fullWidth
        fullScreen
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {fullscreenCamera?.name} - Live Feed
            </Typography>
            <IconButton onClick={() => setFullscreenCamera(null)}>
              <FullscreenExit />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            width: '100%', 
            height: '70vh', 
            bgcolor: '#000', 
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #333'
          }}>
            <Typography variant="h6" color="white">
              Live Camera Feed - {fullscreenCamera?.status === 'online' ? 'Streaming' : 'Offline'}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Camera Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'add' && 'Add New Camera'}
          {dialogType === 'edit' && 'Edit Camera'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Camera Name"
                value={dialogType === 'edit' ? selectedCamera?.name || '' : newCamera.name}
                onChange={(e) => {
                  if (dialogType === 'edit' && selectedCamera) {
                    setSelectedCamera({ ...selectedCamera, name: e.target.value });
                  } else {
                    setNewCamera({ ...newCamera, name: e.target.value });
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="IP Address"
                value={dialogType === 'edit' ? selectedCamera?.ip_address || '' : newCamera.ip_address}
                onChange={(e) => {
                  if (dialogType === 'edit' && selectedCamera) {
                    setSelectedCamera({ ...selectedCamera, ip_address: e.target.value });
                  } else {
                    setNewCamera({ ...newCamera, ip_address: e.target.value });
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Port"
                type="number"
                value={dialogType === 'edit' ? selectedCamera?.port || 80 : newCamera.port}
                onChange={(e) => {
                  if (dialogType === 'edit' && selectedCamera) {
                    setSelectedCamera({ ...selectedCamera, port: parseInt(e.target.value) });
                  } else {
                    setNewCamera({ ...newCamera, port: parseInt(e.target.value) });
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={dialogType === 'edit' ? selectedCamera?.username || '' : newCamera.username}
                onChange={(e) => {
                  if (dialogType === 'edit' && selectedCamera) {
                    setSelectedCamera({ ...selectedCamera, username: e.target.value });
                  } else {
                    setNewCamera({ ...newCamera, username: e.target.value });
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={dialogType === 'edit' ? selectedCamera?.password || '' : newCamera.password}
                onChange={(e) => {
                  if (dialogType === 'edit' && selectedCamera) {
                    setSelectedCamera({ ...selectedCamera, password: e.target.value });
                  } else {
                    setNewCamera({ ...newCamera, password: e.target.value });
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={dialogType === 'edit' ? selectedCamera?.location || '' : newCamera.location}
                  label="Location"
                  onChange={(e) => {
                    if (dialogType === 'edit' && selectedCamera) {
                      setSelectedCamera({ ...selectedCamera, location: e.target.value });
                    } else {
                      setNewCamera({ ...newCamera, location: e.target.value });
                    }
                  }}
                >
                  {cameraLocations.map((location) => (
                    <MenuItem key={location} value={location}>{location}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Manufacturer</InputLabel>
                <Select
                  value={dialogType === 'edit' ? selectedCamera?.manufacturer || '' : newCamera.manufacturer}
                  label="Manufacturer"
                  onChange={(e) => {
                    if (dialogType === 'edit' && selectedCamera) {
                      setSelectedCamera({ ...selectedCamera, manufacturer: e.target.value });
                    } else {
                      setNewCamera({ ...newCamera, manufacturer: e.target.value });
                    }
                  }}
                >
                  {cameraManufacturers.map((manufacturer) => (
                    <MenuItem key={manufacturer} value={manufacturer}>{manufacturer}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Model</InputLabel>
                <Select
                  value={dialogType === 'edit' ? selectedCamera?.model || '' : newCamera.model}
                  label="Model"
                  onChange={(e) => {
                    if (dialogType === 'edit' && selectedCamera) {
                      setSelectedCamera({ ...selectedCamera, model: e.target.value });
                    } else {
                      setNewCamera({ ...newCamera, model: e.target.value });
                    }
                  }}
                >
                  {cameraModels.map((model) => (
                    <MenuItem key={model} value={model}>{model}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Camera Features */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Camera Features</Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={dialogType === 'edit' ? selectedCamera?.motion_detection || false : newCamera.motion_detection}
                    onChange={(e) => {
                      if (dialogType === 'edit' && selectedCamera) {
                        setSelectedCamera({ ...selectedCamera, motion_detection: e.target.checked });
                      } else {
                        setNewCamera({ ...newCamera, motion_detection: e.target.checked });
                      }
                    }}
                  />
                }
                label="Motion Detection"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={dialogType === 'edit' ? selectedCamera?.night_vision || false : newCamera.night_vision}
                    onChange={(e) => {
                      if (dialogType === 'edit' && selectedCamera) {
                        setSelectedCamera({ ...selectedCamera, night_vision: e.target.checked });
                      } else {
                        setNewCamera({ ...newCamera, night_vision: e.target.checked });
                      }
                    }}
                  />
                }
                label="Night Vision"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={dialogType === 'edit' ? selectedCamera?.audio_enabled || false : newCamera.audio_enabled}
                    onChange={(e) => {
                      if (dialogType === 'edit' && selectedCamera) {
                        setSelectedCamera({ ...selectedCamera, audio_enabled: e.target.checked });
                      } else {
                        setNewCamera({ ...newCamera, audio_enabled: e.target.checked });
                      }
                    }}
                  />
                }
                label="Audio Recording"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={dialogType === 'edit' ? selectedCamera?.continuous_recording || false : newCamera.continuous_recording}
                    onChange={(e) => {
                      if (dialogType === 'edit' && selectedCamera) {
                        setSelectedCamera({ ...selectedCamera, continuous_recording: e.target.checked });
                      } else {
                        setNewCamera({ ...newCamera, continuous_recording: e.target.checked });
                      }
                    }}
                  />
                }
                label="24/7 Recording"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#13bbc6' }}>
            {dialogType === 'add' ? 'Add Camera' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Network Scan Dialog */}
      <Dialog open={scanDialogOpen} onClose={() => setScanDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Network Scan Results</Typography>
            <IconButton onClick={() => setScanDialogOpen(false)}>
              <Cancel />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {scanning ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Scanning network for cameras...
              </Typography>
              <LinearProgress variant="determinate" value={scanProgress} sx={{ mt: 2 }} />
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Found {networkDevices.length} devices on the network:
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Port</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Device Type</TableCell>
                      <TableCell>Manufacturer</TableCell>
                      <TableCell>Model</TableCell>
                      <TableCell>Response Time</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {networkDevices.map((device, index) => (
                      <TableRow key={index}>
                        <TableCell>{device.ip}</TableCell>
                        <TableCell>{device.port}</TableCell>
                        <TableCell>
                          <Chip 
                            label={device.status} 
                            color={device.status === 'online' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{device.deviceType || 'Unknown'}</TableCell>
                        <TableCell>{device.manufacturer || 'Unknown'}</TableCell>
                        <TableCell>{device.model || 'Unknown'}</TableCell>
                        <TableCell>{device.responseTime ? `${device.responseTime}ms` : 'N/A'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Test Connection">
                              <IconButton 
                                size="small" 
                                onClick={() => handleTestCamera(device.ip, device.port)}
                                disabled={testing}
                              >
                                <NetworkCheck />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Add as Camera">
                              <IconButton 
                                size="small" 
                                onClick={() => handleAddFromScan(device)}
                                color="primary"
                              >
                                <Add />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScanDialogOpen(false)}>Close</Button>
          <Button onClick={handleScanNetwork} variant="contained" disabled={scanning}>
            Scan Again
          </Button>
        </DialogActions>
      </Dialog>

      {/* Camera Test Result Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Camera Test Result</Typography>
            <IconButton onClick={() => setTestDialogOpen(false)}>
              <Cancel />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {testing ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Testing camera connection...
              </Typography>
            </Box>
          ) : testResult ? (
            <Box>
              <Alert 
                severity={testResult.status === 'online' ? 'success' : 'error'}
                sx={{ mb: 2 }}
              >
                Camera is {testResult.status}
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">IP Address:</Typography>
                  <Typography variant="body1">{testResult.ip}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Port:</Typography>
                  <Typography variant="body1">{testResult.port}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Response Time:</Typography>
                  <Typography variant="body1">
                    {testResult.responseTime ? `${testResult.responseTime}ms` : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Device Type:</Typography>
                  <Typography variant="body1">{testResult.deviceType || 'Unknown'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Manufacturer:</Typography>
                  <Typography variant="body1">{testResult.manufacturer || 'Unknown'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Model:</Typography>
                  <Typography variant="body1">{testResult.model || 'Unknown'}</Typography>
                </Grid>
              </Grid>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
          {testResult && testResult.status === 'online' && (
            <Button 
              onClick={() => {
                handleAddFromScan(testResult);
                setTestDialogOpen(false);
              }} 
              variant="contained"
            >
              Add Camera
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedSurveillanceManagement;
