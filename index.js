import puppeteer from 'puppeteer';
import fs from 'fs';
import { getCookieForBatch } from './utils/cookieManager.js';
import { sleep } from './utils/sleep.js';

const COOKIES_ROTATE_EVERY = 200;
const LOCK_FILE = '/data/done.lock';

// ✅ Ngăn chạy lại nếu đã chạy xong
if (fs.existsSync(LOCK_FILE)) {
  console.log("✅ Script đã chạy trước đó. Dừng.");
  process.exit(0);
}

const KEYWORDS = [
  { "keyword": "car bumper stickers and decals", "asin": "B0C99SLC1J" },
  { "keyword": "bigfoot vinyl decal", "asin": "B0C99SLC1J" },
  { "keyword": "decal paper", "asin": "B0C99SLC1J" },
  { "keyword": "best bumper stickers", "asin": "B0C99SLC1J" },
  { "keyword": "car stickers funny", "asin": "B0C99SLC1J" },
  { "keyword": "raccoon sticker", "asin": "B0C99SLC1J" }
];

async function checkKeywordRank(browser, keyword, asin, cookie) {
  const page = await browser.newPage();

  // Gán cookies + user-agent
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({ 'accept-language': 'en-US,en;q=0.9' });
  await page.setCookie(...cookie.cookies);

  try {
    for (let pageNum = 1; pageNum <= 3; pageNum++) {
      const url = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}&page=${pageNum}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(2000); // đảm bảo trang load hoàn chỉnh

      const products = await page.$$eval('div[data-component-type="s-search-result"]', nodes =>
        nodes.map((node, index) => {
          const asin = node.getAttribute("data-asin");
          const hasPrice = node.querySelector(".a-price") !== null;
          return { asin, index, hasPrice };
        }).filter(p => p.asin && p.hasPrice)
      );

      const foundIndex = products.findIndex(p => p.asin === asin);
      if (foundIndex !== -1) {
        await page.close();
        return `Page ${pageNum}, No ${foundIndex + 1}`;
      }
    }

    await page.close();
    return "Not in Top 150";
  } catch (err) {
    await page.close();
    return `Error: ${err.message}`;
  }
}

async function run() {
  console.log("🚀 Starting Amazon Rank Checker...");

  const browser = await puppeteer.launch({
    headless: 'new',
    userDataDir: '/tmp/puppeteer-profile',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-gpu',
      '--single-process'
    ],
  });

  for (let i = 0; i < KEYWORDS.length; i++) {
    const { keyword, asin } = KEYWORDS[i];

    const cookieBatch = Math.floor(i / COOKIES_ROTATE_EVERY);
    const cookie = getCookieForBatch(cookieBatch); // tự xoay vòng nếu > số file

    const result = await checkKeywordRank(browser, keyword, asin, cookie);
    console.log(`🔍 ${keyword} → ${result}`);

    await sleep(1000); // delay nhẹ giữa mỗi keyword để giảm tải
  }

  await browser.close();
  fs.writeFileSync(LOCK_FILE, `✅ Done at ${new Date().toISOString()}\n`);
  console.log("✅ DONE. Lock file written. Exiting...");
  process.exit(0);
}

run();
