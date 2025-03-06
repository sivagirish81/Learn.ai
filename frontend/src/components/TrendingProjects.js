import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';

const TrendingProjects = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrendingRepositories = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/github/trending');
      const data = await response.json();
      if (response.ok) {
        setRepositories(data);
      } else {
        setError(data.error || 'Failed to fetch trending repositories');
      }
    } catch (error) {
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingRepositories();
  }, []);

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
        Trending AI Projects on GitHub
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {repositories.map((repo, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {repo.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {repo.description}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip label={`Stars: ${repo.stargazers_count}`} size="small" variant="outlined" sx={{ mr: 1, mb: 1 }} />
                    <Chip label={`Forks: ${repo.forks_count}`} size="small" variant="outlined" sx={{ mr: 1, mb: 1 }} />
                    <Chip label={`Language: ${repo.language}`} size="small" variant="outlined" sx={{ mr: 1, mb: 1 }} />
                  </Box>
                  <Box sx={{ mt: 'auto' }}>
                    <Typography variant="body2" color="text.secondary">
                      Contributors:
                    </Typography>
                    {repo.contributors_url && (
                      <a href={repo.contributors_url} target="_blank" rel="noopener noreferrer">
                        View Contributors
                      </a>
                    )}
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

export default TrendingProjects;