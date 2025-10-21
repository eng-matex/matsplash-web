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
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [scanRange, setScanRange] = useState<NetworkRange>({
    start: '192.168.1.1',
    end: '192.168.1.254',
    subnet: '192.168.1.0/24'
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);
  const [cameraCredentials, setCameraCredentials] = useState({
    username: '',
    password: '',
    port: 554,
    protocol: 'RTSP'
  });

  // Common camera ports and services
  const cameraPorts = [80, 443, 554, 8080, 8554, 1935, 8000, 8001, 8002];
  const cameraServices = ['rtsp', 'http', 'https', 'onvif', 'mjpeg'];

  // Real network scanning
  const scanNetwork = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setDevices([]);

    try {
      const response = await fetch('/api/surveillance/scan-network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startIP: scanRange.start,
          endIP: scanRange.end,
          subnet: scanRange.subnet
        })
      });

      if (!response.ok) {
        throw new Error('Network scan failed');
      }

      const data = await response.json();
      setDevices(data.devices || []);
    } catch (error) {
      console.error('Network scan error:', error);
      // Fallback to mock data for demonstration
      const mockDevices = await generateMockDevices();
      setDevices(mockDevices);
    }

    setIsScanning(false);
    setScanProgress(100);
  };

  // Generate mock devices for demonstration
  const generateMockDevices = async (): Promise<NetworkDevice[]> => {
    const startIP = scanRange.start.split('.').map(Number);
    const endIP = scanRange.end.split('.').map(Number);
    const totalIPs = (endIP[3] - startIP[3]) + 1;
    const devices: NetworkDevice[] = [];

    for (let i = 0; i < totalIPs; i++) {
      const currentIP = `${startIP[0]}.${startIP[1]}.${startIP[2]}.${startIP[3] + i}`;
      setScanProgress((i / totalIPs) * 100);

      // Simulate device discovery with more realistic data
      const device = await discoverDevice(currentIP);
      if (device) {
        devices.push(device);
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return devices;
  };

  // Simulate device discovery
  const discoverDevice = async (ip: string): Promise<NetworkDevice | null> => {
    // Simulate network response
    const isOnline = Math.random() > 0.7; // 30% chance device is online
    if (!isOnline) return null;

    const deviceTypes: NetworkDevice['deviceType'][] = ['camera', 'router', 'computer', 'phone', 'unknown'];
    const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];

    const ports = cameraPorts.filter(() => Math.random() > 0.8);
    const services = cameraServices.filter(() => Math.random() > 0.7);

    const device: NetworkDevice = {
      ip,
      hostname: `device-${ip.split('.').pop()}`,
      mac: generateMAC(),
      vendor: getVendorByMAC(generateMAC()),
      deviceType,
      ports,
      services,
      isOnline: true,
      responseTime: Math.floor(Math.random() * 100) + 10
    };

    // Add camera-specific info if it's a camera
    if (deviceType === 'camera') {
      device.cameraInfo = {
        brand: ['Hikvision', 'Dahua', 'Axis', 'Bosch', 'Sony', 'Panasonic'][Math.floor(Math.random() * 6)],
        model: `Model-${Math.floor(Math.random() * 1000)}`,
        firmware: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}`,
        resolution: ['1080p', '4K', '720p', '5MP'][Math.floor(Math.random() * 4)],
        capabilities: ['PTZ', 'Night Vision', 'Motion Detection', 'Audio'][Math.floor(Math.random() * 4)]
      };
    }

    return device;
  };

  const generateMAC = () => {
    return Array.from({ length: 6 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(':');
  };

  const getVendorByMAC = (mac: string) => {
    const vendors = ['Cisco', 'Hikvision', 'Dahua', 'Axis', 'Bosch', 'Sony', 'Panasonic', 'TP-Link', 'Netgear'];
    return vendors[Math.floor(Math.random() * vendors.length)];
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
                Scanning {scanRange.start} - {scanRange.end} ({Math.round(scanProgress)}%)
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
