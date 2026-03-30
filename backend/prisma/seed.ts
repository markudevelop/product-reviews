import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Check if already seeded
  const existingProducts = await prisma.product.count();
  if (existingProducts > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('Seeding database...');

  // Create users
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alice@example.com',
        username: 'alice',
        password: passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob@example.com',
        username: 'bob',
        password: passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: 'charlie@example.com',
        username: 'charlie',
        password: passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: 'diana@example.com',
        username: 'diana',
        password: passwordHash,
      },
    }),
  ]);

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Sony WH-1000XM5',
        description:
          'Industry-leading noise canceling headphones with Auto NC Optimizer, crystal-clear hands-free calling, and up to 30 hours of battery life.',
        imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400',
        category: 'Electronics',
        price: 348.0,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Kindle Paperwhite (2024)',
        description:
          'The thinnest, lightest Kindle Paperwhite yet with a 7-inch display, weeks of battery life, and adjustable warm light.',
        imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400',
        category: 'Electronics',
        price: 149.99,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Patagonia Better Sweater',
        description:
          'Fair Trade Certified sewn fleece jacket made with 100% recycled polyester. Warm, comfortable, and environmentally responsible.',
        imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
        category: 'Clothing',
        price: 139.0,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Le Creuset Dutch Oven 5.5 Qt',
        description:
          'Iconic enameled cast iron round dutch oven. Superior heat distribution and retention for slow cooking, braising, and baking.',
        imageUrl: 'https://images.unsplash.com/photo-1585837146751-a44118595680?w=400',
        category: 'Kitchen',
        price: 379.95,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Herman Miller Aeron Chair',
        description:
          'Ergonomic office chair with PostureFit SL support, 8Z Pellicle suspension, and fully adjustable arms. Remastered for modern workspaces.',
        imageUrl: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400',
        category: 'Furniture',
        price: 1395.0,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Apple MacBook Pro 14" M3 Pro',
        description:
          'Supercharged by the M3 Pro chip with 18GB unified memory, 512GB SSD, and up to 17 hours of battery life. Liquid Retina XDR display.',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
        category: 'Electronics',
        price: 1999.0,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Dyson V15 Detect',
        description:
          'Cordless vacuum with laser dust detection, piezo sensor for particle counting, and up to 60 minutes of runtime.',
        imageUrl: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400',
        category: 'Home',
        price: 749.99,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Yeti Rambler 26oz Bottle',
        description:
          'Double-wall vacuum insulated stainless steel water bottle with TripleHaul Cap. Keeps drinks cold (or hot) for hours.',
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
        category: 'Outdoors',
        price: 40.0,
      },
    }),
  ]);

  // Create reviews
  const reviewsData = [
    // Sony headphones
    { productIdx: 0, userIdx: 0, rating: 5, title: 'Best noise canceling ever', body: 'These headphones are incredible. The noise canceling is a huge step up from the XM4s. I use them daily for work calls and music. Battery life is excellent and they\'re very comfortable for long sessions.' },
    { productIdx: 0, userIdx: 1, rating: 4, title: 'Great but pricey', body: 'Sound quality is top-notch and the ANC is the best I\'ve tried. Took one star off because at this price point, I expected a sturdier build. The headband feels slightly flimsy compared to competitors.' },
    { productIdx: 0, userIdx: 2, rating: 5, title: 'Worth every penny', body: 'I\'ve gone through at least 5 pairs of noise canceling headphones and these are by far the best. The multi-point connection is seamless and the speak-to-chat feature works perfectly.' },
    // Kindle
    { productIdx: 1, userIdx: 0, rating: 5, title: 'Perfect e-reader', body: 'The larger screen is a game changer. I can read for hours without eye strain. The warm light adjustment is perfect for reading before bed. Battery lasts weeks with regular use.' },
    { productIdx: 1, userIdx: 2, rating: 4, title: 'Great upgrade', body: 'Much improved over my old Paperwhite. The screen is noticeably bigger and the page turns feel faster. Only wish it had physical page turn buttons.' },
    { productIdx: 1, userIdx: 3, rating: 5, title: 'Replaced my tablet for reading', body: 'I used to read on my iPad but this is so much better. No distractions, no eye strain, and the battery is unreal. Highly recommend for anyone who reads regularly.' },
    // Patagonia
    { productIdx: 2, userIdx: 1, rating: 4, title: 'Cozy and well-made', body: 'Great midlayer for cool weather. The recycled polyester feels just as good as virgin material. Fits true to size. I wear it almost every day in fall and spring.' },
    { productIdx: 2, userIdx: 3, rating: 3, title: 'Good but not great', body: 'It\'s a nice fleece but for the price I expected more warmth. It\'s more of a light layer than a true sweater replacement. Quality is excellent though.' },
    // Le Creuset
    { productIdx: 3, userIdx: 0, rating: 5, title: 'Heirloom quality', body: 'This dutch oven is absolutely stunning and cooks beautifully. I\'ve made everything from sourdough bread to beef bourguignon. Even heat distribution makes a real difference. Worth the investment.' },
    { productIdx: 3, userIdx: 1, rating: 5, title: 'The gold standard', body: 'There\'s a reason Le Creuset has been around for 100 years. This thing is built to last generations. Heavy but that\'s part of what makes it work so well.' },
    { productIdx: 3, userIdx: 2, rating: 4, title: 'Beautiful but heavy', body: 'Gorgeous craftsmanship and excellent cooking results. My only complaint is the weight. It\'s quite heavy when full, especially for soups and stews. But the results are worth it.' },
    // Aeron
    { productIdx: 4, userIdx: 0, rating: 5, title: 'My back thanks me', body: 'After years of cheap office chairs and back pain, I finally invested in an Aeron. The difference is night and day. I can work 10+ hour days without any discomfort. Should have bought this years ago.' },
    { productIdx: 4, userIdx: 3, rating: 4, title: 'Excellent chair, steep learning curve', body: 'Takes about a week to dial in all the adjustments, but once you do, it\'s incredibly comfortable. The mesh keeps you cool in summer. Build quality is exceptional.' },
    // MacBook Pro
    { productIdx: 5, userIdx: 1, rating: 5, title: 'Absolute powerhouse', body: 'The M3 Pro is blazing fast. I run Docker, VS Code, and a dozen browser tabs without any slowdown. The screen is gorgeous and battery life easily lasts a full work day. Best laptop I\'ve ever owned.' },
    { productIdx: 5, userIdx: 2, rating: 4, title: 'Almost perfect', body: 'Performance and display are outstanding. The only things holding it back are the price and the notch. Still, if you need a professional machine, this is hard to beat.' },
    { productIdx: 5, userIdx: 3, rating: 5, title: 'Developer dream machine', body: 'Compiling, running local K8s clusters, video calls simultaneously. This machine handles it all without breaking a sweat. The 14-inch form factor is the sweet spot for portability and screen real estate.' },
    // Dyson
    { productIdx: 6, userIdx: 0, rating: 4, title: 'Impressive tech, good vacuum', body: 'The laser dust detection is genuinely useful. You can see dust you\'d otherwise miss. Suction power is great. Battery could be better on max power mode though.' },
    { productIdx: 6, userIdx: 1, rating: 3, title: 'Overhyped', body: 'It\'s a good vacuum but the price is hard to justify. The laser is cool but gimmicky. Battery drains fast on the highest setting. There are cheaper alternatives that clean just as well.' },
    // Yeti
    { productIdx: 7, userIdx: 2, rating: 5, title: 'Indestructible', body: 'I\'ve dropped this thing dozens of times and it still looks great. Keeps ice frozen for over 24 hours even in summer heat. The cap is easy to use one-handed. Buy it.' },
    { productIdx: 7, userIdx: 3, rating: 4, title: 'Best bottle I\'ve owned', body: 'Great insulation, solid build, nice color options. Slightly heavy when full but that\'s the trade-off for the insulation quality. The wide mouth is perfect for adding ice.' },
  ];

  for (const r of reviewsData) {
    await prisma.review.create({
      data: {
        rating: r.rating,
        title: r.title,
        body: r.body,
        productId: products[r.productIdx].id,
        userId: users[r.userIdx].id,
      },
    });
  }

  // Update product aggregate ratings
  for (const product of products) {
    const agg = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: {
        avgRating: agg._avg.rating ?? 0,
        reviewCount: agg._count.rating,
      },
    });
  }

  console.log('Seeding complete!');
  console.log(`Created ${users.length} users, ${products.length} products, ${reviewsData.length} reviews`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
