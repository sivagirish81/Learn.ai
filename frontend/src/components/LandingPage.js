import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Paper,
  InputBase,
  Divider,
} from '@mui/material';
import { Search as SearchIcon, TrendingUp, School, Code, MenuBook, Science } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const categories = [
  { title: 'Tutorials', icon: School, description: 'Step-by-step AI learning guides' },
  { title: 'Research Papers', icon: Science, description: 'Latest AI research and publications' },
  { title: 'GitHub Repos', icon: Code, description: 'Open-source AI projects and tools' },
  { title: 'Documentation', icon: MenuBook, description: 'Framework and library docs' },
  { title: 'Courses', icon: School, description: 'Online AI courses and certifications' },
  { title: 'Trending', icon: TrendingUp, description: 'Popular AI resources' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryClick = (category) => {
    navigate(`/search?category=${encodeURIComponent(category)}`);
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          color: 'white',
          py: 8,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              textAlign: 'center',
              mb: 4,
            }}
          >
            Discover AI Resources
          </Typography>
          <Typography
            variant="h5"
            component="h2"
            sx={{
              textAlign: 'center',
              mb: 6,
              fontWeight: 300,
            }}
          >
            Find the best AI tutorials, documentation, and research papers
          </Typography>

          {/* Search Bar */}
          <Paper
            component="form"
            onSubmit={handleSearch}
            sx={{
              p: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              width: { xs: '100%', md: '600px' },
              mx: 'auto',
              bgcolor: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            <InputBase
              sx={{ ml: 1, flex: 1 }}
              placeholder="Search AI resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
              <SearchIcon />
            </IconButton>
          </Paper>
        </Container>
      </Box>

      {/* Categories Section */}
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{ mb: 4, textAlign: 'center' }}
        >
          Browse by Category
        </Typography>
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Grid item xs={12} sm={6} md={4} key={category.title}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: '0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => handleCategoryClick(category.title)}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Icon
                        sx={{
                          fontSize: 40,
                          color: 'primary.main',
                          mr: 2,
                        }}
                      />
                      <Typography variant="h6" component="h3">
                        {category.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {category.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>

        {/* Featured Section */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ mb: 4, textAlign: 'center' }}
          >
            Featured Resources
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image="/featured-tutorials.jpg"
                  alt="AI Tutorials"
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="h3">
                    Getting Started with AI
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comprehensive guides and tutorials to help you start your AI journey.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={() => handleCategoryClick('Tutorials')}
                  >
                    Explore Tutorials
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image="/featured-research.jpg"
                  alt="AI Research"
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="h3">
                    Latest Research
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Stay updated with the latest AI research papers and publications.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={() => handleCategoryClick('Research')}
                  >
                    View Research
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Call to Action */}
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            bgcolor: 'grey.100',
            borderRadius: 2,
          }}
        >
          <Typography variant="h5" component="h3" gutterBottom>
            Ready to dive deeper?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Create an account to bookmark resources and get personalized recommendations.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/register')}
          >
            Get Started
          </Button>
        </Box>
      </Container>
    </Box>
  );
} 