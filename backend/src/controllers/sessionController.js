import { v4 as uuidv4 } from 'uuid';
import Session from '../models/Session.js';

export const createSession = async (req, res, next) => {
  try {
    const sessionId = uuidv4();
    const { language = 'en' } = req.body;
    const session = await Session.create({
      sessionId,
      language,
      userAgent: req.headers['user-agent'],
    });
    res.json({ sessionId: session.sessionId, createdAt: session.createdAt });
  } catch (err) {
    next(err);
  }
};

export const updateLanguage = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { language } = req.body;
    await Session.findOneAndUpdate({ sessionId }, { language });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
