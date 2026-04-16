import React from 'react';
import { Plus, History, MessageSquare, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  chatHistory: { id: string; title: string }[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
}

export default function Sidebar({ isOpen, onClose, onNewChat, chatHistory, currentChatId, onSelectChat }: SidebarProps) {
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
          "fixed top-0 left-0 bottom-0 w-80 bg-zinc-900 text-zinc-100 z-50 flex flex-col border-r border-zinc-800",
          !isOpen && "pointer-events-none"
        )}
      >
        <div className="p-4 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2 font-bold text-yellow-400">
            <motion.div
              animate={{
                y: [0, -3, 0, 3, 0],
                x: [0, 3, 0, -3, 0],
                rotate: [0, 10, 0, -10, 0],
                color: ["#eab308", "#3b82f6", "#22c55e", "#a855f7", "#eab308"]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-black"
            >
              🍌
            </motion.div>
            <span>Orbit Collage Student AI</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-yellow-400/10"
          >
            <Plus size={20} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <History size={14} />
            History
          </div>
          {chatHistory.length === 0 ? (
            <div className="px-3 py-8 text-center text-zinc-500 text-sm italic">
              No recent chats
            </div>
          ) : (
            chatHistory.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  onSelectChat(chat.id);
                  onClose();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group",
                  currentChatId === chat.id
                    ? "bg-zinc-800 text-yellow-400"
                    : "hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
                )}
              >
                <MessageSquare size={18} className={cn(currentChatId === chat.id ? "text-yellow-400" : "text-zinc-600 group-hover:text-zinc-400")} />
                <span className="truncate text-sm font-medium">{chat.title}</span>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 text-xs text-zinc-500 text-center">
          <motion.span
            animate={{
              color: ["#71717a", "#eab308", "#71717a"]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            Powered by kgomotso diphoko the 🍌
          </motion.span>
        </div>
      </motion.aside>
    </>
  );
}
