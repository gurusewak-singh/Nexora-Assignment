// server/routes/analysis.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Analysis = require('../models/Analysis');
const Session = require('../models/Session');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Initialize OpenAI client for Ollama
const ollama = new OpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama', // This can be any non-empty string
});

// Setup multer for file uploads
const upload = multer({ dest: 'uploads/' });

// @route   POST /api/analysis/transcribe
// @desc    Transcribe an audio chunk using local Whisper
// @access  Private
router.post('/transcribe', auth, upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No audio file uploaded.');
    }

    const { sessionId, userName } = req.body;
    const audioFilePath = path.resolve(req.file.path);

    try {
        // Transcribe using Ollama's Whisper model
        const transcription = await ollama.audio.transcriptions.create({
            model: 'ZimaBlueAI/whisper-large-v3', // or your chosen model
            file: fs.createReadStream(audioFilePath),
        });

        const transcribedText = transcription.text.trim();

        // Save transcript to DB
        if (transcribedText) {
            await Analysis.findOneAndUpdate(
                { sessionId },
                { $push: { 
                    fullTranscript: { 
                        user: userName, 
                        text: transcribedText, 
                        timestamp: new Date() 
                    } 
                }},
                { upsert: true }
            );
        }
        
        res.json({ success: true, text: transcribedText });

    } catch (err) {
        console.error('Transcription error:', err.message);
        res.status(500).send('Server Error');
    } finally {
        // Clean up the temporary audio file
        fs.unlinkSync(audioFilePath);
    }
});

// @route   POST /api/analysis/:sessionId/generate
// @desc    Generate AI summary for a session
// @access  Private
router.post('/:sessionId/generate', auth, async (req, res) => {
    try {
        const analysis = await Analysis.findOne({ sessionId: req.params.sessionId });
        if (!analysis || analysis.fullTranscript.length === 0) {
            return res.status(404).json({ msg: 'No transcript found for this session.' });
        }

        // Format the transcript for the AI
        const formattedTranscript = analysis.fullTranscript
            .map(chunk => `${chunk.user}: ${chunk.text}`)
            .join('\n');
        
        // Create the prompt for Ollama
        const prompt = `You are an expert meeting analyst. Based on the following transcript of a group discussion, provide:
        1. A concise one-paragraph summary
        2. Bulleted list of key decisions
        3. Bulleted list of action items with owners

        Transcript:
        ---
        ${formattedTranscript}
        ---

        Analysis:`;
        
        // Call Ollama using OpenAI client
        const completion = await ollama.chat.completions.create({
            model: 'llama3:8b',
            messages: [
                { role: 'system', content: 'You are an expert meeting analyst.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
        });

        const analysisResult = completion.choices[0]?.message?.content;
        
        if (!analysisResult) {
            throw new Error('No response from Ollama');
        }

        // Save the analysis result
        analysis.summary = analysisResult;
        analysis.summaryGeneratedAt = new Date();
        await analysis.save();

        // Update session status
        await Session.findByIdAndUpdate(req.params.sessionId, { status: 'Completed' });

        res.json({ 
            success: true, 
            summary: analysis.summary,
            sessionId: req.params.sessionId
        });

    } catch (err) {
        console.error('Error generating analysis:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;