# LinkForge Deployment Guide

This guide will help you deploy LinkForge to production using Render for the backend and Vercel for the frontend.

## 📋 Prerequisites

Before deploying, ensure you have:
- A GitHub account with the LinkForge repository
- A MongoDB Atlas account
- A Render account (for backend)
- A Vercel account (for frontend)
- A custom domain (optional)

## 🗄️ MongoDB Atlas Setup

### 1. Create a Production Cluster

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Build a Database"
3. Choose "M0 Sandbox" (free tier) or a paid tier for production
4. Select a cloud provider and region closest to your users
5. Name your cluster (e.g., `linkforge-production`)
6. Click "Create"

### 2. Configure Database Access

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password Authentication"
4. Enter a username and strong password
5. Click "Create User"
6. **Important**: Save the username and password securely

### 3. Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development: Allow access from anywhere (0.0.0.0/0)
4. For production: Add your Render/Vercel IP addresses
5. Click "Confirm"

### 4. Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Select your Node.js version
4. Copy the connection string
5. Replace `<password>` with your database user password

Example connection string:
```
mongodb+srv://linkforge-user:secure-password@linkforge-production.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## 🔧 Backend Deployment (Render)

### 1. Prepare Backend for Production

Update `backend/.env` with production values:

```env
PORT=5000
MONGO_URI=mongodb+srv://linkforge-user:secure-password@linkforge-production.xxxxx.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-production-jwt-secret-min-32-characters
FRONTEND_URL=https://your-frontend-domain.vercel.app
BACKEND_URL=https://your-backend-domain.onrender.com
GEOLOCATION_API_KEY=optional-geolocation-api-key
NODE_ENV=production
```

**Important Security Notes:**
- Generate a secure JWT secret using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Never commit `.env` files to version control
- Use strong, unique passwords for MongoDB

### 2. Deploy to Render

1. Log in to [Render](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

   **Name**: `linkforge-backend`
   
   **Region**: Choose a region close to your users
   
   **Branch**: `main`
   
   **Runtime**: `Node`
   
   **Build Command**:
   ```bash
   cd backend && npm install
   ```
   
   **Start Command**:
   ```bash
   cd backend && node src/index.js
   ```
   
   **Root Directory**: `backend`

5. Add Environment Variables:
   - `PORT`: `5000`
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your secure JWT secret
   - `FRONTEND_URL`: Your Vercel frontend URL
   - `BACKEND_URL`: Your Render backend URL
   - `GEOLOCATION_API_KEY`: (optional)
   - `NODE_ENV`: `production`

6. Click "Deploy Web Service"

7. Wait for deployment to complete (2-5 minutes)

8. Copy your backend URL (e.g., `https://linkforge-backend.onrender.com`)

### 3. Verify Backend Deployment

1. Open your backend URL in a browser
2. You should see: `{"message":"LinkForge API","version":"1.0.0","status":"running"}`
3. Test the health endpoint: `GET /`

## 🎨 Frontend Deployment (Vercel)

### 1. Prepare Frontend for Production

Update `frontend/.env` with production values:

```env
VITE_API_URL=https://your-backend-domain.onrender.com
VITE_FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 2. Deploy to Vercel

1. Log in to [Vercel](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure the project:

   **Project Name**: `linkforge-frontend`
   
   **Framework Preset**: `Vite`
   
   **Root Directory**: `frontend`
   
   **Build Command**: `npm run build`
   
   **Output Directory**: `dist`

5. Add Environment Variables:
   - `VITE_API_URL`: Your Render backend URL
   - `VITE_FRONTEND_URL`: Your Vercel frontend URL

6. Click "Deploy"

7. Wait for deployment to complete (1-2 minutes)

8. Copy your frontend URL (e.g., `https://linkforge-frontend.vercel.app`)

### 3. Verify Frontend Deployment

1. Open your frontend URL in a browser
2. You should see the LinkForge landing page
3. Test registration and login
4. Create a short URL and verify it works

## 🔗 Connect Frontend and Backend

### Update Backend CORS

Update `backend/src/index.js` to allow your Vercel domain:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-frontend-domain.vercel.app'
  ],
  credentials: true
}));
```

### Update Frontend Environment Variables

Make sure `frontend/.env` has the correct backend URL:

```env
VITE_API_URL=https://your-backend-domain.onrender.com
VITE_FRONTEND_URL=https://your-frontend-domain.vercel.app
```

Redeploy both services after making changes.

## 🌐 Custom Domain Setup (Optional)

### Frontend Custom Domain (Vercel)

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain (e.g., `linkforge.com`)
4. Update DNS records as instructed by Vercel
5. Wait for SSL certificate to be issued

### Backend Custom Domain (Render)

1. Go to your Render service settings
2. Click "Domains"
3. Add your custom domain (e.g., `api.linkforge.com`)
4. Update DNS records as instructed by Render
5. Wait for SSL certificate to be issued

## 🔒 Security Best Practices for Production

### 1. Environment Variables

- Never commit `.env` files to version control
- Use different environment variables for development and production
- Rotate secrets regularly
- Use Render's and Vercel's built-in secret management

### 2. MongoDB Security

- Enable authentication
- Use strong passwords
- Restrict IP access (whitelist only necessary IPs)
- Enable encryption at rest
- Enable automatic backups
- Monitor database access logs

### 3. API Security

- Enable HTTPS (automatic on Render and Vercel)
- Implement rate limiting (already included)
- Use CORS to restrict access
- Validate all inputs
- Sanitize all outputs
- Implement request size limits

### 4. Authentication Security

- Use strong JWT secrets (minimum 32 characters)
- Set appropriate token expiration (30 days)
- Implement token refresh mechanism
- Store tokens securely (httpOnly cookies recommended)
- Implement logout functionality

### 5. Monitoring and Logging

- Enable application logging
- Monitor error rates
- Set up alerts for failures
- Track performance metrics
- Monitor database performance
- Set up uptime monitoring

## 📊 Monitoring and Analytics

### Render Monitoring

1. Go to your Render service dashboard
2. View metrics: CPU, memory, response time
3. Check logs for errors
4. Set up alerts for high error rates

### Vercel Analytics

1. Enable Vercel Analytics in project settings
2. View page views, visitors, and performance
3. Monitor Core Web Vitals
4. Track deployment success rates

### MongoDB Atlas Monitoring

1. Go to your MongoDB Atlas dashboard
2. View metrics: connections, operations, storage
3. Monitor slow queries
4. Set up alerts for high usage

## 🔄 CI/CD Pipeline

### Automatic Deployments

Both Render and Vercel support automatic deployments:

1. Push changes to GitHub
2. Automatic build and deployment triggers
3. Zero-downtime deployments
4. Rollback to previous versions if needed

### Manual Deployments

For manual control:

**Render:**
```bash
git push origin main
# Render automatically deploys
```

**Vercel:**
```bash
git push origin main
# Vercel automatically deploys
```

## 🐛 Troubleshooting

### Backend Issues

**Problem: Backend won't start**
- Check Render logs for errors
- Verify MongoDB connection string
- Ensure all environment variables are set
- Check MongoDB IP whitelist

**Problem: API requests failing**
- Verify CORS configuration
- Check backend URL in frontend
- Ensure backend is running
- Check rate limiting settings

### Frontend Issues

**Problem: Frontend won't build**
- Check Vercel build logs
- Verify all dependencies are installed
- Check for TypeScript errors
- Ensure environment variables are set

**Problem: API calls failing**
- Verify backend URL is correct
- Check CORS configuration
- Ensure backend is accessible
- Check browser console for errors

### Database Issues

**Problem: MongoDB connection failed**
- Verify connection string
- Check IP whitelist
- Ensure database user has correct permissions
- Check MongoDB Atlas status

**Problem: Slow database queries**
- Add indexes to frequently queried fields
- Optimize query structure
- Consider scaling up database tier
- Use MongoDB Atlas performance advisor

## 📈 Scaling

### Backend Scaling (Render)

1. Go to your Render service settings
2. Upgrade to a higher tier for more CPU/memory
3. Enable horizontal scaling with multiple instances
4. Use Render's load balancer

### Frontend Scaling (Vercel)

1. Vercel automatically scales with traffic
2. Upgrade to Pro plan for higher limits
3. Enable edge functions for better performance
4. Use Vercel's CDN for static assets

### Database Scaling (MongoDB Atlas)

1. Upgrade to a higher tier for more storage/throughput
2. Enable sharding for horizontal scaling
3. Use read replicas for better read performance
4. Optimize queries and indexes

## 💰 Cost Estimation

### Development (Free Tier)
- MongoDB Atlas M0: Free
- Render Free Tier: Free
- Vercel Hobby: Free
- **Total: $0/month**

### Production (Starter)
- MongoDB Atlas M10: ~$57/month
- Render Starter: ~$7/month
- Vercel Pro: ~$20/month
- **Total: ~$84/month**

### Production (Scale)
- MongoDB Atlas M20+: ~$200+/month
- Render Standard: ~$25+/month
- Vercel Pro: ~$20/month
- **Total: ~$245+/month**

## 🎯 Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] MongoDB connection working
- [ ] User registration works
- [ ] User login works
- [ ] URL creation works
- [ ] URL redirect works
- [ ] Analytics tracking works
- [ ] QR code generation works
- [ ] Bulk upload works
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificates active
- [ ] Monitoring enabled
- [ ] Error tracking set up
- [ ] Backup strategy in place
- [ ] Security audit completed

## 📞 Support

If you encounter issues during deployment:

1. Check the logs on Render and Vercel
2. Review MongoDB Atlas status
3. Consult the documentation:
   - [Render Documentation](https://render.com/docs)
   - [Vercel Documentation](https://vercel.com/docs)
   - [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)

4. Open an issue on GitHub for community support

## 🔄 Maintenance

### Regular Tasks

- **Weekly**: Review logs and metrics
- **Monthly**: Update dependencies
- **Quarterly**: Security audit
- **Annually**: Review and update infrastructure

### Backup Strategy

- MongoDB Atlas automatic backups (enabled by default)
- Export critical data regularly
- Document recovery procedures
- Test backup restoration

---

**Congratulations!** Your LinkForge application is now deployed and ready for production users.

This project is a part of a hackathon run by https://katomaran.com
