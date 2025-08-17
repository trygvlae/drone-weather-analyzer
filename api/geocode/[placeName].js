// Vercel serverless function for geocoding
const axios = require('axios');

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { placeName } = req.query;
    
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
}
