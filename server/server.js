// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require("socket.io");
const Analysis = require('./models/Analysis');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected...'))
.catch(err => console.error(err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/analysis', require('./routes/analysis'));

// Socket.IO Logic
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // --- PeerJS Signaling ---
    socket.on('join-room-for-video', (sessionId, userId) => {
        socket.join(sessionId);
        // Notify other users in the room about the new connection
        socket.to(sessionId).emit('user-connected-for-video', userId);

        // Handle disconnection
        socket.on('disconnect', () => {
            socket.to(sessionId).emit('user-disconnected-for-video', userId);
            console.log(`User ${userId} disconnected from room ${sessionId}`);
        });
    });

    // --- Transcription ---
    socket.on('new-transcript-chunk', async ({ sessionId, userName, text }) => {
        try {
            await Analysis.findOneAndUpdate(
                { sessionId },
                { $push: { 
                    fullTranscript: { 
                        user: userName, 
                        text, 
                        timestamp: new Date() 
                    } 
                }},
                { upsert: true }
            );
        } catch (err) {
            console.error('Error saving transcript chunk:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});