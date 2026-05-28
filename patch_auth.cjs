const fs = require('fs');
let code = fs.readFileSync('src/components/AuthScreen.jsx', 'utf8');

const newAuthScreen = `import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import { toast } from '../store';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { initFirebaseUser } from '../store';

function FloatingPaths({ position }) {
  const paths = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    d: \\\`M-\\\${380 - i * 5 * position} -\\\${189 + i * 6}C-\\\${380 - i * 5 * position} -\\\${189 + i * 6} -\\\${312 - i * 5 * position} \\\${216 - i * 6} \\\${152 - i * 5 * position} \\\${343 - i * 6}C\\\${616 - i * 5 * position} \\\${470 - i * 6} \\\${684 - i * 5 * position} \\\${875 - i * 6} \\\${684 - i * 5 * position} \\\${875 - i * 6}\\\`,
    width: 0.5 + i * 0.03,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <svg style={{ width: '100%', height: '100%', color: 'rgba(124,58,237,0.3)' }} viewBox="0 0 696 316" fill="none">
        {paths.map(path => (
          <motion.path key={path.id} d={path.d} stroke="currentColor" strokeWidth={path.width} strokeOpacity={0.1 + path.id * 0.03}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{ pathLength: 1, opacity: [0.3, 0.6, 0.3], pathOffset: [0, 1, 0] }}
            transition={{ duration: 20 + Math.random() * 10, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </svg>
    </div>
  );
}

export default function AuthScreen({ onAuth, onLocal }) {
  const handleGoogleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      toast.success('Signed in as ' + res.user.email);
      await initFirebaseUser(res.user.uid, res.user);
      onAuth();
    } catch (e) {
      console.error(e);
      toast.error('Google login failed');
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-art">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', maxWidth: 320 }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', marginBottom: '1rem' }}>StudentOS Cloud</h1>
            <p style={{ fontSize: '1rem' }}>Your academic command center. Synced across all your devices.</p>
          </motion.div>
        </div>
      </div>

      <div className="auth-form">
        <motion.div className="auth-form-inner" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
            <div className="sidebar-logo"><GraduationCap size={16} /></div>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>StudentOS</span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 6 }}>Welcome back</h1>
          <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 28 }}>Sign in to your workspace</p>

          <button onClick={handleGoogleLogin} className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: 16 }}>
            Sign in with Google
          </button>
          
          <button onClick={onLocal} className="btn btn-secondary" style={{ width: '100%' }}>
            Continue without account (Local)
          </button>
        </motion.div>
      </div>
    </div>
  );
}`;

fs.writeFileSync('src/components/AuthScreen.jsx', newAuthScreen);
console.log('AuthScreen updated for Firebase');
