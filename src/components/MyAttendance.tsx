import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  AccessTime,
  CheckCircle,
  Warning,
  Search,
  Refresh,
  FilterList,
  CalendarToday,
  Person,
  Schedule
} from '@mui/icons-material';

interface AttendanceRecord {
  id: number;
  clock_in_time: string;
  clock_out_time?: string;
  hours_worked?: number;
  status: string;
  on_break: boolean;
  break_start_time?: string;
  break_end_time?: string;
  total_break_time?: number;
  clock_in_location?: string;
  clock_out_location?: string;
  break_start_location?: string;
  break_end_location?: string;
  notes?: string;
  created_at: string;
}

interface AttendanceStats {
  totalDays: number;
  totalHours: number;
  averageHours: number;
  totalBreaks: number;
  averageBreakTime: number;
}

const MyAttendance: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    totalDays: 0,
    totalHours: 0,
    averageHours: 0,
    totalBreaks: 0,
    averageBreakTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState('month');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchAttendanceRecords();
  }, [dateRange]);

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/attendance/records?employeeId=${user.id}&dateRange=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setAttendanceRecords(data.records || []);
        setAttendanceStats(data.stats || {
          totalDays: 0,
          totalHours: 0,
          averageHours: 0,
          totalBreaks: 0,
          averageBreakTime: 0
        });
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'absent': return 'error';
      default: return 'default';
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = !searchTerm || 
      record.clock_in_time.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccessTime />
        My Attendance Records
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {attendanceStats.totalDays}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {formatDuration(attendanceStats.totalHours)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {formatDuration(attendanceStats.averageHours)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Hours/Day
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {attendanceStats.totalBreaks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Breaks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="late">Late</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  label="Date Range"
                >
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="year">This Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={fetchAttendanceRecords}
                fullWidth
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Attendance Records Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule />
            Attendance History ({filteredRecords.length} records)
          </Typography>
          
          {filteredRecords.length === 0 ? (
            <Alert severity="info">
              No attendance records found for the selected period.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Clock In</TableCell>
                    <TableCell>Clock Out</TableCell>
                    <TableCell>Hours Worked</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Breaks</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.clock_in_time).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {formatTime(record.clock_in_time)}
                      </TableCell>
                      <TableCell>
                        {record.clock_out_time ? formatTime(record.clock_out_time) : 'Not clocked out'}
                      </TableCell>
                      <TableCell>
                        {record.hours_worked ? formatDuration(record.hours_worked * 3600) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={record.status}
                          color={getStatusColor(record.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {record.total_break_time ? formatDuration(record.total_break_time) : 'No breaks'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={record.clock_in_location || 'N/A'}>
                          <Typography variant="body2" noWrap>
                            {record.clock_in_location ? '📍' : 'N/A'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {record.notes || 'No notes'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default MyAttendance;
