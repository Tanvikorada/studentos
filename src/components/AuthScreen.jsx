import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Eye, EyeOff, Loader2, LogIn, ArrowRight } from 'lucide-react';
import { mutateDB, toast } from '../store';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithPopup, googleProvider } from '../firebase';
import StyledText from './StyledText';

export default function AuthScreen({ onAuth, onLocal }) {
  const [email, setEmail] = useState('');
  const [showAuthForm, setShowAuthForm] = useState(false);
  
  // Auth Form State
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ name: '', password: '', college: '', dept: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleStart = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter an email first');
      return;
    }
    setShowAuthForm(true);
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      toast.success('Welcome to StudentOS!');
      if (onAuth) onAuth();
    } catch (err) {
      console.error(err);
      toast.error('Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !form.password) { toast.error('Fill in all fields'); return; }
    if (mode === 'register' && !form.name) { toast.error('Full name is required'); return; }
    
    setLoading(true);
    try {
      if (mode === 'register') {
        const userCred = await createUserWithEmailAndPassword(auth, email, form.password);
        await updateProfile(userCred.user, { displayName: form.name });
        
        mutateDB(d => {
          d.profile.name = form.name;
          if (form.college) d.profile.college = form.college;
          if (form.dept) d.profile.dept = form.dept;
        });
        toast.success('Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, form.password);
        toast.success('Welcome back to StudentOS!');
      }
      if (onAuth) onAuth();
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        toast.error('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setMode('login');
        toast.error('Email is already registered. Please sign in.');
      } else if (err.code === 'auth/weak-password') {
        toast.error('Password should be at least 6 characters.');
      } else {
        toast.error(err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      backgroundColor: '#171721', /* Deep Space */
      color: '#ededf3', /* Starlight */
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Background Image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/assets/hero-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.6,
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, #1e1e2a 0%, rgba(30,30,42,0.4) 60%, rgba(23,23,33,0) 100%)',
        zIndex: 1
      }} />

      {/* Top Nav */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', padding: '24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
          <Sparkles size={20} color="#5266eb" />
          StudentOS
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={onLocal} style={{
            background: 'transparent', border: 'none', color: '#ededf3',
            fontSize: '0.9rem', cursor: 'pointer', padding: '8px 20px', fontWeight: 500
          }}>
            Explore Offline
          </button>
          <button onClick={() => setShowAuthForm(true)} style={{
            background: 'rgba(205,221,255,0.15)', color: '#ededf3',
            border: 'none', borderRadius: 40, padding: '8px 20px',
            fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer',
            backdropFilter: 'blur(10px)'
          }}>
            Sign In
          </button>
        </div>
      </div>

      {/* Hero Content */}
      <div style={{
        position: 'relative', zIndex: 10,
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px', textAlign: 'center',
        marginTop: '-10vh'
      }}>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
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
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          style={{
          fontSize: '21px',
          fontWeight: 400,
          color: 'rgba(237,237,243,0.8)',
          margin: '0 0 48px 0',
          maxWidth: 600,
          lineHeight: 1.4
        }}>
          The definitive AI-native operating system for modern scholars. Unify your academics, career, and focus in one serene space.
        </motion.p>

        <AnimatePresence mode="wait">
          {!showAuthForm ? (
            <motion.form 
              key="email-capture"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }} transition={{ duration: 0.5, delay: 0.4 }}
              onSubmit={handleStart}
              style={{ display: 'flex', width: '100%', maxWidth: 480, height: 64, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', borderRadius: 32 }}
            >
              <input 
                type="email" 
                placeholder="Enter your college email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(39,39,53,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid #70707d',
                  borderRight: 'none',
                  borderRadius: '32px 0 0 32px',
                  padding: '0 24px',
                  color: '#ededf3',
                  fontSize: '16px',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <button type="submit" style={{
                background: '#5266eb',
                color: '#fff',
                border: 'none',
                borderRadius: '0 32px 32px 0',
                padding: '0 32px',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 0.2s'
              }}>
                Get Started <ArrowRight size={18} />
              </button>
            </motion.form>
          ) : (
            <motion.div 
              key="auth-card"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
              style={{
                background: '#1e1e2a',
                border: '1px solid #272735',
                borderRadius: 24,
                padding: '40px',
                width: '100%',
                maxWidth: 420,
                textAlign: 'left',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}
            >
              <h2 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p style={{ color: '#c3c3cc', fontSize: '14px', margin: '0 0 24px 0' }}>
                {email ? `Continuing as ${email}` : 'Please enter your details'}
                {email && <span onClick={() => setShowAuthForm(false)} style={{ color: '#5266eb', marginLeft: 8, cursor: 'pointer' }}>Change</span>}
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!email && (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#c3c3cc', marginBottom: 6 }}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      style={{ width: '100%', background: '#272735', border: '1px solid #70707d', borderRadius: 8, padding: '12px 16px', color: '#fff', outline: 'none' }} />
                  </div>
                )}
                
                {mode === 'register' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: '#c3c3cc', marginBottom: 6 }}>Full Name</label>
                      <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required
                        style={{ width: '100%', background: '#272735', border: '1px solid #70707d', borderRadius: 8, padding: '12px 16px', color: '#fff', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', color: '#c3c3cc', marginBottom: 6 }}>College</label>
                        <input type="text" value={form.college} onChange={e => set('college', e.target.value)}
                          style={{ width: '100%', background: '#272735', border: '1px solid #70707d', borderRadius: 8, padding: '12px 16px', color: '#fff', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', color: '#c3c3cc', marginBottom: 6 }}>Department</label>
                        <input type="text" value={form.dept} onChange={e => set('dept', e.target.value)}
                          style={{ width: '100%', background: '#272735', border: '1px solid #70707d', borderRadius: 8, padding: '12px 16px', color: '#fff', outline: 'none' }} />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#c3c3cc', marginBottom: 6 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} required
                      style={{ width: '100%', background: '#272735', border: '1px solid #70707d', borderRadius: 8, padding: '12px 16px', color: '#fff', outline: 'none', paddingRight: 40 }} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#c3c3cc', cursor: 'pointer' }}>
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} style={{
                  background: '#5266eb', color: '#fff', border: 'none', borderRadius: 32, padding: '14px', fontSize: '16px', fontWeight: 500, cursor: 'pointer', marginTop: 8, display: 'flex', justifyContent: 'center'
                }}>
                  {loading ? <Loader2 size={20} className="animate-spin" /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#272735' }} />
                <span style={{ fontSize: '12px', color: '#70707d' }}>OR</span>
                <div style={{ flex: 1, height: 1, background: '#272735' }} />
              </div>

              <button type="button" onClick={handleGoogle} style={{
                width: '100%', background: '#272735', color: '#ededf3', border: '1px solid #70707d', borderRadius: 32, padding: '12px', fontSize: '15px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>

              <p style={{ textAlign: 'center', fontSize: '13px', marginTop: 24, color: '#c3c3cc' }}>
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  style={{ background: 'none', border: 'none', color: '#5266eb', fontWeight: 500, cursor: 'pointer' }}>
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer Links */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', gap: 24, padding: '24px 40px', fontSize: '13px', color: '#c3c3cc' }}>
        <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
        <span style={{ cursor: 'pointer' }}>Terms of Service</span>
        <span style={{ cursor: 'pointer' }}>System Status</span>
      </div>
    </div>
  );
}
