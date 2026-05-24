import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Search, Eye, Flame, Compass, Ghost } from 'lucide-react';

export default function HomeSection({ currentUser, theme }) {
  const [activeSubTab, setActiveSubTab] = useState('feed'); // 'feed' or 'foryou'
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null); // For detailed reading overlay modal!

  // Dynamic Left Sidebar states
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('lostvilla_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeCodex, setActiveCodex] = useState(null); // 'rules' | 'privacy' | 'agreement' | 'donate' | null
  const [showSubNav, setShowSubNav] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY || window.pageYOffset;

    const handleScroll = () => {
      const currentScrollY = window.scrollY || window.pageYOffset;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowSubNav(false);
      } else {
        setShowSubNav(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cross-component custom event listeners to bridge mobile navbar dropdown selections
  useEffect(() => {
    const handleOpenSighting = (e) => {
      if (e.detail) {
        handleSelectPost(e.detail);
      }
    };
    const handleOpenCodex = (e) => {
      if (e.detail) {
        setActiveCodex(e.detail);
      }
    };

    window.addEventListener('open-sighting', handleOpenSighting);
    window.addEventListener('open-codex', handleOpenCodex);

    return () => {
      window.removeEventListener('open-sighting', handleOpenSighting);
      window.removeEventListener('open-codex', handleOpenCodex);
    };
  }, []);

  // Wrap post selection to log dynamic browsing history
  const handleSelectPost = (post) => {
    setSelectedPost(post);
    if (!post) return;

    setHistory(prev => {
      const filtered = prev.filter(item => item.id !== post.id);
      const updated = [
        { id: post.id, title: post.title, type: post.type || 'story', content: post.content, mediaUrl: post.mediaUrl, mediaType: post.mediaType, tags: post.tags, likes: post.likes, authorName: post.authorName, authorAvatar: post.authorAvatar, isEditorial: post.isEditorial, isAi: post.isAi, createdAt: post.createdAt },
        ...filtered
      ].slice(0, 5); // Keep last 5
      try {
        localStorage.setItem('lostvilla_history', JSON.stringify(updated));
      } catch (err) {
        console.error('History save error:', err);
      }
      return updated;
    });
  };



  // Fetch posts from express server
  const fetchPosts = () => {
    setLoading(true);
    const isEditorialQuery = activeSubTab === 'foryou' ? 'true' : 'false';
    fetch(`/api/posts?isEditorial=${isEditorialQuery}`)
      .then(res => {
        if (!res.ok) throw new Error('API failed');
        return res.json();
      })
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching horror posts:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPosts();
  }, [activeSubTab]);

  // Handle post like count updates
  const handleLike = (postId, e) => {
    e.stopPropagation(); // Avoid triggering full details card click
    fetch(`/api/posts/${postId}/like`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: data.likes } : p));
        }
      })
      .catch(err => console.log('Failed to register like:', err));
  };

  // Render posts stacked in a single vertical column feed (Instagram/Reddit hybrid style)
  const renderMasonry = () => {
    return (
      <div className="flex flex-col gap-6 max-w-[620px] mx-auto w-full">
        {posts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-canvas dark:bg-surface-card-dark rounded-md border border-hairline dark:border-hairline-dark overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md"
          >
            {/* 1. Header: Author Scribe Info & Type Badges */}
            <div className="flex items-center justify-between p-4 border-b border-hairline/40 dark:border-hairline-dark/40">
              <div className="flex items-center gap-2.5">
                <img
                  src={(post.authorAvatar || '').startsWith('http') ? post.authorAvatar : `http://localhost:5050${post.authorAvatar}`}
                  alt={post.authorName}
                  className="w-8 h-8 rounded-full object-cover border border-hairline dark:border-hairline-dark"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                  }}
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-ink dark:text-white">
                      {post.authorName}
                    </span>
                    {post.type && (
                      <span className="bg-primary/10 text-primary text-[9px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full select-none">
                        {post.type}
                      </span>
                    )}
                    {post.isAi && (
                      <span className="bg-amber-600/10 text-amber-600 dark:text-amber-500 text-[9px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full select-none">
                        AI
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-mute dark:text-mute-dark">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Media Area / Main Card Content Block */}
            <div 
              onClick={() => handleSelectPost(post)}
              className="cursor-pointer overflow-hidden bg-surface-soft dark:bg-canvas-dark flex items-center justify-center relative select-none"
            >
              {post.mediaUrl ? (
                post.mediaType === 'video' ? (
                  <video
                    src={(post.mediaUrl || '').startsWith('http') ? post.mediaUrl : `http://localhost:5050${post.mediaUrl}`}
                    className="w-full h-auto object-contain max-h-[480px]"
                    muted
                    loop
                    playsInline
                    onClick={(e) => {
                      e.stopPropagation();
                      const video = e.target;
                      if (video.paused) video.play();
                      else video.pause();
                    }}
                  />
                ) : (
                  <img
                    src={(post.mediaUrl || '').startsWith('http') ? post.mediaUrl : `http://localhost:5050${post.mediaUrl}`}
                    alt={post.title}
                    className="w-full h-auto object-contain max-h-[500px]"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500';
                    }}
                  />
                )
              ) : (
                <div className="w-full py-16 px-8 bg-surface-dark flex flex-col justify-between text-white border-y border-stone/10">
                  <Flame className="text-primary mb-4" size={24} />
                  <p className="font-display font-bold text-lg leading-tight tracking-tight">
                    {post.title}
                  </p>
                </div>
              )}
            </div>

            {/* 3. Interactions & Description Chronicle */}
            <div className="p-4 flex flex-col gap-3">
              {/* Action row (Likes & Comments/Read) */}
              <div className="flex items-center justify-between pb-2 border-b border-hairline/20 dark:border-hairline-dark/20">
                <button
                  onClick={(e) => handleLike(post.id, e)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-bg hover:bg-secondary-pressed dark:bg-secondary-bg-dark dark:hover:bg-secondary-pressed-dark text-ink dark:text-white text-xs font-bold transition-all transform active:scale-95 border border-stone/5"
                >
                  <Heart size={14} className={post.likes > 0 ? "text-primary fill-primary" : "text-ink dark:text-white"} />
                  <span>{post.likes} research marks</span>
                </button>

                <button
                  onClick={() => handleSelectPost(post)}
                  className="text-xs font-bold text-primary hover:text-primary-pressed transition-colors py-1 px-3"
                >
                  Exhume Secrets →
                </button>
              </div>

              {/* Title & Chronicle Snippet */}
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-extrabold text-ink dark:text-white leading-tight">
                  {post.title}
                </h4>
                <p className="text-xs text-body dark:text-body-dark leading-relaxed line-clamp-3">
                  {post.content}
                </p>
                {post.content && post.content.length > 150 && (
                  <button 
                    onClick={() => handleSelectPost(post)}
                    className="text-[11px] font-bold text-mute dark:text-mute-dark hover:text-primary dark:hover:text-primary self-start mt-0.5"
                  >
                    Read full chronicle...
                  </button>
                )}
              </div>

              {/* Tags block */}
              <div className="flex flex-wrap gap-1 mt-1">
                {(post.tags || '').split(',').map((t, idx) => (
                  <span key={idx} className="bg-secondary-bg/60 dark:bg-secondary-bg-dark/60 text-mute dark:text-mute-dark text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md border border-stone/5">
                    #{t.trim()}
                  </span>
                ))}
              </div>
            </div>

          </motion.div>
        ))}
      </div>
    );
  };

  // Render "For You" Editorial Feature row Cards (alternate text left, image right)
  const renderEditorialRows = () => {
    return (
      <div className="flex flex-col gap-12">
        {posts.map((post, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 bg-canvas dark:bg-surface-card-dark rounded-md p-6 border border-hairline dark:border-hairline-dark`}
            >
              {/* Asymmetric Illustration Column */}
              <div className="w-full lg:w-1/2 rounded-md overflow-hidden aspect-[4/5] bg-surface-card">
                <img
                  src={(post.mediaUrl || '').startsWith('http') ? post.mediaUrl : `http://localhost:5050${post.mediaUrl}`}
                  alt={post.title}
                  className="w-full h-full object-cover transform hover:scale-102 transition-transform duration-700"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600';
                  }}
                />
              </div>

              {/* Text Editorial Column */}
              <div className="w-full lg:w-1/2 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-primary/10 text-primary text-xs uppercase font-extrabold tracking-widest px-3 py-1 rounded-full">
                    {(post.tags || '').split(',')[0]}
                  </span>
                  <span className="text-xs text-mute dark:text-mute-dark flex items-center gap-1">
                    <Eye size={12} /> Curator Analysis
                  </span>
                </div>

                <h3 className="heading-xl text-ink dark:text-white font-bold mb-4">
                  {post.title}
                </h3>

                <p className="text-body dark:text-body-dark text-base leading-relaxed mb-6 line-clamp-5">
                  {post.content}
                </p>

                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={() => handleSelectPost(post)}
                    className="bg-primary text-white text-sm font-bold px-6 py-3 rounded-md hover:bg-primary-pressed transition-all transform active:scale-95"
                  >
                    Exhume Secrets
                  </button>

                  <button
                    onClick={(e) => handleLike(post.id, e)}
                    className="flex items-center gap-2 text-mute hover:text-primary dark:text-mute-dark dark:hover:text-primary transition-colors py-2 px-3 rounded-full hover:bg-surface-soft dark:hover:bg-surface-card-dark"
                  >
                    <Heart size={18} className={post.likes > 0 ? 'text-primary fill-primary' : ''} />
                    <span className="font-bold text-sm">{post.likes} research marks</span>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[240px_1fr_240px] gap-8 w-full items-start relative">
      
      {/* Left Sidebar Widget Column */}
      <div className="hidden lg:flex w-full lg:w-[240px] shrink-0 flex-col gap-6 sticky top-16 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto pr-2 pb-20 custom-scrollbar select-none text-left lg:-ml-6 xl:-ml-16">
        
        {/* Widget: What's Trending */}
        <div className="bg-canvas dark:bg-surface-card-dark rounded-md p-4 border border-hairline dark:border-hairline-dark flex flex-col gap-3">
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
        <div className="bg-canvas dark:bg-surface-card-dark rounded-md p-4 border border-hairline dark:border-hairline-dark flex flex-col gap-3">
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
                  onClick={() => handleSelectPost(hist)}
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
        <div className="bg-canvas dark:bg-surface-card-dark rounded-md p-4 border border-hairline dark:border-hairline-dark flex flex-col gap-2 text-xs">
          <h4 className="text-xs uppercase font-extrabold tracking-wider text-mute dark:text-mute-dark mb-1 flex items-center gap-1.5">
            <Ghost size={12} className="text-primary" /> Lost Villa Codex
          </h4>
          <button 
            onClick={() => setActiveCodex('rules')}
            className="text-left font-bold text-mute hover:text-primary dark:text-mute-dark dark:hover:text-primary py-1 border-b border-hairline/20 dark:border-hairline-dark/20 transition-colors"
          >
            Rules of the Scribe
          </button>
          <button 
            onClick={() => setActiveCodex('privacy')}
            className="text-left font-bold text-mute hover:text-primary dark:text-mute-dark dark:hover:text-primary py-1 border-b border-hairline/20 dark:border-hairline-dark/20 transition-colors"
          >
            Privacy & Policies
          </button>
          <button 
            onClick={() => setActiveCodex('agreement')}
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
            onClick={() => setActiveCodex('donate')}
            className="bg-primary hover:bg-primary-pressed text-white text-[10px] font-bold py-2 rounded-md transition-colors uppercase tracking-wider text-center mt-1"
          >
            Donate Developer
          </button>
        </div>

      </div>

      {/* Main Feed Content Column */}
      <div className="w-full flex justify-center flex-1">
        <div className="w-full max-w-[620px] flex flex-col gap-6">

        {/* Sub-Tab Navigation Bar */}
        <motion.div 
          animate={{ y: showSubNav ? 0 : -80, opacity: showSubNav ? 1 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="sticky top-[68px] z-40 bg-surface-soft/95 dark:bg-canvas-dark/95 backdrop-blur-md pt-3 flex justify-center border-b border-hairline dark:border-hairline-dark w-full"
        >
          <div className="flex gap-8 relative pb-0">
            {[
              { id: 'feed', label: 'feed' },
              { id: 'foryou', label: 'for you' }
            ].map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className="relative pb-3 flex flex-col items-center group active:scale-95 transition-transform"
                >
                  <span className={`font-display font-bold text-lg tracking-tight transition-colors ${isActive ? 'text-primary' : 'text-mute hover:text-ink dark:text-mute-dark dark:hover:text-white'
                    }`}>
                    {tab.label}
                  </span>
                  <span className="text-[10px] tracking-wider text-ash mt-0.5 uppercase font-medium">
                    {tab.desc}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeSubTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Primary Content Container */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-mute dark:text-mute-dark">
            <Ghost size={48} className="animate-bounce text-primary" />
            <p className="font-display font-medium tracking-wide">Reading ancient files from tomb...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Ghost size={40} className="text-stone dark:text-stone-dark mb-3" />
            <h4 className="font-display font-bold text-lg text-ink dark:text-white">No anomalies reported yet</h4>
            <p className="text-sm text-mute dark:text-mute-dark mt-1">Be the first to upload a spooky tale in the Post screen!</p>
          </div>
        ) : activeSubTab === 'feed' ? (
          renderMasonry()
        ) : (
          renderEditorialRows()
        )}

        </div>
      </div>

      {/* 3. Right Empty Spacer column (to balance center feed) */}
      <div className="hidden xl:block w-[240px] shrink-0 xl:-mr-16" />

      {/* Beautiful Modular Detail Scrim overlay Modal for focused Reading */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

            {/* Modal Ambient Scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => handleSelectPost(null)}
              className="absolute inset-0 bg-black backdrop-blur-sm"
            />

            {/* Modal Body Card (with 32px lg radius and 16px ambient shadow) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 bg-canvas dark:bg-surface-card-dark w-full max-w-[720px] max-h-[85vh] rounded-lg overflow-y-auto shadow-ambient dark:shadow-ambient-dark flex flex-col"
            >

              {/* Top Banner (Optional Video or Image) */}
              {selectedPost.mediaUrl && (
                <div className="w-full aspect-video relative bg-surface-card">
                  {selectedPost.mediaType === 'video' ? (
                    <video
                      src={(selectedPost.mediaUrl || '').startsWith('http') ? selectedPost.mediaUrl : `http://localhost:5050${selectedPost.mediaUrl}`}
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                    />
                  ) : (
                    <img
                      src={(selectedPost.mediaUrl || '').startsWith('http') ? selectedPost.mediaUrl : `http://localhost:5050${selectedPost.mediaUrl}`}
                      alt={selectedPost.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=720';
                      }}
                    />
                  )}
                </div>
              )}

              {/* Internal Content (32px / xxl padding) */}
              <div className="p-8 flex flex-col gap-4">

                {/* Category Tags */}
                <div className="flex gap-1.5 flex-wrap">
                  {selectedPost.type && (
                    <span className="bg-primary text-white text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-1 rounded-full border border-primary/20 select-none">
                      {selectedPost.type}
                    </span>
                  )}
                  {selectedPost.isAi && (
                    <span className="bg-amber-600 text-white text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-1 rounded-full border border-amber-500/20 select-none">
                      AI Generated
                    </span>
                  )}
                  {(selectedPost.tags || '').split(',').map((t, idx) => (
                    <span key={idx} className="bg-surface-card dark:bg-secondary-bg-dark text-primary dark:text-white text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-1 rounded-full border border-hairline dark:border-hairline-dark select-none">
                      {t.trim()}
                    </span>
                  ))}
                </div>

                <h2 className="heading-xl text-ink dark:text-white font-extrabold tracking-tight mt-1 leading-tight text-left">
                  {selectedPost.title}
                </h2>

                {/* Author Block */}
                <div className="flex justify-between items-center py-2.5 border-y border-hairline dark:border-hairline-dark my-1">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={(selectedPost.authorAvatar || '').startsWith('http') ? selectedPost.authorAvatar : `http://localhost:5050${selectedPost.authorAvatar}`}
                      alt={selectedPost.authorName}
                      className="w-9 h-9 rounded-full object-cover border border-hairline dark:border-hairline-dark"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                      }}
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-ink dark:text-white">
                        {selectedPost.authorName}
                      </span>
                      <span className="text-xs text-mute dark:text-mute-dark">
                        Logged sighting • {new Date(selectedPost.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleLike(selectedPost.id, e)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-pressed text-white text-xs font-bold px-4 py-2 rounded-md transition-all active:scale-95 shadow-none"
                  >
                    <Heart size={14} fill="white" />
                    <span>{selectedPost.likes} Marks</span>
                  </button>
                </div>

                {/* Description Body Text */}
                <div className="text-body dark:text-body-dark text-base leading-relaxed whitespace-pre-line mt-2 text-left">
                  {selectedPost.content}
                </div>

                {/* Close Button */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-hairline dark:border-hairline-dark">
                  <button
                    onClick={() => handleSelectPost(null)}
                    className="bg-secondary-bg hover:bg-secondary-pressed dark:bg-secondary-bg-dark dark:hover:bg-secondary-pressed-dark text-ink dark:text-white text-xs font-bold px-5 py-2.5 rounded-md transition-all active:scale-95"
                  >
                    Return to Safe Ground
                  </button>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Codex Modal Dialogs Sheet */}
      <AnimatePresence>
        {activeCodex && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCodex(null)}
              className="absolute inset-0 bg-black backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 bg-canvas dark:bg-surface-card-dark w-full max-w-[480px] rounded-lg p-6 shadow-ambient dark:shadow-ambient-dark flex flex-col text-left gap-4"
            >
              {activeCodex === 'rules' && (
                <>
                  <h3 className="heading-lg font-bold text-ink dark:text-white border-b border-hairline dark:border-hairline-dark pb-2 uppercase tracking-wide">
                    📜 Rules of the Scribe
                  </h3>
                  <div className="text-xs text-body dark:text-body-dark leading-relaxed flex flex-col gap-2.5">
                    <p><strong>1. Guard Your Soul:</strong> Never explore haunted sectors mentioned in reports alone.</p>
                    <p><strong>2. Truthful Chronicle:</strong> Real incidents must be cataloged honestly. Fictional accounts must use correct tags.</p>
                    <p><strong>3. Civil Scribes:</strong> Keep direct chat respectful. We face dark spirits, let's not face each other.</p>
                  </div>
                </>
              )}

              {activeCodex === 'privacy' && (
                <>
                  <h3 className="heading-lg font-bold text-ink dark:text-white border-b border-hairline dark:border-hairline-dark pb-2 uppercase tracking-wide">
                    🔒 Privacy & Policies
                  </h3>
                  <div className="text-xs text-body dark:text-body-dark leading-relaxed flex flex-col gap-2.5">
                    <p><strong>Villa Telemetry:</strong> All user posts and message streams are stored locally in the secure SQLite chamber. No external dark magic or advertising trackers crawl your chronicles.</p>
                    <p><strong>Amulet Protections:</strong> Cryptographic protocols secure database credentials, protecting personal sightings from spectral extraction.</p>
                  </div>
                </>
              )}

              {activeCodex === 'agreement' && (
                <>
                  <h3 className="heading-lg font-bold text-ink dark:text-white border-b border-hairline dark:border-hairline-dark pb-2 uppercase tracking-wide">
                    ⚖️ Sighting Agreement
                  </h3>
                  <div className="text-xs text-body dark:text-body-dark leading-relaxed flex flex-col gap-2.5">
                    <p>By submitting sighting evidence, you grant Lost Villa a non-exclusive license to catalog and preserve your sightings in the secure public indices.</p>
                    <p className="text-red-500 font-semibold uppercase tracking-wider mt-1">Disclaimer:</p>
                    <p className="italic text-mute">Lost Villa hosts hold zero liability for shadow hauntings, mimic incursions, sleep paralysis, or residual entity manifestation resulting from reading or reporting anomalies.</p>
                  </div>
                </>
              )}

              {activeCodex === 'donate' && (
                <>
                  <h3 className="heading-lg font-bold text-ink dark:text-white border-b border-hairline dark:border-hairline-dark pb-2 uppercase tracking-wide text-primary">
                    ☕ Tribute Developer
                  </h3>
                  <div className="text-xs text-body dark:text-body-dark leading-relaxed flex flex-col gap-3">
                    <p>Building and maintaining the Lost Villa gates against creeping dark anomalies requires considerable coffee, salt circles, and development devotion.</p>
                    <div className="p-3 bg-surface-soft dark:bg-canvas-dark rounded-md border border-hairline dark:border-hairline-dark flex justify-between items-center">
                      <span className="font-bold text-ink dark:text-white">Buy a Holy Water Amulet</span>
                      <span className="font-extrabold text-primary">$4.99</span>
                    </div>
                    <button 
                      onClick={() => {
                        alert("Thank you, generous Scribe! A protection circle has been cast around your soul.");
                        setActiveCodex(null);
                      }}
                      className="bg-primary hover:bg-primary-pressed text-white font-bold py-2.5 rounded-md text-center mt-2 transition-transform active:scale-95 uppercase tracking-wider"
                    >
                      Offer Tribute ($4.99)
                    </button>
                  </div>
                </>
              )}

              <div className="flex justify-end pt-3 border-t border-hairline dark:border-hairline-dark">
                <button
                  onClick={() => setActiveCodex(null)}
                  className="bg-secondary-bg hover:bg-secondary-pressed dark:bg-secondary-bg-dark dark:hover:bg-secondary-pressed-dark text-ink dark:text-white text-xs font-bold px-4 py-2 rounded-md transition-colors"
                >
                  Return to Sighting Row
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
