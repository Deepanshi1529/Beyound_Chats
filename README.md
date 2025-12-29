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
# Database Setup

Use MySql Database where kept table named "articles" which included the id, title, url, author, publish_date, excerpt, tags, image_url, created_at and updated_at as the differnet columns defined.
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
  Used Postman for that testing the APIs testpoints

+ Scrape and store Articles
  <img width="1349" height="841" alt="Screenshot 2025-12-29 131800" src="https://github.com/user-attachments/assets/48fe487c-207b-4629-be86-378c7c6fd157" />
  
+ Create the Article
  <img width="1381" height="863" alt="Screenshot 2025-12-29 132531" src="https://github.com/user-attachments/assets/45c209a6-4d77-43b7-9927-2930e2648f12" />

+ Get All Articles
  <img width="1380" height="880" alt="Screenshot 2025-12-29 134045" src="https://github.com/user-attachments/assets/0c1851a4-5993-439e-a100-0f396f5a2143" />

+ Update Article
  <img width="1382" height="860" alt="Screenshot 2025-12-29 134825" src="https://github.com/user-attachments/assets/04bfe493-1f31-44c9-8877-2e39be0d5b6b" />

+ Delete Article
  <img width="1368" height="869" alt="Screenshot 2025-12-29 134906" src="https://github.com/user-attachments/assets/61384271-3072-4b54-9121-6000cb98ef06" />




