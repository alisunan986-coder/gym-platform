import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('🌱 Seeding subscription plans...');

  // Delete existing plans first
  await prisma.subscriptionPlan.deleteMany();

  // Create plans
  await prisma.subscriptionPlan.createMany({
    data: [
      {
        name: 'Basic',
        price: 9.99,
        interval: 'month',
        features: [
          'Access to gym equipment',
          'AI workout plan generation',
          'AI meal plan generation'
        ]
      },
      {
        name: 'Pro',
        price: 19.99,
        interval: 'month',
        features: [
          'Everything in Basic',
          'Access to group classes',
          'AI fitness chatbot',
          'Progress tracking',
          'AI progress insights'
        ]
      },
      {
        name: 'Premium',
        price: 34.99,
        interval: 'month',
        features: [
          'Everything in Pro',
          'Personal trainer sessions',
          'Trainer assignment',
          'Direct trainer communication'
        ]
      }
    ]
  });

  console.log('✅ Subscription plans seeded successfully!');
  console.log('📋 Plans created: Basic ($9.99), Pro ($19.99), Premium ($34.99)');

  await prisma.$disconnect();
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});