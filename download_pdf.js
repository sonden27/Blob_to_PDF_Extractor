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