/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, FileText, Sparkles, MessageSquare, Menu, X, Search, Settings, Share2, MoreVertical, Image as ImageIcon, ArrowLeft, LogOut, User as UserIcon, History as HistoryIcon, LayoutGrid } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import ImageEditor from './components/ImageEditor';
import { jsPDF } from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import { ProfileView, SettingsView, HistoryView } from './components/NavigationViews';
import { cn } from './lib/utils';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  image?: string;
  action?: 'summarize' | 'edit';
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<any>({ uid: "guest_user", name: "Student", email: "student@orbit.edu", avatarUrl: null });
  const [token, setToken] = useState<string | null>("guest_token");
  const [authChecked, setAuthChecked] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'history' | 'profile' | 'settings'>('home');
  const [theme, setTheme] = useState<'dark' | 'light' | 'white' | 'dim'>('dark');
  const [accentColor, setAccentColor] = useState<string>('#eab308'); // Default yellow
  const [accentStyle, setAccentStyle] = useState<'static' | 'flow'>('static');
  const [fontStyle, setFontStyle] = useState<'sans' | 'editorial' | 'tech'>('sans');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [editingImage, setEditingImage] = useState<{ url: string; messageId: string } | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'summarize' | 'edit' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find(c => c.id === currentChatId);

  useEffect(() => {
    // Force guest user if no other session
    const savedToken = localStorage.getItem('orbit_token') || 'guest_token';
    const savedUser = localStorage.getItem('orbit_user');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    } else {
      localStorage.setItem('orbit_token', 'guest_token');
      localStorage.setItem('orbit_user', JSON.stringify({ uid: "guest_user", name: "Student", email: "student@orbit.edu", avatarUrl: null }));
    }
    setAuthChecked(true);

    // Apply basic body classes for theme
    document.body.className = theme;
  }, [theme]);

  useEffect(() => {
    if (!token) {
      setChats([]);
      setCurrentChatId(null);
      return;
    }

    const fetchChats = async () => {
      try {
        const response = await fetch('/api/chats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setChats(data.map((c: any) => ({ ...c, messages: [] })));
        }
      } catch (error) {
        console.error("Fetch chats error:", error);
      }
    };

    fetchChats();
  }, [token]);

  useEffect(() => {
    if (!token || !currentChatId) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chats/${currentChatId}/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setChats(prev => prev.map(c => 
            c.id === currentChatId ? { ...c, messages: data } : c
          ));
        }
      } catch (error) {
        console.error("Fetch messages error:", error);
      }
    };

    fetchMessages();
  }, [token, currentChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewChat = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: 'New Conversation' })
      });
      if (response.ok) {
        const newChat = await response.json();
        setChats(prev => [ { ...newChat, messages: [] }, ...prev]);
        setCurrentChatId(newChat.id);
      }
    } catch (error) {
      console.error("Create chat error:", error);
    }
  };

  const handleSend = async (text: string, image?: string, action?: 'summarize' | 'edit', language?: string) => {
    if (!token) return;
    
    let chatId = currentChatId;
    
    if (!chatId) {
      try {
        const response = await fetch('/api/chats', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            title: action === 'summarize' ? `Image Summary (${language || 'English'})` : (text.slice(0, 30) || 'New Conversation') 
          })
        });
        if (response.ok) {
          const newChat = await response.json();
          chatId = newChat.id;
          setChats(prev => [ { ...newChat, messages: [] }, ...prev]);
          setCurrentChatId(chatId);
        }
      } catch (error) {
        console.error("Create chat error:", error);
        return;
      }
    }

    const userMessageContent = action === 'summarize' ? `Summarize this image in ${language || 'English'}.` : text;

    try {
      await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: 'user',
          content: userMessageContent,
          image: image || null,
          action: action || null
        })
      });

      // Update chat title locally if it's the first message
      if (currentChat?.messages.length === 0) {
        const newTitle = action === 'summarize' ? `Image Summary (${language || 'English'})` : (text.slice(0, 30) || 'New Conversation');
        await fetch(`/api/chats/${chatId}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title: newTitle })
        });
      }

      // Update local state temporarily
      setChats(prev => prev.map(c => 
        c.id === chatId ? { ...c, messages: [...c.messages, { id: 'temp-' + Date.now(), role: 'user', content: userMessageContent, image, action }] } : c
      ));

    } catch (error) {
      console.error("Send message error:", error);
    }

    setIsLoading(true);
    setPendingAction(null);

    try {
      let responseText = '';
      let responseImage = undefined;

      const history = currentChat?.messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      })) || [];

      const aiResponse = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: action === 'edit' ? `Expert editor: ${text}. Style: Professional, high-quality, realistic, aesthetic. Maintain composition.` : text,
          history: action === 'summarize' ? [] : history,
          image,
          action,
          language
        })
      });

      if (!aiResponse.ok) {
        throw new Error('AI generation failed');
      }

      const aiData = await aiResponse.json();
      responseText = aiData.text;

      if (action === 'edit' && image) {
        // Since image editing was using a separate function generateImage (which I'm still figuring out the best server equivalent for), 
        // I will keep it simple for now or use the same model.
        // For now, I'll assume server returns text.
      }

      await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: 'model',
          content: responseText,
          image: responseImage || null,
          action: action || null
        })
      });

      // Refetch messages to get the real IDs
      const msgRes = await fetch(`/api/chats/${chatId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (msgRes.ok) {
        const data = await msgRes.json();
        setChats(prev => prev.map(c => 
          c.id === chatId ? { ...c, messages: data } : c
        ));
      }

    } catch (error: any) {
      console.error(error);
      setIsGeneratingImage(false);
      const errorMessage = {
        role: 'model',
        content: "Oops! Orbit College Student AI encountered a technical glitch. Please try again in a moment! 🍌"
      };
      
      await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(errorMessage)
      });

      const msgRes = await fetch(`/api/chats/${chatId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (msgRes.ok) {
        const data = await msgRes.json();
        setChats(prev => prev.map(c => 
          c.id === chatId ? { ...c, messages: data } : c
        ));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEditedImage = (editedUrl: string) => {
    if (editingImage) {
      if (editingImage.messageId === 'preview') {
        setPendingImage(editedUrl);
      } else {
        setChats(prev => prev.map(c => 
          c.id === currentChatId 
            ? { 
                ...c, 
                messages: c.messages.map(m => 
                  m.id === editingImage.messageId ? { ...m, image: editedUrl } : m
                ) 
              }
            : c
        ));
      }
      setEditingImage(null);
    }
  };

  const handleDownloadPDF = (content: string) => {
    try {
      const doc = new jsPDF();
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 30;

      // Title
      doc.setFontSize(22);
      doc.setTextColor(234, 179, 8); // Orbit Yellow
      doc.setFont("helvetica", "bold");
      doc.text("ORBIT PRO SUMMARY", margin, 20);
      
      doc.setDrawColor(234, 179, 8);
      doc.setLineWidth(0.5);
      doc.line(margin, 23, pageWidth - margin, 23);

      const lines = content.split('\n');
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      lines.forEach((line) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }

        const cleanLine = line.replace(/<u>|<\/u>/g, '').trim();
        
        if (line.startsWith('# ')) {
          doc.setFontSize(18);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(20, 20, 20);
          const text = cleanLine.replace('# ', '');
          doc.text(text, margin, y);
          y += 10;
        } else if (line.startsWith('## ')) {
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(50, 50, 50);
          const text = cleanLine.replace('## ', '');
          doc.text(text, margin, y);
          
          // Underline if <u> was present
          if (line.includes('<u>')) {
            const textWidth = doc.getTextWidth(text);
            doc.line(margin, y + 1, margin + textWidth, y + 1);
          }
          y += 8;
        } else if (line.startsWith('### ')) {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(70, 70, 70);
          const text = cleanLine.replace('### ', '');
          doc.text(text, margin, y);
          
          // Underline if <u> was present
          if (line.includes('<u>')) {
            const textWidth = doc.getTextWidth(text);
            doc.line(margin, y + 1, margin + textWidth, y + 1);
          }
          y += 7;
        } else if (line.includes('->')) {
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          
          const [term, ...meaningParts] = cleanLine.split('->');
          const meaning = meaningParts.join('->');
          
          if (term && meaning) {
            doc.setFont("helvetica", "bold");
            doc.text(term.trim(), margin, y);
            const termWidth = doc.getTextWidth(term.trim());
            
            doc.setFont("helvetica", "normal");
            doc.text(" -> " + meaning.trim(), margin + termWidth, y);
          } else {
            const splitText = doc.splitTextToSize(cleanLine, pageWidth - margin * 2);
            doc.text(splitText, margin, y);
          }
          y += 6;
        } else if (line.startsWith('...')) {
          doc.setDrawColor(200, 200, 200);
          doc.setLineDashPattern([1, 1], 0);
          doc.line(margin, y - 2, pageWidth - margin, y - 2);
          doc.setLineDashPattern([], 0);
          y += 4;
        } else if (cleanLine.length > 0) {
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(30, 30, 30);
          const splitText = doc.splitTextToSize(cleanLine, pageWidth - margin * 2);
          doc.text(splitText, margin, y);
          y += (splitText.length * 6);
        } else {
          y += 4;
        }
      });

      doc.save(`orbit-pro-summary-${Date.now()}.pdf`);
      triggerConfetti();
    } catch (error) {
      console.error("PDF Generation Error:", error);
    }
  };

  const handleDownloadPPT = (content: string) => {
    try {
      const pptx = new PptxGenJS();
      const slide = pptx.addSlide();
      
      // Extract title from content (first line usually)
      const lines = content.split('\n');
      const title = lines[0].replace(/#/g, '').trim() || "Orbit Summary";
      
      slide.addText(title, { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 24, bold: true, color: 'EAB308' });
      
      const bodyText = lines.slice(1).join('\n').slice(0, 1000); // Limit for slide
      slide.addText(bodyText, { x: 0.5, y: 1.5, w: '90%', h: 4, fontSize: 12, color: '333333' });
      
      pptx.writeFile({ fileName: `orbit-presentation-${Date.now()}.pptx` });
      triggerConfetti();
    } catch (error) {
      console.error("PPT Generation Error:", error);
    }
  };

  const handleDownloadExcel = (content: string) => {
    try {
      const lines = content.split('\n').filter(line => line.trim());
      const data = lines.map(line => [line.trim()]);
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Summary");
      
      XLSX.writeFile(wb, `orbit-data-${Date.now()}.xlsx`);
      triggerConfetti();
    } catch (error) {
      console.error("Excel Generation Error:", error);
    }
  };

  const handleDownloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `orbit-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Celebrate!
    triggerConfetti();
  };

  const handleShareWhatsApp = (content: string) => {
    const text = encodeURIComponent(`*Orbit Pro Summary*\n\n${content.replace(/<u>|<\/u>/g, '')}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareMore = async (content: string) => {
    const cleanContent = content.replace(/<u>|<\/u>/g, '');
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Orbit Pro Summary',
          text: cleanContent,
          url: window.location.href
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(cleanContent);
        alert('Summary copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleLogout = () => {
    const guestUser = { uid: "guest_user", name: "Student", email: "student@orbit.edu", avatarUrl: null };
    setUser(guestUser);
    setToken("guest_token");
    localStorage.setItem('orbit_user', JSON.stringify(guestUser));
    localStorage.setItem('orbit_token', 'guest_token');
    setCurrentView('home');
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const themeClasses: Record<string, string> = {
    dark: "bg-black text-zinc-100",
    light: "bg-zinc-50 text-zinc-900",
    white: "bg-white text-zinc-900",
    dim: "bg-zinc-900 text-zinc-100"
  };

  const navClasses: Record<string, string> = {
    dark: "bg-black/80 border-zinc-800",
    light: "bg-zinc-100/80 border-zinc-200",
    white: "bg-white/80 border-zinc-200",
    dim: "bg-zinc-800/80 border-zinc-700"
  };

  const sidebarClasses: Record<string, string> = {
    dark: "bg-zinc-950 border-zinc-800",
    light: "bg-white border-zinc-200",
    white: "bg-white border-zinc-100",
    dim: "bg-zinc-900 border-zinc-800"
  };

  if (!authChecked) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${themeClasses[theme]} font-sans selection:bg-yellow-400/30 overflow-hidden transition-colors duration-300`}>
      <AnimatePresence mode="wait">
        {showWelcome ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-400/10 rounded-full blur-[120px] animate-pulse" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-400/5 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-full max-w-2xl aspect-video rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.15)] relative mb-12"
            >
              <img 
                src="https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1000&auto=format&fit=crop" 
                alt="Orbit Student AI Book" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  animate={{ 
                    rotateY: [0, 180, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 6, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-20 h-20 bg-yellow-400 rounded-2xl flex items-center justify-center text-4xl shadow-2xl shadow-yellow-400/40"
                >
                  📖
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-6 max-w-3xl"
            >
              <motion.h1 
                className="text-5xl md:text-7xl font-black tracking-tighter bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent"
              >
                {["Orbit", "College", "Student", "AI,"].map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + (i * 0.1), duration: 0.5 }}
                    className="inline-block mr-3"
                  >
                    {word}
                  </motion.span>
                ))}
                <br />
                {["how", "can", "we", "assist", "you?"].map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 + (i * 0.1), duration: 0.5 }}
                    className="inline-block mr-3 text-yellow-400"
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="text-zinc-400 text-xl font-medium"
              >
                Powered by <span className="text-yellow-400 italic">self-made gold</span> 🍌
              </motion.p>
              
              <button
                onClick={() => {
                  setShowWelcome(false);
                }}
                className="mt-8 px-10 py-4 bg-accent text-black font-black rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_50px_rgba(234,179,8,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto btn-animated"
              >
                Enter Orbit <Sparkles size={20} />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="absolute bottom-8 left-0 right-0 text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black"
            >
              Version 3.1 Pro • Ultra Fast Mode
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex w-full h-full"
          >
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              onNewChat={() => {
                handleNewChat();
                setCurrentView('home');
              }}
              chatHistory={chats.map(c => ({ id: c.id, title: c.title }))}
              currentChatId={currentChatId}
              onSelectChat={(id) => {
                setCurrentChatId(id);
                setCurrentView('home');
              }}
              currentView={currentView}
              onViewChange={setCurrentView}
              theme={theme}
              accentStyle={accentStyle}
            />

            <main className="flex-1 flex flex-col relative overflow-hidden">
              {/* Top Navigation */}
              <header className={`h-16 border-b ${navClasses[theme]} flex items-center justify-between px-4 backdrop-blur-md z-30 transition-colors`}>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-yellow-400"
                  >
                    {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>
                  
                  <button 
                    onClick={() => setCurrentView('home')}
                    className="flex items-center gap-3 active:scale-95 transition-transform"
                  >
                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-black text-sm shadow-lg shadow-accent/20 overflow-hidden">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        "🍌"
                      )}
                    </div>
                  </button>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg tracking-tight leading-none text-white">
                          {currentChat?.title || "Orbit College Student AI"}
                        </span>
                        <div className="bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter">
                          Pro
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-zinc-400 font-bold truncate max-w-[150px]">
                          {user?.displayName || user?.email}
                        </span>
                      </div>
                    </div>
                  </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentView('settings')}
                    className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-yellow-400 transition-colors"
                    title="Settings"
                  >
                    <Settings size={18} />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </header>

              {/* Content Area */}
              <div className={cn(
                "flex-1 overflow-y-auto scrollbar-hide",
                fontStyle === 'editorial' && "font-serif tracking-tight",
                fontStyle === 'tech' && "font-mono"
              )}>
                <style dangerouslySetInnerHTML={{ __html: `
                  :root {
                    --accent-color: ${accentColor};
                  }
                  .bg-accent { background-color: var(--accent-color) !important; }
                  .text-accent { color: var(--accent-color) !important; }
                  .border-accent { border-color: var(--accent-color) !important; }
                  
                  @keyframes accentFlow {
                    0% { filter: hue-rotate(0deg) brightness(1); }
                    50% { filter: hue-rotate(30deg) brightness(1.2); }
                    100% { filter: hue-rotate(0deg) brightness(1); }
                  }
                  .accent-flow {
                    animation: accentFlow 4s infinite ease-in-out;
                  }
                  .btn-animated {
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                  }
                  .btn-animated::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    transform: translateX(-100%);
                    transition: transform 0.5s;
                  }
                  .btn-animated:hover::after {
                    transform: translateX(100%);
                  }
                `}} />
                {currentView === 'profile' ? (
                  <ProfileView 
                    user={user} 
                    onBack={() => setCurrentView('home')} 
                    theme={theme} 
                    onUpdateUser={setUser}
                  />
                ) : currentView === 'settings' ? (
                  <SettingsView 
                    theme={theme} 
                    onThemeChange={setTheme} 
                    accentColor={accentColor}
                    onAccentColorChange={setAccentColor}
                    accentStyle={accentStyle}
                    onAccentStyleChange={setAccentStyle}
                    fontStyle={fontStyle}
                    onFontStyleChange={setFontStyle}
                    onBack={() => setCurrentView('home')} 
                  />
                ) : currentView === 'history' ? (
                  <HistoryView chats={chats} onSelectChat={(id) => {
                    setCurrentChatId(id);
                    setCurrentView('home');
                  }} onBack={() => setCurrentView('home')} theme={theme} />
                ) : (!currentChat || currentChat.messages.length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-8 max-w-4xl mx-auto">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.8 }}
                      className="w-full max-w-lg aspect-video rounded-3xl overflow-hidden shadow-2xl relative group"
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" 
                        alt="Welcome" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-6">
                        <div className="bg-yellow-400/90 text-black px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
                          NanoBanana Pro Active
                        </div>
                      </div>
                    </motion.div>

                    <div className="space-y-4">
                      <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                        Orbit College Student AI, <br />
                        <span className="text-accent underline decoration-accent/30 decoration-2 underline-offset-4">
                          {user?.name ? `welcome back ${user.name}, ` : ''}how can we assist you?
                        </span>
                      </h1>
                      <p className="text-zinc-500 text-lg font-medium">
                        Powered by <span className="text-yellow-500 italic">self-made gold</span> 🍌
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full pt-4">
                      {[
                        { icon: Sparkles, title: "Orbit Tech Scene", desc: "A realistic iPhone on a desk showing a banana, surrounded by a glowing blue holographic PC network grid", color: "text-yellow-400" },
                        { icon: MessageSquare, title: "Brainstorm ideas", desc: "Give me 5 names for a new coffee shop", color: "text-blue-400" },
                        { icon: ImageIcon, title: "Edit a photo", desc: "Upload an image and ask me to change it", color: "text-green-400" },
                        { icon: Search, title: "Explain concepts", desc: "How does quantum computing work?", color: "text-purple-400" }
                      ].map((item, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(item.desc)}
                          className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-left hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <motion.div
                              animate={{
                                y: [0, -5, 0, 5, 0],
                                x: [0, 5, 0, -5, 0],
                                color: ["#eab308", "#3b82f6", "#22c55e", "#a855f7", "#eab308"]
                              }}
                              transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.5
                              }}
                              className={item.color}
                            >
                              <item.icon size={20} />
                            </motion.div>
                            <span className="font-semibold text-sm">{item.title}</span>
                          </div>
                          <p className="text-xs text-zinc-500 group-hover:text-zinc-400">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="pb-32">
                    {currentChat.messages.map((msg) => (
                      <ChatMessage 
                        key={msg.id} 
                        role={msg.role} 
                        content={msg.content} 
                        image={msg.image} 
                        action={msg.action}
                        onEditImage={(url) => setEditingImage({ url, messageId: msg.id })}
                        onAIEditImage={(url) => {
                          setPendingImage(url);
                          setPendingAction('edit');
                        }}
                        onDownloadPDF={handleDownloadPDF}
                        onDownloadPPT={handleDownloadPPT}
                        onDownloadExcel={handleDownloadExcel}
                        onDownloadImage={handleDownloadImage}
                        onShareWhatsApp={handleShareWhatsApp}
                        onShareMore={handleShareMore}
                      />
                    ))}
                    {isLoading && (
                      <div className="p-6 bg-zinc-900/50 border-y border-zinc-800/50">
                        <div className="max-w-4xl mx-auto w-full flex gap-6">
                          <div className="w-8 h-8 rounded-lg bg-yellow-400 text-black flex items-center justify-center animate-pulse shrink-0">
                            🍌
                          </div>
                          <div className="flex-1 space-y-4">
                            {isGeneratingImage ? (
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                                  <Sparkles size={14} />
                                  NanoBanana Pro is generating your masterpiece...
                                </div>
                                <div className="max-w-md w-full aspect-square bg-zinc-800 rounded-2xl animate-pulse flex items-center justify-center border border-zinc-700">
                                  <ImageIcon size={48} className="text-zinc-700 animate-bounce" />
                                </div>
                                <div className="h-4 bg-zinc-800 rounded w-3/4 animate-pulse" />
                              </div>
                            ) : (
                              <div className="flex gap-1 items-center h-8">
                                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Area */}
              {currentView === 'home' && (
                <div className={`absolute bottom-0 left-0 right-0 ${navClasses[theme]} bg-gradient-to-t via-current to-transparent pt-10 pb-4`}>
                  <ChatInput 
                    onSend={handleSend} 
                    onManualEdit={(url) => setEditingImage({ url, messageId: 'preview' })}
                    image={pendingImage}
                    onImageChange={setPendingImage}
                    initialAction={pendingAction}
                    disabled={isLoading} 
                    accentStyle={accentStyle}
                  />
                </div>
              )}
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
