// src/components/WeatherTest.jsx
import React, { useState } from 'react';

export default function WeatherTest() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState('');

  const API_KEY = 'PMBU4ECCRULKU76FPV2324N8S';

  const fetchWeather = async (loc) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(loc)}/today?unitGroup=us&key=${API_KEY}&include=current&elements=datetime,temp,feelslike,humidity,precip,precipprob,snow,windspeed,windgust,pressure,cloudcover,conditions,icon`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const current = data.currentConditions;
      
      setWeather({
        location: data.resolvedAddress,
        datetime: current.datetime,
        temp: current.temp,
        feelsLike: current.feelslike,
        humidity: current.humidity,
        pressure: current.pressure,
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (location.trim()) {
      fetchWeather(location.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-5">
      <h1 className="text-2xl font-bold mb-5">Weather Test</h1>

      <div className="mb-5">
        <form onSubmit={handleSearch} className="flex gap-2 mb-2">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter city, zip, or address"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <button
            type="submit"
            disabled={loading || !location.trim()}
            className="px-5 py-2 bg-blue-500 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
          >
            Search
          </button>
        </form>

        <button
          onClick={getCurrentLocationWeather}
          disabled={loading}
          className="px-5 py-2 bg-green-500 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600"
        >
          Use My Location
        </button>
      </div>

      {loading && (
        <div className="p-5 text-center bg-gray-100 rounded-lg">
          <p>Loading weather data...</p>
        </div>
      )}

      {error && (
        <div className="p-5 bg-red-100 text-red-900 rounded-lg mb-5">
          <p className="font-medium mb-0">Error:</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {weather && !loading && (
        <div className="border border-gray-200 rounded-xl p-5 bg-white">
          <div className="mb-5 text-center">
            <h2 className="text-xl font-semibold mb-1">{weather.location}</h2>
            <p className="text-base text-gray-600 mb-2">{weather.conditions}</p>
            <div className="text-5xl font-bold text-gray-900">
              {Math.round(weather.temp)}°F
            </div>
            <p className="text-sm text-gray-500">
              Feels like {Math.round(weather.feelsLike)}°F
            </p>
          </div>

          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 mb-5">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2 uppercase tracking-wide">
              Migraine Factors
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-yellow-800 mb-1">Barometric Pressure</p>
                <p className="text-lg font-semibold text-yellow-900">
                  {weather.pressure} mb
                </p>
              </div>
              <div>
                <p className="text-xs text-yellow-800 mb-1">Humidity</p>
                <p className="text-lg font-semibold text-yellow-900">
                  {weather.humidity}%
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1 font-medium">Wind Speed</p>
              <p className="text-base font-semibold text-gray-900">
                {weather.windSpeed} mph
              </p>
              {weather.windGust > weather.windSpeed && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Gusts: {weather.windGust} mph
                </p>
              )}
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1 font-medium">Cloud Cover</p>
              <p className="text-base font-semibold text-gray-900">
                {weather.cloudCover}%
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1 font-medium">Precip Chance</p>
              <p className="text-base font-semibold text-gray-900">
                {weather.precipProb}%
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1 font-medium">Precipitation</p>
              <p className="text-base font-semibold text-gray-900">
                {weather.precip > 0 ? `${weather.precip} in` : 'None'}
              </p>
              {weather.snow > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Snow: {weather.snow} in
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">Last updated: {weather.datetime}</p>
          </div>
        </div>
      )}

      {!weather && !loading && !error && (
        <div className="p-5 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            Search for a location or use your current location to see weather data including barometric pressure - critical for migraine tracking!
          </p>
        </div>
      )}
    </div>
  );
}