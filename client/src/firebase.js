// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // Import getAuth

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAvmlhgXfzsvGepjAnTg1IrOXbm6p7VDeE",
  authDomain: "signpdf-f4ff2.firebaseapp.com",
  projectId: "signpdf-f4ff2",
  storageBucket: "signpdf-f4ff2.firebasestorage.app",
  messagingSenderId: "154704879141",
  appId: "1:154704879141:web:92c36ec6063ca77c17a9cc",
  measurementId: "G-ZJK2193BG5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app); // Export the auth instance