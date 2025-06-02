import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Users, 
  Trophy, 
  Calendar, 
  Target,
  Zap,
  Settings,
  DollarSign
} from 'lucide-react';
import { clsx } from 'clsx';
import type { NavigationPage } from '../types';

interface NavigationProps {
  currentPage: NavigationPage;
  onPageChange: (page: NavigationPage) => void;
  gameInitialized: boolean;
  teamName?: string;
}

const navItems = [
  {
    id: 'dashboard' as NavigationPage,
    label: 'Dashboard',
    icon: Home,
    requiresGame: true,
  },
  {
    id: 'standings' as NavigationPage,
    label: 'Standings',
    icon: Trophy,
    requiresGame: true,
  },
  {
    id: 'races' as NavigationPage,
    label: 'Races',
    icon: Calendar,
    requiresGame: true,
  },
  {
    id: 'financial' as NavigationPage,
    label: 'Finances',
    icon: DollarSign,
    requiresGame: true,
  },
  {
    id: 'objectives' as NavigationPage,
    label: 'Objectives',
    icon: Target,
    requiresGame: true,
  },
];

export default function Navigation({ 
  currentPage, 
  onPageChange, 
  gameInitialized, 
  teamName 
}: NavigationProps) {
  const handleNavClick = (page: NavigationPage) => {
    onPageChange(page);
  };

  return (
    <motion.nav
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="glass fixed left-0 top-0 h-full w-20 lg:w-64 p-4 z-50 racing-grid"
    >
      {/* Logo Section */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-center lg:justify-start space-x-3">
          <div className="relative">
            <Zap className="w-8 h-8 text-blue-400 glow" />
            <div className="absolute inset-0 bg-blue-400 blur-lg opacity-30 animate-pulse-slow"></div>
          </div>
          <span className="hidden lg:block font-display text-xl text-white">
            F1 Manager
          </span>
        </div>
        
        {/* Team Display */}
        {gameInitialized && teamName && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 p-3 glass rounded-lg"
          >
            <div className="text-xs text-gray-400 mb-1">Managing</div>
            <div className="font-racing text-sm text-white truncate">
              {teamName}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Navigation Items */}
      <div className="space-y-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          const isDisabled = item.requiresGame && !gameInitialized;

          return (
            <motion.button
              key={item.id}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index, duration: 0.3 }}
              onClick={() => !isDisabled && handleNavClick(item.id)}
              disabled={isDisabled}
              className={clsx(
                'w-full flex items-center justify-center lg:justify-start space-x-3 p-3 rounded-lg transition-all duration-300 group relative overflow-hidden',
                {
                  'bg-gradient-to-r from-blue-600 to-cyan-500 text-white glow': isActive,
                  'text-gray-400 hover:text-white hover:bg-white/10': !isActive && !isDisabled,
                  'text-gray-600 cursor-not-allowed opacity-50': isDisabled,
                }
              )}
            >
              {/* Background Animation */}
              {!isDisabled && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/20 to-blue-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              )}
              
              <Icon className="w-5 h-5 relative z-10" />
              <span className="hidden lg:block font-medium relative z-10">
                {item.label}
              </span>
              
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Team Selection Button */}
      {!gameInitialized && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-4 left-4 right-4"
        >
          <button
            onClick={() => handleNavClick('team-selection')}
            className="w-full btn-futuristic text-white font-racing py-3 px-4 rounded-lg text-center"
          >
            <Users className="w-5 h-5 mx-auto lg:mr-2 lg:inline" />
            <span className="hidden lg:inline">Select Team</span>
          </button>
        </motion.div>
      )}

      {/* Settings Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 left-4 right-4"
        style={{ bottom: gameInitialized ? '1rem' : '5rem' }}
      >
        <button className="w-full flex items-center justify-center lg:justify-start space-x-2 p-2 text-gray-400 hover:text-white transition-colors">
          <Settings className="w-4 h-4" />
          <span className="hidden lg:block text-sm">Settings</span>
        </button>
      </motion.div>

      {/* Racing Stripes Decoration */}
      <div className="absolute right-0 top-0 bottom-0 w-1 racing-stripes opacity-50"></div>
    </motion.nav>
  );
} 