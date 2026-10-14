# GameScope Research

Ứng dụng web MVP nghiên cứu thị trường game: nhập câu hỏi, tìm nguồn web bằng Tavily, rồi dùng Anthropic Claude tổng hợp thành báo cáo tiếng Việt có dẫn nguồn.

## Yêu cầu

- Node.js 20 trở lên
- API key của [Tavily](https://app.tavily.com/) và [Anthropic](https://console.anthropic.com/)

## Chạy local

1. Cài dependencies:

   ```bash
   npm install
   ```

2. Sao chép `.env.example` thành `.env.local`, rồi điền API key:

   ```env
   TAVILY_API_KEY=your_tavily_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ANTHROPIC_MODEL=claude-opus-5-5
   ```

3. Khởi động ứng dụng:

   ```bash
   npm run dev
   ```

4. Mở [http://localhost:3000](http://localhost:3000).

Không đưa `.env.local` hoặc API key lên Git. Nếu thiếu cấu hình, API sẽ trả lỗi rõ ràng để giao diện hướng dẫn thiết lập.

## Khắc phục lỗi Anthropic `401 invalid x-api-key`

Nếu giao diện báo lỗi Anthropic và terminal hiển thị `401` cùng `invalid x-api-key`, request đã tới Anthropic nhưng credential gửi trong request không được chấp nhận. Đây là lỗi xác thực; đổi `ANTHROPIC_MODEL` thường không khắc phục được lỗi này. Tiền tố của key, kể cả `sk-ant-usr-`, không đủ để xác định key còn hợp lệ hay không.

1. Xác nhận ứng dụng dùng endpoint nào. Chạy trong PowerShell tại thư mục dự án:

   ```powershell
   node -e "const { loadEnvConfig } = require('@next/env'); loadEnvConfig(process.cwd()); const u = process.env.ANTHROPIC_BASE_URL; console.log(u ? new URL(u).host : 'api.anthropic.com (mặc định)')"
   ```

   Nếu không cấu hình `ANTHROPIC_BASE_URL`, Anthropic SDK dùng `api.anthropic.com`.

2. Kiểm tra PowerShell có biến key riêng ghi đè giá trị trong `.env.local` hay không. Không in giá trị key:

   ```powershell
   "Terminal có ANTHROPIC_API_KEY riêng: $([bool]$env:ANTHROPIC_API_KEY)"
   ```

   Nếu hiện `True`, xóa biến trong cửa sổ hiện tại rồi thử lại để Next.js dùng giá trị từ `.env.local`:

   ```powershell
   Remove-Item Env:ANTHROPIC_API_KEY
   ```

3. Kiểm tra [Anthropic Console](https://platform.claude.com/settings/keys) để xác nhận key còn active, được tạo cho Claude API và thuộc workspace đúng. Nếu key không gắn cố định với workspace, đặt `ANTHROPIC_WORKSPACE_ID` trong `.env.local` theo Workspace ID trong Console. Biến này là tùy chọn khi key đã được giới hạn vào workspace tương ứng.
4. Sau khi sửa `.env.local`, dừng `npm run dev` bằng `Ctrl+C` rồi khởi động lại để nạp cấu hình mới.
5. Nếu vẫn nhận `401`, tạo lại key trong Anthropic Console và cập nhật `.env.local`. Không chia sẻ key trong chat, log, ảnh chụp hoặc commit; thu hồi và thay key nếu đã bị lộ. Chỉ gửi trạng thái HTTP và loại lỗi khi cần nhờ hỗ trợ, không gửi nội dung credential.

## Test case thủ công

Chạy ứng dụng tại `http://localhost:3000` với `TAVILY_API_KEY` và `ANTHROPIC_API_KEY` hợp lệ. Mỗi test bên dưới thực hiện trên giao diện; kết quả tìm kiếm thực tế có thể thay đổi theo thời điểm và nguồn Tavily tìm được.

### TC-01 — Kết quả nhất quán, có nguồn

- **Mục tiêu:** Xác nhận phát hiện được hỗ trợ bởi nguồn và trích dẫn mở đúng trang.
- **Dữ liệu thử:** `Các nguồn độc lập đánh giá thế nào về xu hướng game mobile tại Việt Nam?`
- **Thao tác:** Nhập câu hỏi, đặt thị trường `Việt Nam`, thời gian `2024–2026`, rồi chọn **Tạo báo cáo**.
- **Kết quả mong đợi:** Báo cáo có phát hiện về xu hướng; phát hiện có số trích dẫn; phần **Nguồn tham khảo** liệt kê các nguồn; nhấn số trích dẫn mở URL tương ứng. Nếu nguồn tìm được không thống nhất thì ghi nhận theo TC-02 thay vì yêu cầu kết luận đồng thuận.

### TC-02 — Nguồn uy tín mâu thuẫn

- **Mục tiêu:** Đảm bảo báo cáo trình bày bằng chứng trái chiều, không gộp thành một con số/kết luận chắc chắn.
- **Dữ liệu thử:** `Ước tính doanh thu thị trường game Việt Nam năm gần nhất là bao nhiêu, và các nguồn uy tín có khác nhau không?`
- **Thao tác:** Nhập câu hỏi, đặt thị trường `Việt Nam`, thời gian `Năm gần nhất có dữ liệu`, rồi chọn **Tạo báo cáo**.
- **Kết quả mong đợi:** Nếu tìm thấy nguồn uy tín đưa ra số liệu khác nhau, báo cáo nêu riêng các ước tính, gắn nguồn cho từng phát hiện và mô tả khác biệt về thời kỳ, phạm vi, định nghĩa hoặc phương pháp khi nguồn cung cấp thông tin đó. Không khẳng định hai số đo tương đương nếu phương pháp khác nhau.
- **Lưu ý:** Nếu phiên tìm kiếm không có nguồn mâu thuẫn, ghi nhận `Không tái hiện được với nguồn hiện tại`; không coi việc cố tình yêu cầu AI bịa ra mâu thuẫn là đạt test.

### TC-03 — Chưa đủ bằng chứng để kết luận

- **Mục tiêu:** Xác nhận ứng dụng thừa nhận thiếu dữ liệu thay vì suy đoán.
- **Dữ liệu thử:** `Có bao nhiêu game indie tại Việt Nam đạt lợi nhuận trong năm gần nhất?`
- **Thao tác:** Nhập câu hỏi, đặt thị trường `Việt Nam`, thời gian `Năm gần nhất có dữ liệu`, rồi chọn **Tạo báo cáo**.
- **Kết quả mong đợi:** Nếu nguồn không đo trực tiếp lợi nhuận hoặc không đủ đại diện, phần tóm tắt/giới hạn dữ liệu nói rõ chưa thể kết luận; không khẳng định một tỷ lệ hoặc số lượng không được nguồn hỗ trợ. Có thể không có phát hiện cụ thể nếu thiếu bằng chứng.

### TC-04 — Câu hỏi ngoài phạm vi

- **Mục tiêu:** Kiểm tra guardrail chỉ cho phép nghiên cứu thị trường/ngành game điện tử.
- **Dữ liệu thử:** `Viết giúp tôi hàm JavaScript sắp xếp mảng.`
- **Thao tác:** Nhập câu hỏi rồi chọn **Tạo báo cáo**.
- **Kết quả mong đợi:** Hiện thông báo ứng dụng chỉ hỗ trợ câu hỏi nghiên cứu thị trường/ngành trò chơi điện tử; không hiển thị báo cáo hoặc nguồn web.

### TC-05 — API trả phản hồi thành công sai định dạng

- **Mục tiêu:** Xác nhận giao diện không dựng báo cáo từ payload thiếu trường bắt buộc.
- **Điều kiện:** Dùng Chrome DevTools trên `localhost`, mở tab **Console** và chạy đoạn sau trước khi gửi câu hỏi. Đoạn mã chỉ thay response cho `/api/research` trong tab hiện tại:

  ```js
  (() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = new URL(
        typeof input === "string" ? input : input.url,
        window.location.href,
      );
      if (url.pathname === "/api/research") {
        return new Response(
          JSON.stringify({
            report: { summary: "Payload cố ý thiếu các trường bắt buộc." },
            sources: [],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return originalFetch(input, init);
    };
  })();
  ```

- **Thao tác:** Trên cùng tab, nhập một câu hỏi nghiên cứu đủ 8 ký tự trở lên rồi chọn **Tạo báo cáo**.
- **Kết quả mong đợi:** Hiện lỗi `Máy chủ trả về báo cáo không đúng định dạng.`; không xuất hiện khu vực **Kết quả nghiên cứu**.
- **Khôi phục:** Tải lại trang để bỏ phần thay thế `fetch`.

## Guardrail nghiên cứu

- Mọi câu hỏi được phân loại trước khi tìm web; chỉ nghiên cứu thị trường/ngành trò chơi điện tử mới được đi tiếp.
- Yêu cầu ngoài phạm vi, yêu cầu hỗn hợp hoặc kết quả phân loại không hợp lệ đều bị từ chối an toàn; câu ngoài phạm vi không gọi Tavily.
- Sau khi tổng hợp, Claude xác minh phạm vi lần nữa trước khi API trả báo cáo. Phát hiện thực tế không có nguồn hợp lệ sẽ bị từ chối.
- Claude được yêu cầu nêu rõ các nguồn uy tín có kết quả mâu thuẫn, không ép thành một kết luận; khi bằng chứng chưa đủ, báo cáo phải nói rõ chưa thể kết luận.

## Phạm vi hiện tại

- Câu hỏi nghiên cứu tối đa 1.000 ký tự, kèm thị trường và giai đoạn tùy chọn.
- Tìm tối đa 8 nguồn bằng Tavily; Anthropic Claude tạo tóm tắt, phát hiện, hàm ý và giới hạn dữ liệu.
- Trích dẫn đánh số liên kết về nguồn gốc; khóa API chỉ được sử dụng trong API route phía máy chủ.
- Chưa có lưu lịch sử, đăng nhập, dashboard, hoặc xuất báo cáo.
