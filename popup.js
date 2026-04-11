// dict for multi-language
const dict = {
    en: {
        title: "Document Extractor Vjp Pro",
        quality: "Quality",
        pageRange: "Page Range:",
        format: "Format:",
        optPdf: "📄 Single PDF Document",
        optZip: "🗂️ ZIP Archive (All Images)",
        grayscale: "Grayscale Mode",
        autoScroll: "Auto-scroll to load hidden images",
        startBtn: "Extract Range",
        extractAllBtn: "Download ALL",
        stopBtn: "Stop",
        statusInit: "Initializing...",
        msgConnecting: "Connecting to tab...",
        msgAborted: "Process aborted by user.",
        msgTryAgain: "Try Again",
        msgFinished: "Finished!",
        msgNoImages: "❌ No document images found in specified range.",
        msgExtracted: "Successfully extracted your files!"
    },
    vi: {
        title: "Document Extractor Vjp Pro",
        quality: "Độ nét",
        pageRange: "Khoảng trang:",
        format: "Định dạng:",
        optPdf: "📄 Gộp thành 1 file PDF",
        optZip: "🗂️ File nén ZIP (Tải toàn bộ)",
        grayscale: "Ảnh Đen Trắng",
        autoScroll: "Tự động cuộn trang",
        startBtn: "Tải Tùy Chọn",
        extractAllBtn: "Tải TẤT CẢ",
        stopBtn: "Dừng Khẩn Cấp",
        statusInit: "Đang khởi tạo...",
        msgConnecting: "Đang kết nối...",
        msgAborted: "Đã hủy tiến trình.",
        msgTryAgain: "Thử Lại",
        msgFinished: "Hoàn tất!",
        msgNoImages: "❌ Không tìm thấy ảnh tài liệu nào.",
        msgExtracted: "Đã trích xuất tài liệu thành công!"
    }
};

let currentLang = localStorage.getItem('extLang') || 'en'; 

function applyLanguage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[lang][key]) el.innerText = dict[lang][key];
    });
    document.getElementById('startPage').placeholder = lang === 'en' ? 'Start' : 'Từ';
    document.getElementById('endPage').placeholder = lang === 'en' ? 'End' : 'Đến';
    document.getElementById('langToggle').innerText = lang === 'en' ? '🇻🇳 VN' : '🇬🇧 EN';
}

applyLanguage(currentLang);

document.getElementById('langToggle').addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'vi' : 'en';
    localStorage.setItem('extLang', currentLang);
    applyLanguage(currentLang);
});

const slider = document.getElementById('qualitySlider');
const qualityText = document.getElementById('qualityText');
slider.addEventListener('input', function() {
    qualityText.innerText = Math.round(this.value * 100) + '%';
});

// UI updates from content script
chrome.runtime.onMessage.addListener((message) => {
    if (message.status) document.getElementById('statusText').innerText = message.status;
    if (message.total && message.current !== undefined) {
        let percent = (message.current / message.total) * 100;
        document.getElementById('progressFill').style.width = `${percent}%`;
    }
    if (message.complete || message.error) {
        document.getElementById('primaryButtons').style.display = 'flex';
        document.getElementById('stopBtn').style.display = 'none';
        
        if(message.error) {
            document.getElementById('startBtn').innerText = dict[currentLang].msgTryAgain;
            document.getElementById('extractAllBtn').innerText = dict[currentLang].msgTryAgain;
        } else {
            applyLanguage(currentLang);
        }
    }
});

document.getElementById('stopBtn').addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => { window.abortExtraction = true; } });
});

async function startExtractionProcess(isDownloadAll) {
    const config = {
        quality: parseFloat(slider.value),
        format: document.getElementById('outputFormat').value,
        autoScroll: document.getElementById('autoScroll').checked,
        grayscale: document.getElementById('grayscale').checked,
        startPage: isDownloadAll ? null : (parseInt(document.getElementById('startPage').value) || null),
        endPage: isDownloadAll ? null : (parseInt(document.getElementById('endPage').value) || null),
        lang: currentLang,
        dict: dict[currentLang]
    };
    
    document.getElementById('primaryButtons').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'block';
    document.getElementById('progressBox').style.display = 'block';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('statusText').innerText = dict[currentLang].msgConnecting;

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    //offline libraries
    let libraryFiles = config.format === 'zip' ? ['jszip.min.js'] : ['jspdf.min.js'];
    
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: libraryFiles
    }, () => {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: executeExtraction,
            args: [config] 
        });
    });
}
document.getElementById('startBtn').addEventListener('click', () => startExtractionProcess(false));
document.getElementById('extractAllBtn').addEventListener('click', () => startExtractionProcess(true));

// main function
// =====================================================================
// ===== MAIN FUNCTION INJECTED INTO THE WEB PAGE =====
// =====================================================================
async function executeExtraction(config) {
    window.abortExtraction = false; 
    
    const notify = (msg) => { try { chrome.runtime.sendMessage(msg); } catch(e) {} };

    let t = config.lang === 'en' ? 
        { auto: "Auto-scrolling...", wait: "Waiting for images...", proc: "Processing pages...", packZip: "Compressing ZIP file...", packPdf: "Packaging PDF..." } : 
        { auto: "Đang cuộn trang tự động...", wait: "Đang chờ ảnh load...", proc: "Đang xử lý ảnh...", packZip: "Đang nén file ZIP...", packPdf: "Đang đóng gói PDF..." };

    // auto-scroll logic to load all images
    if (config.autoScroll) {
        notify({ status: t.auto });
        await new Promise((resolve) => {
            let previousImgCount = 0;
            let noNewImgCount = 0;
            
            // if user specified an end page
            let targetCount = config.endPage ? config.endPage : Infinity;

            let timer = setInterval(() => {
                if (window.abortExtraction) { clearInterval(timer); resolve(); }

                let blobs = Array.from(document.getElementsByTagName("img")).filter(img => /^blob:/.test(img.src));

                if (blobs.length >= targetCount) {
                    clearInterval(timer);
                    window.scrollTo(0, 0); 
                    notify({ status: t.wait });
                    setTimeout(resolve, 1500);
                    return; 
                }

                //scroll
                window.scrollBy(0, 1000);
                if (blobs.length > 0) {
                    let lastImage = blobs[blobs.length - 1];
                    lastImage.scrollIntoView({ block: 'end' });

                    let parent = lastImage.parentElement;
                    while (parent && parent !== document.body) {
                        if (parent.scrollHeight > parent.clientHeight) parent.scrollBy(0, 1000);
                        parent = parent.parentElement;
                    }
                }

                if (blobs.length > previousImgCount) {
                    previousImgCount = blobs.length;
                    noNewImgCount = 0;
                } else {
                    noNewImgCount++;
                }

                if (noNewImgCount >= 25) {
                    clearInterval(timer);
                    if (blobs.length > 0) blobs[0].scrollIntoView({ block: 'start' });
                    else window.scrollTo(0, 0);
                    
                    notify({ status: t.wait });
                    setTimeout(resolve, 2000); 
                }
            }, 300); 
        });
    }

    if (window.abortExtraction) return notify({ status: config.dict.msgAborted, error: true });

    let elements = Array.from(document.getElementsByTagName("img")).filter(img => /^blob:/.test(img.src));
    let startIndex = config.startPage ? Math.max(0, config.startPage - 1) : 0;
    let endIndex = config.endPage ? Math.min(elements.length, config.endPage) : elements.length;
    elements = elements.slice(startIndex, endIndex);

    if (elements.length === 0) {
        alert(config.dict.msgNoImages);
        return notify({ status: config.dict.msgNoImages, error: true });
    }

    let docTitle = (document.title || "Document").replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s]/g, '').trim();
    let fileName = `${docTitle.replace(/\s+/g, '_') || "Extracted_Document"}`;

    let pdf = config.format === 'pdf' ? new window.jsPDF('p', 'pt', 'a4') : null;
    let zip = config.format === 'zip' ? new window.JSZip() : null;
    
    if(pdf) pdf.deletePage(1);

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext("2d", { willReadFrequently: true, alpha: false }); 
    const yieldToMainThread = () => new Promise(res => setTimeout(res, 3)); 

    notify({ status: t.proc, total: elements.length, current: 0 });

    for (let i = 0; i < elements.length; i++) {
        if (window.abortExtraction) return notify({ status: config.dict.msgAborted, error: true });

        let img = elements[i];
        let retries = 4;
        while ((!img.naturalWidth || img.naturalWidth <= 150) && retries > 0) {
            await new Promise(res => setTimeout(res, 1000));
            retries--;
        }

        let natWidth = img.naturalWidth || img.width || 800;
        let natHeight = img.naturalHeight || img.height || 1131;
        
        canvas.width = natWidth;
        canvas.height = natHeight;
        
        ctx.fillStyle = "#FFFFFF"; 
        ctx.fillRect(0, 0, natWidth, natHeight);

        if (config.grayscale) ctx.filter = 'grayscale(100%) contrast(110%)'; 
        else ctx.filter = 'none';

        ctx.drawImage(img, 0, 0, natWidth, natHeight);
        let imgData = canvas.toDataURL("image/jpeg", config.quality);

        if (config.format === 'zip') {
            let base64Data = imgData.split(',')[1];
            let pageNum = String(startIndex + i + 1).padStart(3, '0'); 
            zip.file(`${fileName}_Page_${pageNum}.jpg`, base64Data, {base64: true});
        } else {
            let orientation = natWidth > natHeight ? 'l' : 'p'; 
            pdf.addPage([natWidth, natHeight], orientation);
            pdf.addImage(imgData, 'JPEG', 0, 0, natWidth, natHeight);
        }
        
        notify({ status: `${t.proc} ${i + 1}/${elements.length}`, current: i + 1, total: elements.length });
        await yieldToMainThread();
    }
    
    if (config.format === 'zip') {
        notify({ status: t.packZip });
        let content = await zip.generateAsync({type: "blob"});
        let link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${fileName}.zip`;
        link.click();
    } else {
        notify({ status: t.packPdf });
        pdf.save(`${fileName}.pdf`);
    }
    
    notify({ status: config.dict.msgFinished, complete: true });
}