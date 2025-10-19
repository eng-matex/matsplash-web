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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  Autocomplete,
  FormControlLabel as MuiFormControlLabel,
  Checkbox,
  FormGroup
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  Print,
  Download,
  Upload,
  CheckCircle,
  Cancel,
  Pending,
  LocalShipping,
  Business,
  Person,
  AttachMoney,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Assessment,
  Schedule
} from '@mui/icons-material';
import axios from 'axios';

interface OrderManagementProps {
  selectedSection: string;
  userRole?: string;
  defaultOrderType?: string;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  order_type: 'general_sales' | 'distributor_order' | 'driver_dispatch' | 'store_dispatch';
  status: 'pending' | 'processing' | 'packed' | 'dispatched' | 'delivered' | 'cancelled' | 'out_for_delivery' | 'returned';
  total_amount: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  created_by: string;
  notes?: string;
  delivery_address?: string;
  payment_method: 'cash' | 'transfer' | 'card';
  payment_status: 'pending' | 'paid' | 'partial';
  assigned_driver?: string;
  assigned_driver_id?: number;
  storekeeper_authorized?: boolean;
  authorization_time?: string;
  authorization_by?: string;
}

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  customer_type: 'individual' | 'distributor' | 'retailer';
}

interface Driver {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: string;
  is_active: boolean;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ selectedSection, userRole, defaultOrderType }) => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    order_type: (defaultOrderType as any) || 'general_sales',
    status: 'pending',
    total_amount: 0,
    items: [],
    payment_method: 'cash',
    payment_status: 'pending',
    notes: '',
    delivery_address: ''
  });
  const [newItem, setNewItem] = useState<Partial<OrderItem>>({
    product_name: '',
    quantity: 0,
    unit_price: 0,
    total_price: 0,
    unit: 'bags'
  });

  // Mock data for products
  const products = [
    { name: 'Water Sachets (500ml)', price: 300, unit: 'bags' },
    { name: 'Water Sachets (1L)', price: 500, unit: 'bags' },
    { name: 'Water Bottles (500ml)', price: 200, unit: 'bottles' },
    { name: 'Water Bottles (1L)', price: 350, unit: 'bottles' }
  ];

  useEffect(() => {
    fetchData();
  }, [selectedSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch drivers from API
      try {
        const driversResponse = await axios.get('/api/sales/drivers');
        setDrivers(Array.isArray(driversResponse.data) ? driversResponse.data : []);
      } catch (error) {
        console.log('Drivers API not available, using empty array');
        setDrivers([]);
      }

      // Fetch orders from API
      try {
        const ordersResponse = await axios.get('/api/sales/orders');
        if (ordersResponse.data.success) {
          setOrders(ordersResponse.data.data);
        } else {
          // Fallback to mock data if API fails
          setOrders(getMockOrders());
        }
      } catch (error) {
        console.log('Orders API not available, using mock data');
        setOrders(getMockOrders());
      }

      // Fetch customers from API (if available)
      try {
        const customersResponse = await axios.get('/api/sales/customers');
        if (customersResponse.data.success) {
          setCustomers(customersResponse.data.data);
        } else {
          setCustomers(getMockCustomers());
        }
      } catch (error) {
        console.log('Customers API not available, using mock data');
        setCustomers(getMockCustomers());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockOrders = (): Order[] => [
    {
      id: 1,
      order_number: 'ORD001',
      customer_name: 'John Doe',
      customer_phone: '08012345678',
      customer_email: 'john@example.com',
      order_type: 'general_sales',
      status: 'pending',
      total_amount: 15000,
      items: [
        { id: 1, product_name: 'Water Sachets (500ml)', quantity: 50, unit_price: 300, total_price: 15000, unit: 'bags' }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'Receptionist',
      notes: 'Urgent delivery needed',
      delivery_address: '123 Main Street, Lagos',
      payment_method: 'cash',
      payment_status: 'pending'
    },
    {
      id: 2,
      order_number: 'ORD002',
      customer_name: 'ABC Distributors',
      customer_phone: '08087654321',
      customer_email: 'orders@abcdist.com',
      order_type: 'distributor_order',
      status: 'processing',
      total_amount: 50000,
      items: [
        { id: 2, product_name: 'Water Sachets (1L)', quantity: 100, unit_price: 500, total_price: 50000, unit: 'bags' }
      ],
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
      created_by: 'Manager',
      notes: 'Bulk order for distribution',
      delivery_address: '456 Business District, Lagos',
      payment_method: 'transfer',
      payment_status: 'paid'
    },
    {
      id: 3,
      order_number: 'ORD003',
      customer_name: 'Driver Sales Route',
      customer_phone: '08022222222',
      customer_email: 'driver@example.com',
      order_type: 'driver_dispatch',
      status: 'out_for_delivery',
      total_amount: 0,
      items: [
        { id: 3, product_name: 'Water Sachets (500ml)', quantity: 150, unit_price: 0, total_price: 0, unit: 'bags' }
      ],
      created_at: new Date(Date.now() - 1800000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
      created_by: 'Receptionist',
      notes: 'Driver dispatch - commission based sales',
      delivery_address: 'Various locations on route',
      payment_method: 'cash',
      payment_status: 'pending',
      assigned_driver: 'Driver Name',
      assigned_driver_id: 1,
      storekeeper_authorized: true
    },
    {
      id: 4,
      order_number: 'ORD004',
      customer_name: 'Mini Store ABC',
      customer_phone: '08011111111',
      customer_email: 'store@example.com',
      order_type: 'store_dispatch',
      status: 'pending',
      total_amount: 0,
      items: [
        { id: 4, product_name: 'Water Sachets (500ml)', quantity: 200, unit_price: 0, total_price: 0, unit: 'bags' }
      ],
      created_at: new Date(Date.now() - 1800000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
      created_by: 'Receptionist',
      notes: 'Mini store stocking - no price',
      delivery_address: '789 Store Street, Lagos',
      payment_method: 'cash',
      payment_status: 'pending',
      assigned_driver: 'Driver Assistant',
      assigned_driver_id: 2,
      storekeeper_authorized: false
    }
  ];

  const getMockCustomers = (): Customer[] => [
    { id: 1, name: 'John Doe', phone: '08012345678', email: 'john@example.com', customer_type: 'individual' },
    { id: 2, name: 'ABC Distributors', phone: '08087654321', email: 'orders@abcdist.com', customer_type: 'distributor' },
    { id: 3, name: 'Jane Smith', phone: '08098765432', email: 'jane@example.com', customer_type: 'retailer' },
    { id: 4, name: 'Mini Store ABC', phone: '08011111111', email: 'store@example.com', customer_type: 'retailer' },
    { id: 5, name: 'Driver Sales Route', phone: '08022222222', email: 'driver@example.com', customer_type: 'individual' }
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleOpenDialog = (type: string, order?: Order) => {
    setDialogType(type);
    setSelectedOrder(order || null);
    if (type === 'new') {
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
        delivery_address: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setSelectedOrder(null);
  };

  const handleCreateOrder = async () => {
    if (!newOrder.customer_name || !newOrder.customer_phone || !newOrder.items?.length) {
      alert('Please fill in all required fields');
      return;
    }

    if ((newOrder.order_type === 'store_dispatch' || newOrder.order_type === 'driver_dispatch') && !newOrder.assigned_driver_id) {
      alert('Please assign a driver for this order type');
      return;
    }

    try {
      const orderData = {
        customer_name: newOrder.customer_name,
        customer_phone: newOrder.customer_phone,
        customer_email: newOrder.customer_email,
        order_type: newOrder.order_type,
        items: newOrder.items,
        notes: newOrder.notes,
        delivery_address: newOrder.delivery_address,
        payment_method: newOrder.payment_method,
        payment_status: newOrder.payment_status,
        created_by: 1 // This should come from auth context
      };

      console.log('Creating order:', orderData);
      
      // Make API call to create the order
      const response = await axios.post('/api/orders', orderData);
      
      if (response.data.success) {
        // Add to local state
        setOrders(prev => [response.data.data, ...prev]);
        handleCloseDialog();
        
        alert(`${newOrder.order_type === 'store_dispatch' ? 'Store Dispatch' : newOrder.order_type === 'driver_dispatch' ? 'Driver Dispatch' : 'Order'} created successfully!`);
      } else {
        alert('Error creating order: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again.');
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      // Here you would make an API call to update the order status
      console.log('Updating order status:', orderId, newStatus);
      
      // For now, update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as any, updated_at: new Date().toISOString() }
          : order
      ));
      
      alert(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status. Please try again.');
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      // Here you would make an API call to delete the order
      console.log('Deleting order:', orderId);
      
      // For now, update local state
      setOrders(prev => prev.filter(order => order.id !== orderId));
      
      alert('Order deleted successfully');
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Error deleting order. Please try again.');
    }
  };

  const handleAddItem = () => {
    if (newItem.product_name && newItem.quantity && newItem.unit_price) {
      const item: OrderItem = {
        id: Date.now(),
        product_name: newItem.product_name,
        quantity: newItem.quantity,
        unit_price: newItem.unit_price,
        total_price: newItem.quantity * newItem.unit_price,
        unit: newItem.unit || 'bags'
      };

      setNewOrder(prev => ({
        ...prev,
        items: [...(prev.items || []), item],
        total_amount: (prev.total_amount || 0) + item.total_price
      }));

      setNewItem({
        product_name: '',
        quantity: 0,
        unit_price: 0,
        total_price: 0,
        unit: 'bags'
      });
    }
  };

  const handleRemoveItem = (itemId: number) => {
    setNewOrder(prev => {
      const updatedItems = prev.items?.filter(item => item.id !== itemId) || [];
      const removedItem = prev.items?.find(item => item.id === itemId);
      return {
        ...prev,
        items: updatedItems,
        total_amount: (prev.total_amount || 0) - (removedItem?.total_price || 0)
      };
    });
  };

  const handleProductChange = (productName: string) => {
    const product = products.find(p => p.name === productName);
    if (product) {
      let price = product.price;
      
      // Set pricing based on order type
      if (newOrder.order_type === 'store_dispatch') {
        price = 0; // No price for mini store stocking
      } else if (newOrder.order_type === 'driver_dispatch') {
        price = 0; // No upfront price, driver sells at ₦270/₦250
      } else if (newOrder.order_type === 'distributor_order') {
        // Distributor pricing: 50+ bags = ₦200/bag, <50 bags = ₦240/bag
        // This will be calculated based on quantity
        price = product.price; // Will be adjusted based on quantity
      }
      
      setNewItem(prev => ({
        ...prev,
        product_name: productName,
        unit_price: price,
        unit: product.unit,
        total_price: (prev.quantity || 0) * price
      }));
    }
  };

  const handleQuantityChange = (quantity: number) => {
    let price = newItem.unit_price || 0;
    
    // Apply distributor pricing logic
    if (newOrder.order_type === 'distributor_order' && newItem.product_name) {
      const product = products.find(p => p.name === newItem.product_name);
      if (product) {
        // Distributor pricing: 50+ bags = ₦200/bag, <50 bags = ₦240/bag
        price = quantity >= 50 ? 200 : 240;
      }
    } else if (newOrder.order_type === 'store_dispatch' || newOrder.order_type === 'driver_dispatch') {
      price = 0; // No upfront pricing for these types
    }
    
    setNewItem(prev => ({
      ...prev,
      quantity,
      unit_price: price,
      total_price: quantity * price
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'packed': return 'primary';
      case 'dispatched': return 'secondary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'general_sales': return <ShoppingCart />;
      case 'distributor_order': return <Business />;
      case 'driver_dispatch': return <LocalShipping />;
      case 'store_dispatch': return <LocalShipping />;
      default: return <Receipt />;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = typeFilter === 'all' || order.order_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const renderOrderList = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Order Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('new')}
          sx={{ bgcolor: '#13bbc6' }}
        >
          New Order
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Orders"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="packed">Packed</MenuItem>
                  <MenuItem value="dispatched">Dispatched</MenuItem>
                  <MenuItem value="out_for_delivery">Out for Delivery</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="returned">Returned</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Order Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="Order Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="general_sales">General Sales</MenuItem>
                  <MenuItem value="distributor_order">Distributor Order</MenuItem>
                  <MenuItem value="driver_dispatch">Driver Dispatch</MenuItem>
                  <MenuItem value="store_dispatch">Store Dispatch</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {order.order_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {order.customer_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.customer_phone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getOrderTypeIcon(order.order_type)}
                        <Typography sx={{ ml: 1, textTransform: 'capitalize' }}>
                          {order.order_type.replace('_', ' ')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ₦{order.total_amount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={order.status.charAt(0).toUpperCase() + order.status.slice(1)} 
                        color={getStatusColor(order.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)} 
                        color={order.payment_status === 'paid' ? 'success' : order.payment_status === 'partial' ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(order.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleOpenDialog('view', order)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Order">
                          <IconButton size="small" onClick={() => handleOpenDialog('edit', order)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        {order.status === 'pending' && (
                          <Tooltip title="Mark as Processing">
                            <IconButton 
                              size="small" 
                              onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                              sx={{ color: '#2196f3' }}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                        )}
                        {order.status === 'processing' && (
                          <Tooltip title="Mark as Packed">
                            <IconButton 
                              size="small" 
                              onClick={() => handleUpdateOrderStatus(order.id, 'packed')}
                              sx={{ color: '#4caf50' }}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                        )}
                        {order.status === 'packed' && (order.order_type === 'store_dispatch' || order.order_type === 'driver_dispatch') && (
                          <Tooltip title="Authorize Pickup">
                            <IconButton 
                              size="small" 
                              onClick={() => handleUpdateOrderStatus(order.id, 'out_for_delivery')}
                              sx={{ color: '#ff9800' }}
                            >
                              <LocalShipping />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete Order">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteOrder(order.id)}
                            sx={{ color: '#f44336' }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
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

  const renderNewOrderForm = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Create New Order
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
            Customer Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                freeSolo
                options={customers.map(customer => customer.name)}
                value={newOrder.customer_name}
                onInputChange={(event, newValue) => {
                  setNewOrder(prev => ({ ...prev, customer_name: newValue || '' }));
                  const customer = customers.find(c => c.name === newValue);
                  if (customer) {
                    setNewOrder(prev => ({
                      ...prev,
                      customer_phone: customer.phone,
                      customer_email: customer.email || ''
                    }));
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Customer Name" required />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={newOrder.customer_phone}
                onChange={(e) => setNewOrder(prev => ({ ...prev, customer_phone: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email (Optional)"
                value={newOrder.customer_email}
                onChange={(e) => setNewOrder(prev => ({ ...prev, customer_email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Order Type</InputLabel>
                <Select
                  value={newOrder.order_type}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, order_type: e.target.value as any }))}
                  label="Order Type"
                >
                  <MenuItem value="general_sales">General Sales</MenuItem>
                  <MenuItem value="distributor_order">Distributor Order</MenuItem>
                  <MenuItem value="driver_dispatch">Driver Dispatch</MenuItem>
                  <MenuItem value="store_dispatch">Store Dispatch</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Delivery Address"
                value={newOrder.delivery_address}
                onChange={(e) => setNewOrder(prev => ({ ...prev, delivery_address: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
            {(newOrder.order_type === 'store_dispatch' || newOrder.order_type === 'driver_dispatch') && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Assign Driver</InputLabel>
                  <Select
                    value={newOrder.assigned_driver_id || ''}
                    onChange={(e) => {
                      const driverId = e.target.value as number;
                      const driver = drivers.find(d => d.id === driverId);
                      setNewOrder(prev => ({ 
                        ...prev, 
                        assigned_driver_id: driverId,
                        assigned_driver: driver?.name || ''
                      }));
                    }}
                    label="Assign Driver"
                  >
                    {drivers.map((driver) => (
                      <MenuItem key={driver.id} value={driver.id}>
                        {driver.name} ({driver.role})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
            Order Items
          </Typography>
          <Grid container spacing={2} alignItems="end">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Product</InputLabel>
                <Select
                  value={newItem.product_name}
                  onChange={(e) => handleProductChange(e.target.value)}
                  label="Product"
                >
                  {products.map((product) => (
                    <MenuItem key={product.name} value={product.name}>
                      {product.name} - {
                        newOrder.order_type === 'store_dispatch' ? 'No Price (Mini Store)' :
                        newOrder.order_type === 'driver_dispatch' ? 'No Price (Commission Sales)' :
                        newOrder.order_type === 'distributor_order' ? 'Dynamic Pricing (50+ = ₦200, <50 = ₦240)' :
                        `₦${product.price}`
                      }
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={newItem.quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Unit Price"
                type="number"
                value={newItem.unit_price}
                InputProps={{
                  startAdornment: (newOrder.order_type === 'store_dispatch' || newOrder.order_type === 'driver_dispatch') ? 
                    <InputAdornment position="start">No Price</InputAdornment> :
                    <InputAdornment position="start">₦</InputAdornment>
                }}
                disabled
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Total"
                value={newItem.total_price}
                InputProps={{
                  startAdornment: (newOrder.order_type === 'store_dispatch' || newOrder.order_type === 'driver_dispatch') ? 
                    <InputAdornment position="start">No Price</InputAdornment> :
                    <InputAdornment position="start">₦</InputAdornment>,
                  readOnly: true
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleAddItem}
                disabled={!newItem.product_name || !newItem.quantity}
                sx={{ bgcolor: '#4caf50' }}
              >
                Add Item
              </Button>
            </Grid>
          </Grid>

          {/* Order Items List */}
          {newOrder.items && newOrder.items.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Order Items:
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {newOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.quantity} {item.unit}</TableCell>
                        <TableCell>₦{item.unit_price.toLocaleString()}</TableCell>
                        <TableCell>₦{item.total_price.toLocaleString()}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleRemoveItem(item.id)}>
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Total Amount: {
                    newOrder.order_type === 'store_dispatch' ? 'No Price (Mini Store Stocking)' :
                    newOrder.order_type === 'driver_dispatch' ? 'No Price (Commission Sales)' :
                    `₦${newOrder.total_amount?.toLocaleString()}`
                  }
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
            {(newOrder.order_type === 'store_dispatch' || newOrder.order_type === 'driver_dispatch') ? 'Notes' : 'Payment & Notes'}
          </Typography>
          <Grid container spacing={3}>
            {newOrder.order_type !== 'store_dispatch' && newOrder.order_type !== 'driver_dispatch' && (
              <>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={newOrder.payment_method}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, payment_method: e.target.value as any }))}
                      label="Payment Method"
                    >
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="transfer">Bank Transfer</MenuItem>
                      <MenuItem value="card">Card Payment</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Status</InputLabel>
                    <Select
                      value={newOrder.payment_status}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, payment_status: e.target.value as any }))}
                      label="Payment Status"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="partial">Partial</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={
                  newOrder.order_type === 'store_dispatch' ? 'Notes (Mini Store Stocking)' :
                  newOrder.order_type === 'driver_dispatch' ? 'Notes (Driver Commission Sales)' :
                  'Notes (Optional)'
                }
                value={newOrder.notes}
                onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
                placeholder={
                  newOrder.order_type === 'store_dispatch' ? 'Enter details about the mini store stocking order...' :
                  newOrder.order_type === 'driver_dispatch' ? 'Enter details about the driver sales route and commission structure...' :
                  'Enter any additional notes...'
                }
              />
            </Grid>
            {newOrder.order_type === 'store_dispatch' && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Store Dispatch Order:</strong> This order is for mini store stocking with no pricing. 
                    The assigned driver will pick up the items from the storekeeper and deliver to the mini store.
                  </Typography>
                </Alert>
              </Grid>
            )}
            {newOrder.order_type === 'driver_dispatch' && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Driver Dispatch Order:</strong> This order is for driver commission-based sales. 
                    The driver will sell water at ₦270/₦250 per bag and receive commission. No upfront payment required.
                  </Typography>
                </Alert>
              </Grid>
            )}
            <Grid item xs={12}>
              <Button
                variant="contained"
                size="large"
                startIcon={<CheckCircle />}
                onClick={handleCreateOrder}
                sx={{ bgcolor: '#13bbc6' }}
                disabled={
                  !newOrder.customer_name || 
                  !newOrder.customer_phone || 
                  !newOrder.items?.length ||
                  ((newOrder.order_type === 'store_dispatch' || newOrder.order_type === 'driver_dispatch') && !newOrder.assigned_driver_id)
                }
              >
                Create {
                  newOrder.order_type === 'store_dispatch' ? 'Store Dispatch' :
                  newOrder.order_type === 'driver_dispatch' ? 'Driver Dispatch' :
                  'Order'
                }
              </Button>
            </Grid>
          </Grid>
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
      case 'general-sales':
      case 'distributor-orders':
      case 'driver-dispatches':
      case 'store-dispatch':
        return renderOrderList();
      case 'new-order':
        return renderNewOrderForm();
      default:
        return renderOrderList();
    }
  };

  return (
    <Box>
      {renderContent()}
      
      {/* Dialog for various actions */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'new' && 'Create New Order'}
          {dialogType === 'view' && 'Order Details'}
          {dialogType === 'edit' && 'Edit Order'}
          {dialogType === 'print' && 'Print Order'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'view' && selectedOrder && (
            <Box>
              <Typography variant="h6" gutterBottom>Order Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Order Number:</strong> {selectedOrder.order_number}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Status:</strong> {selectedOrder.status}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Customer:</strong> {selectedOrder.customer_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Phone:</strong> {selectedOrder.customer_phone}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Order Type:</strong> {selectedOrder.order_type.replace('_', ' ')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Total Amount:</strong> {
                    selectedOrder.order_type === 'store_dispatch' ? 'No Price (Mini Store)' :
                    selectedOrder.order_type === 'driver_dispatch' ? 'No Price (Commission Sales)' :
                    `₦${selectedOrder.total_amount?.toLocaleString()}`
                  }</Typography>
                </Grid>
                {selectedOrder.assigned_driver && (
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Assigned Driver:</strong> {selectedOrder.assigned_driver}</Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="body2"><strong>Delivery Address:</strong> {selectedOrder.delivery_address}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2"><strong>Notes:</strong> {selectedOrder.notes}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
          {dialogType === 'edit' && selectedOrder && (
            <Typography>Edit functionality will be implemented here.</Typography>
          )}
          {dialogType === 'print' && selectedOrder && (
            <Typography>Print functionality will be implemented here.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'view' && selectedOrder && (
            <>
              <Button variant="outlined" onClick={() => handleOpenDialog('edit', selectedOrder)}>
                Edit Order
              </Button>
              <Button variant="outlined" onClick={() => handleOpenDialog('print', selectedOrder)}>
                Print Order
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderManagement;
