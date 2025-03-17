import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Stack,
  CircularProgress,
  Alert,
  TextField,
  Paper,
  InputBase,
  Divider
} from '@mui/material';
import { BookmarkBorder, Bookmark, OpenInNew, Search } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const KnowledgeHub = () => {
  const { isAuthenticated, getAuthHeaders, logout } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState('all');
  const [resourceType, setResourceType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState(new Set());

  const categories = [
    'Machine Learning',
    'Deep Learning',
    'Natural Language Processing',
    'Computer Vision',
    'Data Science',
    'Neural Networks',
    'Artificial Intelligence'
  ];

  const resourceTypes = [
    'Tutorial',
    'Research Paper',
    'GitHub Repository',
    'Course',
    'Blog Post',
    'Book',
  ];

  const handleAuthError = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      console.log('giigigis')
      let url = 'https://learn-ai-n0cl.onrender.com/api/allresources?page=1&size=18';
      if (category !== 'all') url += `&category=${category}`;
      if (resourceType !== 'all') url += `&resource_type=${resourceType}`;
      if (searchQuery) url += `&query=${encodeURIComponent(searchQuery)}`;

      const headers = getAuthHeaders();
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (response.ok) {
        // Group resources by type
        const groupedResources = {};
        data.resources.forEach(resource => {
          if (!groupedResources[resource.resource_type]) {
            groupedResources[resource.resource_type] = [];
          }
          groupedResources[resource.resource_type].push(resource);
        });
        setResources(groupedResources);
        setTotalPages(data.total_pages);
      } else {
        if (response.status === 401) {
          handleAuthError();
        } else {
          setError('Failed to fetch resources');
        }
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error);
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    if (!isAuthenticated) return;
    
    try {
      const headers = getAuthHeaders();
      const response = await fetch('https://learn-ai-n0cl.onrender.com/api/bookmarks', { headers });
      const data = await response.json();
      
      if (response.ok) {
        setBookmarks(new Set(data.bookmarks.map(b => b.id)));
      } else if (response.status === 401) {
        handleAuthError();
      }
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
    }
  };

  const toggleBookmark = async (resourceId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const method = bookmarks.has(resourceId) ? 'DELETE' : 'POST';
      const headers = getAuthHeaders();
      const response = await fetch(`https://learn-ai-n0cl.onrender.com/api/bookmarks/${resourceId}`, {
        method,
        headers
      });

      if (response.ok) {
        setBookmarks(prev => {
          const newBookmarks = new Set(prev);
          if (method === 'DELETE') {
            newBookmarks.delete(resourceId);
          } else {
            newBookmarks.add(resourceId);
          }
          return newBookmarks;
        });
      } else if (response.status === 401) {
        handleAuthError();
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [page, category, resourceType, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookmarks();
    }
  }, [isAuthenticated]);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchResources();
  };

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
      <Typography variant="h4" component="h1" gutterBottom align="center">
        AI Knowledge Hub
      </Typography>

      {/* Search Bar */}
      <Paper
        component="form"
        onSubmit={handleSearch}
        sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', mb: 4, maxWidth: 600, mx: 'auto' }}
      >
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search AI resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
        <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
          <Search />
        </IconButton>
      </Paper>

      <Box sx={{ mb: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            label="Category"
          >
            <MenuItem value="all">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Resource Type</InputLabel>
          <Select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            label="Resource Type"
          >
            <MenuItem value="all">All Types</MenuItem>
            {resourceTypes.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {Object.entries(resources).map(([type, typeResources]) => (
            <Box key={type} sx={{ mb: 6 }}>
              <Typography variant="h5" gutterBottom sx={{ 
                color: getResourceTypeColor(type),
                borderBottom: `2px solid ${getResourceTypeColor(type)}`,
                pb: 1,
                mb: 3
              }}>
                {type}
              </Typography>
              <Grid container spacing={3}>
                {typeResources.map((resource) => (
                  <Grid item xs={12} sm={6} md={4} key={resource.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="h6" component="h2" gutterBottom>
                            {resource.title}
                          </Typography>
                          <Box>
                            {isAuthenticated && (
                              <IconButton onClick={() => toggleBookmark(resource.id)}>
                                {bookmarks.has(resource.id) ? <Bookmark color="primary" /> : <BookmarkBorder />}
                              </IconButton>
                            )}
                            <IconButton href={resource.url} target="_blank">
                              <OpenInNew />
                            </IconButton>
                          </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
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
            </Box>
          ))}

          <Stack spacing={2} alignItems="center" sx={{ mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Stack>
        </>
      )}
    </Container>
  );
};

export default KnowledgeHub; 