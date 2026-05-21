#!/usr/bin/env python3
"""
Text-to-Speech using pyttsx3 (open-source, no API key needed)
Usage: python3 tts.py "<text>" <language> <rate> <output_file>
"""
import sys
import json
import pyttsx3

def synthesize(text: str, language: str = 'en', rate: int = 150, output_file: str = None):
    try:
        engine = pyttsx3.init()
        engine.setProperty('rate', rate)
        
        # Set voice based on language
        voices = engine.getProperty('voices')
        lang_voice = None
        for voice in voices:
            if language in voice.languages:
                lang_voice = voice.id
                break
        
        if lang_voice:
            engine.setProperty('voice', lang_voice)
        
        if output_file:
            engine.save_to_file(text, output_file)
            engine.runAndWait()
            return {
                "success": True,
                "output_file": output_file,
                "message": "Audio synthesized successfully"
            }
        else:
            return {
                "success": False,
                "error": "No output file specified"
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({"error": "Usage: tts.py '<text>' <language> <rate> <output_file>"}))
        sys.exit(1)
    
    text = sys.argv[1]
    language = sys.argv[2]
    rate = int(sys.argv[3])
    output_file = sys.argv[4]
    
    result = synthesize(text, language, rate, output_file)
    print(json.dumps(result))
