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
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SOSRequest', sosRequestSchema);
