from flask import Blueprint, request, jsonify
from app.models.resource import Resource, ResourceValidationError

# Create blueprint without url_prefix (we'll add it in the route)
resources_bp = Blueprint('resources', __name__)

@resources_bp.route('/api/resources', methods=['GET', 'POST', 'OPTIONS'])
def resources():
    """Handle resources endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    print("GGGDDSAD")
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
    elif request.method == 'GET':
        try:
            print("Hwwdadads ")
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
                resource_data['id'] = hit['_id']
                resources.append(resource_data)

            total_hits = result['hits']['total']['value']
            total_pages = (total_hits + size - 1) // size

            return jsonify({
                'resources': resources,
                'total': total_hits,
                'page': page,
                'size': size,
                'total_pages': total_pages
            })

        except ValueError as e:
            return jsonify({
                'error': 'Invalid parameters',
                'details': str(e)
            }), 400
        except Exception as e:
            return jsonify({
                'error': 'Failed to fetch resources',
                'details': str(e)
            }), 500

@resources_bp.route('/api/resources/<string:resource_id>', methods=['PUT', 'DELETE', 'OPTIONS'])
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

# @resources_bp.route('/api/resources/categories', methods=['GET', 'OPTIONS'])
# def get_categories():
#     """Get all valid categories"""
#     if request.method == 'OPTIONS':
#         return '', 200
        
#     return jsonify(list(Resource.VALID_CATEGORIES))

@resources_bp.route('/api/allresources', methods=['GET', 'OPTIONS'])
def get_all_resources():
    """Retrieve all resources from the database"""

    try:
        page = int(request.args.get('page', 1))
        size = int(request.args.get('size', 9))

        search_query = {
            'bool': {
                'must': [
                    {'term': {'status': 'approved'}}  # Only return approved resources
                ]
            }
        }

        result = Resource.get_all_resources()

        resources = []
        for hit in result['hits']['hits']:
            resource_data = hit['_source']
            resource_data['id'] = hit['_id']
            resources.append(resource_data)

        total_hits = result['hits']['total']['value']
        total_pages = (total_hits + size - 1) // size

        return jsonify({
            'resources': resources,
            'total': total_hits,
            'page': page,
            'size': size,
            'total_pages': total_pages
        }), 200

    except ValueError as e:
        return jsonify({
            'error': 'Invalid parameters',
            'details': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'error': 'Failed to fetch resources',
            'details': str(e)
        }), 500

@resources_bp.route('/api/test', methods=['GET', 'OPTIONS'])
def test():
    """Test route"""
    if request.method == 'OPTIONS':
        return '', 200
        
    return jsonify({"message": "Test route is working!"})