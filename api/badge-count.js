/**
 * GOOGLE ANALYTICS API BADGE COUNTER
 *
 * Serverless function to fetch total badge usage count from Google Analytics 4.
 * Deploy to Vercel, Cloudflare Workers, or any serverless platform.
 *
 * SETUP INSTRUCTIONS:
 * 1. Enable Google Analytics Data API in Google Cloud Console
 * 2. Create a Service Account with Analytics Viewer permissions
 * 3. Download JSON key file
 * 4. Set environment variables (see below)
 * 5. Deploy this function
 * 6. Update ANALYTICS_API_ENDPOINT in index.html to your function URL
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

// Environment variables needed:
// - GA_PROPERTY_ID: Your GA4 property ID (e.g., "123456789")
// - GA_SERVICE_ACCOUNT_EMAIL: Service account email
// - GA_PRIVATE_KEY: Service account private key (from JSON key file)

const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID;
const GA_SERVICE_ACCOUNT_EMAIL = process.env.GA_SERVICE_ACCOUNT_EMAIL;
const GA_PRIVATE_KEY = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Cache duration in seconds (e.g., 300 = 5 minutes)
const CACHE_DURATION = 300;

// ============================================================================
// VERCEL SERVERLESS FUNCTION
// ============================================================================

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', `public, s-maxage=${CACHE_DURATION}`);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const count = await fetchBadgeCountFromGA();

    return res.status(200).json({
      count: count,
      timestamp: new Date().toISOString(),
      cached: CACHE_DURATION
    });
  } catch (error) {
    console.error('Error fetching GA data:', error);
    return res.status(500).json({
      error: 'Failed to fetch analytics data',
      message: error.message
    });
  }
}

// ============================================================================
// GOOGLE ANALYTICS DATA API CLIENT
// ============================================================================

async function fetchBadgeCountFromGA() {
  // Validate environment variables
  if (!GA_PROPERTY_ID || !GA_SERVICE_ACCOUNT_EMAIL || !GA_PRIVATE_KEY) {
    throw new Error('Missing required environment variables for Google Analytics API');
  }

  // Get access token
  const accessToken = await getGoogleAccessToken();

  // Query Google Analytics Data API
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`;

  const requestBody = {
    dateRanges: [{ startDate: '2024-01-01', endDate: 'today' }],
    dimensions: [],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: {
          values: ['code_copied', 'image_copied']
        }
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GA API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Extract total count from response
  if (data.rows && data.rows.length > 0) {
    return parseInt(data.rows[0].metricValues[0].value, 10);
  }

  return 0;
}

// ============================================================================
// GOOGLE OAUTH2 TOKEN GENERATION
// ============================================================================

async function getGoogleAccessToken() {
  const jwt = await createJWT();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!response.ok) {
    throw new Error('Failed to get access token');
  }

  const data = await response.json();
  return data.access_token;
}

async function createJWT() {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const claim = {
    iss: GA_SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaim = base64UrlEncode(JSON.stringify(claim));
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  // Sign with private key (requires crypto library)
  const signature = await signRS256(signatureInput, GA_PRIVATE_KEY);
  const encodedSignature = base64UrlEncode(signature);

  return `${signatureInput}.${encodedSignature}`;
}

function base64UrlEncode(str) {
  const base64 = Buffer.from(str).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function signRS256(data, privateKey) {
  const crypto = await import('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(privateKey);
}
