import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SplashScreen = ({ onComplete }) => {
  const [currentStage, setCurrentStage] = useState(0)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStage(1), 800)
    const timer2 = setTimeout(() => setCurrentStage(2), 2000)
    const timer3 = setTimeout(() => setCurrentStage(3), 3200)
    const timer4 = setTimeout(() => setShowContent(true), 3800)
    const timer5 = setTimeout(() => onComplete(), 5500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
      clearTimeout(timer5)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800"
         style={{ background: 'linear-gradient(135deg, #322536 0%, #1f1b24 50%, #2d1b3d 100%)' }}>
      
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-red-500 rounded-full opacity-20"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: 0
            }}
            animate={{ 
              y: [null, -100],
              scale: [0, 1, 0],
              opacity: [0, 0.3, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center">
        {/* Stage 0 & 1: Animated C Logo */}
        <AnimatePresence>
          {currentStage <= 2 && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: currentStage >= 1 ? 1 : 0,
                rotate: currentStage >= 1 ? 0 : -180
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 100,
                damping: 15,
                duration: 1.2
              }}
              className="mb-8"
            >
              <div className="relative">
                {/* Glowing Ring Effect */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, #ff0000, #ff6b6b, #ff0000)',
                    padding: '4px'
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-full h-full rounded-full bg-gray-900"></div>
                </motion.div>
                
                {/* C Logo */}
                <motion.div
                  className="relative z-10 w-32 h-32 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#322536' }}
                  animate={{ 
                    boxShadow: [
                      '0 0 20px rgba(255, 0, 0, 0.3)',
                      '0 0 40px rgba(255, 0, 0, 0.6)',
                      '0 0 20px rgba(255, 0, 0, 0.3)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.span
                    className="text-6xl font-black text-red-500"
                    style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
                    animate={{ 
                      scale: [1, 1.1, 1],
                      textShadow: [
                        '0 0 10px rgba(255, 0, 0, 0.5)',
                        '0 0 20px rgba(255, 0, 0, 0.8)',
                        '0 0 10px rgba(255, 0, 0, 0.5)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    C
                  </motion.span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stage 2: CADD Centre Text Animation */}
        <AnimatePresence>
          {currentStage >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-6"
            >
              <motion.h1
                className="text-4xl md:text-5xl font-bold text-white mb-2"
                style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
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
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-4"
            >
              <motion.div
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <h2 className="text-2xl font-semibold text-white mb-3">
                  Attendance Management System
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Streamline your educational workflow with our comprehensive attendance tracking, 
                  student management, and lab booking system designed specifically for CADD Centre.
                </p>
              </motion.div>

              <motion.div
                className="flex justify-center space-x-6 text-sm text-gray-400"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Student Management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Lab Booking</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span>Reports & Analytics</span>
                </div>
              </motion.div>

              {/* Loading Progress */}
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
  )
}

export default SplashScreen
