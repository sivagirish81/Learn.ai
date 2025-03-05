from flask import Blueprint, request, jsonify
from functools import wraps
from app.models.resource import Resource, ResourceValidationError
from app.models.user import User
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    """Decorator to check if user is admin"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401

        token = auth_header.split(' ')[1]
        try:
            # Get user from token
            user = User.get_from_token(token)
            print("Hissddsd : " + user)
            if not user or user.get('role') != 'admin':
                return jsonify({'error': 'Admin privileges required'}), 403
            return f(user, *args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Invalid token', 'details': str(e)}), 401
    return decorated

@admin_bp.route('/api/admin/pending-resources', methods=['GET', 'OPTIONS'])
#@admin_required
def get_pending_resources():
    """Get all pending resources"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        page = int(request.args.get('page', 1))
        size = int(request.args.get('size', 10))

        results = Resource.search(
            status='pending',
            page=page,
            size=size
        )

        return jsonify(results)
    except Exception as e:
        return jsonify({'error': 'Failed to fetch pending resources', 'details': str(e)}), 500

@admin_bp.route('/api/admin/users', methods=['GET', 'OPTIONS'])
#@admin_required
def get_users():
    """Get all users with pagination and sorting"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        size = int(request.args.get('size', 10))
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        role_filter = request.args.get('role')

        # Build search query
        query = {
            'bool': {
                'must': []
            }
        }

        # Add role filter if specified
        if role_filter:
            query['bool']['must'].append({
                'term': {
                    'role.keyword': role_filter
                }
            })

        # Build search body
        body = {
            'query': query,
            'from': (page - 1) * size,
            'size': size,
            'sort': [{
                sort_by: {
                    'order': sort_order
                }
            }]
        }

        # Execute search
        print("Hisssdads")
        result = User.get_all_user_ids()
        print(result)

        # Format response
        users = list()
        for hit in result['hits']['hits']:
            user_data = hit['_source']
            # Remove sensitive data
            user_data['password_hash'] = None
            users.append({
                'name': user_data['name'], 'email': user_data['email'], 'role': user_data['role']
            })

        return jsonify({
            'users': users,
            'total': result['hits']['total']['value'],
            'page': page,
            'size': size,
            'total_pages': (result['hits']['total']['value'] + size - 1) // size
        })

    except Exception as e:
        return jsonify({
            'error': 'Failed to fetch users',
            'details': str(e)
        }), 500
    
@admin_bp.route('/api/admin/resources/<resource_id>/approve', methods=['POST', 'OPTIONS'])
#@admin_required
def approve_resource(resource_id):
    """Approve a pending resource"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        # Get the resource
        resource = Resource.get(resource_id)
        if not resource:
            return jsonify({'error': 'Resource not found'}), 404

        if resource['status'] != 'pending':
            return jsonify({'error': 'Resource is not pending approval'}), 400

        # Get admin notes from request
        data = request.get_json()
        admin_notes = data.get('admin_notes', '')

        # Update resource
        update_data = {
            'status': 'approved',
            'admin_notes': admin_notes,
            'approved_by': "admin",
            'approved_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        if Resource.update(resource_id, update_data):
            return jsonify({
                'message': 'Resource approved successfully',
                'resource_id': resource_id
            })
        return jsonify({'error': 'Failed to approve resource'}), 500

    except Exception as e:
        return jsonify({'error': 'Failed to approve resource', 'details': str(e)}), 500

@admin_bp.route('/api/admin/resources/<resource_id>/reject', methods=['POST', 'OPTIONS'])
#@admin_required
def reject_resource(current_user, resource_id):
    """Reject a pending resource"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        # Get the resource
        resource = Resource.get(resource_id)
        if not resource:
            return jsonify({'error': 'Resource not found'}), 404

        if resource['status'] != 'pending':
            return jsonify({'error': 'Resource is not pending approval'}), 400

        # Get admin notes from request
        data = request.get_json()
        admin_notes = data.get('admin_notes')

        if not admin_notes:
            return jsonify({'error': 'Admin notes are required for rejection'}), 400

        # Update resource
        update_data = {
            'status': 'rejected',
            'admin_notes': admin_notes,
            'rejected_by': current_user['id'],
            'rejected_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        if Resource.update(resource_id, update_data):
            return jsonify({
                'message': 'Resource rejected successfully',
                'resource_id': resource_id
            })
        return jsonify({'error': 'Failed to reject resource'}), 500

    except Exception as e:
        return jsonify({'error': 'Failed to reject resource', 'details': str(e)}), 500

@admin_bp.route('/api/admin/resources/stats', methods=['GET', 'OPTIONS'])
#@admin_required
def get_resource_stats(current_user):
    """Get statistics about resources"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        body = {
            'size': 0,
            'aggs': {
                'status_counts': {
                    'terms': {
                        'field': 'status.keyword'
                    }
                },
                'category_counts': {
                    'terms': {
                        'field': 'category.keyword'
                    }
                },
                'type_counts': {
                    'terms': {
                        'field': 'resource_type.keyword'
                    }
                },
                'recent_submissions': {
                    'date_histogram': {
                        'field': 'created_at',
                        'calendar_interval': 'day',
                        'min_doc_count': 0,
                        'format': 'yyyy-MM-dd'
                    }
                }
            }
        }

        result = Resource.es.search(index=Resource.index_name, body=body)
        
        return jsonify({
            'status_counts': {
                bucket['key']: bucket['doc_count']
                for bucket in result['aggregations']['status_counts']['buckets']
            },
            'category_counts': {
                bucket['key']: bucket['doc_count']
                for bucket in result['aggregations']['category_counts']['buckets']
            },
            'type_counts': {
                bucket['key']: bucket['doc_count']
                for bucket in result['aggregations']['type_counts']['buckets']
            },
            'recent_submissions': [
                {
                    'date': bucket['key_as_string'],
                    'count': bucket['doc_count']
                }
                for bucket in result['aggregations']['recent_submissions']['buckets']
            ]
        })
    except Exception as e:
        return jsonify({'error': 'Failed to get resource statistics', 'details': str(e)}), 500 