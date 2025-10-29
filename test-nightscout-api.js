// test-nightscout-api.js
// Test script for Nightscout API endpoints
// Run with: node test-nightscout-api.js

const BASE_URL = 'http://localhost:3000'; // Change to your API URL
const TEST_TOKEN = 'YOUR_SUPABASE_JWT_TOKEN'; // Get from Supabase auth

// Test data
const testConfig = {
  nightscout_url: 'https://yoursite.herokuapp.com',
  api_secret: 'your-api-secret-here' // At least 12 characters
};

async function testAPI() {
  console.log('🧪 Testing Nightscout API Endpoints...\n');

  try {
    // Test 1: Save Connection
    console.log('1️⃣ Testing POST /api/nightscout/connection');
    const saveResponse = await fetch(`${BASE_URL}/api/nightscout/connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify(testConfig)
    });
    const saveResult = await saveResponse.json();
    console.log('✅ Result:', saveResult, '\n');

    // Test 2: Get Connection
    console.log('2️⃣ Testing GET /api/nightscout/get-connection');
    const getResponse = await fetch(`${BASE_URL}/api/nightscout/get-connection`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    const getResult = await getResponse.json();
    console.log('✅ Result:', getResult, '\n');

    // Test 3: Test Connection
    console.log('3️⃣ Testing GET /api/nightscout/test');
    const testResponse = await fetch(`${BASE_URL}/api/nightscout/test`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    const testResult = await testResponse.json();
    console.log('✅ Result:', testResult, '\n');

    // Test 4: Save Glucose Reading
    console.log('4️⃣ Testing POST /api/nightscout/save (glucose)');
    const glucoseResponse = await fetch(`${BASE_URL}/api/nightscout/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify({
        kind: 'glucose',
        value_mgdl: 120,
        time: new Date().toISOString(),
        reading_type: 'sgv',
        trend: 'Flat',
        note: 'Test reading from Sentrya'
      })
    });
    const glucoseResult = await glucoseResponse.json();
    console.log('✅ Result:', glucoseResult, '\n');

    // Test 5: Save Migraine
    console.log('5️⃣ Testing POST /api/nightscout/save (migraine)');
    const migraineResponse = await fetch(`${BASE_URL}/api/nightscout/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify({
        kind: 'migraine',
        start_time: new Date().toISOString(),
        severity: 7,
        triggers: 'Weather, Stress',
        meds_taken: 'Sumatriptan',
        notes: 'Test migraine entry'
      })
    });
    const migraineResult = await migraineResponse.json();
    console.log('✅ Result:', migraineResult, '\n');

    // Test 6: Save Note
    console.log('6️⃣ Testing POST /api/nightscout/save (note)');
    const noteResponse = await fetch(`${BASE_URL}/api/nightscout/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify({
        kind: 'note',
        title: 'Test Note',
        notes: 'This is a test note from Sentrya API',
        start_time: new Date().toISOString()
      })
    });
    const noteResult = await noteResponse.json();
    console.log('✅ Result:', noteResult, '\n');

    // Test 7: Sync Entries
    console.log('7️⃣ Testing GET /api/nightscout/sync?count=10');
    const syncResponse = await fetch(`${BASE_URL}/api/nightscout/sync?count=10`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    const syncResult = await syncResponse.json();
    console.log('✅ Result:', syncResult, '\n');

    console.log('✨ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testAPI();
