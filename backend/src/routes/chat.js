import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { sendMessage, sendVoiceMessage, getHistory, clearHistory } from '../controllers/chatController.js';

const router = Router();

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { error: 'Too many requests, please try again later.' },
});

router.post('/message', limiter, sendMessage);           // SSE streaming text chat
router.post('/voice', limiter, sendVoiceMessage);        // Voice response (non-streaming)
router.get('/history/:sessionId', getHistory);
router.delete('/history/:sessionId', clearHistory);

export default router;
