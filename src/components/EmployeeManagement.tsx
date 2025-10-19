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
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Autocomplete,
  FormGroup,
  Switch,
  Badge
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
  Person,
  Email,
  Phone,
  LocationOn,
  Work,
  Schedule,
  Security,
  AdminPanelSettings,
  SupervisorAccount,
  Business,
  LocalShipping,
  CleaningServices,
  Engineering,
  AttachMoney,
  Assessment,
  Lock,
  LockOpen,
  PersonAdd,
  Group,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import axios from 'axios';

interface EmployeeManagementProps {
  selectedSection: string;
  userRole?: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  hire_date: string;
  salary: number;
  address: string;
  emergency_contact: string;
  emergency_phone: string;
  is_first_login: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  notes?: string;
  permissions: string[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  color: string;
  icon: React.ElementType;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ selectedSection, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    status: 'active',
    salary: 0,
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    notes: '',
    permissions: []
  });

  const roles: Role[] = [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access and management',
      permissions: ['all'],
      color: '#f44336',
      icon: AdminPanelSettings
    },
    {
      id: 'director',
      name: 'Director',
      description: 'Executive oversight and strategic decisions',
      permissions: ['view_all', 'manage_employees', 'view_reports', 'manage_pricing'],
      color: '#9c27b0',
      icon: SupervisorAccount
    },
    {
      id: 'manager',
      name: 'Manager',
      description: 'Departmental management and operations',
      permissions: ['view_all', 'manage_employees', 'view_reports', 'manage_attendance'],
      color: '#2196f3',
      icon: SupervisorAccount
    },
    {
      id: 'receptionist',
      name: 'Receptionist',
      description: 'Customer service and order processing',
      permissions: ['manage_orders', 'view_customers', 'process_payments'],
      color: '#4caf50',
      icon: Person
    },
    {
      id: 'storekeeper',
      name: 'Storekeeper',
      description: 'Inventory and warehouse management',
      permissions: ['manage_inventory', 'view_orders', 'manage_stock'],
      color: '#ff9800',
      icon: Business
    },
    {
      id: 'driver',
      name: 'Driver',
      description: 'Delivery and transportation services',
      permissions: ['view_dispatches', 'update_delivery_status', 'view_route'],
      color: '#607d8b',
      icon: LocalShipping
    },
    {
      id: 'packer',
      name: 'Packer',
      description: 'Product packaging and preparation',
      permissions: ['view_packing_orders', 'update_packing_status', 'log_packing'],
      color: '#795548',
      icon: Work
    },
    {
      id: 'sales',
      name: 'Sales Representative',
      description: 'Sales and customer relationship management',
      permissions: ['manage_sales', 'view_customers', 'process_orders'],
      color: '#e91e63',
      icon: AttachMoney
    },
    {
      id: 'security',
      name: 'Security',
      description: 'Security and access control',
      permissions: ['view_security_logs', 'manage_visitors', 'access_control'],
      color: '#ff5722',
      icon: Security
    },
    {
      id: 'cleaner',
      name: 'Cleaner',
      description: 'Facility maintenance and cleaning',
      permissions: ['view_cleaning_tasks', 'update_task_status', 'manage_supplies'],
      color: '#00bcd4',
      icon: CleaningServices
    },
    {
      id: 'operator',
      name: 'Machine Operator',
      description: 'Equipment operation and maintenance',
      permissions: ['view_equipment_status', 'log_maintenance', 'operate_machines'],
      color: '#3f51b5',
      icon: Engineering
    },
    {
      id: 'loader',
      name: 'Loader',
      description: 'Loading and unloading operations',
      permissions: ['view_loading_tasks', 'update_loading_status', 'manage_inventory'],
      color: '#8bc34a',
      icon: Work
    }
  ];

  const departments = [
    'Administration',
    'Operations',
    'Sales',
    'Logistics',
    'Production',
    'Security',
    'Maintenance',
    'Customer Service'
  ];

  useEffect(() => {
    fetchData();
  }, [selectedSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mock data for employees
      const mockEmployees: Employee[] = [
        {
          id: 1,
          name: 'System Administrator',
          email: 'admin@matsplash.com',
          phone: '08012345678',
          role: 'admin',
          department: 'Administration',
          status: 'active',
          hire_date: '2024-01-01',
          salary: 150000,
          address: 'Lagos, Nigeria',
          emergency_contact: 'Emergency Contact',
          emergency_phone: '08087654321',
          is_first_login: false,
          last_login: new Date().toISOString(),
          created_at: '2024-01-01T00:00:00Z',
          updated_at: new Date().toISOString(),
          created_by: 'System',
          notes: 'System administrator account',
          permissions: ['all']
        },
        {
          id: 2,
          name: 'Director',
          email: 'director@matsplash.com',
          phone: '08023456789',
          role: 'director',
          department: 'Administration',
          status: 'active',
          hire_date: '2024-01-15',
          salary: 200000,
          address: 'Lagos, Nigeria',
          emergency_contact: 'Emergency Contact',
          emergency_phone: '08076543210',
          is_first_login: false,
          last_login: new Date(Date.now() - 3600000).toISOString(),
          created_at: '2024-01-15T00:00:00Z',
          updated_at: new Date().toISOString(),
          created_by: 'System',
          notes: 'Executive director',
          permissions: ['view_all', 'manage_employees', 'view_reports', 'manage_pricing']
        },
        {
          id: 3,
          name: 'Manager',
          email: 'manager@matsplash.com',
          phone: '08034567890',
          role: 'manager',
          department: 'Operations',
          status: 'active',
          hire_date: '2024-02-01',
          salary: 120000,
          address: 'Lagos, Nigeria',
          emergency_contact: 'Emergency Contact',
          emergency_phone: '08065432109',
          is_first_login: false,
          last_login: new Date(Date.now() - 7200000).toISOString(),
          created_at: '2024-02-01T00:00:00Z',
          updated_at: new Date().toISOString(),
          created_by: 'Director',
          notes: 'Operations manager',
          permissions: ['view_all', 'manage_employees', 'view_reports', 'manage_attendance']
        },
        {
          id: 4,
          name: 'Receptionist',
          email: 'receptionist@matsplash.com',
          phone: '08045678901',
          role: 'receptionist',
          department: 'Customer Service',
          status: 'active',
          hire_date: '2024-02-15',
          salary: 80000,
          address: 'Lagos, Nigeria',
          emergency_contact: 'Emergency Contact',
          emergency_phone: '08054321098',
          is_first_login: false,
          last_login: new Date(Date.now() - 1800000).toISOString(),
          created_at: '2024-02-15T00:00:00Z',
          updated_at: new Date().toISOString(),
          created_by: 'Manager',
          notes: 'Front desk receptionist',
          permissions: ['manage_orders', 'view_customers', 'process_payments']
        },
        {
          id: 5,
          name: 'Storekeeper',
          email: 'storekeeper@matsplash.com',
          phone: '08056789012',
          role: 'storekeeper',
          department: 'Operations',
          status: 'active',
          hire_date: '2024-03-01',
          salary: 90000,
          address: 'Lagos, Nigeria',
          emergency_contact: 'Emergency Contact',
          emergency_phone: '08043210987',
          is_first_login: false,
          last_login: new Date(Date.now() - 5400000).toISOString(),
          created_at: '2024-03-01T00:00:00Z',
          updated_at: new Date().toISOString(),
          created_by: 'Manager',
          notes: 'Warehouse storekeeper',
          permissions: ['manage_inventory', 'view_orders', 'manage_stock']
        }
      ];

      setEmployees(mockEmployees);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleOpenDialog = (type: string, employee?: Employee) => {
    setDialogType(type);
    setSelectedEmployee(employee || null);
    if (type === 'new') {
      setNewEmployee({
        name: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        status: 'active',
        salary: 0,
        address: '',
        emergency_contact: '',
        emergency_phone: '',
        notes: '',
        permissions: []
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setSelectedEmployee(null);
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!newEmployee.name || !newEmployee.email || !newEmployee.phone || !newEmployee.role) {
        alert('Please fill in all required fields');
        return;
      }

      // Create employee via API
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newEmployee,
          pin: '1111', // Default PIN
          created_by: 1 // This should come from auth context
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Employee created successfully:', result);
        // Refresh the employee list
        fetchData();
        handleCloseDialog();
        // Reset form
        setNewEmployee({
          name: '',
          email: '',
          phone: '',
          role: '',
          department: '',
          position: '',
          hire_date: new Date().toISOString().split('T')[0],
          salary: 0,
          is_active: true
        });
      } else {
        const errorData = await response.json();
        console.error('Failed to create employee:', errorData);
        alert('Failed to create employee. Please try again.');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('Error creating employee. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const getRoleInfo = (roleId: string) => {
    return roles.find(role => role.id === roleId) || {
      id: roleId,
      name: roleId.charAt(0).toUpperCase() + roleId.slice(1),
      description: '',
      permissions: [],
      color: '#666',
      icon: Person
    };
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.phone.includes(searchTerm);
    const matchesRole = roleFilter === 'all' || employee.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const renderEmployeeList = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Employee Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => handleOpenDialog('new')}
          sx={{ bgcolor: '#13bbc6' }}
        >
          Add Employee
        </Button>
      </Box>

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
                    {employees.length}
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
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {employees.filter(e => e.status === 'active').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Employees
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
                  <Work />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {new Set(employees.map(e => e.role)).size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Different Roles
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
                  <Assessment />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {employees.filter(e => e.is_first_login).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    New Employees
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Role"
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
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
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Salary</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmployees.map((employee) => {
                  const roleInfo = getRoleInfo(employee.role);
                  const RoleIcon = roleInfo.icon;
                  
                  return (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: roleInfo.color }}>
                            <RoleIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {employee.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {employee.email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {employee.phone}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <RoleIcon sx={{ mr: 1, color: roleInfo.color }} />
                          <Typography variant="body2">
                            {roleInfo.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {employee.department}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={employee.status.charAt(0).toUpperCase() + employee.status.slice(1)} 
                          color={getStatusColor(employee.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          ₦{employee.salary.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {employee.last_login 
                            ? new Date(employee.last_login).toLocaleDateString()
                            : 'Never'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleOpenDialog('view', employee)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Employee">
                          <IconButton size="small" onClick={() => handleOpenDialog('edit', employee)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset PIN">
                          <IconButton size="small" onClick={() => handleOpenDialog('reset-pin', employee)}>
                            <LockOpen />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Suspend/Activate">
                          <IconButton size="small" onClick={() => handleOpenDialog('toggle-status', employee)}>
                            {employee.status === 'active' ? <Cancel /> : <CheckCircle />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderNewEmployeeForm = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Add New Employee
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
            Personal Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Address"
                value={newEmployee.address}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, address: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Contact"
                value={newEmployee.emergency_contact}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, emergency_contact: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Phone"
                value={newEmployee.emergency_phone}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, emergency_phone: e.target.value }))}
                required
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
            Employment Details
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newEmployee.role}
                  onChange={(e) => {
                    const roleId = e.target.value;
                    const role = roles.find(r => r.id === roleId);
                    setNewEmployee(prev => ({ 
                      ...prev, 
                      role: roleId,
                      permissions: role?.permissions || []
                    }));
                  }}
                  label="Role"
                  required
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <role.icon sx={{ mr: 1, color: role.color }} />
                        {role.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={newEmployee.department}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, department: e.target.value }))}
                  label="Department"
                  required
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Salary"
                type="number"
                value={newEmployee.salary}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, salary: parseFloat(e.target.value) || 0 }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₦</InputAdornment>
                }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newEmployee.status}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, status: e.target.value as any }))}
                  label="Status"
                  required
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                value={newEmployee.notes}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
            Role Permissions
          </Typography>
          {newEmployee.role && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {getRoleInfo(newEmployee.role).description}
              </Typography>
              <FormGroup>
                {getRoleInfo(newEmployee.role).permissions.map((permission) => (
                  <FormControlLabel
                    key={permission}
                    control={
                      <Checkbox
                        checked={newEmployee.permissions?.includes(permission) || false}
                        onChange={(e) => {
                          const permissions = newEmployee.permissions || [];
                          if (e.target.checked) {
                            setNewEmployee(prev => ({
                              ...prev,
                              permissions: [...permissions, permission]
                            }));
                          } else {
                            setNewEmployee(prev => ({
                              ...prev,
                              permissions: permissions.filter(p => p !== permission)
                            }));
                          }
                        }}
                      />
                    }
                    label={permission.replace('_', ' ').toUpperCase()}
                  />
                ))}
              </FormGroup>
            </Box>
          )}
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<PersonAdd />}
              sx={{ bgcolor: '#13bbc6' }}
              disabled={!newEmployee.name || !newEmployee.email || !newEmployee.phone || !newEmployee.role}
            >
              Create Employee
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  const renderEmployeeDetails = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
        Employee Details
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Employee details functionality will be implemented here.
      </Typography>
    </Box>
  );

  const renderEditEmployeeForm = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
        Edit Employee
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Employee editing functionality will be implemented here.
      </Typography>
    </Box>
  );

  const renderResetPinForm = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
        Reset Employee PIN
      </Typography>
      <Typography variant="body2" color="text.secondary">
        PIN reset functionality will be implemented here.
      </Typography>
    </Box>
  );

  const renderToggleStatusForm = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
        Change Employee Status
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Status change functionality will be implemented here.
      </Typography>
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
      case 'employee-mgmt':
        return renderEmployeeList();
      case 'new-employee':
        return renderNewEmployeeForm();
      default:
        return renderEmployeeList();
    }
  };

  return (
    <Box>
      {renderContent()}
      
      {/* Dialog for various actions */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'new' && 'Add New Employee'}
          {dialogType === 'view' && 'Employee Details'}
          {dialogType === 'edit' && 'Edit Employee'}
          {dialogType === 'reset-pin' && 'Reset Employee PIN'}
          {dialogType === 'toggle-status' && 'Change Employee Status'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'new' && renderNewEmployeeForm()}
          {dialogType === 'view' && renderEmployeeDetails()}
          {dialogType === 'edit' && renderEditEmployeeForm()}
          {dialogType === 'reset-pin' && renderResetPinForm()}
          {dialogType === 'toggle-status' && renderToggleStatusForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'new' && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }} onClick={handleSubmit}>
              Create Employee
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeManagement;
