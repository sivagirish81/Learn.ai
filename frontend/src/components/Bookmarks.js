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
  Alert
} from '@mui/material';
import { Bookmark, OpenInNew } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Bookmarks = () => {
  const { isAuthenticated, getAuthHeaders, logout } = useAuth();
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
      const data = await response.json();

      console.log('Bookmarks response:', data); // Log the response

      if (response.ok) {
        setBookmarks(data.bookmarks || []);
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookmarks();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Your Bookmarks
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : bookmarks.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          You haven't bookmarked any resources yet.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {bookmarks.map((bookmark) => (
            <Grid item xs={12} sm={6} md={4} key={bookmark.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {bookmark.title}
                    </Typography>
                    <Box>
                      <IconButton href={bookmark.url} target="_blank">
                        <OpenInNew />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={bookmark.category}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {bookmark.description}
                  </Typography>

                  <Box sx={{ mt: 'auto' }}>
                    {bookmark.tags?.map((tag) => (
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

export default Bookmarks;