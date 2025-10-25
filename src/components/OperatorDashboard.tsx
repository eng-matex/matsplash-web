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
  Engineering,
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
  Build,
  Settings,
  Speed,
  Power
} from '@mui/icons-material';
import axios from 'axios';
import AttendanceManagement from './AttendanceManagement';

interface OperatorDashboardProps {
  selectedSection: string;
}

const OperatorDashboard: React.FC<OperatorDashboardProps> = ({ selectedSection }) => {
  const [loading, setLoading] = useState(false);
  const [maintenanceTasks, setMaintenanceTasks] = useState<any[]>([]);
  const [equipmentStatus, setEquipmentStatus] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [taskProgress, setTaskProgress] = useState('');
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  const [newMaintenance, setNewMaintenance] = useState({
    equipment_id: '',
    type: '',
    description: '',
    priority: 'medium',
    scheduled_date: '',
    estimated_duration: ''
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
          // Fetch maintenance tasks from API
          setMaintenanceTasks([
            {
              id: 1,
              task_number: 'MAINT001',
              equipment_name: 'Water Filling Machine #1',
              task_type: 'Routine Maintenance',
              priority: 'high',
              estimated_duration: '4 hours',
              status: 'pending',
              assigned_at: new Date().toISOString(),
              required_tools: ['Wrench Set', 'Lubricant', 'Cleaning Supplies'],
              completed_items: []
            },
            {
              id: 2,
              task_number: 'MAINT002',
              equipment_name: 'Packaging Machine #2',
              task_type: 'Repair',
              priority: 'critical',
              estimated_duration: '6 hours',
              status: 'in_progress',
              assigned_at: new Date().toISOString(),
              required_tools: ['Screwdriver Set', 'Replacement Parts', 'Multimeter'],
              completed_items: ['Screwdriver Set', 'Multimeter']
            },
            {
              id: 3,
              task_number: 'MAINT003',
              equipment_name: 'Conveyor Belt System',
              task_type: 'Inspection',
              priority: 'medium',
              estimated_duration: '2 hours',
              status: 'completed',
              assigned_at: new Date(Date.now() - 86400000).toISOString(),
              required_tools: ['Flashlight', 'Measuring Tape', 'Inspection Checklist'],
              completed_items: ['Flashlight', 'Measuring Tape', 'Inspection Checklist']
            }
          ]);
          break;
        case 'maintenance-tasks':
          // Same as overview for maintenance tasks
          setMaintenanceTasks([
            {
              id: 1,
              task_number: 'MAINT001',
              equipment_name: 'Water Filling Machine #1',
              task_type: 'Routine Maintenance',
              priority: 'high',
              estimated_duration: '4 hours',
              status: 'pending',
              assigned_at: new Date().toISOString(),
              required_tools: ['Wrench Set', 'Lubricant', 'Cleaning Supplies'],
              completed_items: []
            },
            {
              id: 2,
              task_number: 'MAINT002',
              equipment_name: 'Packaging Machine #2',
              task_type: 'Repair',
              priority: 'critical',
              estimated_duration: '6 hours',
              status: 'in_progress',
              assigned_at: new Date().toISOString(),
              required_tools: ['Screwdriver Set', 'Replacement Parts', 'Multimeter'],
              completed_items: ['Screwdriver Set', 'Multimeter']
            }
          ]);
          break;
        case 'equipment-status':
          // Fetch equipment status from API
          setEquipmentStatus([
            {
              id: 1,
              equipment_name: 'Water Filling Machine #1',
              equipment_type: 'Filling Machine',
              status: 'operational',
              last_maintenance: new Date(Date.now() - 172800000).toISOString(),
              next_maintenance: new Date(Date.now() + 259200000).toISOString(),
              operating_hours: 1250,
              efficiency: 95,
              location: 'Production Line A'
            },
            {
              id: 2,
              equipment_name: 'Packaging Machine #2',
              equipment_type: 'Packaging Machine',
              status: 'maintenance',
              last_maintenance: new Date(Date.now() - 3600000).toISOString(),
              next_maintenance: new Date(Date.now() + 7200000).toISOString(),
              operating_hours: 2100,
              efficiency: 88,
              location: 'Production Line B'
            },
            {
              id: 3,
              equipment_name: 'Conveyor Belt System',
              equipment_type: 'Conveyor',
              status: 'operational',
              last_maintenance: new Date(Date.now() - 86400000).toISOString(),
              next_maintenance: new Date(Date.now() + 345600000).toISOString(),
              operating_hours: 3200,
              efficiency: 92,
              location: 'Main Production Floor'
            },
            {
              id: 4,
              equipment_name: 'Water Purification System',
              equipment_type: 'Purification',
              status: 'warning',
              last_maintenance: new Date(Date.now() - 259200000).toISOString(),
              next_maintenance: new Date(Date.now() + 86400000).toISOString(),
              operating_hours: 1800,
              efficiency: 78,
              location: 'Water Treatment Area'
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
    setTaskProgress('');
    setMaintenanceNotes('');
    setNewMaintenance({
      equipment_id: '',
      type: '',
      description: '',
      priority: 'medium',
      scheduled_date: '',
      estimated_duration: ''
    });
  };

  const handleStartTask = (task: any) => {
    setCurrentTask(task);
    setIsWorking(true);
  };

  const handleUpdateTaskProgress = async () => {
    if (!selectedItem || !taskProgress) {
      alert('Please enter progress information');
      return;
    }

    try {
      const updatedTasks = maintenanceTasks.map(task =>
        task.id === selectedItem.id
          ? { 
              ...task, 
              progress: Math.min(100, (task.progress || 0) + parseInt(taskProgress)),
              status: Math.min(100, (task.progress || 0) + parseInt(taskProgress)) >= 100 ? 'completed' : 'in_progress',
              notes: maintenanceNotes
            }
          : task
      );
      setMaintenanceTasks(updatedTasks);
      alert('Task progress updated successfully!');
      handleCloseDialog();
    } catch (error) {
      console.error('Error updating task progress:', error);
      alert('Error updating task progress. Please try again.');
    }
  };

  const handleScheduleMaintenance = async () => {
    if (!newMaintenance.equipment_id || !newMaintenance.type || !newMaintenance.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const newTask = {
        id: maintenanceTasks.length + 1,
        task_number: `MAINT${String(maintenanceTasks.length + 1).padStart(3, '0')}`,
        equipment_name: equipmentStatus.find(eq => eq.id === newMaintenance.equipment_id)?.name || 'Unknown Equipment',
        type: newMaintenance.type,
        description: newMaintenance.description,
        priority: newMaintenance.priority,
        duration: newMaintenance.estimated_duration,
        progress: 0,
        status: 'pending',
        scheduled_date: newMaintenance.scheduled_date,
        created_at: new Date().toISOString()
      };

      setMaintenanceTasks([newTask, ...maintenanceTasks]);
      alert('Maintenance task scheduled successfully!');
      handleCloseDialog();
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      alert('Error scheduling maintenance. Please try again.');
    }
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
      case 'operational': return 'success';
      case 'maintenance': return 'warning';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'success';
    if (efficiency >= 80) return 'warning';
    return 'error';
  };

  const calculateProgress = (completed: string[], required: string[]) => {
    return Math.round((completed.length / required.length) * 100);
  };

  const renderOverview = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Operator Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Engineering sx={{ mr: 1, color: '#13bbc6' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Active Tasks</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#13bbc6', fontWeight: 700 }}>
                {maintenanceTasks.filter(t => t.status === 'in_progress').length}
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
                <Warning sx={{ mr: 1, color: '#ff9800' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Pending Tasks</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 700 }}>
                {maintenanceTasks.filter(t => t.status === 'pending').length}
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
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Operational Equipment</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                {equipmentStatus.filter(e => e.status === 'operational').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Running smoothly
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Settings sx={{ mr: 1, color: '#9c27b0' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Equipment Issues</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 700 }}>
                {equipmentStatus.filter(e => e.status === 'maintenance' || e.status === 'warning').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Need attention
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
                  {currentTask.equipment_name} - {currentTask.task_type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Progress: {calculateProgress(currentTask.completed_items, currentTask.required_tools)}%
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
                Active Maintenance Tasks
              </Typography>
              {maintenanceTasks.filter(t => t.status === 'in_progress' || t.status === 'pending').length > 0 ? (
                <List>
                  {maintenanceTasks.filter(t => t.status === 'in_progress' || t.status === 'pending').map((task) => (
                    <ListItem key={task.id} sx={{ px: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                        <ListItemIcon>
                          <Engineering />
                        </ListItemIcon>
                        <ListItemText
                          primary={task.task_number}
                          secondary={`${task.equipment_name} - ${task.task_type}`}
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
                          Progress: {calculateProgress(task.completed_items, task.required_tools)}%
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
                <Typography color="text.secondary">No active maintenance tasks</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                Equipment Status
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Equipment</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Efficiency</TableCell>
                      <TableCell>Location</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {equipmentStatus.slice(0, 5).map((equipment) => (
                      <TableRow key={equipment.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">{equipment.equipment_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{equipment.equipment_type}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={equipment.status.toUpperCase()} 
                            color={getStatusColor(equipment.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${equipment.efficiency}%`} 
                            color={getEfficiencyColor(equipment.efficiency) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{equipment.location}</TableCell>
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

  const renderMaintenanceTasks = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Maintenance Tasks
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
                  <TableCell>Equipment</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {maintenanceTasks
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
                      <TableCell>{task.equipment_name}</TableCell>
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
                                width: `${calculateProgress(task.completed_items, task.required_tools)}%`, 
                                bgcolor: '#4caf50', 
                                height: '100%', 
                                borderRadius: 1 
                              }} 
                            />
                          </Box>
                          <Typography variant="body2">
                            {calculateProgress(task.completed_items, task.required_tools)}%
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

  const renderEquipmentStatus = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Equipment Status
      </Typography>

      <Card className="dashboard-card">
        <CardContent>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="All Equipment" />
            <Tab label="Operational" />
            <Tab label="Maintenance" />
            <Tab label="Issues" />
          </Tabs>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Equipment Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Efficiency</TableCell>
                  <TableCell>Operating Hours</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Last Maintenance</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {equipmentStatus
                  .filter(equipment => {
                    if (selectedTab === 0) return true;
                    if (selectedTab === 1) return equipment.status === 'operational';
                    if (selectedTab === 2) return equipment.status === 'maintenance';
                    if (selectedTab === 3) return equipment.status === 'warning' || equipment.status === 'critical';
                    return true;
                  })
                  .map((equipment) => (
                    <TableRow key={equipment.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">{equipment.equipment_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{equipment.equipment_type}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{equipment.equipment_type}</TableCell>
                      <TableCell>
                        <Chip 
                          label={equipment.status.toUpperCase()} 
                          color={getStatusColor(equipment.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${equipment.efficiency}%`} 
                          color={getEfficiencyColor(equipment.efficiency) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{equipment.operating_hours.toLocaleString()} hrs</TableCell>
                      <TableCell>{equipment.location}</TableCell>
                      <TableCell>{new Date(equipment.last_maintenance).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleOpenDialog('view-equipment', equipment)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Schedule Maintenance">
                          <IconButton size="small" onClick={() => handleOpenDialog('schedule-maintenance', equipment)}>
                            <Schedule />
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

  const renderTaskDetails = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
        Task Details
      </Typography>
      {selectedItem && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Task ID</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.task_number || selectedItem.id}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip
              label={selectedItem.status?.toUpperCase() || 'UNKNOWN'}
              color={
                selectedItem.status === 'completed' ? 'success' :
                selectedItem.status === 'in_progress' ? 'warning' : 'default'
              }
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Equipment</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.equipment_name || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Type</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.type || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
            <Chip
              label={selectedItem.priority?.toUpperCase() || 'NORMAL'}
              color={
                selectedItem.priority === 'high' ? 'error' :
                selectedItem.priority === 'medium' ? 'warning' : 'default'
              }
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Duration</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.duration || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Progress</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.progress || 0}%</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.description || 'N/A'}</Typography>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderUpdateTaskForm = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
        Update Task Progress
      </Typography>
      {selectedItem && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Task: {selectedItem.task_number} - {selectedItem.equipment_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current Progress: {selectedItem.progress || 0}%
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Additional Progress (%)"
              type="number"
              value={taskProgress}
              onChange={(e) => setTaskProgress(e.target.value)}
              placeholder="Enter percentage to add"
              helperText="Enter the percentage of progress to add"
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Maintenance Notes"
              value={maintenanceNotes}
              onChange={(e) => setMaintenanceNotes(e.target.value)}
              placeholder="Add any notes about the maintenance work performed..."
              sx={{ mb: 2 }}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderEquipmentDetails = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
        Equipment Details
      </Typography>
      {selectedItem && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Equipment Name</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.name || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Type</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.type || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip
              label={selectedItem.status?.toUpperCase() || 'UNKNOWN'}
              color={
                selectedItem.status === 'operational' ? 'success' :
                selectedItem.status === 'maintenance' ? 'warning' :
                selectedItem.status === 'warning' ? 'error' : 'default'
              }
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Efficiency</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.efficiency || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Operating Hours</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.operating_hours || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Location</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.location || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Last Maintenance</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.last_maintenance || 'N/A'}</Typography>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderScheduleMaintenanceForm = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
        Schedule Maintenance
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Equipment *</InputLabel>
            <Select
              value={newMaintenance.equipment_id}
              onChange={(e) => setNewMaintenance({ ...newMaintenance, equipment_id: e.target.value })}
            >
              {equipmentStatus.map((equipment) => (
                <MenuItem key={equipment.id} value={equipment.id}>
                  {equipment.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Maintenance Type *</InputLabel>
            <Select
              value={newMaintenance.type}
              onChange={(e) => setNewMaintenance({ ...newMaintenance, type: e.target.value })}
            >
              <MenuItem value="Routine Maintenance">Routine Maintenance</MenuItem>
              <MenuItem value="Repair">Repair</MenuItem>
              <MenuItem value="Inspection">Inspection</MenuItem>
              <MenuItem value="Calibration">Calibration</MenuItem>
              <MenuItem value="Cleaning">Cleaning</MenuItem>
              <MenuItem value="Replacement">Replacement</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Priority *</InputLabel>
            <Select
              value={newMaintenance.priority}
              onChange={(e) => setNewMaintenance({ ...newMaintenance, priority: e.target.value })}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Estimated Duration"
            value={newMaintenance.estimated_duration}
            onChange={(e) => setNewMaintenance({ ...newMaintenance, estimated_duration: e.target.value })}
            placeholder="e.g., 2 hours, 1 day"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Scheduled Date"
            type="date"
            value={newMaintenance.scheduled_date}
            onChange={(e) => setNewMaintenance({ ...newMaintenance, scheduled_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description *"
            value={newMaintenance.description}
            onChange={(e) => setNewMaintenance({ ...newMaintenance, description: e.target.value })}
            required
            placeholder="Describe the maintenance work to be performed..."
          />
        </Grid>
      </Grid>
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
      case 'maintenance-tasks':
        return renderMaintenanceTasks();
      case 'equipment-status':
        return renderEquipmentStatus();
      case 'my-attendance':
        return <AttendanceManagement selectedSection={selectedSection} userRole="operator" />;
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
          {dialogType === 'view-equipment' && 'Equipment Details'}
          {dialogType === 'schedule-maintenance' && 'Schedule Maintenance'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'view-task' && renderTaskDetails()}
          {dialogType === 'update-task' && renderUpdateTaskForm()}
          {dialogType === 'view-equipment' && renderEquipmentDetails()}
          {dialogType === 'schedule-maintenance' && renderScheduleMaintenanceForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'update-task' && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }} onClick={handleUpdateTaskProgress}>
              Update Progress
            </Button>
          )}
          {dialogType === 'schedule-maintenance' && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }} onClick={handleScheduleMaintenance}>
              Schedule
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OperatorDashboard;
