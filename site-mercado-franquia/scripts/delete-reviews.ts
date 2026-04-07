import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('🗑️  Starting review deletion script...\n');

  const prismaClient = new PrismaClient();

  try {
    // Get current count of reviews
    const reviewCount = await prismaClient.review.count();
    console.log(`📊 Found ${reviewCount} reviews in the database\n`);

    if (reviewCount === 0) {
      console.log('✅ No reviews to delete. Database is already clean!');
      return;
    }

    // Get count of review responses that will also be deleted (cascade)
    const reviewResponseCount = await prismaClient.reviewResponse.count();
    console.log(
      `📊 Found ${reviewResponseCount} review responses that will also be deleted (cascade)\n`,
    );

    // Confirm deletion
    console.log('⚠️  This will delete ALL reviews and their related data');
    console.log('   (review responses, ratings, etc.)\n');

    // Delete all reviews (cascading deletes will handle review responses)
    console.log('🔄 Deleting all reviews...');
    const result = await prismaClient.review.deleteMany({});

    console.log(`✅ Successfully deleted ${result.count} reviews!\n`);
    console.log('✨ Database is now clean and ready for schema changes');
  } catch (error) {
    console.error('\n❌ Error deleting reviews:', error);
    process.exit(1);
  } finally {
    await prismaClient.$disconnect();
  }
}

void main();
