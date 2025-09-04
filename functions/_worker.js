export default {
  async fetch(request, env, ctx) {
    // Import the Next.js server
    const { default: server } = await import('../.next/standalone/server.js');
    
    // Create a new request with the environment variables
    const modifiedRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    // Set environment variables on globalThis for the Next.js app
    globalThis.DB = env.DB;
    globalThis.EASYCAL_SESSIONS = env.EASYCAL_SESSIONS;
    globalThis.EASYCAL_JOBS = env.EASYCAL_JOBS;
    
    // Set process.env for Next.js
    process.env.APP_BASE_URL = env.APP_BASE_URL;
    process.env.HL_CLIENT_ID = env.HL_CLIENT_ID;
    process.env.HL_CLIENT_SECRET = env.HL_CLIENT_SECRET;
    process.env.HL_PIT = env.HL_PIT;
    process.env.SESSION_SECRET = env.SESSION_SECRET;
    process.env.ENCRYPTION_KEY = env.ENCRYPTION_KEY;
    process.env.D1_BINDING = 'DB';
    process.env.KV_BINDING = 'EASYCAL_SESSIONS';
    process.env.QUEUE_BINDING = 'EASYCAL_JOBS';
    
    // Call the Next.js server
    return server(modifiedRequest);
  }
};
