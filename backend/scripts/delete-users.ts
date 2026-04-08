import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('🗑️  Starting user deletion script...\n');

  const prismaClient = new PrismaClient();

  try {
    // Get current count of users
    const userCount = await prismaClient.user.count();
    console.log(`📊 Found ${userCount} users in the database\n`);

    if (userCount === 0) {
      console.log('✅ No users to delete. Database is already clean!');
      return;
    }

    // Confirm deletion
    console.log('⚠️  This will delete ALL users and their related data');
    console.log(
      '   (profiles, franchisor data, favorites, notifications, etc.)\n',
    );

    // Delete related data that doesn't have cascade delete configured
    console.log('🔄 Deleting review responses...');
    const reviewResponsesDeleted = await prismaClient.reviewResponse.deleteMany(
      {},
    );
    console.log(
      `   ✅ Deleted ${reviewResponsesDeleted.count} review responses`,
    );

    // Now delete all users (cascading deletes will handle remaining related records)
    console.log('🔄 Deleting all users...');
    const result = await prismaClient.user.deleteMany({});

    console.log(`✅ Successfully deleted ${result.count} users!\n`);
    console.log('✨ Database is now clean and ready for schema changes');
  } catch (error) {
    console.error('\n❌ Error deleting users:', error);
    process.exit(1);
  } finally {
    await prismaClient.$disconnect();
  }
}

main();
