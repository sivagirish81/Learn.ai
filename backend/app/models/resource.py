from datetime import datetime
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk
from elasticsearch.exceptions import NotFoundError
from urllib.parse import urlparse
import re

es = Elasticsearch(['http://localhost:9200'])

class ResourceValidationError(Exception):
    pass

class Resource:
    index_name = 'ai_resources'
    VALID_CATEGORIES = {
        'tutorial', 'research_paper', 'github_repository', 
        'course', 'book', 'video', 'blog_post'
    }

    def __init__(self, title, description, url, category, tags=None, 
                 content=None, submitted_by=None, status='pending', 
                 admin_notes=None):
        self.title = title
        self.description = description
        self.url = url
        self.category = category
        self.tags = tags or []
        self.content = content
        self.submitted_by = submitted_by
        self.status = status  # pending, approved, rejected
        self.admin_notes = admin_notes
        self.created_at = datetime.utcnow().isoformat()
        self.updated_at = self.created_at

    def validate(self):
        """Validate resource data"""
        if not self.title or not isinstance(self.title, str):
            raise ResourceValidationError("Title is required and must be a string")
        
        if not self.description or not isinstance(self.description, str):
            raise ResourceValidationError("Description is required and must be a string")
        
        if not self.url or not isinstance(self.url, str):
            raise ResourceValidationError("URL is required and must be a string")
        
        if not self.category or self.category not in self.VALID_CATEGORIES:
            raise ResourceValidationError(f"Category must be one of: {', '.join(self.VALID_CATEGORIES)}")
        
        if not isinstance(self.tags, list):
            raise ResourceValidationError("Tags must be a list")
        
        if self.status not in ['pending', 'approved', 'rejected']:
            raise ResourceValidationError("Invalid status")

    def to_dict(self):
        """Convert resource to dictionary"""
        return {
            'title': self.title,
            'description': self.description,
            'url': self.url,
            'category': self.category,
            'tags': self.tags,
            'content': self.content,
            'submitted_by': self.submitted_by,
            'status': self.status,
            'admin_notes': self.admin_notes,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @classmethod
    def create(cls, resource_data):
        """Create a new resource"""
        try:
            resource = cls(**resource_data)
            resource.validate()
            
            result = es.index(index=cls.index_name, body=resource.to_dict())
            es.indices.refresh(index=cls.index_name)
            return {'id': result['_id'], **resource.to_dict()}
        except ResourceValidationError as e:
            raise e
        except Exception as e:
            raise ResourceValidationError(f"Failed to create resource: {str(e)}")

    @classmethod
    def get(cls, resource_id):
        """Get a resource by ID"""
        try:
            result = es.get(index=cls.index_name, id=resource_id)
            return {'id': result['_id'], **result['_source']}
        except NotFoundError:
            return None
        except Exception as e:
            raise ResourceValidationError(f"Failed to get resource: {str(e)}")

    @classmethod
    def update(cls, resource_id, resource_data):
        """Update a resource"""
        try:
            current = cls.get(resource_id)
            if not current:
                return False

            # Update timestamp
            resource_data['updated_at'] = datetime.utcnow().isoformat()
            
            es.update(
                index=cls.index_name,
                id=resource_id,
                body={'doc': resource_data}
            )
            es.indices.refresh(index=cls.index_name)
            return True
        except Exception as e:
            raise ResourceValidationError(f"Failed to update resource: {str(e)}")

    @classmethod
    def delete(cls, resource_id):
        """Delete a resource"""
        try:
            if not cls.get(resource_id):
                return False
                
            es.delete(index=cls.index_name, id=resource_id)
            es.indices.refresh(index=cls.index_name)
            return True
        except Exception as e:
            raise ResourceValidationError(f"Failed to delete resource: {str(e)}")

    @classmethod
    def search(cls, query=None, category=None, tags=None, status=None, 
               submitted_by=None, page=1, size=10):
        """Search for resources with filters"""
        try:
            s = Search(using=es, index=cls.index_name)
            
            # Build query
            if query:
                s = s.query('multi_match', query=query, 
                           fields=['title^2', 'description', 'content'])
            
            # Add filters
            if category:
                s = s.filter('term', category=category)
            if tags:
                s = s.filter('terms', tags=tags)
            if status:
                s = s.filter('term', status=status)
            if submitted_by:
                s = s.filter('term', submitted_by=submitted_by)
            
            # Add pagination
            s = s[(page-1)*size:page*size]
            
            # Execute search
            response = s.execute()
            
            results = []
            for hit in response:
                result = hit.to_dict()
                result['id'] = hit.meta.id
                results.append(result)
            
            return {
                'total': response.hits.total.value,
                'page': page,
                'size': size,
                'results': results
            }
        except Exception as e:
            raise ResourceValidationError(f"Failed to search resources: {str(e)}")

    @classmethod
    def bulk_create(cls, resources):
        """Bulk create resources"""
        try:
            success = []
            failed = []
            
            for resource_data in resources:
                try:
                    resource = cls.create(resource_data)
                    success.append(resource)
                except Exception as e:
                    failed.append({
                        'data': resource_data,
                        'error': str(e)
                    })
            
            return {
                'success': success,
                'failed': failed
            }
        except Exception as e:
            raise ResourceValidationError(f"Failed to bulk create resources: {str(e)}")

    @classmethod
    def setup_index(cls):
        """Create the resource index if it doesn't exist"""
        if not es.indices.exists(index=cls.index_name):
            es.indices.create(
                index=cls.index_name,
                body={
                    'mappings': {
                        'properties': {
                            'title': {'type': 'text'},
                            'description': {'type': 'text'},
                            'url': {'type': 'keyword'},
                            'category': {'type': 'keyword'},
                            'tags': {'type': 'keyword'},
                            'content': {'type': 'text'},
                            'submitted_by': {'type': 'keyword'},
                            'status': {'type': 'keyword'},
                            'admin_notes': {'type': 'text'},
                            'created_at': {'type': 'date'},
                            'updated_at': {'type': 'date'}
                        }
                    }
                }
            ) 