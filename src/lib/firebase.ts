// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDePhIQo26UglpRWYeYgLBU05TZzyMC3Ig",
  authDomain: "studio-112659148-adafd.firebaseapp.com",
  projectId: "studio-112659148-adafd",
  storageBucket: "studio-112659148-adafd.firebasestorage.app",
  messagingSenderId: "70521988102",
  appId: "1:70521988102:web:c2cd5633465ec71c1f0f87"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
