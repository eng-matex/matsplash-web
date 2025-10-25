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
  Login
} from '@mui/icons-material';
import axios from 'axios';
import AttendanceManagement from './AttendanceManagement';
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
  const [newVisitor, setNewVisitor] = useState({
    visitor_name: '',
    visitor_phone: '',
    visitor_company: '',
    purpose: '',
    vehicle_number: '',
    id_number: '',
    contact_person: ''
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
          // Fetch gate activity from API
          try {
            const activityResponse = await axios.get('http://localhost:3002/api/security/gate-activity', { headers });
            setGateLogs(activityResponse.data.data || []);
          } catch (error) {
            console.error('Error fetching gate activity:', error);
            setGateLogs([]);
          }
          break;
        case 'gate-log':
          // Fetch gate logs from API
          try {
            const logsResponse = await axios.get('http://localhost:3002/api/security/gate-logs', { headers });
            setGateLogs(logsResponse.data.data || []);
          } catch (error) {
            console.error('Error fetching gate logs:', error);
            setGateLogs([]);
          }
          break;
        case 'incident-reports':
          // Fetch incident reports from API
          try {
            const reportsResponse = await axios.get('http://localhost:3002/api/security/incident-reports', { headers });
            setIncidentReports(reportsResponse.data.data || []);
          } catch (error) {
            console.error('Error fetching incident reports:', error);
            setIncidentReports([]);
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
    setNewIncident({
      type: '',
      description: '',
      location: '',
      severity: 'low',
      reported_by: '',
      status: 'open'
    });
    setNewVisitor({
      visitor_name: '',
      visitor_phone: '',
      visitor_company: '',
      purpose: '',
      vehicle_number: '',
      id_number: '',
      contact_person: ''
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

  const handleSubmitVisitor = async () => {
    if (!newVisitor.visitor_name || !newVisitor.visitor_phone || !newVisitor.purpose) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const newLog = {
        id: gateLogs.length + 1,
        log_number: `GATE${String(gateLogs.length + 1).padStart(3, '0')}`,
        ...newVisitor,
        entry_time: new Date().toISOString(),
        exit_time: null,
        status: 'inside',
        security_guard: 'Current Security Guard'
      };

      setGateLogs([newLog, ...gateLogs]);
      alert('Visitor entry recorded successfully!');
      handleCloseDialog();
    } catch (error) {
      console.error('Error recording visitor entry:', error);
      alert('Error recording visitor entry. Please try again.');
    }
  };

  const handleRecordExit = async () => {
    if (!selectedItem) return;

    try {
      const updatedLogs = gateLogs.map(log =>
        log.id === selectedItem.id
          ? { ...log, exit_time: new Date().toISOString(), status: 'exited' }
          : log
      );
      setGateLogs(updatedLogs);
      alert('Visitor exit recorded successfully!');
      handleCloseDialog();
    } catch (error) {
      console.error('Error recording exit:', error);
      alert('Error recording exit. Please try again.');
    }
  };

  const handleSubmitIncident = async () => {
    if (!newIncident.type || !newIncident.description || !newIncident.location) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const newReport = {
        id: incidentReports.length + 1,
        report_number: `INC${String(incidentReports.length + 1).padStart(3, '0')}`,
        ...newIncident,
        reported_by: 'Current Security Guard',
        created_at: new Date().toISOString()
      };

      setIncidentReports([newReport, ...incidentReports]);
      alert('Incident report submitted successfully!');
      handleCloseDialog();
    } catch (error) {
      console.error('Error submitting incident report:', error);
      alert('Error submitting incident report. Please try again.');
    }
  };

  const handleUpdateIncidentStatus = async () => {
    if (!selectedItem) return;

    try {
      const updatedReports = incidentReports.map(incident =>
        incident.id === selectedItem.id
          ? { ...incident, status: incident.status === 'open' ? 'investigating' : 'resolved' }
          : incident
      );
      setIncidentReports(updatedReports);
      alert('Incident status updated successfully!');
      handleCloseDialog();
    } catch (error) {
      console.error('Error updating incident status:', error);
      alert('Error updating incident status. Please try again.');
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
                <Login sx={{ mr: 1, color: '#13bbc6' }} />
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

  const renderNewVisitorForm = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
        New Visitor Entry
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Visitor Name *"
            value={newVisitor.visitor_name}
            onChange={(e) => setNewVisitor({ ...newVisitor, visitor_name: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number *"
            value={newVisitor.visitor_phone}
            onChange={(e) => setNewVisitor({ ...newVisitor, visitor_phone: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Company/Organization"
            value={newVisitor.visitor_company}
            onChange={(e) => setNewVisitor({ ...newVisitor, visitor_company: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Purpose of Visit *</InputLabel>
            <Select
              value={newVisitor.purpose}
              onChange={(e) => setNewVisitor({ ...newVisitor, purpose: e.target.value })}
            >
              <MenuItem value="delivery">Delivery</MenuItem>
              <MenuItem value="pickup">Pickup</MenuItem>
              <MenuItem value="meeting">Meeting</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="inspection">Inspection</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Vehicle Number"
            value={newVisitor.vehicle_number}
            onChange={(e) => setNewVisitor({ ...newVisitor, vehicle_number: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="ID Number"
            value={newVisitor.id_number}
            onChange={(e) => setNewVisitor({ ...newVisitor, id_number: e.target.value })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Contact Person"
            value={newVisitor.contact_person}
            onChange={(e) => setNewVisitor({ ...newVisitor, contact_person: e.target.value })}
            placeholder="Name of person they are visiting"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderExitVisitorForm = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
        Record Visitor Exit
      </Typography>
      {selectedItem && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Visitor: {selectedItem.visitor_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Company: {selectedItem.visitor_company}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Purpose: {selectedItem.purpose}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Entry Time: {new Date(selectedItem.entry_time).toLocaleString()}
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              This will record the visitor's exit time as {new Date().toLocaleString()}
            </Alert>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderNewIncidentForm = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
        Report New Incident
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Incident Type *</InputLabel>
            <Select
              value={newIncident.type}
              onChange={(e) => setNewIncident({ ...newIncident, type: e.target.value })}
            >
              <MenuItem value="Unauthorized Access">Unauthorized Access</MenuItem>
              <MenuItem value="Vehicle Accident">Vehicle Accident</MenuItem>
              <MenuItem value="Theft">Theft</MenuItem>
              <MenuItem value="Vandalism">Vandalism</MenuItem>
              <MenuItem value="Suspicious Activity">Suspicious Activity</MenuItem>
              <MenuItem value="Equipment Damage">Equipment Damage</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Severity *</InputLabel>
            <Select
              value={newIncident.severity}
              onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Location *"
            value={newIncident.location}
            onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
            required
            placeholder="e.g., Main Gate, Loading Bay, Production Floor"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Description *"
            value={newIncident.description}
            onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
            required
            placeholder="Provide detailed description of the incident..."
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderViewLogDetails = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
        Gate Log Details
      </Typography>
      {selectedItem && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Log Number</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.log_number}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip
              label={selectedItem.status.toUpperCase()}
              color={getStatusColor(selectedItem.status) as any}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Visitor Name</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.visitor_name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Phone Number</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.visitor_phone}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Company</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.visitor_company}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Purpose</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.purpose}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Vehicle Number</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.vehicle_number || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Security Guard</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.security_guard}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Entry Time</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{new Date(selectedItem.entry_time).toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Exit Time</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {selectedItem.exit_time ? new Date(selectedItem.exit_time).toLocaleString() : 'Still inside'}
            </Typography>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderViewIncidentDetails = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
        Incident Details
      </Typography>
      {selectedItem && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Report Number</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.report_number}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip
              label={selectedItem.status}
              color={getStatusColor(selectedItem.status) as any}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Type</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.type}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Severity</Typography>
            <Chip
              label={selectedItem.severity.toUpperCase()}
              color={getSeverityColor(selectedItem.severity) as any}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Location</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.location}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.description}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Reported By</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{selectedItem.reported_by}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Date Reported</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{new Date(selectedItem.created_at).toLocaleString()}</Typography>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderUpdateIncidentForm = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
        Update Incident Status
      </Typography>
      {selectedItem && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Incident: {selectedItem.report_number} - {selectedItem.type}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current Status: {selectedItem.status}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Severity: {selectedItem.severity}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Location: {selectedItem.location}
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              This will update the status to: {selectedItem.status === 'open' ? 'Investigating' : 'Resolved'}
            </Alert>
          </Grid>
        </Grid>
      )}
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
      case 'my-attendance':
        return <AttendanceManagement selectedSection={selectedSection} userRole="security" />;
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
          {dialogType === 'new-visitor' && renderNewVisitorForm()}
          {dialogType === 'view-log' && renderViewLogDetails()}
          {dialogType === 'exit-visitor' && renderExitVisitorForm()}
          {dialogType === 'new-incident' && renderNewIncidentForm()}
          {dialogType === 'view-incident' && renderViewIncidentDetails()}
          {dialogType === 'update-incident' && renderUpdateIncidentForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType === 'new-visitor' && (
            <Button variant="contained" sx={{ bgcolor: '#13bbc6' }} onClick={handleSubmitVisitor}>
              Submit
            </Button>
          )}
          {dialogType === 'exit-visitor' && (
            <Button variant="contained" sx={{ bgcolor: '#f44336' }} onClick={handleRecordExit}>
              Record Exit
            </Button>
          )}
          {dialogType === 'new-incident' && (
            <Button variant="contained" sx={{ bgcolor: '#f44336' }} onClick={handleSubmitIncident}>
              Submit
            </Button>
          )}
          {dialogType === 'update-incident' && (
            <Button variant="contained" sx={{ bgcolor: '#ff9800' }} onClick={handleUpdateIncidentStatus}>
              Update Status
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityDashboard;
