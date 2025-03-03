import json
from datetime import datetime
from app.models.user import User
from app.models.resource import Resource

def load_test_data():
    # Create admin user
    admin_data = {
        "email": "admin@learn.ai",
        "password": "Admin123!",
        "name": "Admin User",
        "role": "admin",
        "created_at": datetime.utcnow().isoformat()
    }

    try:
        User.create(admin_data)
        print("✓ Admin user created successfully")
    except Exception as e:
        print(f"✗ Failed to create admin user: {str(e)}")

    # Create test resources
    test_resources = {
        "resources": [
            {
                "title": "Introduction to Large Language Models",
                "url": "https://example.com/llm-intro",
                "description": "A comprehensive guide to understanding and implementing Large Language Models.",
                "category": "Tutorial",
                "resource_type": "Tutorial",
                "tags": ["LLM", "NLP", "AI", "Machine Learning"],
                "author": "Jane Smith",
                "publication_date": "2024-01-15T00:00:00Z",
                "difficulty_level": "Intermediate",
                "prerequisites": ["Python", "Basic ML"],
                "submitted_by": "user@learn.ai",
                "status": "pending",
                "created_at": "2024-01-15T10:00:00Z"
            },
            {
                "title": "Transformer Architecture Deep Dive",
                "url": "https://github.com/example/transformer-implementation",
                "description": "Complete implementation of the Transformer architecture with detailed explanations.",
                "category": "GitHub Repository",
                "resource_type": "GitHub Repository",
                "tags": ["Transformers", "Deep Learning", "PyTorch"],
                "author": "John Doe",
                "github_stars": 1200,
                "difficulty_level": "Advanced",
                "prerequisites": ["PyTorch", "Deep Learning"],
                "submitted_by": "contributor@learn.ai",
                "status": "pending",
                "created_at": "2024-01-16T15:30:00Z"
            },
            {
                "title": "Attention Mechanisms in Neural Networks",
                "url": "https://arxiv.org/example",
                "description": "Research paper discussing novel attention mechanisms in neural networks.",
                "category": "Research Paper",
                "resource_type": "Research Paper",
                "tags": ["Attention", "Neural Networks", "Research"],
                "author": "Dr. Alice Johnson",
                "publication_date": "2024-01-10T00:00:00Z",
                "submitted_by": "researcher@learn.ai",
                "status": "pending",
                "created_at": "2024-01-17T09:15:00Z"
            }
        ]
    }

    # Ensure indices exist
    Resource.setup_index()

    # Load resources
    results = Resource.bulk_create(test_resources['resources'])
    
    print("\nResource Creation Results:")
    print(f"✓ Successfully created: {len(results['success'])} resources")
    if results['failed']:
        print(f"✗ Failed to create: {len(results['failed'])} resources")
        for failed in results['failed']:
            print(f"  - {failed['data']['title']}: {failed['error']}")

if __name__ == '__main__':
    load_test_data() 