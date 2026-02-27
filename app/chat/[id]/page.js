'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import ChatInterface from '../../../components/ChatInterface';

export default function ChatIdPage() {
  const router = useRouter();
  const params = useParams();
  const [chatId, setChatId] = useState(null);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Get chat ID from params
    if (params?.id) {
      setChatId(params.id);
    }
  }, [router, params]);

  if (!chatId) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center bg-gray-950">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar currentChatId={chatId} />
      <ChatInterface chatId={chatId} />
    </div>
  );
}
