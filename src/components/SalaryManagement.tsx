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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  AttachMoney,
  People,
  TrendingUp,
  CheckCircle,
  Pending,
  Warning,
  Edit,
  Visibility,
  Add,
  ExpandMore,
  History,
  Assessment,
  Payment
} from '@mui/icons-material';
import axios from 'axios';

interface SalaryManagementProps {
  selectedSection: string;
  userRole: string;
}

interface SalaryRate {
  id: number;
  employee_id: number;
  rate_type: string;
  rate_amount: number;
  is_active: boolean;
  created_at: string;
}

interface PackingLog {
  id: number;
  packer_id: number;
  bags_packed: number;
  packing_date: string;
  status: string;
  storekeeper_id: number;
  manager_id?: number;
  packer_notes?: string;
  storekeeper_notes?: string;
  manager_notes?: string;
  dispute_reason?: string;
  disputed_bags?: number;
  confirmed_at?: string;
  approved_at?: string;
  packer_name: string;
  storekeeper_name: string;
  manager_name?: string;
}

interface DriverSalesLog {
  id: number;
  driver_id: number;
  driver_assistant_id?: number;
  bags_dispatched: number;
  bags_sold_270: number;
  bags_sold_250: number;
  bags_returned: number;
  total_revenue: number;
  expected_revenue: number;
  delivery_date: string;
  status: string;
  receptionist_id: number;
  driver_notes?: string;
  receptionist_notes?: string;
  dispatched_at: string;
  delivered_at?: string;
  accounted_at?: string;
  driver_name: string;
  assistant_name?: string;
  receptionist_name: string;
}

interface Employee {
  id: number;
  name: string;
  role: string;
  email: string;
}

interface Bonus {
  id: number;
  employee_id: number;
  amount: number;
  reason: string;
  bonus_date: string;
  status: string;
  approved_by?: number;
  approved_at?: string;
  created_by: number;
  created_at: string;
  employee_name: string;
  approved_by_name?: string;
  created_by_name: string;
}

const SalaryManagement: React.FC<SalaryManagementProps> = ({ selectedSection, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryRates, setSalaryRates] = useState<SalaryRate[]>([]);
  const [packingLogs, setPackingLogs] = useState<PackingLog[]>([]);
  const [driverSalesLogs, setDriverSalesLogs] = useState<DriverSalesLog[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PackingLog[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  
  // Dialog states
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [packingDialogOpen, setPackingDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [bonusDialogOpen, setBonusDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedLog, setSelectedLog] = useState<PackingLog | null>(null);
  
  // Form states
  const [newRate, setNewRate] = useState({ rate_type: '', rate_amount: 0 });
  const [newPackingLog, setNewPackingLog] = useState({ 
    packer_id: 0, 
    bags_packed: 0, 
    packing_date: new Date().toISOString().split('T')[0],
    storekeeper_notes: ''
  });
  const [approvalData, setApprovalData] = useState({ 
    manager_notes: '', 
    final_bags: 0 
  });
  const [newBonus, setNewBonus] = useState({
    employee_id: 0,
    amount: 0,
    reason: '',
    bonus_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, [selectedSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch employees
      const employeesResponse = await axios.get('/api/employees', { headers });
      if (employeesResponse.data.success) {
        setEmployees(employeesResponse.data.data);
      }

      // Fetch salary rates for commission-based employees
      const packers = employeesResponse.data.data.filter((emp: Employee) => emp.role === 'Packer');
      const drivers = employeesResponse.data.data.filter((emp: Employee) => 
        emp.role === 'Driver' || emp.role === 'Driver Assistant'
      );

      const allRates = [];
      for (const employee of [...packers, ...drivers]) {
        try {
          const rateResponse = await axios.get(`/api/salary/rates/${employee.id}`, { headers });
          if (rateResponse.data.success) {
            allRates.push(...rateResponse.data.data);
          }
        } catch (error) {
          console.error(`Error fetching rates for employee ${employee.id}:`, error);
        }
      }
      setSalaryRates(allRates);

      // Fetch pending approvals for managers
      if (userRole === 'Manager' || userRole === 'Admin' || userRole === 'Director') {
        try {
          const approvalsResponse = await axios.get('/api/salary/pending-approvals', { headers });
          if (approvalsResponse.data.success) {
            setPendingApprovals(approvalsResponse.data.data);
          }
        } catch (error) {
          console.error('Error fetching pending approvals:', error);
        }
      }

      // Fetch bonuses
      try {
        const bonusesResponse = await axios.get('/api/salary/bonuses', { headers });
        if (bonusesResponse.data.success) {
          setBonuses(bonusesResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching bonuses:', error);
        // Use mock data if API fails
        setBonuses(getMockBonuses());
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockBonuses = (): Bonus[] => {
    return [
      {
        id: 1,
        employee_id: 1,
        amount: 5000,
        reason: 'Exceptional performance during peak season',
        bonus_date: '2024-01-15',
        status: 'approved',
        approved_by: 1,
        approved_at: '2024-01-16T10:00:00Z',
        created_by: 1,
        created_at: '2024-01-15T14:30:00Z',
        employee_name: 'John Doe',
        approved_by_name: 'Admin User',
        created_by_name: 'Admin User'
      },
      {
        id: 2,
        employee_id: 2,
        amount: 3000,
        reason: 'Outstanding customer service',
        bonus_date: '2024-01-20',
        status: 'pending',
        created_by: 1,
        created_at: '2024-01-20T09:15:00Z',
        employee_name: 'Jane Smith',
        created_by_name: 'Admin User'
      }
    ];
  };

  const handleCreateBonus = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post('/api/salary/bonuses', newBonus, { headers });
      
      setBonusDialogOpen(false);
      setNewBonus({
        employee_id: 0,
        amount: 0,
        reason: '',
        bonus_date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error) {
      console.error('Error creating bonus:', error);
      alert('Failed to create bonus. Please try again.');
    }
  };

  const handleApproveBonus = async (bonusId: number) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(`/api/salary/bonuses/${bonusId}/approve`, {}, { headers });
      fetchData();
    } catch (error) {
      console.error('Error approving bonus:', error);
      alert('Failed to approve bonus. Please try again.');
    }
  };

  const handleRejectBonus = async (bonusId: number) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(`/api/salary/bonuses/${bonusId}/reject`, {}, { headers });
      fetchData();
    } catch (error) {
      console.error('Error rejecting bonus:', error);
      alert('Failed to reject bonus. Please try again.');
    }
  };

  const handleUpdateRate = async () => {
    if (!selectedEmployee) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(`/api/salary/rates/${selectedEmployee.id}`, newRate, { headers });
      
      setRateDialogOpen(false);
      setSelectedEmployee(null);
      setNewRate({ rate_type: '', rate_amount: 0 });
      fetchData();
    } catch (error) {
      console.error('Error updating rate:', error);
    }
  };

  const handleCreatePackingLog = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Get current user ID (storekeeper)
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      await axios.post('/api/salary/packing-logs', {
        ...newPackingLog,
        storekeeper_id: user.id
      }, { headers });
      
      setPackingDialogOpen(false);
      setNewPackingLog({ 
        packer_id: 0, 
        bags_packed: 0, 
        packing_date: new Date().toISOString().split('T')[0],
        storekeeper_notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating packing log:', error);
    }
  };

  const handleApproveLog = async () => {
    if (!selectedLog) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      await axios.put(`/api/salary/packing-logs/${selectedLog.id}/approve`, {
        manager_id: user.id,
        ...approvalData
      }, { headers });
      
      setApprovalDialogOpen(false);
      setSelectedLog(null);
      setApprovalData({ manager_notes: '', final_bags: 0 });
      fetchData();
    } catch (error) {
      console.error('Error approving log:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'disputed': return 'error';
      case 'approved': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Pending />;
      case 'confirmed': return <CheckCircle />;
      case 'disputed': return <Warning />;
      case 'approved': return <CheckCircle />;
      default: return <Pending />;
    }
  };

  const renderSalaryRates = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Salary Rates</Typography>
          {(userRole === 'Manager' || userRole === 'Admin' || userRole === 'Director') && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setRateDialogOpen(true)}
            >
              Set Rate
            </Button>
          )}
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Rate Type</TableCell>
                <TableCell>Rate Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees
                .filter(emp => emp.role === 'Packer' || emp.role === 'Driver' || emp.role === 'Driver Assistant')
                .map((employee) => {
                  const rate = salaryRates.find(r => r.employee_id === employee.id);
                  return (
                    <TableRow key={employee.id}>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>{rate?.rate_type || 'Not Set'}</TableCell>
                      <TableCell>₦{rate?.rate_amount || 0}</TableCell>
                      <TableCell>
                        <Chip
                          label={rate?.is_active ? 'Active' : 'Inactive'}
                          color={rate?.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Set Rate">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setNewRate({
                                rate_type: employee.role === 'Packer' ? 'per_bag_packed' : 'per_bag_sold',
                                rate_amount: rate?.rate_amount || 0
                              });
                              setRateDialogOpen(true);
                            }}
                          >
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
      </CardContent>
    </Card>
  );

  const renderPackingLogs = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Packing Logs</Typography>
          {userRole === 'StoreKeeper' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setPackingDialogOpen(true)}
            >
              Add Packing Log
            </Button>
          )}
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Packer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Bags Packed</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Storekeeper</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {packingLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.packer_name}</TableCell>
                  <TableCell>{new Date(log.packing_date).toLocaleDateString()}</TableCell>
                  <TableCell>{log.bags_packed}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(log.status)}
                      label={log.status}
                      color={getStatusColor(log.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{log.storekeeper_name}</TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedLog(log);
                          setApprovalData({ 
                            manager_notes: '', 
                            final_bags: log.bags_packed 
                          });
                          setApprovalDialogOpen(true);
                        }}
                      >
                        <Visibility />
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
  );

  const renderPendingApprovals = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Pending Approvals</Typography>
        
        {pendingApprovals.length === 0 ? (
          <Alert severity="info">No pending approvals</Alert>
        ) : (
          <List>
            {pendingApprovals.map((log) => (
              <Accordion key={log.id}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Typography variant="subtitle1">{log.packer_name}</Typography>
                    <Chip
                      icon={getStatusIcon(log.status)}
                      label={log.status}
                      color={getStatusColor(log.status)}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {new Date(log.packing_date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 'auto' }}>
                      {log.bags_packed} bags
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2">Storekeeper Notes:</Typography>
                      <Typography variant="body2">{log.storekeeper_notes || 'None'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2">Packer Notes:</Typography>
                      <Typography variant="body2">{log.packer_notes || 'None'}</Typography>
                    </Grid>
                    {log.status === 'disputed' && (
                      <Grid item xs={12}>
                        <Alert severity="warning">
                          <Typography variant="subtitle2">Dispute Details:</Typography>
                          <Typography variant="body2">Reason: {log.dispute_reason}</Typography>
                          <Typography variant="body2">Disputed Count: {log.disputed_bags}</Typography>
                        </Alert>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => {
                          setSelectedLog(log);
                          setApprovalData({ 
                            manager_notes: '', 
                            final_bags: log.disputed_bags || log.bags_packed 
                          });
                          setApprovalDialogOpen(true);
                        }}
                      >
                        Review & Approve
                      </Button>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  const renderBonuses = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Bonus Management
        </Typography>
        {(userRole === 'Director' || userRole === 'Admin') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setBonusDialogOpen(true)}
            sx={{ bgcolor: '#27ae60', '&:hover': { bgcolor: '#229954' } }}
          >
            Add Bonus
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
              <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Reason</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bonuses.map((bonus) => (
              <TableRow key={bonus.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {bonus.employee_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    ₦{bonus.amount.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {bonus.reason}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(bonus.bonus_date).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={bonus.status}
                    color={
                      bonus.status === 'approved' ? 'success' :
                      bonus.status === 'pending' ? 'warning' : 'error'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {(userRole === 'Manager' || userRole === 'Admin' || userRole === 'Director') && 
                   bonus.status === 'pending' && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleApproveBonus(bonus.id)}
                        sx={{ minWidth: 'auto', px: 2 }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => handleRejectBonus(bonus.id)}
                        sx={{ minWidth: 'auto', px: 2 }}
                      >
                        Reject
                      </Button>
                    </Box>
                  )}
                  {bonus.status === 'approved' && bonus.approved_by_name && (
                    <Typography variant="caption" color="text.secondary">
                      Approved by {bonus.approved_by_name}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {bonuses.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No bonuses found
          </Typography>
        </Box>
      )}
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

    switch (selectedTab) {
      case 0:
        return renderSalaryRates();
      case 1:
        return renderPackingLogs();
      case 2:
        return renderPendingApprovals();
      case 3:
        return renderBonuses();
      default:
        return renderSalaryRates();
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600, mb: 3 }}>
        Salary Management
      </Typography>

      <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Salary Rates" icon={<AttachMoney />} />
        <Tab label="Packing Logs" icon={<Assessment />} />
        {(userRole === 'Manager' || userRole === 'Admin' || userRole === 'Director') && (
          <Tab label="Pending Approvals" icon={<Pending />} />
        )}
        <Tab label="Bonus Management" icon={<Payment />} />
      </Tabs>

      {renderContent()}

      {/* Rate Dialog */}
      <Dialog open={rateDialogOpen} onClose={() => setRateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Salary Rate</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Employee"
            value={selectedEmployee?.name || ''}
            disabled
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Rate Type</InputLabel>
            <Select
              value={newRate.rate_type}
              onChange={(e) => setNewRate({ ...newRate, rate_type: e.target.value })}
            >
              <MenuItem value="per_bag_packed">Per Bag Packed</MenuItem>
              <MenuItem value="per_bag_sold">Per Bag Sold</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Rate Amount (₦)"
            type="number"
            value={newRate.rate_amount}
            onChange={(e) => setNewRate({ ...newRate, rate_amount: parseFloat(e.target.value) || 0 })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateRate} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Packing Log Dialog */}
      <Dialog open={packingDialogOpen} onClose={() => setPackingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Packing Log</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Packer</InputLabel>
            <Select
              value={newPackingLog.packer_id}
              onChange={(e) => setNewPackingLog({ ...newPackingLog, packer_id: Number(e.target.value) })}
            >
              {employees.filter(emp => emp.role === 'Packer').map((packer) => (
                <MenuItem key={packer.id} value={packer.id}>{packer.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Packing Date"
            type="date"
            value={newPackingLog.packing_date}
            onChange={(e) => setNewPackingLog({ ...newPackingLog, packing_date: e.target.value })}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Bags Packed"
            type="number"
            value={newPackingLog.bags_packed}
            onChange={(e) => setNewPackingLog({ ...newPackingLog, bags_packed: Number(e.target.value) })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            value={newPackingLog.storekeeper_notes}
            onChange={(e) => setNewPackingLog({ ...newPackingLog, storekeeper_notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPackingDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreatePackingLog} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Review & Approve Packing Log</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Packer: {selectedLog.packer_name}</Typography>
                <Typography variant="subtitle2">Date: {new Date(selectedLog.packing_date).toLocaleDateString()}</Typography>
                <Typography variant="subtitle2">Original Count: {selectedLog.bags_packed}</Typography>
                {selectedLog.disputed_bags && (
                  <Typography variant="subtitle2" color="warning.main">
                    Disputed Count: {selectedLog.disputed_bags}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Storekeeper: {selectedLog.storekeeper_name}</Typography>
                <Typography variant="subtitle2">Status: {selectedLog.status}</Typography>
                {selectedLog.dispute_reason && (
                  <Typography variant="subtitle2" color="error.main">
                    Dispute Reason: {selectedLog.dispute_reason}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Final Bags Count"
                  type="number"
                  value={approvalData.final_bags}
                  onChange={(e) => setApprovalData({ ...approvalData, final_bags: Number(e.target.value) })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Manager Notes"
                  multiline
                  rows={3}
                  value={approvalData.manager_notes}
                  onChange={(e) => setApprovalData({ ...approvalData, manager_notes: e.target.value })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleApproveLog} variant="contained" color="success">
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bonus Dialog */}
      <Dialog open={bonusDialogOpen} onClose={() => setBonusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Employee Bonus</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Employee</InputLabel>
            <Select
              value={newBonus.employee_id}
              onChange={(e) => setNewBonus({ ...newBonus, employee_id: Number(e.target.value) })}
              label="Employee"
            >
              {employees.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  {employee.name} ({employee.role})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Bonus Amount (₦)"
            type="number"
            value={newBonus.amount}
            onChange={(e) => setNewBonus({ ...newBonus, amount: Number(e.target.value) })}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>₦</Typography>
            }}
          />
          <TextField
            fullWidth
            label="Reason for Bonus"
            multiline
            rows={3}
            value={newBonus.reason}
            onChange={(e) => setNewBonus({ ...newBonus, reason: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="e.g., Exceptional performance during peak season"
          />
          <TextField
            fullWidth
            label="Bonus Date"
            type="date"
            value={newBonus.bonus_date}
            onChange={(e) => setNewBonus({ ...newBonus, bonus_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBonusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateBonus} variant="contained" color="success">
            Add Bonus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalaryManagement;
