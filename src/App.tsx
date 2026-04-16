/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Search, Settings, Share2, MoreVertical, Sparkles, MessageSquare, Image as ImageIcon } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import ImageEditor from './components/ImageEditor';
import { chatWithGemini, generateImage } from './lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingImage, setEditingImage] = useState<{ url: string; messageId: string } | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'summarize' | 'edit' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find(c => c.id === currentChatId);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: []
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const handleSend = async (text: string, image?: string, action?: 'summarize' | 'edit') => {
    if (!currentChatId) {
      const newChat: Chat = {
        id: Date.now().toString(),
        title: action === 'summarize' ? 'Image Summary' : (text.slice(0, 30) || 'New Conversation'),
        messages: []
      };
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: action === 'summarize' ? "Please summarize this image for me." : text,
      image: image,
      action: action
    };

    setChats(prev => prev.map(c => 
      c.id === (currentChatId || prev[0].id) 
        ? { ...c, messages: [...c.messages, userMessage], title: c.messages.length === 0 ? (action === 'summarize' ? 'Image Summary' : text.slice(0, 30)) : c.title }
        : c
    ));

    setIsLoading(true);
    setPendingAction(null);

    try {
      let responseText = '';
      let responseImage = undefined;

      if (action === 'summarize' && image) {
        const isPdf = image.startsWith('data:application/pdf');
        const summaryPrompt = `
          You are a professional academic assistant and expert document analyst. 
          Please provide a high-level, "Pro" summary of this ${isPdf ? 'PDF document' : 'image'}.
          
          CRITICAL INSTRUCTIONS:
          1. OCR & EXTRACTION: If the document contains scanned text, images, or handwriting, perform a detailed OCR extraction to ensure no key information is missed.
          2. STRUCTURE: Present the information in a highly structured, logical flow.
          
          Follow these strict formatting rules:
          1. TOPIC HEADER: Start with the topic name as a main header (e.g., # TOPIC NAME).
          2. HEADINGS: Use <u> tags to underline the Main Heading and all Sub-headings (e.g., ## <u>Main Heading</u>).
          3. MEANINGS/DEFINITIONS: For any term or concept, write it as: "Term -> Meaning" on its own line.
          4. POINT FORM: Do not write long paragraphs. Summarize all information into clear, professional point forms using bullet points (*) or numbered lists (1.).
          5. KEY POINTS: Use arrows (->) for key takeaways.
          6. SEPARATORS: Use dotted lines (....................) to separate major sections.
          7. STYLE: Write like a professional expert. Be concise but thorough.
          
          Example:
          # ARTIFICIAL INTELLIGENCE
          ....................
          ## <u>Introduction</u>
          * AI -> The simulation of human intelligence by machines.
          * Machine Learning -> A subset of AI focused on data patterns.
          
          ## <u>Key Concepts</u>
          1. Neural Networks -> Modeled after the human brain.
          -> AI is transforming modern technology.
          ....................
        `;
        responseText = await chatWithGemini(summaryPrompt, [], image) || `I couldn't summarize that ${isPdf ? 'PDF' : 'image'}.`;
      } else if (action === 'edit' && image) {
        const editPrompt = `Expert editor: ${text}. Style: Professional, high-quality, realistic, aesthetic. Maintain composition.`;
        const generatedImageUrl = await generateImage(editPrompt, image);
        if (generatedImageUrl) {
          responseImage = generatedImageUrl;
          responseText = "I've professionally edited the image using Nano Banana! How does it look? 🍌✨";
        } else {
          responseText = "I tried to edit the image using Nano Banana, but I couldn't generate a new version. Please try a different prompt!";
        }
      } else {
        const prompt = text.toLowerCase();
        const isImageRequest = prompt.includes('generate') || 
                              prompt.includes('create') || 
                              prompt.includes('draw') || 
                              prompt.includes('visualize') ||
                              prompt.includes('show me') ||
                              prompt.includes('render') ||
                              prompt.includes('make an image') ||
                              prompt.includes('picture of') ||
                              prompt.includes('add a') ||
                              prompt.includes('change the') ||
                              prompt.includes('edit');

        if (isImageRequest) {
          const enhancedPrompt = `High-quality, professional, aesthetic: ${text}. Modern, vibrant, detailed, cinematic lighting.`;
          const generatedImageUrl = await generateImage(enhancedPrompt, image);
          if (generatedImageUrl) {
            responseImage = generatedImageUrl;
            responseText = "Here is the professional, high-quality image I created for you using NanoBanana Pro! 🍌✨";
          } else {
            // If image generation failed, try normal chat as fallback
            const history = currentChat?.messages.map(m => ({
              role: m.role,
              parts: [{ text: m.content }]
            })) || [];
            responseText = await chatWithGemini(text, history, image) || "Sorry, I couldn't process that.";
          }
        } else {
          const history = currentChat?.messages.map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
          })) || [];
          responseText = await chatWithGemini(text, history, image) || "Sorry, I couldn't process that.";
        }
      }

      // Handle raw JSON responses or tool calls from the model
      if (responseText.trim().startsWith('{')) {
        try {
          // Try to extract prompt using regex if JSON is malformed (common with nested quotes)
          const promptMatch = responseText.match(/"prompt":\s*"([^"]+)"/);
          const innerPrompt = promptMatch ? promptMatch[1] : null;
          
          if (innerPrompt) {
            const retryImageUrl = await generateImage(innerPrompt, image);
            if (retryImageUrl) {
              responseImage = retryImageUrl;
              responseText = "I've generated the professional image you requested using NanoBanana Pro! 🍌✨";
            }
          } else {
            // Try standard JSON parse if regex fails
            const json = JSON.parse(responseText);
            if (json.action === 'dalle.text2im' || json.action_input) {
              const toolPrompt = typeof json.action_input === 'string' 
                ? (json.action_input.includes('prompt') ? JSON.parse(json.action_input).prompt : json.action_input)
                : json.action_input?.prompt;
              
              if (toolPrompt) {
                const retryImageUrl = await generateImage(toolPrompt, image);
                if (retryImageUrl) {
                  responseImage = retryImageUrl;
                  responseText = json.thought || "I've generated the image you requested! 🍌✨";
                }
              }
            }
          }
        } catch (e) {
          // Not valid JSON or not a tool call, keep original text
        }
      }

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        image: responseImage,
        action: action
      };

      setChats(prev => prev.map(c => 
        c.id === (currentChatId || prev[0].id) 
          ? { ...c, messages: [...c.messages, modelMessage] }
          : c
      ));
    } catch (error: any) {
      console.error(error);
      let content = "Oops! Orbit Collage Student AI encountered a technical glitch. This can happen with complex image edits. Please try a simpler prompt or try again in a moment! 🍌";
      
      if (error?.message?.includes('API_KEY_MISSING')) {
        content = "⚠️ **API Key Missing**: It looks like the Gemini API Key is not set up on your Vercel deployment. Please add `GEMINI_API_KEY` to your Vercel Environment Variables and redeploy your app.";
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: content
      };
      setChats(prev => prev.map(c => 
        c.id === (currentChatId || prev[0].id) 
          ? { ...c, messages: [...c.messages, errorMessage] }
          : c
      ));
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

  return (
    <div className="flex h-screen bg-black text-zinc-100 font-sans selection:bg-yellow-400/30">
      <AnimatePresence>
        {editingImage && (
          <ImageEditor
            image={editingImage.url}
            onSave={handleSaveEditedImage}
            onCancel={() => setEditingImage(null)}
          />
        )}
      </AnimatePresence>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        chatHistory={chats.map(c => ({ id: c.id, title: c.title }))}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Navigation */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 bg-black/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-yellow-400"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-black text-sm shadow-lg shadow-yellow-400/20">
                🍌
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight leading-none text-white">
                    {currentChat?.title || "Orbit Collage Student AI"}
                  </span>
                  <div className="bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter">
                    Pro
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  <span className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.2em]">Ultra Fast Mode Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Right side actions if any */}
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {(!currentChat || currentChat.messages.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="w-24 h-24 bg-yellow-400 rounded-3xl flex items-center justify-center text-5xl shadow-2xl shadow-yellow-400/20"
              >
                🍌
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">How can I help you today?</h2>
                <p className="text-zinc-500 max-w-md mx-auto">
                  I'm Orbit Collage Student AI, your creative AI assistant. I can chat, generate images, and help you edit them.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
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
                    <div className="w-8 h-8 rounded-lg bg-yellow-400 text-black flex items-center justify-center animate-pulse">
                      🍌
                    </div>
                    <div className="flex gap-1 items-center">
                      <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent pt-10 pb-4">
          <ChatInput 
            onSend={handleSend} 
            onManualEdit={(url) => setEditingImage({ url, messageId: 'preview' })}
            image={pendingImage}
            onImageChange={setPendingImage}
            initialAction={pendingAction}
            disabled={isLoading} 
          />
        </div>
      </main>
    </div>
  );
}
