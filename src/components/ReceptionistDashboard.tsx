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
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  PointOfSale,
  Business,
  LocalShipping,
  Assessment,
  AccessTime,
  Add,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Cancel,
  Pending,
  ShoppingCart,
  Store,
  DeliveryDining,
  Payment
} from '@mui/icons-material';
import axios from 'axios';
import OrderManagement from './OrderManagement';
import SalesManagement from './SalesManagement';
import InventoryManagement from './InventoryManagement';

interface ReceptionistDashboardProps {
  selectedSection: string;
  onPageChange?: (page: string) => void;
}

const ReceptionistDashboard: React.FC<ReceptionistDashboardProps> = ({ selectedSection, onPageChange }) => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [generalSales, setGeneralSales] = useState<any[]>([]);
  const [distributorOrders, setDistributorOrders] = useState<any[]>([]);
  const [driverDispatches, setDriverDispatches] = useState<any[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    order_type: 'general_sales',
    status: 'pending',
    total_amount: 0,
    items: [],
    payment_method: 'cash',
    payment_status: 'pending',
    notes: '',
    delivery_address: '',
    assigned_driver_id: null
  });
  const [drivers, setDrivers] = useState([]);
  const [driverSales, setDriverSales] = useState([]);
  const [settlementData, setSettlementData] = useState({
    driver_id: '',
    order_id: '',
    bags_sold: 0,
    bags_returned: 0,
    total_sales: 0,
    money_submitted: 0,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      switch (selectedSection) {
        case 'overview':
          const ordersResponse = await axios.get('http://localhost:3002/api/orders', { headers });
          setOrders(ordersResponse.data.data || []);
          break;
        case 'general-sales':
          // Filter orders for general sales
          const generalSalesResponse = await axios.get('http://localhost:3002/api/orders?type=general_sales', { headers });
          setGeneralSales(generalSalesResponse.data.data || []);
          break;
        case 'distributor-orders':
          // Filter orders for distributor orders
          const distributorResponse = await axios.get('http://localhost:3002/api/orders?type=distributor_order', { headers });
          setDistributorOrders(distributorResponse.data.data || []);
          break;
        case 'driver-dispatches':
          // Filter orders for driver dispatches
          const dispatchResponse = await axios.get('http://localhost:3002/api/orders?type=driver_dispatch', { headers });
          setDriverDispatches(dispatchResponse.data.data || []);
          break;
        case 'order-status-logs':
          const allOrdersResponse = await axios.get('http://localhost:3002/api/orders', { headers });
          setOrders(allOrdersResponse.data.data || []);
          break;
        case 'driver-settlement':
          // Fetch driver sales data
          try {
            const driverSalesResponse = await axios.get('http://localhost:3002/api/sales/driver-sales', { headers });
            if (driverSalesResponse.data.success) {
              setDriverSales(driverSalesResponse.data.data || []);
            } else {
              setDriverSales(getMockDriverSales());
            }
          } catch (error) {
            console.log('Driver sales API not available, using mock data');
            setDriverSales(getMockDriverSales());
          }
          
          // Also fetch driver dispatches for the order dropdown
          try {
            const dispatchResponse = await axios.get('http://localhost:3002/api/orders?type=driver_dispatch', { headers });
            setDriverDispatches(dispatchResponse.data.data || []);
          } catch (error) {
            console.log('Driver dispatches API not available, using empty array');
            setDriverDispatches([]);
          }
          break;
        case 'my-attendance':
          // Fetch attendance data for the current user
          try {
            const attendanceResponse = await axios.get(`http://localhost:3002/api/attendance/status/${user?.id}`, { headers });
            if (attendanceResponse.data.success) {
              setAttendanceStatus(attendanceResponse.data.data);
            }
          } catch (error) {
            console.log('Attendance API not available');
            setAttendanceStatus(null);
          }
          break;
      }

      // Fetch drivers for all sections
      try {
        const driversResponse = await axios.get('http://localhost:3002/api/sales/drivers', { headers });
        if (driversResponse.data.success) {
          setDrivers(driversResponse.data.data);
        }
      } catch (error) {
        console.log('Drivers API not available');
        setDrivers([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleOpenDialog = (type: string, item?: any) => {
    setDialogType(type);
    setSelectedItem(item || null);
    setSelectedOrder(item || null);
    
    // Populate form data for editing
    if (type.includes('edit') && item) {
      setNewOrder({
        customer_name: item.customer_name || '',
        customer_phone: item.customer_phone || '',
        order_type: item.order_type || 'general_sales',
        status: item.status || 'pending',
        notes: item.notes || '',
        assigned_driver_id: item.assigned_driver_id || null,
        items: item.items || []
      });
    } else if (type.includes('update-status') && item) {
      setNewOrder({
        customer_name: item.customer_name || '',
        customer_phone: item.customer_phone || '',
        order_type: item.order_type || 'general_sales',
        status: item.status || 'pending',
        notes: '',
        assigned_driver_id: item.assigned_driver_id || null,
        items: item.items || []
      });
    }
    
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setSelectedItem(null);
    setActiveStep(0);
    // Reset new order form
    setNewOrder({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      order_type: 'general_sales',
      status: 'pending',
      total_amount: 0,
      items: [],
      payment_method: 'cash',
      payment_status: 'pending',
      notes: '',
      delivery_address: '',
      assigned_driver_id: null
    });
    // Reset settlement form
    setSettlementData({
      driver_id: '',
      order_id: '',
      bags_sold: 0,
      bags_returned: 0,
      total_sales: 0,
      money_submitted: 0,
      notes: ''
    });
  };

  const getMockDriverSales = () => [
    {
      id: 1,
      order_number: 'ORD-000001',
      driver_name: 'John Driver',
      bags_sold: 45,
      bags_returned: 5,
      total_sales: 12150,
      commission_earned: 1350,
      money_submitted: 0,
      approval_status: 'Pending Settlement',
      created_at: new Date().toISOString()
    }
  ];

  const handleSubmitSettlement = async () => {
    if (!settlementData.driver_id || !settlementData.order_id) {
      alert('Please select driver and order');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const settlementPayload = {
        driver_id: parseInt(settlementData.driver_id),
        order_id: parseInt(settlementData.order_id),
        bags_sold: settlementData.bags_sold,
        bags_returned: settlementData.bags_returned,
        total_sales: settlementData.total_sales,
        money_submitted: settlementData.money_submitted,
        notes: settlementData.notes,
        receptionist_id: 1 // This should come from auth context
      };

      const response = await axios.post('http://localhost:3002/api/sales/driver-settlement', settlementPayload, { headers });

      if (response.data.success) {
        fetchData(); // Refresh data
        handleCloseDialog();
        alert('Settlement submitted successfully!');
      } else {
        alert('Error submitting settlement: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error submitting settlement:', error);
      alert('Error submitting settlement. Please try again.');
    }
  };

  const getOrderType = () => {
    if (dialogType === 'create-store-dispatch') return 'store_dispatch';
    if (dialogType === 'create-driver-dispatch') return 'driver_dispatch';
    if (dialogType === 'create-distributor-order') return 'distributor_order';
    return 'general_sales';
  };

  const handleCreateOrder = async () => {
    if (!newOrder.customer_name || !newOrder.customer_phone) {
      alert('Please fill in customer name and phone number');
      return;
    }

    const orderType = getOrderType();

    if ((orderType === 'store_dispatch' || orderType === 'driver_dispatch') && !newOrder.assigned_driver_id) {
      alert('Please assign a driver for this order type');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const orderData = {
        customer_name: newOrder.customer_name,
        customer_phone: newOrder.customer_phone,
        customer_email: newOrder.customer_email,
        order_type: orderType,
        items: [{ product_name: 'Sachet Water', quantity: 1, unit_price: 0 }], // Default item
        notes: newOrder.notes,
        delivery_address: newOrder.delivery_address,
        payment_method: orderType === 'general_sales' ? 'cash' : null,
        payment_status: orderType === 'general_sales' ? 'pending' : null,
        total_amount: 0, // Required field - will be calculated later for sales orders
        created_by: 1, // This should come from auth context
        assigned_driver_id: newOrder.assigned_driver_id ? parseInt(newOrder.assigned_driver_id) : null
      };

      const response = await axios.post('http://localhost:3002/api/orders', orderData, { headers });

      if (response.data.success) {
        // Refresh data
        fetchData();
        handleCloseDialog();
        alert(`${orderType === 'store_dispatch' ? 'Store Dispatch' : orderType === 'driver_dispatch' ? 'Driver Dispatch' : 'Order'} created successfully!`);
      } else {
        alert('Error creating order: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'delivered': return 'success';
      default: return 'default';
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'general_sales': return <ShoppingCart />;
      case 'distributor_order': return <Store />;
      case 'driver_dispatch': return <DeliveryDining />;
      default: return <PointOfSale />;
    }
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_name: newOrder.customer_name,
          customer_phone: newOrder.customer_phone,
          order_type: newOrder.order_type,
          status: newOrder.status,
          notes: newOrder.notes
        })
      });

      if (response.ok) {
        alert('Order updated successfully!');
        fetchData();
        handleCloseDialog();
      } else {
        const error = await response.json();
        alert(`Failed to update order: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order. Please try again.');
    }
  };

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newOrder.status,
          notes: newOrder.notes
        })
      });

      if (response.ok) {
        alert('Order status updated successfully!');
        fetchData();
        handleCloseDialog();
      } else {
        const error = await response.json();
        alert(`Failed to update order status: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const renderOverview = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Order Management Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShoppingCart sx={{ mr: 1, color: '#13bbc6' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>General Sales</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#13bbc6', fontWeight: 700 }}>
                {generalSales.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Store sx={{ mr: 1, color: '#FFD700' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Distributor Orders</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#FFD700', fontWeight: 700 }}>
                {distributorOrders.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DeliveryDining sx={{ mr: 1, color: '#4caf50' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Driver Dispatches</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                {driverDispatches.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total dispatches
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ mr: 1, color: '#ff9800' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Total Orders</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 700 }}>
                {orders.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All types
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                Recent Orders
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.slice(0, 5).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.order_number}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getOrderTypeIcon(order.type)}
                            <Typography sx={{ ml: 1 }}>
                              {order.type?.replace('_', ' ').toUpperCase()}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={order.status} 
                            color={getStatusColor(order.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>₦{order.total_amount?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<ShoppingCart />}
                  onClick={() => onPageChange?.('general-sales')}
                  sx={{ bgcolor: '#13bbc6' }}
                  className="dashboard-button"
                >
                  Create General Sales Order
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Store />}
                  onClick={() => onPageChange?.('distributor-orders')}
                  sx={{ bgcolor: '#FFD700', color: '#000' }}
                  className="dashboard-button"
                >
                  Create Distributor Order
                </Button>
                <Button
                  variant="contained"
                  startIcon={<DeliveryDining />}
                  onClick={() => onPageChange?.('driver-dispatches')}
                  sx={{ bgcolor: '#4caf50' }}
                  className="dashboard-button"
                >
                  Create Driver Dispatch
                </Button>
                <Button
                  variant="contained"
                  startIcon={<LocalShipping />}
                  onClick={() => onPageChange?.('store-dispatch')}
                  sx={{ bgcolor: '#9c27b0' }}
                  className="dashboard-button"
                >
                  Create Store Dispatch
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderGeneralSales = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          General Sales Orders
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('create-general-sales')}
          sx={{ bgcolor: '#13bbc6' }}
          className="dashboard-button"
        >
          New General Sales
        </Button>
      </Box>

      <Card className="dashboard-card">
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {generalSales.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.order_number}</TableCell>
                    <TableCell>{order.customer_name || 'Walk-in Customer'}</TableCell>
                    <TableCell>{order.items?.length || 0} items</TableCell>
                    <TableCell>₦{order.total_amount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={order.status} 
                        color={getStatusColor(order.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleOpenDialog('view-order', order)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Order">
                        <IconButton size="small" onClick={() => handleOpenDialog('edit-order', order)}>
                          <Edit />
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
    </Box>
  );

  const renderDistributorOrders = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Distributor Orders
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('create-distributor-order')}
          sx={{ bgcolor: '#FFD700', color: '#000' }}
          className="dashboard-button"
        >
          New Distributor Order
        </Button>
      </Box>

      <Card className="dashboard-card">
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Distributor</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {distributorOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.order_number}</TableCell>
                    <TableCell>{order.distributor_name || 'Unknown Distributor'}</TableCell>
                    <TableCell>{order.items?.length || 0} items</TableCell>
                    <TableCell>₦{order.total_amount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={order.status} 
                        color={getStatusColor(order.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleOpenDialog('view-order', order)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Order">
                        <IconButton size="small" onClick={() => handleOpenDialog('edit-order', order)}>
                          <Edit />
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
    </Box>
  );

  const renderDriverDispatches = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Driver Dispatches
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('create-driver-dispatch')}
          sx={{ bgcolor: '#4caf50' }}
          className="dashboard-button"
        >
          New Driver Dispatch
        </Button>
      </Box>

      <Card className="dashboard-card">
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Dispatch ID</TableCell>
                  <TableCell>Driver</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {driverDispatches.map((dispatch) => (
                  <TableRow key={dispatch.id}>
                    <TableCell>{dispatch.order_number}</TableCell>
                    <TableCell>{dispatch.driver_name || 'Unassigned'}</TableCell>
                    <TableCell>{dispatch.items?.length || 0} items</TableCell>
                    <TableCell>₦{dispatch.total_amount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={dispatch.status} 
                        color={getStatusColor(dispatch.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(dispatch.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleOpenDialog('view-dispatch', dispatch)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Dispatch">
                        <IconButton size="small" onClick={() => handleOpenDialog('edit-dispatch', dispatch)}>
                          <Edit />
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
    </Box>
  );

  const renderOrderStatusLogs = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Order Status Logs
      </Typography>

      <Card className="dashboard-card">
        <CardContent>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="All Orders" />
            <Tab label="Pending" />
            <Tab label="Processing" />
            <Tab label="Completed" />
          </Tabs>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Customer/Distributor</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders
                  .filter(order => {
                    if (selectedTab === 0) return true;
                    if (selectedTab === 1) return order.status === 'pending';
                    if (selectedTab === 2) return order.status === 'processing';
                    if (selectedTab === 3) return order.status === 'completed';
                    return true;
                  })
                  .map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.order_number}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getOrderTypeIcon(order.type)}
                          <Typography sx={{ ml: 1 }}>
                            {order.type?.replace('_', ' ').toUpperCase()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {order.customer_name || order.distributor_name || 'Unknown'}
                      </TableCell>
                      <TableCell>₦{order.total_amount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={order.status} 
                          color={getStatusColor(order.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(order.updated_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleOpenDialog('view-order', order)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Update Status">
                          <IconButton size="small" onClick={() => handleOpenDialog('update-status', order)}>
                            <Edit />
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
    </Box>
  );

  const renderOrderCreationForm = () => {
    const orderType = getOrderType();

    return (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Customer Name"
              variant="outlined"
              required
              value={newOrder.customer_name || ''}
              onChange={(e) => setNewOrder({...newOrder, customer_name: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Customer Phone"
              variant="outlined"
              required
              value={newOrder.customer_phone || ''}
              onChange={(e) => setNewOrder({...newOrder, customer_phone: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Customer Email"
              variant="outlined"
              value={newOrder.customer_email || ''}
              onChange={(e) => setNewOrder({...newOrder, customer_email: e.target.value})}
            />
          </Grid>
          {(orderType === 'store_dispatch' || orderType === 'driver_dispatch') && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Assign Driver</InputLabel>
                <Select
                  value={newOrder.assigned_driver_id || ''}
                  onChange={(e) => setNewOrder({...newOrder, assigned_driver_id: e.target.value})}
                  label="Assign Driver"
                >
                  {drivers.map((driver) => (
                    <MenuItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              variant="outlined"
              multiline
              rows={3}
              value={newOrder.notes || ''}
              onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
              placeholder={orderType === 'store_dispatch' ? 'Mini store stocking details...' : 
                         orderType === 'driver_dispatch' ? 'Driver dispatch instructions...' : 
                         'Order notes...'}
            />
          </Grid>
          {orderType === 'store_dispatch' && (
            <Grid item xs={12}>
              <Alert severity="info">
                Store Dispatch: No pricing - for mini store stocking only
              </Alert>
            </Grid>
          )}
          {orderType === 'driver_dispatch' && (
            <Grid item xs={12}>
              <Alert severity="info">
                Driver Dispatch: Commission-based sales - driver will account for sales
              </Alert>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

  const renderDriverSettlement = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Driver Settlement Management
      </Typography>

      <Grid container spacing={3}>
        {/* Settlement Summary */}
        <Grid item xs={12} md={4}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#13bbc6', fontWeight: 600 }}>
                Pending Settlements
              </Typography>
              <Typography variant="h3" sx={{ color: '#2c3e50', fontWeight: 700 }}>
                {driverSales.filter(sale => sale.approval_status === 'Pending Settlement').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Awaiting settlement processing
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Sales Processed */}
        <Grid item xs={12} md={4}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#4caf50', fontWeight: 600 }}>
                Total Sales Processed
              </Typography>
              <Typography variant="h3" sx={{ color: '#2c3e50', fontWeight: 700 }}>
                ₦{driverSales.reduce((sum, sale) => sum + (sale.total_sales || 0), 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total sales value processed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#ff9800', fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Payment />}
                  onClick={() => handleOpenDialog('settlement', null)}
                  sx={{ bgcolor: '#13bbc6' }}
                >
                  Process Settlement
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Driver Sales Table */}
      <Card className="dashboard-card" sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
            Driver Sales & Settlements
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Driver</TableCell>
                  <TableCell>Bags Sold</TableCell>
                  <TableCell>Bags Returned</TableCell>
                  <TableCell>Total Sales</TableCell>
                  <TableCell>Money Submitted</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {driverSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.order_number}</TableCell>
                    <TableCell>{sale.driver_name}</TableCell>
                    <TableCell>{sale.bags_sold}</TableCell>
                    <TableCell>{sale.bags_returned}</TableCell>
                    <TableCell>₦{sale.total_sales?.toLocaleString()}</TableCell>
                    <TableCell>₦{sale.money_submitted?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={sale.approval_status || 'Pending Settlement'} 
                        color={sale.approval_status === 'Settled' ? 'success' : 
                               sale.approval_status === 'Pending Manager Approval' ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Process Settlement">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('settlement', sale)}
                          disabled={sale.approval_status === 'Settled'}
                        >
                          <Payment />
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
    </Box>
  );

  const renderSettlementForm = () => (
    <Box sx={{ p: 2 }}>
      <Alert severity="info" sx={{ mb: 3 }}>
        Process driver settlement by recording sales data and money submitted. Manager will review and approve commission separately.
      </Alert>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Select Driver</InputLabel>
            <Select
              value={settlementData.driver_id}
              onChange={(e) => setSettlementData({...settlementData, driver_id: e.target.value})}
              label="Select Driver"
            >
              {drivers.map((driver) => (
                <MenuItem key={driver.id} value={driver.id}>
                  {driver.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Select Order</InputLabel>
            <Select
              value={settlementData.order_id}
              onChange={(e) => setSettlementData({...settlementData, order_id: e.target.value})}
              label="Select Order"
            >
              {driverDispatches.map((order) => (
                <MenuItem key={order.id} value={order.id}>
                  {order.order_number} - {order.customer_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Bags Sold"
            type="number"
            value={settlementData.bags_sold}
            onChange={(e) => setSettlementData({...settlementData, bags_sold: parseInt(e.target.value) || 0})}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Bags Returned"
            type="number"
            value={settlementData.bags_returned}
            onChange={(e) => setSettlementData({...settlementData, bags_returned: parseInt(e.target.value) || 0})}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Total Sales (₦)"
            type="number"
            value={settlementData.total_sales}
            onChange={(e) => setSettlementData({...settlementData, total_sales: parseInt(e.target.value) || 0})}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Money Submitted (₦)"
            type="number"
            value={settlementData.money_submitted}
            onChange={(e) => setSettlementData({...settlementData, money_submitted: parseInt(e.target.value) || 0})}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            value={settlementData.notes}
            onChange={(e) => setSettlementData({...settlementData, notes: e.target.value})}
            placeholder="Any additional notes about the settlement..."
          />
        </Grid>
      </Grid>

      {/* Settlement Summary */}
      <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>Settlement Summary:</Typography>
        <Typography variant="body2">
          Bags Sold: {settlementData.bags_sold} bags
        </Typography>
        <Typography variant="body2">
          Bags Returned: {settlementData.bags_returned} bags
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#13bbc6' }}>
          Net Sales: {settlementData.bags_sold - settlementData.bags_returned} bags
        </Typography>
      </Box>
    </Box>
  );

  const renderMyAttendance = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', mb: 3 }}>
        My Attendance
      </Typography>
      
      {attendanceStatus ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card className="dashboard-card">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                  Current Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip 
                    label={attendanceStatus.status || 'Not Clocked In'} 
                    color={attendanceStatus.status === 'present' ? 'success' : 'default'}
                    sx={{ mr: 2 }}
                  />
                </Box>
                {attendanceStatus.clock_in_time && (
                  <Typography variant="body2" color="text.secondary">
                    Clocked in: {new Date(attendanceStatus.clock_in_time).toLocaleString()}
                  </Typography>
                )}
                {attendanceStatus.on_break && (
                  <Typography variant="body2" color="warning.main">
                    Currently on break
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card className="dashboard-card">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                  Today's Summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hours worked: {attendanceStatus.hours_worked || '0'} hours
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Break time: {attendanceStatus.total_break_time || '0'} minutes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Card className="dashboard-card">
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
              No attendance data available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your attendance information will appear here once you clock in.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  const renderOrderDetails = () => {
    if (!selectedOrder) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
          Order Details
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Order ID</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>#{selectedOrder.id}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Order Type</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedOrder.order_type}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedOrder.customer_name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedOrder.customer_phone}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Total Amount</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>₦{selectedOrder.total_amount?.toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip 
              label={selectedOrder.status} 
              color={
                selectedOrder.status === 'completed' ? 'success' :
                selectedOrder.status === 'pending' ? 'warning' : 'default'
              }
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Items</Typography>
            <TableContainer component={Paper} sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Unit Price</TableCell>
                    <TableCell>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedOrder.items?.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₦{item.unit_price?.toLocaleString()}</TableCell>
                      <TableCell>₦{item.total_price?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedOrder.notes || 'No notes'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Created</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString() : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Updated</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {selectedOrder.updated_at ? new Date(selectedOrder.updated_at).toLocaleString() : 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderEditOrderForm = () => {
    if (!selectedOrder) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
          Edit Order: #{selectedOrder.id}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Customer Name"
              value={newOrder.customer_name}
              onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Customer Phone"
              value={newOrder.customer_phone}
              onChange={(e) => setNewOrder({ ...newOrder, customer_phone: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Order Type</InputLabel>
              <Select
                value={newOrder.order_type}
                onChange={(e) => setNewOrder({ ...newOrder, order_type: e.target.value })}
                label="Order Type"
              >
                <MenuItem value="general_sales">General Sales</MenuItem>
                <MenuItem value="distributor">Distributor Order</MenuItem>
                <MenuItem value="driver_dispatch">Driver Dispatch</MenuItem>
                <MenuItem value="store_dispatch">Store Dispatch</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={newOrder.status}
                onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
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
      </Box>
    );
  };

  const renderUpdateStatusForm = () => {
    if (!selectedOrder) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
          Update Order Status: #{selectedOrder.id}
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Current Status: <strong>{selectedOrder.status}</strong>
          </Typography>
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>New Status</InputLabel>
              <Select
                value={newOrder.status}
                onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
                label="New Status"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Status Update Notes"
              multiline
              rows={3}
              value={newOrder.notes}
              onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
              placeholder="Add any notes about this status change..."
            />
          </Grid>
        </Grid>
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
      case 'overview':
        return renderOverview();
      case 'inventory':
        return <InventoryManagement selectedSection={selectedSection} userRole="receptionist" />;
      case 'general-sales':
      case 'distributor-orders':
      case 'driver-dispatches':
      case 'store-dispatch':
        return <OrderManagement selectedSection={selectedSection} userRole="receptionist" />;
      case 'sales-management':
        return <SalesManagement selectedSection={selectedSection} userRole="receptionist" />;
      case 'driver-settlement':
        return renderDriverSettlement();
      case 'order-status-logs':
        return renderOrderStatusLogs();
      case 'my-attendance':
        return renderMyAttendance();
      default:
        return renderOverview();
    }
  };

  return (
    <Box>
      {renderContent()}
      
      {/* Dialog for various actions */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'create-general-sales' && 'Create General Sales Order'}
          {dialogType === 'create-distributor-order' && 'Create Distributor Order'}
          {dialogType === 'create-driver-dispatch' && 'Create Driver Dispatch'}
          {dialogType === 'create-store-dispatch' && 'Create Store Dispatch'}
          {dialogType === 'settlement' && 'Process Driver Settlement'}
          {dialogType === 'view-order' && 'Order Details'}
          {dialogType === 'edit-order' && 'Edit Order'}
          {dialogType === 'update-status' && 'Update Order Status'}
        </DialogTitle>
        <DialogContent>
          {dialogType.includes('create') && renderOrderCreationForm()}
          {dialogType === 'settlement' && renderSettlementForm()}
          {dialogType.includes('view') && renderOrderDetails()}
          {dialogType.includes('edit') && renderEditOrderForm()}
          {dialogType.includes('update-status') && renderUpdateStatusForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogType.includes('view') ? 'Close' : 'Cancel'}
          </Button>
          {!dialogType.includes('view') && (
            <Button 
              variant="contained" 
              sx={{ bgcolor: '#13bbc6' }}
              onClick={
                dialogType.includes('create') ? handleCreateOrder : 
                dialogType === 'settlement' ? handleSubmitSettlement :
                dialogType.includes('edit') ? handleUpdateOrder :
                dialogType.includes('update-status') ? handleUpdateOrderStatus : undefined
              }
            >
              {dialogType.includes('create') ? 'Create' : 
               dialogType === 'settlement' ? 'Submit Settlement' :
               dialogType.includes('edit') ? 'Update Order' :
               dialogType.includes('update-status') ? 'Update Status' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReceptionistDashboard;
