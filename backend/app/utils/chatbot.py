import os
import google.generativeai as genai
from elasticsearch_dsl import Search
from flask import current_app

# Initialize Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY', 'AIzaSyDI7ADbF3cq_fLxeiWi6nL3aJpraFdecM4'))

class Chatbot:
    def __init__(self):
        self.context = """You are an AI learning assistant that helps users find relevant AI learning resources 
        and answers questions about artificial intelligence. You have access to a database of tutorials, 
        research papers, and GitHub repositories. You can search this database to provide relevant 
        recommendations."""
        
        self.conversation_history = []
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.chat = self.model.start_chat(history=[])

    def search_resources(self, query, size=5):
        """Search for relevant resources in Elasticsearch"""
        try:
            s = Search(using=current_app.elasticsearch, index='ai_resources')
            s = s.query('multi_match', query=query, fields=['title^2', 'description', 'content'])
            s = s[:size]
            response = s.execute()
            
            resources = []
            for hit in response:
                resources.append({
                    'id': hit.meta.id,
                    'title': hit.title,
                    'description': hit.description,
                    'url': hit.url,
                    'category': hit.category
                })
            return resources
        except Exception as e:
            print(f"Error searching resources: {str(e)}")
            return []

    def get_completion(self, user_message, context):
        """Get completion from Gemini API"""
        try:
            # Add context and user message
            prompt = f"{context}\n\nUser: {user_message}"
            response = self.chat.send_message(prompt)
            return response.text
        except Exception as e:
            print(f"Error getting completion: {str(e)}")
            return "I apologize, but I'm having trouble processing your request right now. Please try again later."

    def process_message(self, user_message):
        """Process user message and generate response"""
        try:
            # Add user message to conversation history
            self.conversation_history.append({"role": "user", "content": user_message})
            
            # Search for relevant resources
            resources = self.search_resources(user_message)
            
            # Create context with resources
            context = self.context
            if resources:
                context += "\n\nRelevant resources found:\n"
                for r in resources:
                    context += f"- {r['title']}: {r['description']}\n"
            
            # Get response from Gemini
            response = self.get_completion(user_message, context)
            
            # Add assistant response to conversation history
            self.conversation_history.append({"role": "assistant", "content": response})
            
            # Prepare response with both text and resources
            return {
                "message": response,
                "resources": resources
            }
            
        except Exception as e:
            print(f"Error processing message: {str(e)}")
            return {
                "message": "I apologize, but I'm having trouble processing your request right now. Please try again later.",
                "resources": []
            }

    def clear_conversation(self):
        """Clear conversation history"""
        self.conversation_history = []
        self.chat = self.model.start_chat(history=[]) 