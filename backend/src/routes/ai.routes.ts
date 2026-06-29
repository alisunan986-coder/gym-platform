import { Router } from 'express';
import {
  generateWorkoutPlan,
  getMyWorkoutPlans,
  generateMealPlan,
  getMyMealPlans
} from '../controllers/ai.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import { requireSubscription } from '../middleware/subscription.middleware';


const router = Router();

router.post('/workout-plan', verifyToken, requireRole('CLIENT'), requireSubscription('Basic'), generateWorkoutPlan);
router.get('/workout-plans', verifyToken, requireRole('CLIENT'), requireSubscription('Basic'), getMyWorkoutPlans);
router.post('/meal-plan', verifyToken, requireRole('CLIENT'), requireSubscription('Basic'), generateMealPlan);
router.get('/meal-plans', verifyToken, requireRole('CLIENT'), requireSubscription('Basic'), getMyMealPlans);

export default router;