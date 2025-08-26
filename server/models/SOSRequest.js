const mongoose = require('mongoose');

const sosRequestSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      default: '',
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: false,
      trim: true,
    },
    contact: {
      type: String,
      required: false,
      trim: true,
    },
    peopleCount: {
      type: String,
      required: true,
      trim: true,
    },
    disasterType: {
      type: String,
      required: true,
      trim: true,
    },
    manualLocation: {
      type: String,
      required: false,
      trim: true,
    },
    extraInfo: {
      type: String,
      required: false,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SOSRequest', sosRequestSchema);
