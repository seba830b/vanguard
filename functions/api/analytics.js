export async function onRequest(context) {
  const { env } = context;

  try {
    const accessToken = await getGoogleToken(env.GA_CLIENT_EMAIL, env.GA_PRIVATE_KEY);

    const apiRes = await fetch(
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

    const data = await apiRes.json();
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function getGoogleToken(email, privateKey) {
  const cleanKey = privateKey.replace(/\\n/g, '\n').replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const der = Uint8Array.from(atob(cleanKey), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8", der,
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

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${payload}`));
  const jwt = `${header}.${payload}.${b64(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const d = await res.json();
  return d.access_token;
}

function b64(s) {
  const b = typeof s === "string" ? new TextEncoder().encode(s) : new Uint8Array(s);
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}