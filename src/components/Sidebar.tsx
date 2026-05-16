import React from 'react';
import { Plus, History, MessageSquare, X, User, Settings, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  chatHistory: { id: string; title: string }[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  currentView: 'home' | 'history' | 'profile' | 'settings';
  onViewChange: (view: 'home' | 'history' | 'profile' | 'settings') => void;
  theme: 'dark' | 'light' | 'white' | 'dim';
  accentStyle?: 'static' | 'flow';
}

export default function Sidebar({ 
  isOpen, 
  onClose, 
  onNewChat, 
  chatHistory, 
  currentChatId, 
  onSelectChat, 
  currentView, 
  onViewChange, 
  theme,
  accentStyle = 'static'
}: SidebarProps) {
  const sidebarClasses: Record<string, string> = {
    dark: "bg-zinc-950 border-zinc-800 text-zinc-100",
    light: "bg-white border-zinc-200 text-zinc-900",
    white: "bg-white border-zinc-100 text-zinc-900",
    dim: "bg-zinc-900 border-zinc-800 text-zinc-100"
  };

  const itemHoverClasses: Record<string, string> = {
    dark: "hover:bg-zinc-800/50",
    light: "hover:bg-zinc-100",
    white: "hover:bg-zinc-50",
    dim: "hover:bg-zinc-800"
  };

  const menuItems = [
    { id: 'home', label: 'New Chat', icon: Plus, action: onNewChat },
    { id: 'history', label: 'Chat History', icon: History, action: () => onViewChange('history') },
    { id: 'profile', label: 'My Profile', icon: User, action: () => onViewChange('profile') },
    { id: 'settings', label: 'Settings', icon: Settings, action: () => onViewChange('settings') },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -320 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed top-0 left-0 bottom-0 w-80 z-50 flex flex-col border-r transition-colors duration-300",
          sidebarClasses[theme],
          !isOpen && "pointer-events-none"
        )}
      >
        <div className="p-4 flex items-center justify-between border-b border-zinc-500/10">
          <div className="flex items-center gap-2 font-bold text-yellow-400">
            <motion.div
              animate={{
                rotate: [0, 10, 0, -10, 0],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-black shadow-lg shadow-yellow-400/20"
            >
              🍌
            </motion.div>
            <span className="truncate">Orbit Student AI</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-500/10 rounded-full transition-colors text-zinc-500 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none" aria-label="Close sidebar">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav className="p-4 space-y-2" aria-label="Main Navigation">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.action();
                onClose();
              }}
              aria-current={currentView === item.id ? 'page' : undefined}
              className={cn(
                "w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all font-semibold active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
                accentStyle === 'flow' && "accent-flow",
                currentView === item.id && item.id !== 'home'
                  ? "bg-accent text-black shadow-lg shadow-accent/20"
                  : item.id === 'home' 
                    ? "bg-accent text-black shadow-lg shadow-accent/20"
                    : cn("text-zinc-500", itemHoverClasses[theme], "hover:text-accent")
              )}
            >
              <item.icon size={20} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1 mt-4" aria-label="Recent Conversations">
          <div className="px-3 py-2 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={12} aria-hidden="true" />
              Recent Conversations
            </div>
          </div>
          
          <div className="space-y-1">
            {chatHistory.length === 0 ? (
              <div className="px-3 py-8 text-center text-zinc-500 text-xs italic">
                No recent chats
              </div>
            ) : (
              chatHistory.slice(0, 8).map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat.id);
                    onClose();
                  }}
                  aria-current={currentChatId === chat.id && currentView === 'home' ? 'true' : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
                    currentChatId === chat.id && currentView === 'home'
                      ? "bg-zinc-500/10 text-yellow-400"
                      : cn("text-zinc-500", itemHoverClasses[theme], "hover:text-zinc-200")
                  )}
                >
                  <MessageSquare size={16} className={cn(currentChatId === chat.id && currentView === 'home' ? "text-yellow-400" : "text-zinc-600 group-hover:text-zinc-400")} aria-hidden="true" />
                  <span className="truncate text-xs font-bold">{chat.title}</span>
                </button>
              ))
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-zinc-500/10 text-[10px] text-zinc-500 text-center font-black tracking-widest">
          <motion.span
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            NANO BANANA PRO • V3.1
          </motion.span>
        </div>
      </motion.aside>
    </>
  );
}
