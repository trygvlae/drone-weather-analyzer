// Netlify function for geocoding
const axios = require('axios');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extract place name from query parameters or path
    const placeName = event.queryStringParameters?.place || 
                     event.path.split('/').pop() || 
                     event.queryStringParameters?.q;
    
    if (!placeName) {
      throw new Error('No place name provided');
    }
    
    console.log('Searching for place:', placeName);
    
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: {
        q: `${decodeURIComponent(placeName)}, Norway`,
        format: 'json',
        limit: 5,
        countrycodes: 'no'
      },
      headers: {
        'User-Agent': 'DroneWeatherAnalyzer/1.0'
      }
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to geocode location' })
    };
  }
};
