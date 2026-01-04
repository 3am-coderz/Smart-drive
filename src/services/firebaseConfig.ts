import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyD7dEziODl92Ip1_WGMEQZfYEoaVAFU9Us",
    authDomain: "tour-b15a4.firebaseapp.com",
    databaseURL: "https://tour-b15a4-default-rtdb.firebaseio.com/",
    projectId: "tour-b15a4",
    storageBucket: "tour-b15a4.firebasestorage.app",
    messagingSenderId: "583069041570",
    appId: "1:583069041570:web:92215a83440869250ce8fb",
    measurementId: "G-HGZKR84HT4"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
