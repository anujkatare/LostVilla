import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, Users, ShieldAlert, Sparkles, MessageSquare, AlertCircle, Lock, LogIn } from 'lucide-react';
import { API_BASE, resolveUrl } from '../config.js';
import { motion } from 'framer-motion';
import { supabase } from '../supabase.js';

export default function ChatSection({ currentUser, session }) {
  const [activeRoom, setActiveRoom] = useState('public'); // 'public' or a dynamic DM room
  const [dmTarget, setDmTarget] = useState('');
  const [joinedDmTarget, setJoinedDmTarget] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef(null);
  const streamEndRef = useRef(null);

  // Initialize socket connection to backend
  useEffect(() => {
    // Use API_BASE from config (auto-switches between dev and prod)
    const socketUrl = API_BASE;
    socketRef.current = io(socketUrl);

    socketRef.current.on('connect', () => {
      setSocketConnected(true);
      console.log('Socket.io portal connected!');
    });

    socketRef.current.on('disconnect', () => {
      setSocketConnected(false);
      console.log('Socket.io portal disconnected.');
    });

    // Handle receiving incoming messages in real-time
    socketRef.current.on('receive_message', (msg) => {
      setMessages((prev) => {
        // Prevent duplicate append
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Fetch past message logs from SQLite API when room switches
  const fetchRoomHistory = (roomName) => {
    fetch(`${API_BASE}/api/messages/${roomName}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
      })
      .catch((err) => console.log('Failed fetching room logs:', err));
  };

  // Join designated socket room on change
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.emit('join_room', activeRoom);
      fetchRoomHistory(activeRoom);
    }
  }, [activeRoom]);

  // Scroll message stream to latest entry
  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Dispatch message to active room
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageData = {
      senderName: currentUser.username,
      senderAvatar: currentUser.avatarUrl,
      roomName: activeRoom,
      text: inputText.trim()
    };

    if (socketRef.current && socketConnected) {
      socketRef.current.emit('send_message', messageData);
      setInputText('');
    } else {
      alert('Sighting portal currently offline. Attempting automatic reconnection...');
    }
  };

  // Create or join a private DM room between current user and target user
  const handleJoinPrivateDM = (e) => {
    e.preventDefault();
    if (!dmTarget.trim() || dmTarget.trim() === currentUser.username) {
      alert('Enter a valid fellow survivor\'s username (cannot whisper to yourself).');
      return;
    }

    const targetUser = dmTarget.trim();
    // Generate a unique persistent room name by hashing/sorting usernames alphabetically
    const usersHash = [currentUser.username, targetUser].sort().join('-vs-');
    const privateRoomId = `dm:${usersHash}`;

    setJoinedDmTarget(targetUser);
    setActiveRoom(privateRoomId);
  };

  const returnToLobby = () => {
    setActiveRoom('public');
    setJoinedDmTarget('');
    setDmTarget('');
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error signing in:', err.message);
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 max-w-md mx-auto text-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-canvas/80 dark:bg-surface-card-dark/80 backdrop-blur-xl p-8 rounded-2xl border border-hairline dark:border-hairline-dark shadow-xl w-full relative overflow-hidden"
        >
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20 text-primary">
            <Lock size={26} className="animate-bounce" />
          </div>
          <h2 className="heading-lg font-display font-extrabold text-ink dark:text-white mb-2">
            Spectral Portal Locked
          </h2>
          <p className="text-xs text-mute dark:text-mute-dark mb-6 leading-relaxed max-w-xs mx-auto">
            You must sign in to connect with fellow survivors, Whisper in private, and share real-time transmissions.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 border border-hairline dark:border-hairline-dark text-xs font-bold rounded-xl text-ink dark:text-white bg-surface-card hover:bg-surface-soft dark:bg-canvas-dark dark:hover:bg-secondary-bg-dark transition-all shadow-md cursor-pointer active:scale-95"
          >
            <LogIn size={14} className="text-primary animate-pulse" />
            <span>Sign In to Chat</span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 h-[72vh] md:h-[75vh]">
      
      {/* Side Control Panel (Rooms list, Whisper generator) */}
      <div className="bg-canvas dark:bg-surface-card-dark border border-hairline dark:border-hairline-dark rounded-md p-4 flex flex-col gap-5 md:col-span-1 justify-between">
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-mute dark:text-mute-dark flex items-center gap-1.5">
            <Users size={16} /> Spectral Channels
          </h3>

          <div className="flex flex-col gap-2">
            
            {/* Public lobby channel selector */}
            <button
              onClick={returnToLobby}
              className={`w-full text-left py-2.5 px-4 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                activeRoom === 'public'
                  ? 'bg-primary text-white'
                  : 'bg-surface-card hover:bg-secondary-bg dark:bg-canvas-dark dark:hover:bg-secondary-bg-dark text-ink dark:text-white'
              }`}
            >
              <MessageSquare size={14} />
              <span>Public Spooky Lounge</span>
            </button>

            {/* Active Private Whisper display */}
            {joinedDmTarget && (
              <button
                className="w-full text-left py-2.5 px-4 rounded-md text-xs font-bold bg-ink text-white dark:bg-white dark:text-black flex items-center gap-2 border border-primary/20"
              >
                <Sparkles size={14} className="animate-spin" />
                <span className="truncate">Whisper: {joinedDmTarget}</span>
              </button>
            )}

          </div>
        </div>

        {/* Private Whisper DM generator form */}
        <form onSubmit={handleJoinPrivateDM} className="border-t border-hairline dark:border-hairline-dark pt-4 flex flex-col gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-mute dark:text-mute-dark uppercase tracking-wider">
              Whisper directly
            </label>
            <input 
              type="text"
              value={dmTarget}
              onChange={(e) => setDmTarget(e.target.value)}
              placeholder="Enter username..."
              className="bg-surface-card dark:bg-canvas-dark text-ink dark:text-white placeholder-ash text-xs px-3 py-2 rounded-md border border-ash/30 double-focus"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-ink hover:bg-black dark:bg-secondary-bg-dark dark:hover:bg-secondary-pressed-dark text-white text-xs font-bold py-2 rounded-md transition-all active:scale-95 border border-stone/10"
          >
            Initiate Whisper
          </button>
        </form>

      </div>

      {/* Primary Chat Box stream */}
      <div className="bg-canvas dark:bg-surface-card-dark border border-hairline dark:border-hairline-dark rounded-md flex flex-col md:col-span-2 overflow-hidden">
        
        {/* Chat Box Header info */}
        <div className="bg-surface-card dark:bg-canvas-dark border-b border-hairline dark:border-hairline-dark p-3.5 flex justify-between items-center px-5">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${socketConnected ? 'bg-green-500 glow-active' : 'bg-red-500'}`} />
            <span className="text-xs font-bold text-ink dark:text-white">
              {activeRoom === 'public' 
                ? 'Public Lounge' 
                : `Private Whisper with ${joinedDmTarget}`}
            </span>
          </div>
          <span className="text-[10px] text-mute dark:text-mute-dark uppercase font-semibold">
            {socketConnected ? 'Spectral Stream Connected' : 'Seeking connection'}
          </span>
        </div>

        {/* Message Log stream scrollbox */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-surface-soft/40 dark:bg-canvas-dark/20">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-mute dark:text-mute-dark py-12">
              <ShieldAlert className="text-stone dark:text-stone-dark mb-2 animate-bounce" size={24} />
              <p className="text-xs font-bold uppercase tracking-wider">No whispers here yet</p>
              <p className="text-[10px] mt-0.5">Send a transmission to break the silence.</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMine = msg.senderName === currentUser.username;
              return (
                <div 
                  key={msg.id || index}
                  className={`flex gap-2.5 max-w-[85%] ${isMine ? 'self-end flex-row-reverse' : 'self-start'}`}
                >
                  <img 
                    src={resolveUrl(msg.senderAvatar || '')} 
                    alt={msg.senderName} 
                    className="w-7 h-7 rounded-full object-cover border border-hairline dark:border-hairline-dark mt-0.5 shrink-0"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                    }}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-[10px] font-bold text-mute dark:text-mute-dark tracking-wide ${isMine ? 'text-right' : 'text-left'}`}>
                      {msg.senderName}
                    </span>
                    <div className={`p-3 rounded-md text-xs leading-relaxed break-words shadow-sm ${
                      isMine 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-surface-card dark:bg-canvas-dark text-ink dark:text-white rounded-tl-none border border-hairline dark:border-hairline-dark'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={streamEndRef} />
        </div>

        {/* Input send bar footer form */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-hairline dark:border-hairline-dark bg-surface-card dark:bg-canvas-dark flex gap-2">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Whisper a sighting..."
            className="flex-1 bg-canvas dark:bg-surface-card-dark text-ink dark:text-white placeholder-ash px-4 py-2 text-xs rounded-md border border-ash/30 double-focus"
          />
          <button 
            type="submit"
            className="bg-primary hover:bg-primary-pressed text-white p-2.5 rounded-md transition-all active:scale-95 shadow-none flex items-center justify-center border-none"
          >
            <Send size={14} />
          </button>
        </form>

      </div>

    </div>
  );
}
