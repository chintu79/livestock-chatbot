import { Router } from 'express';
import { createSession, updateLanguage } from '../controllers/sessionController.js';

const router = Router();
router.post('/create', createSession);
router.patch('/:sessionId/language', updateLanguage);

export default router;
