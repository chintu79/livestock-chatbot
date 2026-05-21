import { useState, useRef, useCallback } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import styles from './ChatInput.module.css';

const SUGGESTIONS = [
  'How do I register my cattle?',
  'What is an RFID ear tag?',
  'Which documents are required?',
  'How does verification work?',
];

export default function ChatInput({ onVoiceOpen }) {
  const [text, setText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const { sendMessage, isLoading } = useChat();
  const textareaRef = useRef(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setText('');
    setShowSuggestions(false);
    sendMessage(trimmed);
    textareaRef.current?.focus();
  }, [text, isLoading, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (s) => {
    setShowSuggestions(false);
    sendMessage(s);
  };

  const handleInput = (e) => {
    setText(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  return (
    <div className={styles.wrapper}>
      {showSuggestions && (
        <div className={styles.suggestions}>
          {SUGGESTIONS.map(s => (
            <button key={s} className={styles.chip} onClick={() => handleSuggestion(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className={styles.inputRow}>
        <div className={styles.inputBox}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask about cattle registration, RFID, schemes..."
            disabled={isLoading}
            rows={1}
          />

          <div className={styles.actions}>
            <button
              className={styles.voiceBtn}
              onClick={onVoiceOpen}
              title="Voice input"
              type="button"
            >
              <MicIcon />
            </button>

            <button
              className={`${styles.sendBtn} ${text.trim() && !isLoading ? styles.sendActive : ''}`}
              onClick={handleSend}
              disabled={!text.trim() || isLoading}
              type="button"
            >
              {isLoading ? <LoadingSpinner /> : <SendIcon />}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <span>AI may make mistakes. Verify important information with authorities.</span>
      </div>
    </div>
  );
}

const MicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
    <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const LoadingSpinner = () => (
  <div className={styles.spinner} />
);
