# ✅ Sử dụng image có sẵn Chromium + Puppeteer
FROM ghcr.io/puppeteer/puppeteer:latest

# ✅ Set thư mục làm việc trong container
WORKDIR /app

# ✅ Copy toàn bộ mã nguồn vào container
COPY . .

# ✅ Cài dependencies từ package.json
RUN npm install

# ✅ Command mặc định khi container khởi động
CMD ["node", "index.js"]
