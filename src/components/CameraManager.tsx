import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Tabs,
  Tab,
  Badge,
  Avatar,
  Menu,
  MenuItem as MenuItemComponent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Videocam as VideocamIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  NetworkCheck as NetworkCheckIcon,
  Storage as StorageIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

interface Camera {
  id: string;
  name: string;
  ip: string;
  port: number;
  protocol: 'RTSP' | 'HTTP' | 'HTTPS';
  username: string;
  password: string;
  status: 'online' | 'offline' | 'error';
  lastSeen: string;
  resolution: string;
  brand: string;
  model: string;
  capabilities: string[];
  streamUrl: string;
  thumbnailUrl?: string;
  isRecording: boolean;
  recordingPath?: string;
  motionDetection: boolean;
  nightVision: boolean;
  ptz: boolean;
  audio: boolean;
  location?: string;
  group?: string;
  tags: string[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`camera-tabpanel-${index}`}
      aria-labelledby={`camera-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CameraManager: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock camera data
  useEffect(() => {
    const mockCameras: Camera[] = [
      {
        id: '1',
        name: 'Front Door Camera',
        ip: '192.168.1.100',
        port: 554,
        protocol: 'RTSP',
        username: 'admin',
        password: 'password',
        status: 'online',
        lastSeen: new Date().toISOString(),
        resolution: '1080p',
        brand: 'Hikvision',
        model: 'DS-2CD2143G0-I',
        capabilities: ['PTZ', 'Night Vision', 'Motion Detection', 'Audio'],
        streamUrl: 'rtsp://192.168.1.100:554/stream1',
        thumbnailUrl: '/api/cameras/1/thumbnail',
        isRecording: true,
        recordingPath: '/recordings/camera1/',
        motionDetection: true,
        nightVision: true,
        ptz: true,
        audio: true,
        location: 'Front Entrance',
        group: 'Security',
        tags: ['entrance', 'security', 'main']
      },
      {
        id: '2',
        name: 'Backyard Camera',
        ip: '192.168.1.101',
        port: 8080,
        protocol: 'HTTP',
        username: 'admin',
        password: 'password',
        status: 'online',
        lastSeen: new Date().toISOString(),
        resolution: '4K',
        brand: 'Dahua',
        model: 'IPC-HFW4431R-Z',
        capabilities: ['Night Vision', 'Motion Detection', 'Audio'],
        streamUrl: 'http://192.168.1.101:8080/video.mjpg',
        thumbnailUrl: '/api/cameras/2/thumbnail',
        isRecording: false,
        motionDetection: true,
        nightVision: true,
        ptz: false,
        audio: true,
        location: 'Backyard',
        group: 'Security',
        tags: ['backyard', 'security']
      },
      {
        id: '3',
        name: 'Parking Lot Camera',
        ip: '192.168.1.102',
        port: 554,
        protocol: 'RTSP',
        username: 'admin',
        password: 'password',
        status: 'offline',
        lastSeen: new Date(Date.now() - 3600000).toISOString(),
        resolution: '1080p',
        brand: 'Axis',
        model: 'M3045-V',
        capabilities: ['PTZ', 'Night Vision', 'Motion Detection'],
        streamUrl: 'rtsp://192.168.1.102:554/stream1',
        thumbnailUrl: '/api/cameras/3/thumbnail',
        isRecording: false,
        motionDetection: true,
        nightVision: true,
        ptz: true,
        audio: false,
        location: 'Parking Lot',
        group: 'Security',
        tags: ['parking', 'security']
      }
    ];
    setCameras(mockCameras);
  }, []);

  const filteredCameras = cameras.filter(camera => {
    const matchesStatus = filterStatus === 'all' || camera.status === filterStatus;
    const matchesSearch = camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         camera.ip.includes(searchTerm) ||
                         camera.location?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: Camera['status']) => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'error';
      case 'error': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: Camera['status']) => {
    switch (status) {
      case 'online': return <CheckCircleIcon />;
      case 'offline': return <ErrorIcon />;
      case 'error': return <WarningIcon />;
      default: return <InfoIcon />;
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, camera: Camera) => {
    setAnchorEl(event.currentTarget);
    setSelectedCamera(camera);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCamera(null);
  };

  const handleEditCamera = (camera: Camera) => {
    setSelectedCamera(camera);
    setShowEditDialog(true);
    handleMenuClose();
  };

  const handleDeleteCamera = (camera: Camera) => {
    setCameras(prev => prev.filter(c => c.id !== camera.id));
    handleMenuClose();
  };

  const handleToggleRecording = (camera: Camera) => {
    setCameras(prev => prev.map(c => 
      c.id === camera.id ? { ...c, isRecording: !c.isRecording } : c
    ));
  };

  const handleToggleMotionDetection = (camera: Camera) => {
    setCameras(prev => prev.map(c => 
      c.id === camera.id ? { ...c, motionDetection: !c.motionDetection } : c
    ));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VideocamIcon />
        Camera Management
      </Typography>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                label="Search cameras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                >
                  <MenuItem value="all">All Cameras</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                fullWidth
              >
                Refresh All
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowAddDialog(true)}
                fullWidth
              >
                Add Camera
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Camera Grid */}
      <Grid container spacing={3}>
        {filteredCameras.map((camera) => (
          <Grid item xs={12} md={6} lg={4} key={camera.id}>
            <Card sx={{ height: '100%', position: 'relative' }}>
              <CardContent>
                {/* Camera Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                    <VideocamIcon />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{camera.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {camera.ip}:{camera.port}
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={(e) => handleMenuClick(e, camera)}
                    size="small"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                {/* Camera Status */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip
                    icon={getStatusIcon(camera.status)}
                    label={camera.status.toUpperCase()}
                    color={getStatusColor(camera.status) as any}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {camera.isRecording && (
                    <Chip
                      label="REC"
                      color="error"
                      size="small"
                      sx={{ mr: 1 }}
                    />
                  )}
                  {camera.motionDetection && (
                    <Chip
                      label="MOTION"
                      color="warning"
                      size="small"
                    />
                  )}
                </Box>

                {/* Camera Info */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Brand:</strong> {camera.brand} {camera.model}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Resolution:</strong> {camera.resolution}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Location:</strong> {camera.location}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Last Seen:</strong> {new Date(camera.lastSeen).toLocaleString()}
                  </Typography>
                </Box>

                {/* Capabilities */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Capabilities:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {camera.capabilities.map((capability) => (
                      <Chip
                        key={capability}
                        label={capability}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                {/* Tags */}
                {camera.tags.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tags:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {camera.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={camera.isRecording ? <StopIcon /> : <PlayIcon />}
                    onClick={() => handleToggleRecording(camera)}
                    fullWidth
                  >
                    {camera.isRecording ? 'Stop' : 'Start'} Recording
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SettingsIcon />}
                    onClick={() => handleEditCamera(camera)}
                    fullWidth
                  >
                    Settings
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItemComponent onClick={() => selectedCamera && handleEditCamera(selectedCamera)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Camera
        </MenuItemComponent>
        <MenuItemComponent onClick={() => selectedCamera && handleToggleRecording(selectedCamera)}>
          {selectedCamera?.isRecording ? <StopIcon sx={{ mr: 1 }} /> : <PlayIcon sx={{ mr: 1 }} />}
          {selectedCamera?.isRecording ? 'Stop' : 'Start'} Recording
        </MenuItemComponent>
        <MenuItemComponent onClick={() => selectedCamera && handleToggleMotionDetection(selectedCamera)}>
          {selectedCamera?.motionDetection ? <VisibilityOffIcon sx={{ mr: 1 }} /> : <VisibilityIcon sx={{ mr: 1 }} />}
          {selectedCamera?.motionDetection ? 'Disable' : 'Enable'} Motion Detection
        </MenuItemComponent>
        <Divider />
        <MenuItemComponent 
          onClick={() => selectedCamera && handleDeleteCamera(selectedCamera)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Camera
        </MenuItemComponent>
      </Menu>

      {/* Add Camera Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Camera</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Camera Name"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="IP Address"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Port"
                type="number"
                fullWidth
                defaultValue={554}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Protocol</InputLabel>
                <Select defaultValue="RTSP">
                  <MenuItem value="RTSP">RTSP</MenuItem>
                  <MenuItem value="HTTP">HTTP</MenuItem>
                  <MenuItem value="HTTPS">HTTPS</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Username"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Password"
                type="password"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Location"
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                multiline
                rows={3}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button variant="contained">Add Camera</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Camera Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Camera: {selectedCamera?.name}</DialogTitle>
        <DialogContent>
          {selectedCamera && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Camera Name"
                  defaultValue={selectedCamera.name}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="IP Address"
                  defaultValue={selectedCamera.ip}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Port"
                  type="number"
                  defaultValue={selectedCamera.port}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Protocol</InputLabel>
                  <Select defaultValue={selectedCamera.protocol}>
                    <MenuItem value="RTSP">RTSP</MenuItem>
                    <MenuItem value="HTTP">HTTP</MenuItem>
                    <MenuItem value="HTTPS">HTTPS</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Username"
                  defaultValue={selectedCamera.username}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Password"
                  type="password"
                  defaultValue={selectedCamera.password}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Location"
                  defaultValue={selectedCamera.location}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch defaultChecked={selectedCamera.motionDetection} />}
                  label="Motion Detection"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch defaultChecked={selectedCamera.nightVision} />}
                  label="Night Vision"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CameraManager;
