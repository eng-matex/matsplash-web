import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Chip,
  Stack,
  LinearProgress,
  Alert,
  AlertTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
} from '@mui/material';
import {
  Face,
  DirectionsCar,
  Person,
  Pets,
  ShoppingCart,
  DirectionsWalk,
  DirectionsRun,
  Warning,
  CheckCircle,
  TrendingUp,
  Timeline,
  Assessment,
  Psychology,
  SmartToy,
  Visibility,
  MotionPhotosAuto,
} from '@mui/icons-material';

interface AIFeature {
  id: string;
  name: string;
  enabled: boolean;
  accuracy: number;
  detections: number;
  icon: React.ReactNode;
}

interface Detection {
  id: number;
  type: string;
  confidence: number;
  timestamp: string;
  cameraId: number;
  cameraName: string;
  thumbnail?: string;
}

export default function AIAnalytics() {
  const [aiFeatures, setAiFeatures] = useState<AIFeature[]>([]);
  const [recentDetections, setRecentDetections] = useState<Detection[]>([]);
  const [timeRange, setTimeRange] = useState('today');
  const [analytics, setAnalytics] = useState({
    totalDetections: 0,
    averageConfidence: 0,
    falsePositives: 0,
    alerts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAIData();
  }, [timeRange]);

  const fetchAIData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch AI features
      const featuresResponse = await fetch('http://localhost:3002/api/surveillance/ai/features', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const featuresData = await featuresResponse.json();
      
      if (featuresData.success) {
        const featuresWithIcons = featuresData.features.map((feature: any) => ({
          ...feature,
          icon: getFeatureIcon(feature.id)
        }));
        setAiFeatures(featuresWithIcons);
      }

      // Fetch recent detections
      const detectionsResponse = await fetch('http://localhost:3002/api/surveillance/ai/detections', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const detectionsData = await detectionsResponse.json();
      
      if (detectionsData.success) {
        const formattedDetections = detectionsData.detections.map((detection: any) => ({
          ...detection,
          timestamp: formatTimestamp(detection.timestamp)
        }));
        setRecentDetections(formattedDetections);
      }

      // Fetch analytics
      const analyticsResponse = await fetch('http://localhost:3002/api/surveillance/ai/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const analyticsData = await analyticsResponse.json();
      
      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFeatureIcon = (featureId: string) => {
    switch (featureId) {
      case 'face': return <Face />;
      case 'person': return <Person />;
      case 'vehicle': return <DirectionsCar />;
      case 'license': return <DirectionsCar />;
      case 'object': return <ShoppingCart />;
      case 'motion': return <MotionPhotosAuto />;
      case 'behavior': return <Psychology />;
      case 'crowd': return <Person />;
      default: return <Visibility />;
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

  const handleFeatureToggle = async (featureId: string) => {
    setAiFeatures(prev =>
      prev.map(feature =>
        feature.id === featureId ? { ...feature, enabled: !feature.enabled } : feature
      )
    );
    
    // Update feature status via API
    try {
      const response = await axios.put(`http://localhost:3002/api/ai/features/${featureId}`, {
        enabled: enabled
      }, { headers });
      
      if (response.data.success) {
        console.log('Feature status updated successfully');
      }
    } catch (error) {
      console.error('Error updating feature status:', error);
    }
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3002/api/surveillance/ai/features', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          featureId,
          enabled: !aiFeatures.find(f => f.id === featureId)?.enabled
        })
      });
    } catch (error) {
      console.error('Failed to update feature status:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'success';
    if (confidence >= 75) return 'warning';
    return 'error';
  };

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
          <SmartToy sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              AI Analytics & Detection
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time artificial intelligence monitoring
            </Typography>
          </Box>
        </Stack>

        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={(e, value) => value && setTimeRange(value)}
          size="small"
        >
          <ToggleButton value="today">Today</ToggleButton>
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Analytics Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Visibility sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Detections
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {analytics.totalDetections.toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Assessment sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Confidence
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {analytics.averageConfidence}%
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Warning sx={{ fontSize: 40, color: 'warning.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    False Positives
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {analytics.falsePositives}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <TrendingUp sx={{ fontSize: 40, color: 'error.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Active Alerts
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {analytics.alerts}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* AI Features */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              AI Features
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              {aiFeatures.map((feature) => (
                <Card key={feature.id} variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                        <Avatar sx={{ bgcolor: feature.enabled ? 'primary.main' : 'grey.400' }}>
                          {feature.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {feature.name}
                          </Typography>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Typography variant="body2" color="text.secondary">
                              Accuracy: {feature.accuracy}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              • Detections: {feature.detections.toLocaleString()}
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={feature.accuracy}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            color={feature.accuracy >= 90 ? 'success' : 'warning'}
                          />
                        </Box>
                      </Stack>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={feature.enabled}
                            onChange={() => handleFeatureToggle(feature.id)}
                            color="primary"
                          />
                        }
                        label=""
                      />
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Recent Detections */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Recent Detections
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List>
              {recentDetections.map((detection) => (
                <ListItem
                  key={detection.id}
                  sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={`${detection.confidence}%`}
                      color={getConfidenceColor(detection.confidence)}
                    >
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {detection.type === 'Face' && <Face />}
                        {detection.type === 'Person' && <Person />}
                        {detection.type === 'Vehicle' && <DirectionsCar />}
                        {detection.type === 'Motion' && <MotionPhotosAuto />}
                        {detection.type === 'Object' && <ShoppingCart />}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="bold">
                        {detection.type} Detected
                      </Typography>
                    }
                    secondary={
                      <Stack direction="row" spacing={1}>
                        <Chip label={detection.cameraName} size="small" />
                        <Typography variant="body2" color="text.secondary">
                          • {detection.timestamp}
                        </Typography>
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* AI Insights */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          AI Insights & Recommendations
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {recentDetections.length > 0 || analytics.totalDetections > 0 ? (
          <Grid container spacing={2}>
            {analytics.totalDetections > 0 && (
              <Grid item xs={12} md={6}>
                <Alert severity="info" icon={<Assessment />}>
                  <AlertTitle>System Status</AlertTitle>
                  {analytics.totalDetections} detections processed in the last {timeRange} with {analytics.averageConfidence}% average confidence.
                </Alert>
              </Grid>
            )}
            
            {analytics.falsePositives > 0 && (
              <Grid item xs={12} md={6}>
                <Alert severity="warning" icon={<Warning />}>
                  <AlertTitle>Quality Alert</AlertTitle>
                  {analytics.falsePositives} false positives detected. Consider reviewing detection thresholds.
                </Alert>
              </Grid>
            )}
            
            {analytics.alerts > 0 && (
              <Grid item xs={12} md={6}>
                <Alert severity="error" icon={<Warning />}>
                  <AlertTitle>Active Alerts</AlertTitle>
                  {analytics.alerts} active security alerts require attention.
                </Alert>
              </Grid>
            )}
            
            {recentDetections.length > 0 && (
              <Grid item xs={12} md={6}>
                <Alert severity="success" icon={<CheckCircle />}>
                  <AlertTitle>Recent Activity</AlertTitle>
                  {recentDetections.length} detections in the last 24 hours. System is actively monitoring.
                </Alert>
              </Grid>
            )}
          </Grid>
        ) : (
          <Alert severity="info" icon={<Assessment />}>
            <AlertTitle>No Data Available</AlertTitle>
            AI Analytics data will appear here once detections are processed. Enable AI features and start monitoring to see insights and recommendations.
          </Alert>
        )}
      </Paper>
    </Box>
  );
}