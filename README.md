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



