export default function SettingsPage() {
  return (
    <div className="space-y-12">
      <h1 className="text-3xl font-bold">Chính Sách & Điều Khoản Dịch Vụ</h1>

      <section>
        <h2 className="mb-4 border-b border-gray-700 pb-2 text-2xl font-semibold">1. Điều khoản sử dụng</h2>
        <div className="space-y-4 text-gray-300">
          <p>Chào mừng bạn đến với AutoLive. Bằng việc sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu dưới đây.</p>
          <p>Bạn có trách nhiệm bảo mật thông tin tài khoản và khóa luồng (stream key) của mình. Chúng tôi không chịu trách nhiệm cho bất kỳ tổn thất nào phát sinh từ việc bạn làm lộ thông tin này.</p>
          <p>Nghiêm cấm sử dụng dịch vụ để phát tán nội dung vi phạm pháp luật, bản quyền, hoặc các nội dung bạo lực, khiêu dâm, thù địch.</p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 border-b border-gray-700 pb-2 text-2xl font-semibold">2. Chính sách bảo mật</h2>
        <div className="space-y-4 text-gray-300">
          <p>Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn. Chúng tôi chỉ thu thập các thông tin cần thiết cho việc cung cấp dịch vụ, bao gồm email và lịch sử giao dịch.</p>
          <p>Chúng tôi không chia sẻ thông tin cá nhân của bạn với bất kỳ bên thứ ba nào, trừ khi có yêu cầu từ cơ quan pháp luật.</p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 border-b border-gray-700 pb-2 text-2xl font-semibold">3. Chính sách hoàn tiền</h2>
        <div className="space-y-4 text-gray-300">
          <p>Dịch vụ của chúng tôi là dịch vụ kỹ thuật số, do đó chúng tôi không áp dụng chính sách hoàn tiền sau khi gói cước đã được kích hoạt thành công.</p>
          <p>Trong trường hợp dịch vụ gặp lỗi nghiêm trọng từ phía chúng tôi và không thể khắc phục, chúng tôi sẽ xem xét bồi thường thời gian sử dụng tương ứng cho khách hàng.</p>
        </div>
      </section>
    </div>
  );
}
