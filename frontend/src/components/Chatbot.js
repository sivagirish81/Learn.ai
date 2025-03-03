import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Divider
} from '@mui/material';
import { Send, Clear, BookmarkBorder, Bookmark } from '@mui/icons-material';
import { sendChatMessage, clearChatHistory, addBookmark } from '../services/api';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    
    try {
      setLoading(true);
      setError(null);
      const response = await sendChatMessage(userMessage);
      
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: response.message,
        resources: response.resources
      }]);
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await clearChatHistory();
      setMessages([]);
      setError(null);
    } catch (err) {
      setError('Failed to clear chat history');
      console.error(err);
    }
  };

  const handleBookmark = async (resourceId) => {
    try {
      await addBookmark(resourceId);
      // Update the UI to show the resource is bookmarked
      setMessages(messages.map(msg => {
        if (msg.resources) {
          return {
            ...msg,
            resources: msg.resources.map(resource => 
              resource.id === resourceId 
                ? { ...resource, bookmarked: true }
                : resource
            )
          };
        }
        return msg;
      }));
    } catch (err) {
      setError('Failed to bookmark resource');
      console.error(err);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        AI Learning Assistant
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          height: '70vh', 
          display: 'flex', 
          flexDirection: 'column',
          mb: 2
        }}
      >
        <Box 
          sx={{ 
            flex: 1, 
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%'
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  bgcolor: message.type === 'user' ? 'primary.main' : 'grey.100',
                  color: message.type === 'user' ? 'white' : 'text.primary'
                }}
              >
                <Typography>{message.content}</Typography>
              </Paper>
              
              {message.resources && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Relevant Resources:
                  </Typography>
                  {message.resources.map((resource) => (
                    <Card key={resource.id} sx={{ mb: 1 }}>
                      <CardContent>
                        <Typography variant="h6" component="h3">
                          {resource.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {resource.description}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={resource.category}
                            color="primary"
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          {resource.tags?.map((tag) => (
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
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Visit Resource
                        </Button>
                        <IconButton
                          onClick={() => handleBookmark(resource.id)}
                          color={resource.bookmarked ? "primary" : "default"}
                        >
                          {resource.bookmarked ? <Bookmark /> : <BookmarkBorder />}
                        </IconButton>
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>
        
        <Divider />
        
        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          
          <form onSubmit={handleSendMessage}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ask me anything about AI..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !input.trim()}
                startIcon={<Send />}
              >
                Send
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearChat}
                disabled={loading || messages.length === 0}
                startIcon={<Clear />}
              >
                Clear
              </Button>
            </Box>
          </form>
        </Box>
      </Paper>
    </Container>
  );
};

export default Chatbot; 