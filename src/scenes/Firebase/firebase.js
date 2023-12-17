import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

//Storage
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  // Firebase configuration details
  apiKey: "AIzaSyBFYM_i2bk3L47g0b4_m7hY1aSJqEGP5W0",
  authDomain: "bold-listener-391506.firebaseapp.com",
  projectId: "bold-listener-391506",
  storageBucket: "bold-listener-391506.appspot.com",
  messagingSenderId: "683181548604",
  appId: "1:683181548604:web:cdc8331cace133ccc34f39",
  measurementId: "G-ZDQQ9X3Z61"
};

// Initialize Firebase with the provided configuration
const app = initializeApp(firebaseConfig);
// Create an auth instance to handle user authentication
export const auth = getAuth(app);
// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
