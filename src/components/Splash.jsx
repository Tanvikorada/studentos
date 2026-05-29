import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function Splash({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500); // Shorter, cleaner intro
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#09090b', zIndex: 9999,
        overflow: 'hidden'
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
    >
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0, filter: 'blur(10px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 16,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
            boxShadow: '0 0 40px rgba(124, 58, 237, 0.3)'
          }}>
            <Sparkles size={24} color="#fff" />
          </div>
          
          <h1 style={{ 
            fontFamily: 'Instrument Serif, serif', 
            fontSize: '5rem', 
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
            lineHeight: 1,
            color: '#fafafa'
          }}>
            StudentOS
          </h1>
          
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            style={{
              marginTop: '16px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '0.85rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 600
            }}
          >
            Ambient Academic Intelligence
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}
