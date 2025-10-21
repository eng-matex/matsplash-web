import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Tooltip,
  Paper,
  Chip,
  Dialog,
  Switch,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Menu,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  Badge,
  Avatar,
  Stack,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Tabs,
  Tab,
  Drawer,
  useMediaQuery,
  useTheme,
  SwipeableDrawer,
  BottomNavigation,
  BottomNavigationAction,
} from '@mui/material';
import PTZControls from './PTZControls';
import RecordingManager from './RecordingManager';
import AIAnalytics from './AIAnalytics';
import AlertsNotifications from './AlertsNotifications';
import NetworkScanner from './NetworkScanner';
import CameraManager from './CameraManager';
import CameraSetupWizard from './CameraSetupWizard';
import {
  Videocam,
  VideocamOff,
  FiberManualRecord,
  Stop,
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Fullscreen,
  FullscreenExit,
  GridView,
  ViewList,
  ViewModule,
  Settings,
  NotificationsActive,
  CloudDownload,
  Share,
  ZoomIn,
  ZoomOut,
  FlipCameraAndroid,
  CameraAlt,
  PhotoCamera,
  VideoLibrary,
  Assessment,
  Timeline,
  Search,
  Add,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Refresh,
  MoreVert,
  Edit,
  Delete,
  Remove,
  PanTool,
  Brightness4,
  Brightness7,
  Speed,
  Hd,
  FourK,
  HighQuality,
} from '@mui/icons-material';

interface Camera {
  id: number;
  name: string;
  ip_address: string;
  port: number;
  username?: string;
  password?: string;
  stream_url: string;
  status: 'online' | 'offline' | 'recording';
  location?: string;
}

interface LayoutConfig {
  rows: number;
  cols: number;
  label: string;
}

const LAYOUTS: LayoutConfig[] = [
  { rows: 1, cols: 1, label: '1x1' },
  { rows: 2, cols: 2, label: '2x2' },
  { rows: 3, cols: 3, label: '3x3' },
  { rows: 4, cols: 4, label: '4x4' },
  { rows: 2, cols: 3, label: '2x3' },
  { rows: 3, cols: 4, label: '3x4' },
];

export default function AdvancedSurveillance() {
  // Theme and Responsive
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // State Management
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<LayoutConfig>(LAYOUTS[1]); // Default 2x2
  const [selectedCameras, setSelectedCameras] = useState<number[]>([]);
  const [fullscreenCamera, setFullscreenCamera] = useState<Camera | null>(null);
  const [recording, setRecording] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Advanced Features
  const [motionDetection, setMotionDetection] = useState<Record<number, boolean>>({});
  const [nightVision, setNightVision] = useState<Record<number, boolean>>({});
  const [streamQuality, setStreamQuality] = useState<'SD' | 'HD' | '4K'>('HD');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  
  // Analytics
  const [analytics, setAnalytics] = useState({
    totalCameras: 0,
    onlineCameras: 0,
    recordingCameras: 0,
    storageUsed: 0,
    uptime: 0,
  });

  // Menu States
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; camera: Camera } | null>(null);
  
  // New State for Advanced Features
  const [mainTab, setMainTab] = useState(0); // 0: Live View, 1: Recordings, 2: AI Analytics, 3: Alerts, 4: Camera Manager, 5: Network Scanner, 6: Setup Wizard
  const [ptzDrawerOpen, setPtzDrawerOpen] = useState(false);
  const [selectedPTZCamera, setSelectedPTZCamera] = useState<Camera | null>(null);

  // Auto-adjust layout for mobile
  useEffect(() => {
    if (isMobile && selectedLayout.rows * selectedLayout.cols > 4) {
      setSelectedLayout(LAYOUTS[1]); // 2x2 for mobile
    }
  }, [isMobile]);

  // Load cameras
  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, autoRefresh ? 5000 : 0);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchCameras = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/surveillance/cameras', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        const cameraList = data.data || [];
        setCameras(cameraList);
        updateAnalytics(cameraList);
        
        // Test camera connections in background
        testCameraConnections(cameraList);
        
        setError('');
      } else {
        setError(data.message || 'Failed to load cameras');
      }
    } catch (err: any) {
      setError('Failed to load cameras: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const testCameraConnections = async (cams: Camera[]) => {
    // Test camera connections in background without blocking UI
    const testPromises = cams.map(async (camera) => {
      if (camera.status === 'offline') {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:3002/api/surveillance/test-camera', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ip_address: camera.ip_address,
              port: camera.port,
              username: camera.username,
              password: camera.password
            })
          });
          
          const result = await response.json();
          if (result.success && result.data.status === 'online') {
            console.log(`✅ Camera ${camera.name} is now online`);
            // Update camera status in local state
            setCameras(prev => prev.map(c => 
              c.id === camera.id ? { ...c, status: 'online' } : c
            ));
          }
        } catch (error) {
          console.log(`Failed to test camera ${camera.name}:`, error);
        }
      }
    });
    
    await Promise.allSettled(testPromises);
  };

  const updateAnalytics = async (cams: Camera[]) => {
    const online = cams.filter(c => c.status === 'online').length;
    const rec = cams.filter(c => c.status === 'recording').length;
    
    // Fetch real storage and system data
    let storageUsed = 0;
    let uptime = 99.8;
    
    try {
      const token = localStorage.getItem('token');
      const [storageResponse, systemResponse] = await Promise.allSettled([
        fetch('http://localhost:3002/api/surveillance/storage', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:3002/api/surveillance/system-status', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      if (storageResponse.status === 'fulfilled' && storageResponse.value.ok) {
        const storageData = await storageResponse.value.json();
        if (storageData.success) {
          storageUsed = storageData.storageUsed || 0;
        }
      }
      
      if (systemResponse.status === 'fulfilled' && systemResponse.value.ok) {
        const systemData = await systemResponse.value.json();
        if (systemData.success) {
          uptime = systemData.uptime || 99.8;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch analytics data:', error);
    }
    
    setAnalytics({
      totalCameras: cams.length,
      onlineCameras: online,
      recordingCameras: rec,
      storageUsed,
      uptime,
    });
  };

  const handleLayoutChange = (layout: LayoutConfig) => {
    setSelectedLayout(layout);
  };

  const handleCameraSelect = (cameraId: number) => {
    setSelectedCameras(prev => {
      const maxCameras = selectedLayout.rows * selectedLayout.cols;
      if (prev.includes(cameraId)) {
        return prev.filter(id => id !== cameraId);
      } else if (prev.length < maxCameras) {
        return [...prev, cameraId];
      }
      return prev;
    });
  };

  const handleRecording = async (cameraId: number) => {
    try {
      const token = localStorage.getItem('token');
      const isCurrentlyRecording = recording[cameraId];
      
      const response = await fetch(`http://localhost:3002/api/surveillance/cameras/${cameraId}/recording`, {
        method: isCurrentlyRecording ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setRecording(prev => ({ ...prev, [cameraId]: !prev[cameraId] }));
        setError('');
      } else {
        setError(data.message || `Failed to ${isCurrentlyRecording ? 'stop' : 'start'} recording`);
      }
    } catch (err: any) {
      setError(`Failed to ${recording[cameraId] ? 'stop' : 'start'} recording: ${err.message}`);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, camera: Camera) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      camera,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleSnapshot = async (camera: Camera) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/surveillance/cameras/${camera.id}/snapshot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        // Create download link for the snapshot
        const link = document.createElement('a');
        link.href = `data:image/jpeg;base64,${data.snapshot}`;
        link.download = `snapshot_${camera.name}_${new Date().toISOString()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setError('');
      } else {
        setError(data.message || 'Failed to take snapshot');
      }
    } catch (err: any) {
      setError(`Failed to take snapshot: ${err.message}`);
    }
    handleCloseContextMenu();
  };

  const handlePTZOpen = (camera: Camera) => {
    setSelectedPTZCamera(camera);
    setPtzDrawerOpen(true);
    handleCloseContextMenu();
  };

  const renderMainContent = () => {
    switch (mainTab) {
      case 0:
        return renderCameraGrid();
      case 1:
        return <RecordingManager />;
      case 2:
        return <AIAnalytics />;
      case 3:
        return <AlertsNotifications />;
      case 4:
        return <CameraManager />;
      case 5:
        return <NetworkScanner />;
      case 6:
        return <CameraSetupWizard />;
      default:
        return renderCameraGrid();
    }
  };

  const renderCameraGrid = () => {
    const { rows, cols } = selectedLayout;
    const gridCameras = selectedCameras.map(id => cameras.find(c => c.id === id)).filter(Boolean) as Camera[];
    
    return (
      <Grid container spacing={1} sx={{ height: 'calc(100vh - 250px)' }}>
        {Array.from({ length: rows * cols }).map((_, index) => {
          const camera = gridCameras[index];
          
          return (
            <Grid item xs={12 / cols} key={index} sx={{ height: `${100 / rows}%` }}>
              <Paper
                sx={{
                  height: '100%',
                  position: 'relative',
                  bgcolor: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '2px solid',
                  borderColor: camera ? 'primary.main' : 'grey.800',
                  '&:hover': {
                    borderColor: camera ? 'primary.light' : 'grey.700',
                  },
                }}
                onContextMenu={(e) => camera && handleContextMenu(e, camera)}
              >
                {camera ? (
                  <>
                    <img
                      src={`/api/streaming/stream/${camera.id}`}
                      alt={camera.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = camera.stream_url;
                      }}
                    />
                    
                    {showOverlay && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          p: 1,
                          bgcolor: 'rgba(0,0,0,0.7)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={camera.name}
                            size="small"
                            color={camera.status === 'online' ? 'success' : 'error'}
                            sx={{ fontWeight: 'bold' }}
                          />
                          {recording[camera.id] && (
                            <FiberManualRecord sx={{ color: 'red', fontSize: 16, animation: 'pulse 1.5s infinite' }} />
                          )}
                        </Stack>
                        
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => handleRecording(camera.id)}
                            sx={{ color: 'white' }}
                          >
                            {recording[camera.id] ? <Stop fontSize="small" /> : <FiberManualRecord fontSize="small" />}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setFullscreenCamera(camera)}
                            sx={{ color: 'white' }}
                          >
                            <Fullscreen fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Box>
                    )}

                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 0.5,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        fontSize: '0.75rem',
                        textAlign: 'center',
                      }}
                    >
                      {new Date().toLocaleTimeString()}
                    </Box>
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', color: 'grey.600' }}>
                    <VideocamOff sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="body2">
                      Select a camera
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', pb: isMobile ? 7 : 0 }}>
      {/* Header */}
      <Paper sx={{ p: isMobile ? 1 : 2, borderRadius: 0 }}>
        <Stack 
          direction={isMobile ? 'column' : 'row'} 
          justifyContent="space-between" 
          alignItems={isMobile ? 'flex-start' : 'center'}
          spacing={isMobile ? 1 : 0}
        >
          <Stack direction="row" spacing={isMobile ? 1 : 2} alignItems="center">
            <Badge badgeContent={alerts.length} color="error">
              <Videocam sx={{ fontSize: isMobile ? 24 : 32, color: 'primary.main' }} />
            </Badge>
            <Box>
              <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold">
                {isMobile ? 'NVR System' : 'Advanced NVR System'}
              </Typography>
              {!isMobile && (
                <Typography variant="caption" color="text.secondary">
                  Professional Surveillance Platform • AI-Powered Monitoring
                </Typography>
              )}
            </Box>
          </Stack>

          {!isMobile && (
            <Stack direction="row" spacing={2} alignItems="center">
              {/* Analytics */}
              <Stack direction="row" spacing={2}>
                <Chip
                  icon={<Videocam />}
                  label={`${analytics.onlineCameras}/${analytics.totalCameras} Online`}
                  color="success"
                  variant="outlined"
                  size={isTablet ? 'small' : 'medium'}
                />
                <Chip
                  icon={<FiberManualRecord />}
                  label={`${analytics.recordingCameras} Recording`}
                  color="error"
                  variant="outlined"
                  size={isTablet ? 'small' : 'medium'}
                />
                <Chip
                  label={`${streamQuality}`}
                  color="primary"
                  variant="outlined"
                  size={isTablet ? 'small' : 'medium'}
                />
              </Stack>

              <Divider orientation="vertical" flexItem />

              {/* Quality Selector */}
              <ToggleButtonGroup
                value={streamQuality}
                exclusive
                onChange={(e, value) => value && setStreamQuality(value)}
                size="small"
              >
                <ToggleButton value="SD">SD</ToggleButton>
                <ToggleButton value="HD">HD</ToggleButton>
                <ToggleButton value="4K">4K</ToggleButton>
              </ToggleButtonGroup>

              <IconButton onClick={() => setShowOverlay(!showOverlay)}>
                <Tooltip title="Toggle Overlay">
                  <Settings />
                </Tooltip>
              </IconButton>

              <IconButton onClick={fetchCameras}>
                <Tooltip title="Refresh">
                  <Refresh />
                </Tooltip>
              </IconButton>
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* Main Tabs - Hidden on Mobile (use bottom navigation instead) */}
      {!isMobile && (
        <Paper sx={{ borderRadius: 0 }}>
          <Tabs value={mainTab} onChange={(e, v) => setMainTab(v)} variant="fullWidth">
            <Tab icon={<Videocam />} label="Live View" />
            <Tab icon={<VideoLibrary />} label="Recordings" />
            <Tab icon={<Assessment />} label="AI Analytics" />
            <Tab icon={<NotificationsActive />} label="Alerts" />
            <Tab icon={<Settings />} label="Cameras" />
            <Tab icon={<Search />} label="Scanner" />
            <Tab icon={<Add />} label="Setup" />
          </Tabs>
        </Paper>
      )}

      {/* Layout Selector & Camera List - Only show in Live View */}
      {mainTab === 0 && (
        <Paper sx={{ p: isMobile ? 1 : 2, borderRadius: 0 }}>
          <Stack direction={isMobile ? 'column' : 'row'} spacing={isMobile ? 1 : 3} alignItems={isMobile ? 'stretch' : 'center'}>
            {!isMobile && (
              <Typography variant="subtitle2" color="text.secondary">
                Layout:
              </Typography>
            )}
            <ToggleButtonGroup
              value={selectedLayout}
              exclusive
              onChange={(e, value) => value && handleLayoutChange(value)}
              size="small"
              sx={{ overflowX: 'auto' }}
            >
              {(isMobile ? LAYOUTS.slice(0, 3) : LAYOUTS).map((layout) => (
                <ToggleButton key={layout.label} value={layout}>
                  <GridView sx={{ mr: 0.5, fontSize: 16 }} />
                  {layout.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            {!isMobile && <Divider orientation="vertical" flexItem />}

            {!isMobile && (
              <Typography variant="subtitle2" color="text.secondary">
                Select Cameras:
              </Typography>
            )}
            <Stack direction="row" spacing={1} sx={{ flex: 1, overflowX: 'auto', pb: isMobile ? 1 : 0 }}>
              {cameras.map((camera) => (
                <Chip
                  key={camera.id}
                  label={camera.name}
                  onClick={() => handleCameraSelect(camera.id)}
                  color={selectedCameras.includes(camera.id) ? 'primary' : 'default'}
                  icon={
                    camera.status === 'online' ? (
                      <CheckCircle sx={{ color: 'green', fontSize: 16 }} />
                    ) : camera.status === 'offline' ? (
                      <ErrorIcon sx={{ color: 'red', fontSize: 16 }} />
                    ) : (
                      <Videocam sx={{ color: 'orange', fontSize: 16 }} />
                    )
                  }
                  variant={selectedCameras.includes(camera.id) ? 'filled' : 'outlined'}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    '& .MuiChip-icon': {
                      marginRight: '4px'
                    }
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, p: mainTab === 0 ? 2 : 0, overflow: 'auto' }}>
        {renderMainContent()}
      </Box>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => contextMenu && handleSnapshot(contextMenu.camera)}>
          <PhotoCamera sx={{ mr: 1 }} /> Take Snapshot
        </MenuItem>
        <MenuItem onClick={() => contextMenu && setFullscreenCamera(contextMenu.camera)}>
          <Fullscreen sx={{ mr: 1 }} /> Fullscreen
        </MenuItem>
        <MenuItem onClick={() => contextMenu && handleRecording(contextMenu.camera.id)}>
          <FiberManualRecord sx={{ mr: 1 }} /> Start Recording
        </MenuItem>
        <MenuItem onClick={() => contextMenu && handlePTZOpen(contextMenu.camera)}>
          <PanTool sx={{ mr: 1 }} /> PTZ Controls
        </MenuItem>
        <Divider />
        <MenuItem>
          <Settings sx={{ mr: 1 }} /> Camera Settings
        </MenuItem>
      </Menu>

      {/* PTZ Controls Drawer */}
      {isMobile ? (
        <SwipeableDrawer
          anchor="bottom"
          open={ptzDrawerOpen}
          onClose={() => setPtzDrawerOpen(false)}
          onOpen={() => setPtzDrawerOpen(true)}
          disableSwipeToOpen={false}
        >
          {selectedPTZCamera && (
            <PTZControls
              cameraId={selectedPTZCamera.id}
              cameraName={selectedPTZCamera.name}
              onClose={() => setPtzDrawerOpen(false)}
            />
          )}
        </SwipeableDrawer>
      ) : (
        <Drawer
          anchor="right"
          open={ptzDrawerOpen}
          onClose={() => setPtzDrawerOpen(false)}
        >
          {selectedPTZCamera && (
            <PTZControls
              cameraId={selectedPTZCamera.id}
              cameraName={selectedPTZCamera.name}
              onClose={() => setPtzDrawerOpen(false)}
            />
          )}
        </Drawer>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: 1000,
            borderTop: '1px solid',
            borderColor: 'divider',
          }} 
          elevation={3}
        >
          <BottomNavigation
            value={mainTab}
            onChange={(event, newValue) => setMainTab(newValue)}
            showLabels
          >
            <BottomNavigationAction label="Live" icon={<Videocam />} />
            <BottomNavigationAction label="Recordings" icon={<VideoLibrary />} />
            <BottomNavigationAction label="AI" icon={<Assessment />} />
            <BottomNavigationAction 
              label="Alerts" 
              icon={
                <Badge badgeContent={alerts.length} color="error">
                  <NotificationsActive />
                </Badge>
              } 
            />
            <BottomNavigationAction label="Cameras" icon={<Settings />} />
            <BottomNavigationAction label="Scanner" icon={<Search />} />
            <BottomNavigationAction label="Setup" icon={<Add />} />
          </BottomNavigation>
        </Paper>
      )}

      {/* Fullscreen Dialog */}
      <Dialog
        fullScreen
        open={fullscreenCamera !== null}
        onClose={() => setFullscreenCamera(null)}
      >
        {fullscreenCamera && (
          <Box sx={{ position: 'relative', width: '100%', height: '100%', bgcolor: '#000' }}>
            <img
              src={`/api/streaming/stream/${fullscreenCamera.id}`}
              alt={fullscreenCamera.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = fullscreenCamera.stream_url;
              }}
            />
            <IconButton
              sx={{ position: 'absolute', top: 16, right: 16, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
              onClick={() => setFullscreenCamera(null)}
            >
              <FullscreenExit />
            </IconButton>
            <Box sx={{ position: 'absolute', bottom: 16, left: 16, color: 'white' }}>
              <Typography variant="h6">{fullscreenCamera.name}</Typography>
              <Typography variant="body2">{fullscreenCamera.location}</Typography>
            </Box>
          </Box>
        )}
      </Dialog>

      {/* Global Styles for Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Box>
  );
}

