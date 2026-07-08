/**
 * GOOGLE ANALYTICS API BADGE COUNTER
 *
 * Serverless function to fetch total badge usage count from Google Analytics 4.
 * Deploy to Vercel or any Node based serverless platform.
 *
 * Environment variables:
 * - GA_PROPERTY_ID
 * - GA_SERVICE_ACCOUNT_EMAIL
 * - GA_PRIVATE_KEY
 */

const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID;
const GA_SERVICE_ACCOUNT_EMAIL = process.env.GA_SERVICE_ACCOUNT_EMAIL;
const GA_PRIVATE_KEY = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, '\n');
const CACHE_DURATION = 300;
const BADGE_USAGE_EVENTS = ['code_copied', 'image_copied'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Cache-Control', `public, s-maxage=${CACHE_DURATION}`);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const count = await fetchBadgeCountFromGA();

    return res.status(200).json({
      count,
      timestamp: new Date().toISOString(),
      cached: CACHE_DURATION
    });
  } catch (error) {
    console.error('Error fetching GA badge count:', error);
    return res.status(500).json({
      error: 'Badge count unavailable'
    });
  }
}

async function fetchBadgeCountFromGA() {
  validateConfig();

  const accessToken = await getGoogleAccessToken();
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`;

  const requestBody = {
    dateRanges: [{ startDate: '2024-01-01', endDate: 'today' }],
    dimensions: [],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: {
          values: BADGE_USAGE_EVENTS
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
  const value = data.rows?.[0]?.metricValues?.[0]?.value ?? '0';
  const count = Number.parseInt(value, 10);

  return Number.isFinite(count) ? count : 0;
}

function validateConfig() {
  const missing = [];
  if (!GA_PROPERTY_ID) missing.push('GA_PROPERTY_ID');
  if (!GA_SERVICE_ACCOUNT_EMAIL) missing.push('GA_SERVICE_ACCOUNT_EMAIL');
  if (!GA_PRIVATE_KEY) missing.push('GA_PRIVATE_KEY');

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

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
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
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
  const signature = await signRS256(signatureInput, GA_PRIVATE_KEY);
  const encodedSignature = base64UrlEncode(signature);

  return `${signatureInput}.${encodedSignature}`;
}

function base64UrlEncode(value) {
  const base64 = Buffer.from(value).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function signRS256(data, privateKey) {
  const crypto = await import('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(privateKey);
}
