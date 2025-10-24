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
  Checkbox,
  FormGroup
} from '@mui/material';
import {
  CleaningServices,
  Assessment,
  AccessTime,
  CheckCircle,
  Warning,
  Add,
  Edit,
  Delete,
  Visibility,
  Inventory,
  Schedule,
  TrendingUp,
  Person,
  Timer,
  PlayArrow,
  Pause,
  Stop,
  CheckBox,
  CheckBoxOutlineBlank
} from '@mui/icons-material';
import axios from 'axios';
import AttendanceManagement from './AttendanceManagement';

interface CleanerDashboardProps {
  selectedSection: string;
}

const CleanerDashboard: React.FC<CleanerDashboardProps> = ({ selectedSection }) => {
  const [loading, setLoading] = useState(false);
  const [cleaningTasks, setCleaningTasks] = useState<any[]>([]);
  const [supplyInventory, setSupplyInventory] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [isWorking, setIsWorking] = useState(false);

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
          // Mock cleaning tasks data
          setCleaningTasks([
            {
              id: 1,
              task_number: 'CLEAN001',
              area: 'Production Floor',
              task_type: 'Daily Cleaning',
              priority: 'high',
              estimated_duration: '2 hours',
              status: 'pending',
              assigned_at: new Date().toISOString(),
              required_supplies: ['Floor Cleaner', 'Mop', 'Disinfectant'],
              completed_items: []
            },
            {
              id: 2,
              task_number: 'CLEAN002',
              area: 'Office Area',
              task_type: 'Weekly Deep Clean',
              priority: 'medium',
              estimated_duration: '3 hours',
              status: 'in_progress',
              assigned_at: new Date().toISOString(),
              required_supplies: ['Glass Cleaner', 'Vacuum', 'Dusting Cloths'],
              completed_items: ['Vacuum', 'Dusting Cloths']
            },
            {
              id: 3,
              task_number: 'CLEAN003',
              area: 'Restrooms',
              task_type: 'Sanitization',
              priority: 'high',
              estimated_duration: '1 hour',
              status: 'completed',
              assigned_at: new Date(Date.now() - 86400000).toISOString(),
              required_supplies: ['Toilet Cleaner', 'Disinfectant', 'Paper Towels'],
              completed_items: ['Toilet Cleaner', 'Disinfectant', 'Paper Towels']
            }
          ]);
          break;
        case 'cleaning-tasks':
          // Same as overview for cleaning tasks
          setCleaningTasks([
            {
              id: 1,
              task_number: 'CLEAN001',
              area: 'Production Floor',
              task_type: 'Daily Cleaning',
              priority: 'high',
              estimated_duration: '2 hours',
              status: 'pending',
              assigned_at: new Date().toISOString(),
              required_supplies: ['Floor Cleaner', 'Mop', 'Disinfectant'],
              completed_items: []
            },
            {
              id: 2,
              task_number: 'CLEAN002',
              area: 'Office Area',
              task_type: 'Weekly Deep Clean',
              priority: 'medium',
              estimated_duration: '3 hours',
              status: 'in_progress',
              assigned_at: new Date().toISOString(),
              required_supplies: ['Glass Cleaner', 'Vacuum', 'Dusting Cloths'],
              completed_items: ['Vacuum', 'Dusting Cloths']
            }
          ]);
          break;
        case 'supply-inventory':
          // Mock supply inventory data
          setSupplyInventory([
            {
              id: 1,
              supply_name: 'Floor Cleaner',
              current_stock: 5,
              min_stock: 2,
              unit: 'bottles',
              status: 'good',
              last_restocked: new Date(Date.now() - 172800000).toISOString()
            },
            {
              id: 2,
              supply_name: 'Disinfectant',
              current_stock: 1,
              min_stock: 3,
              unit: 'bottles',
              status: 'low',
              last_restocked: new Date(Date.now() - 259200000).toISOString()
            },
            {
              id: 3,
              supply_name: 'Paper Towels',
              current_stock: 0,
              min_stock: 5,
              unit: 'rolls',
              status: 'critical',
              last_restocked: new Date(Date.now() - 345600000).toISOString()
            },
            {
              id: 4,
              supply_name: 'Glass Cleaner',
              current_stock: 8,
              min_stock: 2,
              unit: 'bottles',
              status: 'good',
              last_restocked: new Date(Date.now() - 86400000).toISOString()
            }
          ]);
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

  const handleStartTask = (task: any) => {
    setCurrentTask(task);
    setIsWorking(true);
  };

  const handleStopTask = () => {
    setIsWorking(false);
    setCurrentTask(null);
  };

  const handleCompleteItem = (taskId: number, item: string) => {
    setCleaningTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updatedItems = task.completed_items.includes(item)
          ? task.completed_items.filter(i => i !== item)
          : [...task.completed_items, item];
        
        return {
          ...task,
          completed_items: updatedItems,
          status: updatedItems.length === task.required_supplies.length ? 'completed' : 'in_progress'
        };
      }
      return task;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStockStatus = (current: number, min: number) => {
    if (current <= 0) return { status: 'critical', color: 'error' };
    if (current <= min) return { status: 'low', color: 'warning' };
    return { status: 'good', color: 'success' };
  };

  const calculateProgress = (completed: string[], required: string[]) => {
    return Math.round((completed.length / required.length) * 100);
  };

  const renderOverview = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Cleaning Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CleaningServices sx={{ mr: 1, color: '#13bbc6' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Active Tasks</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#13bbc6', fontWeight: 700 }}>
                {cleaningTasks.filter(t => t.status === 'in_progress').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Currently working
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ mr: 1, color: '#FFD700' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Pending Tasks</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#FFD700', fontWeight: 700 }}>
                {cleaningTasks.filter(t => t.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Awaiting start
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle sx={{ mr: 1, color: '#4caf50' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Completed Today</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                {cleaningTasks.filter(t => t.status === 'completed' && new Date(t.assigned_at).toDateString() === new Date().toDateString()).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tasks finished
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ mr: 1, color: '#ff9800' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Low Supplies</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 700 }}>
                {supplyInventory.filter(s => s.status === 'low' || s.status === 'critical').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Need restocking
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {isWorking && currentTask && (
        <Card className="dashboard-card" sx={{ mb: 3, bgcolor: '#e3f2fd' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#1976d2' }}>
                  Currently Working: {currentTask.task_number}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentTask.area} - {currentTask.task_type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Progress: {calculateProgress(currentTask.completed_items, currentTask.required_supplies)}%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Pause />}
                  sx={{ bgcolor: '#ff9800' }}
                >
                  Pause
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Stop />}
                  onClick={handleStopTask}
                  sx={{ bgcolor: '#f44336' }}
                >
                  Stop
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                Active Tasks
              </Typography>
              {cleaningTasks.filter(t => t.status === 'in_progress' || t.status === 'pending').length > 0 ? (
                <List>
                  {cleaningTasks.filter(t => t.status === 'in_progress' || t.status === 'pending').map((task) => (
                    <ListItem key={task.id} sx={{ px: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                        <ListItemIcon>
                          <CleaningServices />
                        </ListItemIcon>
                        <ListItemText
                          primary={task.task_number}
                          secondary={`${task.area} - ${task.task_type}`}
                        />
                        <Chip 
                          label={task.status.replace('_', ' ').toUpperCase()} 
                          color={getStatusColor(task.status) as any}
                          size="small"
                        />
                      </Box>
                      <Box sx={{ ml: 4, width: '100%' }}>
                        <Typography variant="body2" color="text.secondary">
                          Priority: <Chip label={task.priority.toUpperCase()} color={getPriorityColor(task.priority) as any} size="small" />
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Duration: {task.estimated_duration}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Progress: {calculateProgress(task.completed_items, task.required_supplies)}%
                        </Typography>
                        {task.status === 'pending' && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={() => handleStartTask(task)}
                            sx={{ mt: 1, bgcolor: '#4caf50' }}
                          >
                            Start Task
                          </Button>
                        )}
                      </Box>
                      <Divider sx={{ width: '100%', mt: 1 }} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">No active tasks</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                Supply Status
              </Typography>
              {supplyInventory.filter(s => s.status === 'low' || s.status === 'critical').length > 0 ? (
                <List>
                  {supplyInventory.filter(s => s.status === 'low' || s.status === 'critical').map((supply) => {
                    const stockStatus = getStockStatus(supply.current_stock, supply.min_stock);
                    return (
                      <ListItem key={supply.id} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Warning color={stockStatus.color as any} />
                        </ListItemIcon>
                        <ListItemText
                          primary={supply.supply_name}
                          secondary={`${supply.current_stock} ${supply.unit} remaining (Min: ${supply.min_stock})`}
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
                <Typography color="text.secondary">All supplies are well stocked!</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderCleaningTasks = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Cleaning Tasks
      </Typography>

      <Card className="dashboard-card">
        <CardContent>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="All Tasks" />
            <Tab label="Pending" />
            <Tab label="In Progress" />
            <Tab label="Completed" />
          </Tabs>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Task ID</TableCell>
                  <TableCell>Area</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cleaningTasks
                  .filter(task => {
                    if (selectedTab === 0) return true;
                    if (selectedTab === 1) return task.status === 'pending';
                    if (selectedTab === 2) return task.status === 'in_progress';
                    if (selectedTab === 3) return task.status === 'completed';
                    return true;
                  })
                  .map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.task_number}</TableCell>
                      <TableCell>{task.area}</TableCell>
                      <TableCell>{task.task_type}</TableCell>
                      <TableCell>
                        <Chip 
                          label={task.priority.toUpperCase()} 
                          color={getPriorityColor(task.priority) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{task.estimated_duration}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 100, bgcolor: '#e0e0e0', borderRadius: 1, height: 8 }}>
                            <Box 
                              sx={{ 
                                width: `${calculateProgress(task.completed_items, task.required_supplies)}%`, 
                                bgcolor: '#4caf50', 
                                height: '100%', 
                                borderRadius: 1 
                              }} 
                            />
                          </Box>
                          <Typography variant="body2">
                            {calculateProgress(task.completed_items, task.required_supplies)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={task.status.replace('_', ' ').toUpperCase()} 
                          color={getStatusColor(task.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleOpenDialog('view-task', task)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {task.status === 'pending' && (
                          <Tooltip title="Start Task">
                            <IconButton size="small" onClick={() => handleStartTask(task)}>
                              <PlayArrow />
                            </IconButton>
                          </Tooltip>
                        )}
                        {task.status === 'in_progress' && (
                          <Tooltip title="Update Progress">
                            <IconButton size="small" onClick={() => handleOpenDialog('update-task', task)}>
                              <Edit />
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

  const renderSupplyInventory = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Supply Inventory
      </Typography>

      <Card className="dashboard-card">
        <CardContent>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="All Supplies" />
            <Tab label="Low Stock" />
            <Tab label="Critical" />
            <Tab label="Good Stock" />
          </Tabs>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Supply Name</TableCell>
                  <TableCell>Current Stock</TableCell>
                  <TableCell>Min Stock</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Restocked</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {supplyInventory
                  .filter(supply => {
                    if (selectedTab === 0) return true;
                    if (selectedTab === 1) return supply.status === 'low';
                    if (selectedTab === 2) return supply.status === 'critical';
                    if (selectedTab === 3) return supply.status === 'good';
                    return true;
                  })
                  .map((supply) => {
                    const stockStatus = getStockStatus(supply.current_stock, supply.min_stock);
                    return (
                      <TableRow key={supply.id}>
                        <TableCell>{supply.supply_name}</TableCell>
                        <TableCell>{supply.current_stock}</TableCell>
                        <TableCell>{supply.min_stock}</TableCell>
                        <TableCell>{supply.unit}</TableCell>
                        <TableCell>
                          <Chip 
                            label={stockStatus.status.toUpperCase()} 
                            color={stockStatus.color as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{new Date(supply.last_restocked).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleOpenDialog('view-supply', supply)}>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Request Restock">
                            <IconButton size="small" onClick={() => handleOpenDialog('request-restock', supply)}>
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
      case 'cleaning-tasks':
        return renderCleaningTasks();
      case 'supply-inventory':
        return renderSupplyInventory();
      case 'my-attendance':
        return <AttendanceManagement selectedSection={selectedSection} userRole="cleaner" />;
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
          {dialogType === 'view-task' && 'Task Details'}
          {dialogType === 'update-task' && 'Update Task Progress'}
          {dialogType === 'view-supply' && 'Supply Details'}
          {dialogType === 'request-restock' && 'Request Supply Restock'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'update-task' && selectedItem && (
            <Box>
              <Typography variant="h6" gutterBottom>Task Progress</Typography>
              <Typography variant="body2" gutterBottom>
                {selectedItem.task_number} - {selectedItem.area}
              </Typography>
              
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Required Items:</Typography>
              <FormGroup>
                {selectedItem.required_supplies.map((item: string) => (
                  <FormControlLabel
                    key={item}
                    control={
                      <Checkbox
                        checked={selectedItem.completed_items.includes(item)}
                        onChange={() => handleCompleteItem(selectedItem.id, item)}
                      />
                    }
                    label={item}
                  />
                ))}
              </FormGroup>
            </Box>
          )}
          
          {!dialogType.includes('update') && (
            <Typography>
              {dialogType.includes('task') && 'Task details and progress update functionality will be implemented here.'}
              {dialogType.includes('supply') && 'Supply management functionality will be implemented here.'}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'request-restock' && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }}>
              Request Restock
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CleanerDashboard;
