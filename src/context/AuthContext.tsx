"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Thêm interface Subscription
export interface Subscription {
  planId: string;
  purchasedAt?: string;
  expiresAt: string;
  _id?: string;
}

// Kiểu dữ liệu cho người dùng trong DB của chúng ta
export interface AppUser {
  _id: string;
  email: string;
  firebaseUid?: string;
  subscriptions: Subscription[];
  role: 'user' | 'admin';
  createdAt?: string;
  updatedAt?: string;
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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const syncAppUser = async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      try {
        const response = await fetch(`${API_URL}/api/auth/sync`, {
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

  // Fix: Cập nhật syncAppUser trong value để có thể gọi từ component
  const syncAppUserManually = () => {
    if (user) {
      syncAppUser(user);
    }
  };

  const value = { 
    user, 
    appUser, 
    loading, 
    syncAppUser: syncAppUserManually 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};