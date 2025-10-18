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
  Switch,
  FormControlLabel,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Person,
  Work,
  AttachMoney,
  AccessTime,
  Security
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { User, CreateEmployeeForm } from '../types';
import axios from 'axios';

const EmployeesPage: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [newEmployee, setNewEmployee] = useState<CreateEmployeeForm>({
    name: '',
    email: '',
    phone: '',
    role: 'Packer',
    salary_type: 'fixed',
    fixed_salary: 0,
    commission_rate: 0,
    can_access_remotely: false
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/employees');
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async () => {
    try {
      const response = await axios.post('/employees', newEmployee);
      if (response.data.success) {
        setCreateDialogOpen(false);
        setNewEmployee({
          name: '',
          email: '',
          phone: '',
          role: 'Packer',
          salary_type: 'fixed',
          fixed_salary: 0,
          commission_rate: 0,
          can_access_remotely: false
        });
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error creating employee:', error);
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;
    
    try {
      const response = await axios.put(`/employees/${selectedEmployee.id}`, selectedEmployee);
      if (response.data.success) {
        setEditDialogOpen(false);
        setSelectedEmployee(null);
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  };

  const handleDeleteEmployee = async (employeeId: number) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      const response = await axios.delete(`/employees/${employeeId}`);
      if (response.data.success) {
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      'Admin': 'error',
      'Director': 'secondary',
      'Manager': 'primary',
      'Receptionist': 'warning',
      'StoreKeeper': 'success',
      'Driver': 'info',
      'Driver Assistant': 'info',
      'Packer': 'default',
      'Cleaner': 'default',
      'Operator': 'default',
      'Loader': 'default',
      'Security': 'error',
      'Sales': 'warning'
    };
    return colors[role] || 'default';
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Admin': <Security />,
      'Director': <Person />,
      'Manager': <Work />,
      'Receptionist': <Person />,
      'StoreKeeper': <Work />,
      'Driver': <Work />,
      'Driver Assistant': <Work />,
      'Packer': <Work />,
      'Cleaner': <Work />,
      'Operator': <Work />,
      'Loader': <Work />,
      'Security': <Security />,
      'Sales': <AttachMoney />
    };
    return icons[role] || <Work />;
  };

  const canManageEmployees = ['Admin', 'Director', 'Manager'].includes(user?.role || '');

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Employee Management
        </Typography>
        {canManageEmployees && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add Employee
          </Button>
        )}
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Salary</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {employee.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{employee.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {employee.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(employee.role)}
                        label={employee.role}
                        color={getRoleColor(employee.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{employee.email}</Typography>
                      {employee.phone && (
                        <Typography variant="caption" color="text.secondary">
                          {employee.phone}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {employee.salary_type === 'fixed' ? (
                        <Box>
                          <Typography variant="body2">
                            ₦{employee.fixed_salary?.toLocaleString() || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Fixed
                          </Typography>
                        </Box>
                      ) : (
                        <Box>
                          <Typography variant="body2">
                            {employee.commission_rate || 0}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Commission
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employee.isActive ? 'Active' : 'Inactive'}
                        color={employee.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {employee.lastLogin ? (
                        <Typography variant="body2">
                          {new Date(employee.lastLogin).toLocaleDateString()}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Never
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit Employee">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setEditDialogOpen(true);
                          }}
                          disabled={!canManageEmployees}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Employee">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteEmployee(employee.id)}
                          disabled={!canManageEmployees || employee.role === 'Admin'}
                          color="error"
                        >
                          <Delete />
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

      {/* Create Employee Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Employee</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value as any })}
                >
                  <MenuItem value="Manager">Manager</MenuItem>
                  <MenuItem value="Receptionist">Receptionist</MenuItem>
                  <MenuItem value="StoreKeeper">Storekeeper</MenuItem>
                  <MenuItem value="Driver">Driver</MenuItem>
                  <MenuItem value="Driver Assistant">Driver Assistant</MenuItem>
                  <MenuItem value="Packer">Packer</MenuItem>
                  <MenuItem value="Cleaner">Cleaner</MenuItem>
                  <MenuItem value="Operator">Operator</MenuItem>
                  <MenuItem value="Loader">Loader</MenuItem>
                  <MenuItem value="Security">Security</MenuItem>
                  <MenuItem value="Sales">Sales</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Salary Type</InputLabel>
                <Select
                  value={newEmployee.salary_type}
                  onChange={(e) => setNewEmployee({ ...newEmployee, salary_type: e.target.value as any })}
                >
                  <MenuItem value="fixed">Fixed Salary</MenuItem>
                  <MenuItem value="commission">Commission</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {newEmployee.salary_type === 'fixed' ? (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fixed Salary (₦)"
                  type="number"
                  value={newEmployee.fixed_salary || 0}
                  onChange={(e) => setNewEmployee({ ...newEmployee, fixed_salary: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
            ) : (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Commission Rate (%)"
                  type="number"
                  value={newEmployee.commission_rate || 0}
                  onChange={(e) => setNewEmployee({ ...newEmployee, commission_rate: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newEmployee.can_access_remotely}
                    onChange={(e) => setNewEmployee({ ...newEmployee, can_access_remotely: e.target.checked })}
                  />
                }
                label="Can Access Remotely"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateEmployee} variant="contained">
            Add Employee
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Employee</DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={selectedEmployee.name}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={selectedEmployee.email}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={selectedEmployee.phone || ''}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={selectedEmployee.role}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, role: e.target.value as any })}
                  >
                    <MenuItem value="Manager">Manager</MenuItem>
                    <MenuItem value="Receptionist">Receptionist</MenuItem>
                    <MenuItem value="StoreKeeper">Storekeeper</MenuItem>
                    <MenuItem value="Driver">Driver</MenuItem>
                    <MenuItem value="Driver Assistant">Driver Assistant</MenuItem>
                    <MenuItem value="Packer">Packer</MenuItem>
                    <MenuItem value="Cleaner">Cleaner</MenuItem>
                    <MenuItem value="Operator">Operator</MenuItem>
                    <MenuItem value="Loader">Loader</MenuItem>
                    <MenuItem value="Security">Security</MenuItem>
                    <MenuItem value="Sales">Sales</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Salary Type</InputLabel>
                  <Select
                    value={selectedEmployee.salary_type || 'fixed'}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, salary_type: e.target.value as any })}
                  >
                    <MenuItem value="fixed">Fixed Salary</MenuItem>
                    <MenuItem value="commission">Commission</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {selectedEmployee.salary_type === 'fixed' ? (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fixed Salary (₦)"
                    type="number"
                    value={selectedEmployee.fixed_salary || 0}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, fixed_salary: parseFloat(e.target.value) || 0 })}
                  />
                </Grid>
              ) : (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Commission Rate (%)"
                    type="number"
                    value={selectedEmployee.commission_rate || 0}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, commission_rate: parseFloat(e.target.value) || 0 })}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedEmployee.can_access_remotely || false}
                      onChange={(e) => setSelectedEmployee({ ...selectedEmployee, can_access_remotely: e.target.checked })}
                    />
                  }
                  label="Can Access Remotely"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditEmployee} variant="contained">
            Update Employee
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmployeesPage;
