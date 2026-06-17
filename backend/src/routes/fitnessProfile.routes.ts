import { Router } from 'express';
import {
  createFitnessProfile,
  getFitnessProfile,
  updateFitnessProfile
} from '../controllers/fitnessProfile.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// All routes are protected
router.post('/', verifyToken, createFitnessProfile);
router.get('/', verifyToken, getFitnessProfile);
router.put('/', verifyToken, updateFitnessProfile);

export default router;