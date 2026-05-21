import { streamChatResponse, getChatResponse } from '../services/aiService.js';
import Session from '../models/Session.js';

export const sendMessage = async (req, res, next) => {
  try {
    const { sessionId, message, language = 'en' } = req.body;
    if (!sessionId || !message?.trim()) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    // Ensure session exists
    await Session.findOneAndUpdate(
      { sessionId },
      { $setOnInsert: { sessionId, language } },
      { upsert: true, new: true }
    );

    await streamChatResponse(sessionId, message.trim(), language, res);
  } catch (err) {
    next(err);
  }
};

export const sendVoiceMessage = async (req, res, next) => {
  try {
    const { sessionId, transcript, language = 'en' } = req.body;
    if (!sessionId || !transcript?.trim()) {
      return res.status(400).json({ error: 'sessionId and transcript are required' });
    }

    await Session.findOneAndUpdate(
      { sessionId },
      { $setOnInsert: { sessionId, language } },
      { upsert: true, new: true }
    );

    const reply = await getChatResponse(sessionId, transcript.trim(), language);
    res.json({ reply, sessionId });
  } catch (err) {
    next(err);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ sessionId }).select('messages language');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ messages: session.messages, language: session.language });
  } catch (err) {
    next(err);
  }
};

export const clearHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    await Session.findOneAndUpdate({ sessionId }, { $set: { messages: [] } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
