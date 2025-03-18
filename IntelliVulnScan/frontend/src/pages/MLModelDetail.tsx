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
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import axios from 'axios';
import { MLModel } from '../types';

interface FeatureImportance {
  feature: string;
  importance: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];

const MLModelDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [model, setModel] = useState<MLModel | null>(null);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [trainingInProgress, setTrainingInProgress] = useState<boolean>(false);

  const fetchModelData = async () => {
    try {
      setLoading(true);
      const modelResponse = await axios.get(`/api/ml-models/${id}`);
      setModel(modelResponse.data);
      
      if (modelResponse.data.status === 'trained') {
        try {
          const featureResponse = await axios.get(`/api/ml-models/${id}/feature-importance`);
          setFeatureImportance(featureResponse.data);
        } catch (featureErr) {
          console.error('Error fetching feature importance:', featureErr);
          // Don't set an error for this, as it's not critical
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching model data:', err);
      setError('Failed to load model data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchModelData();
    }
  }, [id]);

  useEffect(() => {
    // If model is in training state, poll for updates
    if (model && model.status === 'training') {
      setTrainingInProgress(true);
      const interval = setInterval(() => {
        fetchModelData();
      }, 5000); // Poll every 5 seconds
      
      return () => clearInterval(interval);
    } else {
      setTrainingInProgress(false);
    }
  }, [model]);

  const handleTrainModel = async () => {
    try {
      setTrainingInProgress(true);
      await axios.post(`/api/ml-models/${id}/train`);
      fetchModelData();
    } catch (err) {
      console.error('Error training model:', err);
      setError('Failed to start model training. Please try again.');
      setTrainingInProgress(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'trained':
        return 'success';
      case 'training':
        return 'warning';
      case 'failed':
        return 'error';
      case 'created':
        return 'info';
      default:
        return 'default';
    }
  };

  const getModelTypeLabel = (type: string) => {
    switch (type) {
      case 'random_forest':
        return 'Random Forest';
      case 'gradient_boosting':
        return 'Gradient Boosting';
      case 'neural_network':
        return 'Neural Network';
      case 'svm':
        return 'Support Vector Machine';
      default:
        return type;
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
          onClick={() => navigate('/ml-models')}
          sx={{ mt: 2 }}
        >
          Back to ML Models
        </Button>
      </Box>
    );
  }

  if (!model) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Model not found</Typography>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/ml-models')}
          sx={{ mt: 2 }}
        >
          Back to ML Models
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
            onClick={() => navigate('/ml-models')}
            sx={{ mb: 1 }}
          >
            Back to ML Models
          </Button>
          <Typography variant="h4">{model.name}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Chip 
              label={model.status} 
              color={getStatusColor(model.status) as any}
              sx={{ mr: 2 }}
            />
            <Typography variant="body1" color="textSecondary">
              Type: {getModelTypeLabel(model.model_type)}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchModelData}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={handleTrainModel}
            disabled={trainingInProgress}
          >
            {trainingInProgress ? 'Training...' : 'Train Model'}
          </Button>
        </Box>
      </Box>

      {trainingInProgress && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            Model training in progress. This may take several minutes...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {/* Model Info Card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AssessmentIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Model Information</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="textSecondary">Description</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {model.description || 'No description provided'}
            </Typography>
            
            <Typography variant="body2" color="textSecondary">Created At</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {new Date(model.created_at).toLocaleString()}
            </Typography>
            
            <Typography variant="body2" color="textSecondary">Last Updated</Typography>
            <Typography variant="body1">
              {new Date(model.updated_at).toLocaleString()}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2 }}>Performance Metrics</Typography>
            {model.status === 'trained' ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ bgcolor: 'action.hover' }}>
                        Accuracy
                      </TableCell>
                      <TableCell>
                        {model.accuracy ? `${(model.accuracy * 100).toFixed(2)}%` : 'N/A'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ bgcolor: 'action.hover' }}>
                        Precision
                      </TableCell>
                      <TableCell>
                        {model.precision ? `${(model.precision * 100).toFixed(2)}%` : 'N/A'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ bgcolor: 'action.hover' }}>
                        Recall
                      </TableCell>
                      <TableCell>
                        {model.recall ? `${(model.recall * 100).toFixed(2)}%` : 'N/A'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ bgcolor: 'action.hover' }}>
                        F1 Score
                      </TableCell>
                      <TableCell>
                        {model.f1_score ? `${(model.f1_score * 100).toFixed(2)}%` : 'N/A'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body1" color="textSecondary">
                Performance metrics will be available after training the model.
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Feature Importance Chart */}
      {model.status === 'trained' && featureImportance.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Feature Importance</Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={featureImportance}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="feature" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="importance" fill="#8884d8" name="Importance" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}

      {/* Prediction Distribution */}
      {model.status === 'trained' && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Prediction Distribution</Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Critical', value: 15 },
                    { name: 'High', value: 25 },
                    { name: 'Medium', value: 35 },
                    { name: 'Low', value: 25 }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {[
                    { name: 'Critical', value: 15 },
                    { name: 'High', value: 25 },
                    { name: 'Medium', value: 35 },
                    { name: 'Low', value: 25 }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Box>
          <Typography variant="caption" color="textSecondary" align="center" display="block">
            Note: This is a sample visualization. In a production environment, this would show actual prediction distributions.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default MLModelDetail; 