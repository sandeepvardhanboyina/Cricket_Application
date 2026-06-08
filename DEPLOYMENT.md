# Deployment Guide — Cricket Tournament Hub

## Docker (Local / Single Server)

The fastest way to run the full stack:

```bash
cp .env.example .env          # edit ports if needed
docker compose up --build
```

| Service | Default URL |
|---------|-------------|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| Swagger | http://localhost:5000/api/docs |

**Useful commands:**

```bash
docker compose up -d          # run in background
docker compose down           # stop containers
docker compose down -v        # stop + wipe database
docker compose logs -f        # tail logs
```

If port 5000 is in use, set in `.env`:
```env
BACKEND_HOST_PORT=5050
API_PUBLIC_URL=http://localhost:5050
NEXT_PUBLIC_API_URL=http://localhost:5050/api
```
Then rebuild: `docker compose up --build`

---

## Overview

This guide covers deploying the Cricket Tournament Hub to production using:

- **Backend**: Railway, Render, or AWS EC2
- **Frontend**: Vercel or Netlify
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary
- **Email**: Gmail SMTP or SendGrid

---

## 1. MongoDB Atlas Setup

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user with read/write permissions
3. Whitelist your server IP (or `0.0.0.0/0` for cloud deployments)
4. Copy the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/cricket-tournament-hub
   ```

---

## 2. Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. From the dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret

---

## 3. Backend Deployment

### Option A: Railway (Recommended)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set root directory to `backend`
4. Add environment variables:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<generate-a-strong-64-char-secret>
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Cricket Tournament Hub <noreply@crickethub.com>
FRONTEND_URL=https://your-frontend.vercel.app
API_URL=https://your-backend.railway.app
```

5. Set start command: `npm start`
6. Run seed once: `npm run seed` (via Railway shell)

### Option B: Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect GitHub repo, set root to `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add the same environment variables as above

### Option C: AWS EC2

```bash
# On Ubuntu EC2 instance
sudo apt update && sudo apt install -y nodejs npm nginx
git clone <your-repo>
cd cricket/backend
cp .env.example .env
# Edit .env with production values
npm install
npm install -g pm2
pm2 start src/server.js --name cricket-api
pm2 save && pm2 startup
```

Nginx reverse proxy config:

```nginx
server {
    listen 80;
    server_name api.crickethub.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 4. Frontend Deployment (Vercel)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Set root directory to `frontend`
4. Add environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NEXT_PUBLIC_SITE_NAME=Cricket Tournament Hub
```

5. Deploy — Vercel auto-detects Next.js

### Build Settings

- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`

---

## 5. Email Configuration

### Gmail SMTP

1. Enable 2FA on your Google account
2. Generate an App Password: Google Account → Security → App Passwords
3. Use the app password as `SMTP_PASS`

### SendGrid (Production Alternative)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your-sendgrid-api-key>
```

---

## 6. Security Checklist

- [ ] Use a strong `JWT_SECRET` (64+ random characters)
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS `FRONTEND_URL` to your exact domain
- [ ] Enable MongoDB Atlas IP whitelist (restrict to server IPs)
- [ ] Use HTTPS everywhere (Vercel/Railway provide this automatically)
- [ ] Never commit `.env` files to git
- [ ] Change default admin password after first login
- [ ] Set up MongoDB Atlas backups

---

## 7. Post-Deployment Steps

```bash
# Seed production database (run once)
cd backend
npm run seed

# Verify API health
curl https://your-backend.railway.app/api/health

# Verify frontend
open https://your-app.vercel.app

# Test admin login
# admin@crickethub.com / admin123 (change immediately!)
```

---

## 8. Monitoring

### PM2 (EC2)

```bash
pm2 monit
pm2 logs cricket-api
```

### Railway / Render

Use built-in logs dashboard.

### Recommended Tools

- **Uptime**: UptimeRobot (free) — monitor `/api/health`
- **Errors**: Sentry — add to both backend and frontend
- **Analytics**: Vercel Analytics or Google Analytics

---

## 9. Custom Domain

### Vercel (Frontend)

1. Vercel Dashboard → Project → Settings → Domains
2. Add `crickethub.com` and `www.crickethub.com`
3. Update DNS records as instructed

### Railway (Backend)

1. Railway Dashboard → Service → Settings → Networking
2. Add custom domain `api.crickethub.com`
3. Update `NEXT_PUBLIC_API_URL` and `FRONTEND_URL`

---

## 10. Scaling Considerations

| Component | Scaling Strategy |
|-----------|-----------------|
| MongoDB | Atlas M10+ for production traffic |
| Backend | Horizontal scaling with load balancer |
| Frontend | Vercel auto-scales (serverless) |
| Images | Cloudinary CDN handles scaling |
| Caching | Add Redis for session/API caching |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Verify `FRONTEND_URL` matches exact frontend domain |
| MongoDB connection failed | Check Atlas IP whitelist and connection string |
| Images not uploading | Verify Cloudinary credentials |
| 401 on admin routes | Check JWT token in localStorage, re-login |
| Build fails on Vercel | Ensure all env vars are set in Vercel dashboard |

---

## Environment Variables Summary

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| MONGODB_URI | Yes | MongoDB connection string |
| JWT_SECRET | Yes | JWT signing secret |
| FRONTEND_URL | Yes | Frontend URL for CORS |
| CLOUDINARY_* | No | Image upload (falls back to base64) |
| SMTP_* | No | Email notifications (skipped if not set) |

### Frontend (.env.local)

| Variable | Required | Description |
|----------|----------|-------------|
| NEXT_PUBLIC_API_URL | Yes | Backend API base URL |
| NEXT_PUBLIC_SITE_URL | Yes | Frontend URL for SEO |
| NEXT_PUBLIC_SITE_NAME | No | Site name for meta tags |
