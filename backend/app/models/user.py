from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import NotFoundError

es = Elasticsearch(['http://localhost:9200'])

class UserValidationError(Exception):
    pass

class User:
    index_name = 'ai_users'
    
    def __init__(self, email, password=None, name=None, role='user'):
        self.email = email
        self.name = name
        self.role = role
        self.bookmarks = []
        self.created_at = datetime.utcnow().isoformat()
        if password:
            self.password_hash = generate_password_hash(password)

    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'bookmarks': self.bookmarks,
            'created_at': self.created_at,
            'password_hash': self.password_hash
        }

    @classmethod
    def create(cls, user_data):
        """Create a new user"""
        try:
            # Check if user already exists
            existing = cls.get_by_email(user_data['email'])
            if existing:
                raise UserValidationError('Email already registered')

            user = cls(**user_data)
            result = es.index(index=cls.index_name, body=user.to_dict())
            es.indices.refresh(index=cls.index_name)
            return {'id': result['_id'], **user.to_dict()}
        except UserValidationError as e:
            raise e
        except Exception as e:
            raise UserValidationError(f"Failed to create user: {str(e)}")

    @classmethod
    def get(cls, user_id):
        """Get a user by ID"""
        try:
            result = es.get(index=cls.index_name, id=user_id)
            return {'id': result['_id'], **result['_source']}
        except NotFoundError:
            return None
        except Exception as e:
            raise UserValidationError(f"Failed to get user: {str(e)}")

    @classmethod
    def get_by_email(cls, email):
        """Get a user by email"""
        try:
            result = es.search(
                index=cls.index_name,
                body={
                    'query': {
                        'term': {
                            'email.keyword': email
                        }
                    }
                }
            )
            hits = result['hits']['hits']
            if hits:
                return {'id': hits[0]['_id'], **hits[0]['_source']}
            return None
        except Exception as e:
            raise UserValidationError(f"Failed to get user: {str(e)}")

    @classmethod
    def update(cls, user_id, user_data):
        """Update a user"""
        try:
            current = cls.get(user_id)
            if not current:
                return False

            # Don't allow email updates
            user_data.pop('email', None)
            
            es.update(
                index=cls.index_name,
                id=user_id,
                body={'doc': user_data}
            )
            es.indices.refresh(index=cls.index_name)
            return True
        except Exception as e:
            raise UserValidationError(f"Failed to update user: {str(e)}")

    def add_bookmark(self, resource_id):
        """Add a bookmark"""
        if resource_id not in self.bookmarks:
            self.bookmarks.append(resource_id)
            return True
        return False

    def remove_bookmark(self, resource_id):
        """Remove a bookmark"""
        if resource_id in self.bookmarks:
            self.bookmarks.remove(resource_id)
            return True
        return False

    def get_bookmarks(self):
        """Get all bookmarked resources"""
        try:
            if not self.bookmarks:
                return []
                
            results = es.mget(
                index='ai_resources',
                body={'ids': self.bookmarks}
            )
            
            bookmarks = []
            for doc in results['docs']:
                if doc['found']:
                    bookmarks.append({'id': doc['_id'], **doc['_source']})
            
            return bookmarks
        except Exception as e:
            raise UserValidationError(f"Failed to get bookmarks: {str(e)}")

    @classmethod
    def setup_index(cls):
        """Create the user index if it doesn't exist"""
        if not es.indices.exists(index=cls.index_name):
            es.indices.create(
                index=cls.index_name,
                body={
                    'mappings': {
                        'properties': {
                            'email': {'type': 'keyword'},
                            'name': {'type': 'text'},
                            'role': {'type': 'keyword'},
                            'password_hash': {'type': 'keyword'},
                            'bookmarks': {'type': 'keyword'},
                            'created_at': {'type': 'date'}
                        }
                    }
                }
            ) 