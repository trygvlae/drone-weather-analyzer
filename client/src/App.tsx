import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// API base URL - uses Netlify functions in production, localhost in development
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/.netlify/functions' : 'http://localhost:5000/api';

interface Location {
  lat: string;
  lon: string;
  display_name: string;
}

interface WeatherThresholds {
  maxRain: number;
  maxWind: number;
  maxWindGusts: number;
}

interface YearlyStatistic {
  year: number;
  flightDays: number;
  totalRain: number;
  meanDailyRain: number;
  meanWindSpeed: number;
  meanWindGusts: number;
  totalDays: number;
}

interface AnalysisResult {
  location: {
    latitude: number;
    longitude: number;
  };
  thresholds: WeatherThresholds;
  analysis: {
    averageFlightDays: number;
    standardDeviation: number;
    yearlyData: number[];
    yearlyStatistics: YearlyStatistic[];
    totalDaysAnalyzed: number;
    yearsAnalyzed: number;
    dataSource: string;
  };
}

const App: React.FC = () => {
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [thresholds, setThresholds] = useState<WeatherThresholds>({
    maxRain: 2, // mm
    maxWind: 10, // m/s
    maxWindGusts: 15 // m/s
  });
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>('');

  // Debounced location search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (locationQuery.length > 2) {
        searchLocations(locationQuery);
      } else {
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [locationQuery]);

  const searchLocations = async (query: string) => {
    try {
      const url = process.env.NODE_ENV === 'production' 
        ? `${API_BASE_URL}/geocode?place=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/geocode/${encodeURIComponent(query)}`;
      const response = await axios.get(url);
      setLocationSuggestions(response.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Location search error:', error);
    }
  };

  const selectLocation = (location: Location) => {
    setSelectedLocation(location);
    setLocationQuery(location.display_name);
    setShowSuggestions(false);
  };

  const handleThresholdChange = (field: keyof WeatherThresholds, value: number) => {
    setThresholds(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const analyzeFlightDays = async () => {
    if (!selectedLocation) {
      setError('Please select a location first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/analyze-flight-days`, {
        latitude: parseFloat(selectedLocation.lat),
        longitude: parseFloat(selectedLocation.lon),
        thresholds
      });

      setResults(response.data);
    } catch (error) {
      setError('Failed to analyze flight days. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <div className="header">
          <h1>Drone Weather Analyzer</h1>
          <p>Analyze historical weather data to determine optimal drone flight days in Norway</p>
        </div>

        <div className="card">
          <h2>Location Selection</h2>
          <div className="form-group">
            <label htmlFor="location">Search for a location in Norway:</label>
            <div className="location-input-container">
              <input
                id="location"
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
                placeholder="e.g., Oslo, Bergen, Trondheim..."
              />
              {showSuggestions && locationSuggestions.length > 0 && (
                <div className="location-suggestions">
                  {locationSuggestions.map((location, index) => (
                    <div
                      key={index}
                      className="location-suggestion"
                      onClick={() => selectLocation(location)}
                    >
                      {location.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedLocation && (
            <div className="selected-location">
              <p><strong>Selected:</strong> {selectedLocation.display_name}</p>
              <p><small>Coordinates: {selectedLocation.lat}, {selectedLocation.lon}</small></p>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Weather Thresholds</h2>
          <p>Set your acceptable weather conditions for drone flights:</p>
          
          <div className="threshold-grid">
            <div className="form-group">
              <label htmlFor="maxRain">Maximum Rain (mm/day):</label>
              <input
                id="maxRain"
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={thresholds.maxRain}
                onChange={(e) => handleThresholdChange('maxRain', parseFloat(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="maxWind">Maximum Mean Wind Speed (m/s):</label>
              <input
                id="maxWind"
                type="number"
                min="0"
                max="30"
                step="0.5"
                value={thresholds.maxWind}
                onChange={(e) => handleThresholdChange('maxWind', parseFloat(e.target.value))}
              />
              <small style={{color: '#666', fontSize: '0.9rem', marginTop: '4px', display: 'block'}}>
                Mean daily wind speed at 10m height
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="maxWindGusts">Maximum Wind Gusts (m/s):</label>
              <input
                id="maxWindGusts"
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={thresholds.maxWindGusts}
                onChange={(e) => handleThresholdChange('maxWindGusts', parseFloat(e.target.value))}
              />
              <small style={{color: '#666', fontSize: '0.9rem', marginTop: '4px', display: 'block'}}>
                Maximum wind gust speed during the day (critical for drone safety)
              </small>
            </div>
          </div>

          <button 
            className="btn" 
            onClick={analyzeFlightDays}
            disabled={!selectedLocation || loading}
          >
            {loading ? 'Analyzing...' : 'Analyze Flight Days'}
          </button>

          {error && (
            <div className="error">
              <p style={{color: 'red'}}>{error}</p>
            </div>
          )}
        </div>

        {loading && (
          <div className="card">
            <div className="loading">
              <div className="spinner"></div>
              <p>Analyzing 10 years of weather data...</p>
            </div>
          </div>
        )}

        {results && (
          <div className="card results">
            <h2>Analysis Results</h2>
            <p>Based on {results.analysis.yearsAnalyzed} years of real historical weather data for {selectedLocation?.display_name}</p>
            <p><small><em>Data source: {results.analysis.dataSource}</em></small></p>
            
            <div className="results-grid">
              <div className="stat-card">
                <h3>Average Flight Days</h3>
                <div className="value">{results.analysis.averageFlightDays}</div>
                <div className="unit">days per year</div>
              </div>

              <div className="stat-card">
                <h3>Standard Deviation</h3>
                <div className="value">{results.analysis.standardDeviation}</div>
                <div className="unit">days</div>
              </div>

              <div className="stat-card">
                <h3>Flight Day Range</h3>
                <div className="value">
                  {Math.round(results.analysis.averageFlightDays - results.analysis.standardDeviation)} - {Math.round(results.analysis.averageFlightDays + results.analysis.standardDeviation)}
                </div>
                <div className="unit">days (±1 std dev)</div>
              </div>

              <div className="stat-card">
                <h3>Data Analyzed</h3>
                <div className="value">{results.analysis.totalDaysAnalyzed.toLocaleString()}</div>
                <div className="unit">days total</div>
              </div>
            </div>

            <div className="thresholds-summary">
              <h3>Your Weather Thresholds:</h3>
              <ul>
                <li>Maximum rain: {results.thresholds.maxRain} mm/day</li>
                <li>Maximum mean wind: {results.thresholds.maxWind} m/s (daily average at 10m height)</li>
                <li>Maximum wind gusts: {results.thresholds.maxWindGusts} m/s (peak gusts during the day)</li>
              </ul>
            </div>

            <div className="data-info">
              <h3>Real Weather Data Analysis:</h3>
              <ul>
                <li><strong>Precipitation:</strong> Actual daily rainfall/snow measurements in mm</li>
                <li><strong>Mean Wind Speed:</strong> Daily average wind speeds at 10m height</li>
                <li><strong>Wind Gusts:</strong> Maximum wind gust speeds during each day (critical for safety)</li>
                <li><strong>Coverage:</strong> {results.analysis.totalDaysAnalyzed.toLocaleString()} days across {results.analysis.yearsAnalyzed} years</li>
              </ul>
            </div>

            <div className="yearly-statistics">
              <h3>Historical Weather Data by Year:</h3>
              <div className="table-container">
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Flight Days</th>
                      <th>Total Rain (mm)</th>
                      <th>Mean Daily Rain (mm)</th>
                      <th>Mean Wind Speed (m/s)</th>
                      <th>Mean Wind Gusts (m/s)</th>
                      <th>Days Analyzed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.analysis.yearlyStatistics.map((yearStats) => (
                      <tr key={yearStats.year}>
                        <td><strong>{yearStats.year}</strong></td>
                        <td className="flight-days">{yearStats.flightDays}</td>
                        <td>{yearStats.totalRain}</td>
                        <td>{yearStats.meanDailyRain}</td>
                        <td>{yearStats.meanWindSpeed}</td>
                        <td>{yearStats.meanWindGusts}</td>
                        <td>{yearStats.totalDays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="interpretation">
              <h3>Interpretation:</h3>
              <p>
                Based on <strong>real historical weather data</strong>, you can expect <strong>{results.analysis.averageFlightDays} suitable flight days</strong> per year 
                at this location with your specified weather criteria. However, this can vary by ±{results.analysis.standardDeviation} days, 
                meaning you might have anywhere from {Math.round(results.analysis.averageFlightDays - results.analysis.standardDeviation)} to {Math.round(results.analysis.averageFlightDays + results.analysis.standardDeviation)} suitable 
                flight days in any given year.
              </p>
              <p>
                <small><strong>Note:</strong> This analysis uses a dual wind safety check - both mean wind speed AND wind gusts must be within your limits for a day to be considered flyable. The yearly breakdown above shows the actual weather conditions and flight days for each year analyzed.</small>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
