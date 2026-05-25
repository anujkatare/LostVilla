import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertTriangle, FileVideo, FileImage, Lock, LogIn } from 'lucide-react';
import { API_BASE } from '../config.js';
import { motion } from 'framer-motion';
import { supabase } from '../supabase.js';

export default function PostSection({ currentUser, onPostCreated, session }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [type, setType] = useState('story'); // 'info', 'story', 'fictional', 'real incident'
  const [isAi, setIsAi] = useState(false);
  const [isEditorial, setIsEditorial] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]); // Array of File objects
  const [mediaPreviews, setMediaPreviews] = useState([]); // Array of objects: { id, url, type, name }
  const [mediaType, setMediaType] = useState(''); // 'image' | 'video' | ''

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const previewsRef = useRef([]);
  previewsRef.current = mediaPreviews;

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      previewsRef.current.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, []);

  // File picking and previewing handlers
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setError('');

    // Check if there is a video in the selection
    const hasVideo = files.some(file => file.type.startsWith('video/'));

    if (hasVideo) {
      // If a video is chosen, enforce exactly one video and clear any images
      const videoFile = files.find(file => file.type.startsWith('video/'));
      if (videoFile.size > 50 * 1024 * 1024) {
        setError('Video file exceeds the maximum 50MB limit.');
        return;
      }

      // Revoke any previous image URLs to prevent memory leaks
      mediaPreviews.forEach(p => URL.revokeObjectURL(p.url));

      setMediaFiles([videoFile]);
      setMediaType('video');
      setMediaPreviews([{
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(videoFile),
        type: 'video',
        name: videoFile.name
      }]);
    } else {
      // Only images selected
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        setError('Only web-compatible images and videos are allowed!');
        return;
      }

      // If we previously had a video, clear it
      let currentPreviews = mediaType === 'video' ? [] : [...mediaPreviews];
      let currentFiles = mediaType === 'video' ? [] : [...mediaFiles];

      // Clean up previous video URL if any
      if (mediaType === 'video') {
        mediaPreviews.forEach(p => URL.revokeObjectURL(p.url));
      }

      // Check file size and append
      const addedFiles = [];
      const addedPreviews = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        if (currentFiles.length + addedFiles.length >= 10) {
          setError('Maximum of 10 photos is allowed.');
          break;
        }

        if (file.size > 15 * 1024 * 1024) {
          setError(`Image file ${file.name} exceeds the 15MB limit.`);
          continue;
        }

        addedFiles.push(file);
        addedPreviews.push({
          id: Math.random().toString(36).substr(2, 9),
          url: URL.createObjectURL(file),
          type: 'image',
          name: file.name
        });
      }

      if (addedFiles.length > 0) {
        setMediaFiles([...currentFiles, ...addedFiles]);
        setMediaType('image');
        setMediaPreviews([...currentPreviews, ...addedPreviews]);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeSpecificMedia = (id) => {
    const previewToRemove = mediaPreviews.find(p => p.id === id);
    if (previewToRemove) {
      URL.revokeObjectURL(previewToRemove.url);
    }

    const updatedPreviews = mediaPreviews.filter(p => p.id !== id);
    // Find index of the file we are removing
    const removeIdx = mediaPreviews.findIndex(p => p.id === id);
    const updatedFiles = mediaFiles.filter((_, idx) => idx !== removeIdx);

    setMediaPreviews(updatedPreviews);
    setMediaFiles(updatedFiles);

    if (updatedPreviews.length === 0) {
      setMediaType('');
    }
  };

  const removeMedia = () => {
    mediaPreviews.forEach(p => URL.revokeObjectURL(p.url));
    setMediaFiles([]);
    setMediaPreviews([]);
    setMediaType('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadToSupabase = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  // Submit story to API endpoint
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !tags.trim() || !type.trim()) {
      setError('Title, description, tags, and sighting type are all required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let finalMediaUrl = null;
      let finalMediaType = null;

      if (mediaFiles.length > 0) {
        const uploadedUrls = [];
        for (const file of mediaFiles) {
          const url = await uploadToSupabase(file);
          uploadedUrls.push(url);
        }

        finalMediaType = mediaType;
        if (mediaType === 'video') {
          finalMediaUrl = uploadedUrls[0];
        } else {
          finalMediaUrl = uploadedUrls.length > 1 ? JSON.stringify(uploadedUrls) : uploadedUrls[0];
        }
      }

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      formData.append('tags', tags.trim());
      formData.append('type', type);
      formData.append('isAi', isAi);
      formData.append('isEditorial', isEditorial);
      formData.append('authorName', currentUser.username);
      formData.append('authorAvatar', currentUser.avatarUrl);

      if (finalMediaUrl) {
        formData.append('mediaUrl', finalMediaUrl);
        formData.append('mediaType', finalMediaType);
      }

      const response = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errorMsg = 'Failed to submit sighting.';
        try {
          const data = await response.json();
          errorMsg = data.error || errorMsg;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      // Success - reset fields and redirect
      setTitle('');
      setContent('');
      setTags('');
      setType('story');
      setIsAi(false);
      setIsEditorial(false);
      removeMedia();
      onPostCreated();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Server connection failed.');
    } finally {
      setSubmitting(false);
    }
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
            Scribe Registry Locked
          </h2>
          <p className="text-xs text-mute dark:text-mute-dark mb-6 leading-relaxed max-w-xs mx-auto">
            You must sign in to submit sighting logs, document eerie chronicles, and share evidence with other investigators.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 border border-hairline dark:border-hairline-dark text-xs font-bold rounded-xl text-ink dark:text-white bg-surface-card hover:bg-surface-soft dark:bg-canvas-dark dark:hover:bg-secondary-bg-dark transition-all shadow-md cursor-pointer active:scale-95"
          >
            <LogIn size={14} className="text-primary animate-pulse" />
            <span>Sign In to Post</span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto bg-canvas dark:bg-surface-card-dark rounded-md p-6 border border-hairline dark:border-hairline-dark">

      <div className="flex flex-col gap-1.5 mb-6 text-center md:text-left">
        <h2 className="heading-lg font-extrabold tracking-tight text-ink dark:text-white">
          Report Spooky Sighting
        </h2>
        <p className="text-sm text-mute dark:text-mute-dark">
          Log an anomaly, catalog a beast, or publish an urban legend into the Lost Villa logs.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-md bg-error/10 border border-error/20 flex gap-2.5 items-start text-error text-sm font-semibold">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Title Input (44px text-input style with signature focus outline) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-ink dark:text-white flex items-center gap-1">
            <span>Sighting Title</span>
            <span className="text-primary font-extrabold">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., The Faceless Woman on Highway 66"
            className="w-full bg-canvas dark:bg-canvas-dark text-ink dark:text-white placeholder-ash border border-ash/40 h-[44px] px-4 rounded-md text-sm double-focus transition-all duration-200"
          />
        </div>

        {/* Story Content Description Area */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-ink dark:text-white flex items-center gap-1">
            <span>Chronicle / Description</span>
            <span className="text-primary font-extrabold">*</span>
          </label>
          <textarea
            required
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Recount the encounter in vivid, chilling detail. Where did it occur? What was the entity's behavior?"
            className="w-full bg-canvas dark:bg-canvas-dark text-ink dark:text-white placeholder-ash border border-ash/40 p-4 rounded-md text-sm double-focus transition-all duration-200 resize-y min-h-[120px]"
          />
        </div>

        {/* Sighting Type Selector (44px height drop-down selector matching standard inputs) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-ink dark:text-white flex items-center gap-1">
            <span>Sighting Type</span>
            <span className="text-primary font-extrabold">*</span>
          </label>
          <select
            required
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-canvas dark:bg-canvas-dark text-ink dark:text-white border border-ash/40 h-[44px] px-4 rounded-md text-sm double-focus transition-all duration-200 cursor-pointer"
          >
            <option value="story">Story</option>
            <option value="info">Info</option>
            <option value="fictional">Fictional</option>
            <option value="real incident">Real Incident</option>
          </select>
        </div>

        {/* Category Tags */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-ink dark:text-white flex items-center gap-1">
            <span>Search Tags</span>
            <span className="text-primary font-extrabold">*</span>
          </label>
          <input
            type="text"
            required
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., cryptid, forest, highway (comma-separated)"
            className="w-full bg-canvas dark:bg-canvas-dark text-ink dark:text-white placeholder-ash border border-ash/40 h-[44px] px-4 rounded-md text-sm double-focus transition-all duration-200"
          />
        </div>

        {/* Drag & Drop Media Upload Area */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-ink dark:text-white">
            Evidence Media (Photo/Video)
          </label>

          {mediaPreviews.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-ash/30 hover:border-primary/50 dark:border-stone/20 dark:hover:border-primary/50 rounded-md p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-surface-soft dark:bg-canvas-dark/40 transition-colors"
            >
              <Upload className="text-mute dark:text-mute-dark animate-pulse" size={28} />
              <div className="text-center">
                <p className="text-sm font-bold text-ink dark:text-white">Click to drop evidence file(s)</p>
                <p className="text-xs text-mute dark:text-mute-dark mt-1">Accepts multiple images (up to 10) or a single video up to 50MB</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                multiple
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Media Preview Container */}
              {mediaType === 'video' ? (
                <div className="relative rounded-md overflow-hidden bg-surface-soft dark:bg-canvas-dark border border-hairline dark:border-hairline-dark aspect-video max-h-[300px] flex items-center justify-center">
                  <video
                    src={mediaPreviews[0].url}
                    className="w-full h-full object-contain"
                    controls
                  />
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-bold flex items-center gap-1.5">
                    <FileVideo size={12} />
                    {mediaPreviews[0].name}
                  </div>
                  <button
                    type="button"
                    onClick={removeMedia}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Grid layout for images */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-2 bg-surface-soft dark:bg-canvas-dark/40 border border-hairline dark:border-hairline-dark rounded-md">
                    {mediaPreviews.map((preview) => (
                      <div key={preview.id} className="relative aspect-square rounded-md overflow-hidden bg-stone/10 border border-hairline dark:border-hairline-dark group">
                        <img
                          src={preview.url}
                          alt="Preview"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeSpecificMedia(preview.id)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/65 hover:bg-black/90 text-white transition-colors shadow-sm"
                          title="Remove this image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    
                    {/* Add More block if less than 10 */}
                    {mediaPreviews.length < 10 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-md border-2 border-dashed border-ash/30 hover:border-primary/50 dark:border-stone/20 dark:hover:border-primary/50 flex flex-col items-center justify-center gap-1 bg-surface-soft dark:bg-canvas-dark/20 hover:bg-surface-soft/80 transition-colors"
                      >
                        <Upload size={16} className="text-mute dark:text-mute-dark text-center" />
                        <span className="text-[10px] font-bold text-mute dark:text-mute-dark text-center">Add More</span>
                      </button>
                    )}
                  </div>

                  {/* Top Bar / Count controls */}
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[11px] font-bold text-mute dark:text-mute-dark uppercase tracking-wider">
                      {mediaPreviews.length} / 10 photos selected
                    </span>
                    <button
                      type="button"
                      onClick={removeMedia}
                      className="text-[11px] font-bold text-primary hover:text-primary-pressed transition-colors uppercase tracking-wider"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
              
              {/* Hidden file input for adding more files */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* AI Generated Optional Toggle Button */}
        <div className="flex items-center justify-between py-3 px-4 bg-surface-soft dark:bg-canvas-dark/30 rounded-md border border-hairline dark:border-hairline-dark">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-ink dark:text-white">
              AI-Generated Content Label
            </span>
            <span className="text-[10px] text-mute dark:text-mute-dark">
              Enable this if your chronicle or media is created using artificial intelligence.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAi(prev => !prev)}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${isAi ? 'bg-primary' : 'bg-secondary-bg dark:bg-secondary-bg-dark'
              }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isAi ? 'translate-x-6' : 'translate-x-0'
                }`}
            />
          </button>
        </div>



        {/* CTA Buttons */}
        <div className="flex gap-3 justify-end items-center mt-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary hover:bg-primary-pressed text-white text-sm font-bold px-6 py-3 rounded-md transition-all transform active:scale-95 disabled:bg-primary/50 flex items-center gap-2"
          >
            {submitting ? 'Excavating...' : 'Cast Into the Abyss'}
          </button>
        </div>

      </form>
    </div>
  );
}
