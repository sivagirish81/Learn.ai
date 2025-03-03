import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, CardActions, Button, Chip, Avatar } from '@mui/material';
import { BookmarkBorder, Delete, Person } from '@mui/icons-material';
import { getBookmarks, removeBookmark } from '../services/api';

const Dashboard = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const response = await getBookmarks();
      setBookmarks(response);
      setError(null);
    } catch (err) {
      setError('Failed to fetch bookmarks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (resourceId) => {
    try {
      await removeBookmark(resourceId);
      setBookmarks(bookmarks.filter(bookmark => bookmark.id !== resourceId));
    } catch (err) {
      setError('Failed to remove bookmark');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Your Dashboard
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h5" component="h2" gutterBottom>
            <BookmarkBorder sx={{ mr: 1 }} />
            Your Bookmarked Resources
          </Typography>
          {bookmarks.length === 0 ? (
            <Typography variant="body1" color="textSecondary">
              You haven't bookmarked any resources yet.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {bookmarks.map((bookmark) => (
                <Grid item xs={12} md={6} key={bookmark.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {bookmark.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {bookmark.description}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={bookmark.category}
                          color="primary"
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        {bookmark.tags?.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        color="primary"
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visit Resource
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => handleRemoveBookmark(bookmark.id)}
                      >
                        Remove Bookmark
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 