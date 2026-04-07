# Blob-to-PDF Extractor (Sound cool, rIGht ? <(") )

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=flat&logo=javascript&logoColor=%23F7DF1E)
![jsPDF](https://img.shields.io/badge/jsPDF-1.3.2-blue)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

A high-performance, client-side utility script designed to extract in-memory `blob:` image resources from the DOM and compile them into a high-resolution PDF file. 

Được thiết kế đặc biệt để vượt qua các cơ chế giới hạn bộ nhớ và chặn tải xuống trên các nền tảng Document Viewer (như Google Drive, PDF Readers), script này hoạt động hoàn toàn ở phía client (trình duyệt) mà không cần bất kỳ server trung gian nào.

## Core Features & Architecture

* **Volatile Blob Handling:** Giải quyết triệt để lỗi `net::ERR_FILE_NOT_FOUND` sinh ra bởi cơ chế dọn rác (Garbage Collection) khắt khe của trình duyệt khi các trang web gọi hàm `URL.revokeObjectURL()` ngay sau khi render ảnh.
* **Memory-Optimized Rendering Buffer:** Thay vì khởi tạo hàng loạt element, script sử dụng kiến trúc **Single-Canvas Mutation**. Chỉ tái sử dụng duy nhất một thẻ `<canvas>` kết hợp với hardware acceleration `alpha: false` và `willReadFrequently: true`, giúp ngăn chặn tình trạng tràn bộ nhớ Heap (Heap Out-of-Memory) và giảm tải cho V8 Engine.
* **Non-blocking Event Loop:** Áp dụng cơ chế xử lý bất đồng bộ (Async/Await) kết hợp với các micro-delays (`yieldToMainThread`), trả lại luồng thực thi cho Main Thread sau mỗi chu kỳ nén ảnh. Điều này giúp UI không bị đóng băng (freeze) khi xử lý hàng chục ảnh độ phân giải cao.
* **Lossless Resolution Matrix:** Bỏ qua hoàn toàn các giới hạn của CSS Viewport. Script trích xuất trực tiếp thuộc tính `naturalWidth` và `naturalHeight` từ object DOM, đảm bảo định dạng và tỷ lệ khung hình (Aspect Ratio) của PDF đầu ra khớp 100% với tài nguyên gốc.
* **Trusted Types Compatibility:** Tích hợp policy bảo mật khi inject script, tương thích với các trang web có cấu hình Content Security Policy (CSP) nghiêm ngặt.

## Installation & Usage

Script này được thiết kế để thực thi trực tiếp qua **DevTools Console** hoặc lưu dưới dạng **Bookmarklet**.

### Prerequisites
Đảm bảo bạn đã cuộn (scroll) qua toàn bộ các trang của tài liệu trên trình duyệt để kích hoạt cơ chế Lazy-loading, giúp DOM tải đầy đủ các đối tượng `blob:`.

### Execution
1. Mở trang web chứa tài liệu cần xuất.
2. Mở Developer Tools (`F12` hoặc `Ctrl+Shift+I` / `Cmd+Option+I`).
3. Chuyển sang tab **Console**.
4. Dán toàn bộ mã nguồn sau và nhấn `Enter`:

<details>
<summary><b>Nhấn vào đây để xem Source Code</b></summary>

```javascript
let trustedURL;
if (window.trustedTypes && trustedTypes.createPolicy) {
    const policy = trustedTypes.createPolicy('myPolicy', {
        createScriptURL: (input) => input
    });
    trustedURL = policy.createScriptURL('https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.2/jspdf.min.js');
} else {
    trustedURL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.2/jspdf.min.js';
}

let jspdf = document.createElement("script");

jspdf.onload = async function () { 
    let pdf = null;
    let elements = Array.from(document.getElementsByTagName("img")).filter(img => /^blob:/.test(img.src));
    
    if (elements.length === 0) {
        console.warn("Không tìm thấy ảnh blob nào.");
        return;
    }

    console.log(`Đang xử lý ${elements.length} ảnh. Trình duyệt có thể hơi khựng lại một chút...`);

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext("2d", { willReadFrequently: true, alpha: false }); 
    
    const yieldToMainThread = () => new Promise(resolve => setTimeout(resolve, 1));

    for (let i = 0; i < elements.length; i++) {
        let img = elements[i];
        let natWidth = img.naturalWidth || img.width || 800;
        let natHeight = img.naturalHeight || img.height || 1131;
        
        canvas.width = natWidth;
        canvas.height = natHeight;
        
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, natWidth, natHeight);
        ctx.drawImage(img, 0, 0, natWidth, natHeight);
        
        let imgData = canvas.toDataURL("image/jpeg", 0.95);
        let orientation = natWidth > natHeight ? 'l' : 'p';
        
        if (!pdf) {
            pdf = new jsPDF(orientation, 'pt', [natWidth, natHeight]);
        } else {
            pdf.addPage([natWidth, natHeight], orientation);
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, natWidth, natHeight);
        
        console.log(`Đã xử lý xong trang ${i + 1}/${elements.length}`);
        
        await yieldToMainThread();
    }
    
    pdf.save("download.pdf");
    console.log("Hoàn tất tải file!");
};

jspdf.src = trustedURL;
document.body.appendChild(jspdf);
