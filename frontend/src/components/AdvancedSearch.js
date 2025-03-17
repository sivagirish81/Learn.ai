import React, { useState } from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';
import AdvancedSearchBar from './AdvancedSearchBar';
import ResourceCard from './ResourceCard';

const AdvancedSearch = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (query) => {
        setLoading(true);
        try {
            const response = await fetch(`https://learn-ai-n0cl.onrender.com/api/advsearch?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            setResults(data.results || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Box py={8} textAlign="center">
                <Typography variant="h3" component="h1" gutterBottom>
                    Advanced AI Resource Search
                </Typography>
                <Typography variant="h6" color="text.secondary" paragraph>
                    Search through curated AI learning resources
                </Typography>
                <AdvancedSearchBar onSearch={handleSearch} />
                {loading ? (
                    <Typography>Searching...</Typography>
                ) : (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            {results.length > 0 ? (
                                results.map((resource, index) => (
                                    <ResourceCard key={index} resource={resource} />
                                ))
                            ) : (
                                <Typography color="text.secondary">
                                    No results found
                                </Typography>
                            )}
                        </Grid>
                    </Grid>
                )}
            </Box>
        </Container>
    );
};

export default AdvancedSearch;