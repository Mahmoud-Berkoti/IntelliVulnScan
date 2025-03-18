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
  Tab,
  Tabs,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Computer as ComputerIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import axios from 'axios';

// Types
interface Asset {
  id: number;
  name: string;
  description: string;
  asset_type: string;
  hostname: string;
  ip_address: string;
  operating_system: string;
  owner: string;
  environment: string;
  criticality: string;
  created_at: string;
  updated_at: string;
}

interface Vulnerability {
  id: number;
  title: string;
  description: string;
  cve_id: string;
  severity: string;
  cvss_score: number;
  status: string;
  discovered_date: string;
}

interface Scan {
  id: number;
  name: string;
  scanner_type: string;
  status: string;
  start_time: string;
  end_time: string;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`asset-tabpanel-${index}`}
      aria-labelledby={`asset-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AssetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);

  useEffect(() => {
    const fetchAssetData = async () => {
      try {
        setLoading(true);
        const assetResponse = await axios.get(`/api/assets/${id}`);
        setAsset(assetResponse.data);
        
        const vulnerabilitiesResponse = await axios.get(`/api/assets/${id}/vulnerabilities`);
        setVulnerabilities(vulnerabilitiesResponse.data);
        
        const scansResponse = await axios.get(`/api/assets/${id}/scans`);
        setScans(scansResponse.data);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching asset data:', err);
        setError('Failed to load asset data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAssetData();
    }
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleStartScan = async () => {
    try {
      await axios.post(`/api/scans`, {
        asset_id: id,
        scanner_type: 'trivy',
        name: `Scan for ${asset?.name}`,
        description: `Automated scan for ${asset?.name}`,
      });
      
      // Refresh scans list
      const scansResponse = await axios.get(`/api/assets/${id}/scans`);
      setScans(scansResponse.data);
      
      // Switch to scans tab
      setTabValue(1);
    } catch (err) {
      console.error('Error starting scan:', err);
      setError('Failed to start scan. Please try again.');
    }
  };

  const handleDeleteAsset = async () => {
    if (window.confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/assets/${id}`);
        navigate('/assets');
      } catch (err) {
        console.error('Error deleting asset:', err);
        setError('Failed to delete asset. Please try again.');
      }
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality.toLowerCase()) {
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
          onClick={() => navigate('/assets')}
          sx={{ mt: 2 }}
        >
          Back to Assets
        </Button>
      </Box>
    );
  }

  if (!asset) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Asset not found</Typography>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/assets')}
          sx={{ mt: 2 }}
        >
          Back to Assets
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Button 
            variant="text" 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/assets')}
            sx={{ mb: 1 }}
          >
            Back to Assets
          </Button>
          <Typography variant="h4">{asset.name}</Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
            {asset.description}
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={handleStartScan}
            sx={{ mr: 1 }}
          >
            Start Scan
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/assets/${id}/edit`)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteAsset}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* Asset Info Card */}
      <Paper sx={{ mb: 3, p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ComputerIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Asset Information</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Asset Type</Typography>
                <Typography variant="body1">{asset.asset_type}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Hostname</Typography>
                <Typography variant="body1">{asset.hostname || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">IP Address</Typography>
                <Typography variant="body1">{asset.ip_address || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Operating System</Typography>
                <Typography variant="body1">{asset.operating_system || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SecurityIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Security Information</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Environment</Typography>
                <Typography variant="body1">{asset.environment}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Criticality</Typography>
                <Chip 
                  label={asset.criticality} 
                  color={getCriticalityColor(asset.criticality) as any}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Owner</Typography>
                <Typography variant="body1">{asset.owner || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Last Updated</Typography>
                <Typography variant="body1">
                  {new Date(asset.updated_at).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="asset tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Vulnerabilities" id="asset-tab-0" aria-controls="asset-tabpanel-0" />
          <Tab label="Scan History" id="asset-tab-1" aria-controls="asset-tabpanel-1" />
        </Tabs>

        {/* Vulnerabilities Tab */}
        <TabPanel value={tabValue} index={0}>
          {vulnerabilities.length > 0 ? (
            <List>
              {vulnerabilities.map((vuln) => (
                <Paper key={vuln.id} sx={{ mb: 2 }}>
                  <ListItem
                    secondaryAction={
                      <Tooltip title="View Details">
                        <IconButton edge="end" onClick={() => navigate(`/vulnerabilities/${vuln.id}`)}>
                          <ArrowBackIcon sx={{ transform: 'rotate(180deg)' }} />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemIcon>
                      <Chip 
                        label={vuln.severity} 
                        color={getSeverityColor(vuln.severity) as any}
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {vuln.title}
                          </Typography>
                          {vuln.cve_id && (
                            <Chip 
                              label={vuln.cve_id} 
                              size="small" 
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
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
                            <Typography variant="body2" color="textSecondary" sx={{ ml: 2 }}>
                              Discovered: {new Date(vuln.discovered_date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                </Paper>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1">No vulnerabilities found for this asset.</Typography>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleStartScan}
                sx={{ mt: 2 }}
              >
                Run a Scan
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* Scan History Tab */}
        <TabPanel value={tabValue} index={1}>
          {scans.length > 0 ? (
            <List>
              {scans.map((scan) => (
                <Paper key={scan.id} sx={{ mb: 2 }}>
                  <ListItem
                    secondaryAction={
                      <Tooltip title="View Scan Details">
                        <IconButton edge="end" onClick={() => navigate(`/scans/${scan.id}`)}>
                          <ArrowBackIcon sx={{ transform: 'rotate(180deg)' }} />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemIcon>
                      <HistoryIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {scan.name}
                          </Typography>
                          <Chip 
                            label={scan.status} 
                            color={scan.status === 'completed' ? 'success' : 
                                  scan.status === 'failed' ? 'error' : 
                                  scan.status === 'in_progress' ? 'warning' : 'default'}
                            size="small" 
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Scanner: {scan.scanner_type}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Typography variant="body2" color="textSecondary">
                              Started: {new Date(scan.start_time).toLocaleString()}
                            </Typography>
                            {scan.end_time && (
                              <Typography variant="body2" color="textSecondary" sx={{ ml: 2 }}>
                                Completed: {new Date(scan.end_time).toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', mt: 1 }}>
                            <Chip 
                              label={`Critical: ${scan.critical_count}`} 
                              color="error"
                              size="small" 
                              sx={{ mr: 1 }}
                            />
                            <Chip 
                              label={`High: ${scan.high_count}`} 
                              color="warning"
                              size="small" 
                              sx={{ mr: 1 }}
                            />
                            <Chip 
                              label={`Medium: ${scan.medium_count}`} 
                              color="info"
                              size="small" 
                              sx={{ mr: 1 }}
                            />
                            <Chip 
                              label={`Low: ${scan.low_count}`} 
                              color="success"
                              size="small" 
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                </Paper>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1">No scan history for this asset.</Typography>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleStartScan}
                sx={{ mt: 2 }}
              >
                Run a Scan
              </Button>
            </Box>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AssetDetail; 