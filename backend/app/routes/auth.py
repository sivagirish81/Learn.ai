from flask import Blueprint, request, jsonify, current_app
from functools import wraps
import jwt
from datetime import datetime, timedelta
from app.models.user import User, UserValidationError

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# JWT Configuration
JWT_SECRET = 'your-secret-key'  # In production, use environment variable
JWT_EXPIRATION = 24  # hours

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            current_user = User.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'Invalid token'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        except Exception as e:
            return jsonify({'error': 'Token validation failed', 'details': str(e)}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST', 'OPTIONS'])
def register():
    """Register a new user"""
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['email', 'password']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        # Create user
        user = User.create(data)
        
        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': user['id'],
                'email': user['email'],
                'name': user['name'],
                'role': user['role']
            }
        }), 201
    except UserValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    """Login user"""
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        print(f"Login attempt for email: {data.get('email')}")
        
        # Validate required fields
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        required_fields = ['email', 'password']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        # Get user and verify password
        user_data = User.get_by_email(data['email'])
        print(f"User found: {user_data is not None}")
        
        if not user_data:
            return jsonify({'error': 'Invalid email or password'}), 401

        # Create User instance from data
        user = User.from_dict(user_data)
        if not user:
            return jsonify({'error': 'Invalid user data'}), 500
        
        print(f"Verifying password for user: {user.email}")
        
        if not user.verify_password(data['password']):
            print("Password verification failed")
            return jsonify({'error': 'Invalid email or password'}), 401

        print("Password verified successfully")

        # Generate token
        token = jwt.encode({
            'user_id': user_data['id'],
            'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION)
        }, JWT_SECRET)
        
        return jsonify({
            'token': token,
            'user': {'id': user_data['id'], **user.to_response_dict()}
        })
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@auth_bp.route('/profile', methods=['GET', 'OPTIONS'])
@token_required
def get_profile(current_user):
    """Get user profile"""
    if request.method == 'OPTIONS':
        return '', 200
    
    user = User.from_dict(current_user)
    if not user:
        return jsonify({'error': 'Invalid user data'}), 500
        
    return jsonify({'id': current_user['id'], **user.to_response_dict()})

@auth_bp.route('/profile', methods=['PUT', 'OPTIONS'])
@token_required
def update_profile(current_user):
    """Update user profile"""
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Don't allow password updates through this endpoint
        data.pop('password', None)
        data.pop('password_hash', None)

        if User.update(current_user['id'], data):
            updated_data = User.get(current_user['id'])
            updated_user = User.from_dict(updated_data)
            if not updated_user:
                return jsonify({'error': 'Failed to retrieve updated user'}), 500
                
            return jsonify({
                'message': 'Profile updated successfully',
                'user': {'id': updated_data['id'], **updated_user.to_response_dict()}
            })
        return jsonify({'error': 'User not found'}), 404
    except UserValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500 