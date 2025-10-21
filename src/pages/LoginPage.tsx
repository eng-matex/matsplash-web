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
import MatsplashLogo from '../assets/Matsplash-logo.png';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    pin: '',
    twoFactorCode: ''
  });
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

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
      // Create proper request payload with all required fields
      const requestData = {
        emailOrPhone: formData.emailOrPhone,
        pin: formData.pin,
        location: {
          lat: 32.7123, // Default location for testing
          lng: -96.7939,
          address: 'Default Location',
          accuracy: 0.1
        },
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          isTablet: false,
          isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
          isFactoryDevice: true,
          screenResolution: `${screen.width}x${screen.height}`,
          timestamp: new Date().toISOString(),
          networkAdapters: []
        },
        twoFactorCode: formData.twoFactorCode || null,
        emergencyCode: null
      };

      console.log('🔍 Sending login request:', requestData);

      const response = await axios.post('http://localhost:3002/api/auth/login', requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        // Store token and redirect
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.location.reload(); // This will trigger the authentication check
      } else if (response.data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setError('Please enter your 2FA code');
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
        background: '#f5f5f5',
        padding: 0,
        margin: 0
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          margin: '0 auto',
          padding: '40px 20px'
        }}
      >
        <Card
          elevation={0}
          sx={{
            borderRadius: 0,
            border: '1px solid #e0e0e0',
            backgroundColor: '#ffffff'
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {/* Header with Logo */}
            <Box 
              sx={{ 
                textAlign: 'center', 
                padding: '40px 30px 20px 30px',
                borderBottom: '1px solid #f0f0f0'
              }}
            >
              <Box sx={{ mb: 2 }}>
                <img 
                  src={MatsplashLogo} 
                  alt="MatSplash Logo" 
                  style={{ 
                    height: '60px', 
                    width: 'auto',
                    maxWidth: '200px'
                  }} 
                />
              </Box>
              <Typography 
                variant="h5" 
                component="h1" 
                sx={{ 
                  fontWeight: 600,
                  color: '#2c3e50',
                  fontSize: '24px',
                  margin: 0
                }}
              >
                MatSplash Suite
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#7f8c8d',
                  fontSize: '14px',
                  marginTop: '8px'
                }}
              >
                Factory Management System
              </Typography>
            </Box>

            {/* Login Form */}
            <Box sx={{ padding: '30px' }}>
              {/* Error Alert */}
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    fontSize: '14px',
                    '& .MuiAlert-message': {
                      fontSize: '14px'
                    }
                  }}
                >
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email or Phone Number"
                  value={formData.emailOrPhone}
                  onChange={handleInputChange('emailOrPhone')}
                  margin="normal"
                  required
                  autoComplete="email"
                  autoFocus
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px',
                      fontSize: '14px'
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '14px'
                    },
                    mb: 2
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {formData.emailOrPhone.includes('@') ? 
                          <Email sx={{ fontSize: '20px', color: '#7f8c8d' }} /> : 
                          <Phone sx={{ fontSize: '20px', color: '#7f8c8d' }} />
                        }
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
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px',
                      fontSize: '14px'
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '14px'
                    },
                    mb: 3
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ fontSize: '20px', color: '#7f8c8d' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={togglePinVisibility}
                          edge="end"
                          sx={{ 
                            padding: '8px',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                        >
                          {showPin ? 
                            <VisibilityOff sx={{ fontSize: '20px', color: '#7f8c8d' }} /> : 
                            <Visibility sx={{ fontSize: '20px', color: '#7f8c8d' }} />
                          }
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {requiresTwoFactor && (
                  <TextField
                    fullWidth
                    label="Two-Factor Authentication Code"
                    value={formData.twoFactorCode}
                    onChange={handleInputChange('twoFactorCode')}
                    margin="normal"
                    required
                    placeholder="Enter 6-digit code (use 123456 for testing)"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '4px',
                        fontSize: '14px'
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '14px'
                      },
                      mb: 2
                    }}
                  />
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{ 
                    py: 1.5,
                    fontSize: '16px',
                    fontWeight: 500,
                    backgroundColor: '#13bbc6',
                    borderRadius: '4px',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#0fa8b1'
                    },
                    '&:disabled': {
                      backgroundColor: '#bdc3c7'
                    }
                  }}
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>
              </Box>
            </Box>

            {/* Test Credentials */}
            <Box 
              sx={{ 
                padding: '20px 30px 30px 30px',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #f0f0f0'
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#2c3e50',
                  mb: 1
                }}
              >
                Test Credentials:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '12px',
                  color: '#7f8c8d',
                  lineHeight: 1.5
                }}
              >
                Admin: admin@matsplash.com / 1111<br/>
                Director: director@matsplash.com / 1111<br/>
                Manager: manager@matsplash.com / 1111<br/>
                Receptionist: receptionist@matsplash.com / 1111<br/>
                Storekeeper: storekeeper@matsplash.com / 1111
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default LoginPage;