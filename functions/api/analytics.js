import { BetaAnalyticsDataClient } from '@google-analytics/data';

export async function onRequest(context) {
  // Cloudflare passes environment variables via context.env
  const { env } = context;

  try {
    // 1. Authenticate with Google securely using your hidden keys
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: env.GA_CLIENT_EMAIL,
        // The regex replaces the literal string "\n" with actual line breaks 
        // which Google's security parser requires.
        private_key: env.GA_PRIVATE_KEY.replace(/\\n/g, '\n'), 
      }
    });

    // 2. Ask Google for the data (Last 30 days)
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${env.GA_PROPERTY_ID}`,
      dateRanges: [
        { startDate: '30daysAgo', endDate: 'today' },
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'userEngagementDuration' },
        { name: 'screenPageViews' }
      ],
      dimensions: [
        { name: 'pageTitle' },
        { name: 'pagePath' }
      ],
      // Limit to your top 10 pages
      limit: 10,
    });

    // 3. Send the response back to your React app
    return new Response(JSON.stringify({ success: true, data: response }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // If something breaks, tell us what happened
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}