import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Hash, Plus, MessageSquare, Paperclip, Send, Globe, Lock, Trash2, Link } from 'lucide-react';
import { useDB } from '../store';
import { auth, db as firestoreDB, collection, onSnapshot, doc, setDoc, addDoc, serverTimestamp, query, orderBy, limit, deleteDoc } from '../firebase';

export default function StudyRooms() {
  const db = useDB();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState('');
  const [draftMsg, setDraftMsg] = useState('');
  const [draftLink, setDraftLink] = useState('');
  const chatEndRef = useRef(null);

  // Load Rooms
  useEffect(() => {
    try {
      const q = query(collection(firestoreDB, 'communityHubs'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, snap => {
        const fetched = [];
        snap.forEach(d => fetched.push({ id: d.id, ...d.data() }));
        setRooms(fetched);
        setLoading(false);
      }, (err) => {
        console.error("Rooms snapshot error:", err);
        setRooms([]);
        setLoading(false);
      });
      return () => unsub();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  // Load Messages for Active Room
  useEffect(() => {
    if (!activeRoom) { setMessages([]); return; }
    try {
      const msgsRef = collection(firestoreDB, 'communityHubs', activeRoom.id, 'messages');
      const q = query(msgsRef, orderBy('createdAt', 'asc'), limit(150));
      const unsub = onSnapshot(q, snap => {
        const msgs = [];
        snap.forEach(d => msgs.push({ id: d.id, ...d.data() }));
        setMessages(msgs);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }, (err) => {
        console.error('Failed to load messages', err);
        setMessages([{ id: 'error', text: 'Error connecting to live hub. Please sign in.', userName: 'System', avatar: '!' }]);
      });
      return () => unsub();
    } catch (e) {
      console.error('Failed to load messages', e);
    }
  }, [activeRoom]);

  const createHub = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const isPrivate = newRoomName.toLowerCase().includes('private');
    
    try {
      await addDoc(collection(firestoreDB, 'communityHubs'), {
        name: newRoomName.trim(),
        createdBy: auth.currentUser?.uid || 'local',
        createdAt: serverTimestamp(),
        isPrivate
      });
      setNewRoomName('');
    } catch (err) {
      console.error("Create hub failed", err);
      alert("Failed to create hub. Ensure you are signed in.");
    }
  };

  const deleteHub = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this hub?")) return;
    try {
      await deleteDoc(doc(firestoreDB, 'communityHubs', id));
      if (activeRoom?.id === id) setActiveRoom(null);
    } catch (err) {
      alert("You don't have permission to delete this hub.");
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!draftMsg.trim() && !draftLink.trim()) return;
    if (!activeRoom) return;
    
    const user = auth.currentUser;
    if (!user) { alert("Please sign in to send messages."); return; }

    try {
      await addDoc(collection(firestoreDB, 'communityHubs', activeRoom.id, 'messages'), {
        text: draftMsg.trim(),
        link: draftLink.trim(),
        userId: user.uid,
        userName: db.profile.name || user.displayName || 'Student',
        avatar: (db.profile.name || 'S')[0],
        createdAt: serverTimestamp()
      });
      setDraftMsg('');
      setDraftLink('');
    } catch (err) {
      console.error(err);
      alert("Failed to send message.");
    }
  };

  return (
    <div className="study-rooms" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={24} color="var(--violet)" /> Study Rooms & Hubs
        </h2>
        <form onSubmit={createHub} style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="New class or study group name..." value={newRoomName} onChange={e => setNewRoomName(e.target.value)} style={{ width: 250 }} />
          <button type="submit" className="btn btn-primary btn-icon"><Plus size={16}/></button>
        </form>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 20, minHeight: 0 }}>
        {/* Sidebar - Rooms List */}
        <div className="card" style={{ width: 300, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text2)' }}>
            Your Hubs
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {loading ? (
              <div className="empty-state text-faint" style={{ padding: 20 }}>Loading hubs...</div>
            ) : rooms.length === 0 ? (
              <div className="empty-state text-faint" style={{ padding: 20, fontSize: '0.85rem' }}>No hubs created yet. Create one for your class!</div>
            ) : (
              rooms.map(r => (
                <div 
                  key={r.id}
                  onClick={() => setActiveRoom(r)}
                  className={`room-item ${activeRoom?.id === r.id ? 'active' : ''}`}
                  style={{ padding: '12px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: activeRoom?.id === r.id ? 'var(--surface2)' : 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500, overflow: 'hidden' }}>
                    {r.isPrivate ? <Lock size={16} className="text-faint"/> : <Hash size={16} className="text-faint" />}
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                  </div>
                  {activeRoom?.id === r.id && (
                    <Trash2 size={14} className="text-faint hover-red" onClick={(e) => deleteHub(r.id, e)} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat / Resources Area */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          {activeRoom ? (
            <>
              {/* Hub Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface2)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--violet-dim)', color: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{activeRoom.name}</div>
                  <div className="text-faint" style={{ fontSize: '0.8rem' }}>Share notes, jobs, and chat with your peers.</div>
                </div>
              </div>

              {/* Messages Area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {messages.length === 0 ? (
                  <div className="empty-state text-faint" style={{ margin: 'auto' }}>No resources or messages shared yet. Be the first!</div>
                ) : (
                  messages.map(msg => {
                    const isSystem = msg.userName === 'System';
                    const isSelf = msg.userId === auth.currentUser?.uid;
                    
                    return (
                      <div key={msg.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', alignSelf: isSystem ? 'center' : 'flex-start', width: isSystem ? '100%' : 'auto' }}>
                        {!isSystem && (
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: isSelf ? 'var(--violet)' : 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: isSelf ? '#fff' : 'var(--text)' }}>
                            {msg.avatar}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0, textAlign: isSystem ? 'center' : 'left' }}>
                          {!isSystem && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{msg.userName}</span>
                              {msg.createdAt?.toDate && <span className="text-faint" style={{ fontSize: '0.75rem' }}>{msg.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                            </div>
                          )}
                          <div style={{ background: isSystem ? 'transparent' : 'var(--surface2)', color: isSystem ? '#ec4899' : 'var(--text)', padding: isSystem ? 0 : '10px 14px', borderRadius: isSystem ? 0 : '0 12px 12px 12px', fontSize: '0.95rem', wordBreak: 'break-word', display: 'inline-block', maxWidth: isSystem ? '100%' : '800px' }}>
                            {msg.text}
                          </div>
                          {msg.link && (
                            <a href={msg.link} target="_blank" rel="noopener noreferrer" className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, marginTop: 8, background: 'var(--surface)', textDecoration: 'none', color: 'inherit', maxWidth: 400 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--mint-dim)', color: 'var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Link size={18} />
                              </div>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Resource Link</div>
                                <div className="text-faint" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.link}</div>
                              </div>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={sendMessage} style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      className="input" 
                      placeholder="Share a resource link (optional)..." 
                      value={draftLink} 
                      onChange={e => setDraftLink(e.target.value)} 
                      style={{ flex: 1 }} 
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      className="input" 
                      placeholder="Type a message or description..." 
                      value={draftMsg} 
                      onChange={e => setDraftMsg(e.target.value)} 
                      style={{ flex: 2 }} 
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }}>
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="empty-state" style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
                <Users size={32} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px' }}>Select a Hub</h3>
                <p className="text-muted" style={{ margin: 0, maxWidth: 300, fontSize: '0.9rem' }}>Choose a hub from the sidebar or create a new one to start collaborating.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
