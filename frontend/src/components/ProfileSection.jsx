import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, ShieldAlert, Heart, Flame, Settings, Upload, CheckCircle, Share2, FileText, BookOpen } from 'lucide-react';
import { resolveUrl, API_BASE } from '../config.js';

export default function ProfileSection({ currentUser, setCurrentUser }) {
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Redesign state additions
  const [activeSubTab, setActiveSubTab] = useState('info'); // 'info' (editorial) vs 'stories' (general)
  const [copied, setCopied] = useState(false);

  // Edit form states
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [pronouns, setPronouns] = useState(currentUser.pronouns || 'they/them');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch only posts submitted by this active user
  const fetchUserPosts = () => {
    setLoadingPosts(true);
    fetch(`/api/posts`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch posts');
        return res.json();
      })
      .then(data => {
        const postsList = Array.isArray(data) ? data : [];
        const personal = postsList.filter(p => p.authorName === currentUser.username);
        setUserPosts(personal);
        setLoadingPosts(false);
      })
      .catch(err => {
        console.error('Failed fetching user logs:', err);
        setUserPosts([]);
        setLoadingPosts(false);
      });
  };

  useEffect(() => {
    fetchUserPosts();
  }, [currentUser.username]);

  // Handle avatar file picker
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar exceeds the maximum 5MB size limit.');
      return;
    }

    setError('');
    setAvatarFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Submit profile edit payload
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username cannot be empty.');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('username', username.trim());
      formData.append('bio', bio);
      formData.append('pronouns', pronouns.trim());
      formData.append('oldUsername', currentUser.username);

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await fetch(`${API_BASE}/api/users/profile', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile.');
      }

      const updatedUser = await response.json();
      
      // Update global user context state
      setCurrentUser(updatedUser);
      setSuccess(true);
      setTimeout(() => {
        setIsEditMode(false);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Profile sync error.');
    } finally {
      setUpdating(false);
    }
  };

  const handleLike = (postId, e) => {
    e.stopPropagation();
    fetch(`/api/posts/${postId}/like`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUserPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: data.likes } : p));
        }
      })
      .catch(err => console.log(err));
  };

  // Share profile handler (saves dynamic link to clipboard)
  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/user/${currentUser.username}`;
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter personal user posts by subtab logic
  const filteredUserPosts = userPosts.filter(post => {
    if (activeSubTab === 'info') return post.isEditorial === true;
    return post.isEditorial === false;
  });

  return (
    <div className="flex flex-col gap-8 max-w-[840px] mx-auto">
      
      {/* Profile Header Details card (Premium Instagram Aesthetic) */}
      <div className="bg-canvas dark:bg-surface-card-dark rounded-md p-6 md:p-8 border border-hairline dark:border-hairline-dark flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left transition-all duration-300">
        
        {/* Profile Avatar Frame (larger size layout) */}
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-primary shrink-0 relative bg-surface-card shadow-md">
          <img 
            src={resolveUrl(currentUser?.avatarUrl || '')} 
            alt={currentUser.username} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
            }}
          />
        </div>

        {/* Text Details & Action column */}
        <div className="flex-1 flex flex-col gap-4">
          
          {/* Action cluster row (Username, Edit profile, Share profile) */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <h2 className="heading-lg font-extrabold text-ink dark:text-white leading-none flex items-center gap-2 flex-wrap justify-center md:justify-start">
              <span>{currentUser.username}</span>
              {currentUser.pronouns && (
                <span className="text-xs font-medium text-mute dark:text-mute-dark lowercase tracking-normal bg-secondary-bg/50 dark:bg-secondary-bg-dark/50 px-2 py-0.5 rounded-full border border-stone/5">
                  ({currentUser.pronouns})
                </span>
              )}
            </h2>
            
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              
              {/* Edit Profile Button */}
              <button
                onClick={() => {
                  setUsername(currentUser.username);
                  setBio(currentUser.bio);
                  setPronouns(currentUser.pronouns || '');
                  setAvatarPreview('');
                  setAvatarFile(null);
                  setError('');
                  setIsEditMode(true);
                }}
                className="bg-secondary-bg hover:bg-secondary-pressed dark:bg-secondary-bg-dark dark:hover:bg-secondary-pressed-dark text-ink dark:text-white px-4 py-2 rounded-md text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-stone/10"
              >
                <Edit2 size={12} />
                <span>Edit Profile</span>
              </button>

              {/* Share Profile Button */}
              <button
                onClick={handleShareProfile}
                className="relative bg-secondary-bg hover:bg-secondary-pressed dark:bg-secondary-bg-dark dark:hover:bg-secondary-pressed-dark text-ink dark:text-white px-4 py-2 rounded-md text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-stone/10"
              >
                <Share2 size={12} />
                <span>Share Profile</span>

                {/* Floating Transient Copied Alert Chip */}
                <AnimatePresence>
                  {copied && (
                    <motion.span 
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: -36, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.8 }}
                      className="absolute left-1/2 -translate-x-1/2 bg-green-500 text-white text-[9px] uppercase font-extrabold tracking-widest px-2.5 py-1 rounded-md shadow-md pointer-events-none"
                    >
                      Copied!
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

            </div>
          </div>

          {/* Instagram stats row */}
          <div className="flex gap-8 justify-center md:justify-start text-sm border-y border-hairline/40 dark:border-hairline-dark/40 py-2.5 md:border-none md:py-0">
            <div className="flex flex-col md:flex-row md:gap-1 items-center">
              <span className="font-extrabold text-ink dark:text-white">{userPosts.length}</span>
              <span className="text-mute dark:text-mute-dark text-xs md:text-sm">posts</span>
            </div>
            <div className="flex flex-col md:flex-row md:gap-1 items-center">
              <span className="font-extrabold text-ink dark:text-white">1.4k</span>
              <span className="text-mute dark:text-mute-dark text-xs md:text-sm">followers</span>
            </div>
            <div className="flex flex-col md:flex-row md:gap-1 items-center">
              <span className="font-extrabold text-ink dark:text-white">482</span>
              <span className="text-mute dark:text-mute-dark text-xs md:text-sm">following</span>
            </div>
          </div>

          {/* Biography statement */}
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase font-extrabold tracking-wider text-mute dark:text-mute-dark select-none">
              Biography Scribe
            </span>
            <p className="text-sm text-body dark:text-body-dark max-w-[540px] leading-relaxed whitespace-pre-line">
              {currentUser.bio}
            </p>
          </div>

        </div>

      </div>

      {/* Profile subtabs section (info vs stories) */}
      <div className="flex flex-col gap-6">
        
        {/* Instagram/Pinterest style grid headers */}
        <div className="flex justify-center border-b border-hairline dark:border-hairline-dark">
          <div className="flex gap-12 relative pb-0">
            {[
              { id: 'info', label: 'info', desc: 'Anomalies & Species Cataloged', icon: BookOpen },
              { id: 'stories', label: 'stories', desc: 'Personal Creepypasta Logs', icon: FileText }
            ].map((tab) => {
              const isActive = activeSubTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className="relative pb-3.5 flex items-center gap-2 group active:scale-95 transition-transform"
                >
                  <Icon size={14} className={isActive ? 'text-primary' : 'text-mute dark:text-mute-dark'} />
                  <span className={`font-display font-bold text-base tracking-wider uppercase transition-colors ${
                    isActive ? 'text-primary' : 'text-mute hover:text-ink dark:text-mute-dark dark:hover:text-white'
                  }`}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="profileSubtabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Personal Posts list */}
        {loadingPosts ? (
          <p className="text-sm text-mute dark:text-mute-dark py-12 text-center font-semibold">
            Excavating archives...
          </p>
        ) : filteredUserPosts.length === 0 ? (
          <div className="bg-canvas dark:bg-surface-card-dark rounded-md p-12 text-center border border-hairline dark:border-hairline-dark flex flex-col items-center justify-center">
            <ShieldAlert size={28} className="text-mute dark:text-mute-dark mb-2" />
            <h4 className="font-display font-bold text-sm text-ink dark:text-white uppercase tracking-wider">
              No files cataloged
            </h4>
            <p className="text-xs text-mute dark:text-mute-dark mt-1 max-w-[280px]">
              You haven't logged any sighting files in the {activeSubTab === 'info' ? 'Info (Vault)' : 'Stories'} category yet.
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
            {filteredUserPosts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelectedPost(post)}
                className="break-inside-avoid group relative bg-surface-card dark:bg-surface-card-dark rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all duration-300 transform active:scale-98 mb-4 shadow-none"
              >
                {post.mediaUrl ? (
                  post.mediaType === 'video' ? (
                    <video 
                      src={resolveUrl(post.mediaUrl || '')} 
                      className="w-full h-auto object-cover max-h-[300px]"
                      muted
                      loop
                    />
                  ) : (
                    <img 
                      src={resolveUrl(post.mediaUrl || '')} 
                      alt={post.title}
                      className="w-full h-auto object-cover max-h-[350px] transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500';
                      }}
                    />
                  )
                ) : (
                  <div className="w-full aspect-[3/4] bg-surface-dark flex flex-col justify-between p-6 text-white border border-stone/10">
                    <Flame className="text-primary" size={24} />
                    <p className="font-display font-bold text-base leading-tight tracking-tight mt-auto">
                      {post.title}
                    </p>
                  </div>
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 text-white">
                  <div className="flex flex-wrap gap-1 items-start self-start">
                    {post.type && (
                      <span className="bg-primary text-white text-[9px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full border border-primary/20 shadow-sm select-none">
                        {post.type}
                      </span>
                    )}
                    {post.isAi && (
                      <span className="bg-amber-600 text-white text-[9px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full border border-amber-500/20 shadow-sm select-none">
                        AI
                      </span>
                    )}
                    {(post.tags || '').split(',').map((t, idx) => (
                      <span key={idx} className="bg-canvas/20 backdrop-blur-md text-white text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full select-none">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-auto">
                    <p className="font-display font-bold text-xs leading-snug line-clamp-2 pr-2">
                      {post.title}
                    </p>
                    <button 
                      onClick={(e) => handleLike(post.id, e)}
                      className="flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full hover:bg-primary-pressed shrink-0"
                    >
                      <Heart size={8} fill="white" />
                      {post.likes}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal Scrim Sheet */}
      <AnimatePresence>
        {isEditMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditMode(false)}
              className="absolute inset-0 bg-black backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 bg-canvas dark:bg-surface-card-dark w-full max-w-[480px] rounded-lg p-6 shadow-ambient dark:shadow-ambient-dark flex flex-col"
            >
              
              <div className="flex items-center justify-between mb-4 border-b border-hairline dark:border-hairline-dark pb-3">
                <h3 className="heading-lg font-bold text-ink dark:text-white flex items-center gap-1.5">
                  <Settings size={18} /> Modify Scribe Profile
                </h3>
              </div>

              {error && (
                <div className="mb-3 p-3 rounded-md bg-error/10 text-error text-xs font-bold">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-3 p-3 rounded-md bg-green-500/10 text-green-500 text-xs font-bold flex items-center gap-1">
                  <CheckCircle size={14} /> Profile synchronized successfully!
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                
                {/* Custom Avatar Upload file zone */}
                <div className="flex flex-col gap-1.5 items-center bg-surface-soft dark:bg-canvas-dark/40 p-4 rounded-md border border-hairline dark:border-hairline-dark">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary relative bg-surface-card mb-2">
                    <img 
                      src={avatarPreview || (resolveUrl(currentUser?.avatarUrl || ''))} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => document.getElementById('avatarFileInput').click()}
                    className="bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-primary-pressed transition-colors"
                  >
                    <Upload size={10} /> Choose Portrait
                  </button>
                  
                  <input 
                    type="file"
                    id="avatarFileInput"
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Username Input */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-ink dark:text-white">
                    Username
                  </label>
                  <input 
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-canvas dark:bg-canvas-dark text-ink dark:text-white px-3 py-2 rounded-md text-xs border border-ash/40 double-focus"
                  />
                </div>

                {/* Biography Textarea */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-ink dark:text-white">
                    Chronicle Biography
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-canvas dark:bg-canvas-dark text-ink dark:text-white p-3 rounded-md text-xs border border-ash/40 double-focus resize-none"
                  />
                </div>

                {/* Pronouns Input */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-ink dark:text-white">
                    Pronouns
                  </label>
                  <input 
                    type="text"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    placeholder="e.g. they/them, she/her, he/him"
                    className="bg-canvas dark:bg-canvas-dark text-ink dark:text-white px-3 py-2 rounded-md text-xs border border-ash/40 double-focus"
                  />
                </div>

                {/* Submits */}
                <div className="flex gap-2 justify-end mt-2 pt-3 border-t border-hairline dark:border-hairline-dark">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className="bg-secondary-bg dark:bg-secondary-bg-dark text-ink dark:text-white text-xs font-bold px-4 py-2 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="bg-primary hover:bg-primary-pressed text-white text-xs font-bold px-4 py-2 rounded-md transition-all active:scale-95 disabled:bg-primary/50"
                  >
                    {updating ? 'Synchronizing...' : 'Apply Modifications'}
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sighting Details Overlay Modal */}
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
