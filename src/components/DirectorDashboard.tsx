import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import DeviceManagement from './DeviceManagement';
import EmployeeManagement from './EmployeeManagement';
import ReportingAnalytics from './ReportingAnalytics';
import SurveillanceManagement from './SurveillanceManagement';

interface DirectorDashboardProps {
  currentPage: string;
}

const DirectorDashboard: React.FC<DirectorDashboardProps> = ({ currentPage }) => {
  const renderContent = () => {
    switch (currentPage) {
      case 'device-management':
        return <DeviceManagement />;
      case 'employee-management':
        return <EmployeeManagement />;
      case 'reporting-analytics':
        return <ReportingAnalytics />;
      case 'surveillance':
        return <SurveillanceManagement />;
      case 'overview':
      default:
        return (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                Director Dashboard Overview
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Welcome to the Director dashboard. You have full access to all system features including device management, employee oversight, reporting, and surveillance.
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                  Key Responsibilities:
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • <strong>Device Management:</strong> Manage all company devices and personal device whitelists
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • <strong>Employee Management:</strong> Oversee all employee accounts and permissions
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • <strong>Reporting & Analytics:</strong> Access comprehensive business reports
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • <strong>Surveillance:</strong> Monitor factory security and operations
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • <strong>Emergency Access:</strong> Full system access with 2FA protection
                </Typography>
              </Box>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <Box>
      {renderContent()}
    </Box>
  );
};

export default DirectorDashboard;
