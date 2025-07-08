import { Mail, Phone, MessageSquare } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Trung Tâm Hỗ Trợ</h1>
      <p className="text-lg text-gray-400">
        Chúng tôi luôn sẵn sàng giải đáp mọi thắc mắc và hỗ trợ bạn. Vui lòng liên hệ với chúng tôi qua các kênh dưới đây.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-[#23233c] p-6">
          <Phone className="mb-4 h-10 w-10 text-violet-400" />
          <h2 className="text-xl font-semibold">Zalo / Điện thoại</h2>
          <p className="mt-2 text-gray-300">0585.000.050</p>
          <p className="text-sm text-gray-500">Hỗ trợ nhanh nhất cho các vấn đề khẩn cấp.</p>
        </div>
        <div className="rounded-lg bg-[#23233c] p-6">
          <Mail className="mb-4 h-10 w-10 text-violet-400" />
          <h2 className="text-xl font-semibold">Email</h2>
          <p className="mt-2 text-gray-300">anhnhibatonmedia@gmail.com</p>
          <p className="text-sm text-gray-500">Phản hồi trong vòng 24 giờ làm việc.</p>
        </div>
        <div className="rounded-lg bg-[#23233c] p-6">
          <MessageSquare className="mb-4 h-10 w-10 text-violet-400" />
          <h2 className="text-xl font-semibold">Fanpage Facebook</h2>
          <a href="#" className="mt-2 text-blue-400 hover:underline">https://www.facebook.com/nhivienkow</a>
          <p className="text-sm text-gray-500">Theo dõi cập nhật và gửi tin nhắn cho chúng tôi.</p>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Các câu hỏi thường gặp (FAQ)</h2>
        <div className="space-y-4">
          <details className="group rounded-lg bg-[#23233c] p-4">
            <summary className="cursor-pointer font-semibold list-none flex justify-between items-center">
              Làm thế nào để bắt đầu một luồng live?
              <span className="transition-transform group-open:rotate-180">▼</span>
            </summary>
            <p className="mt-4 text-gray-400">
              Để bắt đầu, bạn cần mua một gói dịch vụ phù hợp tại trang "Bảng giá". Sau đó, vào mục "Quản lý Live", điền đầy đủ thông tin như Khóa luồng (Stream Key), Link video nguồn và nhấn "Bắt đầu".
            </p>
          </details>
          <details className="group rounded-lg bg-[#23233c] p-4">
            <summary className="cursor-pointer font-semibold list-none flex justify-between items-center">
              Tôi đã thanh toán nhưng gói chưa được kích hoạt?
              <span className="transition-transform group-open:rotate-180">▼</span>
            </summary>
            <p className="mt-4 text-gray-400">
              Thông thường, gói sẽ được kích hoạt trong vòng 5 phút sau khi admin xác nhận. Nếu quá thời gian này, vui lòng liên hệ ngay với chúng tôi qua Zalo/SĐT để được hỗ trợ xử lý ngay lập tức.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
