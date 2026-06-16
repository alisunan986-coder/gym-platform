import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

// ==========================================
// 🏋️‍♂️ REGISTER
// ==========================================
export const register = async (req: Request, res: Response): Promise<any> => {
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
        role: 'CLIENT'
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
};

// ==========================================
// 🔐 LOGIN
// ==========================================
export const login = async (req: Request, res: Response): Promise<any> => {
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

    // 4. Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "Invalid email or password." 
      });
    }

    // 5. Generate Access Token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_ACCESS_SECRET as string,
      { expiresIn: '15m' }
    );

    // 6. Generate Refresh Token
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: '7d' }
    );

    // 7. Save refresh token to database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    // 8. Return success
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
};
// ==========================================
// 🔄 REFRESH TOKEN
// ==========================================
export const refreshToken = async (req: Request, res: Response): Promise<any> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required." });
    }

    // 1. Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as { userId: string };

    // 2. Find user and check if refresh token matches
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token." });
    }

    // 3. Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_ACCESS_SECRET as string,
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      message: "Token refreshed successfully! ✅",
      accessToken: newAccessToken
    });

  } catch (error) {
    console.error("Refresh Token Error: ", error);
    return res.status(401).json({ message: "Invalid or expired refresh token." });
  }
};

// ==========================================
// 🚪 LOGOUT
// ==========================================
export const logout = async (req: Request, res: Response): Promise<any> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required." });
    }

    // Find user by refresh token and clear it
    const user = await prisma.user.findFirst({
      where: { refreshToken }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid refresh token." });
    }

    // Clear refresh token from database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: null }
    });

    return res.status(200).json({ message: "Logged out successfully! 👋" });

  } catch (error) {
    console.error("Logout Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};