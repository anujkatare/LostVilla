import React, { useState, useEffect } from 'react';
import BottomNavbar from './components/BottomNavbar.jsx';
import HomeSection from './components/HomeSection.jsx';
import SearchSection from './components/SearchSection.jsx';
import PostSection from './components/PostSection.jsx';
import ChatSection from './components/ChatSection.jsx';
import ProfileSection from './components/ProfileSection.jsx';
import SignUpSection from './components/SignUpSection.jsx';
import { Ghost, Moon, Sun, ChevronDown, Flame, Compass, Heart, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveUrl, API_BASE } from './config.js';
import { supabase } from './supabase.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [theme, setTheme] = useState('light'); // 'light' (Warm-Cream) or 'dark' (Abyss-Black)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lostvilla_user');
      return saved ? JSON.parse(saved) : {
        username: 'SpookyAdventurer',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        bio: 'Lost in the haunted woods. Looking for creatures.'
      };
    } catch (e) {
      return {
        username: 'SpookyAdventurer',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        bio: 'Lost in the haunted woods. Looking for creatures.'
      };
    }
  });
  const [session, setSession] = useState(null);
  const [viewedUser, setViewedUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeChatTarget, setActiveChatTarget] = useState(null);

  // Sync state changes to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('lostvilla_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  const handleTabChange = (tab) => {
    if (tab === 'profile') {
      setViewedUser(null); // Reset when navigating to own profile
    }
    setActiveTab(tab);
  };

  const handleMessageUser = (targetUsername) => {
    setActiveChatTarget(targetUsername);
    setActiveTab('chat');
  };

  const handleUserClick = (username, avatarUrl) => {
    setViewedUser({ username, avatarUrl });
    setActiveTab('profile');
  };

  const handleToggleMenu = () => {
    if (!isMenuOpen) {
      try {
        const saved = localStorage.getItem('lostvilla_history');
        setHistory(saved ? JSON.parse(saved) : []);
      } catch (e) {
        setHistory([]);
      }
    }
    setIsMenuOpen(!isMenuOpen);
  };

  const handleUserSync = async (googleUser, shouldRedirect = false) => {
    const baseName = googleUser.user_metadata.full_name || googleUser.email.split('@')[0];
    const cleanedName = baseName.replace(/[^a-zA-Z0-9]/g, '');
    
    try {
      const res = await fetch(`${API_BASE}/api/users/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: cleanedName,
          email: googleUser.email,
          avatarUrl: googleUser.user_metadata.avatar_url,
          bio: 'Just entered the Lost Villa gates.',
          pronouns: 'they/them'
        })
      });
      
      if (res.ok) {
        const userData = await res.json();
        setCurrentUser(userData);
        if (shouldRedirect) {
          setActiveTab('profile');
        }
      }
    } catch (err) {
      console.error('Error syncing user with backend:', err);
    }
  };

  // Sync Supabase Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        handleUserSync(session.user, false); // Don't redirect on initial load
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        // Only redirect to profile if they just signed in
        const shouldRedirect = event === 'SIGNED_IN';
        handleUserSync(newSession.user, shouldRedirect);
      } else {
        setCurrentUser({
          username: 'SpookyAdventurer',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          bio: 'Lost in the haunted woods. Looking for creatures.'
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync user profile state from API on load (only if not logged in via Google)
  useEffect(() => {
    if (!session) {
      fetch(`${API_BASE}/api/users/${currentUser.username}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to load user');
        })
        .then(data => {
          setCurrentUser(data);
        })
        .catch(err => console.log('Using default mock user:', err));
    }
  }, [session]);

  // Update theme on HTML tag when changed
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Navigational mapping of tabs to their respective content components
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeSection currentUser={currentUser} theme={theme} onUserClick={handleUserClick} />;
      case 'search':
        return <SearchSection />;
      case 'post':
        return (
          <PostSection
            currentUser={currentUser}
            onPostCreated={() => handleTabChange('home')}
            session={session}
          />
        );
      case 'chat':
        return (
          <ChatSection 
            currentUser={currentUser} 
            session={session} 
            activeChatTarget={activeChatTarget}
            onChatLoaded={() => setActiveChatTarget(null)}
          />
        );
      case 'profile':
        return (
          <ProfileSection
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            session={session}
            viewedUser={viewedUser}
            onBackToOwnProfile={() => setViewedUser(null)}
            onMessageUser={handleMessageUser}
          />
        );
      case 'signup':
        return <SignUpSection />;
      default:
        return <HomeSection currentUser={currentUser} theme={theme} onUserClick={handleUserClick} />;
    }
  };

  return (
    <div className="min-h-screen pb-20 flex flex-col bg-surface-soft dark:bg-canvas-dark transition-colors duration-300">

      {/* Universal Sticky Top Nav */}
      <header className="sticky top-0 z-50 bg-canvas dark:bg-surface-card-dark border-b border-hairline dark:border-hairline-dark transition-all duration-300 relative">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('home'); setIsMenuOpen(false); }}>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                <Ghost size={18} className="animate-pulse" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-ink dark:text-white">
                Lost Villa
              </span>
            </div>

            {/* Mobile Dropdown Trigger */}
            <button
              onClick={handleToggleMenu}
              className="lg:hidden p-1.5 rounded-full hover:bg-surface-soft dark:hover:bg-secondary-bg-dark text-ink dark:text-white transition-all active:scale-95 flex items-center justify-center ml-1"
              aria-label="Toggle Scribe Sidebar Menu"
            >
              <ChevronDown
                size={18}
                className={`text-mute hover:text-primary transition-transform duration-300 ${isMenuOpen ? 'rotate-180 text-primary' : ''
                  }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Switcher Toggle (Eerie Lantern Icon) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-surface-card dark:hover:bg-secondary-bg-dark text-ink dark:text-white transition-all active:scale-95"
              title={theme === 'light' ? "Extinguish the Lantern" : "Light the Lantern"}
            >
              {theme === 'light' ? (
                <Moon size={20} className="text-mute hover:text-ink" />
              ) : (
                <Sun size={20} className="text-primary hover:text-white" />
              )}
            </button>

            {/* Google Login / Quick Profile Avatar Shortcut */}
            {!session ? (
              <button
                onClick={() => { handleTabChange('signup'); setIsMenuOpen(false); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-pressed text-white shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <LogIn size={13} />
                <span>Sign In</span>
              </button>
            ) : (
              <button
                onClick={() => { handleTabChange('profile'); setIsMenuOpen(false); }}
                className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${activeTab === 'profile' ? 'border-primary scale-105' : 'border-transparent'
                  }`}
              >
                <img
                  src={resolveUrl(currentUser?.avatarUrl || '')}
                  alt={currentUser.username}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                  }}
                />
              </button>
            )}
          </div>
        </div>

        {/* Floating Dropdown Menu Card for Mobile */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-4 right-4 top-full mt-2 bg-canvas/95 dark:bg-surface-card-dark/95 backdrop-blur-md border border-hairline dark:border-hairline-dark rounded-md p-4 shadow-ambient dark:shadow-ambient-dark flex flex-col gap-6 text-left z-50 lg:hidden overflow-y-auto max-h-[75vh] custom-scrollbar"
            >
              {/* Widget: What's Trending */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-mute dark:text-mute-dark flex items-center gap-1.5">
                  <Flame size={12} className="text-primary" /> What's Trending
                </h4>
                <div className="flex flex-col gap-2">
                  {[
                    { tag: '#wendigo', count: '1.2k sightings' },
                    { tag: '#shadows', count: '840 whispers' },
                    { tag: '#route9', count: '412 anomalies' },
                    { tag: '#attic', count: '211 reports' }
                  ].map((trend, idx) => (
                    <div key={idx} className="flex flex-col text-left group cursor-pointer">
                      <span className="text-xs font-bold text-ink dark:text-white group-hover:text-primary transition-colors">
                        {trend.tag}
                      </span>
                      <span className="text-[10px] text-mute dark:text-mute-dark">
                        {trend.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget: Last Visited History */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-mute dark:text-mute-dark flex items-center gap-1.5">
                  <Compass size={12} className="text-primary" /> Last Visited
                </h4>
                {history.length === 0 ? (
                  <span className="text-[10px] text-mute dark:text-mute-dark italic">
                    Your reading history is clear.
                  </span>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {history.map((hist) => (
                      <div
                        key={hist.id}
                        onClick={() => {
                          setIsMenuOpen(false);
                          setActiveTab('home');
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('open-sighting', { detail: hist }));
                          }, 100);
                        }}
                        className="flex flex-col text-left cursor-pointer group border-b border-hairline/20 dark:border-hairline-dark/20 pb-1.5 last:border-0 last:pb-0"
                      >
                        <span className="text-[11px] font-bold text-ink dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                          {hist.title}
                        </span>
                        <span className="text-[9px] text-mute dark:text-mute-dark uppercase tracking-wider mt-0.5">
                          {hist.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Widget: Lost Villa Codex (Rules & Policies) */}
              <div className="flex flex-col gap-2 text-xs">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-mute dark:text-mute-dark mb-1 flex items-center gap-1.5">
                  <Ghost size={12} className="text-primary" /> Lost Villa Codex
                </h4>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setActiveTab('home');
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('open-codex', { detail: 'rules' }));
                    }, 100);
                  }}
                  className="text-left font-bold text-mute hover:text-primary dark:text-mute-dark dark:hover:text-primary py-1 border-b border-hairline/20 dark:border-hairline-dark/20 transition-colors"
                >
                  Rules of the Scribe
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setActiveTab('home');
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('open-codex', { detail: 'privacy' }));
                    }, 100);
                  }}
                  className="text-left font-bold text-mute hover:text-primary dark:text-mute-dark dark:hover:text-primary py-1 border-b border-hairline/20 dark:border-hairline-dark/20 transition-colors"
                >
                  Privacy & Policies
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setActiveTab('home');
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('open-codex', { detail: 'agreement' }));
                    }, 100);
                  }}
                  className="text-left font-bold text-mute hover:text-primary dark:text-mute-dark dark:hover:text-primary py-1 transition-colors"
                >
                  User Sighting Agreement
                </button>
              </div>

              {/* Widget: Developer Tribute */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-md p-4 border border-primary/20 flex flex-col gap-2">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-primary">
                  Developer Tribute
                </h4>
                <p className="text-[10px] text-ink dark:text-white leading-relaxed">
                  Support Scribe Developer efforts to protect the Villa gates and keep dark entities locked in the Vault.
                </p>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setActiveTab('home');
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('open-codex', { detail: 'donate' }));
                    }, 100);
                  }}
                  className="bg-primary hover:bg-primary-pressed text-white text-[10px] font-bold py-2 rounded-md transition-colors uppercase tracking-wider text-center mt-1"
                >
                  Donate Developer
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Dynamic App Shell Content */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-8 py-6">
        {renderContent()}
      </main>

      {/* Instagram-style Fixed Bottom Tab Nav bar */}
      <BottomNavbar activeTab={activeTab} setActiveTab={handleTabChange} />
    </div>
  );
}
