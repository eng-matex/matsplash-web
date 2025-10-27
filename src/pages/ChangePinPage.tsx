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
  IconButton,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  Security
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const ChangePinPage: React.FC = () => {
  const { user, changePin } = useAuth();
  const [step, setStep] = useState(0); // 0 = verify temp PIN, 1 = set new PIN
  const [tempPin, setTempPin] = useState('');
  const [formData, setFormData] = useState({
    newPin: '',
    confirmPin: ''
  });
  const [showTempPin, setShowTempPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleInputChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (field === 'tempPin') {
      setTempPin(event.target.value);
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: event.target.value
      }));
    }
    setError('');
    setSuccess('');
  };

  // Step 1: Verify temporary PIN
  const handleVerifyTempPin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsVerifying(true);
    setError('');
    setSuccess('');

    if (!tempPin || tempPin.length < 4) {
      setError('Please enter a valid temporary PIN');
      setIsVerifying(false);
      return;
    }

    if (!user) {
      setError('User information not available');
      setIsVerifying(false);
      return;
    }

    try {
      // Verify the temporary PIN by attempting to login
      const response = await axios.post('/api/auth/login', {
        emailOrPhone: user.email,
        pin: tempPin,
        location: {
          lat: 0,
          lng: 0,
          address: 'Temporary PIN verification',
          accuracy: 0
        },
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          isTablet: false,
          isMobile: false,
          isFactoryDevice: true,
          screenResolution: '1920x1080',
          timestamp: new Date().toISOString(),
          networkAdapters: []
        }
      });

      if (response.data.success && response.data.firstLogin) {
        // Temporary PIN is correct, proceed to step 2
        setStep(1);
        setSuccess('Temporary PIN verified successfully');
        setTempPin('');
      } else {
        setError('Invalid temporary PIN. Please try again.');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Invalid temporary PIN');
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 2: Set new PIN
  const handleSetNewPin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    // Validation
    if (formData.newPin.length < 4) {
      setError('PIN must be at least 4 characters long');
      setIsSubmitting(false);
      return;
    }

    if (formData.newPin !== formData.confirmPin) {
      setError('PINs do not match');
      setIsSubmitting(false);
      return;
    }

    if (!user) {
      setError('User information not available');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await changePin(user.id, formData.newPin);
      
      if (response.success) {
        setSuccess('PIN changed successfully! Redirecting to login...');
        setFormData({ newPin: '', confirmPin: '' });
        
        // Clear first login flag and redirect to login
        localStorage.removeItem('firstLogin');
        localStorage.removeItem('user');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setError(response.message || 'Failed to change PIN');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTempPinVisibility = () => {
    setShowTempPin(!showTempPin);
  };

  const toggleNewPinVisibility = () => {
    setShowNewPin(!showNewPin);
  };

  const toggleConfirmPinVisibility = () => {
    setShowConfirmPin(!showConfirmPin);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #13bbc6 0%, #0fa8b1 50%, #2dd4bf 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #13bbc6 0%, #0fa8b1 100%)',
              color: 'white',
              textAlign: 'center',
              py: 3,
              px: 3
            }}
          >
            <Security sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h4" component="h1" fontWeight="bold">
              First Time Login
            </Typography>
            <Typography variant="h6" sx={{ mt: 1, opacity: 0.95 }}>
              Change Your PIN
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            {/* Stepper */}
            <Stepper activeStep={step} sx={{ mb: 4 }}>
              <Step>
                <StepLabel>Verify Temporary PIN</StepLabel>
              </Step>
              <Step>
                <StepLabel>Set New PIN</StepLabel>
              </Step>
            </Stepper>

            {user && (
              <Typography variant="h6" textAlign="center" mb={3} color="primary">
                Welcome, {user.name}!
              </Typography>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

            {step === 0 ? (
              // Step 1: Verify temporary PIN
              <Box component="form" onSubmit={handleVerifyTempPin}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Please enter the temporary PIN that was provided to you.
                </Alert>

                <TextField
                  fullWidth
                  label="Temporary PIN"
                  type={showTempPin ? 'text' : 'password'}
                  value={tempPin}
                  onChange={handleInputChange('tempPin')}
                  margin="normal"
                  required
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={toggleTempPinVisibility}
                          edge="end"
                        >
                          {showTempPin ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                  helperText="Enter the temporary PIN you received"
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isVerifying}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #13bbc6 0%, #0fa8b1 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0fa8b1 0%, #0d959d 100%)',
                    }
                  }}
                >
                  {isVerifying ? 'Verifying...' : 'Verify PIN'}
                </Button>
              </Box>
            ) : (
              // Step 2: Set new PIN
              <Box component="form" onSubmit={handleSetNewPin}>
                <Alert severity="success" sx={{ mb: 3 }}>
                  Temporary PIN verified! Now please set your new PIN.
                </Alert>

                <TextField
                  fullWidth
                  label="New PIN"
                  type={showNewPin ? 'text' : 'password'}
                  value={formData.newPin}
                  onChange={handleInputChange('newPin')}
                  margin="normal"
                  required
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={toggleNewPinVisibility}
                          edge="end"
                        >
                          {showNewPin ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                  helperText="PIN must be at least 4 characters long"
                />

                <TextField
                  fullWidth
                  label="Confirm New PIN"
                  type={showConfirmPin ? 'text' : 'password'}
                  value={formData.confirmPin}
                  onChange={handleInputChange('confirmPin')}
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={toggleConfirmPinVisibility}
                          edge="end"
                        >
                          {showConfirmPin ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #13bbc6 0%, #0fa8b1 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0fa8b1 0%, #0d959d 100%)',
                    }
                  }}
                >
                  {isSubmitting ? 'Changing PIN...' : 'Change PIN'}
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  size="medium"
                  onClick={() => setStep(0)}
                  sx={{ mt: 2 }}
                >
                  Back
                </Button>
              </Box>
            )}

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {step === 0 
                  ? 'Enter your temporary PIN to continue'
                  : 'After changing your PIN, you will be redirected to login'
                }
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Container>
    </Box>
  );
};

export default ChangePinPage;
