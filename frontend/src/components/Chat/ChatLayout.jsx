import { useState } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import Sidebar from './Sidebar.jsx';
import ChatWindow from './ChatWindow.jsx';
import ChatInput from './ChatInput.jsx';
import VoiceModal from '../Voice/VoiceModal.jsx';
import styles from './ChatLayout.module.css';

export default function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const { mode } = useChat();

  return (
    <div className={styles.root}>
      {/* Ambient background */}
      <div className={styles.ambient} />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={styles.main}>
        <ChatHeader onMenuClick={() => setSidebarOpen(s => !s)} />
        <ChatWindow />
        <ChatInput onVoiceOpen={() => setVoiceModalOpen(true)} />
      </main>

      {voiceModalOpen && <VoiceModal onClose={() => setVoiceModalOpen(false)} />}
    </div>
  );
}

function ChatHeader({ onMenuClick }) {
  const { clearChat } = useChat();
  return (
    <header className={styles.header}>
      <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Menu">
        <span /><span /><span />
      </button>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>🐄</div>
        <div>
          <div className={styles.brandName}>LiveStock AI</div>
          <div className={styles.brandSub}>Smart Verification Assistant</div>
        </div>
      </div>
      <div className={styles.headerActions}>
        <div className={styles.statusDot} />
        <button className={styles.clearBtn} onClick={clearChat} title="Clear chat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>
        </button>
      </div>
    </header>
  );
}
