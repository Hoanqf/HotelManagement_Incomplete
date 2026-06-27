import express, { Application } from 'express';
import cors from 'cors';
import userRoutes from './routes/user.route';
import roomRoutes from './routes/room.route';
import bookingRoutes from './routes/booking.route';
import maintenanceRoutes from './routes/maintenance.route';
import dashboardRoutes from './routes/dashboard.route';
import serviceRoutes from './routes/service.route';
import invoiceRoutes from './routes/invoice.route';
import financeRoutes from './routes/finance.route';
import inventoryRoutes from './routes/inventory.route';

const app: Application = express();

// 1. Middlewares toàn cục
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/public', express.static('public'));

// 2. Định nghĩa API Routes
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/inventory', inventoryRoutes);


// 3. Health check (để kiểm tra server sống hay chết)
app.get('/', (req, res) => {
  res.send('Server is running...');
});

export default app;