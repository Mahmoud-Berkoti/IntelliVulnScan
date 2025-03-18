import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormGroup,
  FormControlLabel,
  Divider,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  VpnKey as VpnKeyIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';

interface SystemSettings {
  scan_frequency: string;
  notification_email: string;
  enable_auto_scan: boolean;
  enable_ml_predictions: boolean;
  retention_period: number;
  api_keys: ApiKey[];
  integrations: {
    slack: {
      enabled: boolean;
      webhook_url: string;
      notify_on: string[];
    };
    jira: {
      enabled: boolean;
      url: string;
      api_token: string;
      project_key: string;
    };
    email: {
      enabled: boolean;
      smtp_server: string;
      smtp_port: number;
      use_tls: boolean;
      from_address: string;
    };
  };
  scan_settings: {
    default_scanner: string;
    scan_depth: string;
    include_credentials: boolean;
    parallel_scans: number;
  };
  ui_settings: {
    default_theme: string;
    default_dashboard: string;
    items_per_page: number;
  };
}

interface ApiKey {
  id: number;
  name: string;
  key: string;
  created_at: string;
  expires_at: string;
  last_used: string | null;
}

interface ApiKeyFormData {
  name: string;
}

const Settings: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState<number>(0);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [openKeyDialog, setOpenKeyDialog] = useState<boolean>(false);
  const [newKey, setNewKey] = useState<ApiKey | null>(null);
  const [showToken, setShowToken] = useState<boolean>(false);
  const [apiKeyForm, setApiKeyForm] = useState<ApiKeyFormData>({
    name: ''
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/settings');
      setSettings(response.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
      if (axios.isAxiosError(err) && err.code === 'ECONNREFUSED') {
        setError('Failed to connect to the backend server. Please make sure the backend server is running.');
      } else {
        setError('Failed to load settings. Please try again later.');
      }
      enqueueSnackbar('Failed to load settings', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSettingChange = (section: string, field: string, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [section]: {
        ...(settings[section as keyof typeof settings] as any),
        [field]: value
      }
    });
  };

  const handleNestedSettingChange = (section: string, subsection: string, field: string, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [section]: {
        ...(settings[section as keyof typeof settings] as any),
        [subsection]: {
          ...(settings[section as keyof typeof settings] as any)[subsection],
          [field]: value
        }
      }
    });
  };

  const handleDirectSettingChange = (field: keyof SystemSettings, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [field]: value
    });
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await axios.put('/api/settings', settings);
      enqueueSnackbar('Settings saved successfully', { variant: 'success' });
    } catch (err) {
      console.error('Error saving settings:', err);
      enqueueSnackbar('Failed to save settings', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenKeyDialog = () => {
    setApiKeyForm({
      name: ''
    });
    setOpenKeyDialog(true);
  };

  const handleCloseKeyDialog = () => {
    setOpenKeyDialog(false);
    setNewKey(null);
    setShowToken(false);
  };

  const handleApiKeyFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKeyForm({
      ...apiKeyForm,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateApiKey = async () => {
    if (!settings) return;

    try {
      const response = await axios.post('/api/settings/api-keys', {
        name: apiKeyForm.name
      });
      
      setNewKey(response.data);
      setShowToken(true);
      
      // Update the settings state with the new key
      setSettings({
        ...settings,
        api_keys: [...settings.api_keys, response.data]
      });
      
      enqueueSnackbar('API key created successfully', { variant: 'success' });
    } catch (err) {
      console.error('Error creating API key:', err);
      enqueueSnackbar('Failed to create API key', { variant: 'error' });
    }
  };

  const handleDeleteApiKey = async (id: number) => {
    if (!settings) return;
    
    if (window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/settings/api-keys/${id}`);
        
        // Update the settings state by removing the deleted key
        setSettings({
          ...settings,
          api_keys: settings.api_keys.filter(key => key.id !== id)
        });
        
        enqueueSnackbar('API key deleted successfully', { variant: 'success' });
      } catch (err) {
        console.error('Error deleting API key:', err);
        enqueueSnackbar('Failed to delete API key', { variant: 'error' });
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        enqueueSnackbar('Copied to clipboard', { variant: 'success' });
      },
      (err) => {
        console.error('Could not copy text: ', err);
        enqueueSnackbar('Failed to copy to clipboard', { variant: 'error' });
      }
    );
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
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={fetchSettings}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!settings) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Settings data is not available. Please try again later.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Settings</Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
          <Tab label="General" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="Security" icon={<SecurityIcon />} iconPosition="start" />
          <Tab label="Notifications" icon={<NotificationsIcon />} iconPosition="start" />
          <Tab label="API Keys" icon={<VpnKeyIcon />} iconPosition="start" />
          <Tab label="Integrations" icon={<CloudIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* General Settings */}
      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>General Settings</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Scan Frequency</InputLabel>
                <Select
                  value={settings.scan_frequency}
                  onChange={(e) => handleDirectSettingChange('scan_frequency', e.target.value)}
                  label="Scan Frequency"
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="manual">Manual Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                margin="normal"
                label="Data Retention Period (days)"
                type="number"
                value={settings.retention_period}
                onChange={(e) => handleDirectSettingChange('retention_period', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 30, max: 3650 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>User Interface Settings</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Default Theme</InputLabel>
                <Select
                  value={settings.ui_settings.default_theme}
                  onChange={(e) => handleNestedSettingChange('ui_settings', 'default_theme', '', e.target.value)}
                  label="Default Theme"
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="system">System Default</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                margin="normal"
                label="Items Per Page"
                type="number"
                value={settings.ui_settings.items_per_page}
                onChange={(e) => handleNestedSettingChange('ui_settings', 'items_per_page', '', parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 10, max: 100 } }}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Security Settings */}
      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Security & Scan Settings</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enable_auto_scan}
                    onChange={(e) => handleDirectSettingChange('enable_auto_scan', e.target.checked)}
                  />
                }
                label="Enable automatic scanning for new assets"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enable_ml_predictions}
                    onChange={(e) => handleDirectSettingChange('enable_ml_predictions', e.target.checked)}
                  />
                }
                label="Enable AI-powered vulnerability predictions"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Default Scanner</InputLabel>
                <Select
                  value={settings.scan_settings.default_scanner}
                  onChange={(e) => handleNestedSettingChange('scan_settings', 'default_scanner', '', e.target.value)}
                  label="Default Scanner"
                >
                  <MenuItem value="Nmap Scanner">Nmap Scanner</MenuItem>
                  <MenuItem value="OWASP ZAP">OWASP ZAP</MenuItem>
                  <MenuItem value="Nessus">Nessus</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Scan Depth</InputLabel>
                <Select
                  value={settings.scan_settings.scan_depth}
                  onChange={(e) => handleNestedSettingChange('scan_settings', 'scan_depth', '', e.target.value)}
                  label="Scan Depth"
                >
                  <MenuItem value="quick">Quick (Basic port scan)</MenuItem>
                  <MenuItem value="standard">Standard (Default configuration)</MenuItem>
                  <MenuItem value="thorough">Thorough (Comprehensive scan)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Notification Settings */}
      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Notification Settings</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="normal"
                label="Notification Email"
                type="email"
                value={settings.notification_email}
                onChange={(e) => handleDirectSettingChange('notification_email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>Email Settings</Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.integrations.email.enabled}
                    onChange={(e) => handleNestedSettingChange('integrations', 'email', 'enabled', e.target.checked)}
                  />
                }
                label="Enable Email Notifications"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                margin="normal"
                label="SMTP Server"
                value={settings.integrations.email.smtp_server}
                onChange={(e) => handleNestedSettingChange('integrations', 'email', 'smtp_server', e.target.value)}
                disabled={!settings.integrations.email.enabled}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                margin="normal"
                label="SMTP Port"
                type="number"
                value={settings.integrations.email.smtp_port}
                onChange={(e) => handleNestedSettingChange('integrations', 'email', 'smtp_port', parseInt(e.target.value))}
                disabled={!settings.integrations.email.enabled}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>Slack Settings</Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.integrations.slack.enabled}
                    onChange={(e) => handleNestedSettingChange('integrations', 'slack', 'enabled', e.target.checked)}
                  />
                }
                label="Enable Slack Notifications"
              />
            </Grid>
            <Grid item xs={12} md={12}>
              <TextField
                fullWidth
                margin="normal"
                label="Webhook URL"
                value={settings.integrations.slack.webhook_url}
                onChange={(e) => handleNestedSettingChange('integrations', 'slack', 'webhook_url', e.target.value)}
                disabled={!settings.integrations.slack.enabled}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* API Keys */}
      {tabValue === 3 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">API Keys</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenKeyDialog}
            >
              Create API Key
            </Button>
          </Box>
          
          {settings.api_keys.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell>Last Used</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settings.api_keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell>{key.name}</TableCell>
                      <TableCell>{new Date(key.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(key.expires_at).toLocaleDateString()}</TableCell>
                      <TableCell>{key.last_used ? new Date(key.last_used).toLocaleDateString() : 'Never'}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteApiKey(key.id)}
                          title="Delete Key"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="textSecondary">
                No API keys have been created yet.
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Integrations */}
      {tabValue === 4 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Integrations</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Jira Integration</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.integrations.jira.enabled}
                    onChange={(e) => handleNestedSettingChange('integrations', 'jira', 'enabled', e.target.checked)}
                  />
                }
                label="Enable Jira Integration"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Jira URL"
                value={settings.integrations.jira.url}
                onChange={(e) => handleNestedSettingChange('integrations', 'jira', 'url', e.target.value)}
                disabled={!settings.integrations.jira.enabled}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Project Key"
                value={settings.integrations.jira.project_key}
                onChange={(e) => handleNestedSettingChange('integrations', 'jira', 'project_key', e.target.value)}
                disabled={!settings.integrations.jira.enabled}
              />
            </Grid>
            <Grid item xs={12} md={12}>
              <TextField
                fullWidth
                label="API Token"
                type="password"
                value={settings.integrations.jira.api_token}
                onChange={(e) => handleNestedSettingChange('integrations', 'jira', 'api_token', e.target.value)}
                disabled={!settings.integrations.jira.enabled}
              />
            </Grid>
          </Grid>
          
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>Available Integrations</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6">ServiceNow</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Create and track incidents in ServiceNow
                  </Typography>
                  <Button variant="outlined" fullWidth>Configure</Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6">Microsoft Teams</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Send notifications to Teams channels
                  </Typography>
                  <Button variant="outlined" fullWidth>Configure</Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6">PagerDuty</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Create incidents for critical vulnerabilities
                  </Typography>
                  <Button variant="outlined" fullWidth>Configure</Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* API Key Dialog */}
      <Dialog open={openKeyDialog} onClose={handleCloseKeyDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{newKey ? 'API Key Created' : 'Create New API Key'}</DialogTitle>
        <DialogContent>
          {newKey ? (
            <Box sx={{ mt: 1 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Your API key has been created successfully. Please copy your key now, as you won't be able to see it again.
              </Alert>
              <TextField
                fullWidth
                label="API Key"
                value={newKey.key}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => copyToClipboard(newKey.key)} edge="end">
                        <ContentCopyIcon />
                      </IconButton>
                      <IconButton onClick={() => setShowToken(!showToken)} edge="end">
                        {showToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  type: showToken ? 'text' : 'password'
                }}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="textSecondary">
                <strong>Expires:</strong> {new Date(newKey.expires_at).toLocaleDateString()}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                name="name"
                label="Key Name"
                value={apiKeyForm.name}
                onChange={handleApiKeyFormChange}
                required
                sx={{ mb: 3 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseKeyDialog}>
            {newKey ? 'Close' : 'Cancel'}
          </Button>
          {!newKey && (
            <Button
              onClick={handleCreateApiKey}
              variant="contained"
              disabled={!apiKeyForm.name}
            >
              Create
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
