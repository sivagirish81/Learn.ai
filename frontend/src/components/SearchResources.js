import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { BookmarkBorder, Bookmark, OpenInNew, FilterList, Clear } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import debounce from 'lodash/debounce';

export default function SearchResources() {
  const { token, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query) => {
      handleSearch(query);
    }, 500),
    []
  );

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    }
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    handleSearch();
  }, [page, selectedCategory, selectedTags]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('https://learn-ai-n0cl.onrender.com/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      setError('Failed to fetch categories');
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('https://learn-ai-n0cl.onrender.com/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags);
      }
    } catch (error) {
      setError('Failed to fetch tags');
    }
  };

  const handleSearch = async (query = searchQuery) => {
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams({
        query: query,
        page: page,
        size: 10,
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedTags.length > 0 && { tags: selectedTags.join(',') })
      });

      const response = await fetch(`https://learn-ai-n0cl.onrender.com/api/search?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources);
        setTotalPages(Math.ceil(data.total / 10));
      }
    } catch (error) {
      setError('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (resourceId) => {
    if (!token) {
      setError('Please login to bookmark resources');
      return;
    }

    try {
      const response = await fetch(`https://learn-ai-n0cl.onrender.com/api/bookmarks/${resourceId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const updatedResources = resources.map(resource => {
          if (resource.id === resourceId) {
            return { ...resource, bookmarked: !resource.bookmarked };
          }
          return resource;
        });
        setResources(updatedResources);
      }
    } catch (error) {
      setError('Failed to update bookmark');
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedTags([]);
    setPage(1);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Search AI Resources
          </Typography>
          <Box>
            <Tooltip title={showFilters ? "Hide filters" : "Show filters"}>
              <IconButton onClick={() => setShowFilters(!showFilters)}>
                <FilterList />
              </IconButton>
            </Tooltip>
            {(selectedCategory || selectedTags.length > 0) && (
              <Tooltip title="Clear filters">
                <IconButton onClick={clearFilters}>
                  <Clear />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Search resources"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by title, description, or content..."
            />
          </Grid>
          {showFilters && (
            <>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tags</InputLabel>
                  <Select
                    multiple
                    value={selectedTags}
                    label="Tags"
                    onChange={(e) => setSelectedTags(e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {tags.map((tag) => (
                      <MenuItem key={tag} value={tag}>
                        {tag}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {resources.length > 0 ? (
                resources.map((resource) => (
                  <Grid item xs={12} md={6} key={resource.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" component="h2" gutterBottom>
                          {resource.title}
                        </Typography>
                        <Typography color="textSecondary" gutterBottom>
                          {resource.category}
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {resource.description}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {resource.tags?.map((tag) => (
                            <Chip key={tag} label={tag} size="small" />
                          ))}
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<OpenInNew />}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Visit
                        </Button>
                        {token && (
                          <Button
                            size="small"
                            startIcon={resource.bookmarked ? <Bookmark /> : <BookmarkBorder />}
                            onClick={() => handleBookmark(resource.id)}
                          >
                            {resource.bookmarked ? 'Bookmarked' : 'Bookmark'}
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="textSecondary">
                      No resources found
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Try adjusting your search or filters
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Container>
  );
} 