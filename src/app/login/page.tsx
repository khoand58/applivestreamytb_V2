"use client"; // Bắt buộc

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth'; // Dùng hàm đăng nhập
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      // Dùng hàm của Firebase để đăng nhập
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Đăng nhập thành công:', userCredential.user);
      router.push('/'); // Chuyển về trang chủ sau khi đăng nhập thành công
    } catch (error: any) {
      console.error(error.message);
      setError("Email hoặc mật khẩu không đúng.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-xs rounded-lg bg-[#23233c] p-6 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold">Đăng Nhập</h1>
        <form onSubmit={handleLogin}>
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
          <div className="flex flex-col items-center justify-between gap-4">
            <button
              className="focus:shadow-outline w-full rounded-full bg-yellow-500 px-4 py-2 font-bold text-black transition hover:bg-yellow-400 focus:outline-none"
              type="submit"
            >
              Đăng Nhập
            </button>
            <Link href="/register" className="inline-block align-baseline text-sm text-gray-400 hover:text-white">
              Chưa có tài khoản? Đăng ký
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}