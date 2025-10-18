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
  Security,
  Assessment,
  AccessTime,
  CheckCircle,
  Warning,
  Add,
  Edit,
  Delete,
  Visibility,
  Person,
  DirectionsCar,
  Business,
  LocalShipping,
  Report,
  CameraAlt,
  Shield,
  Lock,
  ExitToApp,
  Entry
} from '@mui/icons-material';
import axios from 'axios';
import SurveillanceManagement from './SurveillanceManagement';

interface SecurityDashboardProps {
  selectedSection: string;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ selectedSection }) => {
  const [loading, setLoading] = useState(false);
  const [gateLogs, setGateLogs] = useState<any[]>([]);
  const [incidentReports, setIncidentReports] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newIncident, setNewIncident] = useState({
    type: '',
    description: '',
    location: '',
    severity: 'low',
    reported_by: '',
    status: 'open'
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
          // Mock gate activity data
          setGateLogs([
            {
              id: 1,
              log_number: 'GATE001',
              visitor_name: 'John Doe',
              visitor_phone: '08012345678',
              visitor_company: 'ABC Suppliers',
              purpose: 'Delivery',
              vehicle_number: 'ABC123',
              entry_time: new Date().toISOString(),
              exit_time: null,
              status: 'inside',
              security_guard: 'Security Guard 1'
            },
            {
              id: 2,
              log_number: 'GATE002',
              visitor_name: 'Jane Smith',
              visitor_phone: '08087654321',
              visitor_company: 'XYZ Logistics',
              purpose: 'Pickup',
              vehicle_number: 'XYZ789',
              entry_time: new Date(Date.now() - 3600000).toISOString(),
              exit_time: new Date(Date.now() - 1800000).toISOString(),
              status: 'exited',
              security_guard: 'Security Guard 2'
            }
          ]);
          break;
        case 'gate-log':
          // Same as overview for gate logs
          setGateLogs([
            {
              id: 1,
              log_number: 'GATE001',
              visitor_name: 'John Doe',
              visitor_phone: '08012345678',
              visitor_company: 'ABC Suppliers',
              purpose: 'Delivery',
              vehicle_number: 'ABC123',
              entry_time: new Date().toISOString(),
              exit_time: null,
              status: 'inside',
              security_guard: 'Security Guard 1'
            },
            {
              id: 2,
              log_number: 'GATE002',
              visitor_name: 'Jane Smith',
              visitor_phone: '08087654321',
              visitor_company: 'XYZ Logistics',
              purpose: 'Pickup',
              vehicle_number: 'XYZ789',
              entry_time: new Date(Date.now() - 3600000).toISOString(),
              exit_time: new Date(Date.now() - 1800000).toISOString(),
              status: 'exited',
              security_guard: 'Security Guard 2'
            }
          ]);
          break;
        case 'incident-reports':
          // Mock incident reports data
          setIncidentReports([
            {
              id: 1,
              report_number: 'INC001',
              type: 'Unauthorized Access',
              description: 'Person attempted to enter restricted area without proper authorization',
              location: 'Main Gate',
              severity: 'medium',
              reported_by: 'Security Guard 1',
              status: 'investigating',
              created_at: new Date().toISOString()
            },
            {
              id: 2,
              report_number: 'INC002',
              type: 'Vehicle Accident',
              description: 'Minor collision between delivery truck and company vehicle',
              location: 'Loading Bay',
              severity: 'low',
              reported_by: 'Security Guard 2',
              status: 'resolved',
              created_at: new Date(Date.now() - 86400000).toISOString()
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
    setNewIncident({
      type: '',
      description: '',
      location: '',
      severity: 'low',
      reported_by: '',
      status: 'open'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'inside': return 'info';
      case 'exited': return 'success';
      case 'open': return 'warning';
      case 'investigating': return 'info';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getPurposeIcon = (purpose: string) => {
    switch (purpose?.toLowerCase()) {
      case 'delivery': return <LocalShipping />;
      case 'pickup': return <DirectionsCar />;
      case 'meeting': return <Business />;
      case 'maintenance': return <Edit />;
      default: return <Person />;
    }
  };

  const renderOverview = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
        Security Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Entry sx={{ mr: 1, color: '#13bbc6' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Visitors Inside</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#13bbc6', fontWeight: 700 }}>
                {gateLogs.filter(log => log.status === 'inside').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Currently on premises
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ExitToApp sx={{ mr: 1, color: '#4caf50' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Today's Entries</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 700 }}>
                {gateLogs.filter(log => new Date(log.entry_time).toDateString() === new Date().toDateString()).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total visitors
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ mr: 1, color: '#ff9800' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Open Incidents</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 700 }}>
                {incidentReports.filter(incident => incident.status === 'open' || incident.status === 'investigating').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Requiring attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Shield sx={{ mr: 1, color: '#9c27b0' }} />
                <Typography variant="h6" sx={{ color: '#2c3e50' }}>Security Status</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 700 }}>
                SECURE
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All systems normal
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
                Current Visitors
              </Typography>
              {gateLogs.filter(log => log.status === 'inside').length > 0 ? (
                <List>
                  {gateLogs.filter(log => log.status === 'inside').map((log) => (
                    <ListItem key={log.id} sx={{ px: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                        <ListItemIcon>
                          {getPurposeIcon(log.purpose)}
                        </ListItemIcon>
                        <ListItemText
                          primary={log.visitor_name}
                          secondary={`${log.visitor_company} - ${log.purpose}`}
                        />
                        <Chip 
                          label={log.status.toUpperCase()} 
                          color={getStatusColor(log.status) as any}
                          size="small"
                        />
                      </Box>
                      <Box sx={{ ml: 4, width: '100%' }}>
                        <Typography variant="body2" color="text.secondary">
                          Phone: {log.visitor_phone}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Vehicle: {log.vehicle_number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Entry: {new Date(log.entry_time).toLocaleTimeString()}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ExitToApp />}
                          onClick={() => handleOpenDialog('exit-visitor', log)}
                          sx={{ mt: 1 }}
                        >
                          Record Exit
                        </Button>
                      </Box>
                      <Divider sx={{ width: '100%', mt: 1 }} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">No visitors currently on premises</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                Recent Incidents
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Report ID</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {incidentReports.slice(0, 5).map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell>{incident.report_number}</TableCell>
                        <TableCell>{incident.type}</TableCell>
                        <TableCell>
                          <Chip 
                            label={incident.severity.toUpperCase()} 
                            color={getSeverityColor(incident.severity) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={incident.status} 
                            color={getStatusColor(incident.status) as any}
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

  const renderGateLog = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Gate Activity Log
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('new-visitor')}
          sx={{ bgcolor: '#13bbc6' }}
          className="dashboard-button"
        >
          New Visitor Entry
        </Button>
      </Box>

      <Card className="dashboard-card">
        <CardContent>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="All Entries" />
            <Tab label="Currently Inside" />
            <Tab label="Today's Entries" />
            <Tab label="Vehicle Logs" />
          </Tabs>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Log ID</TableCell>
                  <TableCell>Visitor</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Purpose</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Entry Time</TableCell>
                  <TableCell>Exit Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gateLogs
                  .filter(log => {
                    if (selectedTab === 0) return true;
                    if (selectedTab === 1) return log.status === 'inside';
                    if (selectedTab === 2) return new Date(log.entry_time).toDateString() === new Date().toDateString();
                    if (selectedTab === 3) return log.vehicle_number;
                    return true;
                  })
                  .map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.log_number}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">{log.visitor_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{log.visitor_phone}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{log.visitor_company}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getPurposeIcon(log.purpose)}
                          <Typography sx={{ ml: 1 }}>{log.purpose}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{log.vehicle_number}</TableCell>
                      <TableCell>{new Date(log.entry_time).toLocaleString()}</TableCell>
                      <TableCell>
                        {log.exit_time ? new Date(log.exit_time).toLocaleString() : 'Still inside'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.status.toUpperCase()} 
                          color={getStatusColor(log.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleOpenDialog('view-log', log)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {log.status === 'inside' && (
                          <Tooltip title="Record Exit">
                            <IconButton size="small" onClick={() => handleOpenDialog('exit-visitor', log)}>
                              <ExitToApp />
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

  const renderIncidentReports = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Incident Reports
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('new-incident')}
          sx={{ bgcolor: '#f44336' }}
          className="dashboard-button"
        >
          Report Incident
        </Button>
      </Box>

      <Card className="dashboard-card">
        <CardContent>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="All Incidents" />
            <Tab label="Open" />
            <Tab label="Investigating" />
            <Tab label="Resolved" />
          </Tabs>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reported By</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {incidentReports
                  .filter(incident => {
                    if (selectedTab === 0) return true;
                    if (selectedTab === 1) return incident.status === 'open';
                    if (selectedTab === 2) return incident.status === 'investigating';
                    if (selectedTab === 3) return incident.status === 'resolved';
                    return true;
                  })
                  .map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell>{incident.report_number}</TableCell>
                      <TableCell>{incident.type}</TableCell>
                      <TableCell>
                        <Tooltip title={incident.description}>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {incident.description}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{incident.location}</TableCell>
                      <TableCell>
                        <Chip 
                          label={incident.severity.toUpperCase()} 
                          color={getSeverityColor(incident.severity) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={incident.status} 
                          color={getStatusColor(incident.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{incident.reported_by}</TableCell>
                      <TableCell>{new Date(incident.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleOpenDialog('view-incident', incident)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Update Status">
                          <IconButton size="small" onClick={() => handleOpenDialog('update-incident', incident)}>
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
      case 'gate-log':
        return renderGateLog();
      case 'incident-reports':
        return renderIncidentReports();
      case 'surveillance':
        return <SurveillanceManagement selectedSection={selectedSection} userRole="security" />;
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
          {dialogType === 'new-visitor' && 'New Visitor Entry'}
          {dialogType === 'view-log' && 'Gate Log Details'}
          {dialogType === 'exit-visitor' && 'Record Visitor Exit'}
          {dialogType === 'new-incident' && 'Report New Incident'}
          {dialogType === 'view-incident' && 'Incident Details'}
          {dialogType === 'update-incident' && 'Update Incident Status'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogType.includes('visitor') && 'Visitor management functionality will be implemented here.'}
            {dialogType.includes('incident') && 'Incident reporting and management functionality will be implemented here.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {!dialogType.includes('view') && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }}>
              {dialogType.includes('new') ? 'Submit' : 'Update'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityDashboard;
