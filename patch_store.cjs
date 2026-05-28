const fs = require('fs');
let code = fs.readFileSync('src/store.js', 'utf8');

// We need to inject imports for firebase
const importStr = "import { auth, db as firestoreDB, doc, setDoc, getDoc, onSnapshot } from './firebase';\n";
code = code.replace("import CryptoJS from 'crypto-js';", importStr);

const oldLogic = `function loadDB() {
  if (!SECRET_KEY) return db || defaultDB;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const bytes = CryptoJS.AES.decrypt(saved, SECRET_KEY);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        if (decryptedData) {
          const parsed = JSON.parse(decryptedData);
          db = migrateDB(parsed);
        } else {
          throw new Error('Decryption failed, might be plain text');
        }
      } catch (err) {
        throw new Error('Decryption failed');
      }
    } else {
      db = migrateDB(defaultDB);
    }
  } catch (e) {
    throw e;
  }
  if (!db.productivity || db.productivity.length < 50) {
    db.productivity = generateProductivityData();
  }
  return db;
}

function generateProductivityData() {
  const data = [];
  const now = new Date();
  for (let i = 119; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 8);
    if (count > 0) data.push({ date: dateStr, count });
  }
  return data;
}

function saveDB() {
  if (SECRET_KEY) {
    try {
      const jsonString = JSON.stringify(db);
      const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
      localStorage.setItem(STORAGE_KEY, encrypted);
    } catch (e) {
      console.error('Save failed:', e);
    }
  }
  stateListeners.forEach(fn => fn(db));
}

export function unlockDB(password) {
  SECRET_KEY = password;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      loadDB();
    } else {
    db = migrateDB(defaultDB);
      saveDB();
    }
    stateListeners.forEach(fn => fn(db));
    return true;
  } catch (err) {
    SECRET_KEY = null;
    return false;
  }
}

export function lockDB() {
  SECRET_KEY = null;
      db = migrateDB(defaultDB);
  stateListeners.forEach(fn => fn(db));
}`;

const newLogic = `let firebaseUid = null;
let saveTimeout = null;
let unsubscribeSnapshot = null;

function generateProductivityData() {
  const data = [];
  const now = new Date();
  for (let i = 119; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 8);
    if (count > 0) data.push({ date: dateStr, count });
  }
  return data;
}

function saveDB() {
  stateListeners.forEach(fn => fn(db));
  
  if (firebaseUid) {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      try {
        await setDoc(doc(firestoreDB, 'users', firebaseUid), db);
      } catch (e) {
        console.error('Failed to sync to cloud', e);
      }
    }, 1500); // 1.5s debounce
  } else if (SECRET_KEY) {
    // Local fallback
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
}

export async function initFirebaseUser(uid, userObj) {
  firebaseUid = uid;
  const userRef = doc(firestoreDB, 'users', uid);
  
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      db = migrateDB(snap.data());
    } else {
      db = migrateDB(defaultDB);
      if (userObj?.displayName) db.profile.name = userObj.displayName;
      if (userObj?.email) db.resumeData.basics.email = userObj.email;
      await setDoc(userRef, db);
    }
  } catch(e) {
    console.error(e);
    db = migrateDB(defaultDB);
  }
  
  if (!db.productivity || db.productivity.length < 50) {
    db.productivity = generateProductivityData();
  }
  
  stateListeners.forEach(fn => fn(db));
  
  // Real-time listener from cloud (for multiplayer/sync across devices)
  if (unsubscribeSnapshot) unsubscribeSnapshot();
  unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      const remoteData = migrateDB(docSnap.data());
      // We only want to apply remote updates if they are new, but for now simple overwrite
      // In a real app we'd diff, but this works for simple sync
      // Actually, if we just saved it, this snapshot will trigger again.
      // We will skip overriding local state blindly to avoid UI jumping, unless we really need it.
      // For now, we omit real-time pulling of everything to avoid input losing focus.
    }
  });
}

export function unlockDB(password) {
  SECRET_KEY = password;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      db = migrateDB(JSON.parse(saved));
    } else {
      db = migrateDB(defaultDB);
      saveDB();
    }
    if (!db.productivity || db.productivity.length < 50) {
      db.productivity = generateProductivityData();
    }
    stateListeners.forEach(fn => fn(db));
    return true;
  } catch (err) {
    SECRET_KEY = null;
    return false;
  }
}

export function lockDB() {
  SECRET_KEY = null;
  firebaseUid = null;
  if (unsubscribeSnapshot) unsubscribeSnapshot();
  db = migrateDB(defaultDB);
  stateListeners.forEach(fn => fn(db));
}`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/store.js', code);
console.log('store.js updated for Firebase');
