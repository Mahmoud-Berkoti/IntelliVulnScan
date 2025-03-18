import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as path from 'path';
import routes from './routes';

dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 8000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Direct API health check endpoint
app.get('/api/health-check', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is healthy and running' });
});

// Register API routes - This is our structured API routes system
app.use('/api', routes);

// Direct health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy and running' });
});

// Mock data
const mockScanners = [
  { id: 1, name: 'Nmap Scanner', type: 'network', status: 'active' },
  { id: 2, name: 'OWASP ZAP', type: 'web', status: 'active' },
  { id: 3, name: 'Nessus', type: 'vulnerability', status: 'inactive' }
];

const mockAssets = [
  { 
    id: 1, 
    name: 'Web Server', 
    asset_type: 'server', 
    ip_address: '192.168.1.100',
    hostname: 'web-server-01',
    operating_system: 'Ubuntu 20.04',
    description: 'Main web server for production environment',
    vulnerability_count: 5,
    critical_count: 1,
    high_count: 2,
    medium_count: 1,
    low_count: 1,
    last_scan_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner: 'IT Department',
    environment: 'Production',
    criticality: 'High'
  },
  { 
    id: 2, 
    name: 'Database Server', 
    asset_type: 'server', 
    ip_address: '192.168.1.101',
    hostname: 'db-server-01',
    operating_system: 'CentOS 8',
    description: 'Primary database server',
    vulnerability_count: 3,
    critical_count: 0,
    high_count: 1,
    medium_count: 1,
    low_count: 1,
    last_scan_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner: 'IT Department',
    environment: 'Production',
    criticality: 'High'
  },
  { 
    id: 3, 
    name: 'Application Server', 
    asset_type: 'server', 
    ip_address: '192.168.1.102',
    hostname: 'app-server-01',
    operating_system: 'Windows Server 2019',
    description: 'Application server for business logic',
    vulnerability_count: 4,
    critical_count: 0,
    high_count: 2,
    medium_count: 1,
    low_count: 1,
    last_scan_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner: 'IT Department',
    environment: 'Production',
    criticality: 'High'
  }
];

const mockVulnerabilities = [
  { id: 1, title: 'SQL Injection', severity: 'high', status: 'open' },
  { id: 2, title: 'XSS Vulnerability', severity: 'medium', status: 'open' },
  { id: 3, title: 'Weak Password Policy', severity: 'low', status: 'closed' }
];

const mockMLModels = [
  { id: 1, name: 'Vulnerability Predictor', type: 'classification', accuracy: 0.95, status: 'active' },
  { id: 2, name: 'Risk Assessment', type: 'regression', accuracy: 0.88, status: 'active' },
  { id: 3, name: 'Anomaly Detection', type: 'clustering', accuracy: 0.92, status: 'inactive' }
];

// Mock reports data
const mockReports = [
  { 
    id: 1, 
    name: 'Monthly Security Summary',
    description: 'Overview of security metrics and vulnerability status',
    report_type: 'summary',
    format: 'pdf',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'System',
    download_url: '/api/reports/1/download',
    parameters: {
      period: 'monthly',
      include_charts: true,
      include_metrics: true
    }
  },
  { 
    id: 2, 
    name: 'Critical Vulnerabilities',
    description: 'Detailed analysis of all critical vulnerabilities',
    report_type: 'vulnerability',
    format: 'pdf',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'admin@example.com',
    download_url: '/api/reports/2/download',
    parameters: {
      severity: 'critical',
      detailed: true
    }
  },
  { 
    id: 3, 
    name: 'Compliance Report',
    description: 'Compliance status for regulatory requirements',
    report_type: 'compliance',
    format: 'xlsx',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'admin@example.com',
    download_url: '/api/reports/3/download',
    parameters: {
      framework: 'PCI-DSS',
      include_evidence: true
    }
  },
  { 
    id: 4, 
    name: 'Asset Security Posture',
    description: 'Security status of all assets in the organization',
    report_type: 'asset',
    format: 'pdf',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'admin@example.com',
    download_url: '/api/reports/4/download',
    parameters: {
      include_trends: true
    }
  },
  { 
    id: 5, 
    name: 'Scan Results Comparison',
    description: 'Comparison of scan results over time',
    report_type: 'scan',
    format: 'pdf',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'System',
    download_url: '/api/reports/5/download',
    parameters: {
      compare_last: 3,
      include_remediation: true
    }
  }
];

// Mock system settings
const mockSettings = {
  scan_frequency: 'weekly',
  notification_email: 'admin@example.com',
  enable_auto_scan: true,
  enable_ml_predictions: true,
  retention_period: 90,
  api_keys: [
    {
      id: 1,
      name: 'Integration Key',
      key: 'api_key_1234567890',
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      last_used: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  integrations: {
    slack: {
      enabled: true,
      webhook_url: 'https://hooks.slack.com/services/XXXX/YYYY/ZZZZ',
      notify_on: ['critical', 'high']
    },
    jira: {
      enabled: false,
      url: '',
      api_token: '',
      project_key: ''
    },
    email: {
      enabled: true,
      smtp_server: 'smtp.example.com',
      smtp_port: 587,
      use_tls: true,
      from_address: 'notifications@example.com'
    }
  },
  scan_settings: {
    default_scanner: 'Nmap Scanner',
    scan_depth: 'thorough',
    include_credentials: true,
    parallel_scans: 3
  },
  ui_settings: {
    default_theme: 'light',
    default_dashboard: 'security_overview',
    items_per_page: 25
  }
};

// Generate mock report templates
const mockReportTemplates = [
  {
    id: 1,
    name: 'Executive Summary',
    description: 'High-level overview for executive stakeholders',
    type: 'built-in',
    parameters: ['period', 'include_charts', 'include_recommendations']
  },
  {
    id: 2,
    name: 'Technical Vulnerability Report',
    description: 'Detailed technical report with vulnerability details',
    type: 'built-in',
    parameters: ['severity', 'include_evidence', 'include_remediation']
  },
  {
    id: 3,
    name: 'Compliance Status',
    description: 'Report for compliance with security frameworks',
    type: 'built-in',
    parameters: ['framework', 'include_evidence', 'include_gaps']
  },
  {
    id: 4,
    name: 'Custom Report',
    description: 'User-defined custom report template',
    type: 'custom',
    parameters: ['user_defined']
  }
];

// Generate mock vulnerability trends data
const generateVulnerabilityTrends = () => {
  const trends = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    trends.push({
      date: date.toISOString().split('T')[0],
      high: Math.floor(Math.random() * 5),
      medium: Math.floor(Math.random() * 8),
      low: Math.floor(Math.random() * 12)
    });
  }
  return trends;
};

// Generate mock recent scans data
const generateRecentScans = () => {
  const scans = [];
  const now = new Date();
  for (let i = 0; i < 5; i++) {
    const date = new Date(now);
    date.setHours(date.getHours() - i);
    scans.push({
      id: i + 1,
      assetName: mockAssets[i % mockAssets.length].name,
      status: 'completed',
      date: date.toISOString(),
      findings: Math.floor(Math.random() * 10) + 1
    });
  }
  return scans;
};

// Generate mock top vulnerable assets data
const generateTopVulnerableAssets = () => {
  return mockAssets.map(asset => ({
    name: asset.name,
    asset_type: asset.asset_type,
    vulnerabilityCount: Math.floor(Math.random() * 15) + 1,
    severity: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]
  })).sort((a, b) => b.vulnerabilityCount - a.vulnerabilityCount).slice(0, 5);
};

// API Routes
app.get('/api/scanners', (req, res) => {
  try {
    res.json(mockScanners);
  } catch (error) {
    console.error('Error fetching scanners:', error);
    res.status(500).json({ error: 'Failed to fetch scanners' });
  }
});

app.get('/api/assets', (req, res) => {
  try {
    res.json(mockAssets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

app.get('/api/vulnerabilities', (req, res) => {
  try {
    res.json(mockVulnerabilities);
  } catch (error) {
    console.error('Error fetching vulnerabilities:', error);
    res.status(500).json({ error: 'Failed to fetch vulnerabilities' });
  }
});

app.get('/api/ml-models', (req, res) => {
  try {
    res.json(mockMLModels);
  } catch (error) {
    console.error('Error fetching ML models:', error);
    res.status(500).json({ error: 'Failed to fetch ML models' });
  }
});

app.get('/api/dashboard/stats', (req, res) => {
  try {
    res.json({
      totalAssets: mockAssets.length,
      totalVulnerabilities: mockVulnerabilities.length,
      activeScanners: mockScanners.filter(s => s.status === 'active').length,
      mlModelAccuracy: mockMLModels.reduce((acc, model) => acc + model.accuracy, 0) / mockMLModels.length
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

app.get('/api/dashboard/vulnerability-trends', (req, res) => {
  try {
    res.json(generateVulnerabilityTrends());
  } catch (error) {
    console.error('Error fetching vulnerability trends:', error);
    res.status(500).json({ error: 'Failed to fetch vulnerability trends' });
  }
});

app.get('/api/dashboard/recent-scans', (req, res) => {
  try {
    res.json(generateRecentScans());
  } catch (error) {
    console.error('Error fetching recent scans:', error);
    res.status(500).json({ error: 'Failed to fetch recent scans' });
  }
});

app.get('/api/dashboard/top-vulnerable-assets', (req, res) => {
  try {
    res.json(generateTopVulnerableAssets());
  } catch (error) {
    console.error('Error fetching top vulnerable assets:', error);
    res.status(500).json({ error: 'Failed to fetch top vulnerable assets' });
  }
});

// Reports endpoints
app.get('/api/reports', (req, res) => {
  try {
    res.json(mockReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

app.get('/api/reports/:id', (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const report = mockReports.find(r => r.id === reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

app.post('/api/reports', (req, res) => {
  try {
    const newReport = {
      id: mockReports.length + 1,
      ...req.body,
      created_at: new Date().toISOString(),
      download_url: `/api/reports/${mockReports.length + 1}/download`
    };
    mockReports.push(newReport);
    res.status(201).json(newReport);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

app.get('/api/reports/:id/download', (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const report = mockReports.find(r => r.id === reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    // In a real implementation, this would generate and send the actual report file
    res.json({ message: 'This is a mock download endpoint. In production, this would return the actual report file.' });
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ error: 'Failed to download report' });
  }
});

app.get('/api/report-templates', (req, res) => {
  try {
    res.json(mockReportTemplates);
  } catch (error) {
    console.error('Error fetching report templates:', error);
    res.status(500).json({ error: 'Failed to fetch report templates' });
  }
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  try {
    res.json(mockSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    // In a real implementation, this would update the settings in a database
    Object.assign(mockSettings, req.body);
    res.json(mockSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.post('/api/settings/api-keys', (req, res) => {
  try {
    const newKey = {
      id: mockSettings.api_keys.length + 1,
      name: req.body.name,
      key: `api_key_${Math.random().toString(36).substring(2, 15)}`,
      created_at: new Date().toISOString(),
      expires_at: req.body.expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      last_used: '' // Empty string instead of null
    };
    mockSettings.api_keys.push(newKey);
    res.status(201).json(newKey);
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

app.delete('/api/settings/api-keys/:id', (req, res) => {
  try {
    const keyId = parseInt(req.params.id);
    const keyIndex = mockSettings.api_keys.findIndex(k => k.id === keyId);
    if (keyIndex === -1) {
      return res.status(404).json({ error: 'API key not found' });
    }
    mockSettings.api_keys.splice(keyIndex, 1);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
}); 