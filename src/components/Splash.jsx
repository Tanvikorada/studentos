import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function Splash({ onDone }) {
  const [zooming, setZooming] = useState(false);

  // Automatically zoom after 3 seconds if not clicked?
  // The user says "the app should open like the screen is going in to the computer... later it should open previous login page".
  // Let's do it on button click to be safe, or just automatically after 2.5s.
  // Actually, an auto-zoom splash is very cinematic.

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setZooming(true);
    }, 2500);

    const timer2 = setTimeout(() => {
      if (onDone) onDone();
    }, 4000); // 1.5s for zoom animation

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onDone]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      backgroundColor: '#171721',
      color: '#ededf3',
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Background Image that zooms in */}
      <motion.div 
        animate={zooming ? { 
          scale: 30, // massive zoom
          opacity: 0,
          filter: 'blur(10px)',
          // Adjust transform origin if the desk/computer is not exactly center.
          // Center is usually fine for a dramatic zoom.
        } : { 
          scale: 1.05, 
          opacity: 0.6,
          filter: 'blur(0px)'
        }}
        initial={{ scale: 1, opacity: 0 }}
        transition={{ 
          duration: zooming ? 1.5 : 2, 
          ease: zooming ? [0.64, 0, 0.78, 0] : "easeOut" 
        }}
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/assets/hero-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transformOrigin: '50% 60%', // Aim slightly below center where a desk usually is
          zIndex: 0
        }} 
      />

      {/* Dark overlay that fades out on zoom */}
      <motion.div 
        animate={{ opacity: zooming ? 0 : 1 }}
        transition={{ duration: 1 }}
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, #1e1e2a 0%, rgba(30,30,42,0.4) 60%, rgba(23,23,33,0) 100%)',
          zIndex: 1
        }} 
      />

      {/* UI Elements that fade out when zooming starts */}
      <AnimatePresence>
        {!zooming && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 0.8 }}
            style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            {/* Top Nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
                <Sparkles size={20} color="#5266eb" />
                StudentOS
              </div>
            </div>

            {/* Hero Content */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '0 20px', textAlign: 'center',
              marginTop: '-10vh'
            }}>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
                style={{
                fontSize: 'clamp(40px, 6vw, 65px)',
                fontWeight: 300,
                letterSpacing: '0.01em',
                lineHeight: 1.15,
                margin: '0 0 24px 0',
                maxWidth: 900
              }}>
                Mountain Top Command Center
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
                style={{
                fontSize: '21px',
                fontWeight: 400,
                color: 'rgba(237,237,243,0.8)',
                margin: '0 0 48px 0',
                maxWidth: 600,
                lineHeight: 1.4
              }}>
                Initializing AI-native operating system...
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.6 }}
              >
                <div style={{
                  background: 'rgba(82, 102, 235, 0.2)',
                  border: '1px solid #5266eb',
                  color: '#ededf3',
                  borderRadius: 32,
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  Connecting to terminal <Sparkles size={16} className="animate-pulse" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
