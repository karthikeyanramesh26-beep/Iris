import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Square, Paperclip, Loader2, X, RefreshCw, Check, AlertCircle, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export default function ChatInput({ onSendText, onUploadFile, isProcessing, languageCode, setLanguageCode, theme }) {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Voice Modal States
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceModalState, setVoiceModalState] = useState('idle'); // 'idle' | 'recording' | 'transcribing' | 'review' | 'error'
  const [transcribedText, setTranscribedText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [voiceError, setVoiceError] = useState('');

  // Custom Language Dropdown States & Ref
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const LANGUAGES = [
    { code: 'te', name: 'Telugu (తెలుగు)' },
    { code: 'en', name: 'English' },
    { code: 'ml', name: 'Malayalam (മലയാളം)' },
    { code: 'hi', name: 'Hindi (हिन्दी)' },
    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
    { code: 'ta', name: 'Tamil (தமிழ்)' },
    { code: 'bn', name: 'Bengali (বাংলা)' },
    { code: 'mr', name: 'Marathi (मराठी)' }
  ];

  const getLanguageName = (code) => {
    const found = LANGUAGES.find(l => l.code === code);
    return found ? found.name : 'English';
  };

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);

  const handleSend = () => {
    if (inputText.trim() && !isProcessing) {
      onSendText(inputText.trim());
      setInputText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Start Recording inside the Voice Modal
  const startRecording = async () => {
    setVoiceError('');
    setTranscribedText('');
    setTranslatedText('');
    setVoiceModalState('recording');
    setShowVoiceModal(true);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;

        const LANG_TAGS = {
          en: 'en-US',
          hi: 'hi-IN',
          ta: 'ta-IN',
          te: 'te-IN',
          kn: 'kn-IN',
          or: 'or-IN',
          mr: 'mr-IN',
          ml: 'ml-IN',
          bn: 'bn-IN'
        };
        recognition.lang = LANG_TAGS[languageCode] || 'en-US';

        recognition.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          const textResult = finalTranscript || interimTranscript;
          setTranscribedText(textResult);
        };

        recognition.onerror = (e) => {
          console.error("Speech recognition error:", e);
          if (e.error === 'not-allowed') {
            setVoiceError("Microphone access denied. Please verify browser permissions.");
            setVoiceModalState('error');
          }
        };

        recognition.onend = () => {
          // Handled manually or via standard stops
        };

        recognition.start();
      } catch (err) {
        console.error("Web Speech initialization error:", err);
        setVoiceError("Failed to initialize speech recognition.");
        setVoiceModalState('error');
      }
    } else {
      // Whisper Audio Fallback
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());

          setVoiceModalState('transcribing');
          
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          try {
            const res = await axios.post('/api/transcribe', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (res.data.transcription) {
              setTranscribedText(res.data.transcription);
              setDetectedLanguage(res.data.languageCode || '');
              setTranslatedText(res.data.translation || '');
              setVoiceModalState('review');
            } else {
              throw new Error("No transcription returned");
            }
          } catch (err) {
            console.error("Transcription failed:", err);
            setVoiceError("I couldn't transcribe your voice. Please record again.");
            setVoiceModalState('error');
          }
        };

        mediaRecorder.start();
      } catch (err) {
        console.error('Error accessing microphone', err);
        setVoiceError("Microphone access denied. Please check your browser permissions.");
        setVoiceModalState('error');
      }
    }
  };

  // Stop recording inside the modal
  const stopRecording = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (err) {
        console.error("Error stopping SpeechRecognition:", err);
      }
      
      setVoiceModalState('transcribing');
      setDetectedLanguage(languageCode);

      if (languageCode !== 'en' && transcribedText.trim()) {
        try {
          const res = await axios.post('/api/translate', {
            text: transcribedText,
            languageCode: languageCode
          });
          setTranslatedText(res.data.translation || '');
        } catch (err) {
          console.error("Translation API error:", err);
        }
      }
      setVoiceModalState('review');
    } else {
      if (mediaRecorderRef.current && voiceModalState === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const handleCancelVoiceModal = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping recognition on cancel:", err);
      }
      recognitionRef.current = null;
    }
    setShowVoiceModal(false);
    setVoiceModalState('idle');
    setTranscribedText('');
    setDetectedLanguage('');
    setTranslatedText('');
    setVoiceError('');
  };

  const handleConfirmSend = () => {
    if (transcribedText.trim()) {
      onSendText(transcribedText.trim(), detectedLanguage);
      handleCancelVoiceModal();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUploadFile(selectedFile);
      setSelectedFile(null);
    }
  };

  return (
    <div className="relative max-w-3xl mx-auto w-full">
      
      {/* File Upload Attachment Preview */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-14 left-0 right-0 flex items-center justify-between glass-panel px-4 py-2.5 rounded-xl border border-white/10 shadow-2xl"
          >
            <div className="flex items-center gap-2 text-sm">
              <Paperclip className="w-4 h-4 text-zinc-400" />
              <span className="truncate max-w-[200px] text-zinc-800 dark:text-zinc-200 font-medium">{selectedFile.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleUpload}
                disabled={isProcessing}
                className="text-xs bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold text-white dark:text-zinc-950 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
              >
                Upload
              </button>
              <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Textarea Bar (Wood/desk tray theme) */}
      <div className="rounded-xl flex flex-col p-2.5 shadow-xl border-t-4 border-amber-900/90" style={{ backgroundColor: '#fcfaf2', borderLeft: '2px solid #78350f', borderRight: '2px solid #78350f', borderBottom: '3px solid #78350f' }}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Iris a question..."
          disabled={isProcessing}
          className="w-full bg-transparent outline-none resize-none px-3 py-2 min-h-[52px] max-h-32 text-sm leading-relaxed text-[#451a03] placeholder-amber-900/40"
          rows={1}
        />
        
        <div className="flex items-center justify-end px-2 pt-2 border-t border-amber-800/10">
          <div className="flex items-center gap-2">
            {/* Custom Language Selector Dropdown Popover */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                disabled={isProcessing}
                className="p-2 rounded-xl border border-amber-800/20 hover:bg-amber-100 flex items-center justify-center text-amber-800"
                title={`Select Language (Current: ${getLanguageName(languageCode)})`}
              >
                <Globe className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {isLangDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: -10, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute bottom-12 right-0 w-56 rounded-xl border shadow-2xl z-50 flex flex-col gap-0.5 p-1.5"
                    style={{
                      backgroundColor: '#fcfaf2',
                      borderColor: '#d5c7b3',
                      color: '#451a03'
                    }}
                  >
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setLanguageCode(lang.code);
                          setIsLangDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all cursor-pointer font-medium border border-transparent"
                        style={{
                          backgroundColor: languageCode === lang.code ? '#e9dec4' : 'transparent',
                          color: languageCode === lang.code ? '#451a03' : '#78350f'
                        }}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mic Trigger */}
            <button
              type="button"
              onClick={startRecording}
              disabled={isProcessing}
              className="p-2 rounded-xl border border-amber-800/20 hover:bg-amber-100 flex items-center justify-center text-amber-800"
              title="Voice Speech Input"
            >
              <Mic className="w-5 h-5" />
            </button>
            
            {/* Send Trigger */}
            <button
              onClick={handleSend}
              disabled={(!inputText.trim()) || isProcessing}
              className="p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer"
              style={{
                borderColor: (inputText.trim() && !isProcessing) ? '#b45309' : '#d5c7b3',
                backgroundColor: (inputText.trim() && !isProcessing) ? '#b45309' : '#e9dec4',
                color: '#ffffff',
                opacity: (inputText.trim() && !isProcessing) ? 1 : 0.6,
                cursor: (inputText.trim() && !isProcessing) ? 'pointer' : 'not-allowed'
              }}
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Voice Input Modal Overlay (Speech-to-Text with edit/confirmation workflow) */}
      <AnimatePresence>
        {showVoiceModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
            <motion.div 
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="w-full max-w-md rounded-3xl shadow-2xl p-6 relative overflow-hidden backdrop-blur-2xl border border-amber-200"
              style={{
                backgroundColor: 'rgba(252, 250, 242, 0.97)',
                color: '#451a03'
              }}
            >
              {/* Glowing Background Radial */}
              <div className="absolute top-[-30px] right-[-30px] w-[160px] h-[160px] bg-amber-500/15 blur-[45px] rounded-full pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: '#b45309' }}>
                  Voice Assistant
                </h3>
                <button 
                  onClick={handleCancelVoiceModal} 
                  className="p-1.5 rounded-full transition hover:bg-amber-100/60 cursor-pointer"
                  style={{ color: '#b45309' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Unified Voice Status Visualizer */}
              <div className="flex flex-col items-center justify-center py-4 text-center border-b mb-4" style={{ borderColor: 'rgba(180, 83, 9, 0.15)' }}>
                <div className="relative flex items-center justify-center mb-4">
                  {/* Glowing animations depending on states */}
                  {voiceModalState === 'recording' && (
                    <>
                      <span className="absolute inline-flex h-20 w-20 rounded-full bg-orange-400/35 animate-ping"></span>
                      <span className="absolute inline-flex h-24 w-24 rounded-full bg-orange-400/15 animate-pulse"></span>
                    </>
                  )}
                  {voiceModalState === 'transcribing' && (
                    <>
                      <span className="absolute inline-flex h-20 w-20 rounded-full bg-amber-400/25 animate-ping"></span>
                      <span className="absolute inline-flex h-24 w-24 rounded-full bg-amber-400/15 animate-pulse"></span>
                    </>
                  )}
                  {voiceModalState === 'review' && (
                    <span className="absolute inline-flex h-20 w-20 rounded-full bg-amber-400/10 animate-pulse"></span>
                  )}
                  
                  <div className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all text-white ${
                    voiceModalState === 'recording' ? 'bg-gradient-to-br from-orange-400 to-amber-600 shadow-orange-400/30' :
                    voiceModalState === 'transcribing' ? 'bg-gradient-to-br from-amber-600 to-orange-700 shadow-amber-500/20' :
                    'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/10'
                  }`}>
                    {voiceModalState === 'transcribing' ? (
                      <Loader2 className="w-7 h-7 animate-spin" />
                    ) : (
                      <Mic className="w-7 h-7" />
                    )}
                  </div>
                </div>

                <p className="font-semibold text-sm animate-pulse" style={{ color: 'var(--text-primary)' }}>
                  {voiceModalState === 'recording' && 'Listening... Speak now.'}
                  {voiceModalState === 'transcribing' && 'Converting speech to text...'}
                  {voiceModalState === 'review' && 'Transcription Complete'}
                  {voiceModalState === 'error' && 'Error Occurred'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {voiceModalState === 'recording' && `Recording in ${getLanguageName(languageCode)}`}
                  {voiceModalState === 'transcribing' && 'Decoding audio via faster-whisper'}
                  {voiceModalState === 'review' && 'Verify and edit the message below'}
                  {voiceModalState === 'error' && 'Recording failed'}
                </p>
              </div>

              {/* Unified Content Display Box (Always visible!) */}
              <div className="flex flex-col gap-3 mt-4">
                {/* Spoken Text Block */}
                <div className="flex flex-col gap-1 w-full text-left">
                  <label className="text-[11px] font-semibold px-1 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Spoken Text ({getLanguageName(detectedLanguage || languageCode)})
                  </label>
                  <textarea
                    value={transcribedText}
                    onChange={(e) => setTranscribedText(e.target.value)}
                    disabled={voiceModalState === 'transcribing'}
                    className="w-full bg-white/5 rounded-xl px-4 py-2.5 outline-none text-sm leading-relaxed min-h-[95px] resize-y"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder={voiceModalState === 'recording' ? "Speak to start transcribing live in real-time..." : "Transcribed text will appear here..."}
                  />
                </div>

                {/* English Translation Block (Shows if selected language is not English) */}
                {languageCode !== 'en' && (
                  <div className="flex flex-col gap-1 w-full text-left">
                    <label className="text-[11px] font-semibold px-1 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      English Translation
                    </label>
                    <div 
                      className="w-full rounded-xl px-4 py-2.5 text-xs italic leading-relaxed min-h-[52px] select-none border"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {voiceModalState === 'recording' && !transcribedText ? (
                        <span>Waiting for speech...</span>
                      ) : voiceModalState === 'transcribing' ? (
                        <span className="animate-pulse flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                          <Loader2 className="w-3 h-3 animate-spin" /> Translating spoken word...
                        </span>
                      ) : translatedText ? (
                        translatedText
                      ) : (
                        <span>Translation will appear here when you stop speaking.</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Error message displays inline if occurred */}
                {voiceModalState === 'error' && (
                  <div className="flex items-center gap-2 text-red-400 text-xs py-1.5 px-2 bg-red-950/20 border border-red-500/10 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{voiceError || "An error occurred during voice session."}</span>
                  </div>
                )}

                {/* Bottom Control Buttons Section */}
                <div className="flex items-center justify-between mt-2 gap-2">
                  {voiceModalState === 'recording' && (
                    <button 
                      onClick={stopRecording}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white rounded-full font-semibold text-xs shadow-lg transition cursor-pointer w-full"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      Stop & Translate
                    </button>
                  )}

                  {voiceModalState === 'transcribing' && (
                    <button 
                      disabled
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-100 text-amber-800 rounded-full font-semibold text-xs transition cursor-not-allowed w-full"
                    >
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Translating Voice...
                    </button>
                  )}

                  {(voiceModalState === 'review' || voiceModalState === 'error') && (
                    <>
                      <button
                        onClick={startRecording}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-amber-800/30 bg-[#f4eedc] text-[#451a03] hover:bg-amber-100/50 transition font-semibold text-xs cursor-pointer flex-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Record Again
                      </button>
                      
                      <button
                        onClick={handleConfirmSend}
                        disabled={!transcribedText.trim()}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-white bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-600 hover:to-orange-600 transition font-semibold text-xs cursor-pointer flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Confirm & Send
                      </button>
                    </>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
