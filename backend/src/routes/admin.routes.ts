import { Router } from 'express';
import {
  createTrainer,
  getAllTrainers,
  getAllClients,
  updateTrainerStatus,
  assignClientToTrainer
} from '../controllers/admin.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
const router = Router();

// All routes here require ADMIN role
router.post('/trainers', verifyToken, requireRole('ADMIN'), createTrainer);
router.get('/trainers', verifyToken, requireRole('ADMIN'), getAllTrainers);
router.get('/clients', verifyToken, requireRole('ADMIN'), getAllClients);
router.patch('/trainers/:id/status', verifyToken, requireRole('ADMIN'), updateTrainerStatus);
router.post('/assign-client', verifyToken, requireRole('ADMIN'), assignClientToTrainer);

export default router;