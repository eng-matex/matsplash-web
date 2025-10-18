import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  Autocomplete,
  FormControlLabel as MuiFormControlLabel,
  Checkbox,
  FormGroup,
  LinearProgress,
  Badge,
  Avatar,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  Print,
  Download,
  Upload,
  CheckCircle,
  Cancel,
  Pending,
  AccessTime,
  Schedule,
  Person,
  Group,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircleOutline,
  Remove,
  AddCircle,
  RemoveCircle,
  Assessment,
  History,
  LocalShipping,
  Business,
  AttachMoney,
  Receipt,
  ShoppingCart,
  Refresh,
  Save,
  Close,
  Login,
  Logout,
  Timer,
  Today,
  DateRange,
  PlayArrow,
  Stop,
  Pause,
  RestartAlt,
  Notifications,
  NotificationsActive,
  NotificationsOff
} from '@mui/icons-material';
import axios from 'axios';

interface AttendanceManagementProps {
  selectedSection: string;
  userRole?: string;
}

interface AttendanceRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_email: string;
  employee_role: string;
  date: string;
  clock_in_time: string;
  clock_out_time?: string;
  total_hours?: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'overtime';
  break_start?: string;
  break_end?: string;
  break_duration?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  last_login?: string;
}

interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  averageHours: number;
  overtimeHours: number;
}

const AttendanceManagement: React.FC<AttendanceManagementProps> = ({ selectedSection, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentSession, setCurrentSession] = useState<AttendanceRecord | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    averageHours: 0,
    overtimeHours: 0
  });

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mock data for attendance records
      const mockAttendance: AttendanceRecord[] = [
        {
          id: 1,
          employee_id: 1,
          employee_name: 'System Administrator',
          employee_email: 'admin@matsplash.com',
          employee_role: 'Admin',
          date: new Date().toISOString().split('T')[0],
          clock_in_time: '08:00:00',
          clock_out_time: '17:00:00',
          total_hours: 9,
          status: 'present',
          break_start: '12:00:00',
          break_end: '13:00:00',
          break_duration: 60,
          notes: 'Regular working day',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          employee_id: 2,
          employee_name: 'Director',
          employee_email: 'director@matsplash.com',
          employee_role: 'Director',
          date: new Date().toISOString().split('T')[0],
          clock_in_time: '09:15:00',
          clock_out_time: '18:30:00',
          total_hours: 9.25,
          status: 'late',
          break_start: '12:30:00',
          break_end: '13:30:00',
          break_duration: 60,
          notes: 'Late arrival due to meeting',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          employee_id: 3,
          employee_name: 'Manager',
          employee_email: 'manager@matsplash.com',
          employee_role: 'Manager',
          date: new Date().toISOString().split('T')[0],
          clock_in_time: '08:30:00',
          status: 'present',
          break_start: '12:00:00',
          break_end: '13:00:00',
          break_duration: 60,
          notes: 'Currently working',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 4,
          employee_id: 4,
          employee_name: 'Receptionist',
          employee_email: 'receptionist@matsplash.com',
          employee_role: 'Receptionist',
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          clock_in_time: '08:00:00',
          clock_out_time: '16:00:00',
          total_hours: 8,
          status: 'present',
          break_start: '12:00:00',
          break_end: '13:00:00',
          break_duration: 60,
          notes: 'Regular shift',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 5,
          employee_id: 5,
          employee_name: 'Storekeeper',
          employee_email: 'storekeeper@matsplash.com',
          employee_role: 'StoreKeeper',
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          clock_in_time: '07:45:00',
          clock_out_time: '16:45:00',
          total_hours: 9,
          status: 'overtime',
          break_start: '12:00:00',
          break_end: '13:00:00',
          break_duration: 60,
          notes: 'Overtime for inventory count',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];

      const mockEmployees: Employee[] = [
        { id: 1, name: 'System Administrator', email: 'admin@matsplash.com', role: 'Admin', status: 'active' },
        { id: 2, name: 'Director', email: 'director@matsplash.com', role: 'Director', status: 'active' },
        { id: 3, name: 'Manager', email: 'manager@matsplash.com', role: 'Manager', status: 'active' },
        { id: 4, name: 'Receptionist', email: 'receptionist@matsplash.com', role: 'Receptionist', status: 'active' },
        { id: 5, name: 'Storekeeper', email: 'storekeeper@matsplash.com', role: 'StoreKeeper', status: 'active' },
        { id: 6, name: 'Driver', email: 'driver@matsplash.com', role: 'Driver', status: 'active' },
        { id: 7, name: 'Packer', email: 'packer@matsplash.com', role: 'Packer', status: 'active' },
        { id: 8, name: 'Sales Representative', email: 'sales@matsplash.com', role: 'Sales', status: 'active' },
        { id: 9, name: 'Security Guard', email: 'security@matsplash.com', role: 'Security', status: 'active' },
        { id: 10, name: 'Cleaner', email: 'cleaner@matsplash.com', role: 'Cleaner', status: 'active' }
      ];

      setAttendanceRecords(mockAttendance);
      setEmployees(mockEmployees);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayRecords = mockAttendance.filter(record => record.date === today);
      
      setAttendanceStats({
        totalEmployees: mockEmployees.length,
        presentToday: todayRecords.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'overtime').length,
        absentToday: mockEmployees.length - todayRecords.length,
        lateToday: todayRecords.filter(r => r.status === 'late').length,
        averageHours: todayRecords.reduce((sum, r) => sum + (r.total_hours || 0), 0) / todayRecords.length || 0,
        overtimeHours: todayRecords.filter(r => r.status === 'overtime').reduce((sum, r) => sum + (r.total_hours || 0), 0)
      });

      // Check if user is currently clocked in
      const currentUser = mockEmployees.find(emp => emp.email === 'manager@matsplash.com'); // Mock current user
      if (currentUser) {
        const currentSessionRecord = todayRecords.find(record => 
          record.employee_id === currentUser.id && !record.clock_out_time
        );
        if (currentSessionRecord) {
          setIsClockedIn(true);
          setCurrentSession(currentSessionRecord);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleOpenDialog = (type: string, record?: AttendanceRecord) => {
    setDialogType(type);
    setSelectedRecord(record || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setSelectedRecord(null);
  };

  const handleClockIn = () => {
    // Mock clock in functionality
    const newRecord: AttendanceRecord = {
      id: Date.now(),
      employee_id: 3, // Mock current user
      employee_name: 'Manager',
      employee_email: 'manager@matsplash.com',
      employee_role: 'Manager',
      date: new Date().toISOString().split('T')[0],
      clock_in_time: new Date().toTimeString().split(' ')[0],
      status: 'present',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setAttendanceRecords(prev => [newRecord, ...prev]);
    setIsClockedIn(true);
    setCurrentSession(newRecord);
  };

  const handleClockOut = () => {
    if (currentSession) {
      const clockOutTime = new Date().toTimeString().split(' ')[0];
      const clockInTime = new Date(`2000-01-01T${currentSession.clock_in_time}`);
      const clockOutTimeDate = new Date(`2000-01-01T${clockOutTime}`);
      const totalHours = (clockOutTimeDate.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
      
      setAttendanceRecords(prev => prev.map(record => 
        record.id === currentSession.id 
          ? { ...record, clock_out_time: clockOutTime, total_hours: totalHours }
          : record
      ));
      
      setIsClockedIn(false);
      setCurrentSession(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      case 'half_day': return 'info';
      case 'overtime': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present': return <CheckCircleOutline />;
      case 'absent': return <Cancel />;
      case 'late': return <Warning />;
      case 'half_day': return <Schedule />;
      case 'overtime': return <Timer />;
      default: return <AccessTime />;
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employee_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesEmployee = employeeFilter === 'all' || record.employee_id.toString() === employeeFilter;
    
    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = record.date === new Date().toISOString().split('T')[0];
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      matchesDate = record.date === yesterday;
    } else if (dateFilter === 'this_week') {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      matchesDate = record.date >= weekAgo;
    }
    
    return matchesSearch && matchesStatus && matchesEmployee && matchesDate;
  });

  const renderAttendanceOverview = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Attendance Overview
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#4caf50', mr: 2 }}>
                  <Group />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {attendanceStats.totalEmployees}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Employees
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#2196f3', mr: 2 }}>
                  <CheckCircleOutline />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {attendanceStats.presentToday}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Present Today
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#ff9800', mr: 2 }}>
                  <Warning />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {attendanceStats.lateToday}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Late Today
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#9c27b0', mr: 2 }}>
                  <Timer />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {attendanceStats.averageHours.toFixed(1)}h
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Hours
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Clock In/Out Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ color: '#2c3e50' }}>
                Current Time: {currentTime.toLocaleTimeString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Today: {currentTime.toLocaleDateString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {!isClockedIn ? (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Login />}
                  onClick={handleClockIn}
                  sx={{ bgcolor: '#4caf50' }}
                >
                  Clock In
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Logout />}
                  onClick={handleClockOut}
                  sx={{ bgcolor: '#f44336' }}
                >
                  Clock Out
                </Button>
              )}
            </Box>
          </Box>
          
          {isClockedIn && currentSession && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#e8f5e8', borderRadius: 2 }}>
              <Typography variant="body1" sx={{ color: '#2e7d32' }}>
                <strong>Currently Clocked In</strong> - Started at {currentSession.clock_in_time}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Duration: {Math.floor((currentTime.getTime() - new Date(`2000-01-01T${currentSession.clock_in_time}`).getTime()) / (1000 * 60 * 60))}h {Math.floor(((currentTime.getTime() - new Date(`2000-01-01T${currentSession.clock_in_time}`).getTime()) % (1000 * 60 * 60)) / (1000 * 60))}m
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
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
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                  <MenuItem value="late">Late</MenuItem>
                  <MenuItem value="half_day">Half Day</MenuItem>
                  <MenuItem value="overtime">Overtime</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Date</InputLabel>
                <Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  label="Date"
                >
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="yesterday">Yesterday</MenuItem>
                  <MenuItem value="this_week">This Week</MenuItem>
                  <MenuItem value="all">All Time</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  label="Employee"
                >
                  <MenuItem value="all">All Employees</MenuItem>
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id.toString()}>
                      {employee.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('today');
                  setEmployeeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Attendance Records Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Clock In</TableCell>
                  <TableCell>Clock Out</TableCell>
                  <TableCell>Total Hours</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {record.employee_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {record.employee_role}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(record.date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {record.clock_in_time}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {record.clock_out_time || 'Not clocked out'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {record.total_hours ? `${record.total_hours.toFixed(1)}h` : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={record.status.charAt(0).toUpperCase() + record.status.slice(1)} 
                        color={getStatusColor(record.status) as any}
                        size="small"
                        icon={getStatusIcon(record.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleOpenDialog('view', record)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Record">
                        <IconButton size="small" onClick={() => handleOpenDialog('edit', record)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print Record">
                        <IconButton size="small" onClick={() => handleOpenDialog('print', record)}>
                          <Print />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderMyAttendance = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        My Attendance
      </Typography>

      {/* Personal Clock In/Out */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ color: '#2c3e50' }}>
                Current Session
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentTime.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {!isClockedIn ? (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Login />}
                  onClick={handleClockIn}
                  sx={{ bgcolor: '#4caf50' }}
                >
                  Clock In
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Logout />}
                  onClick={handleClockOut}
                  sx={{ bgcolor: '#f44336' }}
                >
                  Clock Out
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Personal Attendance History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
            My Attendance History
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Clock In</TableCell>
                  <TableCell>Clock Out</TableCell>
                  <TableCell>Total Hours</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.filter(record => record.employee_id === 3).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(record.date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {record.clock_in_time}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {record.clock_out_time || 'Not clocked out'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {record.total_hours ? `${record.total_hours.toFixed(1)}h` : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={record.status.charAt(0).toUpperCase() + record.status.slice(1)} 
                        color={getStatusColor(record.status) as any}
                        size="small"
                        icon={getStatusIcon(record.status)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      );
    }

    switch (selectedSection) {
      case 'attendance':
        return renderAttendanceOverview();
      case 'my-attendance':
        return renderMyAttendance();
      default:
        return renderAttendanceOverview();
    }
  };

  return (
    <Box>
      {renderContent()}
      
      {/* Dialog for various actions */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'view' && 'Attendance Record Details'}
          {dialogType === 'edit' && 'Edit Attendance Record'}
          {dialogType === 'print' && 'Print Attendance Record'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogType === 'view' && 'Attendance record details view will be implemented here.'}
            {dialogType === 'edit' && 'Attendance record editing functionality will be implemented here.'}
            {dialogType === 'print' && 'Attendance record printing functionality will be implemented here.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'edit' && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }}>
              Save Changes
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceManagement;
