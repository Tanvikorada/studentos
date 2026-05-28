import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { DitheringShader } from './DitheringShader';

export default function Splash({ onDone }) {
  useEffect(() => {
    // Increase timer slightly to allow the user to appreciate the shader
    const timer = setTimeout(onDone, 3500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#000000', zIndex: 9999,
        overflow: 'hidden'
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
    >
      <DitheringShader 
        shape="sphere"
        type="random"
        colorBack="#09090b"
        colorFront="#6C3FF5"
        pxSize={2}
        speed={1.5}
        style={{ position: 'absolute', inset: 0, zIndex: 1 }}
      />
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', pointerEvents: 'none' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0, filter: 'blur(20px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 style={{ 
            fontFamily: 'Instrument Serif, serif', 
            fontSize: '7rem', 
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
            lineHeight: 1,
            color: '#fafafa',
            textShadow: '0 8px 32px rgba(0,0,0,0.8)'
          }}>
            Student
            <span style={{ fontStyle: 'italic', marginLeft: '8px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '6rem', letterSpacing: '-0.04em', color: '#f43f5e' }}>
              OS
            </span>
          </h1>
          
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.8, duration: 1.2, ease: "circOut" }}
            style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(250,250,250,0.4), transparent)',
              marginTop: '16px'
            }}
          />
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            style={{
              marginTop: '16px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '0.9rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600
            }}
          >
            The Operating System for Scholars
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}
