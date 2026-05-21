import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ChatContext = createContext(null);

const SESSION_KEY = 'livestock_chat_session';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
];

export function ChatProvider({ children }) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [mode, setMode] = useState('text'); // 'text' | 'voice'

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      let sid = localStorage.getItem(SESSION_KEY);
      if (!sid) {
        try {
          const res = await fetch('/api/session/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language }),
          });
          const data = await res.json();
          sid = data.sessionId;
          localStorage.setItem(SESSION_KEY, sid);

          // Load history if session exists
          setMessages([{
            id: uuidv4(),
            role: 'assistant',
            content: `🐄 **Welcome to the Smart Livestock Verification Assistant!**\n\nI can help you with:\n- Cattle registration & RFID tagging\n- Government scheme applications\n- Document upload guidance\n- Verification process queries\n\nHow can I assist you today?`,
            type: 'text',
            timestamp: new Date(),
          }]);
        } catch (err) {
          sid = uuidv4();
          localStorage.setItem(SESSION_KEY, sid);
        }
      } else {
        // Restore history from backend
        try {
          const res = await fetch(`/api/chat/history/${sid}`);
          if (res.ok) {
            const data = await res.json();
            if (data.messages?.length) {
              setMessages(data.messages.map(m => ({ ...m, id: uuidv4() })));
              setLanguage(data.language || 'en');
            } else {
              setMessages([{
                id: uuidv4(),
                role: 'assistant',
                content: `🐄 **Welcome back!** How can I help you today?`,
                type: 'text',
                timestamp: new Date(),
              }]);
            }
          }
        } catch { /* continue */ }
      }
      setSessionId(sid);
    };
    initSession();
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || !sessionId || isLoading) return;

    const userMsg = { id: uuidv4(), role: 'user', content: text, type: 'text', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text, language }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.type === 'delta') {
              accumulated += parsed.delta;
              setStreamingContent(accumulated);
            } else if (parsed.type === 'done') {
              const aiMsg = { id: uuidv4(), role: 'assistant', content: accumulated, type: 'text', timestamp: new Date() };
              setMessages(prev => [...prev, aiMsg]);
              setStreamingContent('');
              setIsStreaming(false);
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: uuidv4(), role: 'assistant',
        content: '❌ Connection error. Please check your network and try again.',
        type: 'error', timestamp: new Date(),
      }]);
      setIsStreaming(false);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, language, isLoading]);

  const sendVoiceMessage = useCallback(async (transcript) => {
    if (!transcript.trim() || !sessionId) return;

    const userMsg = { id: uuidv4(), role: 'user', content: transcript, type: 'voice', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, transcript, language }),
      });
      const data = await res.json();
      const aiMsg = { id: uuidv4(), role: 'assistant', content: data.reply, type: 'voice', timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      return data.reply; // return for TTS
    } catch {
      setMessages(prev => [...prev, {
        id: uuidv4(), role: 'assistant',
        content: '❌ Voice response failed. Please try again.',
        type: 'error', timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, language]);

  const clearChat = useCallback(async () => {
    if (!sessionId) return;
    await fetch(`/api/chat/history/${sessionId}`, { method: 'DELETE' });
    setMessages([{
      id: uuidv4(), role: 'assistant',
      content: '🗑️ Chat cleared. How can I help you?',
      type: 'text', timestamp: new Date(),
    }]);
  }, [sessionId]);

  const changeLanguage = useCallback(async (lang) => {
    setLanguage(lang);
    if (sessionId) {
      await fetch(`/api/session/${sessionId}/language`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang }),
      });
    }
  }, [sessionId]);

  return (
    <ChatContext.Provider value={{
      sessionId, messages, language, isLoading, isStreaming,
      streamingContent, mode, setMode,
      sendMessage, sendVoiceMessage, clearChat, changeLanguage,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
