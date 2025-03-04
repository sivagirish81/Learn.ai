from flask import Blueprint, request, jsonify
from app.models.resource import Resource, ResourceValidationError
from app.models.user import User
from datetime import datetime

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
    """Get all available categories"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        # Get categories from Elasticsearch aggregations
        result = Resource.es.search(
            index=Resource.index_name,
            body={
                'size': 0,
                'aggs': {
                    'categories': {
                        'terms': {
                            'field': 'category.keyword',
                            'size': 50
                        }
                    }
                }
            }
        )

        # Extract categories from aggregation buckets
        categories = [
            bucket['key']
            for bucket in result['aggregations']['categories']['buckets']
        ]

        # Add any predefined categories that might not be in the index yet
        if hasattr(Resource, 'VALID_CATEGORIES'):
            predefined_categories = set(Resource.VALID_CATEGORIES)
            categories = list(set(categories) | predefined_categories)
            categories.sort()

        return jsonify({'categories': categories})

    except Exception as e:
        return jsonify({
            'error': 'Failed to fetch categories',
            'details': str(e)
        }), 500

@resources_bp.route('/api/test', methods=['GET', 'OPTIONS'])
def test():
    """Test route"""
    if request.method == 'OPTIONS':
        return '', 200
        
    return jsonify({"message": "Test route is working!"})

@resources_bp.route('/api/resources', methods=['GET', 'OPTIONS'])
def get_resources():
    """Get resources with pagination, filtering and sorting"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        # Get query parameters with defaults
        page = int(request.args.get('page', 1))
        size = int(request.args.get('size', 9))
        category = request.args.get('category')
        resource_type = request.args.get('resource_type')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        query = request.args.get('query')

        # Build search query
        search_query = {
            'bool': {
                'must': [
                    {'term': {'status': 'approved'}}  # Only return approved resources
                ]
            }
        }

        # Add category filter if specified
        if category and category != 'all':
            search_query['bool']['must'].append({
                'term': {
                    'category.keyword': category
                }
            })

        # Add resource type filter if specified
        if resource_type and resource_type != 'all':
            search_query['bool']['must'].append({
                'term': {
                    'resource_type.keyword': resource_type
                }
            })

        # Add text search if query is provided
        if query:
            search_query['bool']['must'].append({
                'multi_match': {
                    'query': query,
                    'fields': ['title^3', 'description^2', 'tags', 'author'],
                    'type': 'best_fields',
                    'fuzziness': 'AUTO'
                }
            })

        # Build sort configuration
        sort_config = [{
            sort_by: {
                'order': sort_order
            }
        }]

        # If sorting by relevance (for text search), add _score sorting
        if query and sort_by == '_score':
            sort_config = [{'_score': {'order': 'desc'}}] + sort_config

        # Execute search
        result = Resource.es.search(
            index=Resource.index_name,
            body={
                'query': search_query,
                'sort': sort_config,
                'from': (page - 1) * size,
                'size': size,
                'track_total_hits': True
            }
        )

        # Format response
        resources = []
        for hit in result['hits']['hits']:
            resource_data = hit['_source']
            resources.append({
                'id': hit['_id'],
                **resource_data
            })

        total_hits = result['hits']['total']['value']
        total_pages = (total_hits + size - 1) // size

        return jsonify({
            'resources': resources,
            'total': total_hits,
            'page': page,
            'size': size,
            'total_pages': total_pages
        })

    except Exception as e:
        return jsonify({
            'error': 'Failed to fetch resources',
            'details': str(e)
        }), 500

@resources_bp.route('/api/resources', methods=['POST'])
def create_resource():
    """Create a new resource"""
    try:
        data = request.get_json()
        
        # Set initial status as pending
        data['status'] = 'pending'
        data['created_at'] = datetime.utcnow().isoformat()
        data['updated_at'] = datetime.utcnow().isoformat()

        # Get current user from token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401

        token = auth_header.split(' ')[1]
        current_user = User.get_from_token(token)
        if not current_user:
            return jsonify({'error': 'Invalid token'}), 401

        # Add user information to resource
        data['submitted_by'] = current_user['id']
        data['submitter_name'] = current_user.get('name', 'Anonymous')

        # Create resource
        result = Resource.create(data)
        return jsonify({
            'message': 'Resource submitted successfully',
            'resource': result
        }), 201

    except Exception as e:
        return jsonify({
            'error': 'Failed to create resource',
            'details': str(e)
        }), 500

@resources_bp.route('/api/resources/types', methods=['GET', 'OPTIONS'])
def get_resource_types():
    """Get all available resource types"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        result = Resource.es.search(
            index=Resource.index_name,
            body={
                'size': 0,
                'aggs': {
                    'types': {
                        'terms': {
                            'field': 'resource_type.keyword',
                            'size': 50
                        }
                    }
                }
            }
        )

        types = [
            bucket['key']
            for bucket in result['aggregations']['types']['buckets']
        ]

        return jsonify({'resource_types': types})

    except Exception as e:
        return jsonify({
            'error': 'Failed to fetch resource types',
            'details': str(e)
        }), 500