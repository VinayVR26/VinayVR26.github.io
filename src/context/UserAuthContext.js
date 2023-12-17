// Write the context API (watch a video from Dipesh Malvia to know more) to have the authentication

// In UserAuthContext.js, the Context API is used to manage and provide user authentication state and related functions throughout the React application. The Context API is a feature in React that allows data to be passed through the component tree without having to pass it down explicitly through props.

import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../scenes/Firebase/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Create a context for user authentication. In this specific file, the Context API is used to create an authentication context using the createContext function from React. The userAuthContext object is created as the context. This context will be accessible by any component that consumes it, regardless of its position in the component tree. This is useful when multiple components need access to the same data or functions without having to pass them through props at every level.
const userAuthContext = createContext();

// The UserAuthContextProvider component is a provider component that wraps the entire application. It is responsible for providing the authentication context to all of its descendants. The provider takes care of managing the authentication state and authentication-related functions, such as logging in, signing up, logging out, and Google sign-in. These functions are defined using Firebase Authentication methods.
export function UserAuthContextProvider({ children }) {
  const [user, setUser] = useState({});
  const navigate = useNavigate();

  // Functions to handle user authentication using Firebase Authentication methods
  function logIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }


  async function signUp(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Send the verification email after successful signup
      await sendEmailVerification(userCredential.user);
      return userCredential;
    } catch (error) {
      throw error;
    }
  }
  
  function logOut() {
    return signOut(auth);
  }
  function googleSignIn() {
    const googleAuthProvider = new GoogleAuthProvider();
    return signInWithPopup(auth, googleAuthProvider);
  }
  function resetPassword(email){
    return sendPasswordResetEmail(auth, email);
  }

  /* Function to update the user's profile with the provided username
  async function updateUserProfile(user, username) {
    try {
      // You can use the updateProfile function from Firebase Authentication
      // to update the user's display name with the provided username.
      // The updateProfile function returns a Promise, so you can await it.
      await updateProfile(user, {
        displayName: username,
      });
    } catch (error) {
      throw error;
    }
  } 
  
  */

 

  // useEffect sets up an observer to track authentication state changes. The useEffect hook in the UserAuthContextProvider sets up an observer with onAuthStateChanged. This observer listens for changes in the user's authentication state (e.g., logging in, logging out). When the authentication state changes, it updates the user state using setUser, and this updated value is provided by the userAuthContext.Provider.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser);

        // Check if the user's email is already present in the Firestore database
        const userEmail = currentUser.email;
        const userDocRef = doc(db, "users", userEmail);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          // If the user's email is not present, add it to the Firestore database
          await setDoc(userDocRef, {
            email: userEmail,
            // You can add additional user data to the Firestore document as needed
            // For example: username, user ID, etc.
          });
          
          navigate("/create-profile");
        }
      } else {
        setUser({});
      }
    });

    return () => {
      unsubscribe();
    };
  }, [navigate]);



  // Provide authentication context to the app using userAuthContext.Provider
  return (
    <userAuthContext.Provider
      value={{ user, logIn, signUp, logOut, googleSignIn, resetPassword }}
    >
      {children}
    </userAuthContext.Provider>
  );
}

// Custom hook to access the authentication context. Now, any component within the application can access the authentication state and functions by using the useUserAuth hook, which consumes the context using useContext(userAuthContext). This hook is provided by the UserAuthContext.js file and allows components to interact with the authentication state and functions without having to pass them through props manually.
export function useUserAuth() {
  return useContext(userAuthContext);
}


// By using the Context API, you centralize the authentication state and functions, making them easily accessible and manageable across different parts of the application, without the need for deeply nested prop passing. It provides a clean and efficient way to handle global state in React applications.