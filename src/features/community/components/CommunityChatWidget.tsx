'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/features/auth';
import { CommunityFeedService, CommunityFeedMessage } from '../services/communityFeedService';
import { RealtimeChannel } from '@supabase/supabase-js';

interface CommunityChatWidgetProps {
  className?: string;
}

export default function CommunityChatWidget({ className = '' }: CommunityChatWidgetProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CommunityFeedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Load messages function
  const loadMessages = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const fetchedMessages = await CommunityFeedService.getMessages(50);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!user || isRefreshing) return;

    setIsRefreshing(true);
    try {
      const fetchedMessages = await CommunityFeedService.getMessages(50);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error refreshing messages:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user, isRefreshing]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = CommunityFeedService.subscribeToMessages(
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
      },
      (error) => {
        console.error('Realtime subscription error:', error);
      }
    );

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSubmitting || !user) return;

    // Truncate to 250 characters
    const truncatedMessage = newMessage.trim().slice(0, 250);

    setIsSubmitting(true);
    try {
      await CommunityFeedService.postMessage({ message: truncatedMessage });
      setNewMessage('');
    } catch (error) {
      console.error('Error posting message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAuthorInitial = (message: CommunityFeedMessage): string => {
    // Try name first
    if (message.member?.name) {
      return message.member.name.charAt(0).toUpperCase();
    }
    // Fall back to email
    if (message.member?.email) {
      return message.member.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  if (!user) return null;

  return (
    <div className={`fixed top-20 left-4 z-50 max-w-[20rem] ${className}`}>
      <div className="flex flex-col h-[15rem]">
        {/* Header */}
        <div className="px-4 py-3 flex-shrink-0 flex items-center justify-between">
          <h3 className="text-white font-bold text-sm">Community Feed</h3>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-white/80 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh feed"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Scrollable Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 space-y-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-white text-sm py-8">
              <p>No messages yet.</p>
              <p className="mt-1">Be the first to say hello!</p>
            </div>
          ) : (
            messages.map((message) => {
              const authorName = CommunityFeedService.getAuthorDisplayName(message);
              const displayMessage = message.message.length > 250 
                ? message.message.slice(0, 250) + '...' 
                : message.message;

              return (
                <div
                  key={message.id}
                  className="flex items-center gap-2 flex-wrap"
                >
                  {/* Avatar - 20px */}
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                    {message.member?.avatar_url ? (
                      <img
                        src={message.member.avatar_url}
                        alt={authorName}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-[10px]">
                          {getAuthorInitial(message)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Name and message in one line */}
                  <span className="text-white font-medium text-sm whitespace-nowrap">{authorName}</span>
                  <span className="text-white/80 text-sm break-words">{displayMessage}</span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="px-4 py-3 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 250) {
                  setNewMessage(value);
                }
              }}
              placeholder="Type a message..."
              maxLength={250}
              className="flex-1 px-3 py-2 bg-transparent focus:outline-none text-sm text-white placeholder:text-white/60"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSubmitting}
              className="text-white p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
              aria-label="Send message"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <PaperAirplaneIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          {newMessage.length > 0 && (
            <p className="text-xs text-white/60 mt-1 text-right">
              {newMessage.length}/250
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
