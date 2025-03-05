import requests
from bs4 import BeautifulSoup
from datetime import datetime
from elasticsearch import Elasticsearch, exceptions

# Elasticsearch configuration
ES_HOST = 'http://127.0.0.1:9200'
INDEX_NAME = 'ai_resources'

# URL for scraping
MEDIUM_URL = "https://medium.com/tag/artificial-intelligence"
TOWARDS_DATA_SCIENCE_URL = "https://towardsdatascience.com/tagged/artificial-intelligence"

def scrape_medium_articles():
    """Scrape AI-related articles from Medium"""
    articles = []
    response = requests.get(MEDIUM_URL)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find article titles and links
    article_list = soup.find_all('div', {'class': 'postArticle-content'})[:5]
    for article in article_list:
        title_tag = article.find('h3')
        if title_tag:
            title = title_tag.text.strip()
            link = article.find('a')['href'].split('?')[0]  # Clean up link

            articles.append({
                "title": title,
                "url": link,
                "description": "AI-related article from Medium.",
                "category": "Tutorial",
                "resource_type": "Tutorial",
                "tags": ["AI", "Machine Learning", "Deep Learning", "Medium"],
                "author": "Medium Community",
                "publication_date": datetime.now().isoformat(),
                "difficulty_level": "Intermediate",
                "prerequisites": ["Python", "Machine Learning"],
                "submitted_by": "scraper@learn.ai",
                "status": "approved",
                "created_at": datetime.now().isoformat()
            })
    
    return articles

def scrape_towardsdatascience_articles():
    """Scrape AI-related articles from Towards Data Science"""
    articles = []
    response = requests.get(TOWARDS_DATA_SCIENCE_URL)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find article titles and links
    article_list = soup.find_all('div', {'class': 'postArticle-content'})[:5]
    for article in article_list:
        title_tag = article.find('h3')
        if title_tag:
            title = title_tag.text.strip()
            link = article.find('a')['href'].split('?')[0]  # Clean up link

            articles.append({
                "title": title,
                "url": link,
                "description": "AI-related article from Towards Data Science.",
                "category": "Tutorial",
                "resource_type": "Tutorial",
                "tags": ["AI", "Data Science", "Machine Learning", "Towards Data Science"],
                "author": "Towards Data Science Community",
                "publication_date": datetime.now().isoformat(),
                "difficulty_level": "Intermediate",
                "prerequisites": ["Python", "Data Science"],
                "submitted_by": "scraper@learn.ai",
                "status": "approved",
                "created_at": datetime.now().isoformat()
            })
    
    return articles

def push_data_to_elasticsearch(articles):
    """Push scraped articles to Elasticsearch"""
    es = Elasticsearch(ES_HOST)
    
    # Check if Elasticsearch is connected
    try:
        if es.ping():
            print("Elasticsearch is connected.")
        else:
            print("Could not connect to Elasticsearch.")
            return
    except exceptions.ConnectionError as e:
        print(f"Error connecting to Elasticsearch: {e}")
        return

    # Create index if not exists
    if not es.indices.exists(index=INDEX_NAME):
        es.indices.create(index=INDEX_NAME)
        print(f"Index '{INDEX_NAME}' created.")

    # Index articles into Elasticsearch
    for article in articles:
        try:
            es.index(index=INDEX_NAME, body=article)
            print(f"✅ Pushed '{article['title']}' to Elasticsearch.")
        except Exception as e:
            print(f"❌ Error pushing '{article['title']}': {str(e)}")

def scrape_and_push():
    """Scrape data from Medium and Towards Data Science, and push to Elasticsearch"""
    # Scrape articles
    medium_articles = scrape_medium_articles()
    towards_articles = scrape_towardsdatascience_articles()

    # Combine all articles from Medium and Towards Data Science
    all_articles = medium_articles + towards_articles

    # Push data to Elasticsearch
    push_data_to_elasticsearch(all_articles)

# Run the scraper and push the data to Elasticsearch
scrape_and_push()
