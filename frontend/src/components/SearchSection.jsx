import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Flame, Heart, Compass, AlertCircle } from 'lucide-react';
import { resolveUrl, API_BASE } from '../config.js';

export default function SearchSection() {
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState('All');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Search Filter Chips
  const filterChips = [
    'All',
    'Cryptids',
    'Ghost Stories',
    'Urban Legends',
    'Demons',
    'Hauntings',
    'Forest',
    'Witchcraft'
  ];

  // Fetch results based on query and active filter chip
  const fetchSearchResults = () => {
    setLoading(true);
    let url = `${API_BASE}/api/posts?`;

    if (query.trim()) {
      url += `q=${encodeURIComponent(query.trim())}&`;
    }

    if (activeChip !== 'All') {
      // Map standard chips to tags
      const tagMap = {
        'Cryptids': 'cryptid',
        'Ghost Stories': 'story',
        'Urban Legends': 'legend',
        'Demons': 'demon',
        'Hauntings': 'haunted',
        'Forest': 'forest',
        'Witchcraft': 'witch'
      };
      const searchTag = tagMap[activeChip] || activeChip.toLowerCase();
      url += `tag=${encodeURIComponent(searchTag)}`;
    }

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Search failed');
        return res.json();
      })
      .then(data => {
        setResults(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed search fetch:', err);
        setResults([]);
        setLoading(false);
      });
  };

  // Perform search on query change or filter chip toggle
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchSearchResults();
    }, 200); // Small debounce to avoid redundant API spamming

    return () => clearTimeout(delayDebounce);
  }, [query, activeChip]);

  // Handle Likes inside search
  const handleLike = (postId, e) => {
    e.stopPropagation();
    fetch(`${API_BASE}/api/posts/${postId}/like`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setResults(prev => prev.map(p => p.id === postId ? { ...p, likes: data.likes } : p));
        }
      })
      .catch(err => console.log(err));
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Real-time Search Input Field */}
      <div className="relative w-full max-w-[640px] mx-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Exhume tags, creatures, stories, users..."
          className="w-full bg-surface-card dark:bg-surface-card-dark text-ink dark:text-white placeholder-ash pl-12 pr-6 py-3.5 rounded-full text-base border-none double-focus transition-all duration-300 shadow-none"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-mute dark:text-mute-dark" size={18} />
      </div>

      {/* Dynamic filter chip horizontal strip (Instagram / Pinterest style) */}
      <div className="w-full overflow-x-auto pb-2 flex gap-2 scrollbar-none snap-x">
        {filterChips.map((chip) => {
          const isActive = activeChip === chip;
          return (
            <button
              key={chip}
              onClick={() => setActiveChip(chip)}
              className={`snap-center shrink-0 text-sm font-bold px-5 py-2 rounded-full transition-all duration-300 border-none active:scale-95 ${isActive
                ? 'bg-ink text-white dark:bg-white dark:text-black shadow-md'
                : 'bg-surface-card hover:bg-secondary-bg dark:bg-surface-card-dark dark:hover:bg-secondary-bg-dark text-ink dark:text-white'
                }`}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Grid count stats label */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-mute dark:text-mute-dark">
          {loading ? 'Searching ancient files...' : `${results.length} spooky files excavated`}
        </span>
      </div>

      {/* Results Masonry Container */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Compass className="animate-spin text-primary" size={32} />
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-canvas dark:bg-surface-card-dark rounded-md p-8 border border-hairline dark:border-hairline-dark">
          <AlertCircle className="text-primary mb-2" size={32} />
          <h4 className="font-display font-bold text-lg text-ink dark:text-white">Nothing matches your search</h4>
          <p className="text-sm text-mute dark:text-mute-dark mt-1 max-w-[320px]">
            The shadows remain empty. Try searching for "cryptid", "forest", or "story".
          </p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 w-full space-y-4">
          {results.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSelectedPost(post)}
              className="break-inside-avoid group relative bg-surface-card dark:bg-surface-card-dark rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all duration-300 transform active:scale-98 mb-4 shadow-none"
            >
              {/* Media element */}
              {post.mediaUrl ? (
                post.mediaType === 'video' ? (
                  <video
                    src={resolveUrl(post.mediaUrl || '')}
                    className="w-full h-auto object-cover max-h-[360px]"
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={resolveUrl(post.mediaUrl || '')}
                    alt={post.title}
                    className="w-full h-auto object-cover max-h-[400px] transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500';
                    }}
                  />
                )
              ) : (
                <div className="w-full aspect-[3/4] bg-surface-dark flex flex-col justify-between p-6 text-white border border-stone/10">
                  <Flame className="text-primary" size={24} />
                  <p className="font-display font-bold text-lg leading-tight tracking-tight mt-auto">
                    {post.title}
                  </p>
                </div>
              )}

              {/* Hover Metadata block */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 text-white">

                {/* tags */}
                <div className="flex flex-wrap gap-1 items-start self-start">
                  {(post.tags || '').split(',').map((t, idx) => (
                    <span key={idx} className="bg-canvas/20 backdrop-blur-md text-white text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full">
                      {t.trim()}
                    </span>
                  ))}
                </div>

                {/* title & author info */}
                <div className="flex flex-col gap-1 mt-auto">
                  <p className="font-display font-bold text-xs leading-snug line-clamp-2">
                    {post.title}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-stone/90 truncate max-w-[120px]">
                      By {post.authorName}
                    </span>
                    <button
                      onClick={(e) => handleLike(post.id, e)}
                      className="flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full hover:bg-primary-pressed transition-all active:scale-90"
                    >
                      <Heart size={8} fill="white" />
                      {post.likes}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detailed overlay Modal identical to HomeSection */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-black backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 bg-canvas dark:bg-surface-card-dark w-full max-w-[720px] max-h-[85vh] rounded-lg overflow-y-auto shadow-ambient dark:shadow-ambient-dark flex flex-col"
            >
              {selectedPost.mediaUrl && (
                <div className="w-full aspect-video relative bg-surface-card">
                  {selectedPost.mediaType === 'video' ? (
                    <video
                      src={resolveUrl(selectedPost.mediaUrl || '')}
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                    />
                  ) : (
                    <img
                      src={resolveUrl(selectedPost.mediaUrl || '')}
                      alt={selectedPost.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=720';
                      }}
                    />
                  )}
                </div>
              )}
              <div className="p-8 flex flex-col gap-4">
                <div className="flex gap-1">
                  {(selectedPost.tags || '').split(',').map((t, idx) => (
                    <span key={idx} className="bg-surface-card dark:bg-secondary-bg-dark text-primary dark:text-white text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-1 rounded-full border border-hairline dark:border-hairline-dark">
                      {t.trim()}
                    </span>
                  ))}
                </div>
                <h2 className="heading-xl text-ink dark:text-white font-extrabold mt-1">
                  {selectedPost.title}
                </h2>
                <div className="flex justify-between items-center py-2 border-y border-hairline dark:border-hairline-dark my-1">
                  <div className="flex items-center gap-2">
                    <img
                      src={resolveUrl(selectedPost.authorAvatar || '')}
                      alt={selectedPost.authorName}
                      className="w-8 h-8 rounded-full object-cover border border-hairline dark:border-hairline-dark"
                    />
                    <span className="text-sm font-bold text-ink dark:text-white">
                      {selectedPost.authorName}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleLike(selectedPost.id, e)}
                    className="flex items-center gap-2 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-md"
                  >
                    <Heart size={12} fill="white" />
                    <span>{selectedPost.likes} Marks</span>
                  </button>
                </div>
                <div className="text-body dark:text-body-dark text-base leading-relaxed whitespace-pre-line">
                  {selectedPost.content}
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="bg-secondary-bg dark:bg-secondary-bg-dark text-ink dark:text-white text-xs font-bold px-4 py-2 rounded-md"
                  >
                    Return to Safe Ground
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
