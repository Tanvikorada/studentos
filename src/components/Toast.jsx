import { useState, useEffect } from 'react';
import { toast } from '../store';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return toast.subscribe((t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id));
      }, 3500);
    });
  }, []);

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type} animate-fade`}>
          {t.type === 'success' && <CheckCircle size={16} />}
          {t.type === 'error' && <AlertCircle size={16} />}
          {t.type === 'info' && <Info size={16} />}
          <span style={{ flex: 1 }}>{t.msg}</span>
          <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            style={{ color: 'inherit', opacity: 0.6 }}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
