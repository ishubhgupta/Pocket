import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCH_wDxMutSvpdYrZiusDc7Lv8OQz0XPmk",
  authDomain: "pocket-pii-manager.firebaseapp.com",
  projectId: "pocket-pii-manager",
  storageBucket: "pocket-pii-manager.firebasestorage.app",
  messagingSenderId: "435658783525",
  appId: "1:435658783525:web:b8ccd5daa60036be0478cc",
  measurementId: "G-4G6HJ422EK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
