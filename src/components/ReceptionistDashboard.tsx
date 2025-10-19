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
  DeliveryDining
} from '@mui/icons-material';
import axios from 'axios';
import OrderManagement from './OrderManagement';
import SalesManagement from './SalesManagement';

interface ReceptionistDashboardProps {
  selectedSection: string;
}

const ReceptionistDashboard: React.FC<ReceptionistDashboardProps> = ({ selectedSection }) => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [generalSales, setGeneralSales] = useState<any[]>([]);
  const [distributorOrders, setDistributorOrders] = useState<any[]>([]);
  const [driverDispatches, setDriverDispatches] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activeStep, setActiveStep] = useState(0);

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
          const ordersResponse = await axios.get('http://localhost:3001/api/orders', { headers });
          setOrders(ordersResponse.data.data || []);
          break;
        case 'general-sales':
          // Filter orders for general sales
          const generalSalesResponse = await axios.get('http://localhost:3001/api/orders?type=general_sales', { headers });
          setGeneralSales(generalSalesResponse.data.data || []);
          break;
        case 'distributor-orders':
          // Filter orders for distributor orders
          const distributorResponse = await axios.get('http://localhost:3001/api/orders?type=distributor_order', { headers });
          setDistributorOrders(distributorResponse.data.data || []);
          break;
        case 'driver-dispatches':
          // Filter orders for driver dispatches
          const dispatchResponse = await axios.get('http://localhost:3001/api/orders?type=driver_dispatch', { headers });
          setDriverDispatches(dispatchResponse.data.data || []);
          break;
        case 'order-status-logs':
          const allOrdersResponse = await axios.get('http://localhost:3001/api/orders', { headers });
          setOrders(allOrdersResponse.data.data || []);
          break;
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
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setSelectedItem(null);
    setActiveStep(0);
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
                  onClick={() => handleOpenDialog('create-general-sales')}
                  sx={{ bgcolor: '#13bbc6' }}
                  className="dashboard-button"
                >
                  Create General Sales Order
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Store />}
                  onClick={() => handleOpenDialog('create-distributor-order')}
                  sx={{ bgcolor: '#FFD700', color: '#000' }}
                  className="dashboard-button"
                >
                  Create Distributor Order
                </Button>
                <Button
                  variant="contained"
                  startIcon={<DeliveryDining />}
                  onClick={() => handleOpenDialog('create-driver-dispatch')}
                  sx={{ bgcolor: '#4caf50' }}
                  className="dashboard-button"
                >
                  Create Driver Dispatch
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
      case 'general-sales':
      case 'distributor-orders':
      case 'driver-dispatches':
        return <OrderManagement selectedSection={selectedSection} userRole="receptionist" />;
      case 'sales-management':
        return <SalesManagement selectedSection={selectedSection} userRole="receptionist" />;
      case 'order-status-logs':
        return renderOrderStatusLogs();
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
          {dialogType === 'view-order' && 'Order Details'}
          {dialogType === 'edit-order' && 'Edit Order'}
          {dialogType === 'update-status' && 'Update Order Status'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogType.includes('create') && 'Order creation form will be implemented here.'}
            {dialogType.includes('view') && 'Order details will be displayed here.'}
            {dialogType.includes('edit') && 'Order editing form will be implemented here.'}
            {dialogType.includes('update-status') && 'Status update form will be implemented here.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {!dialogType.includes('view') && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }}>
              {dialogType.includes('create') ? 'Create' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReceptionistDashboard;
