from flask import Blueprint, request, jsonify, current_app
from app.utils.chatbot import Chatbot
from app.routes.auth import token_required

chatbot_bp = Blueprint('chatbot', __name__)
chatbot = Chatbot()

@chatbot_bp.route('/api/chat', methods=['POST'])
@token_required
def chat(current_user):
    """Process chat message"""
    try:
        data = request.get_json()
        if not data or not data.get('message'):
            return jsonify({'error': 'No message provided'}), 400

        response = chatbot.process_message(data['message'])
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@chatbot_bp.route('/api/chat/clear', methods=['POST'])
@token_required
def clear_chat(current_user):
    """Clear chat history"""
    try:
        chatbot.clear_conversation()
        return jsonify({'message': 'Chat history cleared successfully'})
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500 