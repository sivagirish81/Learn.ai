from flask import Flask, jsonify, request
from flask_cors import CORS
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import ConnectionError
import os
import sys

def create_app():
    app = Flask(__name__)
    
    # Configure CORS for all routes
    CORS(app, 
         resources={
             r"/*": {
                 "origins": "*",
                 "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                 "allow_headers": ["Content-Type", "Authorization", "Accept"],
                 "expose_headers": ["Content-Type", "Authorization"]
             }
         })
    
    # Debug logging for requests
    @app.before_request
    def log_request_info():
        print('Headers:', dict(request.headers))
        print('Method:', request.method)
        print('URL:', request.url)
        if request.is_json:
            print('Body:', request.get_json())
    
    # Add CORS headers to all responses
    @app.after_request
    def add_cors_headers(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        # Log response headers for debugging
        print('Response Headers:', dict(response.headers))
        return response

    # Add OPTIONS handler for all routes
    @app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
    @app.route('/<path:path>', methods=['OPTIONS'])
    def handle_options(path):
        return '', 200

    # Register blueprints
    from app.routes.search import search_bp
    from app.routes.resources import resources_bp
    from app.routes.auth import auth_bp
    from app.routes.bookmarks import bookmarks_bp
    from app.routes.chatbot import chatbot_bp
    from app.routes.admin import admin_bp
    
    app.register_blueprint(search_bp)
    app.register_blueprint(resources_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(bookmarks_bp)
    app.register_blueprint(chatbot_bp)
    app.register_blueprint(admin_bp)
    
    # Initialize Elasticsearch client
    es_host = os.getenv('ELASTICSEARCH_HOST', 'http://127.0.0.1:9200')
    es = Elasticsearch([es_host])
    
    # Check Elasticsearch connection
    try:
        if not es.ping():
            print("Error: Could not connect to Elasticsearch")
            print("Please make sure Elasticsearch is running on", es_host)
            sys.exit(1)
        app.elasticsearch = es
    except ConnectionError:
        print("Error: Could not connect to Elasticsearch")
        print("Please make sure Elasticsearch is running on", es_host)
        print("\nTo install and run Elasticsearch:")
        print("1. Download Elasticsearch from https://www.elastic.co/downloads/elasticsearch")
        print("2. Extract the downloaded file")
        print("3. Run: ./bin/elasticsearch (Unix) or .\\bin\\elasticsearch.bat (Windows)")
        sys.exit(1)
    
    # Set up Elasticsearch indices
    from app.models.resource import Resource
    from app.models.user import User
    Resource.setup_index()
    User.setup_index()
    
    @app.route('/health')
    def health_check():
        es_health = {'status': 'unhealthy'}
        try:
            if app.elasticsearch.ping():
                es_health = {'status': 'healthy'}
        except:
            pass
        
        return {
            'status': 'healthy',
            'elasticsearch': es_health
        }
    
    return app 