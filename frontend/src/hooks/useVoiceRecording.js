import { useState, useRef, useCallback, useEffect } from 'react';

const SPEECH_LANG_MAP = {
  en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN',
  gu: 'gu-IN', pa: 'pa-IN', ta: 'ta-IN',
  te: 'te-IN', kn: 'kn-IN',
};

const USE_SERVER_STT = true; // Set to true to use robust, local faster-whisper backend to avoid cloud network errors

export function useVoiceRecording(language = 'en') {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);

  // Web Speech API (primary — browser-native, no server needed)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const hasSpeechRecognition = !!SpeechRecognition;

  const stopAudioLevel = () => {
    cancelAnimationFrame(animFrameRef.current);
    setAudioLevel(0);
  };

  const startAudioLevelMonitor = (stream) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const src = ctx.createMediaStreamSource(stream);
    src.connect(analyser);
    analyserRef.current = analyser;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const loop = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setAudioLevel(avg / 128); // 0–1
      animFrameRef.current = requestAnimationFrame(loop);
    };
    loop();
  };

  const startRecording = useCallback(async (onResult) => {
    setError(null);
    setTranscript('');

    if (hasSpeechRecognition && !USE_SERVER_STT) {
      // Browser Web Speech API
      const recognition = new SpeechRecognition();
      recognition.lang = SPEECH_LANG_MAP[language] || 'en-IN';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onresult = (e) => {
        const result = e.results[e.results.length - 1];
        const text = result[0].transcript;
        setTranscript(text);
        if (result.isFinal) onResult?.(text);
      };

      recognition.onerror = (e) => {
        setError(`Speech error: ${e.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        stopAudioLevel();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } else {
      // MediaRecorder fallback
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        startAudioLevelMonitor(stream);
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
        recorder.onstop = async () => {
          setIsProcessing(true);
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          try {
            const form = new FormData();
            form.append('audio', blob, 'recording.webm');
            form.append('language', language);
            const res = await fetch('/api/speech/transcribe', { method: 'POST', body: form });
            const data = await res.json();
            if (data.transcript) {
              setTranscript(data.transcript);
              onResult?.(data.transcript);
            } else {
              setError('Could not transcribe audio. Please type your message.');
            }
          } catch {
            setError('Transcription failed.');
          } finally {
            setIsProcessing(false);
            stream.getTracks().forEach(t => t.stop());
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
      } catch (err) {
        setError('Microphone access denied.');
        return;
      }
    }

    setIsRecording(true);
  }, [language, hasSpeechRecognition]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
    }
    stopAudioLevel();
    setIsRecording(false);
  }, []);

  // TTS using Web Speech API
  const speak = useCallback((text, lang = language) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = SPEECH_LANG_MAP[lang] || 'en-IN';
    utter.rate = 0.95;
    utter.pitch = 1;
    utter.volume = 1;
    window.speechSynthesis.speak(utter);
  }, [language]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => () => {
    stopRecording();
    stopSpeaking();
  }, []);

  return {
    isRecording, isProcessing, transcript, error, audioLevel,
    startRecording, stopRecording, speak, stopSpeaking,
    hasMicSupport: !!(navigator.mediaDevices || hasSpeechRecognition),
  };
}
