import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import logo from '../assets/Matsplash-logo.png';

interface LoginPageProps {
  loginData: {
    emailOrPhone: string;
    pin: string;
    twoFactorCode: string;
    emergencyCode: string;
  };
  setLoginData: (data: any) => void;
  handleLogin: (e: React.FormEvent) => void;
  loading: boolean;
  error: string;
  requiresTwoFactor: boolean;
  setRequiresTwoFactor: (value: boolean) => void;
  showEmergencyAccess: boolean;
  setShowEmergencyAccess: (value: boolean) => void;
  showPin: boolean;
  setShowPin: (value: boolean) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({
  loginData,
  setLoginData,
  handleLogin,
  loading,
  error,
  requiresTwoFactor,
  setRequiresTwoFactor,
  showEmergencyAccess,
  setShowEmergencyAccess,
  showPin,
  setShowPin
}) => {
  return (
    <Box 
      sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        margin: 0,
        overflow: 'hidden',
        zIndex: 9999
      }}
    >
      <Box component="main" sx={{ 
        width: '100%', 
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: { xs: 2, sm: 100, md: 2 }
      }}>
        <Card 
          elevation={24}
          sx={{ 
            borderRadius: 6,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            width: '100%',
            height: '100%',
            maxWidth: 'none',
            margin: 0,
            padding: { xs: 2, sm: 2 }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            height: '90vh',
            flexDirection: { xs: 'column', md: 'row' }
          }}>
            {/* Left Side - Login Content */}
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              order: { xs: 1, md: 1 }
            }}>
              <CardContent sx={{ 
                p: { xs: 4, sm: 5, md: 6 }, 
                maxWidth: 400, 
                width: '100%' 
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Business Logo */}
                  <Box sx={{ mb: 3 }}>
                    <Box
                      component="img"
                      src={logo} 
                      alt="MatSplash Logo" 
                      sx={{ 
                        height: { xs: '70px', sm: '100px' },
                        width: 'auto',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                      }}
                    />
                  </Box>
                  
                  {/* Company Name and Tagline */}
                  <Typography 
                    component="h1" 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #13bbc6, #0891b2)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                      textAlign: 'center',
                      fontSize: { xs: '1.5rem', sm: '2rem' }
                    }}
                  >
                    MatSplash
                  </Typography>
                  
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'text.secondary',
                      mb: 4,
                      textAlign: 'center',
                      fontWeight: 300
                    }}
                  >
                    Operations Suite
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary',
                      mb: 4,
                      textAlign: 'center'
                    }}
                  >
                    Please sign in to access your dashboard
                  </Typography>

                  <Box component="form" onSubmit={handleLogin} noValidate sx={{ width: '100%' }}>
                    {/* Error Alert */}
                    {error && (
                      <Alert 
                        severity="error" 
                        sx={{ 
                          width: '100%', 
                          mb: 2,
                          borderRadius: 2,
                          '& .MuiAlert-icon': {
                            color: '#d32f2f'
                          }
                        }}
                      >
                        {error}
                      </Alert>
                    )}

                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="emailOrPhone"
                      label="Email or Phone Number"
                      name="emailOrPhone"
                      autoComplete="email tel"
                      autoFocus
                      disabled={requiresTwoFactor}
                      value={loginData.emailOrPhone}
                      onChange={(e) => setLoginData({ ...loginData, emailOrPhone: e.target.value })}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: '#13bbc6',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#13bbc6',
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#13bbc6',
                        },
                      }}
                    />
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="pin"
                      label="PIN"
                      type={showPin ? 'text' : 'password'}
                      id="pin"
                      autoComplete="current-password"
                      disabled={requiresTwoFactor}
                      value={loginData.pin}
                      onChange={(e) => setLoginData({ ...loginData, pin: e.target.value })}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: '#13bbc6',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#13bbc6',
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#13bbc6',
                        },
                      }}
                      InputProps={{
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
                        margin="normal"
                        required
                        fullWidth
                        label="Two-Factor Authentication Code"
                        value={loginData.twoFactorCode}
                        onChange={(e) => setLoginData({ ...loginData, twoFactorCode: e.target.value })}
                        placeholder="Enter 6-digit code from your authenticator app"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: '#13bbc6',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#13bbc6',
                            },
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#13bbc6',
                          },
                        }}
                      />
                    )}

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Button
                        type="button"
                        variant="text"
                        size="small"
                        onClick={() => setShowEmergencyAccess(!showEmergencyAccess)}
                        sx={{ 
                          color: '#ff6b6b',
                          fontSize: '13px',
                          textTransform: 'none'
                        }}
                        disabled={!loginData.emailOrPhone || !loginData.emailOrPhone.includes('director')}
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
                        sx={{ 
                          fontSize: '13px',
                          textTransform: 'none'
                        }}
                      >
                        Reset
                      </Button>
                    </Box>

                    {/* Show 2FA option for Director and Admin */}
                    {loginData.emailOrPhone && (loginData.emailOrPhone.includes('director') || loginData.emailOrPhone.includes('admin')) && !requiresTwoFactor && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          type="button"
                          variant="outlined"
                          size="small"
                          onClick={() => setRequiresTwoFactor(true)}
                          sx={{ 
                            color: '#13bbc6', 
                            borderColor: '#13bbc6',
                            fontSize: '18px',
                            textTransform: 'none'
                          }}
                        >
                          Use Two-Factor Authentication
                        </Button>
                      </Box>
                    )}

                    {showEmergencyAccess && (
                      <TextField
                        margin="normal"
                        fullWidth
                        label="Emergency Access Code"
                        value={loginData.emergencyCode}
                        onChange={(e) => setLoginData({ ...loginData, emergencyCode: e.target.value })}
                        placeholder="Enter emergency access code"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: '#13bbc6',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#13bbc6',
                            },
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#13bbc6',
                          },
                        }}
                      />
                    )}
                    
                    <Button 
                      type="submit" 
                      fullWidth 
                      variant="contained" 
                      sx={{ 
                        mt: 3, 
                        mb: 2,
                        py: 1.5,
                        borderRadius: 2,
                        background: 'linear-gradient(45deg, #13bbc6, #0891b2)',
                        boxShadow: '0 4px 20px rgba(19, 187, 198, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #0891b2, #13bbc6)',
                          boxShadow: '0 6px 25px rgba(19, 187, 198, 0.4)',
                          transform: 'translateY(-1px)'
                        },
                        '&:active': {
                          transform: 'translateY(0px)'
                        },
                        transition: 'all 0.2s ease-in-out',
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                      }} 
                      disabled={loading}
                    >
                      {loading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={24} color="inherit" />
                          <span>Signing In...</span>
                        </Box>
                      ) : (
                        requiresTwoFactor ? 'Verify 2FA' : 'Sign In'
                      )}
                    </Button>
                  </Box>
                  
                  {/* Footer */}
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'text.secondary',
                      mt: 3,
                      textAlign: 'center'
                    }}
                  >
                    © 2025 MatSplash Operations Suite. All rights reserved.
                  </Typography>
                </Box>
              </CardContent>
            </Box>

            {/* Right Side - Big Logo */}
            <Box 
              sx={{ 
                flex: 1, 
                display: { xs: 'flex', md: 'flex' },
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(19, 187, 198, 0.1) 0%, rgba(8, 145, 178, 0.1) 100%)',
                position: 'relative',
                minHeight: { xs: '200px', md: 'auto' },
                order: { xs: 1, md: 2 },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2313bbc6" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                  backgroundSize: '60px 60px'
                }
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 1,
                  p: { xs: 3, sm: 4, md: 5 }
                }}
              >
                <Box
                  component="img"
                  src={logo} 
                  alt="MatSplash Logo" 
                  sx={{ 
                    height: { xs: '150px', sm: '200px', md: '300px' },
                    width: 'auto',
                    filter: 'drop-shadow(0 10px 30px rgba(19, 187, 198, 0.3))',
                    opacity: 0.9
                  }}
                />
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #13bbc6, #0891b2)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mt: { xs: 2, sm: 3 },
                    textAlign: 'center',
                    opacity: 0.8,
                    fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' }
                  }}
                >
                  MatSplash
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: 'text.secondary',
                    mt: 1,
                    textAlign: 'center',
                    fontWeight: 300,
                    opacity: 0.7
                  }}
                >
                  Premium Water
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default LoginPage;
