'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageTransition from '@/components/PageTransition';
import ChatMessage from '@/components/ChatMessage';
import VoiceInputButton from '@/components/VoiceInputButton';
import {
  sendChatMessage,
  listChatSessions,
  getChatSession,
  deleteChatSession,
} from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';

const WELCOME_MSG = "Hello! I'm your CureSync AI Health Assistant. I can answer questions about medicines and medications — uses, dosage, side effects, and drug interactions. How can I help you today?";

const SUGGESTIONS = [
  "What are the side effects of ibuprofen?",
  "Can I take aspirin with warfarin?",
  "How should I take metformin?",
  "What foods interact with my medications?",
];

export default function HealthAssistantPage() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME_MSG },
  ]);
  const [history, setHistory] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await listChatSessions();
      setSessions(data);
    } catch {
      // Silently fail
    }
  };

  const loadSession = async (id) => {
    try {
      const session = await getChatSession(id);
      if (session && session.messages) {
        const loaded = session.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        setMessages(loaded);
        setHistory(loaded.map((m) => ({ role: m.role, content: m.content })));
        setSessionId(id);
        setSidebarOpen(false);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  const startNewChat = () => {
    setMessages([{ role: 'assistant', content: WELCOME_MSG }]);
    setHistory([]);
    setSessionId(null);
    setInput('');
    setSidebarOpen(false);
  };

  const handleDeleteSession = async (id) => {
    try {
      await deleteChatSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (sessionId === id) {
        startNewChat();
      }
    } catch {
      // Silently fail
    }
  };

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setLoading(true);
    try {
      const response = await sendChatMessage(msg, history, sessionId, language);
      setMessages((prev) => [...prev, { role: 'assistant', content: response.reply }]);
      setHistory(response.history);
      if (response.session_id) {
        setSessionId(response.session_id);
      }
      loadSessions();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please make sure the backend is running and try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <PageTransition>
          <div className="max-w-5xl mx-auto flex gap-4" style={{ height: 'calc(100vh - 180px)' }}>
            {/* Sidebar toggle (mobile) */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden fixed bottom-4 left-4 z-40 w-12 h-12 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>

            {/* Session sidebar */}
            <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-72 shrink-0 bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 shadow-sm flex flex-col overflow-hidden`}>
              <div className="p-3 border-b border-slate-200 dark:border-neutral-700">
                <button
                  onClick={startNewChat}
                  className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  + New Chat
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {sessions.length === 0 ? (
                  <p className="p-4 text-xs text-slate-400 dark:text-neutral-500 text-center">No previous conversations</p>
                ) : (
                  sessions.map((s) => (
                    <div
                      key={s.id}
                      className={`group flex items-start gap-2 px-3 py-2.5 cursor-pointer border-b border-slate-50 dark:border-neutral-700/50 transition-colors ${
                        sessionId === s.id ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-slate-50 dark:hover:bg-neutral-700/50'
                      }`}
                      onClick={() => loadSession(s.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 dark:text-neutral-200 truncate">
                          {s.title || 'New Chat'}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">{formatDate(s.created_at)}</p>
                        {s.last_message && (
                          <p className="text-[10px] text-slate-500 dark:text-neutral-400 truncate mt-0.5">{s.last_message}</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-danger-500 transition-opacity p-0.5"
                        title="Delete conversation"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 shadow-sm flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-neutral-700 flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-neutral-100">AI Health Assistant</h1>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">Ask medicine-related questions and get AI-powered answers.</p>
                </div>
                {language !== 'en' && (
                  <span className="text-[10px] px-2 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full font-medium">
                    {language.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {messages.map((msg, idx) => (
                  <ChatMessage key={idx} message={msg.content} isUser={msg.role === 'user'} />
                ))}

                {/* Typing indicator */}
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-start mb-4"
                    >
                      <div className="bg-white dark:bg-neutral-700 border border-slate-200 dark:border-neutral-600 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-5 h-5 bg-medical-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">AI</span>
                          </div>
                          <span className="text-xs font-medium text-medical-600 dark:text-medical-400">CureSync Assistant</span>
                        </div>
                        <div className="flex gap-1.5">
                          <motion.div className="w-2 h-2 bg-slate-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                          <motion.div className="w-2 h-2 bg-slate-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} />
                          <motion.div className="w-2 h-2 bg-slate-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>

              {/* Suggestion chips */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(s)}
                      className="text-xs px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input area */}
              <div className="border-t border-slate-200 dark:border-neutral-700 p-3">
                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a medicine-related question..."
                    rows={1}
                    className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  />
                  <VoiceInputButton
                    language={language}
                    onResult={(text) => setInput((prev) => (prev ? prev + ' ' : '') + text)}
                    className="w-10 h-10"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </PageTransition>
      </Layout>
    </ProtectedRoute>
  );
}
