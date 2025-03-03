from flask import Blueprint, request, jsonify
from app.routes.auth import token_required
from app.models.user import User, UserValidationError

bookmarks_bp = Blueprint('bookmarks', __name__)

@bookmarks_bp.route('/api/bookmarks', methods=['GET'])
@token_required
def get_bookmarks(current_user):
    """Get user's bookmarked resources"""
    try:
        user = User.get(current_user['id'])
        bookmarks = user.get_bookmarks()
        return jsonify(bookmarks)
    except UserValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@bookmarks_bp.route('/api/bookmarks/<string:resource_id>', methods=['POST'])
@token_required
def add_bookmark(current_user, resource_id):
    """Add a bookmark"""
    try:
        user = User.get(current_user['id'])
        if user.add_bookmark(resource_id):
            User.update(current_user['id'], {'bookmarks': user.bookmarks})
            return jsonify({'message': 'Bookmark added successfully'})
        return jsonify({'message': 'Resource already bookmarked'})
    except UserValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@bookmarks_bp.route('/api/bookmarks/<string:resource_id>', methods=['DELETE'])
@token_required
def remove_bookmark(current_user, resource_id):
    """Remove a bookmark"""
    try:
        user = User.get(current_user['id'])
        if user.remove_bookmark(resource_id):
            User.update(current_user['id'], {'bookmarks': user.bookmarks})
            return jsonify({'message': 'Bookmark removed successfully'})
        return jsonify({'message': 'Resource not bookmarked'})
    except UserValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500 