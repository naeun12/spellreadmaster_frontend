// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
//import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAQy92C6NyXM2Fv24xg89-L2QMRKP7aaSM",
  authDomain: "spellread-master.firebaseapp.com",
  projectId: "spellread-master",
  storageBucket: "spellread-master.firebasestorage.app",
  messagingSenderId: "368348466603",
  appId: "1:368348466603:web:807fb1daeba74e320dd6ee",
  measurementId: "G-QS6DRHDDB1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, createUserWithEmailAndPassword, doc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc };
export { serverTimestamp };
//const analytics = getAnalytics(app);