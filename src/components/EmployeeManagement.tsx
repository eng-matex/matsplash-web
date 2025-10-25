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
  Login,
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
    commission_rate: 0,
    has_commission: false,
    commission_type: 'none',
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
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Add userRole to query params for role-based filtering
      const params = new URLSearchParams();
      if (userRole) {
        params.append('userRole', userRole);
      }
      
      const response = await fetch(`http://localhost:3002/api/employees?${params.toString()}`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.data || []);
      } else {
        console.error('Failed to fetch employees');
        // Fallback to empty array
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      // Fallback to empty array
      setEmployees([]);
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
        commission_rate: 0,
        has_commission: false,
        commission_type: 'none',
        address: '',
        emergency_contact: '',
        emergency_phone: '',
        notes: '',
        permissions: []
      });
    } else if (type === 'edit' && employee) {
      // Populate form data for editing
      setNewEmployee({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        role: employee.role || '',
        department: employee.department || '',
        status: employee.status || 'active',
        salary: employee.salary || 0,
        commission_rate: employee.commission_rate || 0,
        has_commission: employee.has_commission || false,
        commission_type: employee.commission_type || 'none',
        address: employee.address || '',
        emergency_contact: employee.emergency_contact || '',
        emergency_phone: employee.emergency_phone || '',
        notes: employee.notes || '',
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

  const handleResetPin = async () => {
    if (!selectedEmployee) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/employees/${selectedEmployee.id}/reset-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: 1, // This should come from auth context
          userEmail: 'admin@matsplash.com'
        })
      });

      if (response.ok) {
        alert('PIN reset successfully! Default PIN is 1111');
        handleCloseDialog();
      } else {
        const error = await response.json();
        alert(`Failed to reset PIN: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error resetting PIN:', error);
      alert('Failed to reset PIN. Please try again.');
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedEmployee) return;

    try {
      const token = localStorage.getItem('token');
      const newStatus = selectedEmployee.status === 'active' ? 'inactive' : 'active';
      
      const response = await fetch(`http://localhost:3002/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          userId: 1, // This should come from auth context
          userEmail: 'admin@matsplash.com'
        })
      });

      if (response.ok) {
        alert(`Employee ${newStatus === 'active' ? 'activated' : 'suspended'} successfully!`);
        fetchData();
        handleCloseDialog();
      } else {
        const error = await response.json();
        alert(`Failed to update status: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    // Prevent deletion of Admin and Director accounts
    if (selectedEmployee.role === 'Admin' || selectedEmployee.role === 'Director') {
      alert('Admin and Director accounts cannot be deleted for security reasons.');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedEmployee.name}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/employees/${selectedEmployee.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: 1, // This should come from auth context
          userEmail: 'admin@matsplash.com'
        })
      });

      if (response.ok) {
        alert('Employee deleted successfully!');
        fetchData();
        handleCloseDialog();
      } else {
        const error = await response.json();
        alert(`Failed to delete employee: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee. Please try again.');
    }
  };

  const handleAdminLogin = async () => {
    if (!selectedEmployee) return;

    // Check if current user has permission to login as this employee
    if (userRole === 'Manager' && ['Admin', 'Director', 'Sales'].includes(selectedEmployee.role)) {
      alert('Manager cannot login as Admin, Director, or Sales employees.');
      return;
    }

    if (!['Admin', 'Director'].includes(userRole || '')) {
      alert('Only Admin and Director can perform admin login.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/employees/${selectedEmployee.id}/admin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          adminUserId: 1, // This should come from auth context
          adminUserRole: userRole,
          adminUserEmail: 'admin@matsplash.com'
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Store the new token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        alert(`Successfully logged in as ${selectedEmployee.name}`);
        // Redirect to dashboard or refresh page
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to login as employee: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error in admin login:', error);
      alert('Failed to perform admin login. Please try again.');
    }
  };

  const handleAdminLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/employees/admin-logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          adminUserId: 1, // This should come from auth context
          adminUserEmail: 'admin@matsplash.com'
        })
      });

      if (response.ok) {
        alert('Admin override session ended. Please login again.');
        // Clear tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        const error = await response.json();
        alert(`Failed to logout: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error in admin logout:', error);
      alert('Failed to perform admin logout. Please try again.');
    }
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      // Validate required fields
      if (!newEmployee.name || !newEmployee.email || !newEmployee.phone || !newEmployee.role) {
        alert('Please fill in all required fields (Name, Email, Phone, Role)');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmployee.email)) {
        alert('Please enter a valid email address');
        return;
      }

      // Validate phone format
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(newEmployee.phone)) {
        alert('Please enter a valid phone number');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newEmployee.name,
          email: newEmployee.email,
          phone: newEmployee.phone,
          role: newEmployee.role,
          department: newEmployee.department,
          position: newEmployee.position,
          salary: newEmployee.salary,
          commission_rate: newEmployee.commission_rate,
          has_commission: newEmployee.has_commission,
          commission_type: newEmployee.commission_type,
          address: newEmployee.address,
          emergency_contact: newEmployee.emergency_contact,
          emergency_phone: newEmployee.emergency_phone,
          notes: newEmployee.notes,
          status: newEmployee.status,
          userId: 1, // This should come from auth context
          userEmail: 'admin@matsplash.com'
        })
      });

      if (response.ok) {
        alert('Employee updated successfully!');
        fetchData();
        handleCloseDialog();
      } else {
        const error = await response.json();
        alert(`Failed to update employee: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Failed to update employee. Please try again.');
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!newEmployee.name || !newEmployee.email || !newEmployee.phone || !newEmployee.role) {
        alert('Please fill in all required fields (Name, Email, Phone, Role)');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmployee.email)) {
        alert('Please enter a valid email address');
        return;
      }

      // Validate phone format
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(newEmployee.phone)) {
        alert('Please enter a valid phone number');
        return;
      }

      // Prepare employee data
      const employeeData = {
        name: newEmployee.name,
        email: newEmployee.email,
        phone: newEmployee.phone,
        role: newEmployee.role,
        department: newEmployee.department || 'General',
        position: newEmployee.position || newEmployee.role,
        salary: newEmployee.salary || 0,
        commission_rate: newEmployee.commission_rate || 0,
        has_commission: newEmployee.has_commission || false,
        commission_type: newEmployee.commission_type || 'none',
        address: newEmployee.address || '',
        emergency_contact: newEmployee.emergency_contact || '',
        emergency_phone: newEmployee.emergency_phone || '',
        notes: newEmployee.notes || '',
        status: newEmployee.status || 'active',
        is_active: true,
        pin: '1111', // Default PIN
        hire_date: new Date().toISOString().split('T')[0],
        created_by: 1 // This should come from auth context
      };

      console.log('Creating employee with data:', employeeData);

      // Create employee via API
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(employeeData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Employee created successfully:', result);
        
        // Show success message
        alert('Employee created successfully!');
        
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
          status: 'active',
          salary: 0,
          commission_rate: 0,
          has_commission: false,
          commission_type: 'none',
          address: '',
          emergency_contact: '',
          emergency_phone: '',
          notes: '',
          permissions: []
        });
      } else {
        const errorData = await response.json();
        console.error('Failed to create employee:', errorData);
        alert(`Failed to create employee: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      alert(`Error creating employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const getRoleDefaults = (roleId: string) => {
    const defaults = {
      admin: { salary: 0, hasCommission: false, commissionRate: 0, department: 'Administration', commissionType: 'none' },
      director: { salary: 0, hasCommission: false, commissionRate: 0, department: 'Administration', commissionType: 'none' },
      manager: { salary: 150000, hasCommission: false, commissionRate: 0, department: 'Management', commissionType: 'none' },
      receptionist: { salary: 80000, hasCommission: false, commissionRate: 0, department: 'Operations', commissionType: 'none' },
      storekeeper: { salary: 70000, hasCommission: false, commissionRate: 0, department: 'Operations', commissionType: 'none' },
      driver: { salary: 60000, hasCommission: true, commissionRate: 30, department: 'Logistics', commissionType: 'per_bag_sold' },
      driverassistant: { salary: 50000, hasCommission: true, commissionRate: 20, department: 'Logistics', commissionType: 'per_bag_sold' },
      packer: { salary: 45000, hasCommission: true, commissionRate: 5, department: 'Production', commissionType: 'per_bag_packed' },
      sales: { salary: 0, hasCommission: true, commissionRate: 0, department: 'Sales', commissionType: 'per_bag_sold' },
      security: { salary: 55000, hasCommission: false, commissionRate: 0, department: 'Security', commissionType: 'none' },
      cleaner: { salary: 40000, hasCommission: false, commissionRate: 0, department: 'Maintenance', commissionType: 'none' },
      operator: { salary: 65000, hasCommission: false, commissionRate: 0, department: 'Production', commissionType: 'none' },
      loader: { salary: 50000, hasCommission: false, commissionRate: 0, department: 'Logistics', commissionType: 'none' }
    };
    
    return defaults[roleId as keyof typeof defaults] || { salary: 50000, hasCommission: false, commissionRate: 0, department: 'General', commissionType: 'none' };
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
                  <TableCell>Salary</TableCell>
                  <TableCell>Commission</TableCell>
                  <TableCell>Status</TableCell>
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
                        <Typography variant="body2" fontWeight="bold">
                          ₦{(employee as any).salary ? (employee as any).salary.toLocaleString() : '0'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {employee.has_commission ? (
                            <Box>
                              <Typography variant="body2" fontWeight="bold" color="primary">
                                ₦{employee.commission_rate}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {employee.commission_type === 'per_bag_sold' 
                                  ? 'per bag sold'
                                  : employee.commission_type === 'per_bag_packed'
                                  ? 'per bag packed'
                                  : 'per transaction'
                                }
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No Commission
                            </Typography>
                          )}
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
                        <Tooltip title={employee.role === 'Admin' || employee.role === 'Director' ? 'Cannot edit Admin/Director accounts' : 'Edit Employee'}>
                          <span>
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog('edit', employee)}
                              disabled={employee.role === 'Admin' || employee.role === 'Director'}
                            >
                              <Edit />
                            </IconButton>
                          </span>
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
                        <Tooltip title={employee.role === 'Admin' || employee.role === 'Director' ? 'Cannot delete Admin/Director accounts' : 'Delete Employee'}>
                          <span>
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog('delete', employee)}
                              disabled={employee.role === 'Admin' || employee.role === 'Director'}
                              sx={{ color: 'error.main' }}
                            >
                              <Delete />
                            </IconButton>
                          </span>
                        </Tooltip>
                        {/* Admin Login/Logout buttons - only show for Admin/Director users */}
                        {['Admin', 'Director'].includes(userRole || '') && (
                          <>
                            <Tooltip title="Login as this employee">
                              <IconButton 
                                size="small" 
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  handleAdminLogin();
                                }}
                                sx={{ color: 'primary.main' }}
                              >
                                <Login />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
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
                    
                    // Set role-based defaults
                    const roleDefaults = getRoleDefaults(roleId);
                    
                    setNewEmployee(prev => ({ 
                      ...prev, 
                      role: roleId,
                      permissions: role?.permissions || [],
                      salary: roleDefaults.salary,
                      has_commission: roleDefaults.hasCommission,
                      commission_rate: roleDefaults.commissionRate,
                      commission_type: roleDefaults.commissionType,
                      department: roleDefaults.department
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
                label="Base Salary"
                type="number"
                value={newEmployee.salary}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, salary: parseFloat(e.target.value) || 0 }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₦</InputAdornment>
                }}
                required
                helperText="Monthly base salary"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newEmployee.has_commission || false}
                    onChange={(e) => setNewEmployee(prev => ({ 
                      ...prev, 
                      has_commission: e.target.checked,
                      commission_rate: e.target.checked ? prev.commission_rate : 0
                    }))}
                  />
                }
                label="Has Commission"
              />
            </Grid>
            {newEmployee.has_commission && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Commission Rate (₦)"
                    type="number"
                    value={newEmployee.commission_rate}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) || 0 }))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₦</InputAdornment>
                    }}
                    helperText={
                      newEmployee.commission_type === 'per_bag_sold' 
                        ? "Commission amount per bag successfully sold and approved by manager"
                        : newEmployee.commission_type === 'per_bag_packed'
                        ? "Commission amount per bag successfully packed"
                        : "Commission amount per transaction"
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Commission Type</InputLabel>
                    <Select
                      value={newEmployee.commission_type || 'none'}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, commission_type: e.target.value }))}
                      label="Commission Type"
                    >
                      <MenuItem value="none">No Commission</MenuItem>
                      <MenuItem value="per_bag_sold">Per Bag Sold (Driver/Sales)</MenuItem>
                      <MenuItem value="per_bag_packed">Per Bag Packed (Packer)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
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

  const renderEmployeeDetails = () => {
    if (!selectedEmployee) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
          Employee Details
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Name</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedEmployee.name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Email</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedEmployee.email}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedEmployee.phone}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Role</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedEmployee.role}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Department</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedEmployee.department || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip 
              label={selectedEmployee.status} 
              color={selectedEmployee.status === 'active' ? 'success' : 'error'}
              size="small"
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Base Salary</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>₦{selectedEmployee.salary?.toLocaleString() || '0'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Commission</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {selectedEmployee.has_commission ? 
                `₦${selectedEmployee.commission_rate} ${selectedEmployee.commission_type === 'per_bag_sold' ? 'per bag sold' : 'per bag packed'}` : 
                'No Commission'
              }
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Address</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedEmployee.address || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Emergency Contact</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedEmployee.emergency_contact || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Emergency Phone</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedEmployee.emergency_phone || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedEmployee.notes || 'No notes'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Created</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {selectedEmployee.created_at ? new Date(selectedEmployee.created_at).toLocaleDateString() : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Last Login</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {selectedEmployee.last_login ? new Date(selectedEmployee.last_login).toLocaleDateString() : 'Never'}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderEditEmployeeForm = () => {
    if (!selectedEmployee) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
          Edit Employee: {selectedEmployee.name}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={newEmployee.email}
              onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone"
              value={newEmployee.phone}
              onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={newEmployee.role}
                onChange={(e) => {
                  const roleId = e.target.value;
                  const defaults = getRoleDefaults(roleId);
                  setNewEmployee({ 
                    ...newEmployee, 
                    role: roleId,
                    salary: defaults.salary,
                    has_commission: defaults.hasCommission,
                    commission_rate: defaults.commissionRate,
                    commission_type: defaults.commissionType,
                    department: defaults.department
                  });
                }}
                label="Role"
                disabled={selectedEmployee.role === 'Admin' || selectedEmployee.role === 'Director'}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Department"
              value={newEmployee.department}
              onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={newEmployee.status}
                onChange={(e) => setNewEmployee({ ...newEmployee, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Base Salary (₦)"
              type="number"
              value={newEmployee.salary}
              onChange={(e) => setNewEmployee({ ...newEmployee, salary: Number(e.target.value) })}
              InputProps={{
                startAdornment: <InputAdornment position="start">₦</InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={newEmployee.has_commission}
                  onChange={(e) => setNewEmployee({ ...newEmployee, has_commission: e.target.checked })}
                />
              }
              label="Has Commission"
            />
          </Grid>
          {newEmployee.has_commission && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Commission Rate (₦)"
                  type="number"
                  value={newEmployee.commission_rate}
                  onChange={(e) => setNewEmployee({ ...newEmployee, commission_rate: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₦</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Commission Type</InputLabel>
                  <Select
                    value={newEmployee.commission_type}
                    onChange={(e) => setNewEmployee({ ...newEmployee, commission_type: e.target.value })}
                    label="Commission Type"
                  >
                    <MenuItem value="none">No Commission</MenuItem>
                    <MenuItem value="per_bag_sold">Per Bag Sold (Driver/Sales)</MenuItem>
                    <MenuItem value="per_bag_packed">Per Bag Packed (Packer)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              multiline
              rows={2}
              value={newEmployee.address}
              onChange={(e) => setNewEmployee({ ...newEmployee, address: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Emergency Contact"
              value={newEmployee.emergency_contact}
              onChange={(e) => setNewEmployee({ ...newEmployee, emergency_contact: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Emergency Phone"
              value={newEmployee.emergency_phone}
              onChange={(e) => setNewEmployee({ ...newEmployee, emergency_phone: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={newEmployee.notes}
              onChange={(e) => setNewEmployee({ ...newEmployee, notes: e.target.value })}
            />
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderResetPinForm = () => {
    if (!selectedEmployee) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
          Reset PIN for {selectedEmployee.name}
        </Typography>
        
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            This will reset the employee's PIN to the default value (1111). 
            The employee will be required to change their PIN on their next login.
          </Typography>
        </Alert>

        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Employee Details:</Typography>
          <Typography variant="body2"><strong>Name:</strong> {selectedEmployee.name}</Typography>
          <Typography variant="body2"><strong>Email:</strong> {selectedEmployee.email}</Typography>
          <Typography variant="body2"><strong>Role:</strong> {selectedEmployee.role}</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Are you sure you want to reset the PIN for this employee?
        </Typography>
      </Box>
    );
  };

  const renderToggleStatusForm = () => {
    if (!selectedEmployee) return null;

    const newStatus = selectedEmployee.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'activate' : 'suspend';

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
          {actionText === 'activate' ? 'Activate' : 'Suspend'} Employee
        </Typography>
        
        <Alert severity={actionText === 'activate' ? 'success' : 'warning'} sx={{ mb: 3 }}>
          <Typography variant="body2">
            {actionText === 'activate' 
              ? 'This will activate the employee account and allow them to log in.'
              : 'This will suspend the employee account and prevent them from logging in.'
            }
          </Typography>
        </Alert>

        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Employee Details:</Typography>
          <Typography variant="body2"><strong>Name:</strong> {selectedEmployee.name}</Typography>
          <Typography variant="body2"><strong>Email:</strong> {selectedEmployee.email}</Typography>
          <Typography variant="body2"><strong>Role:</strong> {selectedEmployee.role}</Typography>
          <Typography variant="body2"><strong>Current Status:</strong> 
            <Chip 
              label={selectedEmployee.status} 
              color={selectedEmployee.status === 'active' ? 'success' : 'error'}
              size="small"
              sx={{ ml: 1 }}
            />
          </Typography>
          <Typography variant="body2"><strong>New Status:</strong> 
            <Chip 
              label={newStatus} 
              color={newStatus === 'active' ? 'success' : 'error'}
              size="small"
              sx={{ ml: 1 }}
            />
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Are you sure you want to {actionText} this employee?
        </Typography>
      </Box>
    );
  };

  const renderDeleteForm = () => {
    if (!selectedEmployee) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
          Delete Employee: {selectedEmployee.name}
        </Typography>
        
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> This action cannot be undone. The employee will be permanently removed from the system.
          </Typography>
        </Alert>

        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Employee Details:</Typography>
          <Typography variant="body2"><strong>Name:</strong> {selectedEmployee.name}</Typography>
          <Typography variant="body2"><strong>Email:</strong> {selectedEmployee.email}</Typography>
          <Typography variant="body2"><strong>Role:</strong> {selectedEmployee.role}</Typography>
          <Typography variant="body2"><strong>Department:</strong> {selectedEmployee.department || 'N/A'}</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Are you absolutely sure you want to delete this employee? This action cannot be undone.
        </Typography>
      </Box>
    );
  };

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
          {dialogType === 'delete' && 'Delete Employee'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'new' && renderNewEmployeeForm()}
          {dialogType === 'view' && renderEmployeeDetails()}
          {dialogType === 'edit' && renderEditEmployeeForm()}
          {dialogType === 'reset-pin' && renderResetPinForm()}
          {dialogType === 'toggle-status' && renderToggleStatusForm()}
          {dialogType === 'delete' && renderDeleteForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogType === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogType === 'new' && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }} onClick={handleSubmit}>
              Create Employee
            </Button>
          )}
          {dialogType === 'edit' && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }} onClick={handleUpdateEmployee}>
              Update Employee
            </Button>
          )}
          {dialogType === 'reset-pin' && (
            <Button variant="contained" color="warning" onClick={handleResetPin}>
              Reset PIN
            </Button>
          )}
          {dialogType === 'toggle-status' && (
            <Button 
              variant="contained" 
              color={selectedEmployee?.status === 'active' ? 'error' : 'success'} 
              onClick={handleToggleStatus}
            >
              {selectedEmployee?.status === 'active' ? 'Suspend' : 'Activate'}
            </Button>
          )}
          {dialogType === 'delete' && (
            <Button variant="contained" color="error" onClick={handleDeleteEmployee}>
              Delete Employee
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeManagement;
