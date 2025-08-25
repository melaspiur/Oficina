// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJTWFDM421pUDAjaR5c4wchlywO7Tu38E",
  authDomain: "oficina-72505.firebaseapp.com",
  projectId: "oficina-72505",
  storageBucket: "oficina-72505.appspot.com",
  messagingSenderId: "764425604004",
  appId: "1:764425604004:web:e2a3f3b4c5d6e7f8a9b0c1"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
