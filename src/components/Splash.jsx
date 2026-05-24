import { motion } from 'framer-motion';

export default function Splash({ onDone }) {
  return (
    <motion.div
      className="splash"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onAnimationComplete={() => setTimeout(onDone, 1500)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, #7c3aed, #10b981)',
            borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: '#fff',
            boxShadow: '0 0 40px rgba(124,58,237,0.4)',
          }}
        >S</motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{
            fontFamily: 'Instrument Serif, serif',
            fontStyle: 'italic',
            fontSize: '2.5rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >StudentOS</motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{ display: 'flex', gap: 6 }}
        >
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed' }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
