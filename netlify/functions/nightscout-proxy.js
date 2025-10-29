const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { nightscoutUrl, endpoint, method = 'GET', body, token } = JSON.parse(event.body || '{}');

    if (!nightscoutUrl || !endpoint) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing nightscoutUrl or endpoint' })
      };
    }

    // Build the full URL
    const url = `${nightscoutUrl}${endpoint}`;
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Add authentication if token is provided
    if (token) {
      headers['API-SECRET'] = token;
    }

    // Make the request to Nightscout
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Nightscout proxy error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to proxy request to Nightscout',
        details: error.message 
      })
    };
  }
};