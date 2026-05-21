# Open-Source Speech Setup Guide

This backend now uses **100% free, open-source models** for Speech-to-Text and Text-to-Speech - **no API keys required**!

## What Changed

### Previous Setup (Proprietary)
- ❌ NVIDIA/OpenAI Whisper (required API key)
- ❌ Closed-source models

### New Setup (Open-Source, Free)
- ✅ **Faster-Whisper** for STT (Speech-to-Text)
- ✅ **pyttsx3** for TTS (Text-to-Speech)
- ✅ **No API keys needed**
- ✅ **Local processing** (privacy-friendly)
- ✅ **Works offline** (after initial model download)

## Installation

### 1. Install Python Dependencies

```bash
# Install Python requirements
pip install -r requirements.txt

# This downloads:
# - faster-whisper (~3GB for large model on first run)
# - pyttsx3 (~50MB)
# - PyTorch (ML framework)
```

### 2. Install Node.js Dependencies

```bash
# Already done via npm install
# Node.js just calls the Python scripts
```

### 3. Create temp directory

```bash
mkdir -p backend/temp
```

## Usage

### API Endpoints

#### Speech-to-Text (STT)
- **Endpoint**: `POST /api/speech/transcribe`
- **Body**: Form data with audio file
- **Response**: `{ transcript, language, duration }`
- **Languages**: Supports all languages (auto-detection available)

```bash
curl -X POST http://localhost:3000/api/speech/transcribe \
  -F "audio=@audio.webm" \
  -F "language=en"
```

#### Text-to-Speech (TTS)
- **Endpoint**: `POST /api/speech/synthesize`
- **Body**: JSON with text
- **Response**: Audio file (MP3)
- **Languages**: English, Spanish, French, German, etc.

```bash
curl -X POST http://localhost:3000/api/speech/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "language": "en", "rate": 150}' \
  --output output.mp3
```

## How It Works

### STT Flow
1. Frontend sends audio blob
2. Node.js saves to temp file
3. Python `scripts/stt.py` uses **faster-whisper** to transcribe
4. JSON result returned to frontend
5. If STT fails, frontend falls back to Web Speech API

### TTS Flow
1. Frontend sends text
2. Python `scripts/tts.py` uses **pyttsx3** to synthesize
3. Audio MP3 file returned to frontend
4. Browser plays audio

## Performance

- **First run**: ~2-3 minutes (downloads Whisper model ~3GB)
- **Subsequent runs**: ~5-10 seconds per audio (depends on audio length)
- **CPU-only**: Runs on standard CPU (no GPU required, but slower)

## Troubleshooting

### "ModuleNotFoundError: No module named 'faster_whisper'"
```bash
pip install faster-whisper
```

### "Python not found"
```bash
# Make sure python3 is in PATH
which python3
```

### "RuntimeError: CUDA out of memory"
- Already configured for CPU mode in `scripts/stt.py`
- If you have GPU, change `device: "cpu"` to `device: "cuda"` in stt.py

## Language Support

### STT (Faster-Whisper)
- Supports 99+ languages
- Auto-detection: set language to `'auto'`

### TTS (pyttsx3)
- Language codes: `en`, `es`, `fr`, `de`, `it`, `ja`, `zh`, etc.
- Voice quality varies by system (depends on installed voices)

## Development

- **STT Script**: `backend/scripts/stt.py`
- **TTS Script**: `backend/scripts/tts.py`
- **Controller**: `backend/src/controllers/speechController.js`
- **Routes**: `backend/src/routes/speech.js`

## Cost Comparison

| Solution | Cost | License | Requires API | Privacy |
|----------|------|---------|-------------|---------|
| OpenAI Whisper | $0.02/min | Proprietary | Yes | Cloud |
| Google Speech | $0.006/sec | Proprietary | Yes | Cloud |
| **Faster-Whisper** | **FREE** | **Open-Source MIT** | **No** | **Local** |
| **pyttsx3** | **FREE** | **Open-Source MIT** | **No** | **Local** |

## Resources

- Faster-Whisper: https://github.com/SYSTRAN/faster-whisper
- pyttsx3: https://github.com/nateshmbhat/pyttsx3
- Whisper Models: https://huggingface.co/
