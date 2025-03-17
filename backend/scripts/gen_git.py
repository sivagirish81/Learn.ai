import requests
from bs4 import BeautifulSoup
from datetime import datetime
from elasticsearch import Elasticsearch, exceptions
import json

ES_HOST = 'https://kpc8psbuv0:tqi1g1t69r@learn-ai-4739164286.us-west-2.bonsaisearch.net'  # Update if necessary
INDEX_NAME = 'ai_resources'

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
def scrape_github_repos():
    """Scrape trending AI-related GitHub repositories"""
    repos = []
    url = "https://github.com/trending/python?since=weekly"
    headers = {"User-Agent": "Mozilla/5.0"}
    
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print("❌ Failed to retrieve GitHub trending page")
        return []
    
    soup = BeautifulSoup(response.text, 'html.parser')
    repo_list = soup.find_all('article', class_='Box-row')[:5]  # Get top 5 repositories

    for repo in repo_list:
        repo_name = repo.find('h2', class_='h3').text.strip()
        repo_url = "https://github.com" + repo.find('h2').find('a')['href']
        description = repo.find('p', class_='col-9').text.strip() if repo.find('p', class_='col-9') else "No description available."
        stars = repo.find('a', class_='Link--muted').text.strip()
        topics = [topic.text.strip() for topic in repo.find_all('a', class_='topic-tag')]

        repos.append({
            "title": repo_name,
            "url": repo_url,
            "description": description,
            "category": "GitHub Repository",
            "resource_type": "GitHub Repository",
            "tags": topics if topics else ["GitHub", "AI", "Python"],
            "author": "GitHub Community",
            "publication_date": datetime.now().isoformat(),
            "difficulty_level": "Intermediate",
            "prerequisites": ["Python", "Deep Learning"],
            "submitted_by": "scraper@learn.ai",
            "stars": stars,
            "status": "approved",
            "created_at": datetime.now().isoformat()
        })

    return repos

def push_to_elasticsearch(repos):
    """Push the scraped data into Elasticsearch"""
    for repo in repos:
        try:
            es.index(index='ai_resources', body=repo)
            print(f"✅ Pushed '{repo['title']}' to Elasticsearch.")
        except exceptions.ConnectionError as e:
            print(f"❌ Error connecting to Elasticsearch: {str(e)}")
        except exceptions.RequestError as e:
            print(f"❌ Request error while pushing data: {str(e)}")

if __name__ == "__main__":

    # Step 2: Scrape the repositories
    repos_data = scrape_github_repos()

    # Step 3: Push the scraped data to Elasticsearch
    if repos_data:
        push_to_elasticsearch(repos_data)
    else:
        print("No repositories found to scrape.")