import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { getCookieForBatch } from './utils/cookieManager.js';
import { sleep } from './utils/sleep.js';

const BATCH_SIZE = 5;
const COOKIE_ROTATE_EVERY = 40; // đổi cookie sau mỗi 40 batch (~200 keyword)

const KEYWORDS = [
  { "keyword": "car bumper stickers and decals", "asin": "B0C99SLC1J" },
  { "keyword": "raccoon sticker", "asin": "B0C99SLC1J" },
  { "keyword": "bumper sticker car", "asin": "B0C99SLC1J" },
  { "keyword": "best bumper stickers", "asin": "B0C99SLC1J" },
  { "keyword": "car stickers funny", "asin": "B0C99SLC1J" },
  { "keyword": "bigfoot vinyl decal", "asin": "B0C99SLC1J" }
];

async function checkKeywordRank(page, keyword, asin) {
  const url = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;
  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({ 'accept-language': 'en-US,en;q=0.9' });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    await sleep(1500);

    const products = await page.$$eval('div[data-component-type="s-search-result"]', nodes =>
      nodes.map((node, index) => {
        const asin = node.getAttribute("data-asin");
        const hasPrice = node.querySelector(".a-price") !== null;
        return { asin, index, hasPrice };
      }).filter(p => p.asin && p.hasPrice)
    );

    const position = products.find(p => p.asin === asin);
    if (position) {
      return `Page 1, No ${position.index + 1}`;
    } else {
      return "Not in Top 50";
    }
  } catch (err) {
    return `Error: ${err.message}`;
  }
}

async function run() {
  console.log("🚀 Starting Amazon Rank Checker...");

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/chromium',
    userDataDir: '/tmp/puppeteer-profile',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-gpu',
      '--single-process',
    ],
  });

  let batchCount = 0;
  const totalBatches = Math.ceil(KEYWORDS.length / BATCH_SIZE);

  for (let i = 0; i < totalBatches; i++) {
    const batchKeywords = KEYWORDS.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    const cookie = getCookieForBatch(i);

    console.log(`\n🔄 Batch ${i + 1}/${totalBatches} — using ${cookie.name}`);

    const results = await Promise.allSettled(
      batchKeywords.map(async ({ keyword, asin }) => {
        const page = await browser.newPage();
        await page.setCookie(...cookie.cookies);

        const rank = await checkKeywordRank(page, keyword, asin);
        console.log(`🔍 ${keyword} → ${rank}`);
        await page.close();
      })
    );

    await sleep(2000); // delay giữa các batch
  }

  await browser.close();
  console.log("\n✅ DONE: All keywords processed.");
  process.exit(0);
}

run();
