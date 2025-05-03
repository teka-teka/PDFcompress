/* ---------------------------
 *  Client-side PDF Compressor
 *  main.js  (ES Module)
 * --------------------------- */

import initPdfCPU, { compress_pdf } from "./pdfcpu.js";

/* ==== DOM 要素 ==== */
const $fileInput   = document.getElementById("fileInput");
const $compressBtn = document.getElementById("compressBtn");
const $progress    = document.getElementById("progress");
const $sizeInfo    = document.getElementById("sizeInfo");

let wasmReady = false;
let selectedFile;

/* ==== 1. pdfcpu.wasm 初期化 ==== */
(async () => {
  try {
    await initPdfCPU();      // pdfcpu.js 内で wasm を fetch → instantiate
    wasmReady = true;
    console.log("pdfcpu WASM initialised");
  } catch (err) {
    alert("🚨 pdfcpu.wasm の初期化に失敗しました\n" + err.message);
    console.error(err);
  }
})();

/* ==== 2. ファイル選択ハンドラ ==== */
$fileInput.addEventListener("change", () => {
  selectedFile = $fileInput.files?.[0];
  if (!selectedFile) return;

  const kb = (selectedFile.size / 1024).toFixed(1);
  $sizeInfo.textContent = `元サイズ: ${kb} KB`;

  if (wasmReady) $compressBtn.disabled = false;
});

/* ==== 3. 圧縮ボタン ==== */
$compressBtn.addEventListener("click", async () => {
  if (!selectedFile || !wasmReady) return;

  /* UI: ボタン無効化 & プログレス開始 */
  $compressBtn.disabled = true;
  $progress.style.display = "block";
  $progress.value = 5;

  try {
    /* 3-1. PDF バイト列を Uint8Array で取得 */
    const uint8Original = new Uint8Array(await selectedFile.arrayBuffer());
    $progress.value = 25;

    /* 3-2. 圧縮実行 – pdfcpu WASM 関数 */
    const uint8Compressed = compress_pdf(uint8Original);
    $progress.value = 80;

    /* 3-3. Blob → 自動ダウンロード */
    const blob = new Blob([uint8Compressed], { type: "application/pdf" });
    const url  = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile.name.replace(/\.pdf$/i, "_compressed.pdf");
    a.click();
    URL.revokeObjectURL(url);

    /* 3-4. 圧縮率を表示 */
    const afterKb = (uint8Compressed.length / 1024).toFixed(1);
    const ratio   = ((afterKb / (selectedFile.size / 1024)) * 100).toFixed(1);
    $sizeInfo.textContent =
      `元サイズ: ${(selectedFile.size / 1024).toFixed(1)} KB` +
      ` → 圧縮後: ${afterKb} KB (${ratio}% )`;

    $progress.value = 100;
  } catch (err) {
    alert("圧縮に失敗しました:\n" + err.message);
    console.error(err);
  } finally {
    /* 後始末 */
    $compressBtn.disabled = false;
    setTimeout(() => { $progress.style.display = "none"; $progress.value = 0; }, 800);
  }
});
