import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  TablePagination
} from '@mui/material';
import { Check, Close, OpenInNew } from '@mui/icons-material';
import { getPendingResources, approveResource, rejectResource } from '../services/api';

const AdminDashboard = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalResources, setTotalResources] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    fetchResources();
  }, [page, rowsPerPage]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await getPendingResources(page + 1, rowsPerPage);
      setResources(response.results);
      setTotalResources(response.total);
      setError(null);
    } catch (err) {
      setError('Failed to fetch resources');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (resource, type) => {
    setSelectedResource(resource);
    setActionType(type);
    setAdminNotes('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedResource(null);
    setActionType(null);
    setAdminNotes('');
  };

  const handleAction = async () => {
    try {
      if (actionType === 'approve') {
        await approveResource(selectedResource.id, { admin_notes: adminNotes });
      } else {
        await rejectResource(selectedResource.id, { admin_notes: adminNotes });
      }
      
      // Remove the resource from the list
      setResources(resources.filter(r => r.id !== selectedResource.id));
      setTotalResources(prev => prev - 1);
      handleCloseDialog();
    } catch (err) {
      setError(`Failed to ${actionType} resource`);
      console.error(err);
    }
  };

  if (loading && resources.length === 0) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Submitted By</TableCell>
                <TableCell>Submitted At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {resource.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {resource.description}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {resource.tags?.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={resource.category}
                      color="primary"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{resource.submitted_by}</TableCell>
                  <TableCell>
                    {new Date(resource.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<OpenInNew />}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<Check />}
                        onClick={() => handleOpenDialog(resource, 'approve')}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<Close />}
                        onClick={() => handleOpenDialog(resource, 'reject')}
                      >
                        Reject
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {resources.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body1" color="textSecondary">
                      No pending resources to review
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalResources}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Resource' : 'Reject Resource'}
        </DialogTitle>
        <DialogContent>
          {selectedResource && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                {selectedResource.title}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Admin Notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                margin="normal"
                required={actionType === 'reject'}
                helperText={actionType === 'reject' ? 'Please provide a reason for rejection' : 'Optional notes'}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleAction}
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            disabled={actionType === 'reject' && !adminNotes.trim()}
          >
            {actionType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard; 