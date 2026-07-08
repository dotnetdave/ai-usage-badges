# Badge Counter API

Serverless functions for fetching total badge usage count from Google Analytics 4.

The API counts the badge copy events used by the demo page:

- `code_copied`
- `image_copied`

## Required environment variables

- `GA_PROPERTY_ID`: Numeric GA4 property ID from GA Admin
- `GA_SERVICE_ACCOUNT_EMAIL`: Service account email
- `GA_PRIVATE_KEY`: Private key from the service account JSON key, including the BEGIN and END lines

## Google Analytics setup

1. Go to Google Cloud Console.
2. Create a new project or select an existing project.
3. Enable **Google Analytics Data API**.
4. Go to **IAM & Admin** → **Service Accounts**.
5. Create a service account with Analytics Viewer access.
6. Create and download a JSON key.
7. In your GA4 property, add the service account email with Viewer permissions.

## Vercel deployment

Use `api/badge-count.js` for Vercel or another Node based serverless platform.

```bash
vercel env add GA_PROPERTY_ID
vercel env add GA_SERVICE_ACCOUNT_EMAIL
vercel env add GA_PRIVATE_KEY
vercel
```

The default front-end endpoint is:

```js
const ANALYTICS_API_ENDPOINT = '/api/badge-count';
```

Change it in `index.html` only if the API is hosted on another domain.

## Cloudflare Workers deployment

Use `api/cloudflare-worker.js` for Cloudflare Workers.

1. Create a Worker.
2. Add the three required environment variables.
3. Deploy the Worker script.
4. Update `ANALYTICS_API_ENDPOINT` in `index.html` to the Worker URL if it is not hosted under the same domain.

## API response format

```json
{
  "count": 12345,
  "timestamp": "2026-01-31T12:00:00.000Z",
  "cached": 300
}
```

If the analytics call fails, the public API response is intentionally generic:

```json
{
  "error": "Badge count unavailable"
}
```

Detailed errors are logged server-side only.

## Caching

Responses are cached for 5 minutes by default. Adjust `CACHE_DURATION` in the function code.

## Local testing

```bash
npm install
vercel dev
curl http://localhost:3000/api/badge-count
```

## Troubleshooting

**Error: Badge count unavailable**

Check the server logs. Common causes:

- Missing environment variables
- Incorrect GA4 property ID
- Service account missing Viewer permissions in GA4
- Google Analytics Data API not enabled
- Private key not copied with the BEGIN and END lines

**Count shows 0**

- Events may not be tracked yet.
- Verify that event names match `code_copied` and `image_copied`.
- Check the date range in the query. It currently starts from `2024-01-01`.
