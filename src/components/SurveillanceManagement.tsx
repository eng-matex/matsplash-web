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

interface NetworkDevice {
  ip: string;
  port: number;
  status: 'online' | 'offline';
  responseTime?: number;
  deviceType?: string;
  manufacturer?: string;
  model?: string;
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
  const [networkDevices, setNetworkDevices] = useState<NetworkDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testResult, setTestResult] = useState<NetworkDevice | null>(null);
  const [testing, setTesting] = useState(false);

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
      // Fetch real data from API
      const [camerasResponse, credentialsResponse] = await Promise.all([
        fetch('/api/surveillance/cameras'),
        fetch('/api/surveillance/credentials')
      ]);

      if (camerasResponse.ok) {
        const camerasData = await camerasResponse.json();
        const camerasList = camerasData.success ? camerasData.data : [];
        setCameras(camerasList);
        
        // Test camera connectivity and update status
        if (camerasList.length > 0) {
          testCameraConnectivity(camerasList);
        }
      }

      if (credentialsResponse.ok) {
        const credentialsData = await credentialsResponse.json();
        setCameraCredentials(credentialsData.success ? credentialsData.data : []);
      }

      // For now, set empty logs since we don't have a logs endpoint yet
      setSurveillanceLogs([]);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error
      setCameras([]);
      setCameraCredentials([]);
      setSurveillanceLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Test camera connectivity and update status
  const testCameraConnectivity = async (camerasList: Camera[]) => {
    for (const camera of camerasList) {
      try {
        const response = await fetch('/api/surveillance/test-camera', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ip_address: camera.ip_address,
            port: camera.port
          })
        });
        
        const result = await response.json();
        
        if (result.success && result.data.status === 'online') {
          // Update camera status to online
          setCameras(prevCameras => 
            prevCameras.map(c => 
              c.id === camera.id ? { ...c, status: 'online' } : c
            )
          );
        } else {
          // Update camera status to offline
          setCameras(prevCameras => 
            prevCameras.map(c => 
              c.id === camera.id ? { ...c, status: 'offline' } : c
            )
          );
        }
      } catch (error) {
        console.error(`Error testing camera ${camera.name}:`, error);
        // Update camera status to offline on error
        setCameras(prevCameras => 
          prevCameras.map(c => 
            c.id === camera.id ? { ...c, status: 'offline' } : c
          )
        );
      }
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

  const handleSaveCamera = async () => {
    try {
      console.log('🎥 Adding camera with data:', newCamera);
      
      // Validate required fields
      if (!newCamera.name || !newCamera.ip_address) {
        alert('Please fill in the camera name and IP address');
        return;
      }
      
      setLoading(true);
      
      const response = await fetch('/api/surveillance/cameras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCamera)
      });
      
      const result = await response.json();
      console.log('📷 Add camera response:', result);
      
      if (result.success) {
        await fetchData(); // Refresh the camera list
        handleCloseDialog();
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
        alert('Camera added successfully!');
      } else {
        console.error('Failed to add camera:', result.message);
        alert('Failed to add camera: ' + result.message);
      }
    } catch (error) {
      console.error('Error adding camera:', error);
      alert('Error adding camera: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCamera = async () => {
    if (!selectedCamera) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/surveillance/cameras/${selectedCamera.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedCamera)
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchData(); // Refresh the camera list
        handleCloseDialog();
      } else {
        console.error('Failed to update camera:', result.message);
        alert('Failed to update camera: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating camera:', error);
      alert('Error updating camera: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCamera = async (cameraId: number) => {
    if (!confirm('Are you sure you want to delete this camera?')) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/surveillance/cameras/${cameraId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchData(); // Refresh the camera list
      } else {
        console.error('Failed to delete camera:', result.message);
        alert('Failed to delete camera: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting camera:', error);
      alert('Error deleting camera: ' + error.message);
    } finally {
      setLoading(false);
    }
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
      recording_enabled: true
    });
    setDialogType('add');
    setDialogOpen(true);
    setScanDialogOpen(false);
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
                <Tooltip title="Delete Camera">
                  <IconButton size="small" onClick={() => handleDeleteCamera(camera.id)} color="error">
                    <Delete />
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
                    <Tooltip title="Delete Camera">
                      <IconButton size="small" onClick={() => handleDeleteCamera(camera.id)} color="error">
                        <Delete />
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
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Camera</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No surveillance logs available
                    </Typography>
                  </TableCell>
                </TableRow>
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
            border: '2px solid #333',
            position: 'relative'
          }}>
            {fullscreenCamera?.status === 'online' ? (
              <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                <img
                  src={fullscreenCamera.stream_url}
                  alt={fullscreenCamera.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px'
                  }}
                  onError={(e) => {
                    // Hide the broken image and show error message
                    e.currentTarget.style.display = 'none';
                    const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
                    if (errorDiv) errorDiv.style.display = 'flex';
                  }}
                />
                <Box sx={{
                  display: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  textAlign: 'center',
                  p: 2
                }}>
                  <Videocam sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    Camera Stream Unavailable
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                    The camera stream URL is not accessible. This could be due to:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                    • Incorrect stream path
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                    • Camera authentication required
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                    • Camera using RTSP instead of HTTP
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
                    Stream URL: {fullscreenCamera.stream_url}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const newUrl = `http://${fullscreenCamera.ip_address}:${fullscreenCamera.port}/cgi-bin/snapshot.cgi`;
                        setFullscreenCamera({...fullscreenCamera, stream_url: newUrl});
                      }}
                    >
                      Try Snapshot
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const newUrl = `http://${fullscreenCamera.ip_address}:${fullscreenCamera.port}/img/snapshot.cgi`;
                        setFullscreenCamera({...fullscreenCamera, stream_url: newUrl});
                      }}
                    >
                      Try /img/snapshot
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const newUrl = `rtsp://${fullscreenCamera.username}:${fullscreenCamera.password}@${fullscreenCamera.ip_address}:554/stream1`;
                        setFullscreenCamera({...fullscreenCamera, stream_url: newUrl});
                      }}
                    >
                      Try RTSP
                    </Button>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                textAlign: 'center',
                p: 2
              }}>
                <Videocam sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                  Camera Offline
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  This camera is currently offline or unreachable.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
      
      {/* Camera Management Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {(dialogType === 'add' || dialogType === 'new-camera') && 'Add New Camera'}
          {dialogType === 'edit-camera' && 'Edit Camera'}
          {dialogType === 'view-camera' && 'Camera Details'}
        </DialogTitle>
        <DialogContent>
          {(dialogType === 'add' || dialogType === 'new-camera' || dialogType === 'edit-camera') && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Camera Name"
                value={dialogType === 'edit-camera' ? selectedCamera?.name || '' : newCamera.name}
                onChange={(e) => {
                  if (dialogType === 'edit-camera' && selectedCamera) {
                    setSelectedCamera({ ...selectedCamera, name: e.target.value });
                  } else {
                    setNewCamera({ ...newCamera, name: e.target.value });
                  }
                }}
                fullWidth
                required
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="IP Address"
                  value={dialogType === 'edit-camera' ? selectedCamera?.ip_address || '' : newCamera.ip_address}
                  onChange={(e) => {
                    if (dialogType === 'edit-camera' && selectedCamera) {
                      setSelectedCamera({ ...selectedCamera, ip_address: e.target.value });
                    } else {
                      setNewCamera({ ...newCamera, ip_address: e.target.value });
                    }
                  }}
                  fullWidth
                  required
                />
                <TextField
                  label="Port"
                  type="number"
                  value={dialogType === 'edit-camera' ? selectedCamera?.port || 80 : newCamera.port}
                  onChange={(e) => {
                    if (dialogType === 'edit-camera' && selectedCamera) {
                      setSelectedCamera({ ...selectedCamera, port: parseInt(e.target.value) });
                    } else {
                      setNewCamera({ ...newCamera, port: parseInt(e.target.value) });
                    }
                  }}
                  sx={{ width: 120 }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Username"
                  value={dialogType === 'edit-camera' ? selectedCamera?.username || '' : newCamera.username}
                  onChange={(e) => {
                    if (dialogType === 'edit-camera' && selectedCamera) {
                      setSelectedCamera({ ...selectedCamera, username: e.target.value });
                    } else {
                      setNewCamera({ ...newCamera, username: e.target.value });
                    }
                  }}
                  fullWidth
                />
                <TextField
                  label="Password"
                  type="password"
                  value={dialogType === 'edit-camera' ? selectedCamera?.password || '' : newCamera.password}
                  onChange={(e) => {
                    if (dialogType === 'edit-camera' && selectedCamera) {
                      setSelectedCamera({ ...selectedCamera, password: e.target.value });
                    } else {
                      setNewCamera({ ...newCamera, password: e.target.value });
                    }
                  }}
                  fullWidth
                />
              </Box>
              
              <TextField
                label="Location"
                value={dialogType === 'edit-camera' ? selectedCamera?.location || '' : newCamera.location}
                onChange={(e) => {
                  if (dialogType === 'edit-camera' && selectedCamera) {
                    setSelectedCamera({ ...selectedCamera, location: e.target.value });
                  } else {
                    setNewCamera({ ...newCamera, location: e.target.value });
                  }
                }}
                fullWidth
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Model"
                  value={dialogType === 'edit-camera' ? selectedCamera?.model || '' : newCamera.model}
                  onChange={(e) => {
                    if (dialogType === 'edit-camera' && selectedCamera) {
                      setSelectedCamera({ ...selectedCamera, model: e.target.value });
                    } else {
                      setNewCamera({ ...newCamera, model: e.target.value });
                    }
                  }}
                  fullWidth
                />
                <TextField
                  label="Manufacturer"
                  value={dialogType === 'edit-camera' ? selectedCamera?.manufacturer || '' : newCamera.manufacturer}
                  onChange={(e) => {
                    if (dialogType === 'edit-camera' && selectedCamera) {
                      setSelectedCamera({ ...selectedCamera, manufacturer: e.target.value });
                    } else {
                      setNewCamera({ ...newCamera, manufacturer: e.target.value });
                    }
                  }}
                  fullWidth
                />
              </Box>
            </Box>
          )}
          
          {dialogType === 'view-camera' && selectedCamera && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Typography variant="h6">{selectedCamera.name}</Typography>
              <Typography variant="body2"><strong>IP Address:</strong> {selectedCamera.ip_address}:{selectedCamera.port}</Typography>
              <Typography variant="body2"><strong>Location:</strong> {selectedCamera.location}</Typography>
              <Typography variant="body2"><strong>Model:</strong> {selectedCamera.model}</Typography>
              <Typography variant="body2"><strong>Manufacturer:</strong> {selectedCamera.manufacturer}</Typography>
              <Typography variant="body2"><strong>Status:</strong> {selectedCamera.status}</Typography>
              <Typography variant="body2"><strong>Resolution:</strong> {selectedCamera.resolution}</Typography>
              <Typography variant="body2"><strong>FPS:</strong> {selectedCamera.fps}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {(dialogType === 'add' || dialogType === 'new-camera') && (
            <Button 
              variant="contained" 
              sx={{ bgcolor: '#13bbc6' }}
              onClick={handleSaveCamera}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Camera'}
            </Button>
          )}
          {dialogType === 'edit-camera' && (
            <Button 
              variant="contained" 
              sx={{ bgcolor: '#13bbc6' }}
              onClick={handleUpdateCamera}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Camera'}
            </Button>
          )}
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

export default SurveillanceManagement;
