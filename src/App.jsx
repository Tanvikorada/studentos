import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Splash from './components/Splash';
import AuthScreen from './components/AuthScreen';
import Onboarding from './components/Onboarding';
import Shell from './Shell';
import { useDB, isDBUnlocked, unlockDB } from './store';
import './index.css';

export default function App() {
  const [phase, setPhase] = useState('splash');
  const dbState = useDB();
  const unlocked = isDBUnlocked();

  useEffect(() => {
    if (phase !== 'splash') {
      if (!unlocked) {
        setPhase('auth');
      } else {
        const isNew = !dbState.settings?.onboardingComplete;
        setPhase(isNew ? 'onboarding' : 'app');
      }
    }
  }, [unlocked, dbState.settings?.onboardingComplete, phase]);

  const handleSplashDone = () => {
    if (unlocked) {
      const isNew = !dbState.settings?.onboardingComplete;
      setPhase(isNew ? 'onboarding' : 'app');
    } else {
      setPhase('auth');
    }
  };

  const finishAuth = () => {
    // Phase transitions are handled reactively by the useEffect above
  };

  const handleAuthLocal = () => {
    unlockDB('local_sandbox');
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
  );
}
