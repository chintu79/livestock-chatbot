# 🐄 Smart Livestock Verification — AI Chatbot

Voice + Text AI assistant for the IoT/RFID cattle verification platform.

## Stack
- **Frontend**: React + Vite + CSS Modules
- **Backend**: Node.js + Express + MongoDB
- **AI**: NVIDIA NIM (Llama 3.1 70B) via OpenAI-compatible API
- **Speech**: Web Speech API (STT/TTS) + NVIDIA Whisper fallback

## Features
- ✅ Streaming text chat (SSE)
- ✅ Voice input (Web Speech API + MediaRecorder)
- ✅ Voice output (Web Speech Synthesis)
- ✅ Conversational memory (MongoDB sessions)
- ✅ Multilingual (EN, HI, MR, GU, PA, TA, TE, KN)
- ✅ Quick topic shortcuts
- ✅ Farming-domain system prompt
- ✅ Rate limiting, CORS, Helmet security

## Quick Start

### 1. Backend
```bash
cd backend
cp .env.example .env
# Fill NVIDIA_API_KEY in .env
npm install
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Docker (full stack)
```bash
NVIDIA_API_KEY=your_key docker-compose up
```

## NVIDIA API Setup
1. Sign up at https://build.nvidia.com/
2. Get API key
3. Set `NVIDIA_API_KEY` in backend `.env`
4. Model: `meta/llama-3.1-70b-instruct` (default)

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/session/create` | Create chat session |
| POST | `/api/chat/message` | SSE streaming text chat |
| POST | `/api/chat/voice` | Voice message response |
| GET | `/api/chat/history/:id` | Get session history |
| DELETE | `/api/chat/history/:id` | Clear session |
| POST | `/api/speech/transcribe` | Audio → text (multipart) |

## Project Structure
```
livestock-chatbot/
├── backend/
│   └── src/
│       ├── config/         # DB, NVIDIA client, system prompt
│       ├── controllers/    # chat, session, speech
│       ├── models/         # Session schema
│       ├── routes/         # Express routers
│       ├── services/       # AI streaming logic
│       └── middleware/     # Error handler
└── frontend/
    └── src/
        ├── components/
        │   ├── Chat/       # Layout, Window, Input, Sidebar
        │   └── Voice/      # VoiceModal + waveform
        ├── context/        # ChatContext (state, API calls)
        ├── hooks/          # useVoiceRecording
        └── styles/         # Global CSS
```
