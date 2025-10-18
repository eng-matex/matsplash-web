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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  Autocomplete,
  FormControlLabel as MuiFormControlLabel,
  Checkbox,
  FormGroup,
  LinearProgress,
  Badge,
  Avatar,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Switch,
  Slider,
  FormControlLabel as SwitchFormControlLabel,
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
  Print,
  Download,
  Upload,
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
  RecordVoiceOver,
  Mic,
  MicOff,
  Security,
  Warning,
  Notifications,
  NotificationsActive,
  NotificationsOff,
  CameraAlt,
  CameraEnhance,
  CameraRoll,
  CameraFront,
  CameraRear,
  LocationOn,
  NetworkCheck,
  Wifi,
  WifiOff,
  SignalWifi4Bar,
  SignalWifiOff,
  Storage,
  CloudUpload,
  CloudDownload,
  CloudSync,
  History,
  Assessment,
  Timeline,
  Schedule,
  Person,
  Group,
  TrendingUp,
  TrendingDown,
  CheckCircleOutline,
  Remove,
  AddCircle,
  RemoveCircle,
  Business,
  AttachMoney,
  Receipt,
  ShoppingCart,
  Save,
  Close,
  Login,
  Logout,
  Timer,
  Today,
  DateRange,
  RestartAlt,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import axios from 'axios';

interface SurveillanceManagementProps {
  selectedSection: string;
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
  storage_used: number;
  storage_total: number;
  created_at: string;
  updated_at: string;
}

interface CameraCredentials {
  id: number;
  username: string;
  password: string;
  description: string;
  is_default: boolean;
  created_at: string;
}

interface SurveillanceLog {
  id: number;
  camera_id: number;
  camera_name: string;
  event_type: 'motion_detected' | 'connection_lost' | 'connection_restored' | 'recording_started' | 'recording_stopped' | 'maintenance' | 'error';
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  notes?: string;
}

const SurveillanceManagement: React.FC<SurveillanceManagementProps> = ({ selectedSection, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [cameraCredentials, setCameraCredentials] = useState<CameraCredentials[]>([]);
  const [surveillanceLogs, setSurveillanceLogs] = useState<SurveillanceLog[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [selectedCredentials, setSelectedCredentials] = useState<CameraCredentials | null>(null);
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
    recording_enabled: true
  });
  const [newCredentials, setNewCredentials] = useState<Partial<CameraCredentials>>({
    username: '',
    password: '',
    description: '',
    is_default: false
  });
  const [fullscreenCamera, setFullscreenCamera] = useState<Camera | null>(null);
  const [selectedView, setSelectedView] = useState('grid');

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
    'Bosch FLEXIDOME IP 7000',
    'Sony SNC-VM772R',
    'Panasonic WV-SC385',
    'Samsung SNV-6013M',
    'Avigilon H4A',
    'Uniview IPC2322ER3-DPF28',
    'Tiandy TC-NC4410'
  ];

  const manufacturers = [
    'Hikvision',
    'Dahua',
    'Axis',
    'Bosch',
    'Sony',
    'Panasonic',
    'Samsung',
    'Avigilon',
    'Uniview',
    'Tiandy'
  ];

  useEffect(() => {
    fetchData();
  }, [selectedSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mock data for cameras
      const mockCameras: Camera[] = [
        {
          id: 1,
          name: 'Main Entrance Camera',
          ip_address: '192.168.1.100',
          port: 80,
          username: 'admin',
          password: 'password123',
          stream_url: 'rtsp://192.168.1.100:554/stream1',
          status: 'online',
          location: 'Main Entrance',
          model: 'Hikvision DS-2CD2143G0-I',
          manufacturer: 'Hikvision',
          last_seen: new Date().toISOString(),
          resolution: '1920x1080',
          fps: 30,
          night_vision: true,
          motion_detection: true,
          audio_enabled: true,
          recording_enabled: true,
          storage_used: 45.2,
          storage_total: 100,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Loading Bay Camera',
          ip_address: '192.168.1.101',
          port: 80,
          username: 'admin',
          password: 'password123',
          stream_url: 'rtsp://192.168.1.101:554/stream1',
          status: 'online',
          location: 'Loading Bay',
          model: 'Dahua IPC-HFW4431R-Z',
          manufacturer: 'Dahua',
          last_seen: new Date(Date.now() - 300000).toISOString(),
          resolution: '2560x1440',
          fps: 25,
          night_vision: true,
          motion_detection: true,
          audio_enabled: false,
          recording_enabled: true,
          storage_used: 67.8,
          storage_total: 200,
          created_at: '2024-01-15T00:00:00Z',
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Production Floor Camera',
          ip_address: '192.168.1.102',
          port: 80,
          username: 'admin',
          password: 'password123',
          stream_url: 'rtsp://192.168.1.102:554/stream1',
          status: 'offline',
          location: 'Production Floor',
          model: 'Axis M3046-V',
          manufacturer: 'Axis',
          last_seen: new Date(Date.now() - 3600000).toISOString(),
          resolution: '1920x1080',
          fps: 30,
          night_vision: false,
          motion_detection: true,
          audio_enabled: true,
          recording_enabled: false,
          storage_used: 23.1,
          storage_total: 100,
          created_at: '2024-02-01T00:00:00Z',
          updated_at: new Date().toISOString()
        },
        {
          id: 4,
          name: 'Warehouse Camera',
          ip_address: '192.168.1.103',
          port: 80,
          username: 'admin',
          password: 'password123',
          stream_url: 'rtsp://192.168.1.103:554/stream1',
          status: 'maintenance',
          location: 'Warehouse',
          model: 'Bosch FLEXIDOME IP 7000',
          manufacturer: 'Bosch',
          last_seen: new Date(Date.now() - 1800000).toISOString(),
          resolution: '1920x1080',
          fps: 30,
          night_vision: true,
          motion_detection: true,
          audio_enabled: false,
          recording_enabled: true,
          storage_used: 89.3,
          storage_total: 150,
          created_at: '2024-02-15T00:00:00Z',
          updated_at: new Date().toISOString()
        }
      ];

      const mockCredentials: CameraCredentials[] = [
        {
          id: 1,
          username: 'admin',
          password: 'password123',
          description: 'Default admin credentials',
          is_default: true,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          username: 'security',
          password: 'security456',
          description: 'Security team credentials',
          is_default: false,
          created_at: '2024-01-15T00:00:00Z'
        },
        {
          id: 3,
          username: 'viewer',
          password: 'viewer789',
          description: 'Read-only viewer credentials',
          is_default: false,
          created_at: '2024-02-01T00:00:00Z'
        }
      ];

      const mockLogs: SurveillanceLog[] = [
        {
          id: 1,
          camera_id: 1,
          camera_name: 'Main Entrance Camera',
          event_type: 'motion_detected',
          description: 'Motion detected at main entrance',
          timestamp: new Date().toISOString(),
          severity: 'medium',
          resolved: false,
          notes: 'Person detected entering building'
        },
        {
          id: 2,
          camera_id: 3,
          camera_name: 'Production Floor Camera',
          event_type: 'connection_lost',
          description: 'Camera connection lost',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          severity: 'high',
          resolved: false,
          notes: 'Network connectivity issue'
        },
        {
          id: 3,
          camera_id: 2,
          camera_name: 'Loading Bay Camera',
          event_type: 'recording_started',
          description: 'Recording started automatically',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          severity: 'low',
          resolved: true,
          notes: 'Motion-triggered recording'
        },
        {
          id: 4,
          camera_id: 4,
          camera_name: 'Warehouse Camera',
          event_type: 'maintenance',
          description: 'Camera maintenance scheduled',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          severity: 'medium',
          resolved: false,
          notes: 'Lens cleaning and firmware update'
        }
      ];

      setCameras(mockCameras);
      setCameraCredentials(mockCredentials);
      setSurveillanceLogs(mockLogs);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleOpenDialog = (type: string, item?: Camera | CameraCredentials) => {
    setDialogType(type);
    if (item && 'ip_address' in item) {
      setSelectedCamera(item as Camera);
    } else if (item && 'description' in item) {
      setSelectedCredentials(item as CameraCredentials);
    } else {
      setSelectedCamera(null);
      setSelectedCredentials(null);
    }
    
    if (type === 'new-camera') {
      setNewCamera({
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
        recording_enabled: true
      });
    } else if (type === 'new-credentials') {
      setNewCredentials({
        username: '',
        password: '',
        description: '',
        is_default: false
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setSelectedCamera(null);
    setSelectedCredentials(null);
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

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'motion_detected': return <Warning />;
      case 'connection_lost': return <WifiOff />;
      case 'connection_restored': return <Wifi />;
      case 'recording_started': return <PlayArrow />;
      case 'recording_stopped': return <Stop />;
      case 'maintenance': return <Settings />;
      case 'error': return <Cancel />;
      default: return <Notifications />;
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
      {filteredCameras.map((camera) => (
        <Grid item xs={12} sm={6} md={4} key={camera.id}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                  {camera.name}
                </Typography>
                <Chip 
                  label={camera.status.charAt(0).toUpperCase() + camera.status.slice(1)} 
                  color={getStatusColor(camera.status) as any}
                  size="small"
                  icon={getStatusIcon(camera.status)}
                />
              </Box>
              
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Live Feed
                </Typography>
                <Box sx={{ 
                  width: '100%', 
                  height: 120, 
                  bgcolor: camera.status === 'online' ? '#e8f5e8' : '#ffebee',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #ccc'
                }}>
                  {camera.status === 'online' ? (
                    <Videocam sx={{ fontSize: 40, color: '#4caf50' }} />
                  ) : (
                    <VideocamOff sx={{ fontSize: 40, color: '#f44336' }} />
                  )}
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Location:</strong> {camera.location}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>IP:</strong> {camera.ip_address}:{camera.port}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Model:</strong> {camera.model}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Resolution:</strong> {camera.resolution} @ {camera.fps}fps
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Storage: {camera.storage_used}GB / {camera.storage_total}GB
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(camera.storage_used / camera.storage_total) * 100}
                  color={camera.storage_used / camera.storage_total > 0.8 ? 'error' : 'primary'}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {camera.night_vision && <Chip label="Night Vision" size="small" color="info" />}
                {camera.motion_detection && <Chip label="Motion Detection" size="small" color="warning" />}
                {camera.audio_enabled && <Chip label="Audio" size="small" color="success" />}
                {camera.recording_enabled && <Chip label="Recording" size="small" color="secondary" />}
              </Box>

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Tooltip title="View Live Feed">
                  <IconButton size="small" onClick={() => setFullscreenCamera(camera)}>
                    <Fullscreen />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Camera Settings">
                  <IconButton size="small" onClick={() => handleOpenDialog('edit-camera', camera)}>
                    <Settings />
                  </IconButton>
                </Tooltip>
                <Tooltip title="View Details">
                  <IconButton size="small" onClick={() => handleOpenDialog('view-camera', camera)}>
                    <Visibility />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderCameraList = () => (
    <Card>
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Camera</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Storage</TableCell>
                <TableCell>Features</TableCell>
                <TableCell>Last Seen</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCameras.map((camera) => (
                <TableRow key={camera.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {camera.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {camera.model}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {camera.location}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {camera.ip_address}:{camera.port}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={camera.status.charAt(0).toUpperCase() + camera.status.slice(1)} 
                      color={getStatusColor(camera.status) as any}
                      size="small"
                      icon={getStatusIcon(camera.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {camera.storage_used}GB / {camera.storage_total}GB
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(camera.storage_used / camera.storage_total) * 100}
                        color={camera.storage_used / camera.storage_total > 0.8 ? 'error' : 'primary'}
                        sx={{ width: 60 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {camera.night_vision && <Chip label="NV" size="small" color="info" />}
                      {camera.motion_detection && <Chip label="MD" size="small" color="warning" />}
                      {camera.audio_enabled && <Chip label="AUD" size="small" color="success" />}
                      {camera.recording_enabled && <Chip label="REC" size="small" color="secondary" />}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(camera.last_seen).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Live Feed">
                      <IconButton size="small" onClick={() => setFullscreenCamera(camera)}>
                        <Fullscreen />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Camera Settings">
                      <IconButton size="small" onClick={() => handleOpenDialog('edit-camera', camera)}>
                        <Settings />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => handleOpenDialog('view-camera', camera)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderSurveillanceOverview = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Surveillance Center
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={selectedView === 'grid' ? 'contained' : 'outlined'}
            onClick={() => setSelectedView('grid')}
            startIcon={<CameraAlt />}
          >
            Grid View
          </Button>
          <Button
            variant={selectedView === 'list' ? 'contained' : 'outlined'}
            onClick={() => setSelectedView('list')}
            startIcon={<List />}
          >
            List View
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog('new-camera')}
            sx={{ bgcolor: '#13bbc6' }}
          >
            Add Camera
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
                  <Typography variant="body2" color="text.secondary">
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
                  <VideocamOff />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {cameras.filter(c => c.status === 'offline').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Offline Cameras
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
                  <Warning />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {surveillanceLogs.filter(l => !l.resolved && l.severity === 'high').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Alerts
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
                  <Storage />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {cameras.reduce((sum, c) => sum + c.storage_used, 0).toFixed(1)}GB
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Storage Used
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Cameras"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  label="Location"
                >
                  <MenuItem value="all">All Locations</MenuItem>
                  {cameraLocations.map((location) => (
                    <MenuItem key={location} value={location}>
                      {location}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setLocationFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Camera View */}
      {selectedView === 'grid' ? renderCameraGrid() : renderCameraList()}
    </Box>
  );

  const renderSurveillanceLogs = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Surveillance Logs
      </Typography>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Camera</TableCell>
                  <TableCell>Event Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {surveillanceLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {log.camera_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getEventIcon(log.event_type)}
                        <Typography sx={{ ml: 1, textTransform: 'capitalize' }}>
                          {log.event_type.replace('_', ' ')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={log.severity.charAt(0).toUpperCase() + log.severity.slice(1)} 
                        color={getSeverityColor(log.severity) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(log.timestamp).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={log.resolved ? 'Resolved' : 'Active'} 
                        color={log.resolved ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Mark as Resolved">
                        <IconButton size="small">
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      );
    }

    switch (selectedSection) {
      case 'surveillance':
        return renderSurveillanceOverview();
      case 'surveillance-logs':
        return renderSurveillanceLogs();
      default:
        return renderSurveillanceOverview();
    }
  };

  return (
    <Box>
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
      
      {/* Camera Management Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'new-camera' && 'Add New Camera'}
          {dialogType === 'edit-camera' && 'Edit Camera'}
          {dialogType === 'view-camera' && 'Camera Details'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogType === 'new-camera' && 'Camera creation functionality will be implemented here.'}
            {dialogType === 'edit-camera' && 'Camera editing functionality will be implemented here.'}
            {dialogType === 'view-camera' && 'Camera details view will be implemented here.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'new-camera' && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }}>
              Add Camera
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SurveillanceManagement;
