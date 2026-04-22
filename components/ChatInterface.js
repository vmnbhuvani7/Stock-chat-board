'use client';

import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Send, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import StockChart from './Chart/StockChart';

// Separate memoized component for individual messages
const MessageItem = memo(({ message, renderMarkdown }) => {
  let messageContent = message?.content;

  if (message?.parts && Array.isArray(message?.parts)) {
    const textPart = message?.parts.find(part => part.type === 'text');
    if (textPart && textPart.text) {
      messageContent = textPart.text;
    }
  }

  return (
    <div className={`flex ${message?.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`${message?.role === 'user' ? 'max-w-[75%]' : 'max-w-[90%]'} px-6 py-4 rounded-2xl ${message?.role === 'user'
          ? 'bg-green-600 text-white'
          : 'bg-gray-800 text-gray-100 border border-gray-700'
          }`}
      >
        <div
          className="text-gray-100 
          [&_h1]:text-white [&_h1]:font-bold [&_h1]:text-lg [&_h1]:mb-3
          [&_h2]:text-white [&_h2]:font-bold [&_h2]:text-base [&_h2]:mb-2 [&_h2]:mt-3
          [&_h3]:text-green-400 [&_h3]:font-semibold [&_h3]:text-sm [&_h3]:mb-2
          [&_p]:mb-2 [&_p]:text-gray-200 [&_p]:leading-relaxed
          [&_strong]:text-white [&_strong]:font-bold
          [&_em]:text-green-300 [&_em]:italic
          [&_ul]:list-disc [&_ul]:list-inside [&_ul]:mb-3 [&_ul]:text-gray-200
          [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:mb-3 [&_ol]:text-gray-200
          [&_li]:mb-1 [&_li]:text-gray-200
          [&_code]:bg-gray-900 [&_code]:px-2 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-green-400 [&_code]:text-xs [&_code]:font-mono
          [&_pre]:bg-gray-900 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-3 [&_pre]:border [&_pre]:border-gray-700
          [&_pre_code]:text-green-400 [&_pre_code]:text-sm [&_pre_code]:font-mono
          [&_blockquote]:border-l-4 [&_blockquote]:border-green-500 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-3 [&_blockquote]:text-gray-300
          [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:bg-gray-900 [&_table]:rounded-lg [&_table]:overflow-hidden [&_table]:text-sm
          [&_thead]:bg-gradient-to-r [&_thead]:from-gray-700 [&_thead]:to-gray-800
          [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-white [&_th]:font-bold [&_th]:border-b [&_th]:border-gray-600 [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider
          [&_tbody_tr]:border-b [&_tbody_tr]:border-gray-700 [&_tbody_tr:hover]:bg-gray-800/50 [&_tbody_tr:last-child]:border-b-0
          [&_td]:px-4 [&_td]:py-3 [&_td]:text-gray-200 [&_td]:border-b [&_td]:border-gray-700
          [&_td_strong]:text-white [&_td_strong]:font-bold
          [&_tbody_tr:nth-child(odd)_td]:bg-gray-800/20
          [&_tbody_tr:nth-child(even)_td]:bg-gray-800/40"
        >
          {renderMarkdown(messageContent)}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export default function ChatInterface({ chatId }) {

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingMessage, setCurrentTypingMessage] = useState("");

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load chat messages from localStorage
    const chatHistory = localStorage.getItem('chatHistory');

    if (chatHistory) {
      const history = JSON.parse(chatHistory);
      const currentChat = history.find(chat => chat.id === chatId);
      if (currentChat) {
        setMessages(currentChat.messages || []);
      }
    }
  }, [chatId]);

  const saveMessagesToStorage = (updatedMessages) => {
    const chatHistory = localStorage.getItem('chatHistory');
    let history = chatHistory ? JSON.parse(chatHistory) : [];

    const chatIndex = history.findIndex(chat => chat.id === chatId);
    if (chatIndex >= 0) {
      history[chatIndex].messages = updatedMessages;
      history[chatIndex].timestamp = new Date().toISOString();
    } else {
      history.unshift({
        id: chatId,
        title: updatedMessages.length > 0 ? updatedMessages[0].content.substring(0, 30) + '...' : 'New Chat',
        timestamp: new Date().toISOString(),
        messages: updatedMessages
      });
    }

    localStorage.setItem('chatHistory', JSON.stringify(history));
    window.dispatchEvent(new Event('chatHistoryUpdated'));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveMessagesToStorage(updatedMessages);

    setInput('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/chat', {
        method: "POST",
        body: JSON.stringify({
          messages: updatedMessages
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const reader = res.body.getReader();
      let aiReply = "";
      let wordQueue = [];
      let isProcessingQueue = false;

      const processQueue = () => {
        if (isProcessingQueue) return;
        isProcessingQueue = true;

        const tick = () => {
          if (wordQueue.length === 0) {
            isProcessingQueue = false;
            return;
          }
          const next = wordQueue.shift();
          aiReply += next;
          setCurrentTypingMessage(aiReply);
          setTimeout(tick, 18);
        };

        tick();
      };

      setIsThinking(false);
      setIsTyping(true);
      setCurrentTypingMessage("");

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          const waitForQueue = () => {
            if (wordQueue.length > 0 || isProcessingQueue) {
              setTimeout(waitForQueue, 20);
            } else {
              setIsTyping(false);
              setCurrentTypingMessage("");
              const aiResponse = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: aiReply,
                timestamp: new Date().toISOString()
              };
              setMessages((prev) => [...prev, aiResponse]);
              saveMessagesToStorage((prev) => [...prev, aiResponse]);
            }
          };

          waitForQueue();
          break;
        }

        const raw = decoder.decode(value, { stream: true });
        const lines = raw.split("\n").filter(Boolean);
        for (const line of lines) {
          const prefix = line[0];
          const payload = line.slice(2);

          try {
            if (prefix === "0") {
              // Text chunk
              const text = JSON.parse(payload);
              const tokens = text.split(/(\s+)/);
              wordQueue.push(...tokens);
              processQueue();

            } else if (prefix === "3") {
              // Error sent from server
              const errMsg = JSON.parse(payload);
              throw new Error(errMsg);
            }
          } catch (err) {
            console.warn("Stream parse error:", err);
          }
        }
      }

    } catch (error) {
      setIsThinking(false);
      setIsTyping(false);
      setCurrentTypingMessage("");
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "Sorry, something went wrong.",
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, aiResponse]);
      saveMessagesToStorage((prev) => [...prev, aiResponse]);
      console.error('Error fetching AI response:', error);
    } finally {
      setIsThinking(false);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };


  // Memoize markdown components to prevent re-creation on every render
  const markdownComponents = useMemo(() => ({
    h1: ({ children }) => (
      <h1 className="text-white font-bold text-lg mb-3 mt-4">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-white font-bold text-base mb-2 mt-3">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-green-400 font-semibold text-sm mb-2">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-2 text-gray-200 leading-relaxed">{children}</p>
    ),
    strong: ({ children }) => (
      <strong className="text-white font-bold">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="text-green-300 italic">{children}</em>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-3 text-gray-200 ml-2">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-3 text-gray-200 ml-2">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="mb-1 text-gray-200">{children}</li>
    ),
    code: ({ inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const isChart = !inline && match && match[1] === 'chart';

      if (isChart) {
        try {
          const chartData = JSON.parse(String(children).replace(/\n$/, ''));
          return (
            <StockChart
              data={chartData.data}
              symbol={chartData.symbol}
              range={chartData.range}
            />
          );
        } catch (e) {
          return (
            <div className="w-full bg-gray-900/50 rounded-xl border border-gray-700 p-8 my-4 flex flex-col items-center justify-center animate-pulse">
              <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <p className="text-blue-400 text-sm font-medium">Generating interactive chart...</p>
            </div>
          );
        }
      }

      return inline ? (
        <code className="bg-gray-900 px-2 py-0.5 rounded text-green-400 text-xs font-mono" {...props}>
          {children}
        </code>
      ) : (
        <code className="block bg-gray-900 p-4 rounded-lg text-green-400 text-sm font-mono overflow-x-auto my-2 border border-gray-700" {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto my-3 border border-gray-700">
        {children}
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-green-500 pl-4 py-2 my-3 text-gray-300 bg-gray-800/30 rounded-r">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto rounded-lg border border-gray-700 my-4">
        <table className="w-full border-collapse bg-gray-900 text-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gradient-to-r from-gray-700 to-gray-800 sticky top-0">
        {children}
      </thead>
    ),
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => (
      <tr className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-3 text-left text-white font-bold border-b border-gray-600 text-xs uppercase tracking-wider bg-gray-700/50">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-gray-200 border-b border-gray-700">
        {children}
      </td>
    ),
  }), []);

  const renderReactMarkDown = (content) => {
    return <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  }
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
        {messages?.length === 0 && !isThinking && !isTyping ? (
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
          <div className="space-y-6 max-w-5xl mx-auto">
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                renderMarkdown={renderReactMarkDown}
              />
            ))}
            {isThinking && (
              <div className="flex justify-start animate-fadeIn">
                <div className="max-w-[90%] px-4 py-3 rounded-2xl bg-gray-800/90 border border-gray-700/30 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-blue-300">
                      AI is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isTyping && (
              <div className="flex justify-start animate-fadeIn">
                <div className="max-w-[90%] px-4 py-3 rounded-2xl bg-gray-800/90 border border-gray-700/30 shadow-lg">
                  <div className="prose prose-invert prose-sm max-w-none text-gray-200">
                    {renderReactMarkDown(currentTypingMessage)}
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-gray-400 text-xs">
                    <span>AI is typing</span>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-150"></span>
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-300"></span>
                    </div>
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
        <form onSubmit={handleSendMessage} className="max-w-5xl mx-auto">
          <div className="flex items-center space-x-4">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder={isThinking || isTyping ? "AI is responding..." : "Type your message..."}
              className="flex-1 px-6 py-4 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isThinking || isTyping}
            />
            <button
              type="submit"
              disabled={!input?.trim() || isThinking || isTyping}
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
