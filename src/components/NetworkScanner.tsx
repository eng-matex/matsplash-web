import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
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
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Wifi as WifiIcon,
  Security as SecurityIcon,
  Videocam as VideocamIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  NetworkCheck as NetworkCheckIcon,
  Router as RouterIcon,
  Computer as ComputerIcon,
  Smartphone as SmartphoneIcon
} from '@mui/icons-material';

interface NetworkDevice {
  ip: string;
  hostname?: string;
  mac?: string;
  vendor?: string;
  deviceType: 'camera' | 'router' | 'computer' | 'phone' | 'unknown';
  ports: number[];
  services: string[];
  isOnline: boolean;
  responseTime?: number;
  cameraInfo?: {
    brand?: string;
    model?: string;
    firmware?: string;
    resolution?: string;
    capabilities?: string[];
  };
}

interface NetworkRange {
  start: string;
  end: string;
  subnet: string;
}

const NetworkScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [scanRange, setScanRange] = useState<NetworkRange>({
    start: '192.168.1.1',
    end: '192.168.1.254',
    subnet: '192.168.1.0/24'
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);
  const [credentialSets, setCredentialSets] = useState<any[]>([]);
  const [selectedCredentialSet, setSelectedCredentialSet] = useState<number | null>(null);
  const [existingCameras, setExistingCameras] = useState<any[]>([]);
  const [cameraCredentials, setCameraCredentials] = useState({
    username: '',
    password: '',
    port: 554,
    protocol: 'RTSP'
  });

  // Common camera ports and services
  const cameraPorts = [80, 443, 554, 8080, 8554, 1935, 8000, 8001, 8002];
  const cameraServices = ['rtsp', 'http', 'https', 'onvif', 'mjpeg'];

  // Fetch credential sets on component mount
  useEffect(() => {
    fetchCredentialSets();
    fetchExistingCameras();
  }, []);

  // Fetch existing cameras to filter them out from scan results
  const fetchExistingCameras = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/surveillance/cameras', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success && data.cameras) {
        setExistingCameras(data.cameras);
      }
    } catch (error) {
      console.error('Error fetching existing cameras:', error);
    }
  };

  const fetchCredentialSets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/surveillance/credentials', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success && data.credentials) {
        setCredentialSets(data.credentials);
      }
    } catch (error) {
      console.error('Error fetching credential sets:', error);
    }
  };

  // Real network scanning with progress simulation
  const scanNetwork = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanStatus('Initializing scan...');
    setDevices([]);

    // Simulate progress updates (slower)
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev < 90) {
          const newProgress = prev + Math.random() * 5; // Reduced from 15 to 5
          if (newProgress < 30) {
            setScanStatus('Scanning network range...');
          } else if (newProgress < 60) {
            setScanStatus('Checking device ports...');
          } else if (newProgress < 90) {
            setScanStatus('Identifying device types...');
          }
          return Math.min(newProgress, 90);
        }
        return prev;
      });
    }, 500); // Increased from 200ms to 500ms

    try {
      const token = localStorage.getItem('token');
      setScanStatus('Connecting to scan service...');
      
      const response = await fetch('http://localhost:3002/api/network/scan-network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          startIP: scanRange.start,
          endIP: scanRange.end,
          subnet: scanRange.subnet,
          networkRange: `${scanRange.start}-${scanRange.end}`
        })
      });

      if (!response.ok) {
        throw new Error('Network scan failed');
      }

      const data = await response.json();
      if (data.success) {
        const discoveredDevices = data.devices || [];
        
        // Filter out devices that are already added as cameras
        const existingCameraIPs = existingCameras.map(camera => camera.ip_address);
        const filteredDevices = discoveredDevices.filter(device => 
          !existingCameraIPs.includes(device.ip)
        );
        
        setDevices(filteredDevices);
        setScanProgress(100);
        setScanStatus('Scan completed successfully!');
        
        // Show scan summary
        const cameraCount = filteredDevices.filter(d => d.deviceType === 'camera').length;
        const filteredCount = discoveredDevices.length - filteredDevices.length;
        console.log(`🔍 Network scan complete: Found ${discoveredDevices.length} devices, ${cameraCount} new cameras (${filteredCount} already added)`);
      } else {
        throw new Error(data.message || 'Network scan failed');
      }
    } catch (error) {
      console.error('Network scan error:', error);
      // Show error instead of fallback to mock data
      alert('Network scan failed: ' + error.message);
      setDevices([]);
      setScanStatus('Scan failed');
    }

    clearInterval(progressInterval);
    setIsScanning(false);
    
    // Clear status after 3 seconds
    setTimeout(() => {
      setScanStatus('');
    }, 3000);
  };

  // Remove mock data functions - now using real API calls

  // Add camera from network scan
  const addCameraFromScan = async (device: NetworkDevice) => {
    if (device.deviceType !== 'camera') {
      alert('This device is not detected as a camera');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/surveillance/cameras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: device.hostname || `Camera-${device.ip.split('.').pop()}`,
          ip_address: device.ip,
          port: cameraCredentials.port,
          username: cameraCredentials.username,
          password: cameraCredentials.password,
          stream_url: `rtsp://${cameraCredentials.username}:${cameraCredentials.password}@${device.ip}:${cameraCredentials.port}/live`,
          location: 'Network Scanned',
          status: 'offline',
          credential_set_id: selectedCredentialSet
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Camera added successfully!');
        setShowAddDialog(false);
        setSelectedDevice(null);
        // Remove the added camera from the devices list
        setDevices(prev => prev.filter(d => d.ip !== device.ip));
        // Refresh the devices list to update status
        scanNetwork();
      } else {
        alert('Failed to add camera: ' + data.message);
      }
    } catch (error) {
      alert('Failed to add camera: ' + error.message);
    }
  };

  const getDeviceIcon = (deviceType: NetworkDevice['deviceType']) => {
    switch (deviceType) {
      case 'camera': return <VideocamIcon />;
      case 'router': return <RouterIcon />;
      case 'computer': return <ComputerIcon />;
      case 'phone': return <SmartphoneIcon />;
      default: return <NetworkCheckIcon />;
    }
  };

  const getDeviceColor = (deviceType: NetworkDevice['deviceType']) => {
    switch (deviceType) {
      case 'camera': return 'primary';
      case 'router': return 'secondary';
      case 'computer': return 'success';
      case 'phone': return 'info';
      default: return 'default';
    }
  };

  const handleAddCamera = (device: NetworkDevice) => {
    setSelectedDevice(device);
    setShowAddDialog(true);
  };

  const handleSaveCamera = async () => {
    if (!selectedDevice) return;

    try {
      // Here you would make an API call to add the camera
      console.log('Adding camera:', {
        ...selectedDevice,
        credentials: cameraCredentials
      });
      
      setShowAddDialog(false);
      setSelectedDevice(null);
      setCameraCredentials({ username: '', password: '', port: 554, protocol: 'RTSP' });
    } catch (error) {
      console.error('Error adding camera:', error);
    }
  };

  const cameras = devices.filter(device => device.deviceType === 'camera');
  const otherDevices = devices.filter(device => device.deviceType !== 'camera');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SearchIcon />
        Network Camera Scanner
      </Typography>

      {/* Scan Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                label="Start IP"
                value={scanRange.start}
                onChange={(e) => setScanRange(prev => ({ ...prev, start: e.target.value }))}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="End IP"
                value={scanRange.end}
                onChange={(e) => setScanRange(prev => ({ ...prev, end: e.target.value }))}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Subnet"
                value={scanRange.subnet}
                onChange={(e) => setScanRange(prev => ({ ...prev, subnet: e.target.value }))}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                onClick={scanNetwork}
                disabled={isScanning}
                startIcon={isScanning ? <RefreshIcon /> : <SearchIcon />}
                fullWidth
              >
                {isScanning ? 'Scanning...' : 'Scan Network'}
              </Button>
            </Grid>
          </Grid>

          {isScanning && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={scanProgress} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {scanStatus || `Scanning ${scanRange.start} - ${scanRange.end}`} ({Math.round(scanProgress)}%)
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Scan Results */}
      {devices.length > 0 && (
        <>
          {/* Cameras Found */}
          {cameras.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VideocamIcon color="primary" />
                  Cameras Found ({cameras.length})
                </Typography>
                <Grid container spacing={2}>
                  {cameras.map((camera, index) => (
                    <Grid item xs={12} md={6} lg={4} key={index}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <VideocamIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6">{camera.ip}</Typography>
                            <Chip 
                              label="Camera" 
                              color="primary" 
                              size="small" 
                              sx={{ ml: 'auto' }}
                            />
                          </Box>

                          {camera.cameraInfo && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Brand:</strong> {camera.cameraInfo.brand}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Model:</strong> {camera.cameraInfo.model}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Resolution:</strong> {camera.cameraInfo.resolution}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Response Time:</strong> {camera.responseTime}ms
                              </Typography>
                            </Box>
                          )}

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            {camera.ports.map(port => (
                              <Chip key={port} label={port} size="small" />
                            ))}
                          </Box>

                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleAddCamera(camera)}
                            fullWidth
                          >
                            Add Camera
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Other Devices */}
          {otherDevices.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NetworkCheckIcon />
                  Other Network Devices ({otherDevices.length})
                </Typography>
                <Grid container spacing={2}>
                  {otherDevices.map((device, index) => (
                    <Grid item xs={12} md={6} lg={4} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {getDeviceIcon(device.deviceType)}
                            <Typography variant="h6" sx={{ ml: 1 }}>{device.ip}</Typography>
                            <Chip 
                              label={device.deviceType} 
                              color={getDeviceColor(device.deviceType) as any}
                              size="small" 
                              sx={{ ml: 'auto' }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {device.hostname} • {device.vendor}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Response: {device.responseTime}ms
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add Camera Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Add Camera: {selectedDevice?.ip}
        </DialogTitle>
        <DialogContent>
          {selectedDevice && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Credential Set</InputLabel>
                    <Select
                      value={selectedCredentialSet || ''}
                      onChange={(e) => {
                        const credentialSetId = e.target.value as number;
                        setSelectedCredentialSet(credentialSetId);
                        const credSet = credentialSets.find(cs => cs.id === credentialSetId);
                        if (credSet) {
                          setCameraCredentials(prev => ({
                            ...prev,
                            username: credSet.username,
                            password: credSet.password,
                            port: credSet.default_port
                          }));
                        }
                      }}
                    >
                      <MenuItem value="">
                        <em>Manual Entry</em>
                      </MenuItem>
                      {credentialSets.map((credSet) => (
                        <MenuItem key={credSet.id} value={credSet.id}>
                          {credSet.name} ({credSet.username})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Username"
                    value={cameraCredentials.username}
                    onChange={(e) => setCameraCredentials(prev => ({ ...prev, username: e.target.value }))}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Password"
                    type="password"
                    value={cameraCredentials.password}
                    onChange={(e) => setCameraCredentials(prev => ({ ...prev, password: e.target.value }))}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Port"
                    type="number"
                    value={cameraCredentials.port}
                    onChange={(e) => setCameraCredentials(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Protocol</InputLabel>
                    <Select
                      value={cameraCredentials.protocol}
                      onChange={(e) => setCameraCredentials(prev => ({ ...prev, protocol: e.target.value }))}
                    >
                      <MenuItem value="RTSP">RTSP</MenuItem>
                      <MenuItem value="HTTP">HTTP</MenuItem>
                      <MenuItem value="HTTPS">HTTPS</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {selectedDevice.cameraInfo && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Camera Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>Brand:</strong> {selectedDevice.cameraInfo.brand}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>Model:</strong> {selectedDevice.cameraInfo.model}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>Firmware:</strong> {selectedDevice.cameraInfo.firmware}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>Resolution:</strong> {selectedDevice.cameraInfo.resolution}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveCamera} variant="contained">Add Camera</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NetworkScanner;
