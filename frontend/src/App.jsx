import { ChatProvider } from './context/ChatContext.jsx';
import ChatLayout from './components/Chat/ChatLayout.jsx';

export default function App() {
  return (
    <ChatProvider>
      <ChatLayout />
    </ChatProvider>
  );
}
