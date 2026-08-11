import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Menu, PanelLeftClose, PanelLeftOpen, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InteractiveGrid from './components/InteractiveGrid';

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

export default function App() {
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [allMessages, setAllMessages] = useState([]);
  const [activeMessageId, setActiveMessageId] = useState(null);

  const getActiveBranchMessages = (allMsgs, activeId) => {
    if (!activeId || allMsgs.length === 0) return [];
    const path = [];
    let current = allMsgs.find(m => m.id === activeId);
    while (current) {
      path.unshift(current);
      current = allMsgs.find(m => m.id === current.parentId);
    }
    return path;
  };

  const getDeepestLeaf = (allMsgs, msgId) => {
    if (!msgId) return null;
    let current = allMsgs.find(m => m.id === msgId);
    while (current) {
      const children = allMsgs.filter(m => m.parentId === current.id);
      if (children.length === 0) break;
      current = children[children.length - 1];
    }
    return current ? current.id : msgId;
  };

  const messages = getActiveBranchMessages(allMessages, activeMessageId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true); // Desktop sidebar toggle (minimized initially)
  const [languageCode, setLanguageCode] = useState('en');
  const theme = 'light';

  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState('default');
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const [sidebarWidth, setSidebarWidth] = useState(280);

  const startResizing = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = sidebarWidth;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent) => {
      const newWidth = startWidth + (mouseMoveEvent.clientX - startX);
      if (newWidth >= 180 && newWidth <= 450) {
        setSidebarWidth(newWidth);
      }
    };

    const stopDrag = () => {
      window.removeEventListener('mousemove', doDrag);
      window.removeEventListener('mouseup', stopDrag);
    };

    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
  };

  const handleLogoClick = async () => {
    setCurrentProjectId('default');
    await handleNewChat('default');
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/projects');
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    const pid = uuidv4();
    try {
      await axios.post('/api/projects', {
        projectId: pid,
        name: newProjectName.trim()
      });
      setNewProjectName('');
      setShowCreateProjectModal(false);
      await fetchProjects();
      setCurrentProjectId(pid);
      handleNewChat(pid);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleRenameProject = async (projectId, newName) => {
    if (!newName.trim()) return;
    try {
      await axios.put(`/api/projects/${projectId}`, {
        name: newName.trim()
      });
      await fetchProjects();
    } catch (err) {
      console.error('Failed to rename project:', err);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (projectId === 'default') return;
    if (!confirm('Are you sure you want to delete this project and all its chats?')) return;
    try {
      await axios.delete(`/api/projects/${projectId}`);
      await fetchProjects();
      if (currentProjectId === projectId) {
        setCurrentProjectId('default');
        const res = await axios.get('/api/sessions');
        const sessions = res.data.sessions || [];
        const generalSessions = sessions.filter(s => s.project_id === 'default' || !s.project_id);
        if (generalSessions.length > 0) {
          setCurrentSessionId(generalSessions[0].id);
        } else {
          handleNewChat('default');
        }
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };



  // Initialize session and projects
  useEffect(() => {
    const initData = async () => {
      try {
        await fetchProjects();
        
        const sessRes = await axios.get('/api/sessions');
        const sessions = sessRes.data.sessions || [];
        
        let savedSessionId = localStorage.getItem('edu_rag_session_id');
        let activeSession = sessions.find(s => s.id === savedSessionId);
        
        if (activeSession) {
          setCurrentProjectId(activeSession.project_id || 'default');
          setCurrentSessionId(savedSessionId);
        } else if (sessions.length > 0) {
          setCurrentProjectId(sessions[0].project_id || 'default');
          setCurrentSessionId(sessions[0].id);
        } else {
          const newId = uuidv4();
          await axios.post('/api/sessions', { sessionId: newId, title: 'New Chat', projectId: 'default' });
          setCurrentProjectId('default');
          setCurrentSessionId(newId);
        }
      } catch (err) {
        console.error('Initialization failed:', err);
      }
    };
    initData();
  }, []);

  // Fetch history when session changes
  useEffect(() => {
    if (!currentSessionId) return;
    localStorage.setItem('edu_rag_session_id', currentSessionId);

    const fetchHistory = async () => {
      try {
        const res = await axios.get(`/api/history?sessionId=${currentSessionId}`);
        const list = res.data.messages || [];
        setAllMessages(list);
        if (list.length > 0) {
          const lastMsg = list[list.length - 1];
          setActiveMessageId(lastMsg.id);
        } else {
          setActiveMessageId(null);
        }
      } catch (err) {
        console.error('Error fetching dialogue history:', err);
      }
    };
    fetchHistory();
  }, [currentSessionId]);

  const handleSendText = async (queryText, inputLanguage = languageCode) => {
    setIsProcessing(true);
    if (inputLanguage && inputLanguage !== languageCode) {
      setLanguageCode(inputLanguage);
    }
    
    const tempUserMsgId = -Math.floor(Math.random() * 1000000) - 1;
    const userMsg = { 
      id: tempUserMsgId, 
      parentId: activeMessageId, 
      role: 'user', 
      text: queryText, 
      inputType: 'text', 
      createdAt: new Date().toISOString() 
    };
    
    setAllMessages(prev => [...prev, userMsg]);
    setActiveMessageId(tempUserMsgId);

    try {
      const res = await axios.post('/api/chat-text', {
        sessionId: currentSessionId,
        queryText,
        languageCode: inputLanguage,
        voiceEnabled: true,
        parentId: activeMessageId
      });

      const userRealId = res.data.userMessageId;
      const modelRealId = res.data.messageId;

      const modelMsg = {
        id: modelRealId,
        parentId: userRealId,
        role: 'model',
        text: res.data.modelResponse,
        inputType: 'text',
        audioUrl: res.data.audioUrl,
        citations: res.data.citations,
        createdAt: new Date().toISOString()
      };

      setAllMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserMsgId);
        return [...filtered, { ...userMsg, id: userRealId }, modelMsg];
      });
      
      setActiveMessageId(modelRealId);
    } catch (err) {
      console.error('Text query request failed:', err);
      const tempErrId = -Math.floor(Math.random() * 1000000) - 2000000;
      const errMsg = {
        id: tempErrId,
        parentId: tempUserMsgId,
        role: 'model',
        text: 'Sorry, I encountered an error answering your question. Please check your network connection.',
        createdAt: new Date().toISOString()
      };
      setAllMessages(prev => {
        const cleaned = prev.map(m => m.id === tempUserMsgId ? { ...m, id: 999999 } : m);
        return [...cleaned, { ...errMsg, parentId: 999999 }];
      });
      setActiveMessageId(tempErrId);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditPrompt = async (messageId, newText) => {
    setIsProcessing(true);
    const originalMsg = allMessages.find(m => m.id === messageId);
    if (!originalMsg) return;
    const parentId = originalMsg.parentId;

    const tempUserMsgId = -Math.floor(Math.random() * 1000000) - 1000000;
    const userMsg = { 
      id: tempUserMsgId, 
      parentId: parentId, 
      role: 'user', 
      text: newText, 
      inputType: 'text', 
      createdAt: new Date().toISOString() 
    };

    setAllMessages(prev => [...prev, userMsg]);
    setActiveMessageId(tempUserMsgId);

    try {
      const res = await axios.post('/api/chat-text', {
        sessionId: currentSessionId,
        queryText: newText,
        languageCode: languageCode,
        voiceEnabled: true,
        parentId: parentId
      });

      const userRealId = res.data.userMessageId;
      const modelRealId = res.data.messageId;

      const modelMsg = {
        id: modelRealId,
        parentId: userRealId,
        role: 'model',
        text: res.data.modelResponse,
        inputType: 'text',
        audioUrl: res.data.audioUrl,
        citations: res.data.citations,
        createdAt: new Date().toISOString()
      };

      setAllMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserMsgId);
        return [...filtered, { ...userMsg, id: userRealId }, modelMsg];
      });
      
      setActiveMessageId(modelRealId);
    } catch (err) {
      console.error('Prompt edit failed:', err);
      const tempErrId = -Math.floor(Math.random() * 1000000) - 3000000;
      const errMsg = {
        id: tempErrId,
        parentId: tempUserMsgId,
        role: 'model',
        text: 'Sorry, I encountered an error answering your question. Please check your network connection.',
        createdAt: new Date().toISOString()
      };
      setAllMessages(prev => {
        const cleaned = prev.map(m => m.id === tempUserMsgId ? { ...m, id: 999999 } : m);
        return [...cleaned, { ...errMsg, parentId: 999999 }];
      });
      setActiveMessageId(tempErrId);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewChat = async (targetProjectId) => {
    const newId = uuidv4();
    const pid = targetProjectId || currentProjectId;
    try {
      await axios.post('/api/sessions', { 
        sessionId: newId, 
        title: 'New Chat',
        projectId: pid
      });
      setCurrentSessionId(newId);
    } catch (err) {
      console.error('Failed to create session', err);
    }
  };

  return (
    <div 
      className="flex h-screen font-sans overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Resizable Sidebar Wrapper Container */}
      <div className="relative flex h-screen shrink-0">
        <motion.div 
          initial={{ width: 0, opacity: 0 }}
          animate={{ 
            width: isSidebarMinimized ? 0 : sidebarWidth,
            opacity: isSidebarMinimized ? 0 : 1
          }}
          transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          className="hidden md:block h-screen overflow-hidden shrink-0 z-20 border-r"
          style={{
            backgroundColor: 'var(--bg-sidebar)',
            borderColor: 'var(--border-color)'
          }}
        >
          <Sidebar 
            currentSessionId={currentSessionId} 
            onSelectSession={(id) => setCurrentSessionId(id)}
            onNewChat={handleNewChat}
            projects={projects}
            currentProjectId={currentProjectId}
            onSelectProject={setCurrentProjectId}
            onCreateProject={() => setShowCreateProjectModal(true)}
            onRenameProject={handleRenameProject}
            onDeleteProject={handleDeleteProject}
          />
        </motion.div>

        {/* Horizontal Resize handle */}
        {!isSidebarMinimized && (
          <div 
            onMouseDown={startResizing}
            className="absolute top-0 right-[-3px] w-[6px] h-full cursor-col-resize hover:bg-zinc-400/20 active:bg-zinc-500/40 z-30 transition"
          />
        )}
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}>
          <div className="w-[260px] h-full" onClick={e => e.stopPropagation()}>
             <Sidebar 
                currentSessionId={currentSessionId} 
                onSelectSession={(id) => {
                  setCurrentSessionId(id);
                  setIsSidebarOpen(false);
                }} 
                onNewChat={handleNewChat}
                projects={projects}
                currentProjectId={currentProjectId}
                onSelectProject={setCurrentProjectId}
                onCreateProject={() => {
                  setIsSidebarOpen(false);
                  setShowCreateProjectModal(true);
                }}
                onRenameProject={handleRenameProject}
                onDeleteProject={handleDeleteProject}
              />
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative h-full min-w-0 overflow-hidden bg-transparent">
        {/* Breathtaking dynamic interactive background grid */}
        <InteractiveGrid theme={theme} isChatActive={messages.length > 0} />
        
        {/* Top Navigation Bar */}
        <div 
          className="flex items-center justify-between py-4 px-6 border-b z-10 shadow-md transition-all duration-300"
          style={{
            backgroundColor: 'var(--bg-header)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)'
          }}
        >
          <div className="flex items-center gap-4">
            {/* Mobile Toggle */}
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md md:hidden transition cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
            >
              <Menu className="w-6 h-6" />
            </button>
            {/* Desktop Toggle */}
            <button 
              onClick={() => setIsSidebarMinimized(!isSidebarMinimized)} 
              className="hidden md:flex p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition cursor-pointer" 
              style={{ color: 'var(--text-secondary)' }}
              title="Toggle Sidebar"
            >
              {isSidebarMinimized ? <PanelLeftOpen className="w-5 h-5 animate-pulse" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            
            {/* Header - Clicks to start new chat in General */}
            <button 
              onClick={handleLogoClick}
              className="flex items-center gap-3 px-2 hidden md:flex hover:scale-105 transition-transform cursor-pointer"
              title="Start a New Chat"
            >
              <QuillLogo className="w-8 h-8 text-[var(--color-accent)] shrink-0" />
              <span 
                className="text-2xl font-bold transition-all duration-300"
                style={{ color: 'var(--text-primary)' }}
              >
                Iris
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 px-2">
            {/* Language Selector is now moved to ChatInput near the mic */}
          </div>
        </div>

        {/* Chat Window */}
        <ChatWindow
          messages={messages}
          onSendText={handleSendText}
          isProcessing={isProcessing}
          sessionId={currentSessionId}
          languageCode={languageCode}
          setLanguageCode={setLanguageCode}
          theme={theme}
          allMessages={allMessages}
          activeMessageId={activeMessageId}
          onSelectActiveMessageId={setActiveMessageId}
          onEditPrompt={handleEditPrompt}
        />
      </main>

      {/* Create Project Modal - Centered */}
      <AnimatePresence>
        {showCreateProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-[90%] max-w-md p-6 rounded-2xl border shadow-2xl z-50 flex flex-col gap-4"
              style={{
                backgroundColor: theme === 'dark' ? '#0f0f12' : '#ffffff',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <h3 className="text-lg font-bold">Create Custom Project</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Define a new project workspace. Chats created inside this space will stay isolated.</p>
              
              <input 
                type="text" 
                value={newProjectName} 
                onChange={(e) => setNewProjectName(e.target.value)} 
                placeholder="e.g. Physics Lab, Biology Notes" 
                className="w-full px-4 py-2.5 rounded-xl border font-semibold text-sm transition focus:outline-none focus:ring-1 focus:ring-zinc-400"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProject();
                }}
              />

              <div className="flex items-center justify-end gap-3 mt-2">
                <button 
                  onClick={() => {
                    setShowCreateProjectModal(false);
                    setNewProjectName('');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 border transition cursor-pointer"
                  style={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateProject}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--bg-app)'
                  }}
                >
                  Create Workspace
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
