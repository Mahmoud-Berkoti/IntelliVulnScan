import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
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
  FormControlLabel,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Switch,
  Card,
  CardContent
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Assignment as AssignmentIcon,
  FileDownload as DownloadIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useSnackbar } from 'notistack';

interface Report {
  id: number;
  name: string;
  description: string;
  report_type: string;
  format: string;
  created_at: string;
  created_by: string;
  download_url: string;
  parameters: {
    time_range?: string;
    severity_level?: string[] | null;
    asset_ids?: number[] | null;
    vulnerability_types?: string[] | null;
    include_graphs?: boolean;
    include_recommendations?: boolean;
  };
}

interface ReportTemplate {
  id: number;
  name: string;
  description: string;
  report_type: string;
  supported_formats: string[];
  parameters: {
    time_range: boolean;
    severity_level: boolean;
    asset_ids: boolean;
    vulnerability_types: boolean;
    include_graphs: boolean;
    include_recommendations: boolean;
  };
}

interface ReportFormData {
  name: string;
  description: string;
  template_id: number;
  format: string;
  parameters: {
    time_range: string;
    severity_level: string[];
    asset_ids: number[];
    vulnerability_types: string[];
    include_graphs: boolean;
    include_recommendations: boolean;
  };
  schedule: {
    enabled: boolean;
    frequency: string;
    next_run: string | null;
  };
}

const Reports: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState<number>(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  
  const [formData, setFormData] = useState<ReportFormData>({
    name: '',
    description: '',
    template_id: 0,
    format: 'pdf',
    parameters: {
      time_range: 'last_30_days',
      severity_level: ['critical', 'high'],
      asset_ids: [],
      vulnerability_types: [],
      include_graphs: true,
      include_recommendations: true
    },
    schedule: {
      enabled: false,
      frequency: 'weekly',
      next_run: new Date().toISOString().split('T')[0]
    }
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/reports');
      setReports(response.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      if (axios.isAxiosError(err) && err.code === 'ECONNREFUSED') {
        setError('Failed to connect to the backend server. Please make sure the backend server is running.');
      } else {
        setError('Failed to load reports. Please try again later.');
      }
      enqueueSnackbar('Failed to load reports', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/report-templates');
      setTemplates(response.data);
    } catch (err) {
      console.error('Error fetching report templates:', err);
      if (axios.isAxiosError(err) && err.code === 'ECONNREFUSED') {
        enqueueSnackbar('Failed to connect to the backend server', { variant: 'error' });
      } else {
        enqueueSnackbar('Failed to load report templates', { variant: 'error' });
      }
    }
  };

  useEffect(() => {
    fetchReports();
    fetchTemplates();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFormChange = (field: keyof ReportFormData, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleParameterChange = (field: keyof ReportFormData['parameters'], value: any) => {
    setFormData({
      ...formData,
      parameters: {
        ...formData.parameters,
        [field]: value
      }
    });
  };

  const handleScheduleChange = (field: keyof ReportFormData['schedule'], value: any) => {
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        [field]: value
      }
    });
  };

  const handleOpenDialog = () => {
    setFormData({
      name: '',
      description: '',
      template_id: templates.length > 0 ? templates[0].id : 0,
      format: 'pdf',
      parameters: {
        time_range: 'last_30_days',
        severity_level: ['critical', 'high'],
        asset_ids: [],
        vulnerability_types: [],
        include_graphs: true,
        include_recommendations: true
      },
      schedule: {
        enabled: false,
        frequency: 'weekly',
        next_run: new Date().toISOString().split('T')[0]
      }
    });
    setSelectedTemplate(templates.length > 0 ? templates[0] : null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTemplate(null);
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const templateId = Number(e.target.value);
    const selected = templates.find(t => t.id === templateId) || null;
    setSelectedTemplate(selected);
    
    setFormData({
      ...formData,
      template_id: templateId
    });
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const response = await axios.post('/api/reports', {
        name: formData.name,
        description: formData.description,
        template_id: formData.template_id,
        format: formData.format,
        parameters: formData.parameters,
        schedule: formData.schedule.enabled ? {
          frequency: formData.schedule.frequency,
          next_run: formData.schedule.next_run
        } : null
      });
      
      setReports([response.data, ...reports]);
      enqueueSnackbar('Report generated successfully', { variant: 'success' });
      handleCloseDialog();
    } catch (err) {
      console.error('Error generating report:', err);
      enqueueSnackbar('Failed to generate report', { variant: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (id: number) => {
    try {
      const response = await axios.get(`/api/reports/${id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const report = reports.find(r => r.id === id);
      const fileName = `${report?.name || 'report'}.${report?.format || 'pdf'}`;
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      enqueueSnackbar('Report downloaded successfully', { variant: 'success' });
    } catch (err) {
      console.error('Error downloading report:', err);
      enqueueSnackbar('Failed to download report', { variant: 'error' });
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'summary':
        return 'Summary Report';
      case 'vulnerability':
        return 'Vulnerability Report';
      case 'compliance':
        return 'Compliance Report';
      case 'asset':
        return 'Asset Report';
      case 'scan':
        return 'Scan Report';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getReportFormatColor = (format: string) => {
    switch (format) {
      case 'pdf':
        return 'error';
      case 'csv':
        return 'success';
      case 'json':
        return 'primary';
      case 'html':
        return 'warning';
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
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={fetchReports}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Reports</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Generate Report
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="reports tabs">
          <Tab label="My Reports" icon={<DescriptionIcon />} iconPosition="start" />
          <Tab label="Scheduled Reports" icon={<ScheduleIcon />} iconPosition="start" />
          <Tab label="Templates" icon={<AssignmentIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* My Reports Tab */}
      {tabValue === 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button startIcon={<RefreshIcon />} onClick={fetchReports}>
              Refresh
            </Button>
            <Button startIcon={<FilterIcon />}>
              Filter
            </Button>
          </Box>

          {reports.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Format</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Created By</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Typography variant="body1">{report.name}</Typography>
                        <Typography variant="body2" color="textSecondary">{report.description}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={getReportTypeLabel(report.report_type)} />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={report.format.toUpperCase()} 
                          color={getReportFormatColor(report.format) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(report.created_at).toLocaleString()}</TableCell>
                      <TableCell>{report.created_by}</TableCell>
                      <TableCell>
                        <IconButton 
                          color="primary" 
                          onClick={() => handleDownloadReport(report.id)}
                          title="Download Report"
                        >
                          <DownloadIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                No reports have been generated yet. Click the "Generate Report" button to create your first report.
              </Typography>
            </Paper>
          )}
        </>
      )}

      {/* Scheduled Reports Tab */}
      {tabValue === 1 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            Scheduled reports functionality will be available soon.
          </Typography>
        </Paper>
      )}

      {/* Templates Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{template.name}</Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {template.description}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={getReportTypeLabel(template.report_type)} 
                      color="primary"
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    {template.supported_formats.map((format) => (
                      <Chip 
                        key={format}
                        label={format.toUpperCase()} 
                        color={getReportFormatColor(format) as any}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                    ))}
                  </Box>
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={() => {
                      setFormData({
                        ...formData,
                        template_id: template.id
                      });
                      setSelectedTemplate(template);
                      setOpenDialog(true);
                    }}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          {templates.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  No report templates available.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Generate Report Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Generate New Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Report Name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Report Template</InputLabel>
                <Select
                  value={formData.template_id}
                  onChange={(e) => handleTemplateChange(e as any)}
                  label="Report Template"
                >
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                multiline
                rows={2}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" gutterBottom>Report Format</Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Format</InputLabel>
                <Select
                  value={formData.format}
                  onChange={(e) => handleFormChange('format', e.target.value)}
                  label="Format"
                >
                  {selectedTemplate?.supported_formats.map((format) => (
                    <MenuItem key={format} value={format}>
                      {format.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {selectedTemplate && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>Report Parameters</Typography>
                </Grid>

                {selectedTemplate.parameters.time_range && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Time Range</InputLabel>
                      <Select
                        value={formData.parameters.time_range}
                        onChange={(e) => handleParameterChange('time_range', e.target.value)}
                        label="Time Range"
                      >
                        <MenuItem value="last_7_days">Last 7 Days</MenuItem>
                        <MenuItem value="last_30_days">Last 30 Days</MenuItem>
                        <MenuItem value="last_90_days">Last 90 Days</MenuItem>
                        <MenuItem value="last_year">Last Year</MenuItem>
                        <MenuItem value="custom">Custom Range</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {selectedTemplate.parameters.include_graphs && (
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.parameters.include_graphs}
                          onChange={(e) => handleParameterChange('include_graphs', e.target.checked)}
                        />
                      }
                      label="Include Graphs and Charts"
                      sx={{ mt: 2 }}
                    />
                  </Grid>
                )}

                {selectedTemplate.parameters.include_recommendations && (
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.parameters.include_recommendations}
                          onChange={(e) => handleParameterChange('include_recommendations', e.target.checked)}
                        />
                      }
                      label="Include Recommendations"
                      sx={{ mt: 2 }}
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>Schedule (Optional)</Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.schedule.enabled}
                        onChange={(e) => handleScheduleChange('enabled', e.target.checked)}
                      />
                    }
                    label="Schedule Recurring Report"
                  />
                </Grid>

                {formData.schedule.enabled && (
                  <>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Frequency</InputLabel>
                        <Select
                          value={formData.schedule.frequency}
                          onChange={(e) => handleScheduleChange('frequency', e.target.value)}
                          label="Frequency"
                        >
                          <MenuItem value="daily">Daily</MenuItem>
                          <MenuItem value="weekly">Weekly</MenuItem>
                          <MenuItem value="monthly">Monthly</MenuItem>
                          <MenuItem value="quarterly">Quarterly</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="First Run Date"
                        type="date"
                        value={formData.schedule.next_run}
                        onChange={(e) => handleScheduleChange('next_run', e.target.value)}
                        margin="normal"
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                  </>
                )}
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleGenerateReport}
            variant="contained"
            disabled={!formData.name || !formData.template_id || generating}
          >
            {generating ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;
