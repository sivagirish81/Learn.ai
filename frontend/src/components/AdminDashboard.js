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
  TablePagination,
  Tab,
  Tabs,
  IconButton
} from '@mui/material';
import { Check, Close, OpenInNew, Delete, Edit } from '@mui/icons-material';
import { getPendingResources, approveResource, rejectResource } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { token, user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
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
  const [editDialog, setEditDialog] = useState({ open: false, type: '', data: null });
  const [formData, setFormData] = useState({});
  const [success, setSuccess] = useState('');

  // Check if user is admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }
    fetchUsers();
    fetchResources();
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      setError('Failed to fetch users');
    }
  };

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await getPendingResources(page + 1, rowsPerPage);
      console.log(response)
      setResources(response.resources);
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

  const handleEditUser = (user) => {
    setFormData(user);
    setEditDialog({ open: true, type: 'user', data: user });
  };

  const handleEditResource = (resource) => {
    setFormData(resource);
    setEditDialog({ open: true, type: 'resource', data: resource });
  };

  const handleDelete = async (type, id) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/${type === 'user' ? 'admin/users' : 'resources'}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess(`${type} deleted successfully`);
        if (type === 'user') {
          setUsers(users.filter(user => user.id !== id));
        } else {
          setResources(resources.filter(resource => resource.id !== id));
        }
      }
    } catch (error) {
      setError(`Failed to delete ${type}`);
    }
  };

  const handleSubmit = async () => {
    try {
      const { type, data } = editDialog;
      const endpoint = type === 'user' 
        ? `http://127.0.0.1:5000/api/admin/users/${data.id}`
        : `http://127.0.0.1:5000/api/admin/resources/${data.id}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(`${type} updated successfully`);
        if (type === 'user') {
          fetchUsers();
        } else {
          fetchResources();
        }
        setEditDialog({ open: false, type: '', data: null });
      }
    } catch (error) {
      setError('Failed to update');
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
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Paper elevation={3}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Users" />
          <Tab label="Resources" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditUser(user)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete('user', user.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
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
                        <IconButton onClick={() => handleEditResource(resource)}>
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDelete('resource', resource.id)}>
                          <Delete />
                        </IconButton>
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
        </TabPanel>
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

      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, type: '', data: null })}>
        <DialogTitle>
          Edit {editDialog.type === 'user' ? 'User' : 'Resource'}
        </DialogTitle>
        <DialogContent>
          {editDialog.type === 'user' && (
            <>
              <TextField
                fullWidth
                margin="normal"
                label="Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Role"
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
            </>
          )}
          {editDialog.type === 'resource' && (
            <>
              <TextField
                fullWidth
                margin="normal"
                label="Title"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Category"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              <TextField
                fullWidth
                margin="normal"
                label="URL"
                value={formData.url || ''}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Description"
                multiline
                rows={4}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, type: '', data: null })}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ padding: '20px 0' }}>
      {value === index && children}
    </div>
  );
}

export default AdminDashboard; 