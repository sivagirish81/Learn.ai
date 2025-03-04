import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { BookmarkBorder, Bookmark, OpenInNew } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, isAuthenticated, getAuthHeaders, logout } = useAuth();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleAuthError = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const response = await fetch('http://127.0.0.1:5000/api/bookmarks', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setBookmarks(data.bookmarks);
      } else if (response.status === 401) {
        handleAuthError();
      } else {
        setError('Failed to fetch bookmarks');
      }
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (resourceId) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`http://127.0.0.1:5000/api/bookmarks/${resourceId}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        setBookmarks(prev => prev.filter(bookmark => bookmark.id !== resourceId));
      } else if (response.status === 401) {
        handleAuthError();
      }
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookmarks();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const getResourceTypeColor = (type) => {
    const colors = {
      'Tutorial': '#4CAF50',
      'Research Paper': '#2196F3',
      'GitHub Repository': '#9C27B0',
      'Course': '#FF9800',
      'Blog Post': '#F44336',
      'Documentation': '#607D8B',
      'Video': '#E91E63',
      'Book': '#795548',
      'Tool': '#00BCD4'
    };
    return colors[type] || '#757575';
  };

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Welcome, {user?.name || 'User'}!
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/submit')}
        >
          Submit New Resource
        </Button>
      </Box>

      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Your Bookmarked Resources
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : bookmarks.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          You haven't bookmarked any resources yet. Browse the Knowledge Hub to find interesting resources!
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {bookmarks.map((resource) => (
            <Grid item xs={12} sm={6} md={4} key={resource.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {resource.title}
                    </Typography>
                    <Box>
                      <IconButton onClick={() => removeBookmark(resource.id)}>
                        <Bookmark color="primary" />
                      </IconButton>
                      <IconButton href={resource.url} target="_blank">
                        <OpenInNew />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={resource.resource_type}
                      size="small"
                      sx={{
                        backgroundColor: getResourceTypeColor(resource.resource_type),
                        color: 'white',
                        mr: 1,
                        mb: 1
                      }}
                    />
                    <Chip
                      label={resource.category}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {resource.description}
                  </Typography>

                  <Box sx={{ mt: 'auto' }}>
                    {resource.tags?.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Dashboard; 