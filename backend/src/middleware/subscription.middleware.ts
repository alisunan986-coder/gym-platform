import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import prisma from '../config/prisma';

// Plan hierarchy
const PLAN_HIERARCHY: { [key: string]: number } = {
  'Basic': 1,
  'Pro': 2,
  'Premium': 3
};

// ==========================================
// 🔒 REQUIRE SUBSCRIPTION MIDDLEWARE
// ==========================================
export const requireSubscription = (minimumPlan: 'Basic' | 'Pro' | 'Premium') => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
      const userId = req.user?.userId;

      // Admins and Trainers bypass subscription check
      if (req.user?.role === 'ADMIN' || req.user?.role === 'TRAINER') {
        return next();
      }

      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        include: { plan: true }
      });

      // No subscription
      if (!subscription || subscription.status !== 'active') {
        return res.status(403).json({
          message: "Active subscription required. Please subscribe to access this feature.",
          redirectTo: "/subscription/plans"
        });
      }

      // Check plan level
      const userPlanLevel = PLAN_HIERARCHY[subscription.plan.name] || 0;
      const requiredPlanLevel = PLAN_HIERARCHY[minimumPlan] || 0;

      if (userPlanLevel < requiredPlanLevel) {
        return res.status(403).json({
          message: `This feature requires the ${minimumPlan} plan or higher. Please upgrade your subscription.`,
          currentPlan: subscription.plan.name,
          requiredPlan: minimumPlan,
          redirectTo: "/subscription/plans"
        });
      }

      next();

    } catch (error) {
      console.error("Subscription Middleware Error: ", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  };
};