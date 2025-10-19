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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  PointOfSale,
  LocalShipping,
  Store,
  People,
  TrendingUp,
  Add,
  Edit,
  Visibility,
  CheckCircle,
  Pending,
  Warning,
  ExpandMore,
  Assessment,
  AttachMoney,
  Inventory
} from '@mui/icons-material';
import axios from 'axios';

interface SalesManagementProps {
  selectedSection: string;
  userRole: string;
}

interface PricingRule {
  id: number;
  customer_type: string;
  min_quantity: number;
  max_quantity?: number;
  price_per_bag: number;
  is_active: boolean;
}

interface Customer {
  id: number;
  name: string;
  type: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active: boolean;
}

interface SalesOrder {
  id: number;
  order_type: string;
  customer_id?: number;
  driver_id?: number;
  driver_assistant_id?: number;
  bags_quantity: number;
  price_per_bag: number;
  total_amount: number;
  status: string;
  receptionist_id: number;
  notes?: string;
  order_date: string;
  completed_at?: string;
  customer_name?: string;
  driver_name?: string;
  assistant_name?: string;
  receptionist_name: string;
}

interface DriverSalesLog {
  id: number;
  driver_id: number;
  driver_assistant_id?: number;
  bags_dispatched: number;
  bags_sold_270: number;
  bags_sold_250: number;
  bags_returned: number;
  total_revenue: number;
  expected_revenue: number;
  delivery_date: string;
  status: string;
  receptionist_id: number;
  driver_notes?: string;
  receptionist_notes?: string;
  dispatched_at: string;
  delivered_at?: string;
  accounted_at?: string;
  driver_name: string;
  assistant_name?: string;
  receptionist_name: string;
}

interface Employee {
  id: number;
  name: string;
  role: string;
  email: string;
}

const SalesManagement: React.FC<SalesManagementProps> = ({ selectedSection, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [driverSalesLogs, setDriverSalesLogs] = useState<DriverSalesLog[]>([]);
  const [drivers, setDrivers] = useState<Employee[]>([]);
  const [salesSummary, setSalesSummary] = useState<any>(null);
  
  // Dialog states
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  
  // Form states
  const [newOrder, setNewOrder] = useState({
    order_type: 'general',
    customer_id: 0,
    driver_id: 0,
    driver_assistant_id: 0,
    bags_quantity: 0,
    price_per_bag: 0,
    total_amount: 0,
    notes: ''
  });
  
  const [newDispatch, setNewDispatch] = useState({
    driver_id: 0,
    driver_assistant_id: 0,
    bags_dispatched: 0,
    notes: ''
  });
  
  const [accountData, setAccountData] = useState({
    bags_sold_270: 0,
    bags_sold_250: 0,
    bags_returned: 0,
    total_revenue: 0,
    receptionist_notes: ''
  });
  
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    type: 'general',
    phone: '',
    email: '',
    address: ''
  });
  
  const [newPricingRule, setNewPricingRule] = useState({
    customer_type: 'general',
    min_quantity: 1,
    max_quantity: null,
    price_per_bag: 0
  });
  
  const [selectedLog, setSelectedLog] = useState<DriverSalesLog | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [selectedSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch pricing rules
      const pricingResponse = await axios.get('/api/sales/pricing-rules', { headers });
      if (pricingResponse.data.success) {
        setPricingRules(pricingResponse.data.data);
      }

      // Fetch customers
      const customersResponse = await axios.get('/api/sales/customers', { headers });
      if (customersResponse.data.success) {
        setCustomers(customersResponse.data.data);
      }

      // Fetch sales orders
      const ordersResponse = await axios.get('/api/sales/orders', { headers });
      if (ordersResponse.data.success) {
        setSalesOrders(ordersResponse.data.data);
      }

      // Fetch drivers
      const driversResponse = await axios.get('/api/sales/drivers', { headers });
      if (driversResponse.data.success) {
        setDrivers(driversResponse.data.data);
      }

      // Fetch sales summary
      const summaryResponse = await axios.get('/api/sales/summary', { headers });
      if (summaryResponse.data.success) {
        setSalesSummary(summaryResponse.data.data);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = async () => {
    if (!newOrder.customer_id || !newOrder.bags_quantity) return;

    try {
      const customer = customers.find(c => c.id === newOrder.customer_id);
      if (!customer) return;

      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.post('/api/sales/calculate-price', {
        customer_type: customer.type,
        quantity: newOrder.bags_quantity
      }, { headers });

      if (response.data.success) {
        setCalculatedPrice(response.data.data);
        setNewOrder({
          ...newOrder,
          price_per_bag: response.data.data.price_per_bag,
          total_amount: response.data.data.total_amount
        });
      }
    } catch (error) {
      console.error('Error calculating price:', error);
    }
  };

  const handleCreateOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      await axios.post('/api/sales/orders', {
        ...newOrder,
        receptionist_id: user.id
      }, { headers });
      
      setOrderDialogOpen(false);
      setNewOrder({
        order_type: 'general',
        customer_id: 0,
        driver_id: 0,
        driver_assistant_id: 0,
        bags_quantity: 0,
        price_per_bag: 0,
        total_amount: 0,
        notes: ''
      });
      setCalculatedPrice(null);
      fetchData();
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const handleCreateDispatch = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      await axios.post('/api/salary/driver-dispatch', {
        ...newDispatch,
        receptionist_id: user.id
      }, { headers });
      
      setDispatchDialogOpen(false);
      setNewDispatch({
        driver_id: 0,
        driver_assistant_id: 0,
        bags_dispatched: 0,
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating dispatch:', error);
    }
  };

  const handleAccountSales = async () => {
    if (!selectedLog) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(`/api/salary/driver-sales/${selectedLog.id}/account`, accountData, { headers });
      
      setAccountDialogOpen(false);
      setSelectedLog(null);
      setAccountData({
        bags_sold_270: 0,
        bags_sold_250: 0,
        bags_returned: 0,
        total_revenue: 0,
        receptionist_notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error accounting sales:', error);
    }
  };

  const handleCreateCustomer = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post('/api/sales/customers', newCustomer, { headers });
      
      setCustomerDialogOpen(false);
      setNewCustomer({
        name: '',
        type: 'general',
        phone: '',
        email: '',
        address: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'dispatched': return 'info';
      case 'delivered': return 'success';
      case 'accounted': return 'success';
      default: return 'default';
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'general': return <PointOfSale />;
      case 'distributor': return <Store />;
      case 'driver_dispatch': return <LocalShipping />;
      case 'mini_store': return <Store />;
      default: return <PointOfSale />;
    }
  };

  const renderSalesOrders = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Sales Orders</Typography>
          {userRole === 'Receptionist' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOrderDialogOpen(true)}
            >
              New Order
            </Button>
          )}
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Price/Bag</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salesOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getOrderTypeIcon(order.order_type)}
                      <Typography variant="body2">{order.order_type}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{order.customer_name || 'N/A'}</TableCell>
                  <TableCell>{order.bags_quantity}</TableCell>
                  <TableCell>₦{order.price_per_bag}</TableCell>
                  <TableCell>₦{order.total_amount}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton size="small">
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
  );

  const renderDriverDispatch = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Driver Dispatch</Typography>
          {userRole === 'Receptionist' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setDispatchDialogOpen(true)}
            >
              New Dispatch
            </Button>
          )}
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Driver</TableCell>
                <TableCell>Assistant</TableCell>
                <TableCell>Bags Dispatched</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {driverSalesLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.driver_name}</TableCell>
                  <TableCell>{log.assistant_name || 'N/A'}</TableCell>
                  <TableCell>{log.bags_dispatched}</TableCell>
                  <TableCell>{new Date(log.delivery_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={log.status}
                      color={getStatusColor(log.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {log.status === 'dispatched' && userRole === 'Receptionist' && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedLog(log);
                          setAccountData({
                            bags_sold_270: 0,
                            bags_sold_250: 0,
                            bags_returned: 0,
                            total_revenue: 0,
                            receptionist_notes: ''
                          });
                          setAccountDialogOpen(true);
                        }}
                      >
                        Account
                      </Button>
                    )}
                    <Tooltip title="View Details">
                      <IconButton size="small">
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
  );

  const renderSalesSummary = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Total Orders</Typography>
            <Typography variant="h4" color="primary">
              {salesSummary?.total_orders || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Total Bags</Typography>
            <Typography variant="h4" color="primary">
              {salesSummary?.total_bags || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Total Revenue</Typography>
            <Typography variant="h4" color="primary">
              ₦{salesSummary?.total_revenue || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      {salesSummary?.by_type && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Sales by Type</Typography>
              <Grid container spacing={2}>
                {Object.entries(salesSummary.by_type).map(([type, data]: [string, any]) => (
                  <Grid item xs={12} md={3} key={type}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>{type}</Typography>
                        <Typography variant="h6">{data.count} orders</Typography>
                        <Typography variant="body2">{data.bags} bags</Typography>
                        <Typography variant="body2">₦{data.revenue}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      );
    }

    switch (selectedTab) {
      case 0:
        return renderSalesOrders();
      case 1:
        return renderDriverDispatch();
      case 2:
        return renderSalesSummary();
      default:
        return renderSalesOrders();
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600, mb: 3 }}>
        Sales Management
      </Typography>

      <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Sales Orders" icon={<PointOfSale />} />
        <Tab label="Driver Dispatch" icon={<LocalShipping />} />
        <Tab label="Sales Summary" icon={<Assessment />} />
      </Tabs>

      {renderContent()}

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onClose={() => setOrderDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Sales Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Order Type</InputLabel>
                <Select
                  value={newOrder.order_type}
                  onChange={(e) => setNewOrder({ ...newOrder, order_type: e.target.value })}
                >
                  <MenuItem value="general">General Sales</MenuItem>
                  <MenuItem value="distributor">Distributor</MenuItem>
                  <MenuItem value="mini_store">Mini Store</MenuItem>
                  <MenuItem value="driver_dispatch">Driver Dispatch</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Customer</InputLabel>
                <Select
                  value={newOrder.customer_id}
                  onChange={(e) => setNewOrder({ ...newOrder, customer_id: Number(e.target.value) })}
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>{customer.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Bags Quantity"
                type="number"
                value={newOrder.bags_quantity}
                onChange={(e) => {
                  const quantity = Number(e.target.value);
                  setNewOrder({ ...newOrder, bags_quantity: quantity });
                  if (quantity > 0 && newOrder.customer_id > 0) {
                    setTimeout(calculatePrice, 500);
                  }
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Price per Bag"
                type="number"
                value={newOrder.price_per_bag}
                disabled
                sx={{ mb: 2 }}
              />
            </Grid>
            {calculatedPrice && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="subtitle2">Price Calculation:</Typography>
                  <Typography variant="body2">
                    {newOrder.bags_quantity} bags × ₦{calculatedPrice.price_per_bag} = ₦{calculatedPrice.total_amount}
                  </Typography>
                </Alert>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={newOrder.notes}
                onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateOrder} variant="contained">Create Order</Button>
        </DialogActions>
      </Dialog>

      {/* Dispatch Dialog */}
      <Dialog open={dispatchDialogOpen} onClose={() => setDispatchDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Driver Dispatch</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Driver</InputLabel>
                <Select
                  value={newDispatch.driver_id}
                  onChange={(e) => setNewDispatch({ ...newDispatch, driver_id: Number(e.target.value) })}
                >
                  {drivers.filter(d => d.role === 'Driver').map((driver) => (
                    <MenuItem key={driver.id} value={driver.id}>{driver.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Driver Assistant</InputLabel>
                <Select
                  value={newDispatch.driver_assistant_id}
                  onChange={(e) => setNewDispatch({ ...newDispatch, driver_assistant_id: Number(e.target.value) })}
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
                label="Bags to Dispatch"
                type="number"
                value={newDispatch.bags_dispatched}
                onChange={(e) => setNewDispatch({ ...newDispatch, bags_dispatched: Number(e.target.value) })}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={newDispatch.notes}
                onChange={(e) => setNewDispatch({ ...newDispatch, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDispatchDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateDispatch} variant="contained">Create Dispatch</Button>
        </DialogActions>
      </Dialog>

      {/* Account Dialog */}
      <Dialog open={accountDialogOpen} onClose={() => setAccountDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Account Driver Sales</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Driver: {selectedLog.driver_name}</Typography>
                <Typography variant="subtitle2">Assistant: {selectedLog.assistant_name || 'None'}</Typography>
                <Typography variant="subtitle2">Bags Dispatched: {selectedLog.bags_dispatched}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Date: {new Date(selectedLog.delivery_date).toLocaleDateString()}</Typography>
                <Typography variant="subtitle2">Expected Revenue: ₦{selectedLog.expected_revenue}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Bags Sold @ ₦270"
                  type="number"
                  value={accountData.bags_sold_270}
                  onChange={(e) => setAccountData({ ...accountData, bags_sold_270: Number(e.target.value) })}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Bags Sold @ ₦250"
                  type="number"
                  value={accountData.bags_sold_250}
                  onChange={(e) => setAccountData({ ...accountData, bags_sold_250: Number(e.target.value) })}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Bags Returned"
                  type="number"
                  value={accountData.bags_returned}
                  onChange={(e) => setAccountData({ ...accountData, bags_returned: Number(e.target.value) })}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Total Revenue"
                  type="number"
                  value={accountData.total_revenue}
                  onChange={(e) => setAccountData({ ...accountData, total_revenue: Number(e.target.value) })}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Receptionist Notes"
                  multiline
                  rows={3}
                  value={accountData.receptionist_notes}
                  onChange={(e) => setAccountData({ ...accountData, receptionist_notes: e.target.value })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccountDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAccountSales} variant="contained">Submit Account</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesManagement;
