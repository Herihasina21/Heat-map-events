import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCxMVe85_1YtY3S0bdibDPeWGmWu2oaxxc",
  authDomain: "heat-map-events-ef48d.firebaseapp.com",
  projectId: "heat-map-events-ef48d",
  storageBucket: "heat-map-events-ef48d.firebasestorage.app",
  messagingSenderId: "127371006450",
  appId: "1:127371006450:web:7341ec911bd2a254f5db6b",
  measurementId: "G-Y1K5QKFC5P"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);