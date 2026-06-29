import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// ==========================================
// 📋 GET ALL SUBSCRIPTION PLANS
// ==========================================
export const getPlans = async (req: Request, res: Response): Promise<any> => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' }
    });

    return res.status(200).json({ plans });

  } catch (error) {
    console.error("Get Plans Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// 💳 CREATE CHECKOUT SESSION
// ==========================================
export const createCheckoutSession = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId as string;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ message: "planId is required." });
    }

    // 1. Get the plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(404).json({ message: "Plan not found." });
    }

    // 2. Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true }
    });

    // 3. Create or get Stripe customer
    let customerId: string;
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (existingSubscription?.stripeCustomerId) {
      customerId = existingSubscription.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: user?.email,
        name: `${user?.firstName} ${user?.lastName}`,
        metadata: { userId }
      });
      customerId = customer.id;
    }

    // 4. Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.name} Plan`,
              description: plan.features.join(', ')
            },
            unit_amount: Math.round(plan.price * 100), // Stripe uses cents
            recurring: { interval: 'month' }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/payment/cancelled`,
      metadata: { userId, planId }
    });

    // 5. Save/update subscription as pending
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId,
        stripeCustomerId: customerId,
        status: 'pending'
      },
      update: {
        planId,
        stripeCustomerId: customerId,
        status: 'pending'
      }
    });

    return res.status(200).json({
      message: "Checkout session created! ✅",
      checkoutUrl: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error("Create Checkout Session Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// 🔔 STRIPE WEBHOOK
// ==========================================
export const handleWebhook = async (req: Request, res: Response): Promise<any> => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return res.status(400).json({ message: "Webhook signature verification failed." });
  }

  try {
    switch (event.type) {

      // ✅ Payment succeeded
      case 'checkout.session.completed': {
// ✅ New type name
        const session = event.data.object as Stripe.Checkout.Session; 
       const { userId, planId } = session.metadata as { userId: string; planId: string };


        // Update subscription to active
        await prisma.subscription.update({
          where: { userId },
          data: {
            status: 'active',
            stripeSubscriptionId: session.subscription as string,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        });

        // Save payment record
        await prisma.payment.create({
          data: {
            userId,
            amount: (session.amount_total || 0) / 100,
            currency: session.currency || 'usd',
            status: 'succeeded',
            stripePaymentId: session.payment_intent as string,
            description: `Subscription payment`
          }
        });

        // Send notification to user
        await prisma.notification.create({
          data: {
            userId,
            title: "Payment Successful! 🎉",
            message: "Your subscription is now active. Enjoy your gym access!"
          }
        });

        console.log(`✅ Payment succeeded for user: ${userId}`);
        break;
      }

      // ❌ Payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const subscription = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId }
        });

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'expired' }
          });

          await prisma.notification.create({
            data: {
              userId: subscription.userId,
              title: "Payment Failed ❌",
              message: "Your payment failed. Please update your payment method to continue your subscription."
            }
          });
        }
        break;
      }

      // 🔄 Subscription cancelled
      case 'customer.subscription.deleted': {
        const stripeSubscription = event.data.object as Stripe.Subscription;

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: stripeSubscription.id },
          data: { status: 'cancelled' }
        });
        break;
      }
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error("Webhook Processing Error: ", error);
    return res.status(500).json({ message: "Webhook processing failed." });
  }
};

// ==========================================
// 📋 GET MY SUBSCRIPTION
// ==========================================
export const getMySubscription = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId as string;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true }
    });

    if (!subscription) {
      return res.status(200).json({
        subscription: null,
        message: "No active subscription found."
      });
    }

    return res.status(200).json({ subscription });

  } catch (error) {
    console.error("Get My Subscription Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// 📋 GET PAYMENT HISTORY
// ==========================================
export const getPaymentHistory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId as string;

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ payments });

  } catch (error) {
    console.error("Get Payment History Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// 📋 ADMIN — GET ALL SUBSCRIPTIONS
// ==========================================
export const getAllSubscriptions = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ subscriptions });

  } catch (error) {
    console.error("Get All Subscriptions Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};