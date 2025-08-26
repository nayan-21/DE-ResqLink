const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET /api/location - Reverse geocoding endpoint
router.get('/', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    // Validate required parameters
    if (!lat || !lon) {
      return res.status(400).json({ 
        error: 'Missing required parameters', 
        message: 'Both lat and lon query parameters are required' 
      });
    }

    // Validate that lat and lon are valid numbers
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        error: 'Invalid coordinates', 
        message: 'lat and lon must be valid numbers' 
      });
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ 
        error: 'Invalid latitude', 
        message: 'Latitude must be between -90 and 90 degrees' 
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ 
        error: 'Invalid longitude', 
        message: 'Longitude must be between -180 and 180 degrees' 
      });
    }

    // Make request to OpenStreetMap Nominatim API
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
    
    const response = await axios.get(nominatimUrl, {
      headers: {
        'User-Agent': 'DisasterCommApp/1.0'
      },
      timeout: 10000 // 10 second timeout
    });

    // Extract the display name from the response
    const { display_name } = response.data;

    if (!display_name) {
      return res.status(404).json({ 
        error: 'Address not found', 
        message: 'No address found for the provided coordinates' 
      });
    }

    // Return the address
    return res.status(200).json({ 
      address: display_name,
      coordinates: {
        latitude,
        longitude
      }
    });

  } catch (error) {
    console.error('Reverse geocoding error:', error);

    // Handle specific axios errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return res.status(error.response.status).json({
        error: 'Nominatim API error',
        message: error.response.data?.error || 'Error from geocoding service',
        status: error.response.status
      });
    } else if (error.request) {
      // The request was made but no response was received
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Geocoding service is currently unavailable'
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process geocoding request'
      });
    }
  }
});

module.exports = router;
