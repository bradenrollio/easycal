export async function onRequest(context) {
  const { request } = context;
  
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    console.log('Callback received with code:', code ? 'present' : 'missing');
    console.log('State:', state);
    
    if (!code) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Error</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; background: #fef2f2; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Authorization Error</h1>
            <p>No authorization code received.</p>
          </div>
        </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // In a real implementation, we would:
    // 1. Exchange the code for access tokens
    // 2. Store the tokens in our database
    // 3. Redirect to the main app
    
    // For now, just show success
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authorization Successful</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 50px; }
          .success { color: #059669; background: #f0fdf4; padding: 20px; border-radius: 8px; }
          .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="success">
          <h1>✓ Authorization Successful!</h1>
          <p>You have successfully connected your GoHighLevel account to EasyCal.</p>
          <p><strong>Authorization Code:</strong> ${code.substring(0, 10)}...</p>
          <a href="/" class="btn">Go to App</a>
        </div>
      </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
    
  } catch (error) {
    console.error('Callback error:', error);
    
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Callback Error</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc2626; background: #fef2f2; padding: 20px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>Callback Error</h1>
          <p>${error.message}</p>
        </div>
      </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
