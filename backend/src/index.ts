import 'dotenv/config';
import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initializeSocket } from './socket/socket';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import fitnessProfileRoutes from './routes/fitnessProfile.routes';
import adminRoutes from './routes/admin.routes';
import trainerRoutes from './routes/trainer.routes';
import aiRoutes from './routes/ai.routes';
import chatRoutes from './routes/chat.routes';
import progressRoutes from './routes/progress.routes';
import notificationRoutes from './routes/notification.routes';

const app: Application = express();
const port: number = Number(process.env.PORT) || 5000;

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json());

// ==========================================
// ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fitness-profile', fitnessProfileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to the Gym Platform API 🏋️",
    status: "Healthy and Sprinting 💪"
  });
});

// ==========================================
// HTTP SERVER + SOCKET.IO
// ==========================================
const httpServer = createServer(app);
export const io = initializeSocket(httpServer);

httpServer.listen(port, () => {
  console.log(`💪 Server running at http://localhost:${port}`);
  console.log(`🔌 Socket.io ready for real-time connections`);
});