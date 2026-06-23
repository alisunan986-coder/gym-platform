import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

// Store connected users: userId → socketId
const connectedUsers = new Map<string, string>();

export const initializeSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // ==========================================
  // 🔐 AUTHENTICATE SOCKET CONNECTION
  // ==========================================
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET as string
      ) as { userId: string; email: string; role: string };

      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      next();

    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // ==========================================
  // 🔌 HANDLE CONNECTION
  // ==========================================
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;

    console.log(`✅ User connected: ${userId} (socket: ${socket.id})`);

    // Store user's socket ID
    connectedUsers.set(userId, socket.id);

    // Join personal room (so we can send notifications to specific users)
    socket.join(`user:${userId}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${userId}`);
      connectedUsers.delete(userId);
    });
  });

  return io;
};

// ==========================================
// 📤 SEND NOTIFICATION TO SPECIFIC USER
// ==========================================
export const sendNotificationToUser = (
  io: Server,
  userId: string,
  notification: {
    title: string;
    message: string;
    type?: string;
  }
): void => {
  io.to(`user:${userId}`).emit('notification', {
    ...notification,
    createdAt: new Date()
  });
  console.log(`🔔 Notification sent to user: ${userId}`);
};