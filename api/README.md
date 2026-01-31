# Badge Counter API

Serverless function to fetch total badge usage count from Google Analytics 4.

## Quick Start

### 1. Set Up Google Analytics 4

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google Analytics Data API**
4. Go to **IAM & Admin** → **Service Accounts**
5. Create service account with **Analytics Viewer** role
6. Create JSON key and download it
7. In your GA4 property, add the service account email with **Viewer** permissions

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard or CLI:
vercel env add GA_PROPERTY_ID
vercel env add GA_SERVICE_ACCOUNT_EMAIL
vercel env add GA_PRIVATE_KEY
```

**Environment Variables:**
- `GA_PROPERTY_ID`: Your GA4 property ID (find in GA Admin → Property Settings)
- `GA_SERVICE_ACCOUNT_EMAIL`: Email from service account JSON key
- `GA_PRIVATE_KEY`: Private key from service account JSON key (entire key including BEGIN/END lines)

### 3. Update index.html

Replace the API endpoint URL:

```javascript
const ANALYTICS_API_ENDPOINT = 'https://your-project.vercel.app/api/badge-count';
```

## Alternative: Cloudflare Workers

Create a Cloudflare Worker with this code:

```javascript
export default {
  async fetch(request, env) {
    // Same logic as badge-count.js but using env.GA_PROPERTY_ID, etc.
    // See Cloudflare Workers documentation for environment variables
  }
}
```

## Alternative: Netlify Functions

1. Create `netlify/functions/badge-count.js`
2. Use same code as `api/badge-count.js`
3. Set environment variables in Netlify dashboard
4. API URL will be: `https://your-site.netlify.app/.netlify/functions/badge-count`

## Alternative: Simple Manual Updates

If you don't want a live API, just update the count manually:

1. Check Google Analytics dashboard weekly/monthly
2. Sum `code_copied` + `image_copied` events
3. Update `TOTAL_BADGE_USES` in index.html:
   ```javascript
   const TOTAL_BADGE_USES = 12345; // Your actual count
   ```

## API Response Format

```json
{
  "count": 12345,
  "timestamp": "2024-01-31T12:00:00.000Z",
  "cached": 300
}
```

## Caching

The API caches responses for 5 minutes (300 seconds) by default. Adjust `CACHE_DURATION` in the function code.

## Testing Locally

```bash
# Install dependencies
npm install

# Run Vercel dev server
vercel dev

# Test endpoint
curl http://localhost:3000/api/badge-count
```

## Troubleshooting

**Error: Missing environment variables**
- Ensure all three env vars are set: GA_PROPERTY_ID, GA_SERVICE_ACCOUNT_EMAIL, GA_PRIVATE_KEY

**Error: 403 Forbidden**
- Service account needs Viewer permissions in GA4 property
- Check that Analytics Data API is enabled in Google Cloud Console

**Error: 404 Not Found**
- Verify GA_PROPERTY_ID is correct (numeric ID from GA Admin)

**Count shows 0**
- Events may not be tracked yet (wait for some badge copies)
- Verify event names match: `code_copied` and `image_copied`
- Check date range in query (currently starts from 2024-01-01)
