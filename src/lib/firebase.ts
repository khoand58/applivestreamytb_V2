import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// DÁN ĐỐI TƯỢNG firebaseConfig CỦA BẠN VÀO ĐÂY
const firebaseConfig = {
  apiKey: "AIzaSyBmKQ27dBxK2hrjkNr93yiMVxpp24aggg8",
  authDomain: "autolive-service-app.firebaseapp.com",
  projectId: "autolive-service-app",
  storageBucket: "autolive-service-app.firebasestorage.app",
  messagingSenderId: "412644488937",
  appId: "1:412644488937:web:f01fe14150ec2279f42278",
  measurementId: "G-280PTWHPPQ"
};

// Khởi tạo Firebase App một cách an toàn
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Lấy và xuất ra dịch vụ Authentication
const auth = getAuth(app);
export { auth };