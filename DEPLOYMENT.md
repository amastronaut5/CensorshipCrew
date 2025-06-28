# 🚀 Deployment Guide

## Quick Deploy to Vercel (Recommended)

### Option 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/username/keep-it-alive-flappy-bird)

### Option 2: Manual Deploy
1. Fork this repository
2. Connect your GitHub account to Vercel
3. Import the project
4. Deploy automatically

## Deploy to Netlify

### Option 1: Drag & Drop
1. Run `npm run build && npm run export`
2. Drag the `out` folder to Netlify

### Option 2: Git Integration
1. Connect your repository to Netlify
2. Set build command: `npm run build && npm run export`
3. Set publish directory: `out`

## Deploy to GitHub Pages

1. Enable GitHub Pages in repository settings
2. Set source to GitHub Actions
3. The workflow will automatically deploy on push

## Deploy to Any Static Host

1. Run `npm run build && npm run export`
2. Upload the `out` folder contents to your host
3. Ensure your host serves `index.html` for all routes

## Environment Variables

For production deployment, you may want to set:

\`\`\`bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
\`\`\`

## Performance Optimization

The game is already optimized for production with:
- ✅ Static export for fast loading
- ✅ Image optimization disabled for static hosting
- ✅ Console logs removed in production
- ✅ CSS optimization enabled
- ✅ Proper caching headers
- ✅ Compressed assets

## Domain Configuration

After deployment, update these files with your domain:
- `public/sitemap.xml`
- `README.md` links
- `package.json` homepage

## SSL Certificate

Most modern hosting platforms provide free SSL certificates. Ensure HTTPS is enabled for:
- Better SEO
- PWA functionality
- Secure localStorage access

## Monitoring

Consider adding:
- Google Analytics for usage tracking
- Error monitoring (Sentry)
- Performance monitoring (Vercel Analytics)

Your game is now ready for the world! 🌍🐦
