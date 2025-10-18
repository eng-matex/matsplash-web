import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Phone,
  Lock
} from '@mui/icons-material';
import axios from 'axios';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    pin: ''
  });
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', formData);
      
      if (response.data.success) {
        // Store token and redirect
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.location.reload(); // This will trigger the authentication check
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePinVisibility = () => {
    setShowPin(!showPin);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={10} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  🏭 MatSplash
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Factory Management System
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Sign in to access your dashboard
                </Typography>
              </Box>

              {/* Error Alert */}
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Email or Phone Number"
                  value={formData.emailOrPhone}
                  onChange={handleInputChange('emailOrPhone')}
                  margin="normal"
                  required
                  autoComplete="email"
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {formData.emailOrPhone.includes('@') ? <Email /> : <Phone />}
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="PIN"
                  type={showPin ? 'text' : 'password'}
                  value={formData.pin}
                  onChange={handleInputChange('pin')}
                  margin="normal"
                  required
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={togglePinVisibility}
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
                  size="large"
                  disabled={isSubmitting}
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>
              </Box>

              {/* Test Credentials */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Test Credentials:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Admin: admin@matsplash.com / 1111<br/>
                  Director: director@matsplash.com / 1111<br/>
                  Manager: manager@matsplash.com / 1111<br/>
                  Receptionist: receptionist@matsplash.com / 1111<br/>
                  Storekeeper: storekeeper@matsplash.com / 1111
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;