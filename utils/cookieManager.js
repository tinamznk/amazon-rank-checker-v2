import fs from 'fs';
import path from 'path';

const COOKIES_DIR = './cookies';
const COOKIES_PER_ROTATION = 40; // mỗi 40 batch sẽ đổi cookie

/**
 * Hàm chọn cookie theo batch number
 * @param {number} batchIndex - thứ tự batch (bắt đầu từ 0)
 * @returns { name: string, cookies: object[] }
 */
export function getCookieForBatch(batchIndex) {
  const cookieFiles = fs.readdirSync(COOKIES_DIR)
    .filter(file => file.endsWith('.json'))
    .sort(); // đảm bảo cookies1.json đến cookies5.json theo đúng thứ tự

  if (cookieFiles.length === 0) {
    throw new Error("❌ Không tìm thấy file cookie nào trong thư mục ./cookies");
  }

  const index = Math.floor(batchIndex / COOKIES_PER_ROTATION) % cookieFiles.length;
  const selectedFile = cookieFiles[index];
  const filePath = path.join(COOKIES_DIR, selectedFile);
  const rawData = fs.readFileSync(filePath, 'utf8');
  const cookies = JSON.parse(rawData);

  return {
    name: selectedFile,
    cookies
  };
}