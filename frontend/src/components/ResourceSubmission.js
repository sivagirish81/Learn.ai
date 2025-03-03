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
  FormHelperText
} from '@mui/material';
import { Send, Clear } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const ResourceSubmission = () => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    category: '',
    tags: [],
    resource_type: '',
    author: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const resourceTypes = [
    'Tutorial',
    'Research Paper',
    'GitHub Repository',
    'Course',
    'Blog Post',
    'Documentation',
    'Video',
    'Book',
    'Tool'
  ];

  const categories = [
    'Machine Learning',
    'Deep Learning',
    'Natural Language Processing',
    'Computer Vision',
    'Reinforcement Learning',
    'AI Ethics',
    'MLOps',
    'Data Science',
    'Neural Networks'
  ];

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
    setMessage({ type: '', text: '' });

    // Validate required fields
    const requiredFields = ['title', 'url', 'description', 'resource_type', 'category'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setMessage({
        type: 'error',
        text: `Please fill in the following required fields: ${missingFields.join(', ')}`
      });
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Resource submitted successfully! It will be reviewed by our team.'
        });
        setFormData({
          title: '',
          description: '',
          url: '',
          category: '',
          tags: [],
          resource_type: '',
          author: ''
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to submit resource'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to connect to the server'
      });
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
      resource_type: '',
      author: ''
    });
    setTagInput('');
    setMessage({ type: '', text: '' });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Submit a Resource
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        {message.text && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
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
            <InputLabel>Resource Type</InputLabel>
            <Select
              name="resource_type"
              value={formData.resource_type}
              onChange={handleChange}
              label="Resource Type"
            >
              {resourceTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Required</FormHelperText>
          </FormControl>
          
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              label="Category"
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Required</FormHelperText>
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
            label="Author"
            name="author"
            value={formData.author}
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