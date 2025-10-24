import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  AccessTime
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import AttendanceDashboard from '../components/AttendanceDashboard';

interface AttendanceEnhancedPageProps {}

const AttendanceEnhancedPage: React.FC<AttendanceEnhancedPageProps> = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTime />
          Attendance Management
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">
            {currentTime.toLocaleTimeString()}
          </Typography>
        </Box>
      </Box>

      {/* Current Status Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h5">{user?.name || 'User'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.role || 'Employee'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Use the dedicated "Clock In/Out" tab to manage your attendance status.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Alert severity="info" sx={{ p: 2 }}>
                <AlertTitle>Clock In/Out Management</AlertTitle>
                To clock in, clock out, or manage breaks, please use the dedicated <strong>"Clock In/Out"</strong> tab in the navigation menu.
              </Alert>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Attendance Dashboard */}
      <AttendanceDashboard 
        userRole={user?.role as 'Admin' | 'Director' | 'Manager' | 'Employee'} 
        userId={user?.id}
      />

      {/* Clock in/out dialogs removed - use dedicated Clock In/Out tab instead */}

      {/* Break Dialog */}
      <Dialog open={breakDialogOpen} onClose={() => setBreakDialogOpen(false)}>
        <DialogTitle>Start Break</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You are about to start your break. Your break time will be tracked automatically.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Break Time Tracking</AlertTitle>
            Your break time will be automatically tracked and deducted from your total working hours.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBreakDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleStartBreak} 
            variant="contained" 
            disabled={loading}
            color="secondary"
          >
            {loading ? 'Starting Break...' : 'Start Break'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceEnhancedPage;
