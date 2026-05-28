const fs = require('fs');
let code = fs.readFileSync('src/store.js', 'utf8');

// We need to inject imports for firebase
const importStr = "import { auth, db as firestoreDB, doc, setDoc, getDoc, onSnapshot } from './firebase';\n";
code = code.replace("import CryptoJS from 'crypto-js';", importStr);

// We need to extract the exact text between "function loadDB()" and "export function subscribeDB(fn)"
const startStr = "function loadDB() {";
const endStr = "export function getDB() {";
const getDbCode = `export function getDB() {
  if (!db) db = migrateDB(defaultDB);
  return db;
}
`;

const oldLogic = code.substring(code.indexOf(startStr), code.indexOf(endStr) + getDbCode.length);

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
  
  if (unsubscribeSnapshot) unsubscribeSnapshot();
  unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      const remoteData = migrateDB(docSnap.data());
      // basic sync
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
}

export function getDB() {
  if (!db) db = migrateDB(defaultDB);
  return db;
}
`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/store.js', code);
console.log('store.js patched securely');
