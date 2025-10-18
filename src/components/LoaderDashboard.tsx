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
  InputAdornment
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
  Schedule,
  TrendingUp,
  Person,
  Timer,
  PlayArrow,
  Pause,
  Stop,
  DirectionsCar,
  Warehouse,
  ShoppingCart,
  Speed
} from '@mui/icons-material';
import axios from 'axios';

interface LoaderDashboardProps {
  selectedSection: string;
}

const LoaderDashboard: React.FC<LoaderDashboardProps> = ({ selectedSection }) => {
  const [loading, setLoading] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
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
          // Mock loading tasks data
          setLoadingTasks([
            {
              id: 1,
              task_number: 'LOAD001',
              order_number: 'ORD001',
              customer_name: 'John Doe',
              items: [
                { name: 'Water Sachets (500ml)', quantity: 50, unit: 'bags' },
                { name: 'Water Sachets (1L)', quantity: 30, unit: 'bags' }
              ],
              total_items: 80,
              priority: 'high',
              estimated_duration: '2 hours',
              status: 'pending',
              assigned_at: new Date().toISOString(),
              vehicle_assigned: 'Truck #1',
              loading_bay: 'Bay A'
            },
            {
              id: 2,
              task_number: 'LOAD002',
              order_number: 'ORD002',
              customer_name: 'Jane Smith',
              items: [
                { name: 'Water Sachets (500ml)', quantity: 100, unit: 'bags' }
              ],
              total_items: 100,
              priority: 'medium',
              estimated_duration: '1.5 hours',
              status: 'in_progress',
              assigned_at: new Date().toISOString(),
              vehicle_assigned: 'Truck #2',
              loading_bay: 'Bay B',
              loaded_items: 60
            },
            {
              id: 3,
              task_number: 'LOAD003',
              order_number: 'ORD003',
              customer_name: 'Mike Johnson',
              items: [
                { name: 'Water Sachets (1L)', quantity: 75, unit: 'bags' },
                { name: 'Water Bottles (500ml)', quantity: 50, unit: 'bottles' }
              ],
              total_items: 125,
              priority: 'low',
              estimated_duration: '2.5 hours',
              status: 'completed',
              assigned_at: new Date(Date.now() - 86400000).toISOString(),
              vehicle_assigned: 'Truck #3',
              loading_bay: 'Bay C',
              loaded_items: 125
            }
          ]);
          break;
        case 'loading-tasks':
          // Same as overview for loading tasks
          setLoadingTasks([
            {
              id: 1,
              task_number: 'LOAD001',
              order_number: 'ORD001',
              customer_name: 'John Doe',
              items: [
                { name: 'Water Sachets (500ml)', quantity: 50, unit: 'bags' },
                { name: 'Water Sachets (1L)', quantity: 30, unit: 'bags' }
              ],
              total_items: 80,
              priority: 'high',
              estimated_duration: '2 hours',
              status: 'pending',
              assigned_at: new Date().toISOString(),
              vehicle_assigned: 'Truck #1',
              loading_bay: 'Bay A'
            },
            {
              id: 2,
              task_number: 'LOAD002',
              order_number: 'ORD002',
              customer_name: 'Jane Smith',
              items: [
                { name: 'Water Sachets (500ml)', quantity: 100, unit: 'bags' }
              ],
              total_items: 100,
              priority: 'medium',
              estimated_duration: '1.5 hours',
              status: 'in_progress',
              assigned_at: new Date().toISOString(),
              vehicle_assigned: 'Truck #2',
              loading_bay: 'Bay B',
              loaded_items: 60
            }
          ]);
          break;
        case 'inventory-management':
          // Mock inventory items data
          setInventoryItems([
            {
              id: 1,
              item_name: 'Water Sachets (500ml)',
              current_stock: 1500,
              location: 'Warehouse A - Section 1',
              last_moved: new Date(Date.now() - 3600000).toISOString(),
              status: 'available'
            },
            {
              id: 2,
              item_name: 'Water Sachets (1L)',
              current_stock: 800,
              location: 'Warehouse A - Section 2',
              last_moved: new Date(Date.now() - 7200000).toISOString(),
              status: 'available'
            },
            {
              id: 3,
              item_name: 'Water Bottles (500ml)',
              current_stock: 200,
              location: 'Warehouse B - Section 1',
              last_moved: new Date(Date.now() - 10800000).toISOString(),
              status: 'low_stock'
            },
            {
              id: 4,
              item_name: 'Packaging Materials',
              current_stock: 50,
              location: 'Storage Room',
              last_moved: new Date(Date.now() - 14400000).toISOString(),
              status: 'critical'
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'available': return 'success';
      case 'low_stock': return 'warning';
      case 'critical': return 'error';
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

  const calculateProgress = (loaded: number, total: number) => {
    return Math.round((loaded / total) * 100);
  };

  const renderOverview = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Loader Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalShipping sx={{ mr: 1, color: '#13bbc6' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Active Tasks</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#13bbc6', fontWeight: 700 }}>
                {loadingTasks.filter(t => t.status === 'in_progress').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Currently loading
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
                {loadingTasks.filter(t => t.status === 'pending').length}
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
                {loadingTasks.filter(t => t.status === 'completed' && new Date(t.assigned_at).toDateString() === new Date().toDateString()).length}
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
                <TrendingUp sx={{ mr: 1, color: '#9c27b0' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Items Loaded</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 700 }}>
                {loadingTasks.filter(t => t.status === 'completed' && new Date(t.assigned_at).toDateString() === new Date().toDateString()).reduce((sum, t) => sum + (t.loaded_items || 0), 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Today's total
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
                  Currently Loading: {currentTask.task_number}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentTask.customer_name} - {currentTask.vehicle_assigned}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Progress: {calculateProgress(currentTask.loaded_items || 0, currentTask.total_items)}%
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
                Active Loading Tasks
              </Typography>
              {loadingTasks.filter(t => t.status === 'in_progress' || t.status === 'pending').length > 0 ? (
                <List>
                  {loadingTasks.filter(t => t.status === 'in_progress' || t.status === 'pending').map((task) => (
                    <ListItem key={task.id} sx={{ px: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                        <ListItemIcon>
                          <LocalShipping />
                        </ListItemIcon>
                        <ListItemText
                          primary={task.task_number}
                          secondary={`${task.customer_name} - ${task.vehicle_assigned}`}
                        />
                        <Chip 
                          label={task.status.replace('_', ' ').toUpperCase()} 
                          color={getStatusColor(task.status) as any}
                          size="small"
                        />
                      </Box>
                      <Box sx={{ ml: 4, width: '100%' }}>
                        <Typography variant="body2" color="text.secondary">
                          Order: {task.order_number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Items: {task.loaded_items || 0}/{task.total_items}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Priority: <Chip label={task.priority.toUpperCase()} color={getPriorityColor(task.priority) as any} size="small" />
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Bay: {task.loading_bay}
                        </Typography>
                        {task.status === 'pending' && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={() => handleStartTask(task)}
                            sx={{ mt: 1, bgcolor: '#4caf50' }}
                          >
                            Start Loading
                          </Button>
                        )}
                      </Box>
                      <Divider sx={{ width: '100%', mt: 1 }} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">No active loading tasks</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                Inventory Status
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventoryItems.slice(0, 5).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>{item.current_stock}</TableCell>
                        <TableCell>
                          <Tooltip title={item.location}>
                            <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.location}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.status.replace('_', ' ').toUpperCase()} 
                            color={getStatusColor(item.status) as any}
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
        </Grid>
      </Grid>
    </Box>
  );

  const renderLoadingTasks = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Loading Tasks
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
                  <TableCell>Order</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Bay</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingTasks
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
                      <TableCell>{task.order_number}</TableCell>
                      <TableCell>{task.customer_name}</TableCell>
                      <TableCell>
                        <Tooltip title={task.items.map((item: any) => `${item.name}: ${item.quantity} ${item.unit}`).join(', ')}>
                          <Typography variant="body2">
                            {task.total_items} items
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{task.vehicle_assigned}</TableCell>
                      <TableCell>{task.loading_bay}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 100, bgcolor: '#e0e0e0', borderRadius: 1, height: 8 }}>
                            <Box 
                              sx={{ 
                                width: `${calculateProgress(task.loaded_items || 0, task.total_items)}%`, 
                                bgcolor: '#4caf50', 
                                height: '100%', 
                                borderRadius: 1 
                              }} 
                            />
                          </Box>
                          <Typography variant="body2">
                            {calculateProgress(task.loaded_items || 0, task.total_items)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={task.priority.toUpperCase()} 
                          color={getPriorityColor(task.priority) as any}
                          size="small"
                        />
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
                          <Tooltip title="Start Loading">
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

  const renderInventoryManagement = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Inventory Management
      </Typography>

      <Card className="dashboard-card">
        <CardContent>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="All Items" />
            <Tab label="Available" />
            <Tab label="Low Stock" />
            <Tab label="Critical" />
          </Tabs>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Current Stock</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Last Moved</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventoryItems
                  .filter(item => {
                    if (selectedTab === 0) return true;
                    if (selectedTab === 1) return item.status === 'available';
                    if (selectedTab === 2) return item.status === 'low_stock';
                    if (selectedTab === 3) return item.status === 'critical';
                    return true;
                  })
                  .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.item_name}</TableCell>
                      <TableCell>{item.current_stock}</TableCell>
                      <TableCell>
                        <Tooltip title={item.location}>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.location}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{new Date(item.last_moved).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={item.status.replace('_', ' ').toUpperCase()} 
                          color={getStatusColor(item.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleOpenDialog('view-item', item)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Move Item">
                          <IconButton size="small" onClick={() => handleOpenDialog('move-item', item)}>
                            <DirectionsCar />
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
      case 'overview':
        return renderOverview();
      case 'loading-tasks':
        return renderLoadingTasks();
      case 'inventory-management':
        return renderInventoryManagement();
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
          {dialogType === 'view-task' && 'Loading Task Details'}
          {dialogType === 'update-task' && 'Update Loading Progress'}
          {dialogType === 'view-item' && 'Inventory Item Details'}
          {dialogType === 'move-item' && 'Move Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogType.includes('task') && 'Loading task management functionality will be implemented here.'}
            {dialogType.includes('item') && 'Inventory management functionality will be implemented here.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {!dialogType.includes('view') && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }}>
              {dialogType.includes('move') ? 'Move' : 'Update'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoaderDashboard;
