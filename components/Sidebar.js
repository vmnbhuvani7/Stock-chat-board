'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MessageSquare, TrendingUp, LogOut, User, Trash2 } from 'lucide-react';

export default function Sidebar({ currentChatId }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Load user data and chat history from localStorage
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');
    const history = localStorage.getItem('chatHistory');
    
    if (email) setUserEmail(email);
    if (name) setUserName(name);
    if (history) {
      setChatHistory(JSON.parse(history));
    }
  }, []);

  const createNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat = {
      id: newChatId,
      title: 'New Chat',
      timestamp: new Date().toISOString(),
      messages: []
    };
    
    const updatedHistory = [newChat, ...chatHistory];
    setChatHistory(updatedHistory);
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
    router.push(`/chat/${newChatId}`);
  };

  const handleChatClick = (chatId) => {
    router.push(`/chat/${chatId}`);
  };

  const deleteChat = (chatId, e) => {
    console.log("🚀 ~ deleteChat ~ chatId:", chatId)
    e.stopPropagation();
    
    const updatedHistory = chatHistory.filter(chat => chat.id !== chatId);
    console.log("🚀 ~ deleteChat ~ chatHistory:", chatHistory)
    console.log("🚀 ~ deleteChat ~ updatedHistory:", updatedHistory)
    setChatHistory(updatedHistory);
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
    
    // If current chat is deleted, redirect to new chat
    // if (currentChatId === chatId) {
    //   createNewChat();
    // }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('currentUserId');
    router.push('/login');
  };

  const formatChatTitle = (messages) => {
    if (messages && messages.length > 0) {
      const firstUserMessage = messages.find(msg => msg.role === 'user');
      if (firstUserMessage) {
        return firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
      }
    }
    return 'New Chat';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-80 bg-gray-900 text-white h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <TrendingUp className="w-6 h-6 text-green-500 mr-2" />
            <span className="font-semibold text-lg">AI Assistant</span>
          </div>
        </div>
        
        <button
          onClick={createNewChat}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center transition duration-200 font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Chat
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="text-lg font-medium text-gray-300 mb-2">Chat History</h3>
        <p className="text-sm text-gray-500 mb-4">Your personal conversations</p>
        <div className="space-y-2">
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              className={`group relative rounded-lg transition duration-200 ${
                currentChatId === chat.id
                  ? 'bg-gray-800'
                  : 'hover:bg-gray-800'
              }`}
            >
              <div className="flex items-start justify-between p-3 rounded-lg">
                <div 
                  onClick={() => handleChatClick(chat.id)}
                  className="flex items-start flex-1 min-w-0 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 mr-3 mt-1 flex-shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {formatChatTitle(chat.messages)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(chat.timestamp)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600 rounded transition duration-200"
                  title="Delete chat"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Footer */}
      {/* <div className="p-6 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mr-3">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">{userName || 'User'}</p>
              <p className="text-xs text-gray-500 truncate max-w-32">
                {userEmail || 'guest@example.com'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white transition duration-200 p-2 hover:bg-gray-800 rounded"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div> */}
    </div>
  );
}
