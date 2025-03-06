import React from 'react';
import { Box, Card, CardContent, Typography, Chip, IconButton } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

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
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                            {resource.title}
                        </a>
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
                <IconButton href={resource.url} target="_blank" rel="noopener noreferrer">
                    <BookmarkBorderIcon />
                </IconButton>
            </Box>
        </CardContent>
    </Card>
);

export default ResourceCard;