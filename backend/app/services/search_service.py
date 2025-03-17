from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search, Q
import os

class SearchService:
    def __init__(self):
        self.es = Elasticsearch([os.getenv('ELASTICSEARCH_URL')],
            http_auth=(os.getenv('ELASTIC_USERNAME'), os.getenv('ELASTIC_PASSWORD')),
            verify_certs=True,
            use_ssl=True,
            ssl_show_warn=False,
            request_timeout=30,
            retry_on_timeout=True,
            max_retries=10,
            headers={"X-Elastic-Product": "Elasticsearch"} 
    )
    
    def search(self, query, category=None, tags=None, page=1, size=10):
        # Create search query
        s = Search(using=self.es, index='ai_resources')
        
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
        
        return {
            'total': response.hits.total.value,
            'page': page,
            'size': size,
            'results': [hit.to_dict() for hit in response]
        }
    
    def get_categories(self):
        s = Search(using=self.es, index='ai_resources')
        s.aggs.bucket('categories', 'terms', field='category')
        response = s.execute()
        return [bucket.key for bucket in response.aggregations.categories.buckets]
    
    def get_tags(self):
        s = Search(using=self.es, index='ai_resources')
        s.aggs.bucket('tags', 'terms', field='tags')
        response = s.execute()
        return [bucket.key for bucket in response.aggregations.tags.buckets] 