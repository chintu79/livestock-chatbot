import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from '../../context/ChatContext.jsx';
import styles from './ChatWindow.module.css';

export default function ChatWindow() {
  const { messages, isStreaming, streamingContent } = useChat();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  return (
    <div className={styles.window}>
      <div className={styles.messages}>
        {messages.map((msg, i) => (
          <MessageBubble key={msg.id || i} message={msg} />
        ))}

        {isStreaming && (
          <div className={`${styles.bubble} ${styles.ai} fade-up`}>
            <div className={styles.avatar}>🐄</div>
            <div className={styles.content}>
              {streamingContent ? (
                <div className={`markdown-body ${styles.markdown}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamingContent}
                  </ReactMarkdown>
                </div>
              ) : (
                <TypingIndicator />
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`${styles.bubble} ${isUser ? styles.user : styles.ai} fade-up`}>
      {!isUser && <div className={styles.avatar}>🐄</div>}
      <div className={styles.content}>
        <div className={`${styles.text} ${isUser ? styles.userText : ''}`}>
          {isUser ? (
            <span>{message.content}</span>
          ) : (
            <div className={`markdown-body ${styles.markdown}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <div className={styles.meta}>
          {message.type === 'voice' && <span className={styles.voiceTag}>🎤 Voice</span>}
          <span className={styles.time}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      {isUser && <div className={styles.userAvatar}>👤</div>}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className={styles.typing}>
      <span /><span /><span />
    </div>
  );
}
