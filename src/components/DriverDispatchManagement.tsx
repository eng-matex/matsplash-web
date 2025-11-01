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
  assigned_driver_id?: number;
  amount_collected?: number;
  expected_amount?: number;
  settled_at?: string;
  bags_sold?: number;
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
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedAssistant, setSelectedAssistant] = useState<string>('');
  const [bagsDispatched, setBagsDispatched] = useState<number>(0);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'create' | 'view' | 'customer' | 'settle' | 'return' | 'record-call'>('create');
  const [settlementData, setSettlementData] = useState({ bags_sold: 0, bags_at_250: 0, amount_paid: 0, customer_orders: [] as CustomerOrder[] });
  const [selectedDispatch, setSelectedDispatch] = useState<DriverDispatch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerCalls, setCustomerCalls] = useState<any[]>([]);
  const [newCall, setNewCall] = useState({ customer_name: '', customer_phone: '', customer_address: '', bags: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [dispatchesRes, customersRes, employeesRes] = await Promise.all([
        axios.get('/api/driver-dispatch', { headers }),
        axios.get('/api/driver-dispatch/customers', { headers }),
        axios.get('/api/employees', { headers })
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

  const handleOpenDialog = async (type: 'create' | 'view' | 'customer' | 'settle' | 'return' | 'record-call', dispatch?: DriverDispatch) => {
    setDialogType(type);
    setSelectedDispatch(dispatch || null);
    if (type === 'create') {
      setSelectedDriver('');
      setSelectedAssistant('');
      setBagsDispatched(0);
    } else if (type === 'settle' && dispatch) {
      setSettlementData({ 
        bags_sold: dispatch.bags_sold || 0, 
        bags_at_250: 0, 
        amount_paid: 0, 
        customer_orders: [] 
      });
      // Fetch stored customer calls for this dispatch
      await fetchCustomerCalls(dispatch.id);
    } else if (type === 'record-call' && dispatch) {
      setNewCall({ customer_name: '', customer_phone: '', customer_address: '', bags: 0 });
      await fetchCustomerCalls(dispatch.id);
    }
    setDialogOpen(true);
  };

  const fetchCustomerCalls = async (dispatchId: number) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`/api/driver-dispatch/${dispatchId}/customer-calls`, { headers });
      setCustomerCalls(response.data.data || []);
    } catch (error) {
      console.error('Error fetching customer calls:', error);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('create');
    setSelectedDispatch(null);
    setNewCustomer({ name: '', phone: '', address: '' });
    setSettlementData({ bags_sold: 0, bags_at_250: 0, amount_paid: 0, customer_orders: [] });
    setNewCall({ customer_name: '', customer_phone: '', customer_address: '', bags: 0 });
    setCustomerCalls([]);
  };


  const handleSaveCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      alert('Name and phone are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post('/api/driver-dispatch/customers', newCustomer, { headers });
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

      const response = await axios.post('/api/driver-dispatch/create', {
        driver_id: parseInt(selectedDriver),
        assistant_id: selectedAssistant ? parseInt(selectedAssistant) : null,
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

  const handleRecordCall = async () => {
    if (!selectedDispatch) return;

    if (!newCall.customer_name || !newCall.customer_phone || !newCall.bags || newCall.bags < 50) {
      alert('Customer name, phone, and bags (50+) are required');
      return;
    }

    if (!selectedDispatch.assigned_driver_id) {
      alert('Driver ID not found. Please refresh and try again.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.post(`/api/driver-dispatch/${selectedDispatch.id}/customer-calls`, {
        customer_name: newCall.customer_name,
        customer_phone: newCall.customer_phone,
        customer_address: newCall.customer_address,
        bags: newCall.bags,
        driver_id: selectedDispatch.assigned_driver_id
      }, { headers });

      if (response.data.success) {
        alert('Customer call recorded successfully!');
        setNewCall({ customer_name: '', customer_phone: '', customer_address: '', bags: 0 });
        await fetchCustomerCalls(selectedDispatch.id);
      } else {
        alert(response.data.message || 'Error recording call');
      }
    } catch (error: any) {
      console.error('Error recording call:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Error recording customer call');
      }
    }
  };

  const handleProcessSettlement = async () => {
    if (!selectedDispatch) return;

    const { bags_sold, amount_paid } = settlementData;

    if (!bags_sold || bags_sold <= 0) {
      alert('Please enter number of bags sold');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.post(`/api/driver-dispatch/${selectedDispatch.id}/settle`, {
        bags_sold,
        bags_returned: 0,
        amount_paid,
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
    // Calculate from stored customer calls
    const bagsAt250 = customerCalls.filter(c => !c.processed).reduce((sum, c) => sum + (c.bags || 0), 0);
    const bagsAt270 = settlementData.bags_sold - bagsAt250;
    return (bagsAt250 * 250) + (bagsAt270 * 270);
  };

  const calculateBalance = () => {
    const expected = calculateExpectedAmount();
    return expected - settlementData.amount_paid;
  };


  // Helper function to get bags count from items JSON
  const getBagsCount = (dispatch: DriverDispatch): number => {
    try {
      if (typeof dispatch.items === 'string') {
        const items = JSON.parse(dispatch.items);
        return items[0]?.quantity || 0;
      }
      return dispatch.items?.[0]?.quantity || 0;
    } catch (error) {
      return 0;
    }
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
                  <TableCell>Bags</TableCell>
                    <TableCell>Total Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Settlement</TableCell>
                  <TableCell>Amount Settled</TableCell>
                  <TableCell>Balance Due</TableCell>
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
                    <TableCell>{getBagsCount(dispatch)}</TableCell>
                    <TableCell>₦{(dispatch.expected_amount || dispatch.total_amount)?.toLocaleString() || 0}</TableCell>
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
                    <TableCell>
                      {dispatch.amount_collected ? (
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ₦{dispatch.amount_collected?.toLocaleString() || 0}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {dispatch.balance_due ? (
                        <Chip 
                          label={`₦${dispatch.balance_due?.toLocaleString() || 0}`} 
                          color={dispatch.balance_due === 0 ? 'success' : 'error'}
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
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
                        <>
                          <Tooltip title="Record Customer Call">
                            <IconButton size="small" onClick={() => handleOpenDialog('record-call', dispatch)}>
                              <PersonAdd />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Process Settlement">
                            <IconButton size="small" onClick={() => handleOpenDialog('settle', dispatch)}>
                              <AttachMoney />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {userRole === 'receptionist' && 
                       (dispatch.status === 'settlement_pending' || dispatch.status === 'settled') && 
                       dispatch.balance_due > 0 && (
                        <Tooltip title="Complete Payment">
                          <IconButton size="small" onClick={() => handleOpenDialog('settle', dispatch)} color="success">
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
                  onChange={(e) => setSelectedDriver(e.target.value)}
                >
                  {drivers.filter(d => d.role === 'Driver').map((driver) => (
                    <MenuItem key={driver.id} value={String(driver.id)}>{driver.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Driver Assistant (Optional)</InputLabel>
                <Select
                  value={selectedAssistant}
                  onChange={(e) => setSelectedAssistant(e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  {drivers.filter(d => d.role === 'Driver Assistant').map((assistant) => (
                    <MenuItem key={assistant.id} value={String(assistant.id)}>{assistant.name}</MenuItem>
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
              <Typography variant="body1"><strong>Bags:</strong> {getBagsCount(selectedDispatch)}</Typography>
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
                {selectedDispatch.status === 'settled' && selectedDispatch.balance_due > 0 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Current Outstanding Balance:</strong> ₦{selectedDispatch.balance_due?.toLocaleString() || 0}
                  </Typography>
                )}
              </Alert>

              {selectedDispatch.settlement_status && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Settlement Status:</strong> {selectedDispatch.settlement_status.replace('_', ' ').toUpperCase()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Amount Collected:</strong> ₦{selectedDispatch.amount_collected?.toLocaleString() || 0}
                  </Typography>
                  {selectedDispatch.settled_at && (
                    <Typography variant="body2">
                      <strong>Last Settled:</strong> {new Date(selectedDispatch.settled_at).toLocaleString()}
                    </Typography>
                  )}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Total Bags Sold"
                    type="number"
                    value={settlementData.bags_sold}
                    onChange={(e) => setSettlementData({ ...settlementData, bags_sold: parseInt(e.target.value) || 0 })}
                    disabled={!!selectedDispatch?.settlement_status}
                    helperText={selectedDispatch?.settlement_status ? 'Bags sold cannot be changed for existing settlements' : ''}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Customers with 50+ Bags (Recorded Calls)</Typography>
                  {customerCalls.length === 0 ? (
                    <Alert severity="info">
                      No customer calls recorded for this dispatch. Customer calls should be recorded when driver calls about 50+ bag customers.
                    </Alert>
                  ) : (
                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {customerCalls.map((call) => (
                        <Card key={call.id} sx={{ mb: 2, p: 2, bgcolor: call.processed ? '#f5f5f5' : 'white' }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle2" color="text.secondary">Customer Name</Typography>
                              <Typography variant="body1">{call.customer_name}</Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                              <Typography variant="body1">{call.customer_phone}</Typography>
                            </Grid>
                            <Grid item xs={12} md={2}>
                              <Typography variant="subtitle2" color="text.secondary">Bags</Typography>
                              <Typography variant="body1">{call.bags}</Typography>
                            </Grid>
                            <Grid item xs={12} md={2}>
                              <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                              <Typography variant="body1">₦{(call.bags * 250).toLocaleString()}</Typography>
                            </Grid>
                            {call.customer_address && (
                              <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                                <Typography variant="body2">{call.customer_address}</Typography>
                              </Grid>
                            )}
                            <Grid item xs={12}>
                              <Typography variant="caption" color="text.secondary">
                                Called: {new Date(call.called_at).toLocaleString()} | 
                                Originator: {call.originator_driver_name || 'N/A'}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Card>
                      ))}
                    </Box>
                  )}
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Total bags at ₦250: {customerCalls.filter(c => !c.processed).reduce((sum, c) => sum + (c.bags || 0), 0)}
                  </Alert>
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
            {selectedDispatch?.settlement_status ? 'Add Payment' : 'Process Settlement'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Customer Call Dialog */}
      <Dialog open={dialogOpen && dialogType === 'record-call'} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Record Customer Call (50+ Bags)</DialogTitle>
        <DialogContent>
          {selectedDispatch && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2"><strong>Driver:</strong> {selectedDispatch.driver_name}</Typography>
                <Typography variant="body2"><strong>Order:</strong> {selectedDispatch.order_number}</Typography>
              </Alert>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    value={newCall.customer_name}
                    onChange={(e) => setNewCall({ ...newCall, customer_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Customer Phone"
                    value={newCall.customer_phone}
                    onChange={(e) => {
                      const phone = e.target.value;
                      setNewCall({ ...newCall, customer_phone: phone });
                      // Auto-fill from existing customers
                      const existing = customers.find(c => c.phone === phone);
                      if (existing) {
                        setNewCall({ 
                          ...newCall, 
                          customer_phone: phone,
                          customer_name: existing.name,
                          customer_address: existing.address || ''
                        });
                      }
                    }}
                    helperText="Enter phone to auto-fill existing customer"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Customer Address"
                    multiline
                    rows={2}
                    value={newCall.customer_address}
                    onChange={(e) => setNewCall({ ...newCall, customer_address: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Number of Bags"
                    type="number"
                    value={newCall.bags}
                    onChange={(e) => setNewCall({ ...newCall, bags: parseInt(e.target.value) || 0 })}
                    helperText="Must be 50 or more bags"
                  />
                </Grid>
                {newCall.bags >= 50 && (
                  <Grid item xs={12}>
                    <Alert severity="success">
                      Price: ₦250 per bag (Total: ₦{(newCall.bags * 250).toLocaleString()})
                    </Alert>
                  </Grid>
                )}
              </Grid>

              {customerCalls.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>Previously Recorded Calls:</Typography>
                  {customerCalls.map((call) => (
                    <Chip
                      key={call.id}
                      label={`${call.customer_name} - ${call.bags} bags`}
                      sx={{ mr: 1, mb: 1 }}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleRecordCall} variant="contained" sx={{ bgcolor: '#13bbc6' }}>
            Record Call
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriverDispatchManagement;
