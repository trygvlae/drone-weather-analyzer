# Drone Weather Analyzer - Norway 🚁

A web application that analyzes historical weather data to determine the number of suitable drone flight days in different regions of Norway.

## Features

- **Location Selection**: Search for any location in Norway using OpenStreetMap's Nominatim API
- **Weather Thresholds**: Set custom thresholds for:
  - Maximum rainfall (mm/day)
  - Maximum wind speed (m/s)  
  - Minimum visibility (meters)
- **Historical Analysis**: Analyzes 10 years of weather data
- **Statistical Results**: Provides average flight days per year with standard deviation
- **Modern UI**: Clean, responsive design with beautiful gradients

## Technology Stack

### Frontend
- React 18 with TypeScript
- Modern CSS with gradients and animations
- Axios for API calls
- Responsive design

### Backend
- Node.js with Express
- Norwegian Meteorological Institute API integration
- OpenStreetMap Nominatim for geocoding
- CORS enabled for development

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Vaertjeneste_drone
```

2. Install all dependencies:
```bash
npm run install-all
```

### Development

Start both frontend and backend in development mode:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend development server on http://localhost:3000

### Individual Services

Start only the backend:
```bash
npm run server
```

Start only the frontend:
```bash
npm run client
```

## API Endpoints

### Backend API (`http://localhost:5000`)

- `GET /api/geocode/:placeName` - Search for locations in Norway
- `POST /api/analyze-flight-days` - Analyze flight days for a location
- `GET /api/current-weather/:lat/:lon` - Get current weather data

## Usage

1. **Select Location**: Type in a Norwegian location (e.g., "Oslo", "Bergen", "Trondheim")
2. **Set Thresholds**: Adjust weather thresholds based on your drone's capabilities
3. **Analyze**: Click "Analyze Flight Days" to get results
4. **Review Results**: See average flight days, standard deviation, and interpretation

## Weather Data

Currently uses simulated weather data for demonstration purposes. For production use with real historical data:

1. Register at [Frost API](https://frost.met.no/) for historical weather data
2. Add your credentials to environment variables
3. Update the server code to use real Frost API calls

## Example Results

The application provides:
- **Average Flight Days**: e.g., 156 days per year
- **Standard Deviation**: e.g., ±23 days
- **Flight Day Range**: e.g., 133-179 days (±1 std dev)
- **Total Data Analyzed**: 3,650 days (10 years)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Norwegian Meteorological Institute for weather data APIs
- OpenStreetMap for geocoding services
- React and Node.js communities

