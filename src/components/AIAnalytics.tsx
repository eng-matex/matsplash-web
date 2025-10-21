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
  const [aiFeatures, setAiFeatures] = useState<AIFeature[]>([
    { id: 'face', name: 'Face Recognition', enabled: true, accuracy: 94.5, detections: 1247, icon: <Face /> },
    { id: 'person', name: 'Person Detection', enabled: true, accuracy: 96.2, detections: 3891, icon: <Person /> },
    { id: 'vehicle', name: 'Vehicle Detection', enabled: true, accuracy: 92.8, detections: 856, icon: <DirectionsCar /> },
    { id: 'license', name: 'License Plate Recognition', enabled: false, accuracy: 88.3, detections: 234, icon: <DirectionsCar /> },
    { id: 'object', name: 'Object Detection', enabled: true, accuracy: 90.1, detections: 5642, icon: <ShoppingCart /> },
    { id: 'motion', name: 'Motion Detection', enabled: true, accuracy: 98.7, detections: 15234, icon: <MotionPhotosAuto /> },
    { id: 'behavior', name: 'Behavior Analysis', enabled: false, accuracy: 85.4, detections: 67, icon: <Psychology /> },
    { id: 'crowd', name: 'Crowd Detection', enabled: true, accuracy: 91.2, detections: 342, icon: <Person /> },
  ]);

  const [recentDetections, setRecentDetections] = useState<Detection[]>([
    { id: 1, type: 'Face', confidence: 95, timestamp: '2 mins ago', cameraId: 1, cameraName: 'Entrance' },
    { id: 2, type: 'Vehicle', confidence: 92, timestamp: '5 mins ago', cameraId: 2, cameraName: 'Parking' },
    { id: 3, type: 'Person', confidence: 98, timestamp: '8 mins ago', cameraId: 3, cameraName: 'Lobby' },
    { id: 4, type: 'Motion', confidence: 99, timestamp: '10 mins ago', cameraId: 4, cameraName: 'Warehouse' },
    { id: 5, type: 'Object', confidence: 87, timestamp: '15 mins ago', cameraId: 1, cameraName: 'Entrance' },
  ]);

  const [timeRange, setTimeRange] = useState('today');
  const [analytics, setAnalytics] = useState({
    totalDetections: 27456,
    averageConfidence: 93.4,
    falsePositives: 234,
    alerts: 67,
  });

  const handleFeatureToggle = (featureId: string) => {
    setAiFeatures(prev =>
      prev.map(feature =>
        feature.id === featureId ? { ...feature, enabled: !feature.enabled } : feature
      )
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'success';
    if (confidence >= 75) return 'warning';
    return 'error';
  };

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

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Alert severity="success" icon={<CheckCircle />}>
              <AlertTitle>High Performance</AlertTitle>
              Face recognition accuracy is at 94.5% - performing above industry standard of 90%.
            </Alert>
          </Grid>

          <Grid item xs={12} md={6}>
            <Alert severity="warning" icon={<Warning />}>
              <AlertTitle>Recommendation</AlertTitle>
              License plate recognition could be improved with better camera positioning.
            </Alert>
          </Grid>

          <Grid item xs={12} md={6}>
            <Alert severity="info" icon={<Psychology />}>
              <AlertTitle>Pattern Detected</AlertTitle>
              Peak activity detected between 8 AM - 10 AM with 3,200 person detections.
            </Alert>
          </Grid>

          <Grid item xs={12} md={6}>
            <Alert severity="error" icon={<Warning />}>
              <AlertTitle>Alert</AlertTitle>
              Unusual behavior detected in Warehouse area at 3:45 PM - Review recommended.
            </Alert>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

