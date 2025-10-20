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
  AttachMoney,
  Receipt,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Assessment,
  Timeline,
  Schedule,
  Person,
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
  LocationOn,
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
  Engineering,
  Business,
  LocalShipping,
  PriceCheck,
  Percent,
  CurrencyExchange,
  MonetizationOn,
  AccountBalance,
  CreditCard,
  Payment,
  Store,
  Storefront,
  ShoppingBag,
  ShoppingBasket,
  LocalOffer,
  LocalGroceryStore,
  Category,
  Label,
  Tag,
  Sell,
  PointOfSale,
  ReceiptLong,
  Calculate,
  Functions,
  TrendingFlat,
  ShowChart,
  BarChart,
  PieChart
} from '@mui/icons-material';
import axios from 'axios';

interface PricingManagementProps {
  selectedSection: string;
  userRole?: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  unit: string;
  base_cost: number;
  current_price: number;
  previous_price: number;
  markup_percentage: number;
  profit_margin: number;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: string;
  updated_at: string;
}

interface PriceHistory {
  id: number;
  product_id: number;
  product_name: string;
  old_price: number;
  new_price: number;
  change_reason: string;
  effective_date: string;
  changed_by: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface PricingRule {
  id: number;
  name: string;
  description: string;
  rule_type: 'markup' | 'discount' | 'promotion' | 'seasonal';
  condition: string;
  value: number;
  value_type: 'percentage' | 'fixed';
  applicable_products: number[];
  applicable_customers: string[];
  start_date: string;
  end_date?: string;
  status: 'active' | 'inactive' | 'expired';
  created_at: string;
  updated_at: string;
}

interface CustomerSegment {
  id: number;
  name: string;
  description: string;
  discount_percentage: number;
  minimum_order_value: number;
  customer_count: number;
  status: 'active' | 'inactive';
  created_at: string;
}

interface PriceModel {
  id: number;
  name: string;
  description: string;
  base_price: number;
  min_quantity: number;
  max_quantity: number;
  customer_type: 'general' | 'distributor' | 'non_distributor' | 'driver_dispatch' | 'store_dispatch';
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

const PricingManagement: React.FC<PricingManagementProps> = ({ selectedSection, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);
  const [priceModels, setPriceModels] = useState<PriceModel[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedRule, setSelectedRule] = useState<PricingRule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    category: '',
    unit: 'bag',
    base_cost: 0,
    current_price: 0,
    markup_percentage: 0,
    status: 'active'
  });
  const [newRule, setNewRule] = useState<Partial<PricingRule>>({
    name: '',
    description: '',
    rule_type: 'markup',
    condition: '',
    value: 0,
    value_type: 'percentage',
    applicable_products: [],
    applicable_customers: [],
    start_date: new Date().toISOString().split('T')[0],
    status: 'active'
  });
  const [newPriceModel, setNewPriceModel] = useState<Partial<PriceModel>>({
    name: '',
    description: '',
    base_price: 0,
    min_quantity: 1,
    max_quantity: 999999,
    customer_type: 'general',
    is_active: true
  });
  const [formErrors, setFormErrors] = useState<any>({});

  const productCategories = [
    'Sachet Water',
    'Water Bottles',
    'Water Dispensers',
    'Accessories',
    'Cleaning Supplies',
    'Packaging Materials'
  ];

  const customerTypes = [
    { value: 'general', label: 'General Sales' },
    { value: 'distributor', label: 'Distributor' },
    { value: 'non_distributor', label: 'Non-Distributor Pickup' },
    { value: 'driver_dispatch', label: 'Driver Dispatch' },
    { value: 'store_dispatch', label: 'Store Dispatch' }
  ];

  const units = [
    'bag',
    'carton',
    'bottle',
    'pack',
    'piece',
    'liter',
    'gallon'
  ];

  const ruleTypes = [
    { value: 'markup', label: 'Markup Rule' },
    { value: 'discount', label: 'Discount Rule' },
    { value: 'promotion', label: 'Promotion Rule' },
    { value: 'seasonal', label: 'Seasonal Rule' }
  ];

  const valueTypes = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'fixed', label: 'Fixed Amount (₦)' }
  ];

  useEffect(() => {
    fetchData();
  }, [selectedSection]);

  const getMockPriceModels = (): PriceModel[] => [
    {
      id: 1,
      name: 'General Sales - Standard',
      description: 'Standard pricing for general sales',
      base_price: 300,
      min_quantity: 1,
      max_quantity: 49,
      customer_type: 'general',
      is_active: true,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'General Sales - Bulk',
      description: 'Bulk pricing for general sales (50+ bags)',
      base_price: 280,
      min_quantity: 50,
      max_quantity: 999999,
      customer_type: 'general',
      is_active: true,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Distributor - Small Order',
      description: 'Pricing for distributor orders under 50 bags',
      base_price: 240,
      min_quantity: 1,
      max_quantity: 49,
      customer_type: 'distributor',
      is_active: true,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Distributor - Large Order',
      description: 'Pricing for distributor orders 50+ bags',
      base_price: 200,
      min_quantity: 50,
      max_quantity: 999999,
      customer_type: 'distributor',
      is_active: true,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      name: 'Driver Dispatch',
      description: 'Pricing for driver dispatch sales (commission based)',
      base_price: 270,
      min_quantity: 1,
      max_quantity: 999999,
      customer_type: 'driver_dispatch',
      is_active: true,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 6,
      name: 'Store Dispatch',
      description: 'No pricing for store dispatch (stocking only)',
      base_price: 0,
      min_quantity: 1,
      max_quantity: 999999,
      customer_type: 'store_dispatch',
      is_active: true,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mock data for products
      const mockProducts: Product[] = [
        {
          id: 1,
          name: 'Sachet Water',
          description: 'Pure water sachets',
          category: 'Sachet Water',
          unit: 'bag',
          base_cost: 100,
          current_price: 150,
          previous_price: 140,
          markup_percentage: 50,
          profit_margin: 33.33,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-10-15T00:00:00Z'
        },
        {
          id: 2,
          name: 'Sachet Water',
          description: 'Pure water sachets',
          category: 'Sachet Water',
          unit: 'bag',
          base_cost: 180,
          current_price: 250,
          previous_price: 240,
          markup_percentage: 38.89,
          profit_margin: 28,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-10-10T00:00:00Z'
        },
        {
          id: 3,
          name: 'Water Bottles (500ml)',
          description: 'Plastic water bottles, 500ml each',
          category: 'Water Bottles',
          unit: 'bottle',
          base_cost: 120,
          current_price: 200,
          previous_price: 200,
          markup_percentage: 66.67,
          profit_margin: 40,
          status: 'active',
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-09-20T00:00:00Z'
        },
        {
          id: 4,
          name: 'Water Bottles (1.5L)',
          description: 'Plastic water bottles, 1.5 liters each',
          category: 'Water Bottles',
          unit: 'bottle',
          base_cost: 200,
          current_price: 350,
          previous_price: 320,
          markup_percentage: 75,
          profit_margin: 42.86,
          status: 'active',
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-10-05T00:00:00Z'
        },
        {
          id: 5,
          name: 'Water Dispenser (20L)',
          description: 'Large water dispenser, 20 liters',
          category: 'Water Dispensers',
          unit: 'piece',
          base_cost: 800,
          current_price: 1200,
          previous_price: 1200,
          markup_percentage: 50,
          profit_margin: 33.33,
          status: 'active',
          created_at: '2024-02-01T00:00:00Z',
          updated_at: '2024-08-15T00:00:00Z'
        }
      ];

      const mockPriceHistory: PriceHistory[] = [
        {
          id: 1,
          product_id: 1,
          product_name: 'Sachet Water',
          old_price: 140,
          new_price: 150,
          change_reason: 'Increased production costs',
          effective_date: '2024-10-15',
          changed_by: 'Manager',
          approved_by: 'Director',
          status: 'approved',
          created_at: '2024-10-15T00:00:00Z'
        },
        {
          id: 2,
          product_id: 2,
          product_name: 'Sachet Water',
          old_price: 240,
          new_price: 250,
          change_reason: 'Market adjustment',
          effective_date: '2024-10-10',
          changed_by: 'Manager',
          approved_by: 'Director',
          status: 'approved',
          created_at: '2024-10-10T00:00:00Z'
        },
        {
          id: 3,
          product_id: 4,
          product_name: 'Water Bottles (1.5L)',
          old_price: 320,
          new_price: 350,
          change_reason: 'Raw material cost increase',
          effective_date: '2024-10-05',
          changed_by: 'Manager',
          status: 'pending',
          created_at: '2024-10-05T00:00:00Z'
        }
      ];

      const mockPricingRules: PricingRule[] = [
        {
          id: 1,
          name: 'Wholesale Discount',
          description: '10% discount for wholesale customers',
          rule_type: 'discount',
          condition: 'order_quantity >= 100',
          value: 10,
          value_type: 'percentage',
          applicable_products: [1, 2, 3, 4],
          applicable_customers: ['wholesale'],
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Seasonal Promotion',
          description: '5% discount during dry season',
          rule_type: 'promotion',
          condition: 'season == "dry"',
          value: 5,
          value_type: 'percentage',
          applicable_products: [1, 2],
          applicable_customers: ['all'],
          start_date: '2024-11-01',
          end_date: '2024-12-31',
          status: 'active',
          created_at: '2024-10-01T00:00:00Z',
          updated_at: '2024-10-01T00:00:00Z'
        }
      ];

      const mockCustomerSegments: CustomerSegment[] = [
        {
          id: 1,
          name: 'Wholesale Customers',
          description: 'Large volume customers',
          discount_percentage: 10,
          minimum_order_value: 50000,
          customer_count: 15,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Retail Customers',
          description: 'Small volume customers',
          discount_percentage: 0,
          minimum_order_value: 0,
          customer_count: 45,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'VIP Customers',
          description: 'Premium customers with special rates',
          discount_percentage: 15,
          minimum_order_value: 100000,
          customer_count: 8,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      setProducts(mockProducts);
      setPriceHistory(mockPriceHistory);
      setPricingRules(mockPricingRules);
      setCustomerSegments(mockCustomerSegments);

      // Fetch price models from API
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const response = await fetch('http://localhost:3001/api/price-models', { headers });
        if (response.ok) {
          const data = await response.json();
          setPriceModels(data.data || []);
        } else {
          // Fallback to mock data
          setPriceModels(getMockPriceModels());
        }
      } catch (error) {
        console.error('Error fetching price models:', error);
        setPriceModels(getMockPriceModels());
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

  const handleOpenDialog = (type: string, item?: Product | PricingRule | PriceModel) => {
    setDialogType(type);
    if (item && 'category' in item) {
      setSelectedProduct(item as Product);
      // Populate form with selected product data for editing
      if (type === 'edit-product') {
        setNewProduct({
          name: (item as Product).name,
          description: (item as Product).description,
          category: (item as Product).category,
          unit: (item as Product).unit,
          base_cost: (item as Product).base_cost,
          current_price: (item as Product).current_price,
          markup_percentage: (item as Product).markup_percentage,
          status: (item as Product).status
        });
      }
    } else if (item && 'rule_type' in item) {
      setSelectedRule(item as PricingRule);
    } else if (item && 'customer_type' in item) {
      setSelectedProduct(item as any); // Store price model in selectedProduct for now
    } else {
      setSelectedProduct(null);
      setSelectedRule(null);
    }
    
    if (type === 'new-product') {
      setNewProduct({
        name: '',
        description: '',
        category: '',
        unit: 'bag',
        base_cost: 0,
        current_price: 0,
        markup_percentage: 0,
        status: 'active'
      });
    } else if (type === 'new-rule') {
      setNewRule({
        name: '',
        description: '',
        rule_type: 'markup',
        condition: '',
        value: 0,
        value_type: 'percentage',
        applicable_products: [],
        applicable_customers: [],
        start_date: new Date().toISOString().split('T')[0],
        status: 'active'
      });
    } else if (type === 'new-price-model') {
      setNewPriceModel({
        name: '',
        description: '',
        base_price: 0,
        min_quantity: 1,
        max_quantity: 999999,
        customer_type: 'general',
        is_active: true
      });
    } else if (type === 'edit-price-model' && item) {
      const priceModel = item as PriceModel;
      setNewPriceModel({
        name: priceModel.name,
        description: priceModel.description,
        base_price: priceModel.base_price,
        min_quantity: priceModel.min_quantity,
        max_quantity: priceModel.max_quantity,
        customer_type: priceModel.customer_type,
        is_active: priceModel.is_active
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setSelectedProduct(null);
    setSelectedRule(null);
    setNewPriceModel({
      name: '',
      description: '',
      base_price: 0,
      min_quantity: 1,
      max_quantity: 999999,
      customer_type: 'general',
      is_active: true
    });
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setNewProduct((prev: any) => {
      const updated = { ...prev, [name]: value };
      
      // Auto-calculate markup percentage when base cost or current price changes
      if (name === 'base_cost' || name === 'current_price') {
        const baseCost = parseFloat(updated.base_cost) || 0;
        const currentPrice = parseFloat(updated.current_price) || 0;
        if (baseCost > 0) {
          updated.markup_percentage = ((currentPrice - baseCost) / baseCost) * 100;
          updated.profit_margin = ((currentPrice - baseCost) / currentPrice) * 100;
        }
      }
      
      return updated;
    });
  };

  const handleRuleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setNewRule((prev: any) => ({ ...prev, [name]: value }));
  };

  const handlePriceModelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setNewPriceModel((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCreatePriceModel = async () => {
    if (!validatePriceModelForm()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/price-models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newPriceModel,
          created_by: 1, // This should come from auth context
          userEmail: 'director@matsplash.com' // This should come from auth context
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Price model created successfully:', result);
        await fetchData(); // Refresh the data
        handleCloseDialog();
        setNewPriceModel({
          name: '',
          description: '',
          base_price: 0,
          min_quantity: 1,
          max_quantity: 999999,
          customer_type: 'general',
          is_active: true
        });
      } else {
        const errorData = await response.json();
        console.error('Failed to create price model:', errorData);
      }
    } catch (error) {
      console.error('Error creating price model:', error);
    }
  };

  const handleUpdatePriceModel = async () => {
    if (!validatePriceModelForm()) {
      return;
    }

    try {
      if (!selectedProduct || !selectedProduct.id) {
        console.error('No price model selected for update');
        return;
      }

      console.log('Updating price model:', selectedProduct.id, newPriceModel);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/price-models/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newPriceModel,
          updated_by: 1, // This should come from auth context
          userEmail: 'director@matsplash.com' // This should come from auth context
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Price model updated successfully:', result);
        await fetchData(); // Refresh the data
        handleCloseDialog();
      } else {
        const errorData = await response.json();
        console.error('Failed to update price model:', errorData);
      }
    } catch (error) {
      console.error('Error updating price model:', error);
    }
  };

  const handleDeletePriceModel = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this price model?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3001/api/price-models/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            deleted_by: 1, // This should come from auth context
            userEmail: 'director@matsplash.com' // This should come from auth context
          })
        });

        if (response.ok) {
          await fetchData(); // Refresh the data
        } else {
          console.error('Failed to delete price model');
        }
      } catch (error) {
        console.error('Error deleting price model:', error);
      }
    }
  };

  const validateProductForm = () => {
    const errors: any = {};
    if (!newProduct.name) errors.name = 'Product name is required';
    if (!newProduct.category) errors.category = 'Category is required';
    if (!newProduct.base_cost || newProduct.base_cost <= 0) errors.base_cost = 'Base cost must be greater than 0';
    if (!newProduct.current_price || newProduct.current_price <= 0) errors.current_price = 'Current price must be greater than 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePriceModelForm = () => {
    const errors: any = {};
    if (!newPriceModel.name) errors.name = 'Price model name is required';
    if (!newPriceModel.customer_type) errors.customer_type = 'Customer type is required';
    if (!newPriceModel.base_price || newPriceModel.base_price < 0) errors.base_price = 'Base price must be 0 or greater';
    if (!newPriceModel.min_quantity || newPriceModel.min_quantity < 1) errors.min_quantity = 'Minimum quantity must be at least 1';
    if (!newPriceModel.max_quantity || newPriceModel.max_quantity < newPriceModel.min_quantity) errors.max_quantity = 'Maximum quantity must be greater than minimum quantity';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRuleForm = () => {
    const errors: any = {};
    if (!newRule.name) errors.name = 'Rule name is required';
    if (!newRule.description) errors.description = 'Description is required';
    if (!newRule.value || newRule.value <= 0) errors.value = 'Value must be greater than 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitProduct = async () => {
    if (!validateProductForm()) return;

    setLoading(true);
    try {
      // Here you would make API call to save product
      console.log('Saving product:', newProduct);
      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving product:', error);
      setFormErrors({ submit: 'Failed to save product. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRule = async () => {
    if (!validateRuleForm()) return;

    setLoading(true);
    try {
      // Here you would make API call to save pricing rule
      console.log('Saving pricing rule:', newRule);
      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving pricing rule:', error);
      setFormErrors({ submit: 'Failed to save pricing rule. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'discontinued': return 'error';
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const getPriceChangeIcon = (oldPrice: number, newPrice: number) => {
    if (newPrice > oldPrice) return <TrendingUp sx={{ color: '#f44336' }} />;
    if (newPrice < oldPrice) return <TrendingDown sx={{ color: '#4caf50' }} />;
    return <TrendingFlat sx={{ color: '#666' }} />;
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const renderProductsList = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Product Pricing
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('new-product')}
          sx={{ bgcolor: '#13bbc6' }}
        >
          Add Product
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#4caf50', mr: 2 }}>
                  <Inventory />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {products.filter(p => p.status === 'active').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Products
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
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    ₦{products.reduce((sum, p) => sum + p.current_price, 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Product Value
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
                  <Percent />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {products.length > 0 ? (products.reduce((sum, p) => sum + p.profit_margin, 0) / products.length).toFixed(1) : 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Profit Margin
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
                <Avatar sx={{ bgcolor: '#9c27b0', mr: 2 }}>
                  <PriceCheck />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    {priceHistory.filter(h => h.status === 'pending').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Price Changes
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
                label="Search Products"
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
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {productCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                  <MenuItem value="discontinued">Discontinued</MenuItem>
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
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Base Cost</TableCell>
                  <TableCell>Current Price</TableCell>
                  <TableCell>Markup %</TableCell>
                  <TableCell>Profit Margin</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={product.category} 
                        color="info"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        ₦{product.base_cost.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="bold">
                          ₦{product.current_price.toLocaleString()}
                        </Typography>
                        {product.current_price !== product.previous_price && (
                          <Box sx={{ ml: 1 }}>
                            {getPriceChangeIcon(product.previous_price, product.current_price)}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {product.markup_percentage.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {product.profit_margin.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={product.status.charAt(0).toUpperCase() + product.status.slice(1)} 
                        color={getStatusColor(product.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleOpenDialog('view-product', product)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Product">
                        <IconButton size="small" onClick={() => handleOpenDialog('edit-product', product)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Price History">
                        <IconButton size="small" onClick={() => handleOpenDialog('price-history', product)}>
                          <History />
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

  const renderPriceModelsList = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Price Models
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('new-price-model')}
          sx={{ bgcolor: '#13bbc6' }}
          className="dashboard-button"
        >
          Add Price Model
        </Button>
      </Box>

      <Card className="dashboard-card">
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Customer Type</TableCell>
                  <TableCell>Base Price</TableCell>
                  <TableCell>Quantity Range</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {priceModels.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {model.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {model.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={customerTypes.find(ct => ct.value === model.customer_type)?.label || model.customer_type}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        ₦{model.base_price.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {model.min_quantity} - {model.max_quantity === 999999 ? '∞' : model.max_quantity} bags
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={model.is_active ? 'Active' : 'Inactive'} 
                        color={model.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit Price Model">
                        <IconButton size="small" onClick={() => handleOpenDialog('edit-price-model', model)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Price Model">
                        <IconButton size="small" onClick={() => handleDeletePriceModel(model.id)}>
                          <Delete />
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

    return (
      <Box>
        <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Product Pricing" />
          <Tab label="Price Models" />
        </Tabs>

        {selectedTab === 0 && renderProductsList()}
        {selectedTab === 1 && renderPriceModelsList()}
      </Box>
    );
  };

  return (
    <Box>
      {renderContent()}
      
      {/* Dialog for various actions */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'new-product' && 'Add New Product'}
          {dialogType === 'edit-product' && 'Edit Product'}
          {dialogType === 'view-product' && 'Product Details'}
          {dialogType === 'price-history' && 'Price History'}
          {dialogType === 'new-price-model' && 'Add New Price Model'}
          {dialogType === 'edit-price-model' && 'Edit Price Model'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'new-product' && (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Product Name"
                    name="name"
                    fullWidth
                    value={newProduct.name}
                    onChange={handleProductChange}
                    variant="outlined"
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined" error={!!formErrors.category}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={newProduct.category}
                      onChange={handleProductChange}
                      label="Category"
                    >
                      {productCategories.map((category) => (
                        <MenuItem key={category} value={category}>{category}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    name="description"
                    fullWidth
                    multiline
                    rows={2}
                    value={newProduct.description}
                    onChange={handleProductChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Unit</InputLabel>
                    <Select
                      name="unit"
                      value={newProduct.unit}
                      onChange={handleProductChange}
                      label="Unit"
                    >
                      {units.map((unit) => (
                        <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={newProduct.status}
                      onChange={handleProductChange}
                      label="Status"
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="discontinued">Discontinued</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Base Cost (₦)"
                    name="base_cost"
                    type="number"
                    fullWidth
                    value={newProduct.base_cost}
                    onChange={handleProductChange}
                    variant="outlined"
                    error={!!formErrors.base_cost}
                    helperText={formErrors.base_cost}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Current Price (₦)"
                    name="current_price"
                    type="number"
                    fullWidth
                    value={newProduct.current_price}
                    onChange={handleProductChange}
                    variant="outlined"
                    error={!!formErrors.current_price}
                    helperText={formErrors.current_price}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Markup Percentage (%)"
                    name="markup_percentage"
                    type="number"
                    fullWidth
                    value={newProduct.markup_percentage}
                    onChange={handleProductChange}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Profit Margin (%)"
                    name="profit_margin"
                    type="number"
                    fullWidth
                    value={newProduct.profit_margin}
                    onChange={handleProductChange}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
              {formErrors.submit && <Alert severity="error" sx={{ mt: 2 }}>{formErrors.submit}</Alert>}
            </Box>
          )}
          {dialogType === 'edit-product' && selectedProduct && (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Product Name"
                    name="name"
                    fullWidth
                    value={selectedProduct.name}
                    onChange={handleProductChange}
                    variant="outlined"
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined" error={!!formErrors.category}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={selectedProduct.category}
                      onChange={handleProductChange}
                      label="Category"
                    >
                      {productCategories.map((category) => (
                        <MenuItem key={category} value={category}>{category}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    name="description"
                    fullWidth
                    multiline
                    rows={2}
                    value={selectedProduct.description}
                    onChange={handleProductChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Unit</InputLabel>
                    <Select
                      name="unit"
                      value={selectedProduct.unit}
                      onChange={handleProductChange}
                      label="Unit"
                    >
                      {units.map((unit) => (
                        <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={selectedProduct.status}
                      onChange={handleProductChange}
                      label="Status"
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="discontinued">Discontinued</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Base Cost (₦)"
                    name="base_cost"
                    type="number"
                    fullWidth
                    value={selectedProduct.base_cost}
                    onChange={handleProductChange}
                    variant="outlined"
                    error={!!formErrors.base_cost}
                    helperText={formErrors.base_cost}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Current Price (₦)"
                    name="current_price"
                    type="number"
                    fullWidth
                    value={selectedProduct.current_price}
                    onChange={handleProductChange}
                    variant="outlined"
                    error={!!formErrors.current_price}
                    helperText={formErrors.current_price}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Minimum Stock"
                    name="min_stock"
                    type="number"
                    fullWidth
                    value={selectedProduct.min_stock}
                    onChange={handleProductChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Maximum Stock"
                    name="max_stock"
                    type="number"
                    fullWidth
                    value={selectedProduct.max_stock}
                    onChange={handleProductChange}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
              {formErrors.submit && <Alert severity="error" sx={{ mt: 2 }}>{formErrors.submit}</Alert>}
            </Box>
          )}
          {dialogType === 'view-product' && selectedProduct && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Product Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Name:</strong> {selectedProduct.name}</Typography>
                  <Typography variant="body2"><strong>Category:</strong> {selectedProduct.category}</Typography>
                  <Typography variant="body2"><strong>Unit:</strong> {selectedProduct.unit}</Typography>
                  <Typography variant="body2"><strong>Status:</strong> {selectedProduct.status}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Base Cost:</strong> ₦{selectedProduct.base_cost.toLocaleString()}</Typography>
                  <Typography variant="body2"><strong>Current Price:</strong> ₦{selectedProduct.current_price.toLocaleString()}</Typography>
                  <Typography variant="body2"><strong>Markup:</strong> {selectedProduct.markup_percentage.toFixed(1)}%</Typography>
                  <Typography variant="body2"><strong>Profit Margin:</strong> {selectedProduct.profit_margin.toFixed(1)}%</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2"><strong>Description:</strong> {selectedProduct.description}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
          {(dialogType === 'new-price-model' || dialogType === 'edit-price-model') && (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Price Model Name"
                    name="name"
                    fullWidth
                    value={newPriceModel.name}
                    onChange={handlePriceModelChange}
                    variant="outlined"
                    required
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined" error={!!formErrors.customer_type}>
                    <InputLabel>Customer Type</InputLabel>
                    <Select
                      name="customer_type"
                      value={newPriceModel.customer_type}
                      onChange={handlePriceModelChange}
                      label="Customer Type"
                    >
                      {customerTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.customer_type && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                        {formErrors.customer_type}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    name="description"
                    fullWidth
                    multiline
                    rows={2}
                    value={newPriceModel.description}
                    onChange={handlePriceModelChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Base Price (₦)"
                    name="base_price"
                    type="number"
                    fullWidth
                    value={newPriceModel.base_price}
                    onChange={handlePriceModelChange}
                    variant="outlined"
                    required
                    error={!!formErrors.base_price}
                    helperText={formErrors.base_price}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Minimum Quantity"
                    name="min_quantity"
                    type="number"
                    fullWidth
                    value={newPriceModel.min_quantity}
                    onChange={handlePriceModelChange}
                    variant="outlined"
                    required
                    error={!!formErrors.min_quantity}
                    helperText={formErrors.min_quantity}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Maximum Quantity"
                    name="max_quantity"
                    type="number"
                    fullWidth
                    value={newPriceModel.max_quantity}
                    onChange={handlePriceModelChange}
                    variant="outlined"
                    required
                    error={!!formErrors.max_quantity}
                    helperText={formErrors.max_quantity}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="is_active"
                        checked={newPriceModel.is_active}
                        onChange={(e) => setNewPriceModel(prev => ({ ...prev, is_active: e.target.checked }))}
                      />
                    }
                    label="Active"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'new-product' && (
            <Button variant="contained" onClick={handleSubmitProduct} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Add Product'}
            </Button>
          )}
          {dialogType === 'edit-product' && (
            <Button variant="contained" onClick={handleSubmitProduct} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Update Product'}
            </Button>
          )}
          {dialogType === 'new-price-model' && (
            <Button variant="contained" onClick={handleCreatePriceModel} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Add Price Model'}
            </Button>
          )}
          {dialogType === 'edit-price-model' && (
            <Button variant="contained" onClick={handleUpdatePriceModel} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Update Price Model'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PricingManagement;
