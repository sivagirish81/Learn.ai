from flask import Blueprint, request, jsonify, current_app
from elasticsearch_dsl import Search, Q

# Create blueprint without url_prefix (we'll add it in the route)
search_bp = Blueprint('search', __name__)

@search_bp.route('/api/search', methods=['GET', 'OPTIONS'])
def search():
    """Search for resources"""
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        query = request.args.get('query', '')
        category = request.args.get('category')
        tags = request.args.getlist('tags')
        page = int(request.args.get('page', 1))
        size = int(request.args.get('size', 10))

        # Create search query
        s = Search(using=current_app.elasticsearch, index='ai_resources')
        
        # Add query
        if query:
            s = s.query('multi_match', query=query, fields=['title^2', 'description'])
        
        # Add filters
        if category:
            s = s.filter('term', category=category)
        if tags:
            s = s.filter('terms', tags=tags)
        
        # Add pagination
        s = s[(page-1)*size:page*size]
        
        # Execute search
        response = s.execute()

        results = []
        for hit in response:
            result = hit.to_dict()
            result['id'] = hit.meta.id
            results.append(result)

        return jsonify({
            'total': response.hits.total.value,
            'page': page,
            'size': size,
            'results': results
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@search_bp.route('/api/categories', methods=['GET', 'OPTIONS'])
def get_categories():
    """Get all categories"""
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        s = Search(using=current_app.elasticsearch, index='ai_resources')
        s.aggs.bucket('categories', 'terms', field='category')
        response = s.execute()
        categories = [bucket.key for bucket in response.aggregations.categories.buckets]
        return jsonify(categories)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@search_bp.route('/api/tags', methods=['GET', 'OPTIONS'])
def get_tags():
    """Get all tags"""
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        s = Search(using=current_app.elasticsearch, index='ai_resources')
        s.aggs.bucket('tags', 'terms', field='tags')
        response = s.execute()
        tags = [bucket.key for bucket in response.aggregations.tags.buckets]
        return jsonify(tags)
    except Exception as e:
        return jsonify({'error': str(e)}), 500 