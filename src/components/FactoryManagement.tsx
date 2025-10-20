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
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Business,
  LocationOn,
  Add,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Cancel,
  Devices
} from '@mui/icons-material';
import axios from 'axios';

interface FactoryLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  device_count?: number;
}

interface Device {
  id: number;
  device_id: string;
  device_name: string;
  device_type: string;
  location: string;
  is_factory_device: boolean;
  is_active: boolean;
  factory_locations?: number[];
}

interface FactoryManagementProps {
  selectedSection: string;
}

const FactoryManagement: React.FC<FactoryManagementProps> = () => {
  const [loading, setLoading] = useState(false);
  const [factories, setFactories] = useState<FactoryLocation[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedFactory, setSelectedFactory] = useState<FactoryLocation | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [newFactory, setNewFactory] = useState({
    name: '',
    latitude: 0,
    longitude: 0,
    radius_meters: 200,
    address: '',
    is_active: true
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [newDevice, setNewDevice] = useState({
    device_name: '',
    device_type: 'laptop',
    location: 'Factory General',
    is_factory_device: true,
    is_active: true,
    device_id: '',
    employee_id: null,
    mac_addresses: ['']
  });
  const [selectedFactories, setSelectedFactories] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const generateDeviceId = () => {
    const deviceType = newDevice.device_type.toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${deviceType}-${timestamp}-${randomNum}`;
  };

  const addMacAddress = () => {
    setNewDevice({
      ...newDevice,
      mac_addresses: [...newDevice.mac_addresses, '']
    });
  };

  const removeMacAddress = (index: number) => {
    if (newDevice.mac_addresses.length > 1) {
      const updatedMacs = newDevice.mac_addresses.filter((_, i) => i !== index);
      setNewDevice({
        ...newDevice,
        mac_addresses: updatedMacs
      });
    }
  };

  const updateMacAddress = (index: number, value: string) => {
    // Allow only hex characters and common separators while typing; force uppercase
    const sanitized = (value || '')
      .toUpperCase()
      .replace(/[^0-9A-F:\-]/g, '');

    const updatedMacs = [...newDevice.mac_addresses];
    updatedMacs[index] = sanitized;
    setNewDevice({ ...newDevice, mac_addresses: updatedMacs });
  };

  const normalizeMac = (mac: string): string => {
    const cleaned = (mac || '').replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
    if (cleaned.length !== 12) return mac.toUpperCase();
    return cleaned.match(/.{1,2}/g)!.join(':');
  };

  const validateMacAddress = (mac: string) => {
    if (!mac) return true;
    const cleaned = mac.replace(/[^0-9A-Fa-f]/g, '');
    if (cleaned.length !== 12) return false;
    return /^[0-9A-Fa-f]{12}$/.test(cleaned);
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    setLocationError('');
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      // Get address using reverse geocoding (using a free service)
      try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        const data = await response.json();
        
        const address = data.localityInfo?.administrative?.[0]?.name || 
                       data.localityInfo?.administrative?.[1]?.name || 
                       data.localityInfo?.administrative?.[2]?.name || 
                       `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        setNewFactory(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          address: address
        }));
        
        setLocationError('');
      } catch (geoError) {
        // If reverse geocoding fails, just use coordinates
        setNewFactory(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        }));
      }
      
    } catch (error: any) {
      console.error('Error getting location:', error);
      setLocationError('Failed to get current location. Please enter coordinates manually.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch factory locations
      const factoriesResponse = await axios.get('http://localhost:3001/api/factory-locations', { headers });
      setFactories(factoriesResponse.data.data || []);

      // Fetch devices
      const devicesResponse = await axios.get('http://localhost:3001/api/devices', { headers });
      const devicesData = devicesResponse.data.data || [];
      
      // For each device, get its factory assignments
      const devicesWithAssignments = await Promise.all(
        devicesData.map(async (device: Device) => {
          try {
            const assignmentsResponse = await axios.get(`http://localhost:3001/api/factory-locations/devices/${device.id}/factory-assignments`, { headers });
            return {
              ...device,
              factory_locations: assignmentsResponse.data.data?.map((assignment: any) => assignment.factory_location_id) || []
            };
          } catch (error) {
            return {
              ...device,
              factory_locations: []
            };
          }
        })
      );
      
      setDevices(devicesWithAssignments);

    } catch (error) {
      console.error('Error fetching data:', error);
      // Don't use mock data - show empty state instead
      setFactories([]);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = async (type: string, item?: FactoryLocation | Device) => {
    setDialogType(type);
    if (item && 'latitude' in item) {
      setSelectedFactory(item as FactoryLocation);
      if (type === 'edit-factory') {
        setNewFactory({
          name: item.name,
          latitude: item.latitude,
          longitude: item.longitude,
          radius_meters: item.radius_meters,
          address: item.address,
          is_active: item.is_active
        });
      }
  } else if (item && 'device_id' in item) {
      const deviceItem = item as Device;
      setSelectedDevice(deviceItem);

      // Prefill edit form
      if (type === 'edit-device') {
        setNewDevice({
          device_name: deviceItem.device_name || '',
          device_type: (deviceItem.device_type as any) || 'laptop',
          location: (deviceItem.location as any) || 'Factory General',
          is_factory_device: !!deviceItem.is_factory_device,
          is_active: !!deviceItem.is_active,
          device_id: deviceItem.device_id || '',
          employee_id: (deviceItem as any).employee_id || null,
          mac_addresses: ['']
        });
      }

      // Load existing factory assignments
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:3001/api/factory-locations/devices/${deviceItem.id}/factory-assignments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (response.data.success) {
          const assignedFactories = response.data.data.map((assignment: any) => assignment.factory_location_id);
          setSelectedFactories(assignedFactories);
        } else {
          setSelectedFactories([]);
        }
      } catch (error) {
        console.error('Error fetching factory assignments:', error);
        setSelectedFactories([]);
      }

      // Load existing MAC addresses for edit
      try {
        const token = localStorage.getItem('token');
        const macsResponse = await axios.get(`http://localhost:3001/api/devices/${deviceItem.id}/mac-addresses`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (macsResponse.data?.success) {
          const macs = (macsResponse.data.data || [])
            .filter((m: any) => m.is_active !== false)
            .map((m: any) => m.mac_address || '')
            .filter((m: string) => m);
          setNewDevice((prev) => ({ ...prev, mac_addresses: macs.length > 0 ? macs : [''] }));
        }
      } catch (macErr) {
        console.error('Error fetching device MAC addresses:', macErr);
      }
    } else {
      setSelectedFactory(null);
      setSelectedDevice(null);
      setNewFactory({
        name: '',
        latitude: 0,
        longitude: 0,
        radius_meters: 200,
        address: '',
        is_active: true
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setSelectedFactory(null);
    setSelectedDevice(null);
    setFormErrors({});
    setNewDevice({
      device_name: '',
      device_type: 'laptop',
      location: 'Factory General',
      is_factory_device: true,
      is_active: true,
      device_id: '',
      employee_id: null,
      mac_addresses: ['']
    });
    setSelectedFactories([]);
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!newFactory.name.trim()) {
      errors.name = 'Factory name is required';
    }
    if (!newFactory.address.trim()) {
      errors.address = 'Factory address is required';
    }
    if (newFactory.latitude === 0 && newFactory.longitude === 0) {
      errors.coordinates = 'Valid coordinates are required';
    }
    if (newFactory.radius_meters < 50 || newFactory.radius_meters > 1000) {
      errors.radius = 'Radius must be between 50 and 1000 meters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitFactory = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const factoryData = {
        ...newFactory,
        userId: user.id,
        userEmail: user.email
      };

      const url = dialogType === 'new-factory' 
        ? 'http://localhost:3001/api/factory-locations'
        : `http://localhost:3001/api/factory-locations/${selectedFactory?.id}`;
      
      const method = dialogType === 'new-factory' ? 'POST' : 'PUT';
      
      const response = await axios({
        method,
        url,
        data: factoryData,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        fetchData();
        handleCloseDialog();
      } else {
        setFormErrors({ submit: response.data.message || 'Failed to save factory location' });
      }
    } catch (error: any) {
      console.error('Error saving factory:', error);
      setFormErrors({ submit: error.response?.data?.message || 'Failed to save factory location' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFactory = async () => {
    if (!selectedFactory) return;

    if (!confirm(`Are you sure you want to delete "${selectedFactory.name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:3001/api/factory-locations/${selectedFactory.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        fetchData();
        handleCloseDialog();
      } else {
        alert('Failed to delete factory location');
      }
    } catch (error: any) {
      console.error('Error deleting factory:', error);
      alert('Failed to delete factory location');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFactoryStatus = async (factory: FactoryLocation) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:3001/api/factory-locations/${factory.id}`, {
        is_active: !factory.is_active
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        fetchData();
      } else {
        alert('Failed to update factory status');
      }
    } catch (error: any) {
      console.error('Error updating factory status:', error);
      alert('Failed to update factory status');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDeviceToFactory = async (deviceId: number, factoryId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await axios.post(`http://localhost:3001/api/factory-locations/${factoryId}/devices`, {
        device_id: deviceId,
        userId: user.id,
        userEmail: user.email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        fetchData();
        alert('Device assigned to factory successfully');
      } else {
        alert('Failed to assign device to factory');
      }
    } catch (error: any) {
      // Treat duplicate assignment as success (idempotent UX)
      if (error?.response?.status === 400 &&
          (error?.response?.data?.message || '').toLowerCase().includes('already assigned')) {
        fetchData();
        alert('Device already assigned to this factory');
      } else {
        console.error('Error assigning device to factory:', error);
        alert('Failed to assign device to factory');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDeviceFromFactory = async (deviceId: number, factoryId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await axios.delete(`http://localhost:3001/api/factory-locations/${factoryId}/devices/${deviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          userId: user.id,
          userEmail: user.email
        }
      });

      if (response.data.success) {
        fetchData();
        alert('Device removed from factory successfully');
      } else {
        alert('Failed to remove device from factory');
      }
    } catch (error: any) {
      // Treat missing assignment as success (idempotent UX)
      if (error?.response?.status === 404) {
        fetchData();
        alert('Device was not assigned to this factory');
      } else {
        console.error('Error removing device from factory:', error);
        alert('Failed to remove device from factory');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = async () => {
    if (!selectedDevice) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // First remove all factory assignments
      try {
        const token = localStorage.getItem('token');
        const assignmentsResponse = await axios.get(`http://localhost:3001/api/factory-locations/devices/${selectedDevice.id}/factory-assignments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (assignmentsResponse.data.success) {
          const assignments = assignmentsResponse.data.data;
          for (const assignment of assignments) {
            try {
              await axios.delete(`http://localhost:3001/api/factory-locations/${assignment.factory_location_id}/devices/${selectedDevice.id}`, {
                headers: { Authorization: `Bearer ${token}` },
                data: {
                  userId: user.id,
                  userEmail: user.email
                }
              });
            } catch (removeError) {
              console.error(`Error removing device from factory ${assignment.factory_location_id}:`, removeError);
            }
          }
        }
      } catch (error) {
        console.error('Error removing factory assignments:', error);
      }
      
      // Then delete the device
      const response = await axios.delete(`http://localhost:3001/api/devices/${selectedDevice.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert(`Device "${selectedDevice.device_name}" deleted successfully!`);
        fetchData();
        handleCloseDialog();
      } else {
        alert(`Failed to delete device: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error deleting device:', error);
      alert(`Failed to delete device: ${error.response?.data?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDevice = async () => {
    if (!newDevice.device_name.trim()) {
      setFormErrors({ device_name: 'Device name is required' });
      return;
    }

    if (!newDevice.device_id.trim()) {
      setFormErrors({ device_id: 'Device ID is required' });
      return;
    }

    // If no employee is assigned, automatically mark as factory device
    const hasEmployee = !!newDevice.employee_id;
    const isFactoryDevice = hasEmployee ? newDevice.is_factory_device : true;
    if (isFactoryDevice && selectedFactories.length === 0) {
      setFormErrors({ factories: 'Please select at least one factory location' });
      return;
    }

    // Validate MAC addresses
    // Normalize MACs and validate
    const validMacs = newDevice.mac_addresses
      .map(mac => normalizeMac(mac || ''))
      .filter(mac => mac.trim() !== '');
    if (validMacs.length === 0) {
      setFormErrors({ mac_addresses: 'At least one MAC address is required' });
      return;
    }

    for (const mac of validMacs) {
      if (!validateMacAddress(mac)) {
        setFormErrors({ mac_addresses: `Invalid MAC address format: ${mac}. Use format like AA:BB:CC:DD:EE:FF` });
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Create device using the main device API
      const deviceData = {
        device_id: newDevice.device_id,
        device_name: newDevice.device_name,
        device_type: newDevice.device_type,
        location: newDevice.location,
        is_factory_device: isFactoryDevice,
        is_active: newDevice.is_active,
        created_by: user.id
      };

      let response;
      let deviceId;

      if (dialogType === 'edit-device' && selectedDevice) {
        // Update existing device
        response = await axios.put(`http://localhost:3001/api/devices/${selectedDevice.id}`, deviceData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        deviceId = selectedDevice.id;
      } else {
        // Create new device
        response = await axios.post('http://localhost:3001/api/devices', deviceData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        deviceId = response.data.data.id;
      }

      if (response.data.success) {
        
        // Replace MAC addresses to keep consistency (upsert behavior)
        try {
          await axios.put(`http://localhost:3001/api/devices/${deviceId}/mac-addresses`, {
            macAddresses: validMacs.map(mac => ({
              macAddress: mac,
              adapterType: 'wifi',
              adapterName: 'Unknown',
              isActive: true
            }))
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (macError) {
          console.error('Error updating MAC addresses:', macError);
          alert('Failed to update MAC addresses. Please check formats and try again.');
          return;
        }
        
        // Handle factory assignments
        if (dialogType === 'edit-device' && selectedDevice) {
          // For editing: first remove all existing assignments, then add new ones
          try {
            const currentAssignmentsResponse = await axios.get(`http://localhost:3001/api/factory-locations/devices/${deviceId}/factory-assignments`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (currentAssignmentsResponse.data.success) {
              const currentAssignments = currentAssignmentsResponse.data.data;
              
              // Remove all current assignments
              for (const assignment of currentAssignments) {
                try {
                  await axios.delete(`http://localhost:3001/api/factory-locations/${assignment.factory_location_id}/devices/${deviceId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    data: {
                      userId: user.id,
                      userEmail: user.email
                    }
                  });
                } catch (removeError) {
                  console.error(`Error removing device from factory ${assignment.factory_location_id}:`, removeError);
                }
              }
            }
          } catch (error) {
            console.error('Error fetching current factory assignments:', error);
          }
        }
        
        // Add new factory assignments only if factory device
        if (isFactoryDevice) {
          for (const factoryId of selectedFactories) {
            try {
              await axios.post(`http://localhost:3001/api/factory-locations/${factoryId}/devices`, {
                device_id: deviceId,
                userId: user.id,
                userEmail: user.email
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
            } catch (assignmentError: any) {
              // Ignore duplicate assignment errors to keep UX smooth
              if (!(assignmentError?.response?.status === 400 &&
                    (assignmentError?.response?.data?.message || '').toLowerCase().includes('already assigned'))) {
                console.error(`Error assigning device to factory ${factoryId}:`, assignmentError);
              }
            }
          }
        }

        // Explicitly refresh current device assignments so chips stay selected
        try {
          if (isFactoryDevice) {
            const refreshAssignments = await axios.get(`http://localhost:3001/api/factory-locations/devices/${deviceId}/factory-assignments`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (refreshAssignments.data.success) {
              const assigned = refreshAssignments.data.data.map((a: any) => a.factory_location_id);
              setSelectedFactories(assigned);
            }
          } else {
            setSelectedFactories([]);
          }
        } catch (refreshErr) {
          console.error('Error refreshing device assignments after save:', refreshErr);
        }

        fetchData();
        handleCloseDialog();
        setNewDevice({
          device_name: '',
          device_type: 'laptop',
          location: 'office',
          is_factory_device: true,
          is_active: true,
          device_id: '',
          employee_id: null,
          mac_addresses: ['']
        });
        setSelectedFactories([]);
        alert('Device created with MAC addresses and assigned to selected factories successfully!');
      } else {
        setFormErrors({ submit: response.data.message || 'Failed to create device' });
      }
    } catch (error: any) {
      console.error('Error creating device:', error);
      setFormErrors({ submit: error.response?.data?.message || 'Failed to create device' });
    } finally {
      setLoading(false);
    }
  };

  const renderFactoryLocations = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Factory Locations
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('new-factory')}
          sx={{ bgcolor: '#13bbc6' }}
        >
          Add Factory Location
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Factory Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Coordinates</TableCell>
              <TableCell>Radius</TableCell>
              <TableCell>Devices</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {factories.map((factory) => (
              <TableRow key={factory.id}>
                <TableCell>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {factory.name}
                  </Typography>
                </TableCell>
                <TableCell>{factory.address}</TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {factory.latitude.toFixed(6)}, {factory.longitude.toFixed(6)}
                  </Typography>
                </TableCell>
                <TableCell>{factory.radius_meters}m</TableCell>
                <TableCell>
                  <Chip 
                    label={`${factory.device_count || 0} devices`}
                    size="small"
                    color="primary"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={factory.is_active ? 'Active' : 'Inactive'}
                    color={factory.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog('view-factory', factory)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Factory">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog('edit-factory', factory)}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Toggle Status">
                    <IconButton 
                      size="small" 
                      onClick={() => handleToggleFactoryStatus(factory)}
                    >
                      {factory.is_active ? <Cancel /> : <CheckCircle />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Factory">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog('delete-factory', factory)}
                      sx={{ color: 'error.main' }}
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
    </Box>
  );

  const renderDeviceManagement = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Device Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('new-device')}
          sx={{ bgcolor: '#13bbc6' }}
        >
          Add Device
        </Button>
      </Box>

      <Grid container spacing={3}>
        {devices.map((device) => (
          <Grid item xs={12} md={6} lg={4} key={device.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {device.device_name}
                  </Typography>
                  <Chip
                    label={device.is_active ? 'Active' : 'Inactive'}
                    color={device.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>ID:</strong> {device.device_id}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Type:</strong> {device.device_type}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>Location:</strong> {device.location}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Tooltip title="Edit Device">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog('edit-device', device)}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Assign to Factories">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog('assign-device', device)}
                    >
                      <Business />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Device">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog('delete-device', device)}
                      sx={{ color: 'error.main' }}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                {/* Show assigned factories */}
                {device.factory_locations && device.factory_locations.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Assigned to:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {device.factory_locations.map((factoryId: number) => {
                        const factory = factories.find(f => f.id === factoryId);
                        return factory ? (
                          <Chip
                            key={factoryId}
                            label={factory.name}
                            size="small"
                            color="primary"
                            onDelete={() => handleRemoveDeviceFromFactory(device.id, factoryId)}
                          />
                        ) : null;
                      })}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderFactoryForm = () => (
    <Box component="form" sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Factory Name"
            name="name"
            fullWidth
            value={newFactory.name}
            onChange={(e) => setNewFactory({...newFactory, name: e.target.value})}
            variant="outlined"
            error={!!formErrors.name}
            helperText={formErrors.name}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Factory Address"
            name="address"
            fullWidth
            value={newFactory.address}
            onChange={(e) => setNewFactory({...newFactory, address: e.target.value})}
            variant="outlined"
            error={!!formErrors.address}
            helperText={formErrors.address}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Button
              variant="outlined"
              startIcon={<LocationOn />}
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              sx={{ minWidth: 200 }}
            >
              {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
            </Button>
            {locationError && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {locationError}
              </Typography>
            )}
          </Box>
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Latitude"
            name="latitude"
            type="number"
            fullWidth
            value={newFactory.latitude}
            onChange={(e) => setNewFactory({...newFactory, latitude: parseFloat(e.target.value) || 0})}
            variant="outlined"
            error={!!formErrors.coordinates}
            helperText={formErrors.coordinates || "Enter latitude manually or use current location"}
            required
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Longitude"
            name="longitude"
            type="number"
            fullWidth
            value={newFactory.longitude}
            onChange={(e) => setNewFactory({...newFactory, longitude: parseFloat(e.target.value) || 0})}
            variant="outlined"
            helperText="Enter longitude manually or use current location"
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Access Radius (meters)"
            name="radius_meters"
            type="number"
            fullWidth
            value={newFactory.radius_meters}
            onChange={(e) => setNewFactory({...newFactory, radius_meters: parseInt(e.target.value) || 200})}
            variant="outlined"
            error={!!formErrors.radius}
            helperText={formErrors.radius || "Radius in meters for location validation"}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={newFactory.is_active}
                onChange={(e) => setNewFactory({...newFactory, is_active: e.target.checked})}
              />
            }
            label="Active"
          />
        </Grid>
      </Grid>
      {formErrors.submit && <Alert severity="error" sx={{ mt: 2 }}>{formErrors.submit}</Alert>}
    </Box>
  );

  const renderFactoryDetails = () => {
    if (!selectedFactory) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
          Factory Details
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Factory Name</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedFactory.name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip
              label={selectedFactory.is_active ? 'Active' : 'Inactive'}
              color={selectedFactory.is_active ? 'success' : 'default'}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Address</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedFactory.address}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Coordinates</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {selectedFactory.latitude.toFixed(6)}, {selectedFactory.longitude.toFixed(6)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Access Radius</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedFactory.radius_meters} meters</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Created</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {new Date(selectedFactory.created_at).toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {new Date(selectedFactory.updated_at).toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderDeviceForm = () => (
    <Box component="form" sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Device Name"
            name="device_name"
            fullWidth
            value={newDevice.device_name}
            onChange={(e) => setNewDevice({...newDevice, device_name: e.target.value})}
            variant="outlined"
            error={!!formErrors.device_name}
            helperText={formErrors.device_name}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              label="Device ID"
              name="device_id"
              fullWidth
              value={newDevice.device_id}
              onChange={(e) => setNewDevice({...newDevice, device_id: e.target.value})}
              variant="outlined"
              error={!!formErrors.device_id}
              helperText={formErrors.device_id || "Unique identifier for the device (e.g., LAPTOP-001, DESKTOP-002)"}
              required
            />
            <Button
              variant="outlined"
              onClick={() => setNewDevice({...newDevice, device_id: generateDeviceId()})}
              sx={{ minWidth: 120, mt: 1 }}
            >
              Generate ID
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Device Type"
            name="device_type"
            fullWidth
            value={newDevice.device_type}
            onChange={(e) => setNewDevice({...newDevice, device_type: e.target.value})}
            variant="outlined"
            select
            SelectProps={{ native: true }}
          >
            <option value="laptop">Laptop</option>
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
            <option value="mobile">Mobile</option>
            <option value="kiosk">Kiosk</option>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Location"
            name="location"
            fullWidth
            value={newDevice.location}
            onChange={(e) => setNewDevice({...newDevice, location: e.target.value})}
            variant="outlined"
            select
            SelectProps={{ native: true }}
          >
            <option value="Director Office">Director Office</option>
            <option value="Manager Office">Manager Office</option>
            <option value="Director Personal">Director Personal</option>
            <option value="Manager Personal">Manager Personal</option>
            <option value="Reception">Reception</option>
            <option value="Store Room">Store Room</option>
            <option value="Security">Security</option>
            <option value="Factory General">Factory General</option>
          </TextField>
        </Grid>
        
        {/* MAC Addresses */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2, color: '#2c3e50' }}>
            MAC Addresses
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add the MAC addresses for this device. At least one is required for device validation.
          </Typography>
          {newDevice.mac_addresses.map((mac, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <TextField
                label={`MAC Address ${index + 1}`}
                value={mac}
                onChange={(e) => updateMacAddress(index, e.target.value)}
                variant="outlined"
                placeholder="AA:BB:CC:DD:EE:FF"
                error={!!formErrors.mac_addresses && !validateMacAddress(mac) && mac !== ''}
                helperText={!validateMacAddress(mac) && mac !== '' ? 'Invalid MAC format' : ''}
                sx={{ flexGrow: 1 }}
              />
              {newDevice.mac_addresses.length > 1 && (
                <IconButton
                  onClick={() => removeMacAddress(index)}
                  color="error"
                  sx={{ mt: 1 }}
                >
                  <Delete />
                </IconButton>
              )}
            </Box>
          ))}
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={addMacAddress}
            sx={{ mb: 2 }}
          >
            Add MAC Address
          </Button>
          {formErrors.mac_addresses && (
            <Alert severity="error" sx={{ mt: 1 }}>{formErrors.mac_addresses}</Alert>
          )}
        </Grid>
        
        {/* Factory Selection */}
        {newDevice.is_factory_device && (
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
          {formErrors.factories && (
            <Alert severity="error" sx={{ mt: 1 }}>{formErrors.factories}</Alert>
          )}
        </Grid>
        )}

        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={newDevice.is_factory_device}
                onChange={(e) => {
                  const val = e.target.checked;
                  setNewDevice({...newDevice, is_factory_device: val});
                  if (!val) {
                    setSelectedFactories([]);
                  }
                }}
              />
            }
            label="Factory Device"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Factory Device (Yes/No)"
            fullWidth
            value={newDevice.is_factory_device ? 'yes' : 'no'}
            onChange={(e) => {
              const val = e.target.value === 'yes';
              setNewDevice({ ...newDevice, is_factory_device: val });
              if (!val) {
                setSelectedFactories([]);
              }
            }}
            variant="outlined"
            select
            SelectProps={{ native: true }}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={newDevice.is_active}
                onChange={(e) => setNewDevice({...newDevice, is_active: e.target.checked})}
              />
            }
            label="Active"
          />
        </Grid>
      </Grid>
      {formErrors.submit && <Alert severity="error" sx={{ mt: 2 }}>{formErrors.submit}</Alert>}
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Factory Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage factory locations, device assignments, and access control settings.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
          <Tab 
            label="Factory Locations" 
            icon={<LocationOn />} 
            iconPosition="start"
          />
          <Tab 
            label="Device Management" 
            icon={<Devices />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {selectedTab === 0 && renderFactoryLocations()}
      {selectedTab === 1 && renderDeviceManagement()}

      {/* Dialog for various actions */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'new-factory' && 'Add New Factory Location'}
          {dialogType === 'edit-factory' && 'Edit Factory Location'}
          {dialogType === 'view-factory' && 'Factory Details'}
          {dialogType === 'delete-factory' && 'Delete Factory Location'}
          {dialogType === 'new-device' && 'Add New Device'}
          {dialogType === 'edit-device' && 'Edit Device'}
          {dialogType === 'delete-device' && 'Delete Device'}
          {dialogType === 'assign-device' && 'Assign Device to Factories'}
        </DialogTitle>
        <DialogContent>
          {dialogType.includes('factory') && dialogType !== 'delete-factory' && dialogType !== 'view-factory' && renderFactoryForm()}
          {dialogType === 'view-factory' && renderFactoryDetails()}
          {dialogType === 'delete-factory' && (
            <Alert severity="warning">
              Are you sure you want to delete "{selectedFactory?.name}"? This action cannot be undone and will affect all associated devices and access controls.
            </Alert>
          )}
          {dialogType === 'new-device' && renderDeviceForm()}
          {dialogType === 'edit-device' && renderDeviceForm()}
          {dialogType === 'delete-device' && (
            <Alert severity="warning">
              Are you sure you want to delete "{selectedDevice?.device_name}"? This action cannot be undone and will affect all factory assignments.
            </Alert>
          )}
          {dialogType === 'assign-device' && selectedDevice && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                Assign Device: {selectedDevice.device_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select which factory locations this device can be used at:
              </Typography>
              
              <Grid container spacing={2}>
                {factories.map((factory) => {
                  const isAssigned = selectedDevice.factory_locations?.includes(factory.id);
                  return (
                    <Grid item xs={12} sm={6} key={factory.id}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: 'pointer',
                          border: isAssigned ? '2px solid #4caf50' : '1px solid #e0e0e0',
                          bgcolor: isAssigned ? '#f1f8e9' : 'white'
                        }}
                        onClick={() => {
                          if (isAssigned) {
                            handleRemoveDeviceFromFactory(selectedDevice.id, factory.id);
                          } else {
                            handleAssignDeviceToFactory(selectedDevice.id, factory.id);
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
                              {isAssigned ? (
                                <CheckCircle color="success" />
                              ) : (
                                <Box sx={{ width: 24, height: 24, border: '2px solid #ccc', borderRadius: '50%' }} />
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogType === 'view-factory' || dialogType === 'assign-device' ? 'Close' : 'Cancel'}
          </Button>
          {dialogType === 'new-factory' && (
            <Button 
              variant="contained" 
              onClick={handleSubmitFactory}
              disabled={loading}
              sx={{ bgcolor: '#13bbc6' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Add Factory'}
            </Button>
          )}
          {dialogType === 'edit-factory' && (
            <Button 
              variant="contained" 
              onClick={handleSubmitFactory}
              disabled={loading}
              sx={{ bgcolor: '#13bbc6' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Update Factory'}
            </Button>
          )}
          {dialogType === 'delete-factory' && (
            <Button 
              variant="contained" 
              onClick={handleDeleteFactory}
              disabled={loading}
              color="error"
            >
              {loading ? <CircularProgress size={24} /> : 'Delete Factory'}
            </Button>
          )}
          {dialogType === 'new-device' && (
            <Button 
              variant="contained" 
              onClick={handleSubmitDevice}
              disabled={loading}
              sx={{ bgcolor: '#13bbc6' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Add Device'}
            </Button>
          )}
          {dialogType === 'edit-device' && (
            <Button 
              variant="contained" 
              onClick={handleSubmitDevice}
              disabled={loading}
              sx={{ bgcolor: '#13bbc6' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Update Device'}
            </Button>
          )}
          {dialogType === 'delete-device' && (
            <Button 
              variant="contained" 
              onClick={handleDeleteDevice}
              disabled={loading}
              color="error"
            >
              {loading ? <CircularProgress size={24} /> : 'Delete Device'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FactoryManagement;
