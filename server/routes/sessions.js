// server/routes/sessions.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Session = require('../models/Session');
const User = require('../models/User');

// @route   POST /api/sessions
// @desc    Create a new session
// @access  Private
router.post('/', auth, async (req, res) => {
  const { title, scheduledFor } = req.body;
  try {
    const newSession = new Session({
      title,
      scheduledFor,
      createdBy: req.user.id,
      participants: [req.user.id],
    });

    const session = await newSession.save();
    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/sessions
// @desc    Get all sessions for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const sessions = await Session.find({})
      .sort({ scheduledFor: -1 }) // Sort by most recent
      .populate('createdBy', ['name']); // Get creator's name
    res.json(sessions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;