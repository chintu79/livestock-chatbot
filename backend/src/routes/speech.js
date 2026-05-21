import { Router } from 'express';
import { transcribeAudio, uploadMiddleware, synthesizeAudio } from '../controllers/speechController.js';

const router = Router();

// STT: Convert audio to text
router.post('/transcribe', uploadMiddleware, transcribeAudio);

// TTS: Convert text to audio
router.post('/synthesize', synthesizeAudio);

export default router;
