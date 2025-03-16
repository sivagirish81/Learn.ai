from app import create_app
from app.utils.es_setup import create_index, index_sample_data
import os

app = create_app()

if __name__ == '__main__':
    # Initialize Elasticsearch index and sample data
    create_index()
    index_sample_data()
    
    # Run the Flask app
    app.run(host="0.0.0.0", port=os.getenv('PORT', 5000))