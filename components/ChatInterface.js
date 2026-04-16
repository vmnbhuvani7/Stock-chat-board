'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, User } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';

export default function ChatInterface({ chatId }) {
  const { messages, status, error, sendMessage } = useChat({
    api: '/api/chat',
    id: chatId || undefined,
    // body: {
    //   resourceId: 'anonymous',
    //   // resourceId: currentUser?.id || 'anonymous',
    // },
    onFinish: async () => {
      window.dispatchEvent(new Event('chatHistoryUpdated'))
      // if (!hasRoutedRef.current && chatIdRef.current) {
      //   hasRoutedRef.current = true
      //   router.replace(/chat/${chatIdRef.current})
      // }
    },
    onError: e => console.error("inside error 22", e),
  })
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const isLoading = status === 'submitted' || status === 'streaming';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // useEffect(() => {
  //   // Load user name and chat messages from localStorage
  //   const name = localStorage.getItem('userName');
  //   const chatHistory = localStorage.getItem('chatHistory');

  //   if (name) setUserName(name);
  //   if (chatHistory) {
  //     const history = JSON.parse(chatHistory);
  //     const currentChat = history.find(chat => chat.id === chatId);
  //     if (currentChat) {
  //       setMessages(currentChat.messages || []);
  //     }
  //   }
  // }, [chatId]);

  // const saveMessagesToStorage = (updatedMessages) => {
  //   const chatHistory = localStorage.getItem('chatHistory');
  //   let history = chatHistory ? JSON.parse(chatHistory) : [];

  //   const chatIndex = history.findIndex(chat => chat.id === chatId);
  //   if (chatIndex >= 0) {
  //     history[chatIndex].messages = updatedMessages;
  //     history[chatIndex].timestamp = new Date().toISOString();
  //   } else {
  //     history.unshift({
  //       id: chatId,
  //       title: updatedMessages.length > 0 ? updatedMessages[0].content.substring(0, 30) + '...' : 'New Chat',
  //       timestamp: new Date().toISOString(),
  //       messages: updatedMessages
  //     });
  //   }

  //   localStorage.setItem('chatHistory', JSON.stringify(history));
  // };

  // const handleSendMessage = async (e) => {
  //   e.preventDefault();
  //   if (!input.trim() || isLoading) return;
  //   const userMessage = {
  //     id: Date.now().toString(),
  //     role: 'user',
  //     content: input.trim(),
  //     timestamp: new Date().toISOString()
  //   };

  //   const updatedMessages = [...messages, userMessage];
  //   setMessages(updatedMessages);
  //   saveMessagesToStorage(updatedMessages);

  //   setInput('');
  //   setIsLoading(true);

  //   await fetch('/api/chat', {
  //     method: "POST",
  //     body: JSON.stringify({
  //       messages: input.trim()
  //     }),
  //     headers: {
  //       'Content-Type': 'application/json'
  //     }
  //   }).then((res) => res.json()).then((data) => {
  //     const aiResponse = {
  //       id: (Date.now() + 1).toString(),
  //       role: 'assistant',
  //       content: data?.content,
  //       timestamp: new Date().toISOString()
  //     };

  //     const finalMessages = [...updatedMessages, aiResponse];
  //     setMessages(finalMessages);
  //     saveMessagesToStorage(finalMessages);
  //     setIsLoading(false);
  //   }).catch((error) => {
  //     console.error('Error fetching AI response:', error);
  //     setIsLoading(false);
  //   });
  // };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    await sendMessage({
      role: 'user',
      content: input,
    });

    setInput(''); // clear input after send
  };


  return (
    <div className="flex-1 flex flex-col bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">AI Assistant</h1>
            <p className="text-gray-400 text-sm mt-1">Powered by Advanced AI</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{'User'}</p>
                <p className="text-xs text-gray-400">vmn.scalelam@gmail.com</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userName');
                localStorage.removeItem('currentUserId');
                window.location.href = '/login';
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            {/* Gradient Circle */}
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <div className="w-28 h-28 bg-gray-950 rounded-full flex items-center justify-center">
                  <User className="w-16 h-16 text-green-400" />
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              Hello Vmn! How can I help you today?
            </h2>
            <p className="text-gray-400 text-lg max-w-md mx-auto">
              Ask me anything, I'm here to assist you with your questions.
            </p>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.map((message) => {
              // Handle both direct content and parts array structure
              let messageContent = message?.content;

              if (message?.parts && Array.isArray(message?.parts)) {
                const textPart = message?.parts.find(part => part.type === 'text');
                if (textPart && textPart.text) {
                  messageContent = textPart.text;
                }
              }

              return (
                <div
                  key={message?.id}
                  className={`flex ${message?.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl px-6 py-4 rounded-2xl ${message?.role === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-100 border border-gray-700'
                      }`}
                  >
                    <ReactMarkdown
                      // className="whitespace-pre-wrap prose prose-invert max-w-none"
                      components={{
                        p: ({ children }) => <p className="text-gray-100 mb-2">{children}</p>,
                        strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 text-gray-100">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 text-gray-100">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        code: ({ inline, children }) =>
                          inline
                            ? <code className="bg-gray-700 px-1 py-0.5 rounded text-green-400 text-sm">{children}</code>
                            : <code className="block bg-gray-700 p-2 rounded text-green-400 text-sm overflow-x-auto">{children}</code>,
                        pre: ({ children }) => <pre className="bg-gray-800 p-3 rounded-lg overflow-x-auto mb-2">{children}</pre>,
                      }}
                    >
                      {messageContent}
                    </ReactMarkdown>
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400"></div>
                    <p className="text-gray-400">Thinking...</p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-8 py-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 px-6 py-4 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-200"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input?.trim() || isLoading}
              className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
