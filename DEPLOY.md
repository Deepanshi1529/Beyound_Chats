# Deployment Guide - Beyound_Chats

## Architecture
```
Vercel (Frontend) → Render (Backend API) → PlanetScale (MySQL)
                                    ↓
                         Render (Worker/Cron)
```

---

## Step 1: Setup Database (PlanetScale)

### 1.1 Create PlanetScale Account
1. Go to https://app.planetscale.com
2. Sign up/login with GitHub

### 1.2 Create Database
1. Click **"New Database"**
2. Name: `beyoundChats_blogs`
3. Choose a region close to your Render deployment
4. Create database

### 1.3 Create Branch and Get Credentials
1. In your database, go to **"Branches"** tab
2. Create a branch named `main` (if not auto-created)
3. Click **"Connect"** button
4. Select **"General (MySQL)"** connection type
5. Copy these credentials:
   - **Host** (looks like: `your-db.aws.planetscale.com`)
   - **Username**
   - **Password**
   - **Database name** (should be `beyoundChats_blogs`)

### 1.4 Create Database Table
In PlanetScale console, go to **"Console"** tab and run:
```sql
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

---

## Step 2: Deploy Backend on Render

### 2.1 Create Web Service
1. Go to https://render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `beyound-chats-backend`
   - **Environment:** Node
   - **Root Directory:** `Beyound_Chats`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

### 2.2 Add Environment Variables
In Render dashboard, go to **"Environment"** tab and add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DB_HOST` | *your PlanetScale host* |
| `DB_USER` | *your PlanetScale username* |
| `DB_PASSWORD` | *your PlanetScale password* |
| `DB_NAME` | `beyoundChats_blogs` |
| `DB_PORT` | `3306` |
| `FRONTEND_URL` | `https://beyound-chats-jade.vercel.app` |

### 2.3 Deploy
Click **"Create Web Service"** and wait for deployment (~2-3 minutes)

After deployment, note your backend URL: `https://beyound-chats-backend.onrender.com`

---

## Step 3: Update Backend Environment (if needed)

If your backend URL is different from the one above, update:

1. Go to your Render backend dashboard
2. **Environment** → Add/Update:
   - `FRONTEND_URL` = `https://beyound-chats-jade.vercel.app`
3. **Redeploy** the service (click "Manual Deploy" → "Clear build cache and deploy")

---

## Step 4: Deploy Frontend on Vercel

### 4.1 Update Frontend Environment Variables

In your local machine, edit `article_frontend/.env.production`:
```
REACT_APP_API_BASE_URL=https://beyound-chats-backend.onrender.com/api
```
*(Replace with your actual backend URL from Step 2)*

### 4.2 Deploy to Vercel
Your frontend is already deployed at: **https://beyound-chats-jade.vercel.app**

To update it with the correct backend URL:

1. Push the updated `.env.production` file to GitHub:
   ```bash
   git add article_frontend/.env.production
   git commit -m "Update API URL for production"
   git push origin main
   ```

2. Vercel will automatically redeploy (or manually trigger from Vercel dashboard)

Alternatively, set environment variable directly on Vercel:
1. Go to https://vercel.com
2. Open your project `beyound-chats-jade`
3. **Settings** → **Environment Variables**
4. Add:
   - Key: `REACT_APP_API_BASE_URL`
   - Value: `https://beyound-chats-backend.onrender.com/api`
5. **Redeploy** the project

---

## Step 5: Deploy Worker on Render

### 5.1 Get GROQ API Key
1. Sign up at https://console.groq.com
2. Get your API key from dashboard

### 5.2 Create Cron Job
1. In Render dashboard, click **"New +"** → **"Cron Job"**
2. Configure:
   - **Name:** `beyound-chats-worker`
   - **Environment:** Node
   - **Root Directory:** `NodeJS_project`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Schedule:** `0 */6 * * *` (every 6 hours, adjustable)
   - **Time Zone:** `Asia/Kolkata` (or your preference)

### 5.3 Add Environment Variables

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `API_BASE_URL` | `https://beyound-chats-backend.onrender.com/api` |
| `GROQ_API_KEY` | *your GROQ API key* |
| `LLM_PROVIDER` | `groq` |
| `LLM_MODEL` | `llama-3.3-70b-versatile` |
| `TEST_MODE` | `false` |
| `USE_MANUAL_FALLBACK` | `true` |

### 5.4 Deploy
Click **"Create Cron Job"**

---

## Step 6: Verify Everything Works

### 6.1 Test Backend Health
Visit: `https://beyound-chats-backend.onrender.com/health`

Expected response: `{"status":"OK","message":"Server is running"}`

### 6.2 Test API Endpoint
Visit: `https://beyound-chats-backend.onrender.com/api/articles`

Should return JSON with articles array.

### 6.3 Test Frontend
Open: **https://beyound-chats-jade.vercel.app**

Should display articles from backend.

### 6.4 Check Worker Logs
In Render dashboard:
1. Go to `beyound-chats-worker` service
2. Click **"Logs"** tab
3. Check latest execution (should show search & optimization logs)

---

## Step 7: Populate Database with Sample Articles

Before worker can optimize, you need articles in the database.

### Option A: Use Scraper (Manual)
1. Ensure backend is running
2. Run scraper locally or via Postman:
   ```
   POST https://beyound-chats-backend.onrender.com/api/scrape
   ```
   This will fetch and store articles from BeyondChats blog.

### Option B: Add Sample Data via Postman/curl
```bash
curl -X POST "https://beyound-chats-backend.onrender.com/api/articles" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sample Article",
    "url": "https://example.com/article",
    "author": "John Doe",
    "publish_date": "2025-01-15",
    "excerpt": "This is a sample article",
    "tags": ["sample", "test"],
    "image_url": "https://example.com/image.jpg",
    "content": "Full article content here..."
  }'
```

---

## Step 8: Troubleshooting

### CORS Errors
If frontend shows CORS errors:
1. Backend `server.js` must have:
   ```javascript
   app.use(cors({
       origin: process.env.FRONTEND_URL || 'https://beyound-chats-jade.vercel.app'
   }));
   ```
2. Redeploy backend after changes

### Worker Can't Connect to API
Check `NodeJS_project/config/config.js` uses:
```javascript
baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api'
```
Ensure Render environment variable `API_BASE_URL` is set correctly.

### Database Connection Failed
- Verify PlanetScale credentials
- Ensure SSL is enabled (already in code)
- Check PlanetScale allows connections from Render

### Build Fails on Render
- Ensure `package.json` exists in each subdirectory
- Verify Node version (use `engines` in package.json if needed)

---

## URLs Summary

| Service | URL |
|---------|-----|
| Frontend | https://beyound-chats-jade.vercel.app |
| Backend API | https://beyound-chats-backend.onrender.com |
| Worker | *(Runs on schedule, check Render logs)* |
| Database | PlanetScale dashboard |

---

## Next Steps

1. [ ] Create PlanetScale database
2. [ ] Deploy backend on Render
3. [ ] Update frontend `.env.production` with backend URL
4. [ ] Redeploy frontend on Vercel
5. [ ] Get GROQ API key
6. [ ] Deploy worker on Render
7. [ ] Test full flow from frontend
8. [ ] Populate database with articles

---

Need help? Check Render docs: https://render.com/docs
