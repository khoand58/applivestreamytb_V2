"use client"; // Bắt buộc phải có dòng này ở trên cùng

import { useState } from 'react';
import { auth } from '@/lib/firebase'; // Import auth từ file firebase.ts
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault(); // Ngăn form tự tải lại trang
    setError(null); // Xóa lỗi cũ

    try {
      // Dùng hàm của Firebase để tạo user mới
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
      router.push('/login'); // Chuyển hướng đến trang đăng nhập sau khi thành công
    } catch (error: any) {
      // Xử lý và hiển thị lỗi nếu có
      console.error(error.message);
      setError(error.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-xs rounded-lg bg-[#23233c] p-6 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold">Đăng Ký Tài Khoản</h1>
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-bold text-gray-300" htmlFor="email">
              Email
            </label>
            <input
              className="focus:shadow-outline w-full appearance-none rounded border border-gray-600 bg-gray-700 px-3 py-2 leading-tight text-white shadow focus:outline-none"
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-300" htmlFor="password">
              Mật khẩu
            </label>
            <input
              className="focus:shadow-outline w-full appearance-none rounded border border-gray-600 bg-gray-700 px-3 py-2 leading-tight text-white shadow focus:outline-none"
              id="password"
              type="password"
              placeholder="******************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="mb-4 text-center text-sm text-red-500">{error}</p>}
          <div className="flex items-center justify-between">
            <button
              className="focus:shadow-outline w-full rounded-full bg-yellow-500 px-4 py-2 font-bold text-black transition hover:bg-yellow-400 focus:outline-none"
              type="submit"
            >
              Đăng Ký
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}