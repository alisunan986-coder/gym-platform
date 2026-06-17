import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request to include user info
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// ==========================================
// 🛡️ VERIFY TOKEN MIDDLEWARE
// ==========================================
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): any => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as {
      userId: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// ==========================================
// 🔒 ROLE GUARD MIDDLEWARE
// ==========================================
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): any => {
    if (!req.user) {
return res.status(403).json({ message: `Access denied. Required role: ${roles.join(' or ')}` });    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }

    next();
  };
};