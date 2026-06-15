import 'dotenv/config'; // Thêm dòng này lên đầu file này
import { PrismaClient } from '@prisma/client';

// Thêm dòng log này để kiểm tra xem nó có đọc được URL không
if (!process.env.DATABASE_URL) {
  console.error("❌ Lỗi: DATABASE_URL không tồn tại trong .env!");
}

const prisma = new PrismaClient();

export default prisma;