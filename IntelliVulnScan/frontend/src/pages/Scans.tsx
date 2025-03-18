import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { Scan, Asset, ReactChangeEvent } from '../types';

interface ScanFormData {
  name: string;
  description: string;
  scanner_type: string;
  asset_id: number;
}

const initialFormData: ScanFormData = {
  name: '',
  description: '',
  scanner_type: 'trivy',
  asset_id: 0
};

const Scans: React.FC = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState<Scan[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [formData, setFormData] = useState<ScanFormData>(initialFormData);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/scans');
      setScans(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching scans:', err);
      setError('Failed to load scans. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await axios.get('/api/assets');
      setAssets(response.data);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError('Failed to load assets for scan creation.');
    }
  };

  useEffect(() => {
    fetchScans();
    fetchAssets();
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleOpenDialog = () => {
    setFormData(initialFormData);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleFormChange = (event: ReactChangeEvent) => {
    const name = event.target.name as keyof ScanFormData;
    const value = event.target.value as string | number;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    try {
      await axios.post('/api/scans', formData);
      handleCloseDialog();
      fetchScans();
    } catch (err) {
      console.error('Error creating scan:', err);
      setError('Failed to create scan. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this scan?')) {
      try {
        await axios.delete(`/api/scans/${id}`);
        fetchScans();
      } catch (err) {
        console.error('Error deleting scan:', err);
        setError('Failed to delete scan. Please try again.');
      }
    }
  };

  // Filter scans based on search term
  const filteredScans = scans.filter((scan: Scan) => 
    scan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.scanner_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current page of scans
  const currentScans = filteredScans.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return 'In Progress';
    
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (loading && scans.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Scans</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchScans}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            New Scan
          </Button>
        </Box>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by name, scanner type, or status"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Asset</TableCell>
                <TableCell>Scanner</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Findings</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentScans.length > 0 ? (
                currentScans.map((scan: Scan) => (
                  <TableRow key={scan.id}>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                        {scan.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="text" 
                        size="small" 
                        onClick={() => navigate(`/assets/${scan.asset_id}`)}
                        sx={{ p: 0, textTransform: 'none' }}
                      >
                        View Asset
                      </Button>
                    </TableCell>
                    <TableCell>{scan.scanner_type}</TableCell>
                    <TableCell>
                      <Chip 
                        label={scan.status} 
                        color={getStatusColor(scan.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(scan.start_time).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {formatDuration(scan.start_time, scan.end_time)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip 
                          label={`C: ${scan.critical_count}`} 
                          color="error"
                          size="small" 
                          variant="outlined"
                        />
                        <Chip 
                          label={`H: ${scan.high_count}`} 
                          color="warning"
                          size="small" 
                          variant="outlined"
                        />
                        <Chip 
                          label={`M: ${scan.medium_count}`} 
                          color="info"
                          size="small" 
                          variant="outlined"
                        />
                        <Chip 
                          label={`L: ${scan.low_count}`} 
                          color="success"
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/scans/${scan.id}`)}
                        title="View Details"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(scan.id)}
                        title="Delete Scan"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {searchTerm ? 'No scans match your search criteria' : 'No scans found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredScans.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* New Scan Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Start New Scan</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Asset</InputLabel>
                <Select
                  name="asset_id"
                  value={formData.asset_id}
                  onChange={handleFormChange}
                  label="Asset"
                >
                  <MenuItem value={0} disabled>Select an asset</MenuItem>
                  {assets.map((asset) => (
                    <MenuItem key={asset.id} value={asset.id}>
                      {asset.name} ({asset.ip_address || asset.hostname})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Scanner Type</InputLabel>
                <Select
                  name="scanner_type"
                  value={formData.scanner_type}
                  onChange={handleFormChange}
                  label="Scanner Type"
                >
                  <MenuItem value="trivy">Trivy (Container Scanner)</MenuItem>
                  <MenuItem value="openvas">OpenVAS (Network Scanner)</MenuItem>
                  <MenuItem value="dependency_check">OWASP Dependency Check</MenuItem>
                  <MenuItem value="zap">OWASP ZAP (Web Scanner)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name || formData.asset_id === 0}
          >
            Start Scan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Scans; 