import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  Autocomplete
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Cancel,
  AttachMoney,
  LocalShipping,
  PersonAdd,
  Search
} from '@mui/icons-material';
import axios from 'axios';

interface DriverDispatchManagementProps {
  userRole: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
  last_driver_id?: number;
  last_driver_name?: string;
  total_orders: number;
  total_amount: number;
  last_order_date?: string;
  is_active: boolean;
}

interface CustomerOrder {
  customer_id?: number;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  bags: number;
  price: number;
}

interface DriverDispatch {
  id: number;
  order_number: string;
  driver_name: string;
  assistant_name?: string;
  status: string;
  items: any;
  total_amount: number;
  created_at: string;
  settlement_status?: string;
  balance_due?: number;
}

interface Driver {
  id: number;
  name: string;
  role: string;
}

const DriverDispatchManagement: React.FC<DriverDispatchManagementProps> = ({ userRole }) => {
  const [loading, setLoading] = useState(false);
  const [dispatches, setDispatches] = useState<DriverDispatch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<number>(0);
  const [selectedAssistant, setSelectedAssistant] = useState<number>(0);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'create' | 'view' | 'customer'>('create');
  const [selectedDispatch, setSelectedDispatch] = useState<DriverDispatch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [dispatchesRes, customersRes, driversRes] = await Promise.all([
        axios.get('http://localhost:3002/api/driver-dispatch', { headers }),
        axios.get('http://localhost:3002/api/driver-dispatch/customers', { headers }),
        axios.get('http://localhost:3002/api/sales/drivers', { headers })
      ]);

      setDispatches(dispatchesRes.data.data || []);
      setCustomers(customersRes.data.data || []);
      setDrivers(driversRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type: 'create' | 'view' | 'customer', dispatch?: DriverDispatch) => {
    setDialogType(type);
    setSelectedDispatch(dispatch || null);
    if (type === 'create') {
      setSelectedDriver(0);
      setSelectedAssistant(0);
      setCustomerOrders([]);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('create');
    setSelectedDispatch(null);
    setNewCustomer({ name: '', phone: '', address: '' });
  };

  const addCustomerOrder = () => {
    setCustomerOrders([...customerOrders, { customer_name: '', customer_phone: '', bags: 0, price: 0 }]);
  };

  const updateCustomerOrder = (index: number, field: string, value: any) => {
    const updated = [...customerOrders];
    if (field === 'bags') {
      const bags = parseInt(value) || 0;
      updated[index].bags = bags;
      updated[index].price = bags >= 50 ? 250 : 270;
    } else if (field === 'customer_id') {
      const customer = customers.find(c => c.id === value);
      if (customer) {
        updated[index].customer_id = customer.id;
        updated[index].customer_name = customer.name;
        updated[index].customer_phone = customer.phone;
        updated[index].customer_address = customer.address;
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    setCustomerOrders(updated);
  };

  const removeCustomerOrder = (index: number) => {
    setCustomerOrders(customerOrders.filter((_, i) => i !== index));
  };

  const handleSaveCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      alert('Name and phone are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post('http://localhost:3002/api/driver-dispatch/customers', newCustomer, { headers });
      await fetchData();
      handleCloseDialog();
      alert('Customer saved successfully');
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error saving customer');
    }
  };

  const handleCreateDispatch = async () => {
    if (!selectedDriver) {
      alert('Please select a driver');
      return;
    }

    if (customerOrders.length === 0) {
      alert('Please add at least one customer order');
      return;
    }

    // Validate all orders have bags
    const invalidOrders = customerOrders.filter(co => !co.bags || co.bags <= 0);
    if (invalidOrders.length > 0) {
      alert('All customer orders must have bags specified');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.post('http://localhost:3002/api/driver-dispatch/create', {
        driver_id: selectedDriver,
        assistant_id: selectedAssistant || null,
        customer_orders: customerOrders,
        notes: ''
      }, { headers });

      if (response.data.success) {
        alert('Driver dispatch created successfully!');
        handleCloseDialog();
        fetchData();
      } else {
        alert(response.data.message || 'Error creating dispatch');
      }
    } catch (error: any) {
      console.error('Error creating dispatch:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Error creating dispatch');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending_pickup': return 'warning';
      case 'out_for_delivery': return 'info';
      case 'settled': return 'success';
      case 'settlement_pending': return 'warning';
      default: return 'default';
    }
  };

  const getFilteredCustomers = () => {
    if (!searchTerm) return customers;
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Driver Dispatch Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<PersonAdd />}
            onClick={() => handleOpenDialog('customer')}
            sx={{ mr: 2 }}
          >
            Add Customer
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog('create')}
            sx={{ bgcolor: '#13bbc6' }}
          >
            Create Dispatch
          </Button>
        </Box>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">Total Dispatches</Typography>
              <Typography variant="h4">{dispatches.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">Active Deliveries</Typography>
              <Typography variant="h4" color="info.main">
                {dispatches.filter(d => d.status === 'out_for_delivery').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">Settled</Typography>
              <Typography variant="h4" color="success.main">
                {dispatches.filter(d => d.status === 'settled').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dispatches Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order Number</TableCell>
                  <TableCell>Driver</TableCell>
                  <TableCell>Assistant</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Settlement</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dispatches.map((dispatch) => (
                  <TableRow key={dispatch.id}>
                    <TableCell>{dispatch.order_number}</TableCell>
                    <TableCell>{dispatch.driver_name}</TableCell>
                    <TableCell>{dispatch.assistant_name || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={dispatch.status.replace('_', ' ').toUpperCase()} 
                        color={getStatusColor(dispatch.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {dispatch.settlement_status && (
                        <Chip 
                          label={dispatch.settlement_status.replace('_', ' ').toUpperCase()} 
                          color={dispatch.balance_due === 0 ? 'success' : 'warning'}
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>{new Date(dispatch.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleOpenDialog('view', dispatch)}>
                          <Visibility />
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

      {/* Create Dispatch Dialog */}
      <Dialog open={dialogOpen && dialogType === 'create'} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Create Driver Dispatch</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Driver</InputLabel>
                <Select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(Number(e.target.value))}
                >
                  {drivers.filter(d => d.role === 'Driver').map((driver) => (
                    <MenuItem key={driver.id} value={driver.id}>{driver.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Driver Assistant (Optional)</InputLabel>
                <Select
                  value={selectedAssistant}
                  onChange={(e) => setSelectedAssistant(Number(e.target.value))}
                >
                  <MenuItem value={0}>None</MenuItem>
                  {drivers.filter(d => d.role === 'Driver Assistant').map((assistant) => (
                    <MenuItem key={assistant.id} value={assistant.id}>{assistant.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Customer Orders</Typography>
                <Button startIcon={<Add />} onClick={addCustomerOrder} size="small">
                  Add Customer
                </Button>
              </Box>

              {customerOrders.map((order, index) => (
                <Card key={index} sx={{ mb: 2, p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        options={customers}
                        getOptionLabel={(option) => `${option.name} - ${option.phone}`}
                        onChange={(e, value) => updateCustomerOrder(index, 'customer_id', value?.id)}
                        renderInput={(params) => <TextField {...params} label="Search Customer" fullWidth />}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Number of Bags"
                        type="number"
                        fullWidth
                        value={order.bags}
                        onChange={(e) => updateCustomerOrder(index, 'bags', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <Button
                          color="error"
                          onClick={() => removeCustomerOrder(index)}
                          size="small"
                        >
                          Remove
                        </Button>
                      </Box>
                    </Grid>
                    {order.bags > 0 && (
                      <Grid item xs={12}>
                        <Alert severity="info">
                          Price: ₦{order.price} per bag (Total: ₦{(order.bags * order.price).toLocaleString()})
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </Card>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCreateDispatch} variant="contained" sx={{ bgcolor: '#13bbc6' }}>
            Create Dispatch
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={dialogOpen && dialogType === 'customer'} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Customer Name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address (Optional)"
                multiline
                rows={3}
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveCustomer} variant="contained" sx={{ bgcolor: '#13bbc6' }}>
            Save Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={dialogOpen && dialogType === 'view'} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Dispatch Details</DialogTitle>
        <DialogContent>
          {selectedDispatch && (
            <Box>
              <Typography variant="body1"><strong>Order:</strong> {selectedDispatch.order_number}</Typography>
              <Typography variant="body1"><strong>Driver:</strong> {selectedDispatch.driver_name}</Typography>
              {selectedDispatch.assistant_name && (
                <Typography variant="body1"><strong>Assistant:</strong> {selectedDispatch.assistant_name}</Typography>
              )}
              <Typography variant="body1"><strong>Status:</strong> {selectedDispatch.status}</Typography>
              <Typography variant="body1"><strong>Total Amount:</strong> ₦{selectedDispatch.total_amount.toLocaleString()}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriverDispatchManagement;
