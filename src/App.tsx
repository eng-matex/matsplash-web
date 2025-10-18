import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  CssBaseline, 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  TextField, 
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Logout
} from '@mui/icons-material';
import axios from 'axios';
import theme from './theme';
import logo from './assets/Matsplash-logo.png';
import { getRoleNavigation, getDefaultView } from './components/RoleBasedNavigation';
import ClockInScreen from './components/ClockInScreen';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
      const [loginData, setLoginData] = useState({ emailOrPhone: '', pin: '', twoFactorCode: '', emergencyCode: '' });
      const [error, setError] = useState('');
      const [loading, setLoading] = useState(false);
      const [showPin, setShowPin] = useState(false);
      const [currentPage, setCurrentPage] = useState('overview');
      const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
      const [showEmergencyAccess, setShowEmergencyAccess] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setIsLoggedIn(true);
      setUser(parsedUser);
      setCurrentPage(getDefaultView(parsedUser.role));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Get device information
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isTablet: /tablet|ipad|playbook|silk/i.test(navigator.userAgent),
        isMobile: /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent),
        isFactoryDevice: window.location.hostname === 'localhost' || 
                        window.location.hostname.includes('factory') ||
                        window.location.hostname.includes('192.168') ||
                        window.location.hostname.includes('10.0'),
        screenResolution: `${screen.width}x${screen.height}`,
        timestamp: new Date().toISOString()
      };

      // Get location (mock for development)
      const location = {
        lat: 6.5244, // Lagos, Nigeria coordinates (factory location)
        lng: 3.3792,
        address: 'Mock Factory Location (Development Mode)',
        accuracy: 10
      };

      const response = await axios.post('http://localhost:3001/api/auth/login', {
        ...loginData,
        location,
        deviceInfo
      });
      
      if (response.data.success) {
        const loggedInUser = response.data.user;
        setUser(loggedInUser);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        setIsLoggedIn(true);
        setCurrentPage(getDefaultView(loggedInUser.role));
        setRequiresTwoFactor(false);
        setShowEmergencyAccess(false);
        setLoginData({ emailOrPhone: '', pin: '', twoFactorCode: '', emergencyCode: '' });
      } else if (response.data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setError('');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
    setCurrentPage('overview');
  };

      const renderRoleBasedDashboard = () => {
        if (!user) return null;

        const navigationItems = getRoleNavigation(user?.role);

        // Handle clock-in-out section
        if (currentPage === 'clock-in-out') {
          return <ClockInScreen user={user} />;
        }

        return (
          <Card sx={{ p: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                Welcome, {user.name}!
              </Typography>
              <Typography variant="h6" sx={{ color: '#13bbc6', mb: 2 }}>
                Role: {user.role}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                You are currently viewing: <strong>{navigationItems.find(item => item.id === currentPage)?.label || 'Overview'}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                The complete role-based factory management system is ready! Each role has access to their specific tools and data.
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                  Available Sections for {user.role}:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {navigationItems.map((item) => (
                    <Chip
                      key={item.id}
                      label={item.label}
                      onClick={() => setCurrentPage(item.id)}
                      color={currentPage === item.id ? 'primary' : 'default'}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        );
      };

  if (isLoggedIn) {
    const navigationItems = getRoleNavigation(user?.role);
    
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          {/* Sidebar Navigation */}
          <Drawer
            variant="permanent"
            sx={{
              width: 240,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: {
                width: 240,
                boxSizing: 'border-box',
                backgroundColor: theme.palette.background.paper,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
              },
            }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid #eee' }}>
              <img src={logo} alt="MatSplash Logo" style={{ width: 120, height: 'auto' }} />
            </Box>
            <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {navigationItems.map((item) => (
                <ListItem key={item.id} disablePadding>
                  <ListItemButton
                    selected={currentPage === item.id}
                    onClick={() => setCurrentPage(item.id)}
                    sx={{
                      borderRadius: 2,
                      mx: 1,
                      my: 0.5,
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        '&:hover': {
                          backgroundColor: theme.palette.primary.dark,
                        },
                      },
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: currentPage === item.id ? theme.palette.primary.contrastText : item.color }}>
                      <item.icon />
                    </ListItemIcon>
                    <ListItemText primary={item.label} sx={{ color: currentPage === item.id ? theme.palette.primary.contrastText : theme.palette.text.primary }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            <Box sx={{ p: 2, borderTop: '1px solid #eee' }}>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                onClick={handleLogout}
                startIcon={<Logout />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Logout
              </Button>
            </Box>
          </Drawer>

          {/* Main Content Area */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              bgcolor: theme.palette.background.default,
              p: 3,
              overflowY: 'auto',
              width: 'calc(100% - 240px)',
            }}
          >
            <Typography variant="h4" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 700, mb: 3 }}>
              MatSplash Suite - {user?.role} Dashboard
            </Typography>
            
            {/* Role-Based Dashboard Content */}
            {renderRoleBasedDashboard()}
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #13bbc6 30%, #FFD700 90%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}>
        <Container maxWidth="sm">
          <Card sx={{ p: 4, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <img src={logo} alt="MatSplash Logo" style={{ width: 200, height: 'auto', marginBottom: 20 }} />
                <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                  MatSplash Factory Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Please login to access the system
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

                  <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      label="Email or Phone"
                      value={loginData.emailOrPhone}
                      onChange={(e) => setLoginData({ ...loginData, emailOrPhone: e.target.value })}
                      margin="normal"
                      required
                      disabled={requiresTwoFactor}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      label="PIN"
                      type={showPin ? 'text' : 'password'}
                      value={loginData.pin}
                      onChange={(e) => setLoginData({ ...loginData, pin: e.target.value })}
                      margin="normal"
                      required
                      disabled={requiresTwoFactor}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPin(!showPin)}
                              edge="end"
                            >
                              {showPin ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    
                    {requiresTwoFactor && (
                      <TextField
                        fullWidth
                        label="Two-Factor Authentication Code"
                        value={loginData.twoFactorCode}
                        onChange={(e) => setLoginData({ ...loginData, twoFactorCode: e.target.value })}
                        margin="normal"
                        required
                        placeholder="Enter 6-digit code from your authenticator app"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Button
                        type="button"
                        variant="text"
                        size="small"
                        onClick={() => setShowEmergencyAccess(!showEmergencyAccess)}
                        sx={{ color: '#ff6b6b' }}
                      >
                        Emergency Access
                      </Button>
                      <Button
                        type="button"
                        variant="text"
                        size="small"
                        onClick={() => {
                          setRequiresTwoFactor(false);
                          setShowEmergencyAccess(false);
                          setLoginData({ emailOrPhone: '', pin: '', twoFactorCode: '', emergencyCode: '' });
                        }}
                      >
                        Reset
                      </Button>
                    </Box>

                    {showEmergencyAccess && (
                      <TextField
                        fullWidth
                        label="Emergency Access Code"
                        value={loginData.emergencyCode}
                        onChange={(e) => setLoginData({ ...loginData, emergencyCode: e.target.value })}
                        margin="normal"
                        placeholder="Enter emergency access code"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading}
                      sx={{
                        mt: 3,
                        mb: 2,
                        py: 1.5,
                        bgcolor: '#13bbc6',
                        '&:hover': { bgcolor: '#0fa8b3' }
                      }}
                    >
                      {loading ? <CircularProgress size={24} /> : requiresTwoFactor ? 'Verify 2FA' : 'Login'}
                    </Button>
                  </Box>

                  <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                      Test Credentials:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Admin:</strong> admin@matsplash.com / 1111
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Director:</strong> director@matsplash.com / 1111
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Manager:</strong> manager@matsplash.com / 1111
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Receptionist:</strong> receptionist@matsplash.com / 1111
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Storekeeper:</strong> storekeeper@matsplash.com / 1111
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Driver:</strong> driver@matsplash.com / 1111
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Driver Assistant:</strong> driverassistant@matsplash.com / 1111
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Packer:</strong> packer@matsplash.com / 1111
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Security:</strong> security@matsplash.com / 1111
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Cleaner:</strong> cleaner@matsplash.com / 1111
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Operator:</strong> operator@matsplash.com / 1111
                    </Typography>
                    <Typography variant="body2">
                      <strong>Loader:</strong> loader@matsplash.com / 1111
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom sx={{ color: '#ff6b6b' }}>
                      Emergency Access:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ff6b6b' }}>
                      <strong>Emergency Code:</strong> EMERGENCY2024
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 1 }}>
                      ⚠️ Use only in emergency situations. This code bypasses all security restrictions.
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                      Security Notes:
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
                      • <strong>Director & Admin:</strong> Require 2FA (Two-Factor Authentication)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
                      • <strong>Manager, Sales, Admin:</strong> Must use whitelisted personal devices
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
                      • <strong>All Other Roles:</strong> Must use company-authorized devices (laptop, desktop, tablet, mobile)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
                      • <strong>Location:</strong> Non-Director roles must be at factory location
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                      • <strong>Factory Devices:</strong> FACTORY-LAPTOP-001, FACTORY-DESKTOP-001, FACTORY-TABLET-001, FACTORY-MOBILE-001
                    </Typography>
                  </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;