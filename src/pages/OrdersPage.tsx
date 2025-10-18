import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
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
  Fab
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  Assignment,
  LocalShipping,
  Store,
  FilterList
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { Order, CreateOrderForm } from '../types';
import axios from 'axios';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`order-tabpanel-${index}`}
      aria-labelledby={`order-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [newOrder, setNewOrder] = useState<CreateOrderForm>({
    order_type: 'general',
    bags_ordered: 0,
    free_bags_included: 0,
    price_per_bag: 0,
    delivery_method: 'pickup'
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/orders');
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateOrder = async () => {
    try {
      const orderData = {
        ...newOrder,
        requested_by: user?.id,
        total_bags: newOrder.bags_ordered + newOrder.free_bags_included,
        total_amount: newOrder.bags_ordered * newOrder.price_per_bag
      };

      const response = await axios.post('/orders', orderData);
      if (response.data.success) {
        setCreateDialogOpen(false);
        setNewOrder({
          order_type: 'general',
          bags_ordered: 0,
          free_bags_included: 0,
          price_per_bag: 0,
          delivery_method: 'pickup'
        });
        fetchOrders();
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      'pending_pickup': 'warning',
      'picked_up': 'info',
      'out_for_delivery': 'primary',
      'delivered': 'success',
      'settlement_pending': 'warning',
      'settled': 'info',
      'completed': 'success',
      'cancelled': 'error'
    };
    return colors[status] || 'default';
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'general':
        return <Store />;
      case 'distributor':
        return <Assignment />;
      case 'driver_dispatch':
        return <LocalShipping />;
      default:
        return <Assignment />;
    }
  };

  const filteredOrders = orders.filter(order => {
    switch (tabValue) {
      case 0:
        return order.order_type === 'general';
      case 1:
        return order.order_type === 'distributor';
      case 2:
        return order.order_type === 'driver_dispatch';
      default:
        return true;
    }
  });

  const orderTypes = [
    { label: 'General Sales', value: 'general', icon: <Store /> },
    { label: 'Distributor Orders', value: 'distributor', icon: <Assignment /> },
    { label: 'Driver Dispatches', value: 'driver_dispatch', icon: <LocalShipping /> }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Order Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          disabled={!['Admin', 'Manager', 'Receptionist'].includes(user?.role || '')}
        >
          Create Order
        </Button>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="order type tabs">
            {orderTypes.map((type, index) => (
              <Tab
                key={type.value}
                label={type.label}
                icon={type.icon}
                iconPosition="start"
                id={`order-tab-${index}`}
                aria-controls={`order-tabpanel-${index}`}
              />
            ))}
          </Tabs>
        </Box>

        {orderTypes.map((type, index) => (
          <TabPanel key={type.value} value={tabValue} index={index}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Bags</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.order_number}</TableCell>
                      <TableCell>
                        {order.customer_name || 'N/A'}
                        {order.customer_phone && (
                          <Typography variant="caption" display="block">
                            {order.customer_phone}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.bags_ordered} + {order.free_bags_included} free
                        <Typography variant="caption" display="block">
                          Total: {order.total_bags}
                        </Typography>
                      </TableCell>
                      <TableCell>₦{order.total_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(order.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedOrder(order);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={!['Admin', 'Manager'].includes(user?.role || '')}
                        >
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        ))}
      </Card>

      {/* Create Order Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Order Type</InputLabel>
                <Select
                  value={newOrder.order_type}
                  onChange={(e) => setNewOrder({ ...newOrder, order_type: e.target.value as any })}
                >
                  <MenuItem value="general">General Sales</MenuItem>
                  <MenuItem value="distributor">Distributor Order</MenuItem>
                  <MenuItem value="driver_dispatch">Driver Dispatch</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Delivery Method</InputLabel>
                <Select
                  value={newOrder.delivery_method}
                  onChange={(e) => setNewOrder({ ...newOrder, delivery_method: e.target.value as any })}
                >
                  <MenuItem value="pickup">Customer Pickup</MenuItem>
                  <MenuItem value="delivery">Delivery</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Name"
                value={newOrder.customer_name || ''}
                onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Phone"
                value={newOrder.customer_phone || ''}
                onChange={(e) => setNewOrder({ ...newOrder, customer_phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Bags Ordered"
                type="number"
                value={newOrder.bags_ordered}
                onChange={(e) => setNewOrder({ ...newOrder, bags_ordered: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Free Bags Included"
                type="number"
                value={newOrder.free_bags_included}
                onChange={(e) => setNewOrder({ ...newOrder, free_bags_included: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Price per Bag (₦)"
                type="number"
                value={newOrder.price_per_bag}
                onChange={(e) => setNewOrder({ ...newOrder, price_per_bag: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            {newOrder.delivery_method === 'delivery' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Delivery Address"
                  multiline
                  rows={3}
                  value={newOrder.delivery_address || ''}
                  onChange={(e) => setNewOrder({ ...newOrder, delivery_address: e.target.value })}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateOrder} variant="contained">
            Create Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Order Number</Typography>
                <Typography variant="body1">{selectedOrder.order_number}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Order Type</Typography>
                <Typography variant="body1">{selectedOrder.order_type.replace('_', ' ').toUpperCase()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Customer</Typography>
                <Typography variant="body1">{selectedOrder.customer_name || 'N/A'}</Typography>
                {selectedOrder.customer_phone && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedOrder.customer_phone}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Status</Typography>
                <Chip
                  label={selectedOrder.status.replace('_', ' ').toUpperCase()}
                  color={getStatusColor(selectedOrder.status)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Bags Ordered</Typography>
                <Typography variant="body1">{selectedOrder.bags_ordered}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Free Bags</Typography>
                <Typography variant="body1">{selectedOrder.free_bags_included}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Total Bags</Typography>
                <Typography variant="body1">{selectedOrder.total_bags}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Price per Bag</Typography>
                <Typography variant="body1">₦{selectedOrder.price_per_bag.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Total Amount</Typography>
                <Typography variant="body1">₦{selectedOrder.total_amount.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Delivery Method</Typography>
                <Typography variant="body1">{selectedOrder.delivery_method.toUpperCase()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Created</Typography>
                <Typography variant="body1">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrdersPage;
