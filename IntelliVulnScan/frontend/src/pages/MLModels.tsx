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
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { MLModel, ReactChangeEvent } from '../types';

interface ModelFormData {
  name: string;
  description: string;
  model_type: string;
}

const initialFormData: ModelFormData = {
  name: '',
  description: '',
  model_type: 'random_forest'
};

const MLModels: React.FC = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState<MLModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [formData, setFormData] = useState<ModelFormData>(initialFormData);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentModelId, setCurrentModelId] = useState<number | null>(null);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/ml-models');
      setModels(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching ML models:', err);
      setError('Failed to load ML models. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
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

  const handleOpenDialog = (model?: MLModel) => {
    if (model) {
      setFormData({
        name: model.name,
        description: model.description,
        model_type: model.model_type
      });
      setIsEditing(true);
      setCurrentModelId(model.id);
    } else {
      setFormData(initialFormData);
      setIsEditing(false);
      setCurrentModelId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleFormChange = (event: ReactChangeEvent) => {
    const name = event.target.name as keyof ModelFormData;
    const value = event.target.value as string;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    try {
      if (isEditing && currentModelId) {
        await axios.put(`/api/ml-models/${currentModelId}`, formData);
      } else {
        await axios.post('/api/ml-models', formData);
      }
      handleCloseDialog();
      fetchModels();
    } catch (err) {
      console.error('Error saving ML model:', err);
      setError('Failed to save ML model. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this ML model?')) {
      try {
        await axios.delete(`/api/ml-models/${id}`);
        fetchModels();
      } catch (err) {
        console.error('Error deleting ML model:', err);
        setError('Failed to delete ML model. Please try again.');
      }
    }
  };

  const handleTrain = async (id: number) => {
    try {
      await axios.post(`/api/ml-models/${id}/train`);
      fetchModels();
    } catch (err) {
      console.error('Error training ML model:', err);
      setError('Failed to train ML model. Please try again.');
    }
  };

  // Filter models based on search term
  const filteredModels = models.filter((model: MLModel) => 
    model.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (model.description && model.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (model.model_type && model.model_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get current page of models
  const currentModels = filteredModels.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'default';
    
    switch (status.toLowerCase()) {
      case 'trained':
        return 'success';
      case 'training':
        return 'warning';
      case 'failed':
        return 'error';
      case 'created':
        return 'info';
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const getModelTypeLabel = (type: string | undefined) => {
    if (!type) return 'Unknown';
    
    switch (type) {
      case 'random_forest':
        return 'Random Forest';
      case 'gradient_boosting':
        return 'Gradient Boosting';
      case 'neural_network':
        return 'Neural Network';
      case 'svm':
        return 'Support Vector Machine';
      case 'classification':
        return 'Classification';
      case 'regression':
        return 'Regression';
      case 'clustering':
        return 'Clustering';
      default:
        return type;
    }
  };

  if (loading && models.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">ML Models</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchModels}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Model
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
            placeholder="Search by name, description, or model type"
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
                <TableCell>Status</TableCell>
                <TableCell>Metrics</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentModels.length > 0 ? (
                currentModels.map((model: MLModel) => (
                  <TableRow key={model.id}>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                        {model.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {model.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{getModelTypeLabel(model.model_type)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={model.status} 
                        color={getStatusColor(model.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {model.status === 'trained' ? (
                        <Box>
                          <Typography variant="body2">
                            Accuracy: {model.accuracy ? `${(model.accuracy * 100).toFixed(2)}%` : 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            F1 Score: {model.f1_score ? `${(model.f1_score * 100).toFixed(2)}%` : 'N/A'}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Not available
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(model.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleTrain(model.id)}
                        disabled={model.status === 'training'}
                        title="Train Model"
                      >
                        <PlayArrowIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/ml-models/${model.id}`)}
                        title="View Details"
                      >
                        <AssessmentIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(model)}
                        title="Edit Model"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(model.id)}
                        title="Delete Model"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {searchTerm ? 'No models match your search criteria' : 'No models found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredModels.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add/Edit Model Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit ML Model' : 'Add New ML Model'}</DialogTitle>
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
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Model Type</InputLabel>
                <Select
                  name="model_type"
                  value={formData.model_type}
                  onChange={handleFormChange}
                  label="Model Type"
                >
                  <MenuItem value="random_forest">Random Forest</MenuItem>
                  <MenuItem value="gradient_boosting">Gradient Boosting</MenuItem>
                  <MenuItem value="neural_network">Neural Network</MenuItem>
                  <MenuItem value="svm">Support Vector Machine</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MLModels; 