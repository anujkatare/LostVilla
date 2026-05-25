import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabase.js';
import { Shield, Sparkles, Ghost, LogIn } from 'lucide-react';

export default function SignUpSection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'An error occurred during Google sign in.');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-md w-full space-y-8 bg-canvas/80 dark:bg-surface-card-dark/80 backdrop-blur-xl p-8 rounded-2xl border border-hairline dark:border-hairline-dark shadow-2xl relative overflow-hidden"
      >
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center relative z-10">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 border border-primary/20"
          >
            <Ghost size={32} className="animate-pulse" />
          </motion.div>
          
          <h2 className="heading-xl font-display font-extrabold text-ink dark:text-white tracking-tight">
            Cross the Threshold
          </h2>
          <p className="mt-3 text-sm text-mute dark:text-mute-dark max-w-sm mx-auto leading-relaxed">
            Initialize your profile to document eerie anomalies, chronicle sightings, and sync with the Scribe Vault.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-lg bg-error/10 border border-error/20 text-error text-xs font-bold text-center relative z-10"
          >
            {error}
          </motion.div>
        )}

        <div className="mt-8 space-y-6 relative z-10">
          <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border border-hairline dark:border-hairline-dark text-sm font-bold rounded-xl text-ink dark:text-white bg-surface-card hover:bg-surface-soft dark:bg-canvas-dark dark:hover:bg-secondary-bg-dark transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.47c0,-0.64 -0.06,-1.27 -0.17,-1.91z" fill="#4285F4" />
                  <path d="M12,20.62c2.43,0 4.47,-0.81 5.96,-2.2l-3.3,-2.58c-0.91,0.61 -2.08,0.98 -3.3,0.98c-2.35,0 -4.33,-1.59 -5.04,-3.72H2.9v2.66c1.49,2.96 4.54,4.86 8.1,4.86z" fill="#34A853" />
                  <path d="M6.96,13.1a5.18,5.18 0 0 1 0,-3.2V7.24H2.9a8.99,8.99 0 0 0 0,7.96l4.06,-2.1z" fill="#FBBC05" />
                  <path d="M12,6.38c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.46,3.63 14.42,2.82 12,2.82c-3.56,0 -6.61,1.9 -8.1,4.86l4.06,3.2C8.67,7.97 10.65,6.38 12,6.38z" fill="#EA4335" />
                </g>
              </svg>
            )}
            <span>{loading ? 'Opening Portal...' : 'Continue with Google'}</span>
          </motion.button>

          <div className="flex items-center justify-between mt-6 text-xs text-mute dark:text-mute-dark select-none border-t border-hairline/30 dark:border-hairline-dark/30 pt-6">
            <div className="flex items-center gap-1.5">
              <Shield size={12} className="text-primary" />
              <span>Secure Authentication</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-primary" />
              <span>Decentralized Codex</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
