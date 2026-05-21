import { useEffect, useCallback, useState } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { useVoiceRecording } from '../../hooks/useVoiceRecording.js';
import styles from './VoiceModal.module.css';

export default function VoiceModal({ onClose }) {
  const { language, sendVoiceMessage, isLoading } = useChat();
  const {
    isRecording, isProcessing, transcript, error, audioLevel,
    startRecording, stopRecording, speak, stopSpeaking, hasMicSupport,
  } = useVoiceRecording(language);

  const [phase, setPhase] = useState('idle'); // idle | listening | thinking | speaking
  const [response, setResponse] = useState('');

  const handleToggleRecord = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      setPhase('thinking');
    } else {
      stopSpeaking();
      setResponse('');
      setPhase('listening');
      await startRecording(async (text) => {
        if (!text) return;
        setPhase('thinking');
        const reply = await sendVoiceMessage(text);
        if (reply) {
          setResponse(reply);
          setPhase('speaking');
          speak(reply);
          // After speaking (rough estimate), return to idle
          const wordCount = reply.split(' ').length;
          const duration = Math.max(3000, wordCount * 400);
          setTimeout(() => setPhase('idle'), duration);
        } else {
          setPhase('idle');
        }
      });
    }
  }, [isRecording, startRecording, stopRecording, sendVoiceMessage, speak, stopSpeaking]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') { stopRecording(); stopSpeaking(); onClose(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, stopRecording, stopSpeaking]);

  const phaseLabel = {
    idle: 'Tap to speak',
    listening: 'Listening...',
    thinking: 'Thinking...',
    speaking: 'Speaking...',
  }[phase];

  const isBusy = isLoading || isProcessing || phase === 'thinking';

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={() => { stopRecording(); stopSpeaking(); onClose(); }}>✕</button>

        <div className={styles.icon}>🐄</div>
        <h2 className={styles.title}>Voice Assistant</h2>
        <p className={styles.subtitle}>Ask anything about livestock schemes & verification</p>

        {/* Waveform visualizer */}
        <div className={styles.waveWrapper}>
          <Waveform active={isRecording} level={audioLevel} phase={phase} />
        </div>

        {/* Status */}
        <div className={`${styles.status} ${styles[phase]}`}>{phaseLabel}</div>

        {/* Transcript */}
        {transcript && (
          <div className={styles.transcript}>
            <span className={styles.transcriptLabel}>You said:</span>
            <span>"{transcript}"</span>
          </div>
        )}

        {/* Response */}
        {response && (
          <div className={styles.response}>
            <span className={styles.responseLabel}>Assistant:</span>
            <p>{response}</p>
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        {!hasMicSupport && (
          <div className={styles.error}>Microphone not supported in this browser. Please use Chrome or Edge.</div>
        )}

        {/* Main button */}
        <button
          className={`${styles.micBtn} ${isRecording ? styles.recording : ''} ${isBusy ? styles.busy : ''}`}
          onClick={handleToggleRecord}
          disabled={isBusy || !hasMicSupport}
        >
          {isRecording ? <StopIcon /> : <MicIcon />}
          {isRecording && <span className={styles.pulseRing} />}
        </button>

        <div className={styles.hint}>
          {isRecording ? 'Tap to stop' : phase === 'speaking' ? 'Tap to interrupt' : 'Hold to speak in any language'}
        </div>
      </div>
    </div>
  );
}

function Waveform({ active, level, phase }) {
  const bars = 28;
  return (
    <div className={styles.waveform}>
      {Array.from({ length: bars }, (_, i) => {
        const center = bars / 2;
        const dist = Math.abs(i - center) / center; // 0 at center, 1 at edges
        const baseH = active ? (1 - dist * 0.7) * level * 100 : 4;
        const animDelay = i * 0.06;
        return (
          <div
            key={i}
            className={`${styles.bar} ${active ? styles.barActive : ''} ${phase === 'speaking' ? styles.barSpeaking : ''}`}
            style={{
              height: `${Math.max(4, baseH)}%`,
              animationDelay: `${animDelay}s`,
            }}
          />
        );
      })}
    </div>
  );
}

const MicIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
    <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
  </svg>
);

const StopIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="3"/>
  </svg>
);
