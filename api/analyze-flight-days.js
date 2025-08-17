// Vercel serverless function for flight days analysis
const axios = require('axios');

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
  
  const response = await axios.get(url, { 
    params,
    timeout: 30000,
    headers: {
      'User-Agent': 'DroneWeatherAnalyzer/1.0'
    }
  });
  
  return response.data;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { latitude, longitude, thresholds } = req.body;
    
    console.log(`Analyzing flight days for coordinates: ${latitude}, ${longitude}`);
    
    // Validate coordinates
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Invalid coordinates provided');
    }
    
    if (latitude < 58 || latitude > 72 || longitude < 4 || longitude > 32) {
      throw new Error('Coordinates appear to be outside Norway. Please select a location within Norway.');
    }
    
    // Get 5 years of historical data
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 5);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
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
    const dataByYear = {};
    const yearlyStatistics = [];
    
    for (let i = 0; i < dailyData.time.length; i++) {
      const date = new Date(dailyData.time[i]);
      const year = date.getFullYear();
      
      if (!dataByYear[year]) {
        dataByYear[year] = [];
      }
      
      const precipitation = dailyData.precipitation_sum[i] || 0;
      // Convert wind speeds from km/h to m/s (divide by 3.6)
      // Handle null values properly - null should become 0, then convert
      const windSpeedKmh = dailyData.wind_speed_10m_mean[i];
      const windGustsKmh = dailyData.wind_gusts_10m_max[i];
      const windSpeed = (windSpeedKmh === null || windSpeedKmh === undefined) ? 0 : windSpeedKmh / 3.6;
      const windGusts = (windGustsKmh === null || windGustsKmh === undefined) ? 0 : windGustsKmh / 3.6;
      
      dataByYear[year].push({
        precipitation,
        windSpeed,
        windGusts
      });
    }
    
    // Calculate flight days and yearly statistics
    const years = Object.keys(dataByYear).sort();
    let totalDaysAnalyzed = 0;
    
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
        totalRain: Math.round(totalRain * 10) / 10,
        meanDailyRain: Math.round(meanDailyRain * 100) / 100,
        meanWindSpeed: Math.round(meanWindSpeed * 10) / 10,
        meanWindGusts: Math.round(meanWindGusts * 10) / 10,
        totalDays: yearData.length
      });
    }
    
    if (yearlyFlightDays.length === 0) {
      throw new Error('No valid weather data found for analysis');
    }
    
    const averageFlightDays = yearlyFlightDays.reduce((sum, days) => sum + days, 0) / yearlyFlightDays.length;
    const standardDeviation = calculateStandardDeviation(yearlyFlightDays);
    
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
}
