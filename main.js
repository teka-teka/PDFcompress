// LaserKaspar 版を例に：memfs ラッパーを使う
import "./wasm_exec_memfs.js";

const go = new Go();
go.argv = ["pdfcpu.wasm", "optimize", "/in.pdf", "/out.pdf"]; // pdfcpu CLI 風
WebAssembly.instantiateStreaming(fetch("pdfcpu.wasm"), go.importObject)
  .then(async ({instance}) => {
    // ここで memfs に PDF を書き込み → pdfcpu 実行 → out.pdf を readFile
  });