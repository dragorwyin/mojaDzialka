import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const outputDirectory = new URL("./", import.meta.url);
await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "C:/Users/drago/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe",
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;background:#f4f6f1;color:#20291f;font-family:Segoe UI,Arial,sans-serif;display:grid;place-items:center;min-height:100vh}
    main{width:1000px;background:#fff;border:1px solid #dce4d8;border-radius:24px;padding:56px;box-shadow:0 24px 80px #283d2518}
    .tag{color:#527345;text-transform:uppercase;letter-spacing:.15em;font-size:14px;font-weight:700}.title{font-size:46px;margin:16px 0 8px}.sub{font-size:20px;color:#687365;margin:0 0 38px}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.card{border:1px solid #dce4d8;border-radius:16px;padding:24px}.ok{font-size:14px;color:#347243;font-weight:700}.big{font-size:30px;font-weight:700;margin:14px 0 6px}.detail{font-size:16px;color:#687365}.footer{margin-top:28px;background:#f2f7ef;border-radius:14px;padding:18px 22px;font-size:15px;color:#465641}
    </style></head><body><main><div class="tag">MojaDziałka · weryfikacja</div><h1 class="title">Testy aplikacji</h1><p class="sub">Lokalny wynik · 5 października 2026</p><section class="grid"><article class="card"><div class="ok">✓ ZALICZONE</div><div class="big">99 testów</div><div class="detail">8 plików · npm run test:unit</div></article><article class="card"><div class="ok">✓ ZALICZONE</div><div class="big">33 testy</div><div class="detail">3 pliki · testy API (uruchomione przez test:unit)</div></article><article class="card"><div class="ok">✓ 2× ZALICZONE</div><div class="big">22 e2e</div><div class="detail">Desktop + mobile · dwa kolejne pełne przebiegi</div></article></section><div class="footer">132 testy unit/API zaliczone. Pełny zestaw e2e zaliczony dwukrotnie po poprawce hydratacji. Testów bazy pgTAP nie uruchamiano.</div></main></body></html>`);
  await page.screenshot({ path: fileURLToPath(new URL("test-results.png", outputDirectory)), fullPage: true });
} finally {
  await browser.close();
}
