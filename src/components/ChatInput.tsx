import React, { useRef, useState, useEffect } from 'react';
import { Send, Image as ImageIcon, QrCode, X, Loader2, Mic, MicOff, Edit2, FileText, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ChatInputProps {
  onSend: (message: string, image?: string, action?: 'summarize' | 'edit', language?: string) => void;
  onManualEdit: (image: string) => void;
  image: string | null;
  onImageChange: (image: string | null) => void;
  initialAction?: 'summarize' | 'edit' | null;
  disabled?: boolean;
  accentStyle?: 'static' | 'flow';
}

export default function ChatInput({ 
  onSend, 
  onManualEdit, 
  image, 
  onImageChange, 
  initialAction, 
  disabled,
  accentStyle = 'static'
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'summarize' | 'edit' | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Zulu' | 'Setswana' | 'French' | 'Spanish' | 'German' | 'Afrikaans' | 'Xhosa' | 'Sotho'>('English');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const languages = [
    { id: 'English', label: 'English' },
    { id: 'Zulu', label: 'Zulu' },
    { id: 'Setswana', label: 'Setswana' },
    { id: 'French', label: 'French' },
    { id: 'Spanish', label: 'Spanish' },
    { id: 'German', label: 'German' },
    { id: 'Afrikaans', label: 'Afrikaans' },
    { id: 'Xhosa', label: 'Xhosa' },
    { id: 'Sotho', label: 'Sotho' },
  ];

  useEffect(() => {
    if (initialAction) {
      setSelectedAction(initialAction);
    }
  }, [initialAction]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setMessage(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition', err);
      }
    }
  };

  const handleSend = () => {
    if ((message.trim() || image) && !disabled) {
      onSend(message, image || undefined, selectedAction || undefined, selectedAction === 'summarize' ? selectedLanguage : undefined);
      setMessage('');
      onImageChange(null);
      setSelectedAction(null);
      if (isListening) {
        recognitionRef.current?.stop();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (file.type === 'application/pdf') {
          onImageChange(result); // Reusing the image state for PDF data
          setSelectedAction('summarize');
        } else {
          onImageChange(result);
          setSelectedAction(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const isPdf = image?.startsWith('data:application/pdf');

  return (
    <div className="max-w-5xl mx-auto w-full p-4 relative">
      <div className={cn(
        "relative flex flex-col bg-zinc-900/50 dark:bg-zinc-950/40 backdrop-blur-3xl rounded-[2rem] transition-all group border border-zinc-500/20 shadow-2xl rainbow-glow",
        "focus-within:border-transparent"
      )}>
        {image && (
          <div className="p-4 flex flex-col gap-4 border-b border-white/5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="relative group/img shrink-0">
                {isPdf ? (
                  <div className="w-24 h-24 bg-red-500/10 rounded-2xl border border-red-500/20 flex flex-col items-center justify-center text-red-500 gap-1">
                    <FileText size={32} />
                    <span className="text-[10px] font-bold">PDF FILE</span>
                  </div>
                ) : (
                  <img src={image} alt="Preview" className="w-24 h-24 object-cover rounded-2xl border border-white/10 shadow-lg" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2">
                  {!isPdf && (
                    <button
                      onClick={() => onManualEdit(image)}
                      className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
                      title="Manual Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => onImageChange(null)}
                    className="p-2 bg-red-500/40 hover:bg-red-500/60 rounded-full text-white transition-colors"
                    title="Remove"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Select Action</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedAction('summarize')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                      selectedAction === 'summarize' 
                        ? "bg-yellow-400 text-black" 
                        : "bg-white/5 text-zinc-400 hover:bg-white/10"
                    )}
                  >
                    <FileText size={14} />
                    Summarize {isPdf ? 'PDF' : 'Image'}
                  </button>
                  {!isPdf && (
                    <button
                      onClick={() => setSelectedAction('edit')}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                        selectedAction === 'edit' 
                          ? "bg-yellow-400 text-black" 
                          : "bg-white/5 text-zinc-400 hover:bg-white/10"
                      )}
                    >
                      <Sparkles size={14} />
                      AI Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <AnimatePresence>
              {selectedAction === 'edit' && !isPdf && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="text-[10px] text-yellow-400/80 font-medium flex items-center gap-2">
                    <Sparkles size={10} />
                    Provide a prompt below to tell Orbit how to edit the image
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMessage("Magic Enhance: Improve the lighting, colors, and overall quality of this image to make it look professional and stunning.")}
                      className="text-[9px] bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded-md border border-yellow-400/20 transition-all"
                    >
                      ✨ Magic Enhance
                    </button>
                    <button
                      onClick={() => setMessage("Make it cinematic: Add dramatic lighting and a professional movie-like feel.")}
                      className="text-[9px] bg-purple-400/10 hover:bg-purple-400/20 text-purple-400 px-2 py-1 rounded-md border border-purple-400/20 transition-all"
                    >
                      🎬 Cinematic
                    </button>
                  </div>
                </motion.div>
              )}
              {selectedAction === 'summarize' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="text-[10px] text-yellow-400/80 font-medium flex items-center gap-2">
                    <FileText size={10} />
                    Orbit will summarize this {isPdf ? 'PDF' : 'image'} in your preferred language
                  </div>
                  <div className="flex flex-col space-y-2">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest pl-1">Target Language</p>
                    <div className="flex flex-wrap gap-1.5 pl-0.5">
                      {languages.map((lang) => (
                        <button
                          key={lang.id}
                          onClick={() => setSelectedLanguage(lang.id as any)}
                          className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-bold transition-all border",
                            selectedLanguage === lang.id
                              ? "bg-yellow-400 text-black border-yellow-400"
                              : "bg-white/5 text-zinc-500 border-zinc-500/20 hover:border-zinc-500/40"
                          )}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        <div className="flex items-end p-2 gap-2">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-zinc-400 hover:text-yellow-400 hover:bg-white/5 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              title="Upload Image or PDF"
              aria-label="Upload Image or PDF"
            >
              <ImageIcon size={22} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="p-2 text-zinc-400 hover:text-yellow-400 hover:bg-white/5 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              title="Scan QR Code"
              aria-label="Scan QR Code"
            >
              <QrCode size={22} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={toggleListening}
              className={cn(
                "p-2 rounded-xl transition-all relative focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
                isListening ? "text-red-500 bg-red-500/10" : "text-zinc-400 hover:text-yellow-400 hover:bg-white/5"
              )}
              title={isListening ? "Stop Listening" : "Voice to Text"}
              aria-label={isListening ? "Stop voice recognition" : "Start voice recognition"}
              aria-pressed={isListening}
            >
              {isListening ? <MicOff size={22} aria-hidden="true" /> : <Mic size={22} aria-hidden="true" />}
              {isListening && (
                <motion.div
                  layoutId="mic-pulse"
                  className="absolute inset-0 rounded-xl bg-red-500/20 animate-ping"
                />
              )}
            </button>
          </div>

          <label htmlFor="chat-message-input" className="sr-only">Type your message</label>
          <textarea
            id="chat-message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Orbit Collage Student AI anything..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-100 placeholder-zinc-500 py-3 px-2 resize-none max-h-40 min-h-[44px] focus-visible:bg-white/5 transition-colors rounded-lg"
            rows={1}
          />

          <motion.button
            whileHover={message.trim() || image ? { scale: 1.05 } : {}}
            whileTap={message.trim() || image ? { scale: 0.95 } : {}}
            onClick={handleSend}
            disabled={(!message.trim() && !image) || disabled}
            aria-label="Send message"
            className={cn(
              "p-3 rounded-xl transition-all flex items-center justify-center relative overflow-hidden btn-animated focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900",
              message.trim() || image
                ? "bg-accent text-black shadow-lg shadow-accent/20"
                : "bg-white/5 text-zinc-600 cursor-not-allowed",
              accentStyle === 'flow' && "accent-flow"
            )}
          >
            {disabled ? (
              <Loader2 size={20} className="animate-spin" aria-hidden="true" />
            ) : (
              <motion.div
                initial={false}
                animate={message.trim() || image ? { x: [0, 2, 0] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                aria-hidden="true"
              >
                <Send size={20} />
              </motion.div>
            )}
          </motion.button>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
