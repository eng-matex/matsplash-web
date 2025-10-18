import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  AccessTime,
  CheckCircle,
  Cancel,
  Person,
  Schedule,
  TrendingUp
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { AttendanceLog } from '../types';
import axios from 'axios';

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockInDialogOpen, setClockInDialogOpen] = useState(false);
  const [clockOutDialogOpen, setClockOutDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchAttendanceLogs();
  }, []);

  const fetchAttendanceLogs = async () => {
    try {
      const response = await axios.get('/attendance/logs');
      if (response.data.success) {
        setAttendanceLogs(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching attendance logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      const clockInData = {
        employee_id: user?.id,
        employee_email: user?.email,
        clock_in_time: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        notes: notes
      };

      const response = await axios.post('/attendance/clock-in', clockInData);
      if (response.data.success) {
        setClockInDialogOpen(false);
        setNotes('');
        fetchAttendanceLogs();
      }
    } catch (error) {
      console.error('Error clocking in:', error);
    }
  };

  const handleClockOut = async (logId: number) => {
    try {
      const clockOutData = {
        clock_out_time: new Date().toISOString(),
        notes: notes
      };

      const response = await axios.patch(`/attendance/${logId}/clock-out`, clockOutData);
      if (response.data.success) {
        setClockOutDialogOpen(false);
        setNotes('');
        fetchAttendanceLogs();
      }
    } catch (error) {
      console.error('Error clocking out:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      'present': 'success',
      'absent': 'error',
      'late': 'warning',
      'half_day': 'info'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle color="success" />;
      case 'absent':
        return <Cancel color="error" />;
      case 'late':
        return <Schedule color="warning" />;
      case 'half_day':
        return <AccessTime color="info" />;
      default:
        return <AccessTime />;
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateHours = (clockIn: string, clockOut?: string) => {
    if (!clockOut) return 'In Progress';
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return `${diffHours.toFixed(1)}h`;
  };

  const canManageAttendance = ['Admin', 'Manager', 'Director'].includes(user?.role || '');
  const isEmployee = user?.isEmployee;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Attendance Management
        </Typography>
        {isEmployee && (
          <Button
            variant="contained"
            startIcon={<AccessTime />}
            onClick={() => setClockInDialogOpen(true)}
          >
            Clock In
          </Button>
        )}
      </Box>

      {/* Attendance Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Today's Attendance</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {attendanceLogs.filter(log => 
                  log.date === new Date().toISOString().split('T')[0] && 
                  log.status === 'present'
                ).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Present today
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Attendance Rate</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                85%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Average Hours</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                8.2h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Per day
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTime color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Logs</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {attendanceLogs.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Attendance Logs */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Attendance Records
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Clock In</TableCell>
                  <TableCell>Clock Out</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendanceLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person />
                        <Box>
                          <Typography variant="subtitle2">{log.employee_email}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {log.employee_id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{formatDate(log.date)}</TableCell>
                    <TableCell>{formatTime(log.clock_in_time)}</TableCell>
                    <TableCell>
                      {log.clock_out_time ? formatTime(log.clock_out_time) : 'In Progress'}
                    </TableCell>
                    <TableCell>{calculateHours(log.clock_in_time, log.clock_out_time)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(log.status)}
                        <Chip
                          label={log.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(log.status)}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedLog(log);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {!log.clock_out_time && isEmployee && log.employee_id === user?.id && (
                        <Tooltip title="Clock Out">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedLog(log);
                              setClockOutDialogOpen(true);
                            }}
                            color="primary"
                          >
                            <AccessTime />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Clock In Dialog */}
      <Dialog open={clockInDialogOpen} onClose={() => setClockInDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Clock In</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body1">
                You are about to clock in for today. Current time: {new Date().toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about your arrival..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClockInDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleClockIn} variant="contained">
            Clock In
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clock Out Dialog */}
      <Dialog open={clockOutDialogOpen} onClose={() => setClockOutDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Clock Out</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body1">
                You are about to clock out. Current time: {new Date().toLocaleString()}
              </Typography>
              {selectedLog && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Clocked in at: {formatTime(selectedLog.clock_in_time)}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about your departure..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClockOutDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => selectedLog && handleClockOut(selectedLog.id)} 
            variant="contained"
          >
            Clock Out
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Attendance Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Employee</Typography>
                <Typography variant="body1">{selectedLog.employee_email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Date</Typography>
                <Typography variant="body1">{formatDate(selectedLog.date)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Clock In Time</Typography>
                <Typography variant="body1">{formatTime(selectedLog.clock_in_time)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Clock Out Time</Typography>
                <Typography variant="body1">
                  {selectedLog.clock_out_time ? formatTime(selectedLog.clock_out_time) : 'Still working'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Total Hours</Typography>
                <Typography variant="body1">
                  {calculateHours(selectedLog.clock_in_time, selectedLog.clock_out_time)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Status</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon(selectedLog.status)}
                  <Chip
                    label={selectedLog.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(selectedLog.status)}
                  />
                </Box>
              </Grid>
              {selectedLog.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Notes</Typography>
                  <Typography variant="body1">{selectedLog.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AttendancePage;
