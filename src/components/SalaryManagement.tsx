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
  SelectChangeEvent,
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
  AccordionDetails,
  DatePicker,
  LocalizationProvider
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
  Euro,
  Dollar,
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
  PieChart,
  LineChart,
  AccountBalanceWallet,
  Savings,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Money,
  Paid,
  RequestQuote,
  RequestPage,
  Description,
  Article,
  Assignment,
  AssignmentInd,
  AssignmentTurnedIn,
  AssignmentLate,
  AssignmentReturn,
  AssignmentReturned,
  AssignmentLateOutlined,
  AssignmentTurnedInOutlined,
  AssignmentIndOutlined,
  AssignmentOutlined,
  AssignmentReturnedOutlined,
  AssignmentReturnOutlined,
  AssignmentLateOutlined as AssignmentLateIcon,
  AssignmentTurnedInOutlined as AssignmentTurnedInIcon,
  AssignmentIndOutlined as AssignmentIndIcon,
  AssignmentOutlined as AssignmentIcon,
  AssignmentReturnedOutlined as AssignmentReturnedIcon,
  AssignmentReturnOutlined as AssignmentReturnIcon
} from '@mui/icons-material';
import axios from 'axios';

interface SalaryManagementProps {
  selectedSection: string;
  userRole?: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  base_salary: number;
  hourly_rate: number;
  employment_type: 'full-time' | 'part-time' | 'contract';
  hire_date: string;
  status: 'active' | 'inactive' | 'terminated';
}

interface SalaryRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_role: string;
  pay_period_start: string;
  pay_period_end: string;
  base_salary: number;
  overtime_hours: number;
  overtime_rate: number;
  overtime_pay: number;
  commission_amount: number;
  bonus_amount: number;
  deductions: number;
  allowances: number;
  gross_salary: number;
  net_salary: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  payment_date?: string;
  payment_method: 'bank_transfer' | 'cash' | 'cheque';
  created_at: string;
  updated_at: string;
}

interface CommissionRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_role: string;
  commission_type: 'sales' | 'performance' | 'bonus' | 'incentive';
  amount: number;
  percentage: number;
  base_amount: number;
  period: string;
  description: string;
  status: 'pending' | 'approved' | 'paid';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

interface PayrollSummary {
  total_employees: number;
  total_gross_salary: number;
  total_deductions: number;
  total_net_salary: number;
  total_commission: number;
  total_bonus: number;
  pending_payments: number;
  paid_payments: number;
}

const SalaryManagement: React.FC<SalaryManagementProps> = ({ selectedSection, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [commissionRecords, setCommissionRecords] = useState<CommissionRecord[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedSalaryRecord, setSelectedSalaryRecord] = useState<SalaryRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payPeriodFilter, setPayPeriodFilter] = useState('current');
  const [newSalaryRecord, setNewSalaryRecord] = useState<Partial<SalaryRecord>>({
    employee_id: 0,
    pay_period_start: '',
    pay_period_end: '',
    base_salary: 0,
    overtime_hours: 0,
    overtime_rate: 0,
    overtime_pay: 0,
    commission_amount: 0,
    bonus_amount: 0,
    deductions: 0,
    allowances: 0,
    gross_salary: 0,
    net_salary: 0,
    status: 'pending',
    payment_method: 'bank_transfer'
  });
  const [newCommissionRecord, setNewCommissionRecord] = useState<Partial<CommissionRecord>>({
    employee_id: 0,
    commission_type: 'sales',
    amount: 0,
    percentage: 0,
    base_amount: 0,
    period: '',
    description: '',
    status: 'pending'
  });
  const [formErrors, setFormErrors] = useState<any>({});

  const employmentTypes = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' }
  ];

  const commissionTypes = [
    { value: 'sales', label: 'Sales Commission' },
    { value: 'performance', label: 'Performance Bonus' },
    { value: 'bonus', label: 'Special Bonus' },
    { value: 'incentive', label: 'Incentive' }
  ];

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'cheque', label: 'Cheque' }
  ];

  const payPeriods = [
    { value: 'current', label: 'Current Month' },
    { value: 'last', label: 'Last Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Periods' }
  ];

  useEffect(() => {
    fetchData();
  }, [selectedSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mock data for employees
      const mockEmployees: Employee[] = [
        {
          id: 1,
          name: 'John Adebayo',
          email: 'john@matsplash.com',
          role: 'Manager',
          department: 'Management',
          base_salary: 150000,
          hourly_rate: 2000,
          employment_type: 'full-time',
          hire_date: '2024-01-15',
          status: 'active'
        },
        {
          id: 2,
          name: 'Mary Okonkwo',
          email: 'mary@matsplash.com',
          role: 'Receptionist',
          department: 'Operations',
          base_salary: 80000,
          hourly_rate: 1000,
          employment_type: 'full-time',
          hire_date: '2024-02-20',
          status: 'active'
        },
        {
          id: 3,
          name: 'Ahmed Ibrahim',
          email: 'ahmed@matsplash.com',
          role: 'Driver',
          department: 'Logistics',
          base_salary: 70000,
          hourly_rate: 800,
          employment_type: 'full-time',
          hire_date: '2024-03-10',
          status: 'active'
        },
        {
          id: 4,
          name: 'Grace Okafor',
          email: 'grace@matsplash.com',
          role: 'Sales',
          department: 'Sales',
          base_salary: 90000,
          hourly_rate: 1200,
          employment_type: 'full-time',
          hire_date: '2024-04-05',
          status: 'active'
        },
        {
          id: 5,
          name: 'Peter Johnson',
          email: 'peter@matsplash.com',
          role: 'Packer',
          department: 'Operations',
          base_salary: 60000,
          hourly_rate: 700,
          employment_type: 'full-time',
          hire_date: '2024-05-12',
          status: 'active'
        }
      ];

      const mockSalaryRecords: SalaryRecord[] = [
        {
          id: 1,
          employee_id: 1,
          employee_name: 'John Adebayo',
          employee_role: 'Manager',
          pay_period_start: '2024-10-01',
          pay_period_end: '2024-10-31',
          base_salary: 150000,
          overtime_hours: 8,
          overtime_rate: 3000,
          overtime_pay: 24000,
          commission_amount: 0,
          bonus_amount: 25000,
          deductions: 15000,
          allowances: 10000,
          gross_salary: 199000,
          net_salary: 194000,
          status: 'paid',
          payment_date: '2024-11-01',
          payment_method: 'bank_transfer',
          created_at: '2024-10-31T00:00:00Z',
          updated_at: '2024-11-01T00:00:00Z'
        },
        {
          id: 2,
          employee_id: 2,
          employee_name: 'Mary Okonkwo',
          employee_role: 'Receptionist',
          pay_period_start: '2024-10-01',
          pay_period_end: '2024-10-31',
          base_salary: 80000,
          overtime_hours: 4,
          overtime_rate: 1500,
          overtime_pay: 6000,
          commission_amount: 0,
          bonus_amount: 5000,
          deductions: 8000,
          allowances: 5000,
          gross_salary: 96000,
          net_salary: 93000,
          status: 'paid',
          payment_date: '2024-11-01',
          payment_method: 'bank_transfer',
          created_at: '2024-10-31T00:00:00Z',
          updated_at: '2024-11-01T00:00:00Z'
        },
        {
          id: 3,
          employee_id: 3,
          employee_name: 'Ahmed Ibrahim',
          employee_role: 'Driver',
          pay_period_start: '2024-10-01',
          pay_period_end: '2024-10-31',
          base_salary: 70000,
          overtime_hours: 12,
          overtime_rate: 1200,
          overtime_pay: 14400,
          commission_amount: 0,
          bonus_amount: 3000,
          deductions: 7000,
          allowances: 3000,
          gross_salary: 90400,
          net_salary: 86400,
          status: 'paid',
          payment_date: '2024-11-01',
          payment_method: 'bank_transfer',
          created_at: '2024-10-31T00:00:00Z',
          updated_at: '2024-11-01T00:00:00Z'
        },
        {
          id: 4,
          employee_id: 4,
          employee_name: 'Grace Okafor',
          employee_role: 'Sales',
          pay_period_start: '2024-10-01',
          pay_period_end: '2024-10-31',
          base_salary: 90000,
          overtime_hours: 6,
          overtime_rate: 1800,
          overtime_pay: 10800,
          commission_amount: 15000,
          bonus_amount: 8000,
          deductions: 9000,
          allowances: 6000,
          gross_salary: 120800,
          net_salary: 117800,
          status: 'paid',
          payment_date: '2024-11-01',
          payment_method: 'bank_transfer',
          created_at: '2024-10-31T00:00:00Z',
          updated_at: '2024-11-01T00:00:00Z'
        },
        {
          id: 5,
          employee_id: 5,
          employee_name: 'Peter Johnson',
          employee_role: 'Packer',
          pay_period_start: '2024-10-01',
          pay_period_end: '2024-10-31',
          base_salary: 60000,
          overtime_hours: 10,
          overtime_rate: 1050,
          overtime_pay: 10500,
          commission_amount: 0,
          bonus_amount: 2000,
          deductions: 6000,
          allowances: 2000,
          gross_salary: 75500,
          net_salary: 71500,
          status: 'pending',
          payment_method: 'bank_transfer',
          created_at: '2024-10-31T00:00:00Z',
          updated_at: '2024-10-31T00:00:00Z'
        }
      ];

      const mockCommissionRecords: CommissionRecord[] = [
        {
          id: 1,
          employee_id: 4,
          employee_name: 'Grace Okafor',
          employee_role: 'Sales',
          commission_type: 'sales',
          amount: 15000,
          percentage: 5,
          base_amount: 300000,
          period: 'October 2024',
          description: 'Sales commission for October 2024',
          status: 'paid',
          approved_by: 'Manager',
          approved_at: '2024-10-31T00:00:00Z',
          created_at: '2024-10-31T00:00:00Z'
        },
        {
          id: 2,
          employee_id: 1,
          employee_name: 'John Adebayo',
          employee_role: 'Manager',
          commission_type: 'performance',
          amount: 25000,
          percentage: 0,
          base_amount: 0,
          period: 'October 2024',
          description: 'Performance bonus for exceeding targets',
          status: 'paid',
          approved_by: 'Director',
          approved_at: '2024-10-31T00:00:00Z',
          created_at: '2024-10-31T00:00:00Z'
        },
        {
          id: 3,
          employee_id: 2,
          employee_name: 'Mary Okonkwo',
          employee_role: 'Receptionist',
          commission_type: 'bonus',
          amount: 5000,
          percentage: 0,
          base_amount: 0,
          period: 'October 2024',
          description: 'Customer service excellence bonus',
          status: 'paid',
          approved_by: 'Manager',
          approved_at: '2024-10-31T00:00:00Z',
          created_at: '2024-10-31T00:00:00Z'
        }
      ];

      const mockPayrollSummary: PayrollSummary = {
        total_employees: 5,
        total_gross_salary: 581700,
        total_deductions: 45000,
        total_net_salary: 536700,
        total_commission: 15000,
        total_bonus: 43000,
        pending_payments: 1,
        paid_payments: 4
      };

      setEmployees(mockEmployees);
      setSalaryRecords(mockSalaryRecords);
      setCommissionRecords(mockCommissionRecords);
      setPayrollSummary(mockPayrollSummary);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleOpenDialog = (type: string, item?: Employee | SalaryRecord | CommissionRecord) => {
    setDialogType(type);
    if (item && 'base_salary' in item) {
      setSelectedEmployee(item as Employee);
    } else if (item && 'pay_period_start' in item) {
      setSelectedSalaryRecord(item as SalaryRecord);
    } else {
      setSelectedEmployee(null);
      setSelectedSalaryRecord(null);
    }
    
    if (type === 'new-salary') {
      setNewSalaryRecord({
        employee_id: 0,
        pay_period_start: '',
        pay_period_end: '',
        base_salary: 0,
        overtime_hours: 0,
        overtime_rate: 0,
        overtime_pay: 0,
        commission_amount: 0,
        bonus_amount: 0,
        deductions: 0,
        allowances: 0,
        gross_salary: 0,
        net_salary: 0,
        status: 'pending',
        payment_method: 'bank_transfer'
      });
    } else if (type === 'new-commission') {
      setNewCommissionRecord({
        employee_id: 0,
        commission_type: 'sales',
        amount: 0,
        percentage: 0,
        base_amount: 0,
        period: '',
        description: '',
        status: 'pending'
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setSelectedEmployee(null);
    setSelectedSalaryRecord(null);
  };

  const handleSalaryRecordChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setNewSalaryRecord((prev: any) => {
      const updated = { ...prev, [name]: value };
      
      // Auto-calculate overtime pay
      if (name === 'overtime_hours' || name === 'overtime_rate') {
        const hours = parseFloat(updated.overtime_hours) || 0;
        const rate = parseFloat(updated.overtime_rate) || 0;
        updated.overtime_pay = hours * rate;
      }
      
      // Auto-calculate gross and net salary
      const baseSalary = parseFloat(updated.base_salary) || 0;
      const overtimePay = parseFloat(updated.overtime_pay) || 0;
      const commission = parseFloat(updated.commission_amount) || 0;
      const bonus = parseFloat(updated.bonus_amount) || 0;
      const deductions = parseFloat(updated.deductions) || 0;
      const allowances = parseFloat(updated.allowances) || 0;
      
      updated.gross_salary = baseSalary + overtimePay + commission + bonus + allowances;
      updated.net_salary = updated.gross_salary - deductions;
      
      return updated;
    });
  };

  const handleCommissionRecordChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setNewCommissionRecord((prev: any) => {
      const updated = { ...prev, [name]: value };
      
      // Auto-calculate commission amount if percentage and base amount are provided
      if (name === 'percentage' || name === 'base_amount') {
        const percentage = parseFloat(updated.percentage) || 0;
        const baseAmount = parseFloat(updated.base_amount) || 0;
        if (percentage > 0 && baseAmount > 0) {
          updated.amount = (baseAmount * percentage) / 100;
        }
      }
      
      return updated;
    });
  };

  const validateSalaryForm = () => {
    const errors: any = {};
    if (!newSalaryRecord.employee_id) errors.employee_id = 'Employee is required';
    if (!newSalaryRecord.pay_period_start) errors.pay_period_start = 'Pay period start is required';
    if (!newSalaryRecord.pay_period_end) errors.pay_period_end = 'Pay period end is required';
    if (!newSalaryRecord.base_salary || newSalaryRecord.base_salary <= 0) errors.base_salary = 'Base salary must be greater than 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCommissionForm = () => {
    const errors: any = {};
    if (!newCommissionRecord.employee_id) errors.employee_id = 'Employee is required';
    if (!newCommissionRecord.amount || newCommissionRecord.amount <= 0) errors.amount = 'Commission amount must be greater than 0';
    if (!newCommissionRecord.period) errors.period = 'Period is required';
    if (!newCommissionRecord.description) errors.description = 'Description is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitSalaryRecord = async () => {
    if (!validateSalaryForm()) return;

    setLoading(true);
    try {
      // Here you would make API call to save salary record
      console.log('Saving salary record:', newSalaryRecord);
      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving salary record:', error);
      setFormErrors({ submit: 'Failed to save salary record. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCommissionRecord = async () => {
    if (!validateCommissionForm()) return;

    setLoading(true);
    try {
      // Here you would make API call to save commission record
      console.log('Saving commission record:', newCommissionRecord);
      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving commission record:', error);
      setFormErrors({ submit: 'Failed to save commission record. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'paid': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getEmploymentTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'full-time': return 'success';
      case 'part-time': return 'info';
      case 'contract': return 'warning';
      default: return 'default';
    }
  };

  const filteredSalaryRecords = salaryRecords.filter(record => {
    const matchesSearch = record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employee_role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || record.employee_role === roleFilter;
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const renderPayrollOverview = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Salary Management
      </Typography>

      {/* Summary Cards */}
      {payrollSummary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#4caf50', mr: 2 }}>
                    <Group />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                      {payrollSummary.total_employees}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Employees
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
                      ₦{payrollSummary.total_gross_salary.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Gross Salary
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
                    <AccountBalanceWallet />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                      ₦{payrollSummary.total_net_salary.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Net Salary
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
                    <Paid />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                      {payrollSummary.pending_payments}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Payments
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Salary Records Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600 }}>
              Salary Records
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog('new-salary')}
              sx={{ bgcolor: '#13bbc6' }}
            >
              Add Salary Record
            </Button>
          </Box>

          {/* Filters */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Employees"
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
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Role"
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                  <MenuItem value="Receptionist">Receptionist</MenuItem>
                  <MenuItem value="Driver">Driver</MenuItem>
                  <MenuItem value="Sales">Sales</MenuItem>
                  <MenuItem value="Packer">Packer</MenuItem>
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
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
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
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Pay Period</TableCell>
                  <TableCell>Gross Salary</TableCell>
                  <TableCell>Net Salary</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSalaryRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {record.employee_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={record.employee_role} 
                        color="info"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(record.pay_period_start).toLocaleDateString()} - {new Date(record.pay_period_end).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ₦{record.gross_salary.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        ₦{record.net_salary.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={record.status.charAt(0).toUpperCase() + record.status.slice(1)} 
                        color={getStatusColor(record.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {record.payment_date ? new Date(record.payment_date).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleOpenDialog('view-salary', record)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Record">
                        <IconButton size="small" onClick={() => handleOpenDialog('edit-salary', record)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print Payslip">
                        <IconButton size="small" onClick={() => handleOpenDialog('print-payslip', record)}>
                          <Print />
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
      case 'salary':
        return renderPayrollOverview();
      default:
        return renderPayrollOverview();
    }
  };

  return (
    <Box>
      {renderContent()}
      
      {/* Dialog for various actions */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'new-salary' && 'Add Salary Record'}
          {dialogType === 'edit-salary' && 'Edit Salary Record'}
          {dialogType === 'view-salary' && 'Salary Record Details'}
          {dialogType === 'print-payslip' && 'Print Payslip'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'new-salary' && (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined" error={!!formErrors.employee_id}>
                    <InputLabel>Employee</InputLabel>
                    <Select
                      name="employee_id"
                      value={newSalaryRecord.employee_id}
                      onChange={handleSalaryRecordChange}
                      label="Employee"
                    >
                      {employees.map((employee) => (
                        <MenuItem key={employee.id} value={employee.id}>
                          {employee.name} ({employee.role})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={newSalaryRecord.status}
                      onChange={handleSalaryRecordChange}
                      label="Status"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Pay Period Start"
                    name="pay_period_start"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={newSalaryRecord.pay_period_start}
                    onChange={handleSalaryRecordChange}
                    variant="outlined"
                    error={!!formErrors.pay_period_start}
                    helperText={formErrors.pay_period_start}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Pay Period End"
                    name="pay_period_end"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={newSalaryRecord.pay_period_end}
                    onChange={handleSalaryRecordChange}
                    variant="outlined"
                    error={!!formErrors.pay_period_end}
                    helperText={formErrors.pay_period_end}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Base Salary (₦)"
                    name="base_salary"
                    type="number"
                    fullWidth
                    value={newSalaryRecord.base_salary}
                    onChange={handleSalaryRecordChange}
                    variant="outlined"
                    error={!!formErrors.base_salary}
                    helperText={formErrors.base_salary}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Overtime Hours"
                    name="overtime_hours"
                    type="number"
                    fullWidth
                    value={newSalaryRecord.overtime_hours}
                    onChange={handleSalaryRecordChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Overtime Rate (₦)"
                    name="overtime_rate"
                    type="number"
                    fullWidth
                    value={newSalaryRecord.overtime_rate}
                    onChange={handleSalaryRecordChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Overtime Pay (₦)"
                    name="overtime_pay"
                    type="number"
                    fullWidth
                    value={newSalaryRecord.overtime_pay}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Commission Amount (₦)"
                    name="commission_amount"
                    type="number"
                    fullWidth
                    value={newSalaryRecord.commission_amount}
                    onChange={handleSalaryRecordChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Bonus Amount (₦)"
                    name="bonus_amount"
                    type="number"
                    fullWidth
                    value={newSalaryRecord.bonus_amount}
                    onChange={handleSalaryRecordChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Deductions (₦)"
                    name="deductions"
                    type="number"
                    fullWidth
                    value={newSalaryRecord.deductions}
                    onChange={handleSalaryRecordChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Allowances (₦)"
                    name="allowances"
                    type="number"
                    fullWidth
                    value={newSalaryRecord.allowances}
                    onChange={handleSalaryRecordChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Gross Salary (₦)"
                    name="gross_salary"
                    type="number"
                    fullWidth
                    value={newSalaryRecord.gross_salary}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Net Salary (₦)"
                    name="net_salary"
                    type="number"
                    fullWidth
                    value={newSalaryRecord.net_salary}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      name="payment_method"
                      value={newSalaryRecord.payment_method}
                      onChange={handleSalaryRecordChange}
                      label="Payment Method"
                    >
                      {paymentMethods.map((method) => (
                        <MenuItem key={method.value} value={method.value}>
                          {method.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              {formErrors.submit && <Alert severity="error" sx={{ mt: 2 }}>{formErrors.submit}</Alert>}
            </Box>
          )}
          {dialogType === 'view-salary' && selectedSalaryRecord && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Salary Record Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Employee:</strong> {selectedSalaryRecord.employee_name}</Typography>
                  <Typography variant="body2"><strong>Role:</strong> {selectedSalaryRecord.employee_role}</Typography>
                  <Typography variant="body2"><strong>Pay Period:</strong> {new Date(selectedSalaryRecord.pay_period_start).toLocaleDateString()} - {new Date(selectedSalaryRecord.pay_period_end).toLocaleDateString()}</Typography>
                  <Typography variant="body2"><strong>Status:</strong> {selectedSalaryRecord.status}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Base Salary:</strong> ₦{selectedSalaryRecord.base_salary.toLocaleString()}</Typography>
                  <Typography variant="body2"><strong>Overtime Pay:</strong> ₦{selectedSalaryRecord.overtime_pay.toLocaleString()}</Typography>
                  <Typography variant="body2"><strong>Commission:</strong> ₦{selectedSalaryRecord.commission_amount.toLocaleString()}</Typography>
                  <Typography variant="body2"><strong>Bonus:</strong> ₦{selectedSalaryRecord.bonus_amount.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Deductions:</strong> ₦{selectedSalaryRecord.deductions.toLocaleString()}</Typography>
                  <Typography variant="body2"><strong>Allowances:</strong> ₦{selectedSalaryRecord.allowances.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Gross Salary:</strong> ₦{selectedSalaryRecord.gross_salary.toLocaleString()}</Typography>
                  <Typography variant="body2"><strong>Net Salary:</strong> ₦{selectedSalaryRecord.net_salary.toLocaleString()}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'new-salary' && (
            <Button variant="contained" onClick={handleSubmitSalaryRecord} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Add Salary Record'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalaryManagement;
