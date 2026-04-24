# SUPER SIMPLE DEPLOYMENT GUIDE

## What You Get After Deployment:
- **Frontend**: https://your-app.onrender.com
- **Backend API**: https://your-app.onrender.com/api
- **Worker**: Runs every 6 hours automatically

---

## ✅ Changes Made for You

1. **Converted MySQL → PostgreSQL** (Render's free database)
2. **Frontend built into backend** (React files in `Beyound_Chats/public/`)
3. **Single service deployment** (everything together)
4. **Auto-configured** for Render one-click deploy

---

## 🚀 Deploy in 5 Minutes

### Step 1: Push to GitHub (Already Done)
All changes are already committed and pushed.

### Step 2: Create Render Account
1. Go to https://render.com
2. Sign up (free tier)

### Step 3: Deploy Backend + Frontend

1. In Render dashboard, click **New → Web Service**
2. Connect your GitHub repo: `Deepanshi1529/Beyound_Chats`
3. Configure:
   - **Name**: `beyound-chats-app`
   - **Environment**: Node
   - **Root Directory**: **Leave empty** (use root)
   - **Build Command**: `npm install --prefix Beyound_Chats`
   - **Start Command**: `npm start --prefix Beyound_Chats`
   - **Plan**: Free

4. **Add Environment Variables:**
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - `DATABASE_URL` = *(Leave blank for now - we'll add in Step 4)*
   - `GROQ_API_KEY` = *(your GROQ key from https://console.groq.com)*

5. Click **Create Web Service**

### Step 4: Create PostgreSQL Database

1. After backend service is created, go to **"New → PostgreSQL"**
2. Configure:
   - **Name**: `beyound-chats-db`
   - **Database Name**: `beyound_chats`
   - **Plan**: Free
   - **Region**: Same as your web service

3. Click **Create**

4. Wait for database to be ready, then copy the **"Connection String"** (looks like: `postgresql://user:pass@host:5432/db`)

5. Go back to your **backend service** → **Environment**
6. Add/Update variable:
   - Key: `DATABASE_URL`
   - Value: *paste the connection string*

7. **Redeploy** the backend (Manual Deploy → Clear cache & deploy)

### Step 5: Auto-Run Database Migrations

Your backend will automatically create tables on first run. To trigger it:

1. Visit: `https://your-backend.onrender.com/health`
   - Should see: `{"status":"OK","message":"Server is running"}`

2. If database is empty, POST to `/api/scrape` to populate:
   ```bash
   curl -X POST https://your-backend.onrender.com/api/scrape
   ```

### Step 6: Deploy Worker

1. In Render dashboard, click **New → Cron Job**
2. Configure:
   - **Name**: `beyound-chats-worker`
   - **Environment**: Node
   - **Root Directory**: `NodeJS_project`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Schedule**: `0 */6 * * *` (every 6 hours)
   - **Time Zone**: `Asia/Kolkata` (or your choice)

3. **Environment Variables:**
   - `NODE_ENV` = `production`
   - `API_BASE_URL` = `https://your-backend.onrender.com/api` (replace with actual)
   - `GROQ_API_KEY` = *(same as backend)*
   - `LLM_PROVIDER` = `groq`
   - `LLM_MODEL` = `llama-3.3-70b-versatile`
   - `TEST_MODE` = `false`
   - `USE_MANUAL_FALLBACK` = `true`

4. Click **Create Cron Job**

### Step 7: Verify It Works

1. **Open frontend**: `https://your-backend.onrender.com`
   - Should see the React app

2. **Check API**: `https://your-backend.onrender.com/api/articles`
   - Should return JSON (empty array initially)

3. **Add test article** (if needed):
   ```bash
   curl -X POST https://your-backend.onrender.com/api/articles \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","url":"https://test.com","excerpt":"test","tags":["test"]}'
   ```

4. **Watch worker logs** in Render to see it optimizing articles

---

## 📁 Files Changed

| File | Change |
|------|--------|
| `Beyound_Chats/config/database.js` | MySQL → PostgreSQL |
| `Beyound_Chats/controllers/articleController.js` | PostgreSQL queries |
| `Beyound_Chats/server.js` | Serve React static files |
| `article_frontend/src/App.js` | Env var for API URL |
| `render.yaml` | One-click deployment config |

---

## 🆘 Troubleshooting

### "Cannot find module 'pg'"
Run: `npm install --prefix Beyound_Chats`

### Database connection fails
- Ensure `DATABASE_URL` is set correctly
- Check PostgreSQL is running in Render

### Frontend shows blank page
- Ensure React build files exist in `Beyound_Chats/public/`
- Check browser console for errors

### Worker not running
- Check `API_BASE_URL` matches your backend URL
- Verify GROQ API key is valid

---

## 🎉 Done!

That's it. You now have:
- ✅ React frontend served from same URL
- ✅ Express backend API
- ✅ PostgreSQL database
- ✅ Automated worker

All managed by Render's free tier.
