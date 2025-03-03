import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  AlertTitle
} from '@mui/material';
import { Send, Clear } from '@mui/icons-material';
import { submitResource } from '../services/api';

const VALID_CATEGORIES = [
  'tutorial',
  'research_paper',
  'github_repository',
  'course',
  'book',
  'video',
  'blog_post'
];

const ResourceSubmission = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    category: '',
    tags: [],
    content: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await submitResource(formData);
      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        url: '',
        category: '',
        tags: [],
        content: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to submit resource');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      category: '',
      tags: [],
      content: ''
    });
    setTagInput('');
    setError(null);
    setSuccess(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Submit a Resource
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <AlertTitle>Success</AlertTitle>
            Your resource has been submitted successfully and is pending review.
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            required
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            margin="normal"
          />
          
          <TextField
            fullWidth
            required
            label="URL"
            name="url"
            type="url"
            value={formData.url}
            onChange={handleChange}
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              label="Category"
            >
              {VALID_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {category.replace('_', ' ').toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            required
            multiline
            rows={4}
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Add Tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleTagInputKeyPress}
            margin="normal"
            helperText="Press Enter to add a tag"
          />
          
          <Box sx={{ mt: 1, mb: 2 }}>
            {formData.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
          
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Additional Content (optional)"
            name="content"
            value={formData.content}
            onChange={handleChange}
            margin="normal"
            helperText="You can add more details, code snippets, or any other relevant information"
          />
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={<Send />}
            >
              Submit Resource
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={handleClear}
              disabled={loading}
              startIcon={<Clear />}
            >
              Clear Form
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default ResourceSubmission; 