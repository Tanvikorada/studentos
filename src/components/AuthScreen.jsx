import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { getDB, mutateDB, toast, unlockDB } from '../store';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from '../firebase';
import StyledText from './StyledText';

// Eye tracking characters from the prompt
function EyeBall({ size = 48, pupilSize = 16, maxDistance = 10, eyeColor = 'white', pupilColor = 'black', isBlinking = false, forceLookX, forceLookY }) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const eyeRef = useRef(null);

  useEffect(() => {
    const h = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  const getPos = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const rect = eyeRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const dx = mouse.x - cx, dy = mouse.y - cy;
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  };
  const pos = getPos();

  return (
    <div ref={eyeRef}
      style={{ width: size, height: isBlinking ? 2 : size, backgroundColor: eyeColor, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', transition: 'height 0.15s' }}>
      {!isBlinking && (
        <div style={{ width: pupilSize, height: pupilSize, backgroundColor: pupilColor, borderRadius: '50%', transform: `translate(${pos.x}px, ${pos.y}px)`, transition: 'transform 0.1s ease-out' }} />
      )}
    </div>
  );
}

function Pupil({ size = 12, maxDistance = 5, pupilColor = 'black', forceLookX, forceLookY }) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);
  const getPos = () => {
    if (!ref.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const dx = mouse.x - cx, dy = mouse.y - cy;
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  };
  const pos = getPos();
  return <div ref={ref} style={{ width: size, height: size, borderRadius: '50%', backgroundColor: pupilColor, transform: `translate(${pos.x}px, ${pos.y}px)`, transition: 'transform 0.1s ease-out' }} />;
}

// Background paths animation
function FloatingPaths({ position }) {
  const paths = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
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

function Characters({ isTypingEmail, isTypingPassword, showPassword }) {
  const [purpleBlink, setPurpleBlink] = useState(false);
  const [blackBlink, setBlackBlink] = useState(false);
  const purpleRef = useRef(null), blackRef = useRef(null), yellowRef = useRef(null), orangeRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const h = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  // Blink intervals
  useEffect(() => {
    const blink = (setter) => {
      const t = setTimeout(() => {
        setter(true);
        setTimeout(() => { setter(false); blink(setter); }, 150);
      }, Math.random() * 4000 + 3000);
      return t;
    };
    const t1 = blink(setPurpleBlink), t2 = blink(setBlackBlink);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const calc = (ref) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 3;
    const dx = mouse.x - cx, dy = mouse.y - cy;
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    };
  };

  const p = calc(purpleRef), b = calc(blackRef), y = calc(yellowRef), o = calc(orangeRef);
  const hidingEyes = isTypingPassword && !showPassword;
  const lookAway = showPassword && isTypingPassword;

  return (
    <div style={{ position: 'relative', width: 450, height: 320 }}>
      {/* Purple tall */}
      <div ref={purpleRef} style={{ position: 'absolute', bottom: 0, left: 50, width: 150, height: hidingEyes ? 360 : 320, backgroundColor: '#6C3FF5', borderRadius: '10px 10px 0 0', zIndex: 1, transform: hidingEyes ? `skewX(${p.bodySkew - 10}deg) translateX(30px)` : `skewX(${p.bodySkew}deg)`, transformOrigin: 'bottom center', transition: 'all 0.7s ease-in-out' }}>
        <div style={{ position: 'absolute', display: 'flex', gap: 24, left: hidingEyes ? 10 : 35 + p.faceX, top: hidingEyes ? 25 : 35 + p.faceY, transition: 'all 0.7s ease-in-out' }}>
          <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={purpleBlink} forceLookX={lookAway ? -4 : undefined} forceLookY={lookAway ? -4 : undefined} />
          <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={purpleBlink} forceLookX={lookAway ? -4 : undefined} forceLookY={lookAway ? -4 : undefined} />
        </div>
      </div>
      {/* Black middle */}
      <div ref={blackRef} style={{ position: 'absolute', bottom: 0, left: 190, width: 100, height: 260, backgroundColor: '#2D2D2D', borderRadius: '8px 8px 0 0', zIndex: 2, transform: `skewX(${b.bodySkew}deg)`, transformOrigin: 'bottom center', transition: 'all 0.7s ease-in-out' }}>
        <div style={{ position: 'absolute', display: 'flex', gap: 18, left: 20 + b.faceX, top: 28 + b.faceY, transition: 'all 0.2s ease-out' }}>
          <EyeBall size={14} pupilSize={5} maxDistance={3} eyeColor="white" pupilColor="#2D2D2D" isBlinking={blackBlink} />
          <EyeBall size={14} pupilSize={5} maxDistance={3} eyeColor="white" pupilColor="#2D2D2D" isBlinking={blackBlink} />
        </div>
      </div>
      {/* Orange semi-circle */}
      <div ref={orangeRef} style={{ position: 'absolute', bottom: 0, left: 0, width: 200, height: 160, backgroundColor: '#FF9B6B', borderRadius: '100px 100px 0 0', zIndex: 3, transform: `skewX(${o.bodySkew}deg)`, transformOrigin: 'bottom center', transition: 'transform 0.7s ease-in-out' }}>
        <div style={{ position: 'absolute', display: 'flex', gap: 24, left: 68 + o.faceX, top: 72 + o.faceY, transition: 'all 0.2s ease-out' }}>
          <Pupil size={10} maxDistance={4} pupilColor="#2D2D2D" />
          <Pupil size={10} maxDistance={4} pupilColor="#2D2D2D" />
        </div>
      </div>
      {/* Yellow rounded */}
      <div ref={yellowRef} style={{ position: 'absolute', bottom: 0, left: 260, width: 120, height: 190, backgroundColor: '#E8D754', borderRadius: '60px 60px 0 0', zIndex: 4, transform: `skewX(${y.bodySkew}deg)`, transformOrigin: 'bottom center', transition: 'transform 0.7s ease-in-out' }}>
        <div style={{ position: 'absolute', display: 'flex', gap: 18, left: 42 + y.faceX, top: 34 + y.faceY, transition: 'all 0.2s ease-out' }}>
          <Pupil size={10} maxDistance={4} pupilColor="#2D2D2D" />
          <Pupil size={10} maxDistance={4} pupilColor="#2D2D2D" />
        </div>
        <div style={{ position: 'absolute', width: 60, height: 3, background: '#2D2D2D', borderRadius: 2, left: 30 + y.faceX, top: 72 + y.faceY, transition: 'all 0.2s ease-out' }} />
      </div>
    </div>
  );
}

export default function AuthScreen({ onAuth, onLocal }) {
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '', college: '', dept: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [isTypingEmail, setIsTypingEmail] = useState(false);
  const [isTypingPassword, setIsTypingPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Fill in all fields'); return; }
    if (mode === 'register' && !form.name) { toast.error('Full name is required'); return; }
    
    setLoading(true);
    
    try {
      if (mode === 'register') {
        const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(userCred.user, { displayName: form.name });
        
        // Ensure local profile receives the additional registration fields
        mutateDB(d => {
          d.profile.name = form.name;
          if (form.college) d.profile.college = form.college;
          if (form.dept) d.profile.dept = form.dept;
        });
        
        toast.success('Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        toast.success('Welcome back to StudentOS!');
      }
      
      // onAuthStateChanged in store.js will handle the transition automatically.
      if (onAuth) onAuth();
      
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        toast.error('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        toast.error('Email is already registered.');
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
    <div className="auth-screen">
      {/* Left - Art */}
      <div className="auth-art">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
          <Characters isTypingEmail={isTypingEmail} isTypingPassword={isTypingPassword} showPassword={showPwd} />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', maxWidth: 320 }}>
            <p style={{ fontSize: '0.875rem' }}>Your academic command center. Track grades, build your career, and get AI-powered insights — all in one place.</p>
          </motion.div>
        </div>
        <div style={{ position: 'absolute', bottom: 24, display: 'flex', gap: 24, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
          <span>Privacy Policy</span><span>Terms</span><span>Contact</span>
        </div>
      </div>

      {/* Right - Form */}
      <div className="auth-form">
        <motion.div className="auth-form-inner" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
            <div className="sidebar-logo"><GraduationCap size={16} /></div>
            <StyledText text="StudentOS" style={{ fontSize: '1.25rem' }} />
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 6 }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 28 }}>
            {mode === 'login' ? 'Sign in to your workspace' : 'Start your academic journey'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'register' && (
              <>
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" placeholder="Tanvi Sharma" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div className="grid-2">
                  <div>
                    <label className="label">College</label>
                    <input className="input" placeholder="SRMIST" value={form.college} onChange={e => set('college', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Department</label>
                    <input className="input" placeholder="CSE" value={form.dept} onChange={e => set('dept', e.target.value)} />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@college.edu" value={form.email}
                onChange={e => set('email', e.target.value)}
                onFocus={() => setIsTypingEmail(true)}
                onBlur={() => setIsTypingEmail(false)}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  onFocus={() => setIsTypingPassword(true)}
                  onBlur={() => setIsTypingPassword(false)}
                  style={{ paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
              {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span className="text-faint" style={{ fontSize: '0.75rem' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <button onClick={onLocal} className="btn btn-secondary" style={{ width: '100%' }}>
            Continue without account
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: 20, color: 'var(--text3)' }}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              style={{ color: 'var(--violet2)', fontWeight: 500, cursor: 'pointer' }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
