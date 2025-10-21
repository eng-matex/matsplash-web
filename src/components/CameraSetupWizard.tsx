import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Videocam as VideocamIcon,
  NetworkCheck as NetworkCheckIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';

interface CameraConfig {
  name: string;
  ip: string;
  port: number;
  protocol: 'RTSP' | 'HTTP' | 'HTTPS';
  username: string;
  password: string;
  streamPath: string;
  resolution: string;
  brand: string;
  model: string;
  capabilities: string[];
  location: string;
  group: string;
  tags: string[];
  motionDetection: boolean;
  nightVision: boolean;
  ptz: boolean;
  audio: boolean;
  recording: boolean;
  recordingPath: string;
}

const CameraSetupWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [cameraConfig, setCameraConfig] = useState<CameraConfig>({
    name: '',
    ip: '',
    port: 554,
    protocol: 'RTSP',
    username: '',
    password: '',
    streamPath: '/stream1',
    resolution: '1080p',
    brand: '',
    model: '',
    capabilities: [],
    location: '',
    group: 'Default',
    tags: [],
    motionDetection: false,
    nightVision: false,
    ptz: false,
    audio: false,
    recording: false,
    recordingPath: '/recordings'
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    connection: boolean;
    stream: boolean;
    credentials: boolean;
    error?: string;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const steps = [
    'Basic Information',
    'Network Settings',
    'Authentication',
    'Stream Configuration',
    'Advanced Settings',
    'Test & Preview',
    'Complete Setup'
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setCameraConfig({
      name: '',
      ip: '',
      port: 554,
      protocol: 'RTSP',
      username: '',
      password: '',
      streamPath: '/stream1',
      resolution: '1080p',
      brand: '',
      model: '',
      capabilities: [],
      location: '',
      group: 'Default',
      tags: [],
      motionDetection: false,
      nightVision: false,
      ptz: false,
      audio: false,
      recording: false,
      recordingPath: '/recordings'
    });
  };

  const handleConfigChange = (field: keyof CameraConfig, value: any) => {
    setCameraConfig(prev => ({ ...prev, [field]: value }));
  };

  const testCameraConnection = async () => {
    setIsTesting(true);
    setTestResults(null);

    try {
      // Test camera connection
      const testResults = {
        connection: false,
        stream: false,
        credentials: false,
        error: undefined as string | undefined
      };

      // Test 1: Check if camera is reachable
      try {
        const pingResponse = await fetch(`http://${cameraConfig.ip}:${cameraConfig.port || 80}`, {
          method: 'HEAD',
          timeout: 5000
        });
        testResults.connection = pingResponse.ok;
      } catch (error) {
        testResults.connection = false;
        testResults.error = 'Camera not reachable';
      }

      // Test 2: Check credentials (if provided)
      if (cameraConfig.username && cameraConfig.password) {
        try {
          const authResponse = await fetch(`http://${cameraConfig.username}:${cameraConfig.password}@${cameraConfig.ip}:${cameraConfig.port || 80}`, {
            method: 'HEAD',
            timeout: 5000
          });
          testResults.credentials = authResponse.ok;
        } catch (error) {
          testResults.credentials = false;
          testResults.error = 'Invalid credentials';
        }
      } else {
        testResults.credentials = true; // No credentials to test
      }

      // Test 3: Check stream URL
      if (cameraConfig.streamUrl) {
        try {
          const streamResponse = await fetch(cameraConfig.streamUrl, {
            method: 'HEAD',
            timeout: 5000
          });
          testResults.stream = streamResponse.ok;
        } catch (error) {
          testResults.stream = false;
          testResults.error = 'Stream not accessible';
        }
      } else {
        testResults.stream = true; // No stream URL to test
      }

      setTestResults(testResults);
    } catch (error) {
      setTestResults({
        connection: false,
        stream: false,
        credentials: false,
        error: 'Connection timeout'
      });
    }

    setIsTesting(false);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Basic Camera Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Camera Name"
                  value={cameraConfig.name}
                  onChange={(e) => handleConfigChange('name', e.target.value)}
                  fullWidth
                  required
                  helperText="Give your camera a descriptive name"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Location"
                  value={cameraConfig.location}
                  onChange={(e) => handleConfigChange('location', e.target.value)}
                  fullWidth
                  helperText="Where is this camera located?"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Brand"
                  value={cameraConfig.brand}
                  onChange={(e) => handleConfigChange('brand', e.target.value)}
                  fullWidth
                  helperText="Camera manufacturer (e.g., Hikvision, Dahua, Axis)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Model"
                  value={cameraConfig.model}
                  onChange={(e) => handleConfigChange('model', e.target.value)}
                  fullWidth
                  helperText="Camera model number"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Group"
                  value={cameraConfig.group}
                  onChange={(e) => handleConfigChange('group', e.target.value)}
                  fullWidth
                  helperText="Organize cameras into groups"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Network Settings</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  label="IP Address"
                  value={cameraConfig.ip}
                  onChange={(e) => handleConfigChange('ip', e.target.value)}
                  fullWidth
                  required
                  helperText="Camera's IP address on the network"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Port"
                  type="number"
                  value={cameraConfig.port}
                  onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                  fullWidth
                  helperText="Camera's network port"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Protocol</InputLabel>
                  <Select
                    value={cameraConfig.protocol}
                    onChange={(e) => handleConfigChange('protocol', e.target.value)}
                  >
                    <MenuItem value="RTSP">RTSP (Real-Time Streaming Protocol)</MenuItem>
                    <MenuItem value="HTTP">HTTP (Hypertext Transfer Protocol)</MenuItem>
                    <MenuItem value="HTTPS">HTTPS (Secure HTTP)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Stream Path"
                  value={cameraConfig.streamPath}
                  onChange={(e) => handleConfigChange('streamPath', e.target.value)}
                  fullWidth
                  helperText="Stream path (e.g., /stream1, /video.mjpg)"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Authentication</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Enter the camera's login credentials. These are usually found on the camera's label or in its documentation.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Username"
                  value={cameraConfig.username}
                  onChange={(e) => handleConfigChange('username', e.target.value)}
                  fullWidth
                  required
                  helperText="Camera login username"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Password"
                  type="password"
                  value={cameraConfig.password}
                  onChange={(e) => handleConfigChange('password', e.target.value)}
                  fullWidth
                  required
                  helperText="Camera login password"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Stream Configuration</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Resolution</InputLabel>
                  <Select
                    value={cameraConfig.resolution}
                    onChange={(e) => handleConfigChange('resolution', e.target.value)}
                  >
                    <MenuItem value="720p">720p (HD)</MenuItem>
                    <MenuItem value="1080p">1080p (Full HD)</MenuItem>
                    <MenuItem value="4K">4K (Ultra HD)</MenuItem>
                    <MenuItem value="5MP">5MP</MenuItem>
                    <MenuItem value="8MP">8MP</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Recording Path"
                  value={cameraConfig.recordingPath}
                  onChange={(e) => handleConfigChange('recordingPath', e.target.value)}
                  fullWidth
                  helperText="Where to store recordings"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Advanced Settings</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={cameraConfig.motionDetection}
                      onChange={(e) => handleConfigChange('motionDetection', e.target.checked)}
                    />
                  }
                  label="Motion Detection"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={cameraConfig.nightVision}
                      onChange={(e) => handleConfigChange('nightVision', e.target.checked)}
                    />
                  }
                  label="Night Vision"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={cameraConfig.ptz}
                      onChange={(e) => handleConfigChange('ptz', e.target.checked)}
                    />
                  }
                  label="PTZ (Pan-Tilt-Zoom)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={cameraConfig.audio}
                      onChange={(e) => handleConfigChange('audio', e.target.checked)}
                    />
                  }
                  label="Audio Recording"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={cameraConfig.recording}
                      onChange={(e) => handleConfigChange('recording', e.target.checked)}
                    />
                  }
                  label="Auto Recording"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 5:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Test Camera Connection</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Let's test your camera configuration to make sure everything is working correctly.
            </Alert>
            
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                onClick={testCameraConnection}
                disabled={isTesting}
                startIcon={isTesting ? <RefreshIcon /> : <NetworkCheckIcon />}
                sx={{ mr: 2 }}
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowPreview(true)}
                startIcon={<PlayIcon />}
              >
                Preview Stream
              </Button>
            </Box>

            {isTesting && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Testing camera connection...
                </Typography>
              </Box>
            )}

            {testResults && (
              <Box>
                <Typography variant="h6" gutterBottom>Test Results</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {testResults.connection ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
                          <Typography variant="h6" sx={{ ml: 1 }}>
                            Connection
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {testResults.connection ? 'Camera is reachable' : 'Cannot reach camera'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {testResults.credentials ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
                          <Typography variant="h6" sx={{ ml: 1 }}>
                            Authentication
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {testResults.credentials ? 'Login successful' : 'Invalid credentials'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {testResults.stream ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
                          <Typography variant="h6" sx={{ ml: 1 }}>
                            Stream
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {testResults.stream ? 'Stream available' : 'No stream found'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {testResults.error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {testResults.error}
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        );

      case 6:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Setup Complete</Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              Your camera has been successfully configured and added to the system!
            </Alert>
            
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Camera Summary</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2"><strong>Name:</strong> {cameraConfig.name}</Typography>
                    <Typography variant="body2"><strong>IP:</strong> {cameraConfig.ip}:{cameraConfig.port}</Typography>
                    <Typography variant="body2"><strong>Protocol:</strong> {cameraConfig.protocol}</Typography>
                    <Typography variant="body2"><strong>Location:</strong> {cameraConfig.location}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2"><strong>Brand:</strong> {cameraConfig.brand}</Typography>
                    <Typography variant="body2"><strong>Model:</strong> {cameraConfig.model}</Typography>
                    <Typography variant="body2"><strong>Resolution:</strong> {cameraConfig.resolution}</Typography>
                    <Typography variant="body2"><strong>Group:</strong> {cameraConfig.group}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VideocamIcon />
        Camera Setup Wizard
      </Typography>

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {getStepContent(index)}
                  <Box sx={{ mb: 2, mt: 2 }}>
                    <div>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        sx={{ mt: 1, mr: 1 }}
                        disabled={activeStep === steps.length - 1}
                      >
                        {activeStep === steps.length - 1 ? 'Finish' : 'Continue'}
                      </Button>
                      <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Back
                      </Button>
                    </div>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
          {activeStep === steps.length && (
            <Box sx={{ mt: 2 }}>
              <Typography>All steps completed - you&apos;re finished</Typography>
              <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                Reset
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="md" fullWidth>
        <DialogTitle>Camera Stream Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {cameraConfig.name} - {cameraConfig.ip}
            </Typography>
            <Box
              sx={{
                width: '100%',
                height: 300,
                backgroundColor: 'grey.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                border: '2px dashed',
                borderColor: 'grey.400'
              }}
            >
              <Typography variant="body1" color="text.secondary">
                Stream Preview
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Stream URL: {cameraConfig.protocol.toLowerCase()}://{cameraConfig.ip}:{cameraConfig.port}{cameraConfig.streamPath}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
          <Button variant="contained">Add Camera</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CameraSetupWizard;
