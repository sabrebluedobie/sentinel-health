// src/components/WeatherTest.jsx
import React, { useState, useEffect } from 'react';

export default function WeatherTest() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState('');

  // Visual Crossing API key
  const API_KEY = 'PMBU4ECCRULKU76FPV2324N8S';

  // Fetch weather data for a given location
  const fetchWeather = async (loc) => {
    setLoading(true);
    setError(null);
    
    try {
      // Visual Crossing Timeline API endpoint
      const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(loc)}/today?unitGroup=us&key=${API_KEY}&include=current&elements=datetime,temp,feelslike,humidity,precip,precipprob,snow,windspeed,windgust,pressure,cloudcover,conditions,icon`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract current conditions
      const current = data.currentConditions;
      
      setWeather({
        location: data.resolvedAddress,
        datetime: current.datetime,
        temp: current.temp,
        feelsLike: current.feelslike,
        humidity: current.humidity,
        pressure: current.pressure, // in millibars (mb)
        precipProb: current.precipprob,
        precip: current.precip,
        snow: current.snow,
        windSpeed: current.windspeed,
        windGust: current.windgust,
        cloudCover: current.cloudcover,
        conditions: current.conditions,
        icon: current.icon
      });
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Get user's location automatically using browser geolocation
  const getCurrentLocationWeather = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(`${latitude},${longitude}`);
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setLoading(false);
      }
    );
  };

  // Handle manual location search
  const handleSearch = (e) => {
    e.preventDefault();
    if (location.trim()) {
      fetchWeather(location.trim());
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Weather Test
      </h1>

      {/* Location Search */}
      <div style={{ marginBottom: 20 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter city, zip, or address"
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14
            }}
          />
          <button
            type="submit"
            disabled={loading || !location.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading || !location.trim() ? 0.5 : 1
            }}
          >
            Search
          </button>
        </form>

        <button
          onClick={getCurrentLocationWeather}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          📍 Use My Location
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ 
          padding: 20, 
          textAlign: 'center', 
          backgroundColor: '#f3f4f6', 
          borderRadius: 8 
        }}>
          <p>Loading weather data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{ 
          padding: 20, 
          backgroundColor: '#fee2e2', 
          color: '#991b1b', 
          borderRadius: 8,
          marginBottom: 20
        }}>
          <p style={{ margin: 0, fontWeight: 500 }}>Error:</p>
          <p style={{ margin: '5px 0 0 0', fontSize: 14 }}>{error}</p>
        </div>
      )}

      {/* Weather Display */}
      {weather && !loading && (
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: 12, 
          padding: 20,
          backgroundColor: 'white'
        }}>
          {/* Location & Conditions */}
          <div style={{ marginBottom: 20, textAlign: 'center' }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 5 }}>
              {weather.location}
            </h2>
            <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 10 }}>
              {weather.conditions}
            </p>
            <div style={{ fontSize: 48, fontWeight: 'bold', color: '#1f2937' }}>
              {Math.round(weather.temp)}°F
            </div>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>
              Feels like {Math.round(weather.feelsLike)}°F
            </p>
          </div>

          {/* Migraine-Critical Data */}
          <div style={{ 
            backgroundColor: '#fef3c7', 
            border: '2px solid #f59e0b',
            borderRadius: 8, 
            padding: 15, 
            marginBottom: 20 
          }}>
            <h3 style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: '#92400e', 
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              🎯 Migraine Factors
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <p style={{ fontSize: 12, color: '#78350f', marginBottom: 2 }}>
                  Barometric Pressure
                </p>
                <p style={{ fontSize: 18, fontWeight: 600, color: '#92400e', margin: 0 }}>
                  {weather.pressure} mb
                </p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#78350f', marginBottom: 2 }}>
                  Humidity
                </p>
                <p style={{ fontSize: 18, fontWeight: 600, color: '#92400e', margin: 0 }}>
                  {weather.humidity}%
                </p>
              </div>
            </div>
          </div>

          {/* Additional Weather Data */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: 15 
          }}>
            {/* Wind */}
            <div style={{ 
              padding: 12, 
              backgroundColor: '#f9fafb', 
              borderRadius: 8 
            }}>
              <p style={{ 
                fontSize: 12, 
                color: '#6b7280', 
                marginBottom: 4,
                fontWeight: 500 
              }}>
                💨 Wind Speed
              </p>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', margin: 0 }}>
                {weather.windSpeed} mph
              </p>
              {weather.windGust > weather.windSpeed && (
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0 0' }}>
                  Gusts: {weather.windGust} mph
                </p>
              )}
            </div>

            {/* Cloud Cover */}
            <div style={{ 
              padding: 12, 
              backgroundColor: '#f9fafb', 
              borderRadius: 8 
            }}>
              <p style={{ 
                fontSize: 12, 
                color: '#6b7280', 
                marginBottom: 4,
                fontWeight: 500 
              }}>
                ☁️ Cloud Cover
              </p>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', margin: 0 }}>
                {weather.cloudCover}%
              </p>
            </div>

            {/* Precipitation Probability */}
            <div style={{ 
              padding: 12, 
              backgroundColor: '#f9fafb', 
              borderRadius: 8 
            }}>
              <p style={{ 
                fontSize: 12, 
                color: '#6b7280', 
                marginBottom: 4,
                fontWeight: 500 
              }}>
                🌧️ Precip Chance
              </p>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', margin: 0 }}>
                {weather.precipProb}%
              </p>
            </div>

            {/* Actual Precipitation */}
            <div style={{ 
              padding: 12, 
              backgroundColor: '#f9fafb', 
              borderRadius: 8 
            }}>
              <p style={{ 
                fontSize: 12, 
                color: '#6b7280', 
                marginBottom: 4,
                fontWeight: 500 
              }}>
                💧 Precipitation
              </p>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', margin: 0 }}>
                {weather.precip > 0 ? `${weather.precip} in` : 'None'}
              </p>
              {weather.snow > 0 && (
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0 0' }}>
                  ❄️ Snow: {weather.snow} in
                </p>
              )}
            </div>
          </div>

          {/* Timestamp */}
          <div style={{ 
            marginTop: 15, 
            paddingTop: 15, 
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center' 
          }}>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
              Last updated: {weather.datetime}
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!weather && !loading && !error && (
        <div style={{ 
          padding: 20, 
          backgroundColor: '#f0f9ff', 
          borderRadius: 8,
          border: '1px solid #bae6fd'
        }}>
          <p style={{ margin: 0, color: '#0c4a6e', fontSize: 14 }}>
            👆 Search for a location or use your current location to see weather data including barometric pressure - critical for migraine tracking!
          </p>
        </div>
      )}
    </div>
  );
}
`
}