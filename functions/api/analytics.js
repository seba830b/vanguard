export async function onRequest(context) {
  const { env } = context;

  try {
    // 1. Generate a Google Access Token using Native Web Crypto (No EvalError)
    const accessToken = await getAccessToken(env.GA_CLIENT_EMAIL, env.GA_PRIVATE_KEY);

    // 2. Query the GA4 Data API directly via standard fetch
    const apiResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${env.GA_PROPERTY_ID}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
          dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
          limit: 10
        })
      }
    );

    const report = await apiResponse.json();
    return new Response(JSON.stringify({ success: true, data: report }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// --- HELPER: GOOGLE AUTH WITHOUT LIBRARIES ---
async function getAccessToken(email, privateKey) {
  const pemContents = privateKey.replace(/\\n/g, '\n').replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"]
  );

  const header = b64(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const iat = Math.floor(Date.now() / 1000);
  const payload = b64(JSON.stringify({
    iss: email, sub: email, iat, exp: iat + 3600,
    aud: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/analytics.readonly",
  }));

  const unsignedJwt = `${header}.${payload}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(unsignedJwt));
  const jwt = `${unsignedJwt}.${b64(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await res.json();
  if (!data.access_token) throw new Error(data.error_description || "Auth Failed");
  return data.access_token;
}

function b64(src) {
  const buf = typeof src === "string" ? new TextEncoder().encode(src) : new Uint8Array(src);
  return btoa(String.fromCharCode(...buf)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}