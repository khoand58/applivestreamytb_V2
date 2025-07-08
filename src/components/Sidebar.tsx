import Link from 'next/link';
import {
  Clapperboard,
  Home,
  LayoutDashboard,
  User,
  LifeBuoy,
  Settings,
  PlayCircle, // Thêm icon cho logo
} from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'Trang chủ' },
  { href: '/live', icon: Clapperboard, label: 'Quản lý Live' },
  { href: '/pricing', icon: LayoutDashboard, label: 'Bảng giá' },
  { href: '/profile', icon: User, label: 'Cá nhân' },
  { href: '/support', icon: LifeBuoy, label: 'Hỗ trợ' },
  { href: '/settings', icon: Settings, label: 'Chính Sách & Điều khoản' },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col bg-[#23233c] p-4">
      {/* THAY ĐỔI: Thay thế h2 bằng Link chứa logo và tên */}
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2 text-white transition-opacity hover:opacity-80">
          <PlayCircle size={32} className="text-violet-400" />
          <span className="text-2xl font-bold">AutoLive</span>
        </Link>
      </div>
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="flex items-center rounded-lg p-2 text-gray-300 hover:bg-violet-500 hover:text-white"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
