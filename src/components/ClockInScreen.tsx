import { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Stack,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface ClockInScreenProps {
  user: any;
}

const ClockInScreen: React.FC<ClockInScreenProps> = ({ user }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clockInStatus, setClockInStatus] = useState<{
    clockedIn: boolean;
    clockInTime?: string;
    onBreak?: boolean;
    breakStartTime?: string;
    totalBreakTime?: number;
    currentStatus?: string;
    workDuration?: number;
    breakDuration?: number;
  } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
    accuracy: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  const employeeId = user?.id;

  // Get device fingerprint
  const getDeviceFingerprint = () => {
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const platform = navigator.platform;
    const screenResolution = `${screen.width}x${screen.height}`;
    
    // Create a simple device fingerprint
    const fingerprint = btoa(userAgent + language + platform + screenResolution).substring(0, 32);
    return fingerprint;
  };

  // Get current location
  const getCurrentLocation = async () => {
    setIsLocationLoading(true);
    setLocationError(null);

    // Check if geolocation is available
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setIsLocationLoading(false);
      return null;
    }

    return new Promise<{lat: number, lng: number, address: string, accuracy: number} | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          try {
            // Get address from coordinates (you can use a reverse geocoding service)
            const address = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
            
            const location = {
              lat: latitude,
              lng: longitude,
              address,
              accuracy
            };
            
            setCurrentLocation(location);
            setIsLocationLoading(false);
            resolve(location);
          } catch (err) {
            setLocationError('Failed to get address from coordinates.');
            setIsLocationLoading(false);
            resolve(null);
          }
        },
        (error) => {
          // In development, provide a mock location if GPS fails
          const mockLocation = {
            lat: 7.3964, // Ibadan, Nigeria coordinates (MatSplash Premium Water Factory)
            lng: 3.9167,
            address: 'MatSplash Premium Water Factory (GPS Failed)',
            accuracy: 100
          };
          setCurrentLocation(mockLocation);
          setIsLocationLoading(false);
          resolve(mockLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000, // Reduced timeout for faster fallback
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  // Get device information
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    const isTablet = /tablet|ipad|playbook|silk/i.test(userAgent);
    const isMobile = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isFactoryDevice = window.location.hostname === 'localhost' || 
                           window.location.hostname.includes('factory') ||
                           window.location.hostname.includes('192.168') ||
                           window.location.hostname.includes('10.0');
    
    const deviceFingerprint = getDeviceFingerprint();
    
    const deviceInfo = {
      userAgent,
      platform: navigator.platform,
      isTablet,
      isMobile,
      isFactoryDevice,
      screenResolution: `${screen.width}x${screen.height}`,
      timestamp: new Date().toISOString(),
      fingerprint: deviceFingerprint
    };
    
    setDeviceInfo(deviceInfo);
    return deviceInfo;
  };

  const fetchClockInStatus = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const response = await axios.get(`/api/attendance/status/${employeeId}`);
      
      if (response.data.success) {
        const status = response.data.data;
        
        // Calculate additional status information
        let currentStatus = 'not_clocked_in';
        let workDuration = 0;
        let breakDuration = 0;
        
        if (status.clockedIn) {
          if (status.onBreak) {
            currentStatus = 'on_break';
            // Calculate current break duration
            if (status.breakStartTime) {
              const breakStart = new Date(status.breakStartTime);
              const now = new Date();
              breakDuration = Math.round((now.getTime() - breakStart.getTime()) / (1000 * 60));
            }
          } else {
            currentStatus = 'working';
            // Calculate work duration
            if (status.clockInTime) {
              const clockIn = new Date(status.clockInTime);
              const now = new Date();
              const totalMs = now.getTime() - clockIn.getTime();
              const totalMinutes = Math.round(totalMs / (1000 * 60));
              workDuration = totalMinutes - (status.totalBreakTime || 0);
            }
          }
        }
        
        setClockInStatus({
          ...status,
          currentStatus,
          workDuration,
          breakDuration
        });
      }
    } catch (err) {
      setError('Failed to fetch clock-in status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
        fetchClockInStatus();
        getDeviceInfo();
    }
  }, [employeeId]);

  // Real-time status updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (employeeId && clockInStatus?.clockedIn) {
        fetchClockInStatus();
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [employeeId, clockInStatus?.clockedIn]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000); // Clear messages after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleClockIn = async () => {
    if (!employeeId) {
      setError('Not logged in.');
      return;
    }
    if (!pin) {
      setError('PIN is required.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Get location and device info
      const location = await getCurrentLocation();
      if (!location) {
        setError('Location access is required to clock in. Please enable location services and try again.');
        setLoading(false);
        return;
      }
      
      const device = getDeviceInfo();
      
      // Check if user can access remotely (only Director and Manager)
      if (!user?.can_access_remotely && !device.isFactoryDevice) {
        setError('Access denied: You can only clock in from authorized factory devices.');
        setLoading(false);
        return;
      }
      
      const response = await axios.post('/api/attendance/clock-in', {
        employeeId,
        pin,
        location,
        deviceInfo: device
      });
      
      if (response.data.success) {
        setSuccess(response.data.message || 'Clock in successful');
        setPin('');
        await fetchClockInStatus(); 
      } else {
        setError(response.data.message || 'Clock in failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!employeeId) {
      setError('Not logged in.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const location = await getCurrentLocation();
      if (!location) {
        setError('Location access is required to clock out. Please enable location services and try again.');
        setLoading(false);
        return;
      }
      
      const device = getDeviceInfo();
      
      if (!user?.can_access_remotely && !device.isFactoryDevice) {
        setError('Access denied: You can only clock out from authorized factory devices.');
        setLoading(false);
        return;
      }
      
      const response = await axios.post('/api/attendance/clock-out', {
        employeeId,
        location,
        deviceInfo: device
      });
      
      if (response.data.success) {
        setSuccess(response.data.message || 'Clock out successful');
        fetchClockInStatus();
      } else {
        setError(response.data.message || 'Clock out failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async () => {
    if (!employeeId) {
      setError('Not logged in.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const location = await getCurrentLocation();
      if (!location) {
        setError('Location access is required to start break. Please enable location services and try again.');
        setLoading(false);
        return;
      }
      
      const device = getDeviceInfo();
      
      if (!user?.can_access_remotely && !device.isFactoryDevice) {
        setError('Access denied: You can only start break from authorized factory devices.');
        setLoading(false);
        return;
      }
      
      const response = await axios.post('/api/attendance/start-break', {
        employeeId,
        location,
        deviceInfo: device
      });
      
      if (response.data.success) {
        setSuccess(response.data.message || 'Break started successfully');
        fetchClockInStatus();
      } else {
        setError(response.data.message || 'Failed to start break');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (!employeeId) {
      setError('Not logged in.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const location = await getCurrentLocation();
      if (!location) {
        setError('Location access is required to end break. Please enable location services and try again.');
        setLoading(false);
        return;
      }
      
      const device = getDeviceInfo();
      
      if (!user?.can_access_remotely && !device.isFactoryDevice) {
        setError('Access denied: You can only end break from authorized factory devices.');
        setLoading(false);
        return;
      }
      
      const response = await axios.post('/api/attendance/end-break', {
        employeeId,
        location,
        deviceInfo: device
      });
      
      if (response.data.success) {
        setSuccess(response.data.message || 'Break ended successfully');
        fetchClockInStatus();
      } else {
        setError(response.data.message || 'Failed to end break');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Don't show clock-in/out for Admin and Director roles
  if (user?.role === 'Admin' || user?.role === 'Director') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Clock In/Out System
          </Typography>
          <Alert severity="info">
            Clock-in/out functionality is not available for {user.role} role.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 2 }}>
        {/* Location and Device Status */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Device & Location Status</Typography>
              <Tooltip title="Refresh Location">
                <IconButton onClick={getCurrentLocation} disabled={isLocationLoading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {currentLocation ? <WifiIcon color="success" /> : <WifiOffIcon color="error" />}
                <Typography variant="body2">
                  Location: {currentLocation ? currentLocation.address : 'Not available'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon color={deviceInfo?.isFactoryDevice ? "success" : "warning"} />
                <Typography variant="body2">
                  Device: {deviceInfo?.isFactoryDevice ? 'Factory Device' : 'External Device'}
                </Typography>
              </Box>
              
              {locationError && (
                <Alert severity="warning" size="small">
                  {locationError}
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Main Clock Interface */}
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Time Clock
            </Typography>
            
            {loading && <CircularProgress sx={{ my: 2 }} />}
            {error && <Alert severity="error" sx={{ my: 1 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ my: 1 }}>{success}</Alert>}

            {clockInStatus && (
              <Box sx={{ my: 2 }}>
                {/* Current Status Display */}
                <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Current Status
                  </Typography>
                  
                  {clockInStatus.currentStatus === 'not_clocked_in' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label="NOT CLOCKED IN" 
                        color="error" 
                        size="large"
                        sx={{ fontWeight: 'bold' }}
                      />
                      <Typography variant="body1" color="text.secondary">
                        You are not currently clocked in
                      </Typography>
                    </Box>
                  )}
                  
                  {clockInStatus.currentStatus === 'working' && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip 
                          label="WORKING" 
                          color="success" 
                          size="large"
                          sx={{ fontWeight: 'bold' }}
                        />
                        <Typography variant="body1" color="text.secondary">
                          You are currently working
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Clocked in: {clockInStatus.clockInTime ? new Date(clockInStatus.clockInTime).toLocaleTimeString() : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Work duration: {clockInStatus.workDuration || 0} minutes
                      </Typography>
                      {clockInStatus.totalBreakTime && clockInStatus.totalBreakTime > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          Total break time today: {clockInStatus.totalBreakTime} minutes
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {clockInStatus.currentStatus === 'on_break' && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip 
                          label="ON BREAK" 
                          color="warning" 
                          size="large"
                          sx={{ fontWeight: 'bold' }}
                        />
                        <Typography variant="body1" color="text.secondary">
                          You are currently on break
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Break started: {clockInStatus.breakStartTime ? new Date(clockInStatus.breakStartTime).toLocaleTimeString() : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current break duration: {clockInStatus.breakDuration || 0} minutes
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Clocked in: {clockInStatus.clockInTime ? new Date(clockInStatus.clockInTime).toLocaleTimeString() : 'N/A'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {!clockInStatus?.clockedIn && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  label="Enter PIN to Clock In"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleClockIn}
                  disabled={loading || isLocationLoading}
                  fullWidth
                  size="large"
                >
                  Clock In
                </Button>
              </Box>
            )}

            {clockInStatus?.clockedIn && !clockInStatus.onBreak && (
              <Stack sx={{ mt: 2 }} spacing={1.5}>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={handleStartBreak}
                  disabled={loading || isLocationLoading}
                  fullWidth
                  startIcon={<TimeIcon />}
                >
                  Start Break
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleClockOut}
                  disabled={loading || isLocationLoading}
                  fullWidth
                >
                  Clock Out
                </Button>
              </Stack>
            )}

            {clockInStatus?.clockedIn && clockInStatus.onBreak && (
              <Stack sx={{ mt: 2 }} spacing={1.5}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleEndBreak}
                  disabled={loading || isLocationLoading}
                  fullWidth
                  startIcon={<TimeIcon />}
                >
                  End Break
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleClockOut}
                  disabled={loading || isLocationLoading}
                  fullWidth
                >
                  Clock Out
                </Button>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default ClockInScreen;
