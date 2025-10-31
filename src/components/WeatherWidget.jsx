// src/components/WeatherWidget.jsx
import React, { useState, useEffect } from 'react';

export default function WeatherWidget({ onWeatherData }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_KEY = 'PMBU4ECCRULKU76FPV2324N8S';

  useEffect(() => {
    getCurrentLocationWeather();
  }, []);

  const fetchWeather = async (loc) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(loc)}/today?unitGroup=us&key=${API_KEY}&include=current&elements=datetime,temp,feelslike,humidity,precip,precipprob,windspeed,pressure,cloudcover,conditions`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      const current = data.currentConditions;
      
      const weatherData = {
        location: data.resolvedAddress,
        temp: current.temp,
        feelsLike: current.feelslike,
        humidity: current.humidity,
        pressure: current.pressure,
        precipProb: current.precipprob,
        precip: current.precip,
        windSpeed: current.windspeed,
        cloudCover: current.cloudcover,
        conditions: current.conditions,
        timestamp: new Date().toISOString()
      };
      
      setWeather(weatherData);
      setLoading(false);
      
      if (onWeatherData) {
        onWeatherData(weatherData);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getCurrentLocationWeather = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(`${latitude},${longitude}`);
      },
      (err) => {
        setError('Could not get location');
        setLoading(false);
      }
    );
  };

  if (loading) {
    return (
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-sm text-blue-800">Getting weather data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
        <p className="text-sm text-yellow-800">
          Could not fetch weather. {error}
        </p>
        <button
          onClick={getCurrentLocationWeather}
          className="mt-2 text-sm text-yellow-900 underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Current Weather
          </h3>
          <p className="text-xs text-zinc-600 mt-0.5">
            Location: {weather.location}
          </p>
        </div>
        <button
          onClick={getCurrentLocationWeather}
          className="text-xs text-blue-700 hover:text-blue-900 underline"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/60 rounded-md p-2.5">
          <p className="text-xs text-zinc-600 mb-1">Temperature</p>
          <p className="text-lg font-bold text-zinc-900">
            {Math.round(weather.temp)}°F
          </p>
          <p className="text-xs text-zinc-500">
            Feels {Math.round(weather.feelsLike)}°F
          </p>
        </div>

        <div className="bg-amber-100 rounded-md p-2.5 ring-2 ring-amber-300">
          <p className="text-xs text-amber-900 mb-1 font-medium">
            Pressure
          </p>
          <p className="text-lg font-bold text-amber-900">
            {weather.pressure} mb
          </p>
          <p className="text-xs text-amber-700">Barometric</p>
        </div>

        <div className="bg-white/60 rounded-md p-2.5">
          <p className="text-xs text-zinc-600 mb-1">Humidity</p>
          <p className="text-lg font-bold text-zinc-900">
            {weather.humidity}%
          </p>
        </div>

        <div className="bg-white/60 rounded-md p-2.5">
          <p className="text-xs text-zinc-600 mb-1">Conditions</p>
          <p className="text-sm font-semibold text-zinc-900">
            {weather.conditions}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-blue-200 flex items-center justify-between text-xs text-zinc-600">
        <span>Wind: {Math.round(weather.windSpeed)} mph</span>
        <span>Clouds: {weather.cloudCover}%</span>
        {weather.precipProb > 0 && (
          <span>Rain: {weather.precipProb}%</span>
        )}
      </div>

      <p className="text-xs text-zinc-500 mt-2 text-center">
        Weather data automatically saved with this migraine entry
      </p>
    </div>
  );
}