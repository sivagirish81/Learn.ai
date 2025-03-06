import os
import requests
from flask import current_app

class GitHub:
    def __init__(self):
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"token {os.getenv('GITHUB_ACCESS_TOKEN')}",
            "Accept": "application/vnd.github.v3+json"
        }

    def get_trending_repositories(self, language="python", since="daily"):
        """Fetch trending AI repositories from GitHub"""
        try:
            url = f"{self.base_url}/search/repositories?q=language:{language}+topic:ai&sort=stars&order=desc"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json().get('items', [])
        except Exception as e:
            print(f"Error fetching trending repositories: {str(e)}")
            return []