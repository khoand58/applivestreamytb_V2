"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Kiểu dữ liệu cho người dùng trong DB của chúng ta
interface AppUser {
  _id: string;
  firebaseUid: string;
  email: string;
  currentPlan: string;
  planExpiresAt?: Date;
  maxStreams: number;
  role: string;
}

// SỬA LỖI: Đổi tên 'firebaseUser' thành 'user' để nhất quán
type AuthContextType = {
  user: FirebaseUser | null;
  appUser: AppUser | null; // Thêm người dùng từ DB
  loading: boolean;
  syncAppUser: () => void; // Thêm hàm để chủ động cập nhật
};

// SỬA LỖI: Cập nhật giá trị mặc định của context
const AuthContext = createContext<AuthContextType>({ 
    user: null, 
    appUser: null, 
    loading: true, 
    syncAppUser: () => {} 
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncAppUser = async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      try {
        const response = await fetch('http://localhost:4000/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: firebaseUser.email, uid: firebaseUser.uid }),
        });
        if (!response.ok) throw new Error('Failed to sync user data');
        const dbUser = await response.json();
        setAppUser(dbUser);
      } catch (error) {
        console.error("Lỗi khi đồng bộ người dùng:", error);
        setAppUser(null);
      }
    } else {
      setAppUser(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setUser(user);
      await syncAppUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, appUser, loading, syncAppUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
