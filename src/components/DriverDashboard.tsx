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
  Radio
} from '@mui/material';
import {
  LocalShipping,
  Assessment,
  AccessTime,
  CheckCircle,
  Cancel,
  Pending,
  Add,
  Edit,
  Delete,
  Visibility,
  LocationOn,
  Phone,
  Payment,
  Warning,
  Done,
  Schedule,
  DirectionsCar
} from '@mui/icons-material';
import axios from 'axios';
import AttendanceManagement from './AttendanceManagement';

interface DriverDashboardProps {
  selectedSection: string;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ selectedSection }) => {
  const [loading, setLoading] = useState(false);
  const [activeDispatches, setActiveDispatches] = useState<any[]>([]);
  const [dispatchLogs, setDispatchLogs] = useState<any[]>([]);
  const [salesLogs, setSalesLogs] = useState<any[]>([]);
  const [commissionData, setCommissionData] = useState<any>({});
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [settlementData, setSettlementData] = useState({
    bags_sold: 0,
    bags_returned: 0,
    total_sales: 0,
    commission_earned: 0,
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
        case 'active-dispatches':
          // Fetch driver dispatches from API
          try {
            const response = await axios.get('http://localhost:3002/api/orders?order_type=driver_dispatch&status=picked_up,in_transit', { headers });
            if (response.data.success) {
              setActiveDispatches(response.data.data || []);
            } else {
              setActiveDispatches([]);
            }
          } catch (error) {
            console.error('Error fetching active dispatches:', error);
            setActiveDispatches([]);
          }
          break;
        case 'dispatch-log':
          // Fetch completed dispatches
          try {
            const response = await axios.get('http://localhost:3002/api/orders?order_type=driver_dispatch&status=delivered,returned', { headers });
            if (response.data.success) {
              setDispatchLogs(response.data.data || []);
            } else {
              setDispatchLogs([]);
            }
          } catch (error) {
            console.error('Error fetching dispatch logs:', error);
            setDispatchLogs([]);
          }
          break;
        case 'sales-accounting':
          // Fetch sales logs and commission data
          try {
            const [salesResponse, commissionResponse] = await Promise.all([
              axios.get('http://localhost:3002/api/sales/driver-sales', { headers }),
              axios.get('http://localhost:3002/api/salary/commission', { headers })
            ]);
            if (salesResponse.data.success) {
              setSalesLogs(salesResponse.data.data || []);
            }
            if (commissionResponse.data.success) {
              setCommissionData(commissionResponse.data.data || {});
            }
          } catch (error) {
            console.error('Error fetching sales data:', error);
            setSalesLogs([]);
            setCommissionData({ totalSales: 0, totalCommission: 0, pendingCommission: 0 });
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
    setActiveStep(0);
    setSettlementData({
      bags_sold: 0,
      bags_returned: 0,
      total_sales: 0,
      commission_earned: 0,
      money_submitted: 0,
      notes: ''
    });
  };

  const handleUpdateDispatchStatus = async (dispatchId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.put(`http://localhost:3002/api/orders/${dispatchId}/status`, {
        status: newStatus,
        userId: 1, // This should come from auth context
        notes: `Status updated to ${newStatus} by driver`
      }, { headers });

      if (response.data.success) {
        fetchData(); // Refresh data
        alert(`Dispatch status updated to ${newStatus}`);
      } else {
        alert('Error updating dispatch status: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error updating dispatch status:', error);
      alert('Error updating dispatch status. Please try again.');
    }
  };


  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'assigned': return 'info';
      case 'in_transit': return 'warning';
      case 'delivered': return 'success';
      case 'failed': return 'error';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'assigned': return <Schedule />;
      case 'in_transit': return <LocalShipping />;
      case 'delivered': return <CheckCircle />;
      case 'failed': return <Cancel />;
      default: return <Pending />;
    }
  };

  const renderOverview = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Driver Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalShipping sx={{ mr: 1, color: '#13bbc6' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Active Dispatches</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#13bbc6', fontWeight: 700 }}>
                {activeDispatches.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Currently assigned
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle sx={{ mr: 1, color: '#4caf50' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Delivered Today</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                {dispatchLogs.filter(d => d.status === 'delivered' && new Date(d.delivered_at).toDateString() === new Date().toDateString()).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Successful deliveries
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Payment sx={{ mr: 1, color: '#FFD700' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Today's Commission</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#FFD700', fontWeight: 700 }}>
                ₦{dispatchLogs
                  .filter(d => d.status === 'delivered' && new Date(d.delivered_at).toDateString() === new Date().toDateString())
                  .reduce((sum, d) => sum + (d.commission || 0), 0)
                  .toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total earnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ mr: 1, color: '#ff9800' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Failed Deliveries</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 700 }}>
                {dispatchLogs.filter(d => d.status === 'failed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Need attention
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
                Active Dispatches
              </Typography>
              {activeDispatches.length > 0 ? (
                <List>
                  {activeDispatches.map((dispatch) => (
                    <ListItem key={dispatch.id} sx={{ px: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                        <ListItemIcon>
                          {getStatusIcon(dispatch.status)}
                        </ListItemIcon>
                        <ListItemText
                          primary={dispatch.dispatch_number}
                          secondary={dispatch.customer_name}
                        />
                        <Chip 
                          label={dispatch.status.replace('_', ' ').toUpperCase()} 
                          color={getStatusColor(dispatch.status) as any}
                          size="small"
                        />
                      </Box>
                      <Box sx={{ ml: 4, width: '100%' }}>
                        <Typography variant="body2" color="text.secondary">
                          <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          {dispatch.customer_address}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <Phone sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          {dispatch.customer_phone}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Amount: ₦{dispatch.total_amount.toLocaleString()}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenDialog('update-status', dispatch)}
                          sx={{ mt: 1 }}
                        >
                          Update Status
                        </Button>
                      </Box>
                      <Divider sx={{ width: '100%', mt: 1 }} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">No active dispatches</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                Recent Deliveries
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Dispatch ID</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Commission</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dispatchLogs.slice(0, 5).map((dispatch) => (
                      <TableRow key={dispatch.id}>
                        <TableCell>{dispatch.dispatch_number}</TableCell>
                        <TableCell>{dispatch.customer_name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={dispatch.status} 
                            color={getStatusColor(dispatch.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>₦{dispatch.commission?.toLocaleString() || '0'}</TableCell>
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

  const renderActiveDispatches = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Active Dispatches
      </Typography>

      <Card className="dashboard-card">
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Dispatch ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeDispatches.map((dispatch) => (
                  <TableRow key={dispatch.id}>
                    <TableCell>{dispatch.dispatch_number}</TableCell>
                    <TableCell>{dispatch.customer_name}</TableCell>
                    <TableCell>
                      <Tooltip title={dispatch.customer_address}>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {dispatch.customer_address}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{dispatch.customer_phone}</TableCell>
                    <TableCell>₦{dispatch.total_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={dispatch.status.replace('_', ' ').toUpperCase()} 
                        color={getStatusColor(dispatch.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(dispatch.assigned_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleOpenDialog('view-dispatch', dispatch)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Update Status">
                        <IconButton size="small" onClick={() => handleOpenDialog('update-status', dispatch)}>
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

  const renderDispatchLog = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Dispatch Log
      </Typography>

      <Card className="dashboard-card">
        <CardContent>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="All Dispatches" />
            <Tab label="Delivered" />
            <Tab label="Failed" />
            <Tab label="Commission Summary" />
          </Tabs>

          {selectedTab < 3 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Dispatch ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Assigned</TableCell>
                    <TableCell>Delivered</TableCell>
                    <TableCell>Commission</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dispatchLogs
                    .filter(dispatch => {
                      if (selectedTab === 0) return true;
                      if (selectedTab === 1) return dispatch.status === 'delivered';
                      if (selectedTab === 2) return dispatch.status === 'failed';
                      return true;
                    })
                    .map((dispatch) => (
                      <TableRow key={dispatch.id}>
                        <TableCell>{dispatch.dispatch_number}</TableCell>
                        <TableCell>{dispatch.customer_name}</TableCell>
                        <TableCell>
                          <Tooltip title={dispatch.customer_address}>
                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {dispatch.customer_address}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>₦{dispatch.total_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={dispatch.status} 
                            color={getStatusColor(dispatch.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{new Date(dispatch.assigned_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {dispatch.delivered_at ? new Date(dispatch.delivered_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>₦{dispatch.commission?.toLocaleString() || '0'}</TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleOpenDialog('view-dispatch', dispatch)}>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {selectedTab === 3 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Today's Commission
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                        ₦{dispatchLogs
                          .filter(d => d.status === 'delivered' && new Date(d.delivered_at).toDateString() === new Date().toDateString())
                          .reduce((sum, d) => sum + (d.commission || 0), 0)
                          .toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        This Month's Commission
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#13bbc6', fontWeight: 700 }}>
                        ₦{dispatchLogs
                          .filter(d => d.status === 'delivered' && 
                            new Date(d.delivered_at).getMonth() === new Date().getMonth() &&
                            new Date(d.delivered_at).getFullYear() === new Date().getFullYear())
                          .reduce((sum, d) => sum + (d.commission || 0), 0)
                          .toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );

  const renderSalesAccounting = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Sales & Commission History
      </Typography>

      <Grid container spacing={3}>
        {/* Commission Summary */}
        <Grid item xs={12} md={4}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#13bbc6', fontWeight: 600 }}>
                This Month's Commission
              </Typography>
              <Typography variant="h3" sx={{ color: '#2c3e50', fontWeight: 700 }}>
                ₦{commissionData.total_commission?.toLocaleString() || '0'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {commissionData.bags_sold_today || 0} bags sold this month
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rate: ₦{commissionData.commission_rate || 30} per bag
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Expected Salary */}
        <Grid item xs={12} md={4}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#4caf50', fontWeight: 600 }}>
                Expected Next Salary
              </Typography>
              <Typography variant="h3" sx={{ color: '#2c3e50', fontWeight: 700 }}>
                ₦{commissionData.expected_salary?.toLocaleString() || '0'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Payment Date: {commissionData.next_payment_date || 'TBD'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: {commissionData.payment_status || 'Pending Approval'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Status */}
        <Grid item xs={12} md={4}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#ff9800', fontWeight: 600 }}>
                Payment Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Chip 
                  label={commissionData.payment_status || 'Pending Manager Approval'} 
                  color={commissionData.payment_status === 'Approved' ? 'success' : 
                         commissionData.payment_status === 'Pending' ? 'warning' : 'default'}
                  size="medium"
                />
                <Typography variant="body2" color="text.secondary">
                  Last Payment: {commissionData.last_payment_date || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Next Payment: {commissionData.next_payment_date || 'TBD'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sales Logs - Read Only */}
      <Card className="dashboard-card" sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
            Sales History (Read Only)
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Settlement is handled by Receptionist. Manager reviews and approves commissions for payment.
          </Alert>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Bags Sold</TableCell>
                  <TableCell>Bags Returned</TableCell>
                  <TableCell>Total Sales</TableCell>
                  <TableCell>Commission Earned</TableCell>
                  <TableCell>Money Submitted</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.order_number}</TableCell>
                    <TableCell>{log.bags_sold}</TableCell>
                    <TableCell>{log.bags_returned}</TableCell>
                    <TableCell>₦{log.total_sales?.toLocaleString()}</TableCell>
                    <TableCell>₦{log.commission_earned?.toLocaleString()}</TableCell>
                    <TableCell>₦{log.money_submitted?.toLocaleString()}</TableCell>
                    <TableCell>{new Date(log.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={log.approval_status || 'Pending Approval'} 
                        color={log.approval_status === 'Approved' ? 'success' : 
                               log.approval_status === 'Rejected' ? 'error' : 'warning'}
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
      case 'active-dispatches':
        return renderActiveDispatches();
      case 'dispatch-log':
        return renderDispatchLog();
      case 'sales-accounting':
        return renderSalesAccounting();
      case 'my-attendance':
        return <AttendanceManagement selectedSection={selectedSection} userRole="driver" />;
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
          {dialogType === 'view-dispatch' && 'Dispatch Details'}
          {dialogType === 'update-status' && 'Update Dispatch Status'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'view-dispatch' && selectedItem && (
            <Box>
              <Typography variant="h6" gutterBottom>Dispatch Information</Typography>
              <Typography><strong>Dispatch ID:</strong> {selectedItem.dispatch_number}</Typography>
              <Typography><strong>Customer:</strong> {selectedItem.customer_name}</Typography>
              <Typography><strong>Phone:</strong> {selectedItem.customer_phone}</Typography>
              <Typography><strong>Address:</strong> {selectedItem.customer_address}</Typography>
              <Typography><strong>Amount:</strong> ₦{selectedItem.total_amount?.toLocaleString()}</Typography>
              <Typography><strong>Status:</strong> {selectedItem.status}</Typography>
              {selectedItem.delivery_instructions && (
                <Typography><strong>Instructions:</strong> {selectedItem.delivery_instructions}</Typography>
              )}
              
              <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Items</Typography>
              <List>
                {selectedItem.items?.map((item: any, index: number) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={item.name}
                      secondary={`${item.quantity} ${item.unit}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          {dialogType === 'update-status' && (
            <Box>
              <Typography variant="h6" gutterBottom>Update Dispatch Status</Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  aria-label="status"
                  name="status"
                  defaultValue="in_transit"
                >
                  <FormControlLabel value="in_transit" control={<Radio />} label="In Transit" />
                  <FormControlLabel value="delivered" control={<Radio />} label="Delivered" />
                  <FormControlLabel value="failed" control={<Radio />} label="Failed Delivery" />
                </RadioGroup>
              </FormControl>
              
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                sx={{ mt: 2 }}
                placeholder="Add any notes about the delivery..."
              />
            </Box>
          )}

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'update-status' && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }}>
              Update Status
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriverDashboard;
