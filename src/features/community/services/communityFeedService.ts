import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface CommunityFeedMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  // Joined from members table
  member?: {
    name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface CreateMessageData {
  message: string;
}

export class CommunityFeedService {
  /**
   * Get recent messages from the community feed
   * @param limit Maximum number of messages to fetch (default: 50)
   */
  static async getMessages(limit: number = 50): Promise<CommunityFeedMessage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('community_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    if (!messages || messages.length === 0) {
      return [];
    }

    // Fetch member data for all unique user IDs
    const userIds = [...new Set(messages.map(m => m.user_id))];
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name, email, avatar_url')
      .in('id', userIds);

    if (membersError) {
      console.warn('Error fetching members (non-fatal):', membersError);
    }

    // Create a map of user_id -> member
    const memberMap = new Map(
      (members || []).map(m => [m.id, m])
    );

    // Enrich messages with member data
    const enrichedMessages: CommunityFeedMessage[] = messages.map(msg => ({
      ...msg,
      member: memberMap.get(msg.user_id) || undefined,
    }));

    // Reverse to show oldest first (for chat UI)
    return enrichedMessages.reverse();
  }

  /**
   * Post a new message to the community feed
   */
  static async postMessage(data: CreateMessageData): Promise<CommunityFeedMessage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!data.message.trim()) {
      throw new Error('Message cannot be empty');
    }

    if (data.message.length > 250) {
      throw new Error('Message cannot exceed 250 characters');
    }

      // Ensure member record exists (trigger should create it, but ensure it exists)
      const { data: existingMember } = await supabase
        .from('members')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingMember) {
        // Create member record if it doesn't exist
        const { error: memberError } = await supabase
          .from('members')
          .insert({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || null,
            role: 'general',
          });

        if (memberError) {
          console.error('Error ensuring member record:', memberError);
          // Continue anyway - the FK constraint will catch it if needed
        }
      }

    const { data: message, error } = await supabase
      .from('community_feed')
      .insert({
        user_id: user.id,
        message: data.message.trim(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error posting message:', error);
      throw new Error(`Failed to post message: ${error.message}`);
    }

    // Fetch member data
    const { data: member } = await supabase
      .from('members')
      .select('name, email, avatar_url')
      .eq('id', user.id)
      .single();

    return {
      ...message,
      member: member || undefined,
    };
  }

  /**
   * Subscribe to realtime updates for the community feed
   * @param onInsert Callback when a new message is inserted
   * @param onError Callback for errors
   * @returns RealtimeChannel for cleanup
   */
  static subscribeToMessages(
    onInsert: (message: CommunityFeedMessage) => void,
    onError?: (error: Error) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel('community_feed_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_feed',
        },
        async (payload) => {
          try {
            // Fetch the full message with member data
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: message, error } = await supabase
              .from('community_feed')
              .select('*')
              .eq('id', payload.new.id)
              .single();

            if (error) {
              console.error('Error fetching new message:', error);
              onError?.(new Error(`Failed to fetch new message: ${error.message}`));
              return;
            }

            if (message) {
              // Fetch member data
              const { data: member } = await supabase
                .from('members')
                .select('name, email, avatar_url')
                .eq('id', message.user_id)
                .single();

              onInsert({
                ...message,
                member: member || undefined,
              });
            }
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            console.error('Error in realtime subscription:', error);
            onError?.(error);
          }
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Get display name for a message author
   * Priority: Name > Email prefix > Anonymous
   */
  static getAuthorDisplayName(message: CommunityFeedMessage): string {
    if (message.member) {
      // Try name first
      if (message.member.name) {
        return message.member.name;
      }
      
      // Fall back to email prefix
      if (message.member.email) {
        return message.member.email.split('@')[0];
      }
    }
    
    // Fallback to anonymous if no member data
    return 'Anonymous';
  }

  /**
   * Format timestamp for display
   */
  static formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }
}

