const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { nightscoutUrl, token } = event.queryStringParameters;

    if (!nightscoutUrl || !token) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing nightscoutUrl or token' })
      };
    }

    // Verify the connection is still valid
    const response = await fetch(`${nightscoutUrl}/api/v1/status`, {
      headers: {
        'API-SECRET': token,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Connection invalid',
          details: 'Token or URL may have changed'
        })
      };
    }

    const status = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        connected: true,
        serverName: status.name || 'Nightscout',
        version: status.version,
        apiEnabled: status.apiEnabled,
        nightscoutUrl
      })
    };

  } catch (error) {
    console.error('Nightscout get connection error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to verify connection',
        details: error.message 
      })
    };
  }
};