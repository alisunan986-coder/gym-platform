import 'dotenv/config';//load enviromental variables from .env file
import express, { Request, Response, Application } from 'express';
import cors from 'cors';//middleware toenable cors
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import fitnessProfileRoutes from './routes/fitnessProfile.routes';
import adminRoutes from './routes/admin.routes';
import trainerRoutes from './routes/trainer.routes';
import aiRoutes from './routes/ai.routes';
import chatRoutes from './routes/chat.routes';
import progressRoutes from './routes/progress.routes';

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
// Health check
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to the Gym Platform API 🏋️",
    status: "Healthy and Sprinting 💪"
  });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(port, () => {
  console.log(`💪 Server running at http://localhost:${port}`);
});