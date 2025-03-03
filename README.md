# AI Learning Hub

A Python-based web application that serves as a centralized search hub for AI-related tutorials, handbooks, research materials, coding resources, and GitHub repositories.

## Features

- Advanced AI Resource Search Engine
- Categorized Learning Materials
- GitHub Repository Explorer
- Bookmark & Save Favorite Resources
- AI-Powered Chatbot for Assistance
- User-Contributed Resources & Community Engagement

## Prerequisites

- Python 3.8+
- Node.js 14+
- Elasticsearch 7.x
- npm or yarn

## Setup

### Backend Setup

1. Create and activate virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Make sure Elasticsearch is running on 127.0.0.1:9200

4. Initialize the database:
```bash
python app/utils/es_setup.py
```

5. Start the Flask server:
```bash
python run.py
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm start
```

## Usage

1. Open your browser and navigate to http://127.0.0.1:3000
2. Use the search bar to find AI resources
3. Filter results by category and tags
4. Click on resources to view details

## API Endpoints

- GET /api/search - Search for resources
- GET /api/categories - Get available categories
- GET /api/tags - Get available tags

## Project Structure

```
ai-learning-hub/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── requirements.txt
│   └── run.py
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   ├── services/
    │   └── App.js
    └── package.json
```
