import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('🧹 Starting monthly units cleanup...\n');

  const prisma = new PrismaClient();

  try {
    const monthlyRecordsCount = await prisma.franchiseMonthlyUnits.count();
    console.log(`📊 Found ${monthlyRecordsCount} monthly unit records`);

    if (monthlyRecordsCount === 0) {
      console.log('✨ Table is already empty. Nothing to clean.');
    } else {
      await prisma.franchiseMonthlyUnits.deleteMany({});
      console.log(`✅ Deleted ${monthlyRecordsCount} records from FranchiseMonthlyUnits table`);
    }

    const franchisesWithEvolution = await prisma.franchise.count({
      where: {
        unitsEvolution: {
          not: null,
        },
      },
    });

    console.log(`\n📊 Found ${franchisesWithEvolution} franchises with evolution data`);

    if (franchisesWithEvolution > 0) {
      await prisma.franchise.updateMany({
        where: {
          unitsEvolution: {
            not: null,
          },
        },
        data: {
          unitsEvolution: null,
        },
      });
      console.log(`✅ Reset unitsEvolution field for ${franchisesWithEvolution} franchises`);
    }

    console.log('\n✨ Cleanup completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

