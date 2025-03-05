import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
from elasticsearch import Elasticsearch

ES_HOST = 'http://127.0.0.1:9200'
INDEX_NAME = 'ai_resources'

# Connect to Elasticsearch
es = Elasticsearch([ES_HOST])

# Define the index mapping
index_mapping = {
    "mappings": {
        "properties": {
            "title": {"type": "text"},
            "url": {"type": "keyword"},
            "description": {"type": "text"},
            "category": {"type": "keyword"},
            "resource_type": {"type": "keyword"},
            "tags": {"type": "keyword"},
            "author": {"type": "text"},
            "publication_date": {"type": "date"},
            "difficulty_level": {"type": "keyword"},
            "prerequisites": {"type": "keyword"},
            "submitted_by": {"type": "keyword"},
            "status": {"type": "keyword"},
            "created_at": {"type": "date"}
        }
    }
}

# Create the Elasticsearch index
es.indices.create(index=INDEX_NAME, body=index_mapping)


def scrape_ai_tutorials():
    """Scrape AI tutorials from Analytics Vidhya"""
    tutorials = []
    url = "https://www.analyticsvidhya.com/blog/category/machine-learning/"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    articles = soup.find_all('article')[:5]  # Get top 5 articles
    for article in articles:
        title = article.find('h3').text.strip()
        url = article.find('a')['href']
        description = article.find('p').text.strip()

        tutorials.append({
            "title": title,
            "url": url,
            "description": description,
            "category": "Tutorial",
            "resource_type": "Tutorial",
            "tags": ["AI", "Machine Learning", "Tutorial"],
            "author": "Analytics Vidhya",
            "publication_date": datetime.now().isoformat(),
            "difficulty_level": "Intermediate",
            "prerequisites": ["Python", "Basic ML"],
            "submitted_by": "scraper@learn.ai",
            "status": "approved",
            "created_at": datetime.now().isoformat()
        })

    return tutorials


def scrape_ai_research_papers():
    """Scrape latest AI research papers from arXiv"""
    papers = []
    url = "https://export.arxiv.org/api/query?search_query=cat:cs.AI&start=0&max_results=5"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'lxml')

    for entry in soup.find_all('entry'):
        title = entry.find('title').text.strip()
        url = entry.find('id').text.strip()
        description = entry.find('summary').text.strip()
        author = entry.find('author').text.strip()

        papers.append({
            "title": title,
            "url": url,
            "description": description,
            "category": "Research Paper",
            "resource_type": "Research Paper",
            "tags": ["AI", "Research", "Deep Learning"],
            "author": author,
            "publication_date": datetime.now().isoformat(),
            "difficulty_level": "Advanced",
            "prerequisites": ["Deep Learning", "Python"],
            "submitted_by": "scraper@learn.ai",
            "status": "approved",
            "created_at": datetime.now().isoformat()
        })

    return papers


def scrape_github_repos():
    """Scrape trending AI-related GitHub repositories"""
    repos = []
    url = "https://github.com/trending/python?since=weekly"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    repo_list = soup.find_all('h1', class_='h3 lh-condensed')[:5]
    for repo in repo_list:
        repo_name = repo.text.strip()
        repo_url = "https://github.com" + repo.find('a')['href']

        repos.append({
            "title": repo_name,
            "url": repo_url,
            "description": "Trending AI GitHub repository.",
            "category": "GitHub Repository",
            "resource_type": "GitHub Repository",
            "tags": ["GitHub", "AI", "Open Source"],
            "author": "GitHub Community",
            "publication_date": datetime.now().isoformat(),
            "difficulty_level": "Intermediate",
            "prerequisites": ["Python", "Deep Learning"],
            "submitted_by": "scraper@learn.ai",
            "status": "approved",
            "created_at": datetime.now().isoformat()
        })

    return repos


def scrape_ai_courses():
    """Scrape AI courses from Coursera"""
    courses = [
        {
            "title": "Machine Learning by Andrew Ng",
            "url": "https://www.coursera.org/learn/machine-learning",
            "description": "A foundational course in ML, covering key concepts and algorithms.",
            "category": "Course",
            "resource_type": "Course",
            "tags": ["Machine Learning", "AI", "Supervised Learning"],
            "author": "Andrew Ng",
            "publication_date": "2018-03-25T00:00:00Z",
            "difficulty_level": "Beginner",
            "prerequisites": ["Mathematics", "Python"],
            "submitted_by": "scraper@learn.ai",
            "status": "approved",
            "created_at": "2018-03-25T14:00:00Z"
        }
    ]
    return courses


def scrape_ai_blog_posts():
    """Scrape AI-related blog posts"""
    blogs = []
    url = "https://towardsdatascience.com/tagged/machine-learning"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    articles = soup.find_all('h2')[:5]  # Get top 5 blog posts
    for article in articles:
        title = article.text.strip()
        url = article.find('a')['href']

        blogs.append({
            "title": title,
            "url": url,
            "description": "An AI-related blog post from Towards Data Science.",
            "category": "Blog Post",
            "resource_type": "Blog Post",
            "tags": ["Machine Learning", "Deep Learning"],
            "author": "Towards Data Science",
            "publication_date": datetime.now().isoformat(),
            "difficulty_level": "General",
            "prerequisites": [],
            "submitted_by": "scraper@learn.ai",
            "status": "approved",
            "created_at": datetime.now().isoformat()
        })

    return blogs


# Aggregate all resources
all_resources = []
all_resources.extend(scrape_ai_tutorials())
all_resources.extend(scrape_github_repos())
all_resources.extend(scrape_ai_courses())
all_resources.extend(scrape_ai_blog_posts())

# Index the data in Elasticsearch
for resource in all_resources:
    es.index(index=INDEX_NAME, body=resource)

print("✅ Elasticsearch index populated successfully!")
