import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBr8hMoYXUtbaYnhmzjwtkdnUqajbTytjY",
  authDomain: "escuela-biblica-ebd.firebaseapp.com",
  projectId: "escuela-biblica-ebd",
  storageBucket: "escuela-biblica-ebd.firebasestorage.app",
  messagingSenderId: "674299276602",
  appId: "1:674299276602:web:dcce06f6036b2ddbb1b403"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar los servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Exportar app también por si acaso
export default app;