from datetime import datetime
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk
from elasticsearch.exceptions import NotFoundError
from urllib.parse import urlparse
import re

es = Elasticsearch(['http://127.0.0.1:9200'])

class ResourceValidationError(Exception):
    pass

class Resource:
    index_name = 'ai_resources'
    
    RESOURCE_TYPES = [
        'Tutorial',
        'Research Paper',
        'GitHub Repository',
        'Documentation',
        'Course',
        'Blog Post',
        'Book',
        'Video',
        'Tool'
    ]

    def __init__(self, title, url, description, category, resource_type, tags=None, 
                 author=None, publication_date=None, github_stars=None, 
                 difficulty_level=None, prerequisites=None, submitted_by=None, 
                 status='pending', admin_notes=None):
        self.title = title
        self.url = url
        self.description = description
        self.category = category
        self.resource_type = resource_type
        self.tags = tags or []
        self.author = author
        self.publication_date = publication_date
        self.github_stars = github_stars
        self.difficulty_level = difficulty_level
        self.prerequisites = prerequisites or []
        self.submitted_by = submitted_by
        self.status = status
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
            'url': self.url,
            'description': self.description,
            'category': self.category,
            'resource_type': self.resource_type,
            'tags': self.tags,
            'author': self.author,
            'publication_date': self.publication_date,
            'github_stars': self.github_stars,
            'difficulty_level': self.difficulty_level,
            'prerequisites': self.prerequisites,
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
            # Validate required fields
            required_fields = ['title', 'url', 'description', 'category', 'resource_type']
            missing_fields = [field for field in required_fields if not resource_data.get(field)]
            if missing_fields:
                raise ResourceValidationError(f"Missing required fields: {', '.join(missing_fields)}")

            # Validate resource type
            if resource_data['resource_type'] not in cls.RESOURCE_TYPES:
                raise ResourceValidationError(f"Invalid resource type. Must be one of: {', '.join(cls.RESOURCE_TYPES)}")

            # Create resource instance
            resource = cls(**resource_data)

            # Save to Elasticsearch
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
    def search(cls, query=None, category=None, resource_type=None, tags=None, 
              status=None, page=1, size=10):
        """Search for resources with filters"""
        try:
            must_conditions = []
            
            if query:
                must_conditions.append({
                    'multi_match': {
                        'query': query,
                        'fields': ['title^3', 'description^2', 'tags', 'author'],
                        'type': 'best_fields',
                        'fuzziness': 'AUTO'
                    }
                })

            if category:
                must_conditions.append({'term': {'category.keyword': category}})
                
            if resource_type:
                must_conditions.append({'term': {'resource_type.keyword': resource_type}})
                
            if tags:
                must_conditions.append({'terms': {'tags.keyword': tags if isinstance(tags, list) else [tags]}})
                
            if status:
                must_conditions.append({'term': {'status.keyword': status}})
            else:
                # By default, only show approved resources
                must_conditions.append({'term': {'status.keyword': 'approved'}})

            body = {
                'query': {
                    'bool': {
                        'must': must_conditions if must_conditions else [{'match_all': {}}]
                    }
                },
                'sort': [
                    {'_score': {'order': 'desc'}},
                    {'created_at': {'order': 'desc'}}
                ],
                'from': (page - 1) * size,
                'size': size
            }

            result = es.search(index=cls.index_name, body=body)
            
            resources = [{'id': hit['_id'], **hit['_source']} for hit in result['hits']['hits']]
            total = result['hits']['total']['value']
            
            return {
                'resources': resources,
                'total': total,
                'page': page,
                'size': size,
                'pages': (total + size - 1) // size
            }
        except Exception as e:
            raise ResourceValidationError(f"Failed to search resources: {str(e)}")

    @classmethod
    def get_all_resources(cls):
        """Get all resources"""
        try:
            es = Elasticsearch()
            result = es.search(index=cls.index_name, body={
                'query': {"match_all": {}},
                "_source": True,
                'size': 100,
                'track_total_hits': True
            })
            return result
        except Exception as e:
            raise ResourceValidationError(f"Failed to get all resources: {str(e)}")
        
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
                    'settings': {
                        'analysis': {
                            'analyzer': {
                                'tag_analyzer': {
                                    'type': 'custom',
                                    'tokenizer': 'standard',
                                    'filter': ['lowercase', 'stop']
                                }
                            }
                        }
                    },
                    'mappings': {
                        'properties': {
                            'title': {'type': 'text', 'analyzer': 'standard'},
                            'url': {'type': 'keyword'},
                            'description': {'type': 'text', 'analyzer': 'standard'},
                            'category': {'type': 'keyword'},
                            'resource_type': {'type': 'keyword'},
                            'tags': {'type': 'text', 'analyzer': 'tag_analyzer', 'fielddata': True},
                            'author': {'type': 'text'},
                            'publication_date': {'type': 'date', 'format': 'strict_date_optional_time||epoch_millis'},
                            'github_stars': {'type': 'integer'},
                            'difficulty_level': {'type': 'keyword'},
                            'prerequisites': {'type': 'keyword'},
                            'submitted_by': {'type': 'keyword'},
                            'status': {'type': 'keyword'},
                            'admin_notes': {'type': 'text'},
                            'created_at': {'type': 'date'},
                            'updated_at': {'type': 'date'}
                        }
                    }
                }
            ) 