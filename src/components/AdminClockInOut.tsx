import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  AccessTime,
  Person,
  LocationOn,
  Devices,
  SupervisorAccount,
  Login,
  Logout,
  Coffee,
  Work,
  Refresh,
  Search,
  FilterList
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string;
  position?: string;
  avatar?: string;
  status: 'active' | 'inactive';
}

interface AttendanceRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_email: string;
  employee_role: string;
  clock_in_time: string;
  clock_out_time: string | null;
  hours_worked: number | null;
  status: string;
  on_break: boolean;
  break_start_time: string | null;
  break_end_time: string | null;
  total_break_time: number;
  clock_in_location: string;
  clock_out_location: string | null;
  break_start_location: string | null;
  break_end_location: string | null;
  device_info: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface LocationInfo {
  lat: number;
  lng: number;
  address: string;
  accuracy: number;
}

const AdminClockInOut: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [clockDialogOpen, setClockDialogOpen] = useState(false);
  const [clockType, setClockType] = useState<'in' | 'out' | 'break_start' | 'break_end' | null>(null);
  const [notes, setNotes] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchEmployees();
    fetchAttendanceRecords();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/attendance/employees?role=${user?.role}&userId=${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Filter out Admin, Director, Sales as they don't login
        const filteredEmployees = response.data.employees.filter((emp: Employee) => 
          !['Admin', 'Director', 'Sales'].includes(emp.role)
        );
        setEmployees(filteredEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/attendance/records?role=${user?.role}&userId=${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAttendanceRecords(response.data.records || []);
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    }
  };

  const getCurrentLocation = (): Promise<LocationInfo> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationInfo = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: `Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}`,
            accuracy: position.coords.accuracy
          };
          resolve(location);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const getDeviceInfo = () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isTablet: /iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent),
      isMobile: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent),
      isFactoryDevice: true, // Admin clock-in is always from factory device
      screenResolution: `${screen.width}x${screen.height}`,
      timestamp: new Date().toISOString(),
      networkAdapters: []
    };
  };

  const handleClockAction = async (type: 'in' | 'out' | 'break_start' | 'break_end') => {
    if (!selectedEmployee) return;

    setLoading(true);
    try {
      const location = await getCurrentLocation();
      const deviceInfo = getDeviceInfo();

      let endpoint = '';
      let payload: any = {
        employeeId: selectedEmployee.id,
        location,
        deviceInfo,
        adminAction: true,
        adminUserId: user?.id,
        notes: notes.trim() || `Admin ${type} action by ${user?.name}`
      };

      switch (type) {
        case 'in':
          endpoint = '/api/attendance/clock-in';
          break;
        case 'out':
          endpoint = '/api/attendance/clock-out';
          break;
        case 'break_start':
          endpoint = '/api/attendance/start-break';
          break;
        case 'break_end':
          endpoint = '/api/attendance/end-break';
          break;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} action completed successfully!`);
        setClockDialogOpen(false);
        setNotes('');
        setSelectedEmployee(null);
        fetchAttendanceRecords(); // Refresh records
      } else {
        alert(`Failed to ${type}: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error(`Error performing ${type} action:`, error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openClockDialog = (employee: Employee, type: 'in' | 'out' | 'break_start' | 'break_end') => {
    setSelectedEmployee(employee);
    setClockType(type);
    setClockDialogOpen(true);
  };

  const getEmployeeStatus = (employeeId: number) => {
    const today = new Date().toISOString().split('T')[0];
    const record = attendanceRecords.find(r => 
      r.employee_id === employeeId && 
      r.clock_in_time.startsWith(today) && 
      !r.clock_out_time
    );
    
    if (!record) return { status: 'not_clocked_in', record: null };
    if (record.on_break) return { status: 'on_break', record };
    return { status: 'clocked_in', record };
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const { status } = getEmployeeStatus(emp.id);
    return matchesSearch && status === statusFilter;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SupervisorAccount />
        Admin Clock-In/Out Management
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Admin Clock-In/Out</AlertTitle>
        You can clock in/out employees and manage their breaks. Location and device information will be automatically captured.
      </Alert>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Employees"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Employees</MenuItem>
                  <MenuItem value="not_clocked_in">Not Clocked In</MenuItem>
                  <MenuItem value="clocked_in">Clocked In</MenuItem>
                  <MenuItem value="on_break">On Break</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                startIcon={<Refresh />}
                onClick={() => {
                  fetchEmployees();
                  fetchAttendanceRecords();
                }}
                variant="outlined"
                fullWidth
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Grid container spacing={2}>
        {filteredEmployees.map((employee) => {
          const { status, record } = getEmployeeStatus(employee.id);
          
          return (
            <Grid item xs={12} md={6} lg={4} key={employee.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {employee.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{employee.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {employee.role}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {employee.email}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={status.replace('_', ' ').toUpperCase()}
                      color={
                        status === 'clocked_in' ? 'success' :
                        status === 'on_break' ? 'warning' :
                        'default'
                      }
                      size="small"
                    />
                  </Box>

                  {record && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Clocked in: {formatTime(record.clock_in_time)}
                      </Typography>
                      {record.on_break && record.break_start_time && (
                        <Typography variant="body2" color="text.secondary">
                          Break started: {formatTime(record.break_start_time)}
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {status === 'not_clocked_in' && (
                      <Button
                        size="small"
                        startIcon={<Login />}
                        onClick={() => openClockDialog(employee, 'in')}
                        color="success"
                      >
                        Clock In
                      </Button>
                    )}
                    
                    {status === 'clocked_in' && (
                      <>
                        <Button
                          size="small"
                          startIcon={<Coffee />}
                          onClick={() => openClockDialog(employee, 'break_start')}
                          color="warning"
                        >
                          Start Break
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Logout />}
                          onClick={() => openClockDialog(employee, 'out')}
                          color="error"
                        >
                          Clock Out
                        </Button>
                      </>
                    )}
                    
                    {status === 'on_break' && (
                      <Button
                        size="small"
                        startIcon={<Work />}
                        onClick={() => openClockDialog(employee, 'break_end')}
                        color="primary"
                      >
                        End Break
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Clock Action Dialog */}
      <Dialog open={clockDialogOpen} onClose={() => setClockDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {clockType && (
            <>
              {clockType === 'in' && <><Login /> Clock In Employee</>}
              {clockType === 'out' && <><Logout /> Clock Out Employee</>}
              {clockType === 'break_start' && <><Coffee /> Start Break</>}
              {clockType === 'break_end' && <><Work /> End Break</>}
            </>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <AlertTitle>Admin Action</AlertTitle>
                You are about to {clockType?.replace('_', ' ')} for {selectedEmployee.name} ({selectedEmployee.role}).
                Location and device information will be automatically captured.
              </Alert>

              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for this action..."
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClockDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => clockType && handleClockAction(clockType)}
            variant="contained"
            disabled={loading}
            color={clockType === 'out' ? 'error' : 'primary'}
          >
            {loading ? <CircularProgress size={20} /> : `Confirm ${clockType?.replace('_', ' ')}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminClockInOut;
