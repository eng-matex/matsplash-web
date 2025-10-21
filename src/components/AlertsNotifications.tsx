import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  Avatar,
  Chip,
  IconButton,
  Badge,
  Stack,
  Divider,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  CircularProgress,
} from '@mui/material';
import {
  Warning,
  Error as ErrorIcon,
  Info,
  CheckCircle,
  NotificationsActive,
  NotificationsOff,
  Delete,
  MarkEmailRead,
  FilterList,
  Settings,
  Videocam,
  Person,
  DirectionsCar,
  LocalFireDepartment,
  Security,
  MotionPhotosAuto,
  Face,
  VolumeUp,
  Email,
  Sms,
  Add,
} from '@mui/icons-material';

interface AlertItem {
  id: number;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  cameraId: number;
  cameraName: string;
  read: boolean;
  icon: React.ReactNode;
  category: string;
}

interface AlertRule {
  id: number;
  name: string;
  enabled: boolean;
  type: string;
  conditions: string;
  actions: string[];
}

export default function AlertsNotifications() {
  const [tabValue, setTabValue] = useState(0);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlertsData();
  }, []);

  const fetchAlertsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch alerts
      const alertsResponse = await fetch('http://localhost:3002/api/surveillance/alerts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const alertsData = await alertsResponse.json();
      
      if (alertsData.success) {
        const alertsWithIcons = alertsData.alerts.map((alert: any) => ({
          ...alert,
          icon: getAlertIcon(alert.type, alert.category),
          timestamp: formatTimestamp(alert.timestamp)
        }));
        setAlerts(alertsWithIcons);
      }

      // Fetch alert rules
      const rulesResponse = await fetch('http://localhost:3002/api/surveillance/alerts/rules', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const rulesData = await rulesResponse.json();
      
      if (rulesData.success) {
        setAlertRules(rulesData.rules);
      }
    } catch (error) {
      console.error('Failed to fetch alerts data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string, category: string) => {
    switch (category) {
      case 'Security': return <Security />;
      case 'Motion': return <MotionPhotosAuto />;
      case 'Recognition': return <Face />;
      case 'Vehicle': return <DirectionsCar />;
      case 'System': return <Videocam />;
      default: return <Warning />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const handleAlertClick = (alert: AlertItem) => {
    setSelectedAlert(alert);
    setDetailDialogOpen(true);
    if (!alert.read) {
      markAsRead(alert.id);
    }
  };

  const markAsRead = async (alertId: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3002/api/surveillance/alerts/${alertId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId ? { ...alert, read: true } : alert
        )
      );
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
  };

  const deleteAlert = async (alertId: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3002/api/surveillance/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const toggleRule = (ruleId: number) => {
    setAlertRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'default';
    }
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : filter === 'unread'
    ? alerts.filter(a => !a.read)
    : alerts.filter(a => a.type === filter);

  const unreadCount = alerts.filter(a => !a.read).length;

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsActive sx={{ fontSize: 40, color: 'primary.main' }} />
          </Badge>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Alerts & Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Smart surveillance alerts and event management
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                color="primary"
              />
            }
            label="Notifications"
          />
          <Button
            startIcon={<MarkEmailRead />}
            variant="outlined"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark All Read
          </Button>
          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={() => setRuleDialogOpen(true)}
          >
            New Rule
          </Button>
        </Stack>
      </Stack>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Alerts" />
          <Tab label="Alert Rules" />
          <Tab label="Settings" />
        </Tabs>
      </Paper>

      {/* Alerts Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Filters */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <FilterList />
                <Chip
                  label="All"
                  onClick={() => setFilter('all')}
                  color={filter === 'all' ? 'primary' : 'default'}
                  variant={filter === 'all' ? 'filled' : 'outlined'}
                />
                <Chip
                  label="Unread"
                  onClick={() => setFilter('unread')}
                  color={filter === 'unread' ? 'primary' : 'default'}
                  variant={filter === 'unread' ? 'filled' : 'outlined'}
                />
                <Chip
                  label="Critical"
                  onClick={() => setFilter('critical')}
                  color={filter === 'critical' ? 'error' : 'default'}
                  variant={filter === 'critical' ? 'filled' : 'outlined'}
                />
                <Chip
                  label="Warning"
                  onClick={() => setFilter('warning')}
                  color={filter === 'warning' ? 'warning' : 'default'}
                  variant={filter === 'warning' ? 'filled' : 'outlined'}
                />
                <Chip
                  label="Info"
                  onClick={() => setFilter('info')}
                  color={filter === 'info' ? 'info' : 'default'}
                  variant={filter === 'info' ? 'filled' : 'outlined'}
                />
              </Stack>
            </Paper>
          </Grid>

          {/* Alerts List */}
          <Grid item xs={12}>
            <Paper>
              <List>
                {filteredAlerts.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      primary="No alerts found"
                      secondary="All clear! No alerts match your filter."
                    />
                  </ListItem>
                ) : (
                  filteredAlerts.map((alert) => (
                    <React.Fragment key={alert.id}>
                      <ListItemButton
                        onClick={() => handleAlertClick(alert)}
                        sx={{
                          bgcolor: alert.read ? 'transparent' : 'action.hover',
                          '&:hover': { bgcolor: 'action.selected' },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: `${getAlertColor(alert.type)}.main`,
                            }}
                          >
                            {alert.icon}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography
                                variant="subtitle1"
                                fontWeight={alert.read ? 'normal' : 'bold'}
                              >
                                {alert.title}
                              </Typography>
                              {!alert.read && (
                                <Chip label="New" size="small" color="primary" />
                              )}
                              <Chip label={alert.category} size="small" variant="outlined" />
                            </Stack>
                          }
                          secondary={
                            <Stack spacing={0.5}>
                              <Typography variant="body2" color="text.secondary">
                                {alert.message}
                              </Typography>
                              <Stack direction="row" spacing={1}>
                                <Chip
                                  label={alert.cameraName}
                                  size="small"
                                  icon={<Videocam />}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  • {alert.timestamp}
                                </Typography>
                              </Stack>
                            </Stack>
                          }
                        />
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAlert(alert.id);
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemButton>
                      <Divider />
                    </React.Fragment>
                  ))
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Alert Rules Tab */}
      {tabValue === 1 && (
        <Paper>
          <List>
            {alertRules.map((rule) => (
              <React.Fragment key={rule.id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="subtitle1" fontWeight="bold">
                          {rule.name}
                        </Typography>
                        <Chip label={rule.type} size="small" color="primary" variant="outlined" />
                      </Stack>
                    }
                    secondary={
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Conditions:</strong> {rule.conditions}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Actions:</strong>
                          </Typography>
                          {rule.actions.map((action, idx) => (
                            <Chip key={idx} label={action} size="small" />
                          ))}
                        </Stack>
                      </Stack>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={rule.enabled}
                        onChange={() => toggleRule(rule.id)}
                        color="primary"
                      />
                    }
                    label=""
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Settings Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notification Channels
                </Typography>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <NotificationsActive />
                        <Typography>Push Notifications</Typography>
                      </Stack>
                    }
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Email />
                        <Typography>Email Alerts</Typography>
                      </Stack>
                    }
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Sms />
                        <Typography>SMS Alerts</Typography>
                      </Stack>
                    }
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <VolumeUp />
                        <Typography>Sound Alerts</Typography>
                      </Stack>
                    }
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alert Priorities
                </Typography>
                <Stack spacing={2}>
                  <Alert severity="error">
                    <AlertTitle>Critical Alerts</AlertTitle>
                    Immediate notification via all channels
                  </Alert>
                  <Alert severity="warning">
                    <AlertTitle>Warning Alerts</AlertTitle>
                    Push notification and email
                  </Alert>
                  <Alert severity="info">
                    <AlertTitle>Info Alerts</AlertTitle>
                    Push notification only
                  </Alert>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Alert Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedAlert && (
          <>
            <DialogTitle>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: `${getAlertColor(selectedAlert.type)}.main` }}>
                  {selectedAlert.icon}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedAlert.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedAlert.timestamp}
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Alert severity={getAlertColor(selectedAlert.type)}>
                  {selectedAlert.message}
                </Alert>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Camera Information
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Chip icon={<Videocam />} label={selectedAlert.cameraName} />
                    <Chip label={`Camera #${selectedAlert.cameraId}`} variant="outlined" />
                    <Chip label={selectedAlert.category} color="primary" variant="outlined" />
                  </Stack>
                </Box>

                <Box sx={{ bgcolor: '#000', height: 300, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="white">Camera Feed Snapshot</Typography>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              <Button variant="contained" startIcon={<Videocam />}>
                View Live Feed
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* New Rule Dialog */}
      <Dialog
        open={ruleDialogOpen}
        onClose={() => setRuleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Alert Rule</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Rule Name" fullWidth />
            <FormControl fullWidth>
              <InputLabel>Detection Type</InputLabel>
              <Select label="Detection Type">
                <MenuItem value="person">Person Detection</MenuItem>
                <MenuItem value="face">Face Recognition</MenuItem>
                <MenuItem value="vehicle">Vehicle Detection</MenuItem>
                <MenuItem value="motion">Motion Detection</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Conditions" fullWidth multiline rows={2} />
            <FormControl fullWidth>
              <InputLabel>Alert Priority</InputLabel>
              <Select label="Alert Priority">
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="info">Info</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setRuleDialogOpen(false)}>
            Create Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}