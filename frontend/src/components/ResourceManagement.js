import React, { useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    Snackbar,
    Alert
} from '@mui/material';
import ResourceForm from './ResourceForm';
import { resourceAPI } from '../services/api';

const ResourceManagement = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const handleCreateResource = async (formData) => {
        try {
            // Ensure all required fields are present and properly formatted
            const resourceData = {
                title: formData.title.trim(),
                url: formData.url.trim(),
                description: formData.description.trim(),
                tags: (formData.tags || []).map(tag => tag.trim()).filter(tag => tag),
                category: formData.category ? formData.category.trim() : null,
                source: formData.source ? formData.source.trim() : null
            };

            // Validate required fields
            if (!resourceData.title || !resourceData.url || !resourceData.description) {
                throw new Error('Title, URL, and description are required');
            }

            const response = await resourceAPI.create(resourceData);
            
            setNotification({
                open: true,
                message: 'Resource created successfully',
                severity: 'success'
            });
            setIsFormOpen(false);
            return response;
        } catch (error) {
            console.error('Create resource error:', error);
            setNotification({
                open: true,
                message: error.message || error.error || 'Failed to create resource',
                severity: 'error'
            });
        }
    };

    const handleUpdateResource = async (formData) => {
        try {
            // Ensure all required fields are present and properly formatted
            const resourceData = {
                title: formData.title.trim(),
                url: formData.url.trim(),
                description: formData.description.trim(),
                tags: (formData.tags || []).map(tag => tag.trim()).filter(tag => tag),
                category: formData.category ? formData.category.trim() : null,
                source: formData.source ? formData.source.trim() : null
            };

            // Validate required fields
            if (!resourceData.title || !resourceData.url || !resourceData.description) {
                throw new Error('Title, URL, and description are required');
            }

            const response = await resourceAPI.update(selectedResource.id, resourceData);
            
            setNotification({
                open: true,
                message: 'Resource updated successfully',
                severity: 'success'
            });
            setIsFormOpen(false);
            setSelectedResource(null);
            return response;
        } catch (error) {
            console.error('Update resource error:', error);
            setNotification({
                open: true,
                message: error.message || error.error || 'Failed to update resource',
                severity: 'error'
            });
        }
    };

    const handleSubmit = async (formData) => {
        try {
            if (selectedResource) {
                await handleUpdateResource(formData);
            } else {
                await handleCreateResource(formData);
            }
        } catch (error) {
            console.error('Submit error:', error);
            // Error notification is already handled in create/update handlers
        }
    };

    const handleClose = () => {
        setIsFormOpen(false);
        setSelectedResource(null);
    };

    return (
        <Box>
            <Button
                variant="contained"
                color="primary"
                onClick={() => setIsFormOpen(true)}
                sx={{ mb: 2 }}
            >
                Add New Resource
            </Button>

            <Dialog
                open={isFormOpen}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedResource ? 'Edit Resource' : 'Add New Resource'}
                </DialogTitle>
                <DialogContent>
                    <ResourceForm
                        initialData={selectedResource}
                        onSubmit={handleSubmit}
                        onCancel={handleClose}
                    />
                </DialogContent>
            </Dialog>

            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification({ ...notification, open: false })}
            >
                <Alert
                    onClose={() => setNotification({ ...notification, open: false })}
                    severity={notification.severity}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ResourceManagement; 