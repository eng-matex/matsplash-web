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
  StepContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Inventory,
  Assessment,
  AccessTime,
  CheckCircle,
  Warning,
  Add,
  Edit,
  Delete,
  Visibility,
  LocalShipping,
  Store,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Refresh,
  LocalShippingOutlined,
  Person,
  Schedule
} from '@mui/icons-material';
import axios from 'axios';
import InventoryManagement from './InventoryManagement';

interface StoreKeeperDashboardProps {
  selectedSection: string;
}

const StoreKeeperDashboard: React.FC<StoreKeeperDashboardProps> = ({ selectedSection }) => {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<any>(null);

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
          
          // Mock inventory data
          setInventory([
            { id: 1, item_name: 'Sachet Water', current_stock: 1500, min_stock: 500, unit: 'bags', status: 'good' }
          ]);
          break;
        case 'inventory-audit':
          const inventoryResponse = await axios.get('http://localhost:3001/api/inventory', { headers });
          setInventoryLogs(inventoryResponse.data.data || []);
          break;
        case 'order-status-logs':
          const allOrdersResponse = await axios.get('http://localhost:3001/api/orders', { headers });
          setOrders(allOrdersResponse.data.data || []);
          break;
        case 'my-attendance':
          try {
            const attendanceResponse = await axios.get(`http://localhost:3001/api/attendance/status/${user?.id}`, { headers });
            setAttendanceStatus(attendanceResponse.data.data || null);
          } catch (error) {
            console.error('Error fetching attendance:', error);
            // Mock attendance data for testing
            setAttendanceStatus({
              status: 'present',
              clock_in_time: new Date().toISOString(),
              hours_worked: 8,
              total_break_time: 30,
              on_break: false
            });
          }
          break;
      }

      // Filter low stock items
      const lowStock = inventory.filter(item => item.current_stock <= item.min_stock);
      setLowStockItems(lowStock);
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
  };

  const handleConfirmPickup = async () => {
    if (!selectedItem) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Use the new confirm-pickup endpoint
      const response = await axios.put(`http://localhost:3001/api/orders/${selectedItem.id}/confirm-pickup`, {
        userId: 1, // This should come from auth context
        userEmail: 'storekeeper@matsplash.com' // This should come from auth context
      }, { headers });

      if (response.data.success) {
        // Refresh data
        fetchData();
        handleCloseDialog();
        alert('Pickup authorized successfully!');
      } else {
        alert('Error authorizing pickup: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error confirming pickup:', error);
      alert('Error confirming pickup. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'good': return 'success';
      case 'low': return 'warning';
      case 'critical': return 'error';
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'completed': return 'success';
      case 'picked_up': return 'success';
      default: return 'default';
    }
  };

  const getStockStatus = (current: number, min: number) => {
    if (current <= min * 0.5) return { status: 'critical', color: 'error' };
    if (current <= min) return { status: 'low', color: 'warning' };
    return { status: 'good', color: 'success' };
  };

  const renderOverview = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Store Management Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Inventory sx={{ mr: 1, color: '#13bbc6' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Total Items</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#13bbc6', fontWeight: 700 }}>
                {inventory.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In inventory
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ mr: 1, color: '#ff9800' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Low Stock</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 700 }}>
                {lowStockItems.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Items need restocking
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalShipping sx={{ mr: 1, color: '#4caf50' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Pending Pickups</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                {orders.filter(o => o.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Awaiting pickup
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle sx={{ mr: 1, color: '#9c27b0' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Completed Today</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 700 }}>
                {orders.filter(o => o.status === 'completed' && new Date(o.updated_at).toDateString() === new Date().toDateString()).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Orders processed
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
                Low Stock Alert
              </Typography>
              {lowStockItems.length > 0 ? (
                <List>
                  {lowStockItems.map((item) => {
                    const stockStatus = getStockStatus(item.current_stock, item.min_stock);
                    return (
                      <ListItem key={item.id} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Warning color={stockStatus.color as any} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.item_name}
                          secondary={`${item.current_stock} ${item.unit} remaining (Min: ${item.min_stock})`}
                        />
                        <Chip 
                          label={stockStatus.status.toUpperCase()} 
                          color={stockStatus.color as any}
                          size="small"
                        />
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Typography color="text.secondary">All items are well stocked!</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                Recent Orders
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.slice(0, 5).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.order_number}</TableCell>
                        <TableCell>{order.type?.replace('_', ' ').toUpperCase()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={order.status} 
                            color={getStatusColor(order.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleOpenDialog('view-order', order)}>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          {order.status === 'pending' && (
                            <Tooltip title="Confirm Pickup">
                              <IconButton size="small" onClick={() => handleOpenDialog('confirm-pickup', order)}>
                                <CheckCircle />
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
        </Grid>
      </Grid>
    </Box>
  );

  const renderInventoryAudit = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Inventory Audit
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('add-inventory')}
          sx={{ bgcolor: '#13bbc6' }}
          className="dashboard-button"
        >
          Add Inventory Item
        </Button>
      </Box>

      <Card className="dashboard-card">
        <CardContent>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Current Stock" />
            <Tab label="Stock Movements" />
            <Tab label="Low Stock Items" />
          </Tabs>

          {selectedTab === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Current Stock</TableCell>
                    <TableCell>Min Stock</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.map((item) => {
                    const stockStatus = getStockStatus(item.current_stock, item.min_stock);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>{item.current_stock}</TableCell>
                        <TableCell>{item.min_stock}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>
                          <Chip 
                            label={stockStatus.status.toUpperCase()} 
                            color={stockStatus.color as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleOpenDialog('view-item', item)}>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Adjust Stock">
                            <IconButton size="small" onClick={() => handleOpenDialog('adjust-stock', item)}>
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {selectedTab === 1 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Item</TableCell>
                    <TableCell>Operation</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Previous Stock</TableCell>
                    <TableCell>New Stock</TableCell>
                    <TableCell>User</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventoryLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{log.item_name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={log.operation} 
                          color={log.operation === 'add' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.quantity}</TableCell>
                      <TableCell>{log.previous_stock}</TableCell>
                      <TableCell>{log.new_stock}</TableCell>
                      <TableCell>{log.user_name || 'System'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {selectedTab === 2 && (
            <Box>
              {lowStockItems.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Item Name</TableCell>
                        <TableCell>Current Stock</TableCell>
                        <TableCell>Min Stock</TableCell>
                        <TableCell>Deficit</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lowStockItems.map((item) => {
                        const deficit = item.min_stock - item.current_stock;
                        const priority = deficit > item.min_stock ? 'Critical' : 'High';
                        return (
                          <TableRow key={item.id}>
                            <TableCell>{item.item_name}</TableCell>
                            <TableCell>{item.current_stock}</TableCell>
                            <TableCell>{item.min_stock}</TableCell>
                            <TableCell>{deficit}</TableCell>
                            <TableCell>
                              <Chip 
                                label={priority} 
                                color={priority === 'Critical' ? 'error' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Restock Item">
                                <IconButton size="small" onClick={() => handleOpenDialog('restock-item', item)}>
                                  <Add />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle sx={{ fontSize: 48, color: '#4caf50', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    All items are well stocked!
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
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

  const renderOrderStatusLogs = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Order Status Logs
      </Typography>

      <Card className="dashboard-card">
        <CardContent>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="All Orders" />
            <Tab label="Pending Pickup" />
            <Tab label="Picked Up" />
            <Tab label="Completed" />
          </Tabs>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Customer/Distributor</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders
                  .filter(order => {
                    if (selectedTab === 0) return true;
                    if (selectedTab === 1) return order.status === 'pending';
                    if (selectedTab === 2) return order.status === 'picked_up';
                    if (selectedTab === 3) return order.status === 'completed';
                    return true;
                  })
                  .map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.order_number}</TableCell>
                      <TableCell>{order.type?.replace('_', ' ').toUpperCase()}</TableCell>
                      <TableCell>{order.customer_name || order.distributor_name || 'Unknown'}</TableCell>
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
                        {order.status === 'pending' && (
                          <Tooltip title="Confirm Pickup">
                            <IconButton size="small" onClick={() => handleOpenDialog('confirm-pickup', order)}>
                              <CheckCircle />
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
    </Box>
  );

  const renderPickupConfirmations = () => {
    const pendingOrders = orders.filter(order => order.status === 'pending');
    const pickedUpOrders = orders.filter(order => order.status === 'picked_up');

    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600, mb: 3 }}>
          Pickup Confirmations
        </Typography>

        <Grid container spacing={3}>
          {/* Pending Pickup Orders */}
          <Grid item xs={12} md={6}>
            <Card className="dashboard-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Schedule sx={{ mr: 1, color: '#ff9800' }} />
                  <Typography variant="h6" sx={{ color: '#2c3e50' }}>Pending Pickup</Typography>
                </Box>
                <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 700 }}>
                  {pendingOrders.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Orders waiting for pickup authorization
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Picked Up Orders */}
          <Grid item xs={12} md={6}>
            <Card className="dashboard-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircle sx={{ mr: 1, color: '#4caf50' }} />
                  <Typography variant="h6" sx={{ color: '#2c3e50' }}>Picked Up Today</Typography>
                </Box>
                <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                  {pickedUpOrders.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Orders authorized for pickup
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Pending Pickup Orders Table */}
        <Card className="dashboard-card" sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
              Orders Pending Pickup Authorization
            </Typography>
            
            {pendingOrders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircle sx={{ fontSize: 48, color: '#4caf50', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No orders pending pickup authorization
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All orders have been processed
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Driver</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.order_number}</TableCell>
                        <TableCell>
                          <Chip 
                            label={order.order_type?.replace('_', ' ').toUpperCase()} 
                            color="primary" 
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{order.customer_name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Person sx={{ mr: 1, fontSize: 16 }} />
                            {order.assigned_driver_id ? `Driver #${order.assigned_driver_id}` : 'Not Assigned'}
                          </Box>
                        </TableCell>
                        <TableCell>{order.items?.length || 0} items</TableCell>
                        <TableCell>₦{order.total_amount?.toLocaleString() || '0'}</TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleOpenDialog('view-order', order)}>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Authorize Pickup">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog('confirm-pickup', order)}
                              sx={{ color: '#4caf50' }}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
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
      case 'pickup-confirmations':
        return renderPickupConfirmations();
      case 'inventory-audit':
        return renderInventoryAudit();
      case 'inventory-management':
        return <InventoryManagement selectedSection={selectedSection} userRole="storekeeper" />;
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
          {dialogType === 'add-inventory' && 'Add Inventory Item'}
          {dialogType === 'view-item' && 'Item Details'}
          {dialogType === 'adjust-stock' && 'Adjust Stock'}
          {dialogType === 'restock-item' && 'Restock Item'}
          {dialogType === 'view-order' && 'Order Details'}
          {dialogType === 'confirm-pickup' && 'Confirm Pickup'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'confirm-pickup' && selectedItem && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                Confirm Pickup Authorization
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Order ID</Typography>
                  <Typography variant="body1">{selectedItem.order_number}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Order Type</Typography>
                  <Typography variant="body1">{selectedItem.order_type?.replace('_', ' ').toUpperCase()}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
                  <Typography variant="body1">{selectedItem.customer_name || 'Unknown'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Driver</Typography>
                  <Typography variant="body1">
                    {selectedItem.assigned_driver_id ? `Driver #${selectedItem.assigned_driver_id}` : 'Not Assigned'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Items</Typography>
                  <Typography variant="body1">{selectedItem.items?.length || 0} items</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                  <Typography variant="body1">₦{selectedItem.total_amount?.toLocaleString() || '0'}</Typography>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  By confirming this pickup, you authorize the driver to collect the order items from the warehouse. 
                  This action will change the order status to "Picked Up".
                </Typography>
              </Alert>

              {selectedItem.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                  <Typography variant="body2">{selectedItem.notes}</Typography>
                </Box>
              )}
            </Box>
          )}
          
          {dialogType === 'view-order' && selectedItem && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                Order Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Order ID</Typography>
                  <Typography variant="body1">{selectedItem.order_number}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={selectedItem.status} 
                    color={getStatusColor(selectedItem.status) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
                  <Typography variant="body1">{selectedItem.customer_name || 'Unknown'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                  <Typography variant="body1">₦{selectedItem.total_amount?.toLocaleString() || '0'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                  <Typography variant="body1">{new Date(selectedItem.created_at).toLocaleString()}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {dialogType.includes('inventory') && (
            <Typography>
              Inventory management functionality will be implemented here.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'confirm-pickup' && (
            <Button 
              variant="contained" 
              sx={{ bgcolor: '#4caf50' }}
              onClick={handleConfirmPickup}
            >
              Authorize Pickup
            </Button>
          )}
          {dialogType.includes('inventory') && !dialogType.includes('view') && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }}>
              {dialogType.includes('add') ? 'Add' : 'Confirm'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StoreKeeperDashboard;
