import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStage(1), 500);
    const timer2 = setTimeout(() => setCurrentStage(2), 2500);
    const timer3 = setTimeout(() => setCurrentStage(3), 3500);
    const timer4 = setTimeout(() => setShowContent(true), 4000);
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
        {/* Stage 1: Animated CADD Centre Text with Special C */}
        <AnimatePresence>
          {currentStage >= 1 && (
            <motion.div
              key="text"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-6"
            >
              <motion.h1
                className="text-5xl md:text-7xl font-bold text-white mb-2 flex items-center justify-center"
                style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
              >
                {/* Special Animated C */}
                <motion.span
                  className="relative inline-block"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{
                    scale: currentStage >= 1 ? 1 : 0,
                    rotate: currentStage >= 1 ? 0 : -180,
                  }}
                  transition={{ type: "spring", stiffness: 120, damping: 12, duration: 1.5 }}
                >
                  <motion.span
                    className="relative z-10 inline-block w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-4xl md:text-5xl"
                    style={{
                      backgroundColor: '#322536',
                      color: '#ff0000'
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(255, 0, 0, 0.4)',
                        '0 0 40px rgba(255, 0, 0, 0.8)',
                        '0 0 20px rgba(255, 0, 0, 0.4)'
                      ],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    C
                  </motion.span>

                  {/* Glowing ring effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(45deg, transparent, rgba(255, 0, 0, 0.3), transparent)',
                      filter: 'blur(2px)'
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  />
                </motion.span>

                {/* ADD text */}
                <motion.span
                  className="ml-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  style={{
                    background: 'linear-gradient(90deg, #ff0000, #ff6b6b, #ff0000)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  <motion.span
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{
                      background: 'linear-gradient(90deg, #ff0000, #ff6b6b, #ff0000)',
                      backgroundSize: '200% 100%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    ADD
                  </motion.span>
                </motion.span>

                {/* Centre text */}
                <motion.span
                  className="text-white ml-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                >
                  Centre
                </motion.span>
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl text-gray-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.6 }}
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