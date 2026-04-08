import { PrismaClient } from '@prisma/client';
import { FranchiseMonthlyUnitsService } from '../src/modules/franchises/franchise-monthly-units.service';
import { PrismaService } from '../src/modules/database/prisma.service';

async function main() {
  console.log('🚀 Starting monthly units test script...\n');

  const prismaClient = new PrismaClient();
  const prismaService = new PrismaService();
  const monthlyUnitsService = new FranchiseMonthlyUnitsService(prismaService);

  try {
    const result = await monthlyUnitsService.processMonthlyUnitsUpdate();

    console.log('\n✅ Monthly units update completed successfully!\n');
    console.log('📊 Results:');
    console.log(`   - Total franchises: ${result.total}`);
    console.log(`   - Processed: ${result.processed}`);
    console.log(`   - Errors: ${result.errors}`);
    console.log(
      `   - Success rate: ${((result.processed / result.total) * 100).toFixed(2)}%`,
    );

    console.log('\n📈 Sample of updated franchises:');
    const sampleFranchises = await prismaClient.franchise.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        totalUnits: true,
        unitsEvolution: true,
      },
      take: 5,
      orderBy: { name: 'asc' },
    });

    sampleFranchises.forEach((franchise) => {
      console.log(`   - ${franchise.name}:`);
      console.log(`     Units: ${franchise.totalUnits ?? 'N/A'}`);
      console.log(`     Evolution: ${franchise.unitsEvolution ?? 'N/A'}`);
    });

    console.log('\n📅 Recent monthly records:');
    const recentRecords = await prismaClient.franchiseMonthlyUnits.findMany({
      include: {
        franchise: {
          select: { name: true },
        },
      },
      orderBy: { collectedAt: 'desc' },
      take: 5,
    });

    recentRecords.forEach((record) => {
      console.log(`   - ${record.franchise.name}:`);
      console.log(`     Period: ${record.period.toISOString().split('T')[0]}`);
      console.log(`     Units: ${record.units}`);
      console.log(`     Collected: ${record.collectedAt.toISOString()}`);
    });

    console.log('\n✨ Script completed successfully!');
  } catch (error) {
    console.error('\n❌ Error running monthly units update:', error);
    process.exit(1);
  } finally {
    await prismaClient.$disconnect();
  }
}

main();
