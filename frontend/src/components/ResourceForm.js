import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    OutlinedInput,
    Typography
} from '@mui/material';

const CATEGORIES = ['tutorial', 'course', 'documentation', 'research', 'github', 'blog'];

const ResourceForm = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        url: initialData?.url || '',
        description: initialData?.description || '',
        tags: initialData?.tags || [],
        category: initialData?.category || '',
        source: initialData?.source || ''
    });
    const [errors, setErrors] = useState({});
    const [newTag, setNewTag] = useState('');

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.url.trim()) newErrors.url = 'URL is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    const handleAddTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                error={!!errors.title}
                helperText={errors.title}
                required
                fullWidth
            />

            <TextField
                label="URL"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                error={!!errors.url}
                helperText={errors.url}
                required
                fullWidth
            />

            <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                error={!!errors.description}
                helperText={errors.description}
                required
                multiline
                rows={4}
                fullWidth
            />

            <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    label="Category"
                >
                    {CATEGORIES.map(category => (
                        <MenuItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                label="Source"
                value={formData.source}
                onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                fullWidth
            />

            <Box>
                <Typography variant="subtitle2" gutterBottom>
                    Tags
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    {formData.tags.map(tag => (
                        <Chip
                            key={tag}
                            label={tag}
                            onDelete={() => handleRemoveTag(tag)}
                        />
                    ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        label="Add tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        size="small"
                    />
                    <Button onClick={handleAddTag} variant="outlined" size="small">
                        Add
                    </Button>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={onCancel} variant="outlined">
                    Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary">
                    {initialData ? 'Update' : 'Create'} Resource
                </Button>
            </Box>
        </Box>
    );
};

export default ResourceForm; 