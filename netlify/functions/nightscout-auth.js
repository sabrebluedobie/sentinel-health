const fetch = require('node-fetch');
const crypto = require('crypto');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { nightscoutUrl, apiSecret } = JSON.parse(event.body);

    if (!nightscoutUrl || !apiSecret) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing nightscoutUrl or apiSecret' })
      };
    }

    // Hash the API secret (Nightscout uses SHA1)
    const hashedSecret = crypto
      .createHash('sha1')
      .update(apiSecret)
      .digest('hex');

    // Test the connection by fetching status
    const response = await fetch(`${nightscoutUrl}/api/v1/status`, {
      headers: {
        'API-SECRET': hashedSecret,
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
          error: 'Authentication failed',
          details: 'Invalid Nightscout URL or API Secret'
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
        success: true,
        token: hashedSecret,
        nightscoutUrl,
        status
      })
    };

  } catch (error) {
    console.error('Nightscout auth error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Authentication failed',
        details: error.message 
      })
    };
  }
};