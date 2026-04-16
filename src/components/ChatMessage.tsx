import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { User, Bot, Edit2, FileText, Download, Presentation, Table, Sparkles, Share2, MessageCircle } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'model';
  content: string;
  image?: string;
  action?: 'summarize' | 'edit';
  onEditImage?: (url: string) => void;
  onAIEditImage?: (url: string) => void;
  onDownloadPDF?: (content: string) => void;
  onDownloadPPT?: (content: string) => void;
  onDownloadExcel?: (content: string) => void;
  onDownloadImage?: (url: string) => void;
  onShareWhatsApp?: (content: string) => void;
  onShareMore?: (content: string) => void;
}

export default function ChatMessage({ 
  role, 
  content, 
  image, 
  action,
  onEditImage, 
  onAIEditImage,
  onDownloadPDF, 
  onDownloadPPT,
  onDownloadExcel,
  onDownloadImage,
  onShareWhatsApp,
  onShareMore
}: ChatMessageProps) {
  const isUser = role === 'user';
  const showExportButtons = !isUser && action === 'summarize';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "flex w-full gap-4 p-6 transition-colors group",
        isUser ? "bg-transparent justify-end" : "bg-zinc-900/50 border-y border-zinc-800/50 justify-start"
      )}
    >
      <div className={cn(
        "max-w-4xl w-full flex gap-4 md:gap-6",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
          isUser ? "bg-zinc-800 text-zinc-400" : "bg-yellow-400 text-black"
        )}>
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>
        
        <div className={cn(
          "flex-1 space-y-4 overflow-hidden",
          isUser ? "text-right" : "text-left"
        )}>
          {image && (
            <div className={cn(
              "relative group/img max-w-md",
              isUser ? "ml-auto" : "mr-auto"
            )}>
              <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
                {image.startsWith('data:application/pdf') ? (
                  <div className="w-full aspect-video bg-red-500/5 flex flex-col items-center justify-center text-red-500 gap-2">
                    <FileText size={48} />
                    <span className="font-bold">PDF DOCUMENT</span>
                  </div>
                ) : (
                  <img src={image} alt="Content" className="w-full h-auto object-contain" />
                )}
              </div>
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/img:opacity-100 transition-all">
                {!image.startsWith('data:application/pdf') && (
                  <>
                    {onAIEditImage && (
                      <button
                        onClick={() => onAIEditImage(image)}
                        className="bg-black/60 backdrop-blur-md text-white px-3 py-2 rounded-xl hover:bg-purple-500 shadow-lg flex items-center gap-2 text-xs font-bold transition-all"
                      >
                        <Sparkles size={14} />
                        AI Edit
                      </button>
                    )}
                    {onEditImage && (
                      <button
                        onClick={() => onEditImage(image)}
                        className="bg-black/60 backdrop-blur-md text-white px-3 py-2 rounded-xl hover:bg-yellow-400 hover:text-black shadow-lg flex items-center gap-2 text-xs font-bold transition-all"
                      >
                        <Edit2 size={14} />
                        Manual
                      </button>
                    )}
                  </>
                )}
                {onDownloadImage && (
                  <button
                    onClick={() => onDownloadImage(image)}
                    className="bg-black/60 backdrop-blur-md text-white p-2 rounded-xl hover:bg-blue-500 shadow-lg transition-all"
                    title="Download File"
                  >
                    <Download size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
          
          <div className="relative group/text">
            <div className={cn(
              "prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800",
              isUser ? "text-zinc-200" : "text-zinc-300"
            )}>
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
            </div>

            {showExportButtons && (
              <div className={cn(
                "mt-6 flex flex-wrap gap-3",
                isUser ? "justify-end" : "justify-start"
              )}>
                {onDownloadPDF && (
                  <button
                    onClick={() => onDownloadPDF(content)}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-100 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white transition-all px-4 py-2 rounded-xl border border-red-500/30"
                  >
                    <FileText size={14} />
                    PDF
                  </button>
                )}
                {onDownloadPPT && (
                  <button
                    onClick={() => onDownloadPPT(content)}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-100 bg-orange-500/20 hover:bg-orange-500 text-orange-500 hover:text-white transition-all px-4 py-2 rounded-xl border border-orange-500/30"
                  >
                    <Presentation size={14} />
                    PowerPoint
                  </button>
                )}
                {onDownloadExcel && (
                  <button
                    onClick={() => onDownloadExcel(content)}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-100 bg-green-500/20 hover:bg-green-500 text-green-500 hover:text-white transition-all px-4 py-2 rounded-xl border border-green-500/30"
                  >
                    <Table size={14} />
                    Excel
                  </button>
                )}
                {onShareWhatsApp && (
                  <button
                    onClick={() => onShareWhatsApp(content)}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-100 bg-green-600/20 hover:bg-green-600 text-green-600 hover:text-white transition-all px-4 py-2 rounded-xl border border-green-600/30"
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </button>
                )}
                {onShareMore && (
                  <button
                    onClick={() => onShareMore(content)}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-100 bg-blue-500/20 hover:bg-blue-500 text-blue-500 hover:text-white transition-all px-4 py-2 rounded-xl border border-blue-500/30"
                  >
                    <Share2 size={14} />
                    Share
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
