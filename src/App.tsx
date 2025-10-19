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
import DirectorDashboard from './components/DirectorDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import ReceptionistDashboard from './components/ReceptionistDashboard';
import StoreKeeperDashboard from './components/StoreKeeperDashboard';
import DriverDashboard from './components/DriverDashboard';
import PackerDashboard from './components/PackerDashboard';
import OperatorDashboard from './components/OperatorDashboard';
import CleanerDashboard from './components/CleanerDashboard';
import LoaderDashboard from './components/LoaderDashboard';
import SalesDashboard from './components/SalesDashboard';
import SecurityDashboard from './components/SecurityDashboard';
import LoginPage from './components/LoginPage';

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
          // Get enhanced device information including network adapters
          const { getEnhancedDeviceInfo } = await import('./utils/networkUtils');
          const deviceInfo = await getEnhancedDeviceInfo();

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

        // Handle role-specific dashboards
        switch (user?.role?.toLowerCase()) {
          case 'director':
            return <DirectorDashboard currentPage={currentPage} onPageChange={setCurrentPage} />;
          case 'admin':
            return <ManagerDashboard selectedSection={currentPage} />; // Admin uses Manager dashboard
          case 'manager':
            return <ManagerDashboard selectedSection={currentPage} />;
          case 'receptionist':
            return <ReceptionistDashboard selectedSection={currentPage} />;
          case 'storekeeper':
            return <StoreKeeperDashboard selectedSection={currentPage} />;
          case 'driver':
            return <DriverDashboard selectedSection={currentPage} />;
          case 'driver assistant':
            return <DriverDashboard selectedSection={currentPage} />; // Driver Assistant uses Driver dashboard
          case 'packer':
            return <PackerDashboard selectedSection={currentPage} />;
          case 'operator':
            return <OperatorDashboard selectedSection={currentPage} />;
          case 'cleaner':
            return <CleanerDashboard selectedSection={currentPage} />;
          case 'loader':
            return <LoaderDashboard selectedSection={currentPage} />;
          case 'sales':
            return <SalesDashboard selectedSection={currentPage} />;
          case 'security':
            return <SecurityDashboard selectedSection={currentPage} />;
          default:
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
        }
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
      <LoginPage
        loginData={loginData}
        setLoginData={setLoginData}
        handleLogin={handleLogin}
        loading={loading}
        error={error}
        requiresTwoFactor={requiresTwoFactor}
        setRequiresTwoFactor={setRequiresTwoFactor}
        showEmergencyAccess={showEmergencyAccess}
        setShowEmergencyAccess={setShowEmergencyAccess}
        showPin={showPin}
        setShowPin={setShowPin}
      />
    </ThemeProvider>
  );
};

export default App;