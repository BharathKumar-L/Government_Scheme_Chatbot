const express = require('express');
const Joi = require('joi');
const { getRagPipeline } = require('../services/ragPipeline');
const ChatHistory = require('../models/ChatHistory');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Validation schema
const chatSchema = Joi.object({
  message: Joi.string().required().min(1).max(1000),
  language: Joi.string().valid('en', 'hi', 'ta').default('en'),
  sessionId: Joi.string().optional(),
  isVoiceInput: Joi.boolean().default(false)
});

// POST /api/chat - Send message to chatbot
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = chatSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { message, language, sessionId = uuidv4(), isVoiceInput } = value;

    console.log(`Chat request: "${message}" (lang: ${language})`);

    // Get RAG pipeline
    const ragPipeline = await getRagPipeline();

    // Get response from RAG
    const result = await ragPipeline.chat(message, {
      language,
      topK: 5,
      temperature: 0.7
    });

    // Save to chat history
    try {
      let history = await ChatHistory.findOne({ sessionId });

      if (!history) {
        history = new ChatHistory({
          sessionId,
          messages: [],
          metadata: {
            userLanguage: language,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            isVoiceInput
          }
        });
      }

      // Add messages
      history.messages.push({
        role: 'user',
        content: message,
        language
      });

      history.messages.push({
        role: 'assistant',
        content: result.response,
        language
      });

      history.updatedAt = new Date();
      await history.save();
    } catch (err) {
      console.warn('Could not save chat history:', err.message);
    }

    res.json({
      success: true,
      data: {
        sessionId,
        response: result.response,
        language: result.language,
        relevantSchemes: result.schemes,
        confidence: result.confidence
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/chat/history - Get chat history
router.get('/history/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const history = await ChatHistory.findOne({ sessionId });

    if (!history) {
      return res.json({
        success: true,
        data: {
          sessionId,
          messages: []
        }
      });
    }

    res.json({
      success: true,
      data: {
        sessionId,
        messages: history.messages,
        createdAt: history.createdAt,
        updatedAt: history.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/chat/history - Clear chat history
router.delete('/history/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    await ChatHistory.findOneAndDelete({ sessionId });

    res.json({
      success: true,
      message: 'Chat history cleared'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/chat/feedback - Log feedback
router.post('/feedback', async (req, res, next) => {
  try {
    const { sessionId, messageId, rating, comment } = req.body;

    console.log(`Feedback received: sessionId=${sessionId}, rating=${rating}`);

    // In production, save this to a feedback collection
    // For now, just log it
    res.json({
      success: true,
      message: 'Feedback recorded'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
