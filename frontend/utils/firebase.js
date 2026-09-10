import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "cortexai-b5a96.firebaseapp.com",
  projectId: "cortexai-b5a96",
  storageBucket: "cortexai-b5a96.firebasestorage.app",
  messagingSenderId: "766308304383",
  appId: "1:766308304383:web:c84b509cf8194e6f5d93ca",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();