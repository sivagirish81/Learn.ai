import os
import requests

class Search:
    def __init__(self):
        self.github_headers = {
            "Authorization": f"token {os.getenv('GITHUB_ACCESS_TOKEN')}",
            "Accept": "application/vnd.github.v3+json"
        }
        self.coursera_base_url = "https://api.coursera.org/api/courses.v1"
        self.medium_base_url = "https://api.medium.com/v1"

    def search_github(self, query):
        """Search for repositories on GitHub"""
        try:
            url = f"https://api.github.com/search/repositories?q={query}&per_page=5"
            response = requests.get(url, headers=self.github_headers)
            response.raise_for_status()
            items = response.json().get('items', [])
            return [
                {
                    'title': item['name'],
                    'description': item['description'],
                    'url': item['html_url'],
                    'resource_type': 'GitHub Repository',
                    'author': item['owner']['login'],
                    'tags': [item['language']] if item['language'] else []
                }
                for item in items
            ]
        except Exception as e:
            print(f"Error fetching GitHub repositories: {str(e)}")
            return []

    def search_coursera(self, query):
        """Search for courses on Coursera"""
        try:
            url = f"{self.coursera_base_url}?q=search&query={query}&limit=5"
            response = requests.get(url)
            response.raise_for_status()
            elements = response.json().get('elements', [])
            return [
                {
                    'title': element['name'],
                    'description': element.get('description', 'No description available'),
                    'url': f"https://www.coursera.org/learn/{element['slug']}",
                    'resource_type': 'Course',
                    'author': element.get('partnerIds', []),
                    'tags': element.get('primaryLanguages', [])
                }
                for element in elements
            ]
        except Exception as e:
            print(f"Error fetching Coursera courses: {str(e)}")
            return []

    def search_medium(self, query):
        """Search for articles on Medium"""
        try:
            url = f"https://api.medium.com/v1/search?q={query}&limit=5"
            response = requests.get(url, headers=self.medium_headers)
            response.raise_for_status()
            print(f"Medium API response status: {response.status_code}")
            print(f"Medium API response content: {response.text}")
            data = response.json().get('data', [])
            return [
                {
                    'title': item['title'],
                    'description': item['content']['subtitle'],
                    'url': item['url'],
                    'resource_type': 'Blog Post',
                    'author': item['author']['name'],
                    'tags': item.get('tags', [])
                }
                for item in data
            ]
        except ValueError as e:
            print(f"Error fetching Medium articles: Invalid JSON response: {str(e)}")
            return []
        except Exception as e:
            print(f"Error fetching Medium articles: {str(e)}")
            return []