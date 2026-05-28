import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, runTransaction, addDoc, serverTimestamp, query, orderBy, limit, deleteDoc } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyDspurLc6vVjrhU41DZjcEi0WxjING0gts",
  authDomain: "studentos-ee3ab.firebaseapp.com",
  projectId: "studentos-ee3ab",
  storageBucket: "studentos-ee3ab.firebasestorage.app",
  messagingSenderId: "902135158685",
  appId: "1:902135158685:web:5e6dbd6e37e84bf77f4174"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, doc, setDoc, getDoc, onSnapshot, collection, runTransaction, addDoc, serverTimestamp, query, orderBy, limit, deleteDoc };

