import { Router } from 'express';
import {
  generateWorkoutPlan,
  getMyWorkoutPlans,
  generateMealPlan,
  getMyMealPlans
} from '../controllers/ai.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/workout-plan', verifyToken, requireRole('CLIENT'), generateWorkoutPlan);
router.get('/workout-plans', verifyToken, requireRole('CLIENT'), getMyWorkoutPlans);
router.post('/meal-plan', verifyToken, requireRole('CLIENT'), generateMealPlan);
router.get('/meal-plans', verifyToken, requireRole('CLIENT'), getMyMealPlans);

export default router;