import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAZfJFEkeJiJqo-7JTA2xjXgv97tXmivNM",
  authDomain: "gyftalala-v1.firebaseapp.com",
  databaseURL:
    "https://gyftalala-v1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gyftalala-v1",
  storageBucket: "gyftalala-v1.firebasestorage.app",
  messagingSenderId: "588748871430",
  appId: "1:588748871430:web:5ed30035577a085f94f087",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const rtdb = getDatabase(app);

export { db, auth, storage, rtdb };
