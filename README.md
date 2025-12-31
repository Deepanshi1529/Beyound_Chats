# Beyound_Chats

# Task - 1 
+ Scrape articles from the last page of the blogs section of BeyondChats. Fetch the 5 oldest articles from the BeyoundChats blog Section.
+ Store these articles in a database. 
+ Create CRUD APIs these articles

# Project Setup and Installing Required Packages
```
npm init -y
npm install express mysql2 axios cheerio dotenv cors body-parser
npm install --save-dev nodemon
```

# Required Packages Info 
+ axios: HTTP client for web scraping
+ cheerio: HTML parser for scraping
+ cors: Enable Cross-Origin Resource Sharing
+ body-parser: Parse incoming request bodies

# Database Setup
Used MySql Database where kept table named "articles" which included the id, title, url, author, publish_date, excerpt, tags, image_url, created_at and updated_at as the differnet columns defined.
```
CREATE DATABASE beyoundChats_blogs;

use beyoundChats_blogs;

CREATE TABLE articles(
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    url VARCHAR(500) UNIQUE NOT NULL,
    author VARCHAR(255),
    publish_date DATE,
    excerpt TEXT,
    tags JSON,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

# Project Structure
```
Beyond_Chats/
├── config/
│   └── database.js
├── controllers/
│   └── articleController.js
├── routes/
│   └── articleRoutes.js
├── services/
│   └── scraper.js
├── .env
├── server.js
└── package.json
|__ fixDatabase.js
```

# Let's Test the APIs -
  Used Postman for testing the APIs testpoints, performed the CRUD operations 

+ Scrape and store Articles
  
  <img width="1349" height="841" alt="Screenshot 2025-12-29 131800" src="https://github.com/user-attachments/assets/48fe487c-207b-4629-be86-378c7c6fd157" />
  
+ Create the Article
  
  <img width="1381" height="863" alt="Screenshot 2025-12-29 132531" src="https://github.com/user-attachments/assets/45c209a6-4d77-43b7-9927-2930e2648f12" />

+ Get All Articles
  
  <img width="1380" height="880" alt="Screenshot 2025-12-29 134045" src="https://github.com/user-attachments/assets/0c1851a4-5993-439e-a100-0f396f5a2143" />

## Issued that occured while getting the articles

The scraper is storing tags as a plain string like "ai chatbot" instead of proper JSON like ["ai chatbot"]. This error occurs because the tags field in my MySQL database is stored as a string, but it's not valid JSON format. For that, created the fixDatabase.js in the root directory. It fixes the problem of invalid JSON format in the tags column, converted them into arrays.

+ Update Article
  
  <img width="1382" height="860" alt="Screenshot 2025-12-29 134825" src="https://github.com/user-attachments/assets/04bfe493-1f31-44c9-8877-2e39be0d5b6b" />

+ Delete Article
  
  <img width="1368" height="869" alt="Screenshot 2025-12-29 134906" src="https://github.com/user-attachments/assets/61384271-3072-4b54-9121-6000cb98ef06" />

# Task - 2
Create a NodeJS based script / project. 
Fetch the articles from API you created in previous task 
The script: 
+ Searches this article’s title on Google. 
+ Fetches the first two links from Google Search results that are blogs or articles published by other websites. 
+ Scrapes the main content from these two articles you found on Google Search. 
+ Calls an LLM API to update the original article and make its formatting, content similar to the two new articles that were ranking on top of Google. 
+ Publish the newly generated article using the CRUD APIs created in previous Phase. 
+ Make sure to cite reference articles (that you scraped from Google Search results) at the bottom of the newly generated article. 

# Required Packages Info
+ groq-sdk - Groq AI API integration
+ axios - HTTP client for API calls
+ cheerio - HTML parsing for web scraping

# Project Structure
```
project/
├── index.js                   
├── package.json               
├── package-lock.json           
├── test-gemini.js              # Search functionality test script
├── .env                        
├── services/                   # Core service modules
│   ├── articleService.js       # Database/API article operations
│   ├── googleSearchService.js  # Google search functionality
│   ├── scraperService.js       # Web scraping utilities
│   └── llmService.js           # AI/LLM integration
└── utils/
    └── logger.js                            
```

# WorkFlow Process
+ Fetch Articles: Retrieves articles from the database/API
+ Search Competitors: Extracts keywords and searches Google
+ Scrape Content: Downloads competitor article content
+ AI Optimization: Enhances articles using LLM with competitor insights
+ Add Metadata: Includes citations, tags, and excerpts
+ Publish: Updates the database with optimized content

# Features
+ Smart Search: Extracts keywords from article titles and searches for relevant competitor content
+ Web Scraping: Extracts content from competitor websites
+ AI Optimization: Uses LLM (Groq SDK) to enhance articles with competitor insights
+ Automatic Citations: Adds proper citations and references
+ Fallback Mechanisms: Manual fallback URLs when search fails
+ Test Mode: Optional test mode to skip external API calls
+ Detailed Logging: Step-by-step progress tracking
+ Safety Limits: Content length validation and rate limiting

# Running the Application
```
npm run dev      # to run the beyound_chats project
npm start        # to run the NodeJS_project
```

# Task - 3
Create a small ReactJS-based frontend project that fetches articles from the Laravel APIs and displays them in a responsive, professional UI. (The original articles as well as their update versions) 

# Project Setup and Installing Dependencies
```
npx create-react-app article_frontend
cd article_frontend
npm install lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

# Project Structure
```
article_frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── App.js              
│   ├── index.js            
│   ├── index.css           
│   └── App.css             
├── package.json
├── tailwind.config.js      
└── postcss.config.js       
```

# Features
+ Article Search & Filtering - Search by keywords, filter by tags
+ AI Optimization Indicators - Visual badges for enhanced content
+ Modern UI - Built with Tailwind CSS and Lucide React icons
+ Expandable Content - Read full articles with expand/collapse
+ Tag Management- Organize articles with customizable tags

# Running the setup
```
Start the CRUD API: npm run dev
Start React app: npm start
```
