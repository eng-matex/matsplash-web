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
  Alert
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
  PersonAdd
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
  is_new_customer?: boolean;
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
  const [bagsDispatched, setBagsDispatched] = useState<number>(0);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'create' | 'view' | 'customer' | 'settle' | 'return'>('create');
  const [settlementData, setSettlementData] = useState({ bags_sold: 0, bags_at_250: 0, amount_paid: 0, customer_orders: [] as CustomerOrder[] });
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

      const [dispatchesRes, customersRes, employeesRes] = await Promise.all([
        axios.get('http://localhost:3002/api/driver-dispatch', { headers }),
        axios.get('http://localhost:3002/api/driver-dispatch/customers', { headers }),
        axios.get('http://localhost:3002/api/employees', { headers })
      ]);

      setDispatches(dispatchesRes.data.data || []);
      setCustomers(customersRes.data.data || []);
      // Filter for Driver and Driver Assistant roles
      const driverRoles = ['Driver', 'Driver Assistant'];
      setDrivers((employeesRes.data.data || []).filter((emp: any) => driverRoles.includes(emp.role)));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type: 'create' | 'view' | 'customer' | 'settle' | 'return', dispatch?: DriverDispatch) => {
    setDialogType(type);
    setSelectedDispatch(dispatch || null);
    if (type === 'create') {
      setSelectedDriver(0);
      setSelectedAssistant(0);
      setBagsDispatched(0);
    } else if (type === 'settle' && dispatch) {
      setSettlementData({ bags_sold: 0, bags_at_250: 0, amount_paid: 0, customer_orders: [] });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('create');
    setSelectedDispatch(null);
    setNewCustomer({ name: '', phone: '', address: '' });
    setSettlementData({ bags_sold: 0, bags_at_250: 0, amount_paid: 0, customer_orders: [] });
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

    if (!bagsDispatched || bagsDispatched <= 0) {
      alert('Please enter number of bags to dispatch');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.post('http://localhost:3002/api/driver-dispatch/create', {
        driver_id: selectedDriver,
        assistant_id: selectedAssistant || null,
        bags_dispatched: bagsDispatched,
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

  const handleProcessSettlement = async () => {
    if (!selectedDispatch) return;

    const { bags_sold, amount_paid, customer_orders } = settlementData;

    if (!bags_sold || bags_sold <= 0) {
      alert('Please enter number of bags sold');
      return;
    }

    // Validate customer orders - all must be 50+ bags
    for (const order of customer_orders) {
      if (!order.customer_name || !order.customer_phone || !order.bags) {
        alert('Please complete all fields for all customer orders');
        return;
      }
      if (order.bags < 50) {
        alert('Customer orders must be 50 bags or more');
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.post(`http://localhost:3002/api/driver-dispatch/${selectedDispatch.id}/settle`, {
        bags_sold,
        bags_returned: 0,
        amount_paid,
        customer_orders,
        notes: ''
      }, { headers });

      if (response.data.success) {
        alert('Settlement processed successfully!');
        handleCloseDialog();
        fetchData();
      } else {
        alert(response.data.message || 'Error processing settlement');
      }
    } catch (error: any) {
      console.error('Error processing settlement:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Error processing settlement');
      }
    }
  };

  const getFilteredCustomers = () => {
    if (!searchTerm) return customers;
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    );
  };

  const calculateExpectedAmount = () => {
    if (!settlementData.bags_sold) return 0;
    const bagsAt250 = settlementData.customer_orders.reduce((sum, o) => sum + (o.bags || 0), 0);
    const bagsAt270 = settlementData.bags_sold - bagsAt250;
    return (bagsAt250 * 250) + (bagsAt270 * 270);
  };

  const calculateBalance = () => {
    const expected = calculateExpectedAmount();
    return expected - settlementData.amount_paid;
  };

  const addSettlementCustomer = () => {
    setSettlementData({
      ...settlementData,
      customer_orders: [...settlementData.customer_orders, { customer_name: '', customer_phone: '', bags: 0, price: 0, is_new_customer: false }]
    });
  };

  const updateSettlementCustomer = (index: number, field: string, value: any) => {
    const updated = [...settlementData.customer_orders];
    if (field === 'bags') {
      const bags = parseInt(value) || 0;
      updated[index].bags = bags;
      updated[index].price = bags >= 50 ? 250 : 270;
    } else if (field === 'customer_phone') {
      const customer = customers.find(c => c.phone === value);
      if (customer) {
        updated[index].customer_id = customer.id;
        updated[index].customer_name = customer.name;
        updated[index].customer_address = customer.address;
        updated[index].is_new_customer = false;
      } else {
        updated[index].is_new_customer = true;
        updated[index].customer_id = undefined;
      }
      (updated[index] as any)[field] = value;
    } else {
      (updated[index] as any)[field] = value;
    }
    setSettlementData({ ...settlementData, customer_orders: updated });
  };

  const removeSettlementCustomer = (index: number) => {
    setSettlementData({
      ...settlementData,
      customer_orders: settlementData.customer_orders.filter((_, i) => i !== index)
    });
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
                      {userRole === 'receptionist' && dispatch.status === 'out_for_delivery' && (
                        <Tooltip title="Process Settlement">
                          <IconButton size="small" onClick={() => handleOpenDialog('settle', dispatch)}>
                            <AttachMoney />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Dispatch Dialog */}
      <Dialog open={dialogOpen && dialogType === 'create'} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
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
              <TextField
                fullWidth
                label="Number of Bags to Dispatch"
                type="number"
                value={bagsDispatched}
                onChange={(e) => setBagsDispatched(parseInt(e.target.value) || 0)}
                helperText="Enter total number of bags being dispatched to driver"
              />
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

      {/* Settlement Dialog */}
      <Dialog open={dialogOpen && dialogType === 'settle'} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Process Settlement</DialogTitle>
        <DialogContent>
          {selectedDispatch && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2"><strong>Driver:</strong> {selectedDispatch.driver_name}</Typography>
                <Typography variant="body2"><strong>Order:</strong> {selectedDispatch.order_number}</Typography>
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Total Bags Sold"
                    type="number"
                    value={settlementData.bags_sold}
                    onChange={(e) => setSettlementData({ ...settlementData, bags_sold: parseInt(e.target.value) || 0 })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Customers with 50+ Bags</Typography>
                    <Button startIcon={<Add />} onClick={addSettlementCustomer} size="small">
                      Add Customer
                    </Button>
                  </Box>

                  {settlementData.customer_orders.map((order, index) => (
                    <Card key={index} sx={{ mb: 2, p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <TextField
                            label="Customer Name"
                            fullWidth
                            value={order.customer_name}
                            onChange={(e) => updateSettlementCustomer(index, 'customer_name', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            label="Phone Number"
                            fullWidth
                            value={order.customer_phone}
                            onChange={(e) => updateSettlementCustomer(index, 'customer_phone', e.target.value)}
                            helperText={order.is_new_customer ? 'New customer' : ''}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            label="Number of Bags"
                            type="number"
                            fullWidth
                            value={order.bags}
                            onChange={(e) => updateSettlementCustomer(index, 'bags', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} md={1}>
                          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                            <Button
                              color="error"
                              onClick={() => removeSettlementCustomer(index)}
                              size="small"
                            >
                              Remove
                            </Button>
                          </Box>
                        </Grid>
                        {order.bags > 0 && (
                          <Grid item xs={12}>
                            <Alert severity="info">
                              Price: ₦250 per bag (Total: ₦{(order.bags * 250).toLocaleString()})
                            </Alert>
                          </Grid>
                        )}
                      </Grid>
                    </Card>
                  ))}
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Amount Paid"
                    type="number"
                    value={settlementData.amount_paid}
                    onChange={(e) => setSettlementData({ ...settlementData, amount_paid: parseFloat(e.target.value) || 0 })}
                  />
                </Grid>

                {settlementData.bags_sold > 0 && (
                  <Grid item xs={12}>
                    <Alert severity={calculateBalance() === 0 ? 'success' : 'warning'}>
                      <Typography variant="body2">
                        <strong>Expected Amount:</strong> ₦{calculateExpectedAmount().toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Balance Due:</strong> ₦{calculateBalance().toLocaleString()}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleProcessSettlement} variant="contained" sx={{ bgcolor: '#13bbc6' }}>
            Process Settlement
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriverDispatchManagement;
