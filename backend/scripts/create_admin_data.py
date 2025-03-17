from datetime import datetime
from elasticsearch import Elasticsearch
from werkzeug.security import generate_password_hash
import os

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Elasticsearch configuration
ES_HOST = os.getenv('ELASTICSEARCH_HOST', 'https://kpc8psbuv0:tqi1g1t69r@learn-ai-4739164286.us-west-2.bonsaisearch.net:443')
INDEX_NAME = 'ai_users'

# Connect to Elasticsearch
es = Elasticsearch(
    [ES_HOST],
    use_ssl=True,
    verify_certs=True,
    ssl_show_warn=False,
    request_timeout=30,
    retry_on_timeout=True,
    max_retries=10,
    headers={"X-Elastic-Product": "Elasticsearch"}
)

# Define the admin user data
admin_user = {
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin",
    "bookmarks": [],
    "created_at": datetime.utcnow().isoformat(),
    "password_hash": generate_password_hash("adminpassword", method='pbkdf2:sha256')
}

# Check if the index exists, create if it doesn't
if not es.indices.exists(index=INDEX_NAME):
    es.indices.create(
        index=INDEX_NAME,
        body={
            'mappings': {
                'properties': {
                    'email': {'type': 'keyword'},
                    'name': {'type': 'text'},
                    'role': {'type': 'keyword'},
                    'password_hash': {'type': 'keyword'},
                    'bookmarks': {'type': 'keyword'},
                    'created_at': {'type': 'date'}
                }
            }
        }
    )
    print(f"Index '{INDEX_NAME}' created successfully.")
else:
    print(f"Index '{INDEX_NAME}' already exists.")

# Index the admin user data
try:
    result = es.index(index=INDEX_NAME, body=admin_user)
    es.indices.refresh(index=INDEX_NAME)
    print(f"Admin user created successfully with ID: {result['_id']}")
except Exception as e:
    print(f"Error creating admin user: {str(e)}")