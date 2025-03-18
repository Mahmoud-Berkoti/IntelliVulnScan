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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { Vulnerability } from '../types';

const Vulnerabilities: React.FC = () => {
  const navigate = useNavigate();
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchVulnerabilities = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/vulnerabilities');
      setVulnerabilities(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching vulnerabilities:', err);
      setError('Failed to load vulnerabilities. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVulnerabilities();
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

  const handleSeverityFilterChange = (event: SelectChangeEvent<string>) => {
    setSeverityFilter(event.target.value);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent<string>) => {
    setStatusFilter(event.target.value);
  };

  // Filter vulnerabilities based on search term and filters
  const filteredVulnerabilities = vulnerabilities.filter((vuln: Vulnerability) => {
    // Search term filter
    const matchesSearch = 
      vuln.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vuln.cve_id && vuln.cve_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      vuln.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Severity filter
    const matchesSeverity = severityFilter === 'all' || vuln.severity.toLowerCase() === severityFilter.toLowerCase();
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || vuln.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Get current page of vulnerabilities
  const currentVulnerabilities = filteredVulnerabilities.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
      case 'open':
        return 'error';
      case 'in_progress':
        return 'warning';
      case 'fixed':
        return 'success';
      case 'false_positive':
        return 'default';
      case 'accepted_risk':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading && vulnerabilities.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Vulnerabilities</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchVulnerabilities}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by title, CVE ID, or description"
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
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={severityFilter}
                  onChange={handleSeverityFilterChange}
                  label="Severity"
                >
                  <MenuItem value="all">All Severities</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="fixed">Fixed</MenuItem>
                  <MenuItem value="false_positive">False Positive</MenuItem>
                  <MenuItem value="accepted_risk">Accepted Risk</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>CVE ID</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>CVSS Score</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Discovered</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentVulnerabilities.length > 0 ? (
                currentVulnerabilities.map((vuln: Vulnerability) => (
                  <TableRow key={vuln.id}>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                        {vuln.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {vuln.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {vuln.cve_id ? (
                        <Chip 
                          label={vuln.cve_id} 
                          size="small"
                          onClick={() => window.open(`https://nvd.nist.gov/vuln/detail/${vuln.cve_id}`, '_blank')}
                          clickable
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={vuln.severity} 
                        color={getSeverityColor(vuln.severity) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {vuln.cvss_score}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={vuln.status} 
                        color={getStatusColor(vuln.status) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(vuln.discovered_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/vulnerabilities/${vuln.id}`)}
                        title="View Details"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {searchTerm || severityFilter !== 'all' || statusFilter !== 'all' 
                      ? 'No vulnerabilities match your search criteria' 
                      : 'No vulnerabilities found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredVulnerabilities.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default Vulnerabilities; 