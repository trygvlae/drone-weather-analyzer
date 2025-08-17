const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Norwegian Meteorological Institute API endpoints
const MET_API_BASE = 'https://api.met.no';
const LOCATIONFORECAST_URL = `${MET_API_BASE}/weatherapi/locationforecast/2.0/compact`;
const FROST_API_BASE = 'https://frost.met.no';

// Helper function to calculate flight days based on weather thresholds
function calculateFlightDays(weatherData, thresholds) {
  const { maxRain, maxWind, maxWindGusts } = thresholds;
  
  return weatherData.filter(day => {
    return (
      day.precipitation <= maxRain &&
      day.windSpeed <= maxWind &&
      day.windGusts <= maxWindGusts
    );
  }).length;
}

// Helper function to calculate standard deviation
function calculateStandardDeviation(values) {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}

// Get location coordinates from place name (using Nominatim API)
app.get('/api/geocode/:placeName', async (req, res) => {
  try {
    const { placeName } = req.params;
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: {
        q: `${placeName}, Norway`,
        format: 'json',
        limit: 5,
        countrycodes: 'no'
      },
      headers: {
        'User-Agent': 'DroneWeatherAnalyzer/1.0'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Geocoding error:', error.message);
    res.status(500).json({ error: 'Failed to geocode location' });
  }
});



// Get historical weather data from Open-Meteo API
async function getHistoricalWeatherData(latitude, longitude, startDate, endDate) {
  const url = `https://archive-api.open-meteo.com/v1/archive`;
  
  const params = {
    latitude: latitude,
    longitude: longitude,
    start_date: startDate,
    end_date: endDate,
    daily: 'precipitation_sum,wind_speed_10m_mean,wind_gusts_10m_max',
    timezone: 'Europe/Oslo'
  };
  
  console.log('Making request to Open-Meteo API with params:', params);
  
  const response = await axios.get(url, { 
    params,
    timeout: 30000, // 30 second timeout
    headers: {
      'User-Agent': 'DroneWeatherAnalyzer/1.0'
    }
  });
  
  console.log('Open-Meteo API response received, data keys:', Object.keys(response.data));
  return response.data;
}

// Get historical weather data and calculate flight days
app.post('/api/analyze-flight-days', async (req, res) => {
  try {
    const { latitude, longitude, thresholds } = req.body;
    
    console.log(`Analyzing flight days for coordinates: ${latitude}, ${longitude}`);
    console.log('Weather thresholds:', thresholds);
    
    // Get 5 years of historical data (more manageable and still statistically significant)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // End yesterday to ensure data availability
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 5);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`Fetching weather data from ${startDateStr} to ${endDateStr}`);
    
    // Validate coordinates
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Invalid coordinates provided');
    }
    
    if (latitude < 58 || latitude > 72 || longitude < 4 || longitude > 32) {
      throw new Error('Coordinates appear to be outside Norway. Please select a location within Norway.');
    }
    
    // Fetch historical weather data from Open-Meteo
    const weatherData = await getHistoricalWeatherData(
      latitude, 
      longitude, 
      startDateStr, 
      endDateStr
    );
    
    if (!weatherData || !weatherData.daily) {
      throw new Error('No weather data received from Open-Meteo API');
    }
    
    if (!weatherData.daily.time || weatherData.daily.time.length === 0) {
      throw new Error('No historical weather data available for this location and time period');
    }
    
    // Process the data year by year
    const yearlyFlightDays = [];
    const dailyData = weatherData.daily;
    
    // Group data by year
    const dataByYear = {};
    
    for (let i = 0; i < dailyData.time.length; i++) {
      const date = new Date(dailyData.time[i]);
      const year = date.getFullYear();
      
      if (!dataByYear[year]) {
        dataByYear[year] = [];
      }
      
      const precipitation = dailyData.precipitation_sum[i] || 0;
      const windSpeed = dailyData.wind_speed_10m_mean[i] || 0;
      const windGusts = dailyData.wind_gusts_10m_max[i] || 0;
      
      dataByYear[year].push({
        precipitation,
        windSpeed,
        windGusts
      });
    }
    
    // Calculate flight days and yearly statistics
    const years = Object.keys(dataByYear).sort();
    let totalDaysAnalyzed = 0;
    const yearlyStatistics = [];
    
    for (const year of years) {
      const yearData = dataByYear[year];
      const flightDays = calculateFlightDays(yearData, thresholds);
      yearlyFlightDays.push(flightDays);
      totalDaysAnalyzed += yearData.length;
      
      // Calculate yearly weather statistics
      const totalRain = yearData.reduce((sum, day) => sum + day.precipitation, 0);
      const meanDailyRain = totalRain / yearData.length;
      const meanWindSpeed = yearData.reduce((sum, day) => sum + day.windSpeed, 0) / yearData.length;
      const meanWindGusts = yearData.reduce((sum, day) => sum + day.windGusts, 0) / yearData.length;
      
      yearlyStatistics.push({
        year: parseInt(year),
        flightDays: flightDays,
        totalRain: Math.round(totalRain * 10) / 10, // Round to 1 decimal
        meanDailyRain: Math.round(meanDailyRain * 100) / 100, // Round to 2 decimals
        meanWindSpeed: Math.round(meanWindSpeed * 10) / 10, // Round to 1 decimal
        meanWindGusts: Math.round(meanWindGusts * 10) / 10, // Round to 1 decimal
        totalDays: yearData.length
      });
    }
    
    if (yearlyFlightDays.length === 0) {
      throw new Error('No valid weather data found for analysis');
    }
    
    const averageFlightDays = yearlyFlightDays.reduce((sum, days) => sum + days, 0) / yearlyFlightDays.length;
    const standardDeviation = calculateStandardDeviation(yearlyFlightDays);
    
    console.log(`Analysis complete: ${averageFlightDays.toFixed(1)} avg flight days, ±${standardDeviation.toFixed(1)} std dev`);
    
    res.json({
      location: { latitude, longitude },
      thresholds,
      analysis: {
        averageFlightDays: Math.round(averageFlightDays),
        standardDeviation: Math.round(standardDeviation * 100) / 100,
        yearlyData: yearlyFlightDays,
        yearlyStatistics: yearlyStatistics,
        totalDaysAnalyzed,
        yearsAnalyzed: yearlyFlightDays.length,
        dataSource: 'Open-Meteo Historical Weather API'
      }
    });
    
  } catch (error) {
    console.error('Analysis error:', error.message);
    res.status(500).json({ 
      error: 'Failed to analyze flight days. Please try again.',
      details: error.message 
    });
  }
});

// Get current weather for a location (using MET API)
app.get('/api/current-weather/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    
    const response = await axios.get(LOCATIONFORECAST_URL, {
      params: { lat, lon },
      headers: {
        'User-Agent': 'DroneWeatherAnalyzer/1.0'
      }
    });
    
    const current = response.data.properties.timeseries[0];
    const weather = {
      temperature: current.data.instant.details.air_temperature,
      precipitation: current.data.next_1_hours?.details?.precipitation_amount || 0,
      windSpeed: current.data.instant.details.wind_speed,
      windDirection: current.data.instant.details.wind_from_direction,
      humidity: current.data.instant.details.relative_humidity,
      pressure: current.data.instant.details.air_pressure_at_sea_level
    };
    
    res.json(weather);
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch current weather' });
  }
});

// Test endpoint to verify API is working
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working', 
    timestamp: new Date().toISOString(),
    version: '1.1.0 - with Open-Meteo integration'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the API at http://localhost:${PORT}/api/test`);
});
