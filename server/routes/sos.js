const express = require('express');
const router = express.Router();
const authenticateJwt = require('../middleware/auth');
const { requireRescueTeam } = require('../middleware/auth');
const SOSRequest = require('../models/SOSRequest');

// Create a new SOS request (any authenticated user)
router.post('/', authenticateJwt, async (req, res) => {
  try {
    const { 
      message = '', 
      latitude, 
      longitude, 
      userEmail,
      name,
      contact,
      peopleCount,
      disasterType,
      manualLocation,
      extraInfo
    } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number' || !userEmail) {
      return res.status(400).json({ message: 'latitude, longitude, and userEmail are required' });
    }

    if (!peopleCount || !disasterType) {
      return res.status(400).json({ message: 'peopleCount and disasterType are required' });
    }

    const sos = await SOSRequest.create({ 
      message, 
      latitude, 
      longitude, 
      userEmail,
      name,
      contact,
      peopleCount,
      disasterType,
      manualLocation,
      extraInfo
    });

    // Emit real-time event to all connected clients
    if (req.io) {
      req.io.emit('newSOSRequest', sos);
    }

    return res.status(201).json({ message: 'SOS request created', sos });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all SOS requests (rescue team only)
router.get('/', authenticateJwt, requireRescueTeam, async (_req, res) => {
  try {
    const items = await SOSRequest.find({}).sort({ createdAt: -1 });
    return res.status(200).json(items);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
