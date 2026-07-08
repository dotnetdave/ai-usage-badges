/**
 * CLOUDFLARE WORKERS VERSION
 *
 * Deploy to Cloudflare Workers for edge performance and a small public badge count API.
 *
 * Environment variables:
 * - GA_PROPERTY_ID
 * - GA_SERVICE_ACCOUNT_EMAIL
 * - GA_PRIVATE_KEY
 */

const CACHE_DURATION = 300;
const BADGE_USAGE_EVENTS = ['code_copied', 'image_copied'];

export default {
  async fetch(request, env) {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${CACHE_DURATION}`
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...headers, Allow: 'GET, OPTIONS' }
      });
    }

    try {
      const count = await fetchBadgeCountFromGA(env);

      return new Response(JSON.stringify({
        count,
        timestamp: new Date().toISOString(),
        cached: CACHE_DURATION
      }), {
        status: 200,
        headers
      });
    } catch (error) {
      console.error('Error fetching GA badge count:', error);
      return new Response(JSON.stringify({
        error: 'Badge count unavailable'
      }), {
        status: 500,
        headers
      });
    }
  }
};

async function fetchBadgeCountFromGA(env) {
  validateConfig(env);

  const accessToken = await getGoogleAccessToken(env);
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${env.GA_PROPERTY_ID}:runReport`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
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
    })
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

function validateConfig(env) {
  const missing = [];
  if (!env.GA_PROPERTY_ID) missing.push('GA_PROPERTY_ID');
  if (!env.GA_SERVICE_ACCOUNT_EMAIL) missing.push('GA_SERVICE_ACCOUNT_EMAIL');
  if (!env.GA_PRIVATE_KEY) missing.push('GA_PRIVATE_KEY');

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

async function getGoogleAccessToken(env) {
  const jwt = await createJWT(env);

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

async function createJWT(env) {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: env.GA_SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaim = base64UrlEncode(JSON.stringify(claim));
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  const privateKey = await importPrivateKey(env.GA_PRIVATE_KEY);
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  return `${signatureInput}.${encodedSignature}`;
}

async function importPrivateKey(pemKey) {
  const pemContents = pemKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\\n/g, '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

function base64UrlEncode(data) {
  let base64;
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    base64 = btoa(String.fromCharCode(...data));
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
