import React, { useState, useEffect } from 'react';
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
  Security,
  CheckCircle
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
  macAddresses?: MacAddress[];
}

interface MacAddress {
  id: number;
  device_id: number;
  mac_address: string;
  adapter_type: string;
  adapter_name: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Factory {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
}

const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [selectedFactories, setSelectedFactories] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [macDialogOpen, setMacDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [macAddresses, setMacAddresses] = useState<MacAddress[]>([]);
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
    fetchFactories();
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

  const fetchFactories = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/factory-locations');
      if (response.data.success) {
        setFactories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching factories:', error);
      setError('Failed to fetch factory locations');
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

  const handleEditDevice = async (device: Device) => {
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
    
    // Load existing factory assignments for this device
    try {
      const response = await axios.get(`http://localhost:3001/api/devices/${device.id}/factory-assignments`);
      if (response.data.success) {
        const assignedFactories = response.data.data.map((assignment: any) => assignment.factory_location_id);
        setSelectedFactories(assignedFactories);
      }
    } catch (error) {
      console.error('Error fetching factory assignments:', error);
      setSelectedFactories([]);
    }
    
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

      let deviceId: number;

      if (editingDevice) {
        // Update existing device
        const response = await axios.put(`http://localhost:3001/api/devices/${editingDevice.id}`, deviceData);
        if (response.data.success) {
          deviceId = editingDevice.id;
          setSuccess('Device updated successfully');
        }
      } else {
        // Add new device
        const response = await axios.post('http://localhost:3001/api/devices', deviceData);
        if (response.data.success) {
          deviceId = response.data.data.id;
          setSuccess('Device added successfully');
        }
      }

      // Handle factory assignments
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (editingDevice) {
        // For editing: first remove all existing assignments, then add new ones
        try {
          // Get current assignments
          const currentAssignmentsResponse = await axios.get(`http://localhost:3001/api/devices/${deviceId}/factory-assignments`);
          if (currentAssignmentsResponse.data.success) {
            const currentAssignments = currentAssignmentsResponse.data.data;
            
            // Remove all current assignments
            for (const assignment of currentAssignments) {
              try {
                await axios.delete(`http://localhost:3001/api/factory-locations/${assignment.factory_location_id}/devices/${deviceId}`);
              } catch (removeError) {
                console.error(`Error removing device from factory ${assignment.factory_location_id}:`, removeError);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching current factory assignments:', error);
        }
      }
      
      // Add new factory assignments
      for (const factoryId of selectedFactories) {
        try {
          await axios.post(`http://localhost:3001/api/factory-locations/${factoryId}/devices`, {
            device_id: deviceId,
            userId: user.id,
            userEmail: user.email
          });
        } catch (assignmentError) {
          console.error(`Error assigning device to factory ${factoryId}:`, assignmentError);
        }
      }

      fetchDevices();
      setOpenDialog(false);
      setSelectedFactories([]);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save device');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = async (deviceId: number) => {
    const device = devices.find(d => d.id === deviceId);
    const deviceName = device?.device_name || 'this device';
    
    if (window.confirm(`Are you sure you want to delete "${deviceName}"? This action cannot be undone and will affect all factory assignments.`)) {
      try {
        setLoading(true);
        setError('');
        setSuccess('');
        
        // First remove all factory assignments
        try {
          const assignmentsResponse = await axios.get(`http://localhost:3001/api/devices/${deviceId}/factory-assignments`);
          if (assignmentsResponse.data.success) {
            const assignments = assignmentsResponse.data.data;
            for (const assignment of assignments) {
              try {
                await axios.delete(`http://localhost:3001/api/factory-locations/${assignment.factory_location_id}/devices/${deviceId}`);
              } catch (removeError) {
                console.error(`Error removing device from factory ${assignment.factory_location_id}:`, removeError);
              }
            }
          }
        } catch (error) {
          console.error('Error removing factory assignments:', error);
        }
        
        // Then delete the device
        const response = await axios.delete(`http://localhost:3001/api/devices/${deviceId}`);
        if (response.data.success) {
          setSuccess(`Device "${deviceName}" deleted successfully`);
          fetchDevices();
        } else {
          setError(response.data.message || 'Failed to delete device');
        }
      } catch (error: any) {
        console.error('Delete device error:', error);
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

  const handleOpenMacDialog = async (device: Device) => {
    setSelectedDevice(device);
    try {
      const response = await axios.get(`http://localhost:3001/api/devices/${device.id}/mac-addresses`);
      if (response.data.success) {
        setMacAddresses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching MAC addresses:', error);
      setError('Failed to fetch MAC addresses');
    }
    setMacDialogOpen(true);
  };

  const handleCloseMacDialog = () => {
    setMacDialogOpen(false);
    setSelectedDevice(null);
    setMacAddresses([]);
  };

  const handleAddMacAddress = () => {
    const newMac: MacAddress = {
      id: 0,
      device_id: selectedDevice?.id || 0,
      mac_address: '',
      adapter_type: 'wifi',
      adapter_name: '',
      is_primary: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setMacAddresses([...macAddresses, newMac]);
  };

  const handleUpdateMacAddress = (index: number, field: keyof MacAddress, value: any) => {
    const updated = [...macAddresses];
    updated[index] = { ...updated[index], [field]: value };
    setMacAddresses(updated);
  };

  const handleRemoveMacAddress = (index: number) => {
    const updated = macAddresses.filter((_, i) => i !== index);
    setMacAddresses(updated);
  };

  const handleSaveMacAddresses = async () => {
    if (!selectedDevice) return;
    
    // Filter out empty MAC addresses before sending
    const validMacs = macAddresses.filter(mac => 
      mac.mac_address && 
      mac.mac_address.trim() !== '' && 
      mac.adapter_type && 
      mac.adapter_type.trim() !== ''
    );

    if (validMacs.length === 0) {
      setError('Please add at least one valid MAC address with adapter type');
      return;
    }
    
    try {
      const response = await axios.put(`http://localhost:3001/api/devices/${selectedDevice.id}/mac-addresses`, {
        macAddresses: validMacs.map(mac => ({
          macAddress: mac.mac_address.trim(),
          adapterType: mac.adapter_type.trim(),
          adapterName: mac.adapter_name ? mac.adapter_name.trim() : 'Unknown Adapter',
          isActive: mac.is_active
        }))
      });
      
      if (response.data.success) {
        setSuccess('MAC addresses updated successfully');
        setMacAddresses(response.data.data);
        fetchDevices(); // Refresh device list
        setError(''); // Clear any previous errors
      }
    } catch (error: any) {
      console.error('Error saving MAC addresses:', error);
      setError(error.response?.data?.message || 'Failed to save MAC addresses');
    }
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
                        title="Edit Device"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenMacDialog(device)}
                        color="info"
                        title="Manage MAC Addresses"
                      >
                        <Security />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteDevice(device.id)}
                        color="error"
                        title="Delete Device"
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
            
            {/* Factory Selection */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: '#2c3e50' }}>
                Authorized Factory Locations
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select which factory locations this device can be used at:
              </Typography>
              {factories.length === 0 ? (
                <Alert severity="info">
                  No factory locations available. Please create a factory location first.
                </Alert>
              ) : (
                <Grid container spacing={1}>
                  {factories.map((factory) => (
                    <Grid item xs={12} sm={6} key={factory.id}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: 'pointer',
                          border: selectedFactories.includes(factory.id) ? '2px solid #4caf50' : '1px solid #e0e0e0',
                          bgcolor: selectedFactories.includes(factory.id) ? '#f1f8e9' : 'white',
                          '&:hover': {
                            border: '2px solid #2196f3',
                            bgcolor: selectedFactories.includes(factory.id) ? '#f1f8e9' : '#f5f5f5'
                          }
                        }}
                        onClick={() => {
                          if (selectedFactories.includes(factory.id)) {
                            setSelectedFactories(selectedFactories.filter(id => id !== factory.id));
                          } else {
                            setSelectedFactories([...selectedFactories, factory.id]);
                          }
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {factory.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {factory.address}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Radius: {factory.radius_meters}m
                              </Typography>
                            </Box>
                            <Box>
                              {selectedFactories.includes(factory.id) ? (
                                <CheckCircle color="success" />
                              ) : (
                                <Box sx={{ width: 24, height: 24, border: '2px solid #ccc', borderRadius: '50%' }} />
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
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

      {/* MAC Address Management Dialog */}
      <Dialog open={macDialogOpen} onClose={handleCloseMacDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Manage MAC Addresses - {selectedDevice?.device_name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add and manage all network adapter MAC addresses for this device. This ensures the device can be identified regardless of which network adapter is being used.
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">MAC Addresses</Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleAddMacAddress}
              size="small"
            >
              Add MAC Address
            </Button>
          </Box>

          {macAddresses.map((mac, index) => (
            <Card key={index} sx={{ mb: 2, p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="MAC Address"
                    value={mac.mac_address}
                    onChange={(e) => handleUpdateMacAddress(index, 'mac_address', e.target.value)}
                    placeholder="00:11:22:33:44:55"
                    size="small"
                    required
                    error={!mac.mac_address || mac.mac_address.trim() === ''}
                    helperText={!mac.mac_address || mac.mac_address.trim() === '' ? 'MAC address is required' : ''}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Adapter Type</InputLabel>
                    <Select
                      value={mac.adapter_type}
                      label="Adapter Type"
                      onChange={(e) => handleUpdateMacAddress(index, 'adapter_type', e.target.value)}
                    >
                      <MenuItem value="wifi">WiFi</MenuItem>
                      <MenuItem value="ethernet">Ethernet</MenuItem>
                      <MenuItem value="bluetooth">Bluetooth</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Adapter Name"
                    value={mac.adapter_name}
                    onChange={(e) => handleUpdateMacAddress(index, 'adapter_name', e.target.value)}
                    placeholder="e.g., Intel WiFi 6"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={mac.is_primary ? 'Primary' : 'Secondary'}
                      size="small"
                      color={mac.is_primary ? 'primary' : 'default'}
                      variant="outlined"
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveMacAddress(index)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          ))}

          {macAddresses.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No MAC addresses configured. Click "Add MAC Address" to get started.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMacDialog}>Cancel</Button>
          <Button
            onClick={handleSaveMacAddresses}
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: '#13bbc6',
              '&:hover': { bgcolor: '#0fa8b3' }
            }}
          >
            {loading ? <CircularProgress size={20} /> : 'Save MAC Addresses'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceManagement;
