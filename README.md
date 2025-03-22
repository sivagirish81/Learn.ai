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

## Local Setup

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

## Project Structure

```
LEARN.AI/
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
    │   ├── contexts
    │   ├── services/
    │   └── App.js
    └── package.json
```

## Deployment

This project is deployed using Vercel, Render, and Bonsai Elastic for seamless hosting.

+ Vercel hosts the React Frontend.
+ Render hosts the Flask Backend.
+ Bonsai Elastic provides an Elasticsearch instance for storing all the app data.

Deployment : [Learn.ai](https://learnai-rouge.vercel.app/)