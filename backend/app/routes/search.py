from flask import Blueprint, request, jsonify
from app.models.resource import Resource, ResourceValidationError

# Create blueprint without url_prefix (we'll add it in the route)
search_bp = Blueprint('search', __name__)

@search_bp.route('/api/search', methods=['GET', 'OPTIONS'])
def search():
    """Search resources with filters"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        # Get search parameters
        query = request.args.get('query', '')
        category = request.args.get('category')
        resource_type = request.args.get('type')
        tags = request.args.get('tags', '').split(',') if request.args.get('tags') else None
        page = int(request.args.get('page', 1))
        size = int(request.args.get('size', 10))

        # Perform search
        results = Resource.search(
            query=query,
            category=category,
            resource_type=resource_type,
            tags=tags,
            page=page,
            size=size
        )

        return jsonify(results)
    except ResourceValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@search_bp.route('/api/categories', methods=['GET', 'OPTIONS'])
def get_categories():
    """Get all available categories"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        # Aggregate categories from existing resources
        body = {
            'size': 0,
            'aggs': {
                'categories': {
                    'terms': {
                        'field': 'category.keyword',
                        'size': 100
                    }
                }
            }
        }

        result = Resource.es.search(index=Resource.index_name, body=body)
        categories = [bucket['key'] for bucket in result['aggregations']['categories']['buckets']]
        
        return jsonify({'categories': categories})
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@search_bp.route('/api/resource-types', methods=['GET', 'OPTIONS'])
def get_resource_types():
    """Get all available resource types"""
    if request.method == 'OPTIONS':
        return '', 200

    return jsonify({'resource_types': Resource.RESOURCE_TYPES})

@search_bp.route('/api/tags', methods=['GET', 'OPTIONS'])
def get_tags():
    """Get all available tags"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        # Aggregate tags from existing resources
        body = {
            'size': 0,
            'aggs': {
                'tags': {
                    'terms': {
                        'field': 'tags.keyword',
                        'size': 100
                    }
                }
            }
        }

        result = Resource.es.search(index=Resource.index_name, body=body)
        tags = [bucket['key'] for bucket in result['aggregations']['tags']['buckets']]
        
        return jsonify({'tags': tags})
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@search_bp.route('/api/trending', methods=['GET', 'OPTIONS'])
def get_trending():
    """Get trending resources based on various factors"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        # Search for trending resources (high github stars, recent publication, etc.)
        body = {
            'query': {
                'bool': {
                    'must': [
                        {'term': {'status.keyword': 'approved'}}
                    ]
                }
            },
            'sort': [
                {'github_stars': {'order': 'desc', 'missing': '_last'}},
                {'publication_date': {'order': 'desc', 'missing': '_last'}},
                {'_score': {'order': 'desc'}}
            ],
            'size': 10
        }

        result = Resource.es.search(index=Resource.index_name, body=body)
        resources = [{'id': hit['_id'], **hit['_source']} for hit in result['hits']['hits']]
        
        return jsonify({'resources': resources})
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500 