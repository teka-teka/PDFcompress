/* ---------------------------
 *  Client-side PDF Compressor
 *  main.js
 * --------------------------- */

/* ==== DOM 要素 ==== */
const $fileInput   = document.getElementById("fileInput");
const $compressBtn = document.getElementById("compressBtn");
const $progress    = document.getElementById("progress");
const $sizeInfo    = document.getElementById("sizeInfo");

let selectedFile;

/* ==== 1. ライブラリの確認 ==== */
if (typeof PDFLib === 'undefined' || typeof imageCompression === 'undefined') {
  alert("🚨 PDF圧縮ライブラリの読み込みに失敗しました");
  console.error("PDF圧縮ライブラリが見つかりません");
} else {
  console.log("PDF圧縮ライブラリが正常に読み込まれました");
  // $compressBtn.disabled = false;
}

/* ==== 2. ファイル選択ハンドラ ==== */
$fileInput.addEventListener("change", () => {
  selectedFile = $fileInput.files?.[0];
  if (!selectedFile) return;

  const kb = (selectedFile.size / 1024).toFixed(1);
  $sizeInfo.textContent = `元サイズ: ${kb} KB`;

  $compressBtn.disabled = false;
});

/* ==== 3. 圧縮ボタン ==== */
$compressBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  /* UI: ボタン無効化 & プログレス開始 */
  $compressBtn.disabled = true;
  $progress.style.display = "block";
  $progress.value = 5;

  try {
    /* 3-1. PDF ファイルを取得 */
    const pdfBytes = await selectedFile.arrayBuffer();
    $progress.value = 20;

    /* 3-2. PDFドキュメントをロード */
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.load(pdfBytes);
    $progress.value = 40;

    /* 3-3. PDFを圧縮 */
    const compressedPdfDoc = await PDFDocument.create();
    const pages = pdfDoc.getPages();

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      const newPage = compressedPdfDoc.addPage([width, height]);

      const form = await compressedPdfDoc.embedPage(page, {
        quality: 0.6  // 低品質設定（0.1〜1.0）
      });

      newPage.drawPage(form, {
        x: 0,
        y: 0,
        width: width,
        height: height
      });

      $progress.value = 40 + Math.floor((i + 1) / pages.length * 40);
    }

    /* 3-4. 圧縮したPDFを保存 */
    const compressedPdfBytes = await compressedPdfDoc.save();
    const compressedFile = new Blob([compressedPdfBytes], { type: "application/pdf" });
    $progress.value = 90;

    /* 3-5. Blob → 自動ダウンロード */
    const url = URL.createObjectURL(compressedFile);

    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile.name.replace(/\.pdf$/i, "_compressed.pdf");
    a.click();
    URL.revokeObjectURL(url);

    /* 3-6. 圧縮率を表示 */
    const afterKb = (compressedFile.size / 1024).toFixed(1);
    const ratio   = ((compressedFile.size / selectedFile.size) * 100).toFixed(1);
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
