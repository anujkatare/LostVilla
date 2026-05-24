import React from 'react';
import { Home, Search, PlusCircle, MessageSquare, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BottomNavbar({ activeTab, setActiveTab }) {
  // Navigation tabs definition
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'post', label: 'Post', icon: PlusCircle },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-canvas/90 dark:bg-surface-card-dark/95 backdrop-blur-md border-t border-hairline dark:border-hairline-dark px-4 py-2 flex justify-around items-center transition-all duration-300">
      <div className="max-w-[600px] w-full flex justify-between items-center relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative py-2 px-4 rounded-full flex flex-col items-center justify-center min-w-[64px] transition-transform duration-100 active:scale-90 touch-none"
              style={{ height: '48px' }} // Standard WCAG touch target
            >
              {/* Active Indicator Sliding Bubble using Framer Motion */}
              {isActive && (
                <motion.div
                  layoutId="activeBubble"
                  className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-full z-0"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <Icon
                size={22}
                className={`relative z-10 transition-colors duration-200 ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-mute dark:text-mute-dark hover:text-ink dark:hover:text-white'
                }`}
              />

              <span
                className={`relative z-10 text-[10px] font-semibold mt-0.5 tracking-wider transition-colors duration-200 ${
                  isActive
                    ? 'text-primary'
                    : 'text-mute dark:text-mute-dark'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
