'use client';

import ChatSection from '../../../components/chat-interface/ChatSection';
import { useAuth } from '../../../components/AuthProvider';

export default function ChatPage() {
  const { user } = useAuth();

  if (!user) return null;

  return <ChatSection user={user} activeChatId={null} />;
}