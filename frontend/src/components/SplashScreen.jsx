import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStage(1), 800);
    const timer2 = setTimeout(() => setCurrentStage(2), 2000);
    const timer3 = setTimeout(() => setCurrentStage(3), 3200);
    const timer4 = setTimeout(() => setShowContent(true), 3800);
    const timer5 = setTimeout(() => onComplete(), 5500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800">
      <div className="relative z-10 text-center">
        {/* Stage 0 & 1: Animated C Logo */}
        <AnimatePresence>
          {currentStage <= 2 && (
            <motion.div
              key="logo"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: currentStage >= 1 ? 1 : 0, rotate: currentStage >= 1 ? 0 : -180 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 15, duration: 1.2 }}
              className="mb-8"
            >
              <motion.div
                className="w-32 h-32 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#322536' }}
                animate={{ boxShadow: '0 0 20px rgba(255, 0, 0, 0.6)' }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.span
                  className="text-6xl font-black text-red-500"
                  style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  C
                </motion.span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stage 2: CADD Centre Text Animation */}
        <AnimatePresence>
          {currentStage >= 2 && (
            <motion.div
              key="text"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-6"
            >
              <motion.h1
                className="text-4xl md:text-5xl font-bold text-white mb-2"
                style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <motion.span
                  className="inline-block"
                  style={{
                    background: 'linear-gradient(90deg, #ff0000, #ff6b6b, #ff0000)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  CADD
                </motion.span>
                <span className="text-white ml-3">Centre</span>
              </motion.h1>
              <motion.p
                className="text-lg text-gray-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                Computer Aided Design & Development
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stage 3: App Information */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              key="info"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-4"
            >
              <motion.div
                className="mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <div className="w-64 h-1 bg-gray-700 rounded-full mx-auto overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
                </div>
                <motion.p
                  className="text-gray-400 text-xs mt-2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Loading your dashboard...
                </motion.p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SplashScreen;