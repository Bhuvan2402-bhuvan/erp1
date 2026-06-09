'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useSupabase } from '@/lib/supabase/client-provider';

export default function ChatBox({ currentUser, targetUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const supabase = useSupabase();

  const fetchMessages = useCallback(async () => {
    if (!targetUser) return;
    try {
      const res = await fetch(`/api/chat?userId=${targetUser.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
      }
    } catch (e) {
      console.error("Failed to fetch messages");
    }
  }, [targetUser]);

  useEffect(() => {
    if (targetUser) {
      fetchMessages();
      
      const channel = supabase
        .channel(`chat_${targetUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const newMsg = payload.new;
            if (
              (newMsg.senderId === currentUser.id && newMsg.receiverId === targetUser.id) ||
              (newMsg.senderId === targetUser.id && newMsg.receiverId === currentUser.id)
            ) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [targetUser, currentUser.id, fetchMessages, supabase]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !targetUser) return;

    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiverId: targetUser.id,
        content: newMessage
      })
    });

    setNewMessage('');
    fetchMessages();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!targetUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/40">
        <MessageSquare className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700 animate-pulse" />
        <h4 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">Your Chat Inbox</h4>
        <p className="text-xs text-slate-500 max-w-xs">Select a contact from the list on the left to start real-time messaging.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-logo-teal/10 dark:bg-logo-teal/20 flex items-center justify-center text-logo-teal font-bold shrink-0">
            {targetUser.name?.charAt(0) || '?'}
          </div>
          <div>
            <h3 className="font-bold">{targetUser.name}</h3>
            <p className="text-xs text-slate-500">{targetUser.email}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 space-y-4">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser.id;
          const showTime = idx === messages.length - 1 || new Date(messages[idx+1]?.createdAt) - new Date(msg.createdAt) > 300000;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-logo-teal text-white rounded-br-sm shadow-sm' : 'bg-white dark:bg-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-bl-sm shadow-sm'}`}>
                {msg.content}
              </div>
              {showTime && (
                <span className="text-[10px] text-slate-400 mt-1 mx-1">
                  {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
            <p>No messages yet. Say hello!</p>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-3 shrink-0">
        <input 
          type="text" 
          value={newMessage} 
          onChange={e => setNewMessage(e.target.value)} 
          placeholder="Type a message..." 
          className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 dark:text-white rounded-full text-sm outline-none focus:ring-2 focus:ring-logo-teal transition-all border border-transparent focus:border-logo-teal/40 dark:focus:border-logo-teal/60"
        />
        <button type="submit" disabled={!newMessage.trim()} className="p-3 bg-logo-teal text-white rounded-full hover:bg-logo-navy disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
