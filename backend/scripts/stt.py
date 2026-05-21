#!/usr/bin/env python3
"""
Speech-to-Text using faster-whisper (open-source, no API key needed)
Usage: python3 stt.py <audio_file> <language>
"""
import sys
import json
import os
from faster_whisper import WhisperModel

def transcribe(audio_path: str, language: str = 'en'):
    try:
        model_name = os.environ.get("WHISPER_MODEL", "base")
        # Initialize model (downloads on first use)
        model = WhisperModel(model_name, device="cpu", compute_type="default")
        
        # Transcribe
        segments, info = model.transcribe(audio_path, language=None if language == 'auto' else language)
        
        # Combine segments
        transcript = ''.join([segment.text for segment in segments])
        
        return {
            "success": True,
            "transcript": transcript.strip(),
            "language": info.language,
            "duration": info.duration
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "fallback": True
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: stt.py <audio_file> [language]"}))
        sys.exit(1)
    
    audio_file = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else 'en'
    
    result = transcribe(audio_file, language)
    print(json.dumps(result))
