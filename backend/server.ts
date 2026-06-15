import 'dotenv/config'; 
import app from './app';
import prisma from './config/prisma';
import { SeedService } from './services/seed.service';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Kiểm tra kết nối
    await prisma.$connect();
    console.log('✅ Kết nối Database thành công qua Prisma');
    
    // Seed dữ liệu mẫu nếu chưa có
    await SeedService.seedAll();
  } catch (error) {
    console.warn('⚠️ Cảnh báo: Không thể kết nối Database PostgreSQL. Tuy nhiên, Express Server vẫn khởi động...');
    console.error(error);
  }

  try {
    app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Lỗi khởi động server:', error);
    process.exit(1);
  }
}

startServer();