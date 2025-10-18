import React, { useState, useEffect } from '@mui/material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  Alert,
  CircularProgress,
  Grid,
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Computer,
  PhoneAndroid,
  Tablet,
  Laptop,
  DesktopWindows,
  Security
} from '@mui/icons-material';
import axios from 'axios';

interface Device {
  id: number;
  device_id: string;
  device_name: string;
  device_type: string;
  location: string;
  device_fingerprint: string;
  is_factory_device: boolean;
  is_active: boolean;
  employee_id?: number;
  created_at: string;
  updated_at: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
}

const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    device_id: '',
    device_name: '',
    device_type: 'laptop',
    location: 'factory_floor',
    employee_id: '',
    is_factory_device: true,
    is_active: true
  });

  const deviceTypes = [
    { value: 'laptop', label: 'Laptop', icon: <Laptop /> },
    { value: 'desktop', label: 'Desktop', icon: <DesktopWindows /> },
    { value: 'tablet', label: 'Tablet', icon: <Tablet /> },
    { value: 'mobile', label: 'Mobile', icon: <PhoneAndroid /> },
    { value: 'kiosk', label: 'Kiosk', icon: <Computer /> }
  ];

  const locations = [
    { value: 'factory_floor', label: 'Factory Floor' },
    { value: 'office', label: 'Office' },
    { value: 'gate', label: 'Gate' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'personal', label: 'Personal' }
  ];

  useEffect(() => {
    fetchDevices();
    fetchEmployees();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/devices');
      if (response.data.success) {
        setDevices(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      setError('Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/employees');
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleAddDevice = () => {
    setEditingDevice(null);
    setFormData({
      device_id: '',
      device_name: '',
      device_type: 'laptop',
      location: 'factory_floor',
      employee_id: '',
      is_factory_device: true,
      is_active: true
    });
    setOpenDialog(true);
  };

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      device_id: device.device_id,
      device_name: device.device_name,
      device_type: device.device_type,
      location: device.location,
      employee_id: device.employee_id?.toString() || '',
      is_factory_device: device.is_factory_device,
      is_active: device.is_active
    });
    setOpenDialog(true);
  };

  const handleSaveDevice = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const deviceData = {
        ...formData,
        employee_id: formData.employee_id ? parseInt(formData.employee_id) : null,
        device_fingerprint: editingDevice?.device_fingerprint || '',
        created_by: 1 // Director
      };

      if (editingDevice) {
        // Update existing device
        const response = await axios.put(`http://localhost:3001/api/devices/${editingDevice.id}`, deviceData);
        if (response.data.success) {
          setSuccess('Device updated successfully');
          fetchDevices();
        }
      } else {
        // Add new device
        const response = await axios.post('http://localhost:3001/api/devices', deviceData);
        if (response.data.success) {
          setSuccess('Device added successfully');
          fetchDevices();
        }
      }

      setOpenDialog(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save device');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = async (deviceId: number) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        setLoading(true);
        const response = await axios.delete(`http://localhost:3001/api/devices/${deviceId}`);
        if (response.data.success) {
          setSuccess('Device deleted successfully');
          fetchDevices();
        }
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to delete device');
      } finally {
        setLoading(false);
      }
    }
  };

  const getDeviceIcon = (type: string) => {
    const deviceType = deviceTypes.find(dt => dt.value === type);
    return deviceType?.icon || <Computer />;
  };

  const getEmployeeName = (employeeId?: number) => {
    if (!employeeId) return 'Factory Device';
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.name} (${employee.role})` : 'Unknown Employee';
  };

  if (loading && devices.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
              Device Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddDevice}
              sx={{
                bgcolor: '#13bbc6',
                '&:hover': { bgcolor: '#0fa8b3' }
              }}
            >
              Add Device
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Device</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getDeviceIcon(device.device_type)}
                        <Box ml={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {device.device_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {device.device_id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={device.device_type}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={device.location.replace('_', ' ')}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getEmployeeName(device.employee_id)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={device.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        color={device.is_active ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditDevice(device)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteDevice(device.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {devices.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No devices found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Add your first device to get started
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Device Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDevice ? 'Edit Device' : 'Add New Device'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Device ID"
                value={formData.device_id}
                onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                required
                helperText="Unique identifier (e.g., MAC address, serial number)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Device Name"
                value={formData.device_name}
                onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                required
                helperText="Friendly name for the device"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Device Type</InputLabel>
                <Select
                  value={formData.device_type}
                  onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                >
                  {deviceTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box display="flex" alignItems="center">
                        {type.icon}
                        <Typography ml={1}>{type.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Location</InputLabel>
                <Select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                >
                  {locations.map((location) => (
                    <MenuItem key={location.value} value={location.value}>
                      {location.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assigned Employee</InputLabel>
                <Select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                >
                  <MenuItem value="">
                    <em>Factory Device (No Assignment)</em>
                  </MenuItem>
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id.toString()}>
                      {employee.name} ({employee.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={2}>
                <Chip
                  label={formData.is_factory_device ? 'Factory Device' : 'Personal Device'}
                  color={formData.is_factory_device ? 'primary' : 'secondary'}
                  variant="outlined"
                />
                <Chip
                  label={formData.is_active ? 'Active' : 'Inactive'}
                  color={formData.is_active ? 'success' : 'error'}
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveDevice}
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: '#13bbc6',
              '&:hover': { bgcolor: '#0fa8b3' }
            }}
          >
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceManagement;
