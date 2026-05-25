import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Splash({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2400);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', zIndex: 9999
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
    >
      <div style={{ textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0, filter: 'blur(20px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'relative' }}
        >
          <h1 style={{ 
            fontFamily: 'Instrument Serif, serif', 
            fontSize: '6rem', 
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
            lineHeight: 1,
            color: 'var(--text)'
          }}>
            S<span className="text-red font-bold">tu</span>dent
            <span style={{ fontStyle: 'italic', marginLeft: '4px' }}>
              O<span className="text-primary font-bold">S</span>
            </span>
          </h1>
          
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.8, duration: 1.2, ease: "circOut" }}
            style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent, var(--violet), var(--red), transparent)',
              marginTop: '12px'
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
              color: 'var(--text3)',
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
