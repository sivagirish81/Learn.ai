from flask import Blueprint, request, jsonify
from app.models.resource import Resource, ResourceValidationError

# Create blueprint without url_prefix (we'll add it in the route)
resources_bp = Blueprint('resources', __name__)

@resources_bp.route('/api/resources', methods=['GET', 'POST', 'OPTIONS'])
def resources():
    """Handle resources endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
        
    if request.method == 'POST':
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            resource = Resource.create(data)
            return jsonify(resource), 201
        except ResourceValidationError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@resources_bp.route('/api/resources/<string:resource_id>', methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
def resource_by_id(resource_id):
    """Handle single resource operations"""
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        if request.method == 'GET':
            resource = Resource.get(resource_id)
            if resource:
                return jsonify(resource)
            return jsonify({'error': 'Resource not found'}), 404
            
        elif request.method == 'PUT':
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            if Resource.update(resource_id, data):
                return jsonify({'message': 'Resource updated successfully'})
            return jsonify({'error': 'Resource not found'}), 404
            
        elif request.method == 'DELETE':
            if Resource.delete(resource_id):
                return jsonify({'message': 'Resource deleted successfully'})
            return jsonify({'error': 'Resource not found'}), 404
            
    except ResourceValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@resources_bp.route('/api/resources/bulk', methods=['POST', 'OPTIONS'])
def bulk_create_resources():
    """Bulk create resources"""
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if not isinstance(data, list):
            return jsonify({'error': 'Expected a list of resources'}), 400

        result = Resource.bulk_create(data)
        return jsonify({
            'message': 'Resources created successfully',
            'success': result['success'],
            'failed': result['failed']
        }), 201
    except ResourceValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@resources_bp.route('/api/resources/categories', methods=['GET', 'OPTIONS'])
def get_categories():
    """Get all valid categories"""
    if request.method == 'OPTIONS':
        return '', 200
        
    return jsonify(list(Resource.VALID_CATEGORIES))

@resources_bp.route('/api/test', methods=['GET', 'OPTIONS'])
def test():
    """Test route"""
    if request.method == 'OPTIONS':
        return '', 200
        
    return jsonify({"message": "Test route is working!"})