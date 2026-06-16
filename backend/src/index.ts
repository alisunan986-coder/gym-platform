import 'dotenv/config';
import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';

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