import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Splash from './components/Splash';
import AuthScreen from './components/AuthScreen';
import Onboarding from './components/Onboarding';
import Shell from './Shell';
import { unlockDB } from './store';
import './index.css';

const RETURNING_KEY = 'studentos_returning';

export default function App() {
  const [phase, setPhase] = useState('splash');

  useEffect(() => {
    // We do NOT auto-skip to 'app' anymore because they must unlock the DB!
  }, []);

  const handleSplashDone = () => {
    setPhase('auth');
  };

  const handleAuthLocal = () => {
    const isNew = !localStorage.getItem(RETURNING_KEY);
    localStorage.setItem(RETURNING_KEY, '1');
    unlockDB('local_sandbox');
    setPhase(isNew ? 'onboarding' : 'app');
  };

  return (
    <AnimatePresence mode="wait">
      {phase === 'splash' && (
        <motion.div key="splash" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          <Splash onDone={handleSplashDone} />
        </motion.div>
      )}
      {phase === 'auth' && (
        <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <AuthScreen onAuth={handleAuthLocal} onLocal={handleAuthLocal} />
        </motion.div>
      )}
      {phase === 'onboarding' && (
        <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Shell />
          <Onboarding onDone={() => setPhase('app')} />
        </motion.div>
      )}
      {phase === 'app' && (
        <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: '100vh' }}>
          <Shell />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
