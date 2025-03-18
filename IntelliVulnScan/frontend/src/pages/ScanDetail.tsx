import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Security as SecurityIcon,
  BugReport as BugReportIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { Scan, Vulnerability } from '../types';

const ScanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<Scan | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScanData = async () => {
    try {
      setLoading(true);
      const scanResponse = await axios.get(`/api/scans/${id}`);
      setScan(scanResponse.data);
      
      const vulnerabilitiesResponse = await axios.get(`/api/scans/${id}/results`);
      setVulnerabilities(vulnerabilitiesResponse.data);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching scan data:', err);
      setError('Failed to load scan data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchScanData();
    }
  }, [id]);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'failed':
        return 'error';
      case 'scheduled':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">{error}</Typography>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/scans')}
          sx={{ mt: 2 }}
        >
          Back to Scans
        </Button>
      </Box>
    );
  }

  if (!scan) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Scan not found</Typography>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/scans')}
          sx={{ mt: 2 }}
        >
          Back to Scans
        </Button>
      </Box>
    );
  }

  const isInProgress = scan.status.toLowerCase() === 'in_progress';

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Button 
            variant="text" 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/scans')}
            sx={{ mb: 1 }}
          >
            Back to Scans
          </Button>
          <Typography variant="h4">{scan.name}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Chip 
              label={scan.status} 
              color={getStatusColor(scan.status) as any}
              sx={{ mr: 2 }}
            />
            <Typography variant="body1" color="textSecondary">
              Scanner: {scan.scanner_type}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchScanData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {isInProgress && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            Scan in progress...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {/* Scan Info Card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ScheduleIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Scan Information</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Start Time</Typography>
                <Typography variant="body1">
                  {new Date(scan.start_time).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">End Time</Typography>
                <Typography variant="body1">
                  {scan.end_time ? new Date(scan.end_time).toLocaleString() : 'In Progress'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Asset</Typography>
                <Button 
                  variant="text" 
                  color="primary" 
                  onClick={() => navigate(`/assets/${scan.asset_id}`)}
                  sx={{ p: 0, textTransform: 'none' }}
                >
                  View Asset
                </Button>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SecurityIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Vulnerability Summary</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'error.light', textAlign: 'center' }}>
                  <Typography variant="h4" color="white">{scan.critical_count}</Typography>
                  <Typography variant="body2" color="white">Critical</Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'warning.light', textAlign: 'center' }}>
                  <Typography variant="h4" color="white">{scan.high_count}</Typography>
                  <Typography variant="body2" color="white">High</Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.light', textAlign: 'center' }}>
                  <Typography variant="h4" color="white">{scan.medium_count}</Typography>
                  <Typography variant="body2" color="white">Medium</Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.light', textAlign: 'center' }}>
                  <Typography variant="h4" color="white">{scan.low_count}</Typography>
                  <Typography variant="body2" color="white">Low</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Vulnerabilities List */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BugReportIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Detected Vulnerabilities</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {vulnerabilities.length > 0 ? (
          <List>
            {vulnerabilities.map((vuln) => (
              <Paper key={vuln.id} sx={{ mb: 2, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Chip 
                      label={vuln.severity} 
                      color={getSeverityColor(vuln.severity) as any}
                      size="small"
                      sx={{ mr: 2, mt: 0.5 }}
                    />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        {vuln.title}
                      </Typography>
                      {vuln.cve_id && (
                        <Chip 
                          label={vuln.cve_id} 
                          size="small" 
                          sx={{ mt: 0.5 }}
                        />
                      )}
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {vuln.description.length > 200 
                          ? `${vuln.description.substring(0, 200)}...` 
                          : vuln.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          CVSS: {vuln.cvss_score}
                        </Typography>
                        <Chip 
                          label={vuln.status} 
                          size="small" 
                          sx={{ ml: 2 }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  <Tooltip title="View Details">
                    <IconButton onClick={() => navigate(`/vulnerabilities/${vuln.id}`)}>
                      <ArrowBackIcon sx={{ transform: 'rotate(180deg)' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1">
              {isInProgress 
                ? 'Scan is in progress. Vulnerabilities will appear here when the scan is complete.' 
                : 'No vulnerabilities were detected in this scan.'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ScanDetail; 