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
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import axios from 'axios';
import { Asset, ReactChangeEvent } from '../types';

interface AssetFormData {
  name: string;
  description: string;
  asset_type: string;
  ip_address: string;
  hostname: string;
  mac_address: string;
  operating_system: string;
}

const initialFormData: AssetFormData = {
  name: '',
  description: '',
  asset_type: 'server',
  ip_address: '',
  hostname: '',
  mac_address: '',
  operating_system: ''
};

const Assets: React.FC = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [formData, setFormData] = useState<AssetFormData>(initialFormData);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/assets');
      setAssets(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError('Failed to load assets. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    const name = event.target.name as keyof AssetFormData;
    const value = event.target.value as string;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    try {
      await axios.post('/api/assets', formData);
      handleCloseDialog();
      fetchAssets();
    } catch (err) {
      console.error('Error creating asset:', err);
      setError('Failed to create asset. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await axios.delete(`/api/assets/${id}`);
        fetchAssets();
      } catch (err) {
        console.error('Error deleting asset:', err);
        setError('Failed to delete asset. Please try again.');
      }
    }
  };

  const handleStartScan = async (id: number) => {
    try {
      await axios.post(`/api/assets/${id}/scan`);
      alert('Scan started successfully!');
    } catch (err) {
      console.error('Error starting scan:', err);
      setError('Failed to start scan. Please try again.');
    }
  };

  // Filter assets based on search term
  const filteredAssets = assets.filter((asset: Asset) => 
    asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.ip_address && asset.ip_address.includes(searchTerm)) ||
    (asset.hostname && asset.hostname.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (asset.asset_type && asset.asset_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get current page of assets
  const currentAssets = filteredAssets.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getAssetTypeLabel = (type: string | undefined) => {
    if (!type) return 'Unknown';
    
    switch (type.toLowerCase()) {
      case 'server':
        return 'Server';
      case 'workstation':
        return 'Workstation';
      case 'network_device':
        return 'Network Device';
      case 'container':
        return 'Container';
      case 'cloud_instance':
        return 'Cloud Instance';
      case 'web_application':
        return 'Web Application';
      default:
        return type;
    }
  };

  const getAssetTypeColor = (type: string | undefined) => {
    if (!type) return 'default';
    
    switch (type.toLowerCase()) {
      case 'server':
        return 'primary';
      case 'workstation':
        return 'secondary';
      case 'network_device':
        return 'info';
      case 'container':
        return 'success';
      case 'cloud_instance':
        return 'warning';
      case 'web_application':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading && assets.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Assets</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAssets}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Add Asset
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
            placeholder="Search by name, IP address, hostname, or type"
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
                <TableCell>Type</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Hostname</TableCell>
                <TableCell>Operating System</TableCell>
                <TableCell>Last Scan</TableCell>
                <TableCell>Vulnerabilities</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentAssets.length > 0 ? (
                currentAssets.map((asset: Asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                        {asset.name}
                      </Typography>
                      {asset.description && (
                        <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {asset.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getAssetTypeLabel(asset.asset_type)} 
                        color={getAssetTypeColor(asset.asset_type) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{asset.ip_address || 'N/A'}</TableCell>
                    <TableCell>{asset.hostname || 'N/A'}</TableCell>
                    <TableCell>{asset.operating_system || 'N/A'}</TableCell>
                    <TableCell>
                      {asset.last_scan_date ? (
                        new Date(asset.last_scan_date).toLocaleString()
                      ) : (
                        <Typography variant="body2" color="textSecondary">Never</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {asset.vulnerability_count > 0 ? (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {asset.critical_count > 0 && (
                            <Chip 
                              label={`C: ${asset.critical_count}`} 
                              color="error"
                              size="small" 
                              variant="outlined"
                            />
                          )}
                          {asset.high_count > 0 && (
                            <Chip 
                              label={`H: ${asset.high_count}`} 
                              color="warning"
                              size="small" 
                              variant="outlined"
                            />
                          )}
                          {asset.medium_count > 0 && (
                            <Chip 
                              label={`M: ${asset.medium_count}`} 
                              color="info"
                              size="small" 
                              variant="outlined"
                            />
                          )}
                          {asset.low_count > 0 && (
                            <Chip 
                              label={`L: ${asset.low_count}`} 
                              color="success"
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">None</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/assets/${asset.id}`)}
                        title="View Details"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleStartScan(asset.id)}
                        title="Start Scan"
                      >
                        <PlayArrowIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(asset.id)}
                        title="Delete Asset"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {searchTerm ? 'No assets match your search criteria' : 'No assets found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredAssets.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add Asset Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add New Asset</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Asset Type</InputLabel>
                <Select
                  name="asset_type"
                  value={formData.asset_type}
                  onChange={handleFormChange}
                  label="Asset Type"
                >
                  <MenuItem value="server">Server</MenuItem>
                  <MenuItem value="workstation">Workstation</MenuItem>
                  <MenuItem value="network_device">Network Device</MenuItem>
                  <MenuItem value="container">Container</MenuItem>
                  <MenuItem value="cloud_instance">Cloud Instance</MenuItem>
                  <MenuItem value="web_application">Web Application</MenuItem>
                </Select>
              </FormControl>
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
              <TextField
                fullWidth
                label="IP Address"
                name="ip_address"
                value={formData.ip_address}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hostname"
                name="hostname"
                value={formData.hostname}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="MAC Address"
                name="mac_address"
                value={formData.mac_address}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Operating System"
                name="operating_system"
                value={formData.operating_system}
                onChange={handleFormChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name}
          >
            Add Asset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Assets; 