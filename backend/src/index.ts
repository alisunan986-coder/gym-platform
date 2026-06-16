import 'dotenv/config'
import express, { Request, Response, Application, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import jwt from 'jsonwebtoken';

// ✅ Prisma 7 way — using PostgreSQL adapter
const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL 
});

const prisma = new PrismaClient({ adapter });

const app: Application = express();
const port: number = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());
// Handle malformed JSON bodies with a clear error message
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON in request body.' });
  }
  next();
});
// ==========================================
// 🏋️‍♂️ AUTHENTICATION SYSTEM: REGISTER ROUTE
// ==========================================
app.post('/api/auth/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // 1. Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        message: "All fields (firstName, lastName, email, password) are required." 
      });
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: "A user with this email already exists." 
      });
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Save to database
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'CLIENT' // ✅ Must match our enum exactly (ADMIN, TRAINER, CLIENT)
      }
    });

    // 5. Return success
    return res.status(201).json({
      message: "Gym member registered successfully! 🎉",
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error("Registration Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ==========================================
// 🔐 AUTHENTICATION SYSTEM: LOGIN ROUTE
// ==========================================
app.post('/api/auth/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required." 
      });
    }

    // 2. Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ 
        message: "Invalid email or password." 
      });
    }

    // 3. Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        message: "Your account has been deactivated. Contact the gym admin." 
      });
    }

    // 4. Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "Invalid email or password." 
      });
    }

    // 5. Generate Access Token (expires in 15 minutes)
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_ACCESS_SECRET as string,
      { expiresIn: '15m' }
    );

    // 6. Generate Refresh Token (expires in 7 days)
    const refreshToken = jwt.sign(
      { 
        userId: user.id,
      },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: '7d' }
    );

    // 7. Save refresh token to database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    // 8. Send back tokens and user info
    return res.status(200).json({
      message: "Login successful! Welcome back 💪",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// Default status test route
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: "welcome to the gym platform API",
        status: "Healthy and Sprinting"
    });
});

app.listen(port, () => {
    console.log(`💪 Server is running on highly optimized port: http://localhost:${port}`);
});