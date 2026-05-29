import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AuthScreen from './components/AuthScreen';
import Onboarding from './components/Onboarding';
import Shell from './Shell';
import ToastContainer from './components/Toast';
import { useDB, isDBUnlocked, unlockDB } from './store';
import './index.css';

export default function App() {
  const [phase, setPhase] = useState('auth');
  const dbState = useDB();
  const unlocked = isDBUnlocked();

  useEffect(() => {
    if (!unlocked) {
      setPhase('auth');
    } else {
      const isNew = !dbState.settings?.onboardingComplete;
      setPhase(isNew ? 'onboarding' : 'app');
    }
  }, [unlocked, dbState.settings?.onboardingComplete]);

  const finishAuth = () => {
    // Phase transitions are handled reactively by the useEffect above
  };

  const handleAuthLocal = () => {
    unlockDB('local_sandbox');
  };

  return (
    <>
    <AnimatePresence mode="wait">
      {phase === 'auth' && (
        <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
          <AuthScreen onAuth={finishAuth} onLocal={handleAuthLocal} />
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
    <ToastContainer />
    </>
  );
}
