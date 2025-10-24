import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  LinearProgress,
  Alert,
  AlertTitle,
  Tooltip,
  Badge,
  Divider,
  Stack,
  InputAdornment,
  Autocomplete
} from '@mui/material';
import {
  AccessTime,
  Person,
  LocationOn,
  Devices,
  TrendingUp,
  TrendingDown,
  FilterList,
  Search,
  Download,
  Refresh,
  Add,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Cancel,
  Warning,
  Schedule,
  Coffee,
  Work,
  Home,
  Phone,
  Computer,
  Tablet,
  Smartphone,
  Business,
  Timeline,
  BarChart,
  PieChart,
  ShowChart,
  DateRange,
  CalendarToday,
  People,
  Assignment,
  Security,
  SupervisorAccount,
  ManageAccounts
} from '@mui/icons-material';
// Charts temporarily disabled - will implement with simpler approach

interface AttendanceRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_email: string;
  employee_role: string;
  date: string;
  clock_in_time: string;
  clock_out_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  total_break_time?: number;
  hours_worked?: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_break';
  clock_in_location?: string;
  clock_out_location?: string;
  device_info?: string;
  notes?: string;
  admin_action?: boolean;
  created_at: string;
  updated_at: string;
}

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

interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onBreakToday: number;
  averageHours: number;
  overtimeHours: number;
  totalBreaks: number;
  averageBreakTime: number;
}

interface AttendanceDashboardProps {
  userRole: 'Admin' | 'Director' | 'Manager' | 'Employee';
  userId?: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`attendance-tabpanel-${index}`}
      aria-labelledby={`attendance-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({ userRole, userId }) => {
  const [loading, setLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    onBreakToday: 0,
    averageHours: 0,
    overtimeHours: 0,
    totalBreaks: 0,
    averageBreakTime: 0
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  // Dialog states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [chartDialogOpen, setChartDialogOpen] = useState(false);
  const [selectedEmployeeForChart, setSelectedEmployeeForChart] = useState<Employee | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch attendance records based on user role
      const attendanceResponse = await fetch(`http://localhost:3002/api/attendance/records?role=${userRole}&userId=${userId || ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const attendanceData = await attendanceResponse.json();
      
      if (attendanceData.success) {
        setAttendanceRecords(attendanceData.records || []);
        setAttendanceStats(attendanceData.stats || attendanceStats);
      }

      // Fetch employees based on user role
      const employeesResponse = await fetch(`http://localhost:3002/api/employees?role=${userRole}&userId=${userId || ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const employeesData = await employeesResponse.json();
      
      if (employeesData.success) {
        setEmployees(employeesData.employees || []);
      }

    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleViewDetails = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setDetailsDialogOpen(true);
  };

  const handleViewChart = (employee: Employee) => {
    setSelectedEmployeeForChart(employee);
    setChartDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'present': 'success',
      'absent': 'error',
      'late': 'warning',
      'half_day': 'info',
      'on_break': 'secondary'
    };
    return colors[status as keyof typeof colors] || 'default';
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
      case 'on_break':
        return <Coffee color="secondary" />;
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getDeviceIcon = (deviceInfo: string) => {
    try {
      const device = JSON.parse(deviceInfo);
      const userAgent = device.userAgent || '';
      
      if (userAgent.includes('Mobile')) {
        return <Smartphone />;
      } else if (userAgent.includes('Tablet')) {
        return <Tablet />;
      } else {
        return <Computer />;
      }
    } catch {
      return <Devices />;
    }
  };

  const getLocationInfo = (locationData: string) => {
    try {
      const location = JSON.parse(locationData);
      return location.address || 'Unknown location';
    } catch {
      return 'Unknown location';
    }
  };

  // Filter records based on current filters
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = !searchTerm || 
      record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesEmployee = employeeFilter === 'all' || record.employee_id.toString() === employeeFilter;
    const matchesRole = roleFilter === 'all' || record.employee_role === roleFilter;
    
    // Date filter logic
    let matchesDate = true;
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      matchesDate = record.date === today;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = new Date(record.date) >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = new Date(record.date) >= monthAgo;
    }

    return matchesSearch && matchesStatus && matchesEmployee && matchesRole && matchesDate;
  });

  // Chart data preparation
  const prepareChartData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayRecords = filteredRecords.filter(record => record.date === date);
      const presentCount = dayRecords.filter(record => record.status === 'present').length;
      const absentCount = dayRecords.filter(record => record.status === 'absent').length;
      const lateCount = dayRecords.filter(record => record.status === 'late').length;
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        total: presentCount + absentCount + lateCount
      };
    });
  };

  const COLORS = ['#4CAF50', '#F44336', '#FF9800', '#2196F3'];

  const chartData = prepareChartData();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccessTime />
        Attendance Dashboard
        <Chip 
          label={userRole} 
          color="primary" 
          size="small" 
          icon={<Security />}
        />
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Total Employees
                  </Typography>
                  <Typography variant="h4">
                    {attendanceStats.totalEmployees}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <People />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Present Today
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {attendanceStats.presentToday}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircle />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Absent Today
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {attendanceStats.absentToday}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <Cancel />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    On Break
                  </Typography>
                  <Typography variant="h4" color="secondary.main">
                    {attendanceStats.onBreakToday}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <Coffee />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Quick Actions</Typography>
            <Stack direction="row" spacing={1}>
              <Button
                startIcon={<Refresh />}
                onClick={fetchData}
                variant="outlined"
                size="small"
              >
                Refresh
              </Button>
              <Button
                startIcon={<Download />}
                variant="outlined"
                size="small"
              >
                Export
              </Button>
              <Button
                startIcon={<BarChart />}
                onClick={() => setChartDialogOpen(true)}
                variant="outlined"
                size="small"
              >
                Analytics
              </Button>
            </Stack>
          </Box>

          {/* Filters */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search employees..."
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
              <FormControl fullWidth size="small">
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
                  <MenuItem value="on_break">On Break</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
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
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  label="Date Range"
                >
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">Last 7 Days</MenuItem>
                  <MenuItem value="month">Last 30 Days</MenuItem>
                  <MenuItem value="all">All Time</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {(userRole === 'Admin' || userRole === 'Director') && (
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    label="Role"
                  >
                    <MenuItem value="all">All Roles</MenuItem>
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="Director">Director</MenuItem>
                    <MenuItem value="Manager">Manager</MenuItem>
                    <MenuItem value="Employee">Employee</MenuItem>
                    <MenuItem value="Sales">Sales</MenuItem>
                    <MenuItem value="Security">Security</MenuItem>
                    <MenuItem value="Driver">Driver</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={handleTabChange}>
            <Tab label="Attendance Logs" />
            <Tab label="Analytics" />
            <Tab label="Employee Records" />
            {(userRole === 'Admin' || userRole === 'Director') && (
              <Tab label="System Overview" />
            )}
          </Tabs>
        </Box>

        <TabPanel value={selectedTab} index={0}>
          {/* Attendance Logs Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Clock In</TableCell>
                  <TableCell>Clock Out</TableCell>
                  <TableCell>Break Time</TableCell>
                  <TableCell>Hours Worked</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {record.employee_name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {record.employee_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {record.employee_role}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell>{formatTime(record.clock_in_time)}</TableCell>
                    <TableCell>
                      {record.clock_out_time ? formatTime(record.clock_out_time) : '-'}
                    </TableCell>
                    <TableCell>
                      {record.total_break_time ? formatDuration(record.total_break_time) : '-'}
                    </TableCell>
                    <TableCell>
                      {record.hours_worked ? `${record.hours_worked.toFixed(1)}h` : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(record.status)}
                        label={record.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(record.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={getLocationInfo(record.clock_in_location || '')}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOn fontSize="small" />
                          <Typography variant="caption" noWrap sx={{ maxWidth: 100 }}>
                            {getLocationInfo(record.clock_in_location || '').split(',')[0]}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={record.device_info || 'Unknown device'}>
                        <IconButton size="small">
                          {getDeviceIcon(record.device_info || '{}')}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(record)}
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          {/* Analytics Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Attendance Trends (Last 7 Days)
                  </Typography>
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc', borderRadius: 1 }}>
                    <Typography variant="h6" color="text.secondary">
                      📊 Attendance Trends Chart
                      <br />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Chart will be implemented with attendance data visualization
                      </Typography>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Today's Status Distribution
                  </Typography>
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc', borderRadius: 1 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary">
                        📈 Status Distribution
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Present: {attendanceStats.presentToday}
                      </Typography>
                      <Typography variant="body2">
                        Absent: {attendanceStats.absentToday}
                      </Typography>
                      <Typography variant="body2">
                        Late: {attendanceStats.lateToday}
                      </Typography>
                      <Typography variant="body2">
                        On Break: {attendanceStats.onBreakToday}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          {/* Employee Records */}
          <Grid container spacing={2}>
            {employees.map((employee) => (
              <Grid item xs={12} sm={6} md={4} key={employee.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ width: 48, height: 48 }}>
                        {employee.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{employee.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {employee.role}
                        </Typography>
                      </Box>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        startIcon={<Timeline />}
                        onClick={() => handleViewChart(employee)}
                      >
                        View Chart
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Assignment />}
                        onClick={() => {
                          setEmployeeFilter(employee.id.toString());
                          setSelectedTab(0);
                        }}
                      >
                        View Records
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {(userRole === 'Admin' || userRole === 'Director') && (
          <TabPanel value={selectedTab} index={3}>
            {/* System Overview */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      System Statistics
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Average Hours Worked:</Typography>
                        <Typography fontWeight="bold">
                          {attendanceStats.averageHours.toFixed(1)}h
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Total Overtime Hours:</Typography>
                        <Typography fontWeight="bold" color="warning.main">
                          {attendanceStats.overtimeHours.toFixed(1)}h
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Total Breaks Taken:</Typography>
                        <Typography fontWeight="bold">
                          {attendanceStats.totalBreaks}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Average Break Time:</Typography>
                        <Typography fontWeight="bold">
                          {formatDuration(attendanceStats.averageBreakTime)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Device Usage
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Computer color="primary" />
                        <Typography>Desktop/Laptop: 45%</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Smartphone color="secondary" />
                        <Typography>Mobile: 35%</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tablet color="info" />
                        <Typography>Tablet: 20%</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        )}
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Attendance Record Details</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Employee Information</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ width: 48, height: 48 }}>
                    {selectedRecord.employee_name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedRecord.employee_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedRecord.employee_role}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedRecord.employee_email}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Attendance Details</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Date:</Typography>
                    <Typography fontWeight="bold">{formatDate(selectedRecord.date)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Clock In:</Typography>
                    <Typography fontWeight="bold">{formatTime(selectedRecord.clock_in_time)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Clock Out:</Typography>
                    <Typography fontWeight="bold">
                      {selectedRecord.clock_out_time ? formatTime(selectedRecord.clock_out_time) : 'Not clocked out'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Hours Worked:</Typography>
                    <Typography fontWeight="bold">
                      {selectedRecord.hours_worked ? `${selectedRecord.hours_worked.toFixed(1)}h` : 'Calculating...'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Break Time:</Typography>
                    <Typography fontWeight="bold">
                      {selectedRecord.total_break_time ? formatDuration(selectedRecord.total_break_time) : 'No breaks'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Status:</Typography>
                    <Chip
                      icon={getStatusIcon(selectedRecord.status)}
                      label={selectedRecord.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(selectedRecord.status) as any}
                      size="small"
                    />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Location & Device Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Clock In Location:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn fontSize="small" />
                      <Typography variant="body2">
                        {getLocationInfo(selectedRecord.clock_in_location || '')}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Clock Out Location:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn fontSize="small" />
                      <Typography variant="body2">
                        {selectedRecord.clock_out_location ? 
                          getLocationInfo(selectedRecord.clock_out_location) : 
                          'Not clocked out'
                        }
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Device Information:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getDeviceIcon(selectedRecord.device_info || '{}')}
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {selectedRecord.device_info || 'No device information'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Chart Dialog */}
      <Dialog open={chartDialogOpen} onClose={() => setChartDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Employee Attendance Chart - {selectedEmployeeForChart?.name}
        </DialogTitle>
        <DialogContent>
          {selectedEmployeeForChart && (
            <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc', borderRadius: 1 }}>
              <Typography variant="h6" color="text.secondary">
                📊 Employee Attendance Chart
                <br />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Chart will be implemented with employee-specific attendance data
                </Typography>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChartDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceDashboard;
