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
  Lock,
  Security
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const ChangePinPage: React.FC = () => {
  const { user, changePin } = useAuth();
  const [formData, setFormData] = useState({
    newPin: '',
    confirmPin: ''
  });
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
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
        setSuccess('PIN changed successfully! You can now login with your new PIN.');
        setFormData({ newPin: '', confirmPin: '' });
      } else {
        setError(response.message || 'Failed to change PIN');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
              background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
              color: 'white',
              textAlign: 'center',
              py: 4,
              px: 3
            }}
          >
            <Security sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h4" component="h1" fontWeight="bold">
              Change Your PIN
            </Typography>
            <Typography variant="h6" sx={{ mt: 1, opacity: 0.9 }}>
              First time login - PIN change required
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
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

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="New PIN"
                type={showNewPin ? 'text' : 'password'}
                value={formData.newPin}
                onChange={handleInputChange('newPin')}
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
                  background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)',
                  }
                }}
              >
                {isSubmitting ? 'Changing PIN...' : 'Change PIN'}
              </Button>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                After changing your PIN, you will be redirected to login
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Container>
    </Box>
  );
};

export default ChangePinPage;
