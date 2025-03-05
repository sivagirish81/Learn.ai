from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import NotFoundError
import jwt

# Add JWT configuration
JWT_SECRET = 'your-secret-key'  # In production, use environment variable

es = Elasticsearch(['http://localhost:9200'])

class UserValidationError(Exception):
    pass

class User:
    index_name = 'ai_users'
    
    def __init__(self, email, password=None, name=None, role='user', bookmarks=None, created_at=None, password_hash=None):
        self.email = email
        self.name = name or email.split('@')[0]
        self.role = role
        self.bookmarks = bookmarks or []
        self.created_at = created_at or datetime.utcnow().isoformat()
        if password:
            self.set_password(password)
        elif password_hash:
            self.password_hash = password_hash

    @classmethod
    def from_dict(cls, data):
        """Create a User instance from a dictionary"""
        if not data:
            return None
        return cls(
            email=data['email'],
            name=data.get('name'),
            role=data.get('role', 'user'),
            bookmarks=data.get('bookmarks', []),
            created_at=data.get('created_at'),
            password_hash=data.get('password_hash')
        )

    def set_password(self, password):
        """Set the password hash using werkzeug's generate_password_hash"""
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def verify_password(self, password):
        """Verify the password using werkzeug's check_password_hash"""
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

    def to_response_dict(self):
        """Convert to dictionary for API response (excluding sensitive data)"""
        data = self.to_dict()
        data.pop('password_hash', None)
        return data

    @classmethod
    def create(cls, user_data):
        """Create a new user"""
        try:
            # Check if user already exists
            existing = cls.get_by_email(user_data['email'])
            if existing:
                raise UserValidationError('Email already registered')

            # Create user instance
            user = cls(
                email=user_data['email'],
                password=user_data['password'],
                name=user_data.get('name'),
                role=user_data.get('role', 'user')
            )

            # Save to Elasticsearch
            result = es.index(index=cls.index_name, body=user.to_dict())
            es.indices.refresh(index=cls.index_name)
            
            return {'id': result['_id'], **user.to_response_dict()}
        except UserValidationError as e:
            raise e
        except Exception as e:
            raise UserValidationError(f"Failed to create user: {str(e)}")

    @classmethod
    def get(cls, user_id):
        """Get a user by ID"""
        try:
            result = es.get(index=cls.index_name, id=user_id)
            user = cls.from_dict(result['_source'])
            if user:
                return {'id': result['_id'], **user.to_dict()}
            return None
        except NotFoundError:
            return None
        except Exception as e:
            raise UserValidationError(f"Failed to get user: {str(e)}")
        
    @classmethod
    def get_all_user_ids(cls):
        """Get all user IDs from the Elasticsearch index"""
        try:
            es = Elasticsearch()  # Ensure ES is properly initialized
            result = es.search(
                index=cls.index_name,
                body={
                    "query": {"match_all": {}},  # Get all users
                    "_source": True,  # We only need IDs
                    "size": 10000  # Adjust based on the expected number of users
                }
            )
            return result
        except Exception as e:
            raise UserValidationError(f"Failed to fetch user IDs: {str(e)}")

    @classmethod
    def get_by_email(cls, email):
        """Get a user by email"""
        try:
            result = es.search(
                index=cls.index_name,
                body={
                    'query': {
                        'term': {
                            'email': email.lower()
                        }
                    }
                }
            )
            
            hits = result['hits']['hits']
            if hits:
                user = cls.from_dict(hits[0]['_source'])
                if user:
                    return {'id': hits[0]['_id'], **user.to_dict()}
            return None
        except Exception as e:
            print(f"Error in get_by_email: {str(e)}")
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
            print(self)
            print("hu")
            if not self['bookmarks']:
                return []
                
            results = es.mget(
                index='ai_resources',
                body={'ids': self['bookmarks']}
            )
            
            bookmarks = []
            for doc in results['docs']:
                if doc['found']:
                    self['bookmarks'].append({'id': doc['_id'], **doc['_source']})
            
            return self['bookmarks']
        except Exception as e:
            raise UserValidationError(f"Failed to get bookmarks: {str(e)}")
        
    def get_bookmarks_by_id(self, ids):
        """Get all bookmarked resources"""
        try:
            print("hu")
            if not ids:
                return []
                
            results = es.mget(
                index='ai_resources',
                body={'ids': ids}
            )
        
            print(results)
            self['bookmarks'] = []
            for doc in results['docs']:
                if doc['found']:
                    doc['_source']['id'] = doc['_id']
                    self['bookmarks'].append({ **doc['_source']})
            
            return self['bookmarks']
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

    @classmethod
    def get_from_token(cls, token):
        """Get user from JWT token"""
        try:
            # Decode token
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            
            # Get user by ID
            user = cls.get(data['user_id'])
            if not user:
                raise UserValidationError('User not found')
                
            return user
        except jwt.ExpiredSignatureError:
            raise UserValidationError('Token has expired')
        except jwt.InvalidTokenError:
            raise UserValidationError('Invalid token')
        except Exception as e:
            raise UserValidationError(f'Token validation failed: {str(e)}') 