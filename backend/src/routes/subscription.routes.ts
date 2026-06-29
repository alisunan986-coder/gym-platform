import { Router, Request, Response } from 'express';
import {
  getPlans,
  createCheckoutSession,
  handleWebhook,
  getMySubscription,
  getPaymentHistory,
  getAllSubscriptions
} from '../controllers/subscription.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public
router.get('/plans', getPlans);

// Webhook (raw body needed for Stripe signature verification)
router.post('/webhook', handleWebhook);

// Client
router.post('/checkout', verifyToken, requireRole('CLIENT'), createCheckoutSession);
router.get('/my-subscription', verifyToken, getMySubscription);
router.get('/payment-history', verifyToken, requireRole('CLIENT'), getPaymentHistory);

// Admin
router.get('/admin/all', verifyToken, requireRole('ADMIN'), getAllSubscriptions);

export default router;