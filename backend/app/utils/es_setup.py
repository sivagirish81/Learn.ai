from datetime import datetime
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk
from elasticsearch.exceptions import ConnectionError
import time
import sys

def get_elasticsearch_client():
    """Get Elasticsearch client with connection retry"""
    es = Elasticsearch(['http://localhost:9200'])
    retry_count = 0
    max_retries = 3
    
    while retry_count < max_retries:
        try:
            if es.ping():
                print("Successfully connected to Elasticsearch")
                return es
        except ConnectionError:
            retry_count += 1
            if retry_count == max_retries:
                print("Error: Could not connect to Elasticsearch. Please make sure Elasticsearch is running on http://localhost:9200")
                print("\nTo install and run Elasticsearch:")
                print("1. Download Elasticsearch from https://www.elastic.co/downloads/elasticsearch")
                print("2. Extract the downloaded file")
                print("3. Run: ./bin/elasticsearch (Unix) or .\\bin\\elasticsearch.bat (Windows)")
                sys.exit(1)
            print(f"Attempting to connect to Elasticsearch (attempt {retry_count}/{max_retries})")
            time.sleep(3)
    return None

# Initialize Elasticsearch client
es = get_elasticsearch_client()

# Define index mapping
index_mapping = {
    "mappings": {
        "properties": {
            "title": { "type": "text" },
            "url": { "type": "keyword" },
            "description": { "type": "text" },
            "tags": { "type": "keyword" },
            "category": { "type": "keyword" },
            "source": { "type": "keyword" },
            "created_at": { "type": "date" }
        }
    }
}

# Sample data for testing
sample_data = [
    {
        "title": "Deep Learning with PyTorch",
        "url": "https://pytorch.org/tutorials/",
        "description": "Comprehensive guide to deep learning using PyTorch framework",
        "tags": ["deep-learning", "pytorch", "neural-networks"],
        "category": "tutorial",
        "source": "pytorch",
        "created_at": datetime.utcnow().isoformat()
    },
    {
        "title": "Machine Learning Course by Stanford",
        "url": "https://www.coursera.org/learn/machine-learning",
        "description": "Andrew Ng's famous Machine Learning course on Coursera",
        "tags": ["machine-learning", "basics", "algorithms"],
        "category": "course",
        "source": "coursera",
        "created_at": datetime.utcnow().isoformat()
    },
    {
        "title": "TensorFlow Documentation",
        "url": "https://www.tensorflow.org/guide",
        "description": "Official TensorFlow documentation and guides",
        "tags": ["tensorflow", "deep-learning", "documentation"],
        "category": "documentation",
        "source": "tensorflow",
        "created_at": datetime.utcnow().isoformat()
    }
]

def create_index():
    """Create the Elasticsearch index if it doesn't exist"""
    try:
        if not es.indices.exists(index='ai_resources'):
            es.indices.create(index='ai_resources', body=index_mapping)
            print("Index 'ai_resources' created successfully")
        else:
            print("Index 'ai_resources' already exists")
    except Exception as e:
        print(f"Error creating index: {str(e)}")
        sys.exit(1)

def index_sample_data():
    """Index sample data into Elasticsearch"""
    try:
        actions = [
            {
                '_index': 'ai_resources',
                '_source': doc
            }
            for doc in sample_data
        ]
        success, failed = bulk(es, actions, stats_only=True)
        print(f"Indexed {success} documents successfully")
        if failed:
            print(f"Failed to index {failed} documents")
    except Exception as e:
        print(f"Error indexing sample data: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    create_index()
    index_sample_data() 