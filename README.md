# 🚀 Document Extractor Vjp Pro (v2.0)

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=flat&logo=javascript&logoColor=%23F7DF1E)
![Offline Support](https://img.shields.io/badge/offline-100%25-success)
![i18n](https://img.shields.io/badge/i18n-EN%20%7C%20VN-brightgreen)

A high-performance, fully offline Chrome Extension designed to seamlessly extract in-memory `blob:` image resources from strict document viewers (like Google Drive) and compile them into high-resolution PDFs or ZIP archives.

**Version 2.0 is the Ultimate Update**, bringing 1-click batch downloading, smart hybrid auto-scrolling to defeat lazy-loading, and local library injection to completely bypass strict Content Security Policies (CSP).

---

## 🎉 What's New in v2.0

* 🗂️ **Multi-Format Export (PDF & ZIP):** Choose between compiling all pages into a single PDF document or downloading them as a `.zip` archive containing high-quality individual `.jpg` files for easy editing.
* ⚡ **1-Click "Download ALL":** A dedicated macro button that automatically scans, scrolls, and extracts the entire document without needing to specify page ranges.
* 🧠 **Smart Hybrid Auto-Scroll Engine:** Defeats modern "Fake Bottom" lazy-loading. It actively tracks DOM mutations and image rendering to precisely determine when the true end of a document is reached, even on unstable network connections.
* 🛡️ **100% Offline & CSP-Immune:** Core processing libraries (`jsPDF` and `JSZip`) are now bundled locally. The extension injects them directly from your hard drive, bypassing external CDN blockers and strict website firewalls.
* 🌐 **Bilingual UI (English & Vietnamese):** Built-in i18n support with memory persistence. 
* 🌓 **Hardware-Accelerated Grayscale:** A native Canvas filter that converts colored scans into sharp, high-contrast B&W documents, **reducing PDF file size by up to 70%**.

## ✨ Core Architecture Retained

* **Volatile Blob Handling:** Bypasses `net::ERR_FILE_NOT_FOUND` caused by strict garbage collection (`URL.revokeObjectURL()`).
* **Memory-Optimized Rendering:** Uses a **Single-Canvas Buffer** to prevent Heap Out-of-Memory crashes when dealing with hundreds of high-res images.
* **Lossless Resolution Matrix:** Extracts `naturalWidth` and `naturalHeight` to guarantee 1:1 original document quality regardless of CSS scaling.

---

## 🛠️ Installation Guide

Because this extension runs offline and bypasses CSP, it must be loaded with its local dependencies.

1. Download or clone this repository to your local machine.
2. Ensure your folder contains these 5 essential files:
   * `manifest.json`
   * `popup.html`
   * `popup.js`
   * `jspdf.min.js` (Local PDF Engine)
   * `jszip.min.js` (Local ZIP Engine)
3. Open Google Chrome and navigate to `chrome://extensions/`.
4. Enable **Developer mode** using the toggle switch in the top right corner.
5. Click the **Load unpacked** button in the top left and select your extension folder.

## 🚀 How to Use

1. Open any web document viewer that renders pages as `blob:` images.
2. Click the **Document Extractor Pro** icon in your Chrome toolbar.
3. Configure your settings:
   * **Output Format:** Choose Single PDF or ZIP Archive.
   * **Quality:** Adjust the compression slider (0.95 is recommended).
   * **Grayscale Mode:** Check this for text-heavy documents to save massive space.
4. **Choose your extraction method:**
   * **Extract Range:** Enter a specific Start and End page, then click this button.
   * **Download ALL:** Click the green button to let the extension automatically scroll and extract everything until the end of the document.
5. Watch the progress bar. Your file will automatically download once packaging is complete!

## ⚠️ Known Limitations
* **Large File Sizes:** Even with compression, extracting 100+ high-resolution color pages to PDF will result in a large file. Use ZIP or Grayscale mode for massive documents.
* Performance is dependent on client-side CPU/RAM during the Canvas rendering loop.

## 📝 Disclaimer
This tool is created for educational purposes, personal archiving, and exploring DOM/Canvas API capabilities. Please respect copyright laws and platform terms of service when extracting documents.
