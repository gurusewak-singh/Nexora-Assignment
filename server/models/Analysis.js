// server/models/Analysis.js
const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, unique: true },
  fullTranscript: [{
    user: { type: String, required: true }, // User's name or ID
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  summary: { type: String },
  actionItems: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Analysis', AnalysisSchema);