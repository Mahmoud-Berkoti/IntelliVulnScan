import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Security as SecurityIcon,
  BugReport as BugReportIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import apiService from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalAssets: number;
  totalVulnerabilities: number;
  activeScanners: number;
  mlModelAccuracy: number;
}

interface VulnerabilityTrend {
  date: string;
  high: number;
  medium: number;
  low: number;
}

interface RecentScan {
  id: number;
  assetName: string;
  status: string;
  date: string;
  findings: number;
}

interface TopVulnerableAsset {
  name: string;
  vulnerabilityCount: number;
  severity: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vulnerabilityTrends, setVulnerabilityTrends] = useState<VulnerabilityTrend[]>([]);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [topVulnerableAssets, setTopVulnerableAssets] = useState<TopVulnerableAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, trendsResponse, scansResponse, assetsResponse] = await Promise.all([
          apiService.dashboard.getStats(),
          apiService.dashboard.getVulnerabilityTrends(),
          apiService.dashboard.getRecentScans(),
          apiService.dashboard.getTopVulnerableAssets()
        ]);

        setStats(statsResponse.data);
        setVulnerabilityTrends(trendsResponse.data || []);
        setRecentScans(scansResponse.data || []);
        setTopVulnerableAssets(assetsResponse.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        enqueueSnackbar('Failed to load dashboard data. Please try again later.', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [enqueueSnackbar]);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return <ErrorIcon sx={{ color: '#f44336' }} />;
      case 'medium':
        return <WarningIcon sx={{ color: '#ff9800' }} />;
      case 'low':
        return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
      default:
        return <BugReportIcon />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SecurityIcon sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Assets
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalAssets || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BugReportIcon sx={{ fontSize: 40, color: '#f44336', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Vulnerabilities
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalVulnerabilities || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SpeedIcon sx={{ fontSize: 40, color: '#4caf50', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Scanners
                  </Typography>
                  <Typography variant="h4">
                    {stats?.activeScanners || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssessmentIcon sx={{ fontSize: 40, color: '#9c27b0', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    ML Model Accuracy
                  </Typography>
                  <Typography variant="h4">
                    {stats?.mlModelAccuracy ? `${(stats.mlModelAccuracy * 100).toFixed(1)}%` : '0%'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Vulnerability Trends Chart */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Vulnerability Trends
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vulnerabilityTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="high" name="High" fill="#f44336" />
                  <Bar dataKey="medium" name="Medium" fill="#ff9800" />
                  <Bar dataKey="low" name="Low" fill="#4caf50" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Scans */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Scans
            </Typography>
            <List>
              {recentScans.map((scan, index) => (
                <React.Fragment key={scan.id}>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={scan.assetName}
                      secondary={`${scan.findings} findings - ${new Date(scan.date).toLocaleDateString()}`}
                    />
                  </ListItem>
                  {index < recentScans.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Vulnerable Assets */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top Vulnerable Assets
            </Typography>
            <List>
              {topVulnerableAssets.map((asset, index) => (
                <React.Fragment key={asset.name}>
                  <ListItem>
                    <ListItemIcon>
                      {getSeverityIcon(asset.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={asset.name}
                      secondary={`${asset.vulnerabilityCount} vulnerabilities`}
                    />
                  </ListItem>
                  {index < topVulnerableAssets.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 