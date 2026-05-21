import multer from 'multer';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer memory storage for audio blobs
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
export const uploadMiddleware = upload.single('audio');

// Helper: Resolve a potentially-relative PYTHON_PATH to absolute, anchored at backend root
const resolvePythonPath = () => {
  const raw = process.env.PYTHON_PATH || 'python3';
  if (path.isAbsolute(raw)) return raw;
  // Resolve relative to the backend root (two levels up from src/controllers)
  const backendRoot = path.resolve(__dirname, '../../');
  const resolved = path.join(backendRoot, raw);
  return fs.existsSync(resolved) ? resolved : raw;
};

// Helper: Run Python script and get output
const runPythonScript = (scriptName, args) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, `../../scripts/${scriptName}`);
    const pythonPath = resolvePythonPath();
    const python = spawn(pythonPath, [scriptPath, ...args]);

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed: ${error}`));
      } else {
        try {
          const jsonStart = output.indexOf('{');
          const jsonEnd = output.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonStr = output.substring(jsonStart, jsonEnd + 1);
            resolve(JSON.parse(jsonStr));
          } else {
            resolve(JSON.parse(output));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${output}`));
        }
      }
    });

    python.on('error', (err) => {
      reject(err);
    });
  });
};

// STT: Transcribe audio using faster-whisper (local, no API key, open-source)
export const transcribeAudio = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

    const { language = 'en' } = req.body;

    try {
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      // Use the correct extension based on what the browser actually sent
      const mimeToExt = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/mp4': 'mp4', 'audio/mpeg': 'mp3' };
      const ext = mimeToExt[req.file.mimetype?.split(';')[0]] || 'webm';
      const tempPath = path.join(tempDir, `audio-${Date.now()}.${ext}`);
      fs.writeFileSync(tempPath, req.file.buffer);

      try {
        // Call Python STT script
        const result = await runPythonScript('stt.py', [tempPath, language]);

        // Cleanup temp file
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

        if (result.success) {
          res.json({ 
            transcript: result.transcript, 
            language: result.language,
            duration: result.duration 
          });
        } else {
          // Fallback for frontend to use Web Speech API
          res.status(503).json({ error: 'STT service unavailable', fallback: true });
        }
      } catch (pythonErr) {
        console.error('Python STT error:', pythonErr.message);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        
        res.status(503).json({ 
          error: 'STT service unavailable', 
          details: pythonErr.message,
          fallback: true 
        });
      }
    } catch (err) {
      console.error('Transcription error:', err);
      res.status(500).json({ error: 'Transcription failed', details: err.message });
    }
  } catch (err) {
    next(err);
  }
};

// TTS: Synthesize text to speech using pyttsx3 (local, no API key, open-source)
export const synthesizeAudio = async (req, res, next) => {
  try {
    const { text, language = 'en', rate = 150 } = req.body;

    if (!text) return res.status(400).json({ error: 'No text provided' });

    try {
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const outputPath = path.join(tempDir, `speech-${Date.now()}.mp3`);

      try {
        // Call Python TTS script
        const result = await runPythonScript('tts.py', [text, language, rate.toString(), outputPath]);

        if (result.success && fs.existsSync(outputPath)) {
          // Read and send audio file
          const audioBuffer = fs.readFileSync(outputPath);
          fs.unlinkSync(outputPath);

          res.setHeader('Content-Type', 'audio/mpeg');
          res.send(audioBuffer);
        } else {
          res.status(500).json({ 
            error: 'Speech synthesis failed', 
            details: result.error || 'Unknown error' 
          });
        }
      } catch (pythonErr) {
        console.error('Python TTS error:', pythonErr.message);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        
        res.status(500).json({ 
          error: 'Speech synthesis failed', 
          details: pythonErr.message 
        });
      }
    } catch (ttsErr) {
      console.error('TTS error:', ttsErr);
      res.status(500).json({ error: 'Speech synthesis failed', details: ttsErr.message });
    }
  } catch (err) {
    next(err);
  }
};
