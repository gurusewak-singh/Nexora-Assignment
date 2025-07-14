// server/models/Session.js
const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  scheduledFor: { type: Date, required: true },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Live'], default: 'Scheduled' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Session', SessionSchema);