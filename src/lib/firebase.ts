// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDfJTxWfi_HNRcp2ymyv4IeQXdkXDRaZpM",
  authDomain: "signinsignup-21bab.firebaseapp.com",
  projectId: "signinsignup-21bab",
  storageBucket: "signinsignup-21bab.firebasestorage.app",
  messagingSenderId: "142697259650",
  appId: "1:142697259650:web:56960063dca0504df18a9b",
  measurementId: "G-0MZ8BRDZ3Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { auth };
