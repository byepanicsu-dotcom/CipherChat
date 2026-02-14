import React, { useState, useEffect, useRef } from 'react';
import { Send, Lock, ShieldCheck, Cpu, X, Plus, FileText, Download, Box, FileCode, Users, Wifi, WifiOff, Copy, Check, Share2, UserPlus, Trash2, User, Link as LinkIcon } from 'lucide-react';
import { Message, Attachment, UserProfile, Contact } from '../types';
import { sendMessageStream } from '../services/geminiService';
import Peer, { DataConnection } from 'peerjs';

interface ChatInterfaceProps {
    userProfile: UserProfile;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        resolve(result); 
    };
    reader.onerror = error => reject(error);
  });
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.apk')) return <Box size={24} className="text-emerald-400" />;
    if (fileName.endsWith('.js') || fileName.endsWith('.tsx') || fileName.endsWith('.html')) return <FileCode size={24} className="text-blue-400" />;
    return <FileText size={24} className="text-zinc-400" />;
};

// --- P2P TYPES ---
interface P2PData {
    type: 'message' | 'handshake';
    id?: string; // message id for dedup
    text?: string;
    senderProfile?: UserProfile;
    attachments?: Attachment[];
    timestamp: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ userProfile }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Cipher Group Protocol Ready.\n\n1. Share your ID with friends.\n2. Add them to Contacts.\n3. Wait for them to connect to create a Group.",
      sender: 'system',
      timestamp: new Date(),
      senderProfile: { username: 'System', avatarUrl: '' }
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSimulatedEncrypt, setIsSimulatedEncrypt] = useState(true);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  
  // P2P State
  const [peer, setPeer] = useState<Peer | null>(null);
  const [myPeerId, setMyPeerId] = useState<string>('');
  
  // We now support multiple connections (Group Chat)
  const [connections, setConnections] = useState<DataConnection[]>([]);
  
  const [targetPeerId, setTargetPeerId] = useState('');
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'connect' | 'contacts'>('connect');
  const [copied, setCopied] = useState(false);

  // Contacts State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactId, setNewContactId] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, pendingAttachments]);

  // Load Contacts
  useEffect(() => {
      const saved = localStorage.getItem('cipher_contacts');
      if (saved) {
          try {
              setContacts(JSON.parse(saved));
          } catch (e) { console.error(e); }
      }
  }, []);

  // Check for Magic Link on Mount
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const connectTo = params.get('connect');
      if (connectTo) {
          setTargetPeerId(connectTo);
          setShowConnectionModal(true);
          // Optional: Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
      }
  }, []);

  const saveContact = () => {
      if (!newContactName || !newContactId) return;
      const newContact: Contact = {
          id: newContactId.trim(),
          name: newContactName.trim(),
          addedAt: Date.now()
      };
      const updated = [...contacts, newContact];
      setContacts(updated);
      localStorage.setItem('cipher_contacts', JSON.stringify(updated));
      setNewContactName('');
      setNewContactId('');
  };

  const deleteContact = (id: string) => {
      const updated = contacts.filter(c => c.id !== id);
      setContacts(updated);
      localStorage.setItem('cipher_contacts', JSON.stringify(updated));
  };

  // --- PEERJS INITIALIZATION ---
  useEffect(() => {
      let customId = localStorage.getItem('cipher_chat_id');
      if (!customId) {
          const cleanName = userProfile.username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 5);
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          customId = `${cleanName}-${randomSuffix}`;
          localStorage.setItem('cipher_chat_id', customId);
      }
      
      const newPeer = new Peer(customId);

      newPeer.on('open', (id) => {
          setMyPeerId(id);
      });

      newPeer.on('connection', (incomingConn) => {
          handleConnection(incomingConn);
          addSystemMessage(`User connected: ${incomingConn.peer}`);
      });

      newPeer.on('error', (err) => {
          if (err.type === 'unavailable-id') {
              localStorage.removeItem('cipher_chat_id');
              addSystemMessage("ID Conflict. Refreshing...");
          } else {
              addSystemMessage(`Network Error: ${err.type}`);
          }
      });

      setPeer(newPeer);
      return () => { newPeer.destroy(); };
  }, []);

  const handleConnection = (conn: DataConnection) => {
      conn.on('open', () => {
          setConnections(prev => {
              // Avoid duplicates
              if (prev.find(c => c.peer === conn.peer)) return prev;
              return [...prev, conn];
          });
      });

      conn.on('data', (data: any) => {
          handleIncomingData(data, conn.peer);
      });

      conn.on('close', () => {
          setConnections(prev => prev.filter(c => c.peer !== conn.peer));
          addSystemMessage(`User disconnected: ${conn.peer}`);
      });
      
      conn.on('error', () => {
          setConnections(prev => prev.filter(c => c.peer !== conn.peer));
      });
  };

  const connectToPeer = (idToConnect: string) => {
      if (!peer || !idToConnect) return;
      if (connections.find(c => c.peer === idToConnect)) {
          addSystemMessage("Already connected to this user.");
          return;
      }

      const conn = peer.connect(idToConnect);
      handleConnection(conn);
      // Wait for 'open' event in handleConnection to add to state
      setTimeout(() => setShowConnectionModal(false), 500);
  };

  const handleIncomingData = (data: P2PData, sourcePeerId: string) => {
      if (data.type === 'message') {
          // Deduplication
          if (data.id && processedMessageIds.current.has(data.id)) return;
          if (data.id) processedMessageIds.current.add(data.id);

          // 1. Display Message
          const newMsg: Message = {
              id: data.id || Date.now().toString(),
              text: data.text || '',
              sender: 'user',
              timestamp: new Date(data.timestamp),
              senderProfile: data.senderProfile,
              attachments: data.attachments,
              isEncrypted: true
          };
          setMessages(prev => [...prev, newMsg]);

          // 2. RELAY LOGIC (The "Group" Magic)
          // If we have multiple connections, we act as a hub. 
          // Forward this message to everyone EXCEPT the person who sent it.
          if (connections.length > 1) {
              connections.forEach(conn => {
                  if (conn.peer !== sourcePeerId && conn.open) {
                      conn.send(data);
                  }
              });
          }
      }
  };

  const addSystemMessage = (text: string) => {
      setMessages(prev => [...prev, {
          id: Date.now().toString() + Math.random(),
          text,
          sender: 'system',
          timestamp: new Date()
      }]);
  };

  const broadcastMessage = (payload: P2PData) => {
      connections.forEach(conn => {
          if (conn.open) conn.send(payload);
      });
  };

  const copyId = () => {
      navigator.clipboard.writeText(myPeerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };
  
  const shareId = async () => {
      const magicLink = `${window.location.origin}${window.location.pathname}?connect=${myPeerId}`;
      
      if (navigator.share) {
          try {
              await navigator.share({
                  title: 'Join my Secure Group',
                  text: `Connect with me on CipherChat! Click to join:`,
                  url: magicLink
              });
          } catch (err) { 
              navigator.clipboard.writeText(magicLink);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
          }
      } else { 
          navigator.clipboard.writeText(magicLink);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newAttachments: Attachment[] = [];
      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const url = URL.createObjectURL(file);
          let type: 'image' | 'video' | 'file' = 'file';
          if (file.type.startsWith('image/')) type = 'image';
          else if (file.type.startsWith('video/')) type = 'video';
          
          let base64Data = await fileToBase64(file);
          newAttachments.push({
              type,
              url,
              mimeType: file.type || 'application/octet-stream',
              data: base64Data,
              fileName: file.name,
              fileSize: formatFileSize(file.size)
          });
      }
      setPendingAttachments(prev => [...prev, ...newAttachments]);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
      setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!inputText.trim() && pendingAttachments.length === 0) return;

    const msgId = Date.now().toString() + Math.random();
    processedMessageIds.current.add(msgId);

    const userMsg: Message = {
      id: msgId,
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      isEncrypted: isSimulatedEncrypt,
      senderProfile: userProfile,
      attachments: [...pendingAttachments]
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setPendingAttachments([]);

    if (connections.length > 0) {
        // Send to Group
        const payload: P2PData = {
            type: 'message',
            id: msgId,
            text: userMsg.text,
            senderProfile: userProfile,
            attachments: userMsg.attachments,
            timestamp: new Date().toISOString()
        };
        broadcastMessage(payload);
    } else {
        // AI Fallback
        setIsTyping(true);
        let fullResponse = "";
        const responseId = (Date.now() + 1).toString();
        
        const aiAttachments = userMsg.attachments?.map(att => {
             let cleanData = att.data;
             if (cleanData && cleanData.includes(',')) cleanData = cleanData.split(',')[1];
             return { ...att, data: cleanData };
        });

        setMessages(prev => [...prev, {
            id: responseId,
            text: "",
            sender: 'ai',
            timestamp: new Date(),
            senderProfile: { username: 'Cipher', avatarUrl: '' }
        }]);

        try {
            const stream = sendMessageStream(userMsg.text, aiAttachments);
            for await (const chunk of stream) {
                fullResponse += chunk;
                setMessages(prev => prev.map(msg => 
                    msg.id === responseId ? { ...msg, text: fullResponse } : msg
                ));
            }
        } catch (error) { /* ignore */ } finally { setIsTyping(false); }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Liquid Header */}
      <div className="h-20 flex items-center justify-between px-6 bg-surface-dim/30 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
         <div className="flex items-center gap-4">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${connections.length > 0 ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-surface-container border-white/10 text-zinc-400'}`}>
                 {connections.length > 0 ? <Wifi size={20} /> : <WifiOff size={20} />}
             </div>
             <div>
                 <h2 className="text-base font-bold text-white tracking-wide">
                     {connections.length > 0 ? `Group Active (${connections.length + 1} users)` : 'Cipher AI (Offline)'}
                 </h2>
                 <p className="text-xs text-secondary font-medium truncate max-w-[150px] md:max-w-xs">
                     {connections.length > 0 
                        ? 'Encrypted Mesh Network' 
                        : 'Waiting for peers...'}
                 </p>
             </div>
         </div>
         
         <div className="flex gap-3">
             <button 
                onClick={() => setShowConnectionModal(true)}
                className={`h-10 px-4 rounded-full flex items-center gap-2 border transition-all ${connections.length > 0 ? 'bg-surface-bright text-white border-primary/30' : 'bg-surface-bright text-zinc-400 border-white/5'}`}
             >
                 <Users size={18} />
                 <span className="text-xs font-bold hidden md:inline">
                     {connections.length > 0 ? 'Manage Group' : 'Connect'}
                 </span>
             </button>
         </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-24 no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-3 ${msg.sender === 'user' && msg.senderProfile?.username === userProfile.username ? 'flex-row-reverse' : 'flex-row'} ${msg.sender === 'system' ? 'justify-center w-full !gap-0' : ''}`}
          >
            {msg.sender === 'system' ? (
                <div className="bg-surface-bright/50 border border-white/5 px-4 py-2 rounded-full text-xs text-zinc-400 flex items-center gap-2">
                    <UserPlus size={12} className="text-primary" /> {msg.text}
                </div>
            ) : (
             <>
                {/* Avatar */}
                <div className={`shrink-0 w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg ${msg.sender === 'ai' ? 'bg-surface-container border border-primary/20' : 'bg-surface-bright border border-white/5'}`}>
                    {msg.sender === 'ai' ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
                            <div className="absolute inset-0 bg-primary/20 animate-pulse-fast"></div>
                            <Cpu size={20} className="text-primary relative z-10" />
                        </div>
                    ) : (
                        msg.senderProfile?.avatarUrl ? (
                            <img src={msg.senderProfile.avatarUrl} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-surface-bright flex items-center justify-center text-sm font-bold text-zinc-400">
                                {msg.senderProfile?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )
                    )}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[85%] md:max-w-[70%] flex flex-col gap-1 ${msg.sender === 'user' && msg.senderProfile?.username === userProfile.username ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 px-2">
                        <span className="text-[11px] text-zinc-400 font-bold tracking-wide">
                            {msg.sender === 'ai' ? 'Cipher' : msg.senderProfile?.username}
                        </span>
                    </div>

                    <div
                    className={`rounded-[1.5rem] px-5 py-4 text-sm md:text-base leading-relaxed shadow-md backdrop-blur-sm border ${
                        msg.sender === 'user' && msg.senderProfile?.username === userProfile.username
                        ? 'bg-primary-container/80 text-emerald-50 rounded-tr-sm border-primary/20'
                        : 'bg-surface-container/80 text-zinc-100 rounded-tl-sm border-white/5'
                    }`}
                    >
                        {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-col gap-2 mb-3">
                                {msg.attachments.map((att, i) => (
                                    <div key={i}>
                                        {att.type === 'image' ? (
                                            <div className="rounded-xl overflow-hidden bg-black/30 border border-white/10 max-w-full">
                                                <img src={att.data || att.url} alt="Attachment" className="max-h-60 w-auto object-contain" />
                                            </div>
                                        ) : att.type === 'video' ? (
                                            <div className="rounded-xl overflow-hidden bg-black/30 border border-white/10 max-w-full">
                                                <video src={att.data || att.url} controls className="max-h-60 w-auto" />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/10 hover:bg-black/30 transition-colors cursor-pointer group/file">
                                                <div className="w-10 h-10 rounded-lg bg-surface-dim flex items-center justify-center border border-white/5">
                                                    {getFileIcon(att.fileName || '')}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate text-zinc-200 group-hover/file:text-primary transition-colors">{att.fileName}</p>
                                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{att.fileSize}</p>
                                                </div>
                                                <a href={att.data || att.url} download={att.fileName} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-primary hover:text-white transition-all">
                                                    <Download size={14} />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {msg.text && <div className="whitespace-pre-wrap break-words">{msg.text}</div>}
                        
                        <div className={`text-[10px] mt-2 text-right opacity-60 font-mono ${msg.sender === 'user' && msg.senderProfile?.username === userProfile.username ? 'text-emerald-200' : 'text-zinc-500'}`}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
             </>
            )}
          </div>
        ))}
        {isTyping && (
             <div className="flex items-end gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-surface-container border border-primary/20 flex items-center justify-center">
                    <Cpu size={20} className="text-primary" />
                 </div>
                 <div className="bg-surface-container border border-white/5 rounded-[1.5rem] rounded-tl-sm px-5 py-4 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-[bounce_1s_infinite_0ms]"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-[bounce_1s_infinite_200ms]"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-[bounce_1s_infinite_400ms]"></div>
                 </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-surface-dim/80 backdrop-blur-xl border-t border-white/5 sticky bottom-0 z-20">
         {pendingAttachments.length > 0 && (
             <div className="flex gap-3 mb-3 px-1 overflow-x-auto pb-2 scrollbar-hide">
                 {pendingAttachments.map((att, i) => (
                     <div key={i} className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border border-white/10 group shadow-lg bg-surface-container flex flex-col items-center justify-center p-2">
                         {att.type === 'image' ? (
                             <img src={att.url} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                         ) : (
                             <>
                                {getFileIcon(att.fileName || '')}
                                <span className="text-[8px] text-zinc-400 mt-1 w-full text-center truncate px-1">{att.fileName}</span>
                             </>
                         )}
                         <button onClick={() => removeAttachment(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md z-10">
                             <X size={10} strokeWidth={3} />
                         </button>
                     </div>
                 ))}
             </div>
         )}
        <div className="max-w-4xl mx-auto flex items-end gap-3">
            <div className="relative">
                <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-full bg-surface-bright text-zinc-400 hover:text-primary hover:bg-surface-container transition-all flex items-center justify-center border border-white/5 hover:border-primary/30">
                    <Plus size={24} />
                </button>
            </div>
            
            <div className="flex-1 bg-surface-container hover:bg-surface-bright rounded-[2rem] flex items-center border border-transparent focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-inner">
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={connections.length > 0 ? `Broadcast to Group...` : "Message AI..."}
                    className="w-full bg-transparent text-white px-6 py-4 max-h-32 focus:outline-none resize-none no-scrollbar text-base placeholder-zinc-500"
                    rows={1}
                />
            </div>
            <button
                onClick={handleSend}
                disabled={(!inputText.trim() && pendingAttachments.length === 0) || isTyping}
                className="w-12 h-12 rounded-full bg-primary text-surface-dim shadow-[0_0_15px_rgba(52,211,153,0.4)] hover:shadow-[0_0_25px_rgba(52,211,153,0.6)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none transition-all flex items-center justify-center"
            >
                <Send size={20} className="ml-0.5" strokeWidth={2.5} />
            </button>
        </div>
      </div>

      {/* Unified Connection & Contact Modal */}
      {showConnectionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-surface-dim border border-white/10 rounded-[2rem] max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="absolute inset-0 bg-liquid-glow opacity-30 pointer-events-none"></div>
                  
                  {/* Modal Header */}
                  <div className="p-6 pb-2 relative z-10 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white">Network Link</h3>
                      <button onClick={() => setShowConnectionModal(false)} className="p-2 bg-surface-bright rounded-full hover:bg-surface-container transition-colors">
                          <X size={18} />
                      </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex px-6 gap-4 border-b border-white/5 relative z-10 mt-2">
                      <button 
                        onClick={() => setActiveTab('connect')} 
                        className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'connect' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                          Connection
                          {activeTab === 'connect' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>}
                      </button>
                      <button 
                        onClick={() => setActiveTab('contacts')} 
                        className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'contacts' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                          Contacts ({contacts.length})
                          {activeTab === 'contacts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>}
                      </button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 overflow-y-auto relative z-10 flex-1">
                      
                      {activeTab === 'connect' && (
                          <div className="space-y-6">
                                <div className="bg-surface-container p-4 rounded-2xl border border-white/5">
                                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2 block">Your Secure ID</label>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 bg-black/30 p-3 rounded-xl text-emerald-400 font-mono text-sm overflow-hidden text-ellipsis">{myPeerId || 'Generating...'}</code>
                                        <button onClick={shareId} className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors group">
                                            {navigator.share ? <Share2 size={18} /> : (copied ? <Check size={18} /> : <LinkIcon size={18} />)}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mt-2">Send invite link to friend. They must connect to YOU.</p>
                                </div>

                                <div className="flex justify-center">
                                    <span className="text-xs font-bold text-zinc-600 bg-surface-dim px-3 py-1 rounded-full border border-white/5">OR CONNECT TO FRIEND</span>
                                </div>

                                <div>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={targetPeerId}
                                            onChange={(e) => setTargetPeerId(e.target.value)}
                                            placeholder="Paste Friend ID here..."
                                            className="flex-1 bg-surface-bright border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 outline-none text-sm font-mono"
                                        />
                                        <button 
                                            onClick={() => connectToPeer(targetPeerId)}
                                            disabled={!targetPeerId}
                                            className="bg-primary text-surface-dim font-bold rounded-xl px-4 hover:bg-primary-dark transition-all disabled:opacity-50"
                                        >
                                            Join
                                        </button>
                                    </div>
                                </div>

                                {/* Active Connections List */}
                                {connections.length > 0 && (
                                    <div className="mt-4">
                                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2 block">Active Group Members</label>
                                        <div className="space-y-2">
                                            {connections.map(c => (
                                                <div key={c.peer} className="flex items-center justify-between bg-surface-bright p-3 rounded-xl border border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                        <span className="text-xs font-mono text-zinc-300">
                                                            {contacts.find(contact => contact.id === c.peer)?.name || c.peer}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                          </div>
                      )}

                      {activeTab === 'contacts' && (
                          <div className="space-y-6">
                              {/* Add Contact Form */}
                              <div className="bg-surface-container p-4 rounded-2xl border border-white/5 space-y-3">
                                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">Save New Friend</label>
                                  <input 
                                      type="text" 
                                      value={newContactName}
                                      onChange={(e) => setNewContactName(e.target.value)}
                                      placeholder="Name (e.g. Max)"
                                      className="w-full bg-surface-dim border-none rounded-xl px-4 py-2 text-white text-sm focus:ring-1 focus:ring-primary/50"
                                  />
                                  <input 
                                      type="text" 
                                      value={newContactId}
                                      onChange={(e) => setNewContactId(e.target.value)}
                                      placeholder="Paste ID"
                                      className="w-full bg-surface-dim border-none rounded-xl px-4 py-2 text-white text-sm font-mono focus:ring-1 focus:ring-primary/50"
                                  />
                                  <button 
                                    onClick={saveContact}
                                    disabled={!newContactName || !newContactId}
                                    className="w-full py-2 bg-surface-bright hover:bg-primary/20 hover:text-primary text-zinc-400 font-bold rounded-xl transition-all text-xs border border-white/5"
                                  >
                                      Save Contact
                                  </button>
                              </div>

                              {/* Contact List */}
                              <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                                  {contacts.length === 0 ? (
                                      <div className="text-center text-zinc-500 text-sm py-4">No contacts saved yet.</div>
                                  ) : (
                                      contacts.map(contact => (
                                          <div key={contact.id} className="flex items-center justify-between bg-surface-bright p-3 rounded-xl border border-white/5 hover:border-primary/30 group">
                                              <div className="flex items-center gap-3 overflow-hidden">
                                                  <div className="w-8 h-8 rounded-full bg-surface-dim flex items-center justify-center text-zinc-400">
                                                      <User size={14} />
                                                  </div>
                                                  <div className="min-w-0">
                                                      <p className="text-sm font-bold text-white truncate">{contact.name}</p>
                                                      <p className="text-[10px] text-zinc-500 font-mono truncate w-24">{contact.id}</p>
                                                  </div>
                                              </div>
                                              <div className="flex gap-2">
                                                  <button 
                                                    onClick={() => connectToPeer(contact.id)}
                                                    className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-surface-dim transition-colors"
                                                    title="Add to Group"
                                                  >
                                                      <Plus size={16} />
                                                  </button>
                                                  <button 
                                                    onClick={() => deleteContact(contact.id)}
                                                    className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-colors"
                                                  >
                                                      <Trash2 size={16} />
                                                  </button>
                                              </div>
                                          </div>
                                      ))
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default ChatInterface;