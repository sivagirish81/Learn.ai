import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Chip,
    Box,
    Grid,
    Link,
    CardActions,
    Button,
    Rating
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { format } from 'date-fns';

const SearchResults = ({ results }) => {
    if (!Array.isArray(results)) {
        return null;
    }

    return (
        <Grid container spacing={3}>
            {results.map((resource, index) => (
                <Grid item xs={12} key={resource.id || index}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Typography variant="h6" component="h2" gutterBottom>
                                    <Link 
                                        href={resource.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        sx={{ 
                                            textDecoration: 'none',
                                            '&:hover': {
                                                textDecoration: 'underline'
                                            }
                                        }}
                                    >
                                        {resource.title}
                                    </Link>
                                </Typography>
                                <Rating 
                                    value={resource.rating || 0} 
                                    readOnly 
                                    precision={0.5}
                                />
                            </Box>

                            <Typography variant="body2" color="text.secondary" paragraph>
                                {resource.description}
                            </Typography>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" component="span" sx={{ mr: 1 }}>
                                    Category:
                                </Typography>
                                <Chip 
                                    label={resource.category} 
                                    size="small" 
                                    color="primary" 
                                    sx={{ mr: 1 }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {resource.tags && resource.tags.map((tag, tagIndex) => (
                                    <Chip
                                        key={tagIndex}
                                        label={tag}
                                        size="small"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>

                            {resource.author && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                    Author: {resource.author}
                                </Typography>
                            )}

                            {resource.publishedDate && (
                                <Typography variant="body2" color="text.secondary">
                                    Published: {new Date(resource.publishedDate).toLocaleDateString()}
                                </Typography>
                            )}
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                {resource.created_at && format(new Date(resource.created_at), 'MMM d, yyyy')}
                            </Typography>
                            <Button
                                component={Link}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                endIcon={<OpenInNewIcon />}
                                size="small"
                            >
                                Visit
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default SearchResults; 