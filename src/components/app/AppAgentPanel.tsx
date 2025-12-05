'use client';

import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'thinking';
  content: string;
  timestamp: Date;
}

interface AppAgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOCK_RESPONSE = "The Minnesota UDA agent is coming soon.";

export default function AppAgentPanel({ isOpen, onClose }: AppAgentPanelProps) {
  const headerHeight = '3.5rem'; // 56px
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isThinking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsThinking(true);

    // Simulate thinking delay (1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    setIsThinking(false);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: MOCK_RESPONSE,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle close - AppWrapper will sync state via event dispatch
  const handleClose = () => {
    onClose();
  };

  return (
    <>
      {/* Mobile: Slide up overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/80 z-[95]"
          onClick={handleClose}
        />
      )}

      {/* Agent Panel Container */}
      <div
        className={`
          fixed z-[96]
          transition-all duration-300 ease-out
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          md:right-0 md:w-full md:max-w-[480px]
          ${isOpen ? 'md:translate-x-0' : 'md:translate-x-full'}
          right-0 w-full max-w-full
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          md:bg-black/40 md:backdrop-blur-md
          bg-black/95
        `}
        style={{
          top: headerHeight,
          bottom: 0,
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem',
        }}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b md:border-white/10 border-white/20">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold md:text-white text-white">Coming soon</h2>
            <button className="p-1 md:text-white/70 text-white/70 hover:md:text-white hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClose}
              className="p-1.5 md:text-white/70 text-white/70 hover:md:text-white hover:text-white rounded transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Feed */}
        <div 
          className="flex-1 overflow-y-auto px-4 py-6"
          style={{ height: 'calc(100% - 3.5rem - 4rem)' }}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              {/* Greeting */}
              <h3 className="text-xl font-semibold md:text-white text-white mb-2 font-libre-baskerville">Hey there</h3>
              <p className="md:text-white/70 text-white/70 mb-8">The Minnesota UDA agent is coming soon.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'md:bg-white/20 bg-white/30 text-white'
                        : 'md:bg-white/10 bg-white/20 text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="md:bg-white/10 bg-white/20 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 md:bg-white/70 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 md:bg-white/70 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 md:bg-white/70 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm md:text-white/70 text-white">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t md:border-white/10 border-white/20 px-4 py-3">
          <div className="flex items-end gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isThinking}
              className="flex-1 px-4 py-2 md:bg-white/10 bg-white/20 border md:border-white/20 border-white/30 rounded-lg md:text-white text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isThinking}
              className="p-2 md:bg-white/20 bg-white/30 md:text-white text-white rounded-lg hover:md:bg-white/30 hover:bg-white/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

