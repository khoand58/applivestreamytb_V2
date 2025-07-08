"use client";

import { useAuth } from "@/context/AuthContext"; // Import hook useAuth
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Topbar() {
  const { user, loading } = useAuth(); // Lấy thông tin user và trạng thái loading
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login'); // Chuyển về trang đăng nhập sau khi logout
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  return (
    <div className="h-16 bg-[#23233c] flex items-center justify-end p-4">
      {loading ? (
        <div>Đang tải...</div>
      ) : user ? (
        // Nếu đã đăng nhập, hiển thị email và nút Đăng xuất
        <div className="flex items-center gap-4">
          <span>{user.email}</span>
          <button
            onClick={handleLogout}
            className="rounded bg-red-500 px-3 py-1 text-sm font-bold text-white transition hover:bg-red-400"
          >
            Đăng xuất
          </button>
        </div>
      ) : (
        // Nếu chưa đăng nhập, hiển thị nút Đăng nhập / Đăng ký
        <div className="flex items-center gap-4">
          <Link href="/login" className="font-bold hover:text-violet-400">
            Đăng nhập
          </Link>
          <Link href="/register" className="rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-yellow-400">
            Đăng ký
          </Link>
        </div>
      )}
    </div>
  );
}