// api/weather/fetch.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const weatherApiKey = process.env.VISUAL_CROSSING_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

if (!weatherApiKey) {
  throw new Error('Missing Visual Crossing API key');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { user_id, location, date } = req.body;

    if (!user_id || !location) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id and location are required' 
      });
    }

    // Use provided date or current date
    const targetDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Build Visual Crossing API URL
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}/${targetDate}?unitGroup=us&contentType=json&key=${weatherApiKey}`;

    console.log(`Fetching weather for ${location} on ${targetDate}`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Visual Crossing API error:', response.status, errorText);
      return res.status(response.status).json({ 
        success: false,
        error: 'Failed to fetch weather data',
        details: errorText
      });
    }

    const weatherData = await response.json();
    console.log('Weather data received:', weatherData.resolvedAddress);

    // Get the day's data (Visual Crossing returns an array of days)
    const dayData = weatherData.days && weatherData.days[0];

    if (!dayData) {
      return res.status(404).json({ 
        success: false,
        error: 'No weather data available for this date'
      });
    }

    // Prepare weather record for database
    const weatherRecord = {
      user_id: user_id,
      location: weatherData.resolvedAddress || location,
      latitude: weatherData.latitude || null,
      longitude: weatherData.longitude || null,
      timestamp: new Date(`${dayData.datetime}T12:00:00Z`).toISOString(), // Noon on that day
      
      // Temperature
      temp: dayData.temp || null,
      feels_like: dayData.feelslike || null,
      temp_min: dayData.tempmin || null,
      temp_max: dayData.tempmax || null,
      
      // Pressure (critical for migraines!)
      pressure: dayData.pressure || null,
      
      // Other factors
      humidity: dayData.humidity || null,
      cloud_cover: dayData.cloudcover || null,
      wind_speed: dayData.windspeed || null,
      precipitation: dayData.precip || null,
      
      // Conditions
      conditions: dayData.conditions || null,
      description: dayData.description || null
    };

    // Save to database (upsert to avoid duplicates)
    const { data: savedWeather, error: dbError } = await supabase
      .from('weather_data')
      .upsert(weatherRecord, {
        onConflict: 'user_id,timestamp,location',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to save weather data',
        details: dbError.message 
      });
    }

    console.log('Weather data saved to database');

    return res.status(200).json({ 
      success: true,
      weather: savedWeather,
      summary: {
        location: weatherRecord.location,
        temp: weatherRecord.temp,
        feels_like: weatherRecord.feels_like,
        conditions: weatherRecord.conditions,
        pressure: weatherRecord.pressure,
        humidity: weatherRecord.humidity
      }
    });

  } catch (error) {
    console.error('Weather fetch error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Weather fetch failed',
      details: error.message 
    });
  }
}