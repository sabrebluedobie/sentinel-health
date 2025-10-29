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

    if (!nightscoutUrl) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing nightscoutUrl' })
      };
    }

    const testResults = {
      url: nightscoutUrl,
      tests: []
    };

    // Test 1: Basic connectivity
    try {
      const basicTest = await fetch(`${nightscoutUrl}/api/v1/status`, {
        headers: { 'Accept': 'application/json' }
      });
      
      testResults.tests.push({
        name: 'Basic Connectivity',
        passed: basicTest.ok,
        status: basicTest.status,
        message: basicTest.ok ? 'Successfully connected to Nightscout' : 'Failed to connect'
      });

      if (basicTest.ok) {
        const status = await basicTest.json();
        testResults.serverInfo = {
          name: status.name,
          version: status.version,
          apiEnabled: status.apiEnabled
        };
      }
    } catch (error) {
      testResults.tests.push({
        name: 'Basic Connectivity',
        passed: false,
        message: `Connection error: ${error.message}`
      });
    }

    // Test 2: Authentication (if API secret provided)
    if (apiSecret) {
      try {
        const hashedSecret = crypto
          .createHash('sha1')
          .update(apiSecret)
          .digest('hex');

        const authTest = await fetch(`${nightscoutUrl}/api/v1/treatments?count=1`, {
          headers: {
            'API-SECRET': hashedSecret,
            'Accept': 'application/json'
          }
        });

        testResults.tests.push({
          name: 'Authentication',
          passed: authTest.ok,
          status: authTest.status,
          message: authTest.ok ? 'API Secret is valid' : 'API Secret is invalid'
        });

        // Test 3: Write permissions
        if (authTest.ok) {
          const writeTest = await fetch(`${nightscoutUrl}/api/v1/treatments`, {
            method: 'POST',
            headers: {
              'API-SECRET': hashedSecret,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify([{
              eventType: 'Note',
              notes: 'Sentinel Health Test Entry (will be deleted)',
              created_at: new Date().toISOString(),
              enteredBy: 'Sentinel Health Test'
            }])
          });

          testResults.tests.push({
            name: 'Write Permissions',
            passed: writeTest.ok,
            status: writeTest.status,
            message: writeTest.ok ? 'Can write to Nightscout' : 'Cannot write to Nightscout'
          });

          // Clean up test entry
          if (writeTest.ok) {
            const created = await writeTest.json();
            if (created[0] && created[0]._id) {
              await fetch(`${nightscoutUrl}/api/v1/treatments/${created[0]._id}`, {
                method: 'DELETE',
                headers: {
                  'API-SECRET': hashedSecret
                }
              });
            }
          }
        }
      } catch (error) {
        testResults.tests.push({
          name: 'Authentication',
          passed: false,
          message: `Auth error: ${error.message}`
        });
      }
    }

    const allPassed = testResults.tests.every(test => test.passed);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: allPassed,
        results: testResults
      })
    };

  } catch (error) {
    console.error('Nightscout test error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Test failed',
        details: error.message 
      })
    };
  }
};