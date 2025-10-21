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
  FormGroup,
  LinearProgress,
  Badge,
  Avatar,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Switch,
  Slider,
  FormControlLabel as SwitchFormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
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
  Business,
  Person,
  Phone,
  Email,
  LocationOn,
  AttachMoney,
  Receipt,
  ShoppingCart,
  LocalShipping,
  TrendingUp,
  TrendingDown,
  Assessment,
  Timeline,
  Schedule,
  Group,
  Work,
  Security,
  Videocam,
  Report,
  Analytics,
  DataUsage,
  Insights,
  Dashboard,
  TableChart,
  ViewList,
  ViewModule,
  Refresh,
  Save,
  Close,
  Login,
  Logout,
  Timer,
  Today,
  DateRange,
  RestartAlt,
  ExpandMore,
  ExpandLess,
  Warning,
  CheckCircleOutline,
  Remove,
  AddCircle,
  RemoveCircle,
  History,
  Notifications,
  NotificationsActive,
  NotificationsOff,
  CameraAlt,
  CameraEnhance,
  CameraRoll,
  CameraFront,
  CameraRear,
  NetworkCheck,
  Wifi,
  WifiOff,
  SignalWifi4Bar,
  SignalWifiOff,
  Storage,
  CloudUpload,
  CloudDownload,
  CloudSync,
  Inventory,
  AccessTime,
  CleaningServices,
  Engineering
} from '@mui/icons-material';
import axios from 'axios';

interface DistributorManagementProps {
  selectedSection: string;
  userRole?: string;
}

interface Distributor {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  business_type: 'wholesale' | 'retail' | 'both';
  credit_limit: number;
  current_balance: number;
  payment_terms: 'cash' | 'credit_7' | 'credit_15' | 'credit_30';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  registration_date: string;
  last_order_date?: string;
  total_orders: number;
  total_sales: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface DistributorOrder {
  id: number;
  distributor_id: number;
  distributor_name: string;
  order_number: string;
  order_date: string;
  delivery_date?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'packed' | 'dispatched' | 'delivered' | 'cancelled';
  total_amount: number;
  items: {
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  payment_status: 'pending' | 'partial' | 'paid';
  payment_method: 'cash' | 'transfer' | 'credit';
  delivery_address: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface DistributorPayment {
  id: number;
  distributor_id: number;
  distributor_name: string;
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'transfer' | 'cheque';
  reference_number?: string;
  description: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
}

const DistributorManagement: React.FC<DistributorManagementProps> = ({ selectedSection, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [distributorOrders, setDistributorOrders] = useState<DistributorOrder[]>([]);
  const [distributorPayments, setDistributorPayments] = useState<DistributorPayment[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<DistributorOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  const [newDistributor, setNewDistributor] = useState<Partial<Distributor>>({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    business_type: 'retail',
    credit_limit: 0,
    payment_terms: 'cash',
    status: 'pending',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<any>({});

  const businessTypes = [
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'retail', label: 'Retail' },
    { value: 'both', label: 'Both Wholesale & Retail' }
  ];

  const paymentTerms = [
    { value: 'cash', label: 'Cash on Delivery' },
    { value: 'credit_7', label: '7 Days Credit' },
    { value: 'credit_15', label: '15 Days Credit' },
    { value: 'credit_30', label: '30 Days Credit' }
  ];

  const states = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
    'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
    'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT'
  ];

  useEffect(() => {
    fetchData();
  }, [selectedSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch distributors from API
      const distributorsResponse = await fetch('http://localhost:3002/api/distributors', { headers });
      if (distributorsResponse.ok) {
        const distributorsData = await distributorsResponse.json();
        setDistributors(distributorsData.data || []);
      } else {
        console.error('Failed to fetch distributors');
        setDistributors([]);
      }
      
      // For now, use mock data for orders and payments until we create those APIs
      const mockOrders: DistributorOrder[] = [
        {
          id: 1,
          distributor_id: 1,
          distributor_name: 'AquaPlus Distributors Ltd',
          order_number: 'DIST-2024-001',
          order_date: '2024-10-15',
          delivery_date: '2024-10-16',
          status: 'delivered',
          total_amount: 125000,
          items: [
            {
              product_id: 1,
              product_name: 'Sachet Water',
              quantity: 500,
              unit_price: 150,
              total_price: 75000
            },
            {
              product_id: 2,
              product_name: 'Sachet Water',
              quantity: 200,
              unit_price: 250,
              total_price: 50000
            }
          ],
          payment_status: 'paid',
          payment_method: 'credit',
          delivery_address: '123 Water Street, Victoria Island, Lagos',
          notes: 'Regular monthly order',
          created_at: '2024-10-15T00:00:00Z',
          updated_at: '2024-10-16T00:00:00Z'
        },
        {
          id: 2,
          distributor_id: 2,
          distributor_name: 'Fresh Water Solutions',
          order_number: 'DIST-2024-002',
          order_date: '2024-10-14',
          status: 'processing',
          total_amount: 45000,
          items: [
            {
              product_id: 1,
              product_name: 'Sachet Water',
              quantity: 300,
              unit_price: 150,
              total_price: 45000
            }
          ],
          payment_status: 'pending',
          payment_method: 'cash',
          delivery_address: '456 Market Road, Onitsha, Anambra',
          notes: 'Weekly restock order',
          created_at: '2024-10-14T00:00:00Z',
          updated_at: '2024-10-14T00:00:00Z'
        }
      ];

      const mockPayments: DistributorPayment[] = [
        {
          id: 1,
          distributor_id: 1,
          distributor_name: 'AquaPlus Distributors Ltd',
          payment_date: '2024-10-10',
          amount: 100000,
          payment_method: 'transfer',
          reference_number: 'TXN123456789',
          description: 'Payment for order DIST-2024-001',
          status: 'confirmed',
          created_at: '2024-10-10T00:00:00Z'
        },
        {
          id: 2,
          distributor_id: 3,
          distributor_name: 'Pure Water Ventures',
          payment_date: '2024-10-12',
          amount: 200000,
          payment_method: 'transfer',
          reference_number: 'TXN987654321',
          description: 'Monthly payment',
          status: 'confirmed',
          created_at: '2024-10-12T00:00:00Z'
        }
      ];

      setDistributorOrders(mockOrders);
      setDistributorPayments(mockPayments);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to empty arrays
      setDistributors([]);
      setDistributorOrders([]);
      setDistributorPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleOpenDialog = (type: string, item?: Distributor | DistributorOrder) => {
    setDialogType(type);
    if (item && 'contact_person' in item) {
      setSelectedDistributor(item as Distributor);
      // Populate form with selected distributor data for editing
      if (type === 'edit-distributor') {
        setNewDistributor({
          name: (item as Distributor).name,
          contact_person: (item as Distributor).contact_person,
          email: (item as Distributor).email,
          phone: (item as Distributor).phone,
          address: (item as Distributor).address,
          city: (item as Distributor).city,
          state: (item as Distributor).state,
          zip_code: (item as Distributor).zip_code,
          business_type: (item as Distributor).business_type,
          credit_limit: (item as Distributor).credit_limit,
          payment_terms: (item as Distributor).payment_terms,
          status: (item as Distributor).status,
          notes: (item as Distributor).notes || ''
        });
      }
    } else if (item && 'order_number' in item) {
      setSelectedOrder(item as DistributorOrder);
    } else {
      setSelectedDistributor(null);
      setSelectedOrder(null);
    }
    
    if (type === 'new-distributor') {
      setNewDistributor({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        business_type: 'retail',
        credit_limit: 0,
        payment_terms: 'cash',
        status: 'pending',
        notes: ''
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setSelectedDistributor(null);
    setSelectedOrder(null);
  };

  const handleDistributorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setNewDistributor((prev: any) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors: any = {};
    if (!newDistributor.name) errors.name = 'Distributor name is required';
    if (!newDistributor.contact_person) errors.contact_person = 'Contact person is required';
    if (!newDistributor.email) errors.email = 'Email is required';
    if (!newDistributor.phone) errors.phone = 'Phone number is required';
    if (!newDistributor.address) errors.address = 'Address is required';
    if (!newDistributor.city) errors.city = 'City is required';
    if (!newDistributor.state) errors.state = 'State is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitDistributor = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const distributorData = {
        ...newDistributor,
        userId: user.id,
        userEmail: user.email
      };

      const url = dialogType === 'new-distributor' 
        ? 'http://localhost:3002/api/distributors'
        : `http://localhost:3002/api/distributors/${selectedDistributor?.id}`;
      
      const method = dialogType === 'new-distributor' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(distributorData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Distributor saved successfully:', result);
        fetchData(); // Refresh the data
        handleCloseDialog();
      } else {
        const error = await response.json();
        setFormErrors({ submit: error.message || 'Failed to save distributor. Please try again.' });
      }
    } catch (error) {
      console.error('Error saving distributor:', error);
      setFormErrors({ submit: 'Failed to save distributor. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'processing': return 'primary';
      case 'packed': return 'secondary';
      case 'dispatched': return 'info';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'partial': return 'info';
      case 'paid': return 'success';
      default: return 'default';
    }
  };

  const filteredDistributors = distributors.filter(distributor => {
    const matchesSearch = distributor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         distributor.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         distributor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || distributor.status === statusFilter;
    const matchesBusinessType = businessTypeFilter === 'all' || distributor.business_type === businessTypeFilter;
    return matchesSearch && matchesStatus && matchesBusinessType;
  });

  const renderDistributorsList = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Distributor Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('new-distributor')}
          sx={{ bgcolor: '#13bbc6' }}
        >
          Add Distributor
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#4caf50', mr: 2 }}>
                  <Business />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {distributors.filter(d => d.status === 'active').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Distributors
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#2196f3', mr: 2 }}>
                  <ShoppingCart />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {distributorOrders.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#ff9800', mr: 2 }}>
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    ₦{distributors.reduce((sum, d) => sum + (d.total_sales || 0), 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Sales
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#f44336', mr: 2 }}>
                  <Warning />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {distributors.filter(d => d.current_balance > d.credit_limit * 0.8).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Credit Alerts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Distributors"
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
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Business Type</InputLabel>
                <Select
                  value={businessTypeFilter}
                  onChange={(e) => setBusinessTypeFilter(e.target.value)}
                  label="Business Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="wholesale">Wholesale</MenuItem>
                  <MenuItem value="retail">Retail</MenuItem>
                  <MenuItem value="both">Both</MenuItem>
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
                  setBusinessTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Distributors Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Distributor</TableCell>
                  <TableCell>Contact Person</TableCell>
                  <TableCell>Business Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Credit Limit</TableCell>
                  <TableCell>Current Balance</TableCell>
                  <TableCell>Total Orders</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDistributors.map((distributor) => (
                  <TableRow key={distributor.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {distributor.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {distributor.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {distributor.contact_person}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {distributor.phone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={distributor.business_type.charAt(0).toUpperCase() + distributor.business_type.slice(1)} 
                        color="info"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={distributor.status.charAt(0).toUpperCase() + distributor.status.slice(1)} 
                        color={getStatusColor(distributor.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        ₦{(distributor.credit_limit || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: (distributor.current_balance || 0) > (distributor.credit_limit || 0) * 0.8 ? '#f44336' : '#2c3e50' 
                        }}
                      >
                        ₦{(distributor.current_balance || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {distributor.total_orders || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleOpenDialog('view-distributor', distributor)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Distributor">
                        <IconButton size="small" onClick={() => handleOpenDialog('edit-distributor', distributor)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Orders">
                        <IconButton size="small" onClick={() => handleOpenDialog('view-orders', distributor)}>
                          <ShoppingCart />
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
      case 'distributor-mgmt':
        return renderDistributorsList();
      default:
        return renderDistributorsList();
    }
  };

  return (
    <Box>
      {renderContent()}
      
      {/* Dialog for various actions */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'new-distributor' && 'Add New Distributor'}
          {dialogType === 'edit-distributor' && 'Edit Distributor'}
          {dialogType === 'view-distributor' && 'Distributor Details'}
          {dialogType === 'view-orders' && 'Distributor Orders'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'new-distributor' && (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Distributor Name"
                    name="name"
                    fullWidth
                    value={newDistributor.name}
                    onChange={handleDistributorChange}
                    variant="outlined"
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Contact Person"
                    name="contact_person"
                    fullWidth
                    value={newDistributor.contact_person}
                    onChange={handleDistributorChange}
                    variant="outlined"
                    error={!!formErrors.contact_person}
                    helperText={formErrors.contact_person}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    fullWidth
                    value={newDistributor.email}
                    onChange={handleDistributorChange}
                    variant="outlined"
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Phone"
                    name="phone"
                    fullWidth
                    value={newDistributor.phone}
                    onChange={handleDistributorChange}
                    variant="outlined"
                    error={!!formErrors.phone}
                    helperText={formErrors.phone}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Address"
                    name="address"
                    fullWidth
                    value={newDistributor.address}
                    onChange={handleDistributorChange}
                    variant="outlined"
                    error={!!formErrors.address}
                    helperText={formErrors.address}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="City"
                    name="city"
                    fullWidth
                    value={newDistributor.city}
                    onChange={handleDistributorChange}
                    variant="outlined"
                    error={!!formErrors.city}
                    helperText={formErrors.city}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth variant="outlined" error={!!formErrors.state}>
                    <InputLabel>State</InputLabel>
                    <Select
                      name="state"
                      value={newDistributor.state}
                      onChange={handleDistributorChange}
                      label="State"
                    >
                      {states.map((state) => (
                        <MenuItem key={state} value={state}>{state}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="ZIP Code"
                    name="zip_code"
                    fullWidth
                    value={newDistributor.zip_code}
                    onChange={handleDistributorChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Business Type</InputLabel>
                    <Select
                      name="business_type"
                      value={newDistributor.business_type}
                      onChange={handleDistributorChange}
                      label="Business Type"
                    >
                      {businessTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Payment Terms</InputLabel>
                    <Select
                      name="payment_terms"
                      value={newDistributor.payment_terms}
                      onChange={handleDistributorChange}
                      label="Payment Terms"
                    >
                      {paymentTerms.map((term) => (
                        <MenuItem key={term.value} value={term.value}>{term.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Credit Limit"
                    name="credit_limit"
                    type="number"
                    fullWidth
                    value={newDistributor.credit_limit}
                    onChange={handleDistributorChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={newDistributor.status}
                      onChange={handleDistributorChange}
                      label="Status"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="suspended">Suspended</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Notes"
                    name="notes"
                    fullWidth
                    multiline
                    rows={3}
                    value={newDistributor.notes}
                    onChange={handleDistributorChange}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
              {formErrors.submit && <Alert severity="error" sx={{ mt: 2 }}>{formErrors.submit}</Alert>}
            </Box>
          )}
          {dialogType === 'edit-distributor' && selectedDistributor && (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Distributor Name"
                    name="name"
                    fullWidth
                    value={selectedDistributor.name}
                    onChange={handleDistributorChange}
                    variant="outlined"
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Contact Person"
                    name="contact_person"
                    fullWidth
                    value={selectedDistributor.contact_person}
                    onChange={handleDistributorChange}
                    variant="outlined"
                    error={!!formErrors.contact_person}
                    helperText={formErrors.contact_person}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    fullWidth
                    value={selectedDistributor.email}
                    onChange={handleDistributorChange}
                    variant="outlined"
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Phone"
                    name="phone"
                    fullWidth
                    value={selectedDistributor.phone}
                    onChange={handleDistributorChange}
                    variant="outlined"
                    error={!!formErrors.phone}
                    helperText={formErrors.phone}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Address"
                    name="address"
                    fullWidth
                    value={selectedDistributor.address}
                    onChange={handleDistributorChange}
                    variant="outlined"
                    error={!!formErrors.address}
                    helperText={formErrors.address}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="City"
                    name="city"
                    fullWidth
                    value={selectedDistributor.city}
                    onChange={handleDistributorChange}
                    variant="outlined"
                    error={!!formErrors.city}
                    helperText={formErrors.city}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth variant="outlined" error={!!formErrors.state}>
                    <InputLabel>State</InputLabel>
                    <Select
                      name="state"
                      value={selectedDistributor.state}
                      onChange={handleDistributorChange}
                      label="State"
                    >
                      {states.map((state) => (
                        <MenuItem key={state} value={state}>{state}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="ZIP Code"
                    name="zip_code"
                    fullWidth
                    value={selectedDistributor.zip_code}
                    onChange={handleDistributorChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Business Type</InputLabel>
                    <Select
                      name="business_type"
                      value={selectedDistributor.business_type}
                      onChange={handleDistributorChange}
                      label="Business Type"
                    >
                      {businessTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Payment Terms</InputLabel>
                    <Select
                      name="payment_terms"
                      value={selectedDistributor.payment_terms}
                      onChange={handleDistributorChange}
                      label="Payment Terms"
                    >
                      {paymentTerms.map((term) => (
                        <MenuItem key={term.value} value={term.value}>{term.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Credit Limit"
                    name="credit_limit"
                    type="number"
                    fullWidth
                    value={selectedDistributor.credit_limit}
                    onChange={handleDistributorChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={selectedDistributor.status}
                      onChange={handleDistributorChange}
                      label="Status"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="suspended">Suspended</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Notes"
                    name="notes"
                    fullWidth
                    multiline
                    rows={3}
                    value={selectedDistributor.notes || ''}
                    onChange={handleDistributorChange}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
              {formErrors.submit && <Alert severity="error" sx={{ mt: 2 }}>{formErrors.submit}</Alert>}
            </Box>
          )}
          {dialogType === 'view-distributor' && selectedDistributor && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Distributor Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Name:</strong> {selectedDistributor.name}</Typography>
                  <Typography variant="body2"><strong>Contact Person:</strong> {selectedDistributor.contact_person}</Typography>
                  <Typography variant="body2"><strong>Email:</strong> {selectedDistributor.email}</Typography>
                  <Typography variant="body2"><strong>Phone:</strong> {selectedDistributor.phone}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Business Type:</strong> {selectedDistributor.business_type}</Typography>
                  <Typography variant="body2"><strong>Status:</strong> {selectedDistributor.status}</Typography>
                  <Typography variant="body2"><strong>Credit Limit:</strong> ₦{(selectedDistributor.credit_limit || 0).toLocaleString()}</Typography>
                  <Typography variant="body2"><strong>Current Balance:</strong> ₦{(selectedDistributor.current_balance || 0).toLocaleString()}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'new-distributor' && (
            <Button variant="contained" onClick={handleSubmitDistributor} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Add Distributor'}
            </Button>
          )}
          {dialogType === 'edit-distributor' && (
            <Button variant="contained" onClick={handleSubmitDistributor} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Update Distributor'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DistributorManagement;
