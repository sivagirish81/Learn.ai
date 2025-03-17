import React, { useState } from 'react';
import { 
    Box, 
    Container, 
    TextField, 
    Typography, 
    Card, 
    CardContent, 
    Grid,
    Chip,
    IconButton,
    InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';

const SimpleSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`https://learn-ai-n0cl.onrender.com/api/search?query=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();
            setResults(data.results || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const getResourceTypeColor = (type) => {
        const colors = {
            'Tutorial': '#4CAF50',
            'Research Paper': '#2196F3',
            'GitHub Repository': '#9C27B0',
            'Course': '#FF9800',
            'Blog Post': '#F44336'
        };
        return colors[type] || '#757575';
    };

    const ResourceCard = ({ resource }) => (
        <Card sx={{ mb: 2, boxShadow: 2 }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                        <Typography variant="h6" component="h2" gutterBottom>
                            {resource.title}
                        </Typography>
                        <Box mb={1}>
                            <Chip 
                                label={resource.resource_type}
                                size="small"
                                sx={{ 
                                    backgroundColor: getResourceTypeColor(resource.resource_type),
                                    color: 'white',
                                    mr: 1
                                }}
                            />
                            {resource.tags?.map((tag, index) => (
                                <Chip 
                                    key={index}
                                    label={tag}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mr: 1 }}
                                />
                            ))}
                        </Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            {resource.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {resource.author && `By ${resource.author} • `}
                            {resource.publication_date && new Date(resource.publication_date).toLocaleDateString()}
                        </Typography>
                    </Box>
                    <IconButton>
                        <BookmarkBorderIcon />
                    </IconButton>
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Container maxWidth="md">
            <Box py={8} textAlign="center">
                <Typography variant="h3" component="h1" gutterBottom>
                    Learn.ai Resources
                </Typography>
                <Typography variant="h6" color="text.secondary" paragraph>
                    Search through curated AI learning resources
                </Typography>
                <Box component="form" onSubmit={handleSearch} mb={6}>
                    <TextField
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for tutorials, research papers, courses..."
                        variant="outlined"
                        sx={{ 
                            maxWidth: 600,
                            backgroundColor: 'white',
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3
                            }
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton type="submit">
                                        <SearchIcon />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                </Box>

                {loading ? (
                    <Typography>Searching...</Typography>
                ) : (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            {results.length > 0 ? (
                                results.map((resource, index) => (
                                    <ResourceCard key={index} resource={resource} />
                                ))
                            ) : searchTerm && (
                                <Typography color="text.secondary">
                                    No results found for "{searchTerm}"
                                </Typography>
                            )}
                        </Grid>
                    </Grid>
                )}
            </Box>
        </Container>
    );
};

export default SimpleSearch; 