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
  Tooltip
} from '@mui/material';
import {
  People,
  Assignment,
  Inventory,
  TrendingUp,
  AccessTime,
  Security,
  Business,
  PointOfSale,
  Payment,
  Assessment,
  Search,
  Add,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Cancel,
  Pending
} from '@mui/icons-material';
import axios from 'axios';
import OrderManagement from './OrderManagement';
import EmployeeManagement from './EmployeeManagement';
import AttendanceManagement from './AttendanceManagement';
import SurveillanceManagement from './SurveillanceManagement';
import ReportingAnalytics from './ReportingAnalytics';
import DistributorManagement from './DistributorManagement';
import PricingManagement from './PricingManagement';
import SalaryManagement from './SalaryManagement';
import SalesManagement from './SalesManagement';
import PackerWorkflowManagement from './PackerWorkflowManagement';
import DriverDispatchManagement from './DriverDispatchManagement';

interface ManagerDashboardProps {
  selectedSection: string;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ selectedSection }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [distributors, setDistributors] = useState<any[]>([]);
  const [systemActivity, setSystemActivity] = useState<any[]>([]);
  const [commissionApprovals, setCommissionApprovals] = useState<any[]>([]);
  const [employeeStats, setEmployeeStats] = useState<any>({});
  const [distributorStats, setDistributorStats] = useState<any>({});
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);

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
          const statsResponse = await axios.get('http://localhost:3002/api/dashboard/stats', { headers });
          setStats(statsResponse.data.data);
          try {
            const invStats = await axios.get('http://localhost:3002/api/inventory/stats', { headers });
            // merge inventory totals into stats for display if needed
            setStats((prev: any) => ({ ...(prev || {}), totalInventory: invStats.data.data?.totalInventory || 0 }));
          } catch (e) { /* ignore inventory errors */ }
          break;
        case 'employee-mgmt':
          const employeesResponse = await axios.get('http://localhost:3002/api/employees', { headers });
          setEmployees(employeesResponse.data.data || []);
          break;
        case 'attendance':
          const attendanceResponse = await axios.get('http://localhost:3002/api/attendance', { headers });
          setAttendance(attendanceResponse.data.data || []);
          break;
        case 'distributor-mgmt':
          // Fetch distributors from API
          try {
            const distributorsResponse = await axios.get('http://localhost:3002/api/distributors', { headers });
            setDistributors(distributorsResponse.data.data || []);
          } catch (error) {
            console.error('Error fetching distributors:', error);
            setDistributors([]);
          }
          break;
        case 'system-activity':
          // Fetch system activity from API
          try {
            const activityResponse = await axios.get('http://localhost:3002/api/system/activity', { headers });
            setSystemActivity(activityResponse.data.data || []);
          } catch (error) {
            console.error('Error fetching system activity:', error);
            setSystemActivity([]);
          }
          break;
        case 'commission-approval':
          // Fetch commission approvals
          try {
            const commissionResponse = await axios.get('http://localhost:3002/api/sales/driver-sales', { headers });
            if (commissionResponse.data.success) {
              setCommissionApprovals(commissionResponse.data.data || []);
            } else {
              setCommissionApprovals([]);
            }
          } catch (error) {
            console.error('Error fetching commission approvals:', error);
            setCommissionApprovals([]);
          }
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
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'pending': return 'warning';
      case 'completed': return 'success';
      default: return 'default';
    }
  };


  const handleApproveCommission = async (commissionId: number) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.put(`http://localhost:3002/api/sales/commission/${commissionId}/approve`, {
        approved_by: 1, // This should come from auth context
        approval_notes: 'Approved by Manager'
      }, { headers });

      if (response.data.success) {
        fetchData(); // Refresh data
        alert('Commission approved successfully!');
      } else {
        alert('Error approving commission: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error approving commission:', error);
      alert('Error approving commission. Please try again.');
    }
  };

  const handleRejectCommission = async (commissionId: number) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.put(`http://localhost:3002/api/sales/commission/${commissionId}/reject`, {
        rejected_by: 1, // This should come from auth context
        rejection_notes: 'Rejected by Manager - requires review'
      }, { headers });

      if (response.data.success) {
        fetchData(); // Refresh data
        alert('Commission rejected successfully!');
      } else {
        alert('Error rejecting commission: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error rejecting commission:', error);
      alert('Error rejecting commission. Please try again.');
    }
  };

  const renderOverview = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Global Overview
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ mr: 1, color: '#13bbc6' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Total Employees</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#13bbc6', fontWeight: 700 }}>
                {stats?.totalEmployees || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats?.activeEmployees || 0} active
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assignment sx={{ mr: 1, color: '#FFD700' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Total Orders</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#FFD700', fontWeight: 700 }}>
                {stats?.totalOrders || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats?.pendingOrders || 0} pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Inventory sx={{ mr: 1, color: '#4caf50' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Inventory</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                {stats?.totalInventory || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats?.lowStockItems || 0} low stock
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: '#ff9800' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Monthly Sales</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 700 }}>
                ₦{(stats?.monthlySales || 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total: ₦{(stats?.totalSales || 0).toLocaleString()}
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
                        <TableCell>{order.type}</TableCell>
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
                Employee Status
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Login</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employees.slice(0, 5).map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>{employee.role}</TableCell>
                        <TableCell>
                          <Chip 
                            label={employee.status || 'Active'} 
                            color={getStatusColor(employee.status || 'active') as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {employee.last_login ? new Date(employee.last_login).toLocaleDateString() : 'Never'}
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

  const renderEmployeeManagement = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Employee Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('add-employee')}
          sx={{ bgcolor: '#13bbc6' }}
          className="dashboard-button"
        >
          Add Employee
        </Button>
      </Box>

      <Card className="dashboard-card">
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.phone}</TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>
                      <Chip 
                        label={employee.status || 'Active'} 
                        color={getStatusColor(employee.status || 'active') as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleOpenDialog('view-employee', employee)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Employee">
                        <IconButton size="small" onClick={() => handleOpenDialog('edit-employee', employee)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Employee">
                        <IconButton size="small" onClick={() => handleOpenDialog('delete-employee', employee)}>
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

  const renderAttendanceLogs = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Attendance Logs
      </Typography>

      <Card className="dashboard-card">
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Clock In</TableCell>
                  <TableCell>Clock Out</TableCell>
                  <TableCell>Hours Worked</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.employee_name}</TableCell>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>{record.clock_in_time}</TableCell>
                    <TableCell>{record.clock_out_time || 'Not clocked out'}</TableCell>
                    <TableCell>{record.hours_worked || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={record.status} 
                        color={getStatusColor(record.status) as any}
                        size="small"
                      />
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

  const renderDistributorManagement = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Distributor Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('add-distributor')}
          sx={{ bgcolor: '#13bbc6' }}
          className="dashboard-button"
        >
          Add Distributor
        </Button>
      </Box>

      <Card className="dashboard-card">
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Contact Person</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {distributors.map((distributor) => (
                  <TableRow key={distributor.id}>
                    <TableCell>{distributor.name}</TableCell>
                    <TableCell>{distributor.contact}</TableCell>
                    <TableCell>{distributor.phone}</TableCell>
                    <TableCell>{distributor.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={distributor.status} 
                        color={getStatusColor(distributor.status) as any}
                        size="small"
                      />
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

  const renderSystemActivity = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        System Activity Log
      </Typography>

      <Card className="dashboard-card">
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {systemActivity.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{activity.user}</TableCell>
                    <TableCell>{activity.action}</TableCell>
                    <TableCell>{activity.details}</TableCell>
                    <TableCell>{new Date(activity.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderCommissionApproval = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Commission Approval Management
      </Typography>

      <Grid container spacing={3}>
        {/* Approval Summary */}
        <Grid item xs={12} md={4}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#13bbc6', fontWeight: 600 }}>
                Pending Approvals
              </Typography>
              <Typography variant="h3" sx={{ color: '#2c3e50', fontWeight: 700 }}>
                {commissionApprovals.filter(approval => approval.approval_status === 'Pending Manager Approval').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Awaiting manager approval
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Commission */}
        <Grid item xs={12} md={4}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#4caf50', fontWeight: 600 }}>
                Total Commission
              </Typography>
              <Typography variant="h3" sx={{ color: '#2c3e50', fontWeight: 700 }}>
                ₦{commissionApprovals.reduce((sum, approval) => sum + (approval.commission_earned || 0), 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total commission to approve
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Approved Today */}
        <Grid item xs={12} md={4}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#ff9800', fontWeight: 600 }}>
                Approved Today
              </Typography>
              <Typography variant="h3" sx={{ color: '#2c3e50', fontWeight: 700 }}>
                {commissionApprovals.filter(approval => approval.approval_status === 'Approved').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Commissions approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Commission Approvals Table */}
      <Card className="dashboard-card" sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
            Commission Approvals
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
                  <TableCell>Commission</TableCell>
                  <TableCell>Money Submitted</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {commissionApprovals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell>{approval.order_number}</TableCell>
                    <TableCell>{approval.driver_name}</TableCell>
                    <TableCell>{approval.bags_sold}</TableCell>
                    <TableCell>{approval.bags_returned}</TableCell>
                    <TableCell>₦{approval.total_sales?.toLocaleString()}</TableCell>
                    <TableCell>₦{approval.commission_earned?.toLocaleString()}</TableCell>
                    <TableCell>₦{approval.money_submitted?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={approval.approval_status || 'Pending Manager Approval'} 
                        color={approval.approval_status === 'Approved' ? 'success' : 
                               approval.approval_status === 'Rejected' ? 'error' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {approval.approval_status === 'Pending Manager Approval' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Approve Commission">
                            <IconButton
                              size="small"
                              onClick={() => handleApproveCommission(approval.id)}
                              sx={{ color: '#4caf50' }}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject Commission">
                            <IconButton
                              size="small"
                              onClick={() => handleRejectCommission(approval.id)}
                              sx={{ color: '#f44336' }}
                            >
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        </Box>
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

  const renderEmployeeManagementDialog = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
          Employee Management
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog('add-employee')}
                    sx={{ bgcolor: '#13bbc6' }}
                  >
                    Add New Employee
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => handleOpenDialog('edit-employee')}
                  >
                    Edit Employee
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => handleOpenDialog('view-employee')}
                  >
                    View Employee Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Card sx={{ boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                  Employee Statistics
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Total Employees: {employeeStats.total || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Active: {employeeStats.active || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Inactive: {employeeStats.inactive || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderDistributorManagementDialog = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
          Distributor Management
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                  Distributor Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog('add-distributor')}
                    sx={{ bgcolor: '#13bbc6' }}
                  >
                    Add New Distributor
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => handleOpenDialog('edit-distributor')}
                  >
                    Edit Distributor
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => handleOpenDialog('view-distributor')}
                  >
                    View Distributor Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Card sx={{ boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                  Distributor Statistics
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Total Distributors: {distributorStats.total || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Active: {distributorStats.active || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  This Month Orders: {distributorStats.monthlyOrders || 0}
                </Typography>
              </CardContent>
            </Card>
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
      case 'employee-mgmt':
        return <EmployeeManagement selectedSection="employee-mgmt" userRole="Manager" />;
      case 'new-employee':
        return <EmployeeManagement selectedSection="new-employee" userRole="Manager" />;
      case 'packing-workflow':
        return <PackerWorkflowManagement />;
      case 'attendance':
        return <AttendanceManagement selectedSection={selectedSection} userRole="manager" />;
      case 'distributor-mgmt':
        return <DistributorManagement selectedSection={selectedSection} userRole="manager" />;
      case 'system-activity':
        return renderSystemActivity();
      case 'surveillance':
        return <SurveillanceManagement selectedSection={selectedSection} userRole="manager" />;
      case 'reports':
        return <ReportingAnalytics selectedSection={selectedSection} userRole="manager" />;
      case 'salary':
        return <SalaryManagement selectedSection={selectedSection} userRole="manager" />;
      case 'commission-approval':
        return renderCommissionApproval();
      case 'sales-management':
        return <SalesManagement selectedSection={selectedSection} userRole="manager" />;
      case 'general-sales':
      case 'distributor-orders':
        return <OrderManagement selectedSection={selectedSection} userRole="manager" />;
      case 'driver-dispatches':
        return <DriverDispatchManagement userRole="manager" />;
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
          {dialogType === 'add-employee' && 'Add New Employee'}
          {dialogType === 'edit-employee' && 'Edit Employee'}
          {dialogType === 'view-employee' && 'Employee Details'}
          {dialogType === 'delete-employee' && 'Delete Employee'}
          {dialogType === 'add-distributor' && 'Add New Distributor'}
          {dialogType === 'edit-distributor' && 'Edit Distributor'}
          {dialogType === 'view-distributor' && 'Distributor Details'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogType.includes('employee') && renderEmployeeManagementDialog()}
            {dialogType.includes('distributor') && renderDistributorManagementDialog()}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {!dialogType.includes('view') && !dialogType.includes('delete') && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }}>
              {dialogType.includes('add') ? 'Add' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManagerDashboard;
