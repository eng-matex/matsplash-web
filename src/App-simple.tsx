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
  InputAdornment
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import axios from 'axios';
import theme from './theme';
import logo from './assets/Matsplash-logo.png';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loginData, setLoginData] = useState({ emailOrPhone: '', pin: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', loginData);
      if (response.data.success) {
        const loggedInUser = response.data.user;
        setUser(loggedInUser);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        setIsLoggedIn(true);
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
  };

  if (isLoggedIn) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ 
          minHeight: '100vh', 
          background: 'linear-gradient(135deg, #13bbc6 30%, #FFD700 90%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}>
          <Card sx={{ maxWidth: 600, width: '100%', p: 3 }}>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <img src={logo} alt="MatSplash Logo" style={{ width: 200, height: 'auto', marginBottom: 20 }} />
                <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                  Welcome, {user.name}!
                </Typography>
                <Typography variant="h6" sx={{ color: '#13bbc6', mb: 2 }}>
                  Role: {user.role}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Your role-specific dashboard is being prepared. The complete factory management system is ready!
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleLogout}
                  sx={{ 
                    bgcolor: '#f44336',
                    '&:hover': { bgcolor: '#d32f2f' }
                  }}
                >
                  Logout
                </Button>
              </Box>
            </CardContent>
          </Card>
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
                  {loading ? <CircularProgress size={24} /> : 'Login'}
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
                <Typography variant="body2">
                  <strong>Storekeeper:</strong> storekeeper@matsplash.com / 1111
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