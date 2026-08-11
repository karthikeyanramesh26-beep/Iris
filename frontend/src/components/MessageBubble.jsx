
import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from 'framer-motion';
import { User, Volume2, Pause } from 'lucide-react';

const QuillLogo = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M75,20 C60,25 45,35 35,50 C30,58 28,68 25,75 L22,78 L25,75 C32,72 42,70 50,65 C65,55 75,40 80,25 Z" fill="currentColor" fillOpacity="0.05" />
    <line x1="22" y1="78" x2="38" y2="62" />
    <path d="M45,45 L38,40" />
    <path d="M52,38 L45,33" />
    <path d="M60,31 L53,26" />
    <path d="M68,25 L61,20" />
    <path d="M20,82 Q 18,85 22,85" />
  </svg>
);

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      // Pause all other audio elements on the page first
      document.querySelectorAll('audio').forEach(el => {
        el.pause();
        el.currentTime = 0;
      });
      audioRef.current.play().catch(e => console.log('Audio playback blocked:', e));
      setIsPlaying(true);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`flex gap-4 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-md transition-all duration-300"
          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)' }}
        >
          <QuillLogo className="w-5 h-5 text-[var(--color-accent)]" />
        </div>
      )}
      
      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div 
          className="font-semibold text-xs mb-1 px-1 transition-colors duration-300"
          style={{ color: 'var(--text-secondary)' }}
        >
          {isUser ? 'You' : 'Iris'}
        </div>
        
        <div 
          className={`text-sm px-5 py-3.5 shadow-md inline-block border transition-all duration-300 rounded-lg ${
            isUser 
              ? 'bg-[#faf7ed] border-amber-200/70 border-l-4 border-l-orange-400 text-slate-800' 
              : 'bg-[#fcfaf2] border-amber-200/70 border-l-4 border-l-red-400 text-slate-800'
          }`}
        >
          <div className="prose prose-invert max-w-none markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter
                      {...props}
                      children={String(children).replace(/\n$/, '')}
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{ background: 'transparent', margin: 0, padding: '1rem' }}
                    />
                  ) : (
                    <code {...props} className={className}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>
        </div>

        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.citations.map((cite, idx) => (
              <span 
                key={idx} 
                className="text-xs px-2 py-1 border rounded-md transition-all duration-300"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                📄 {cite.fileName}
              </span>
            ))}
          </div>
        )}

        {!isUser && message.audioUrl && (
          <div 
            className="mt-3 flex items-center gap-3 py-1.5 px-3 rounded-xl border shadow-sm transition-all duration-300"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)' }}
          >
            <button 
              onClick={handleTogglePlay}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                isPlaying ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20 dark:bg-zinc-200/10 dark:text-zinc-300'
              }`}
              title={isPlaying ? "Stop Reciting" : "Recite Response"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            
            {isPlaying && (
              <div className="flex items-end gap-0.5 h-3.5 px-1">
                <span className="w-0.75 h-3 rounded-full animate-wave-bar" style={{ backgroundColor: 'var(--text-primary)', animationDelay: '0.1s' }}></span>
                <span className="w-0.75 h-4 rounded-full animate-wave-bar" style={{ backgroundColor: 'var(--text-primary)', animationDelay: '0.3s' }}></span>
                <span className="w-0.75 h-2 rounded-full animate-wave-bar" style={{ backgroundColor: 'var(--text-primary)', animationDelay: '0.5s' }}></span>
                <span className="w-0.75 h-4 rounded-full animate-wave-bar" style={{ backgroundColor: 'var(--text-primary)', animationDelay: '0.2s' }}></span>
                <span className="w-0.75 h-3 rounded-full animate-wave-bar" style={{ backgroundColor: 'var(--text-primary)', animationDelay: '0.4s' }}></span>
              </div>
            )}
            
            <span className="text-xs font-medium select-none" style={{ color: 'var(--text-secondary)' }}>
              {isPlaying ? 'Speaking...' : 'Listen'}
            </span>
            
            <audio 
              ref={audioRef} 
              src={message.audioUrl} 
              className="hidden" 
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
