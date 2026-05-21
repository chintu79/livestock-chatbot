import { useChat, SUPPORTED_LANGUAGES } from '../../context/ChatContext.jsx';
import styles from './Sidebar.module.css';

const QUICK_TOPICS = [
  { icon: '📋', label: 'Scheme Registration', prompt: 'How do I register for a cattle scheme?' },
  { icon: '📡', label: 'RFID Tags & Scanning', prompt: 'How does RFID tagging work for cattle?' },
  { icon: '📄', label: 'Document Requirements', prompt: 'What documents do I need to upload?' },
  { icon: '🔍', label: 'Cattle Verification', prompt: 'How does the cattle verification process work?' },
  { icon: '📱', label: 'App Guide', prompt: 'How do I use the mobile app to register cattle?' },
  { icon: '✅', label: 'Approval Status', prompt: 'How can I check my scheme application status?' },
  { icon: '🔒', label: 'Fraud Prevention', prompt: 'How does the system prevent fake cattle counts?' },
  { icon: '🛠️', label: 'Troubleshoot', prompt: 'The RFID reader is not scanning the tag properly.' },
];

export default function Sidebar({ open, onClose }) {
  const { sendMessage, language, changeLanguage } = useChat();

  const handleTopic = (prompt) => {
    sendMessage(prompt);
    onClose();
  };

  return (
    <>
      {open && <div className={styles.overlay} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <div className={styles.header}>
          <span className={styles.title}>Quick Help</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Topics</div>
          <nav className={styles.topics}>
            {QUICK_TOPICS.map(({ icon, label, prompt }) => (
              <button key={label} className={styles.topicBtn} onClick={() => handleTopic(prompt)}>
                <span className={styles.topicIcon}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Language</div>
          <div className={styles.langGrid}>
            {SUPPORTED_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                className={`${styles.langBtn} ${language === lang.code ? styles.langActive : ''}`}
                onClick={() => changeLanguage(lang.code)}
              >
                <span className={styles.langNative}>{lang.native}</span>
                <span className={styles.langLabel}>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerCard}>
            <div className={styles.footerTitle}>🏛️ Need Official Help?</div>
            <div className={styles.footerText}>Contact your nearest Animal Husbandry Department office for scheme-related queries.</div>
          </div>
        </div>
      </aside>
    </>
  );
}
