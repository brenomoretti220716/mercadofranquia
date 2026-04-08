/**
 * Fix numeric values that were incorrectly cast from Brazilian format strings
 * 
 * Problem: "310.000" was cast to 310 instead of 310000
 * Solution: Multiply values that are too small by 1000
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function fixNumericValues() {
  console.log('🔧 Starting numeric values fix...\n');

  // Fix minimumInvestment
  console.log('📊 Fixing minimumInvestment...');
  const lowMinInvestment = await prisma.franchise.findMany({
    where: { minimumInvestment: { gt: 0, lt: 1000 } },
    select: { id: true, name: true, minimumInvestment: true },
  });

  if (lowMinInvestment.length > 0) {
    console.log(`   Found ${lowMinInvestment.length} records to fix`);
    for (const franchise of lowMinInvestment) {
      const oldValue = Number(franchise.minimumInvestment);
      const newValue = oldValue * 1000;
      await prisma.franchise.update({
        where: { id: franchise.id },
        data: { minimumInvestment: newValue },
      });
      console.log(`   ${franchise.name}: ${oldValue} → ${newValue}`);
    }
  } else {
    console.log('   ✅ No issues found\n');
  }

  // Fix maximumInvestment
  console.log('📊 Fixing maximumInvestment...');
  const lowMaxInvestment = await prisma.franchise.findMany({
    where: { maximumInvestment: { gt: 0, lt: 1000 } },
    select: { id: true, name: true, maximumInvestment: true },
  });

  if (lowMaxInvestment.length > 0) {
    console.log(`   Found ${lowMaxInvestment.length} records to fix`);
    for (const franchise of lowMaxInvestment) {
      const oldValue = Number(franchise.maximumInvestment);
      const newValue = oldValue * 1000;
      await prisma.franchise.update({
        where: { id: franchise.id },
        data: { maximumInvestment: newValue },
      });
      console.log(`   ${franchise.name}: ${oldValue} → ${newValue}`);
    }
  } else {
    console.log('   ✅ No issues found\n');
  }

  // Fix setupCapital
  console.log('📊 Fixing setupCapital...');
  const lowSetupCapital = await prisma.franchise.findMany({
    where: { setupCapital: { gt: 0, lt: 1000 } },
    select: { id: true, name: true, setupCapital: true },
  });

  if (lowSetupCapital.length > 0) {
    console.log(`   Found ${lowSetupCapital.length} records to fix`);
    for (const franchise of lowSetupCapital) {
      const oldValue = Number(franchise.setupCapital);
      const newValue = oldValue * 1000;
      await prisma.franchise.update({
        where: { id: franchise.id },
        data: { setupCapital: newValue },
      });
      console.log(`   ${franchise.name}: ${oldValue} → ${newValue}`);
    }
  } else {
    console.log('   ✅ No issues found\n');
  }

  // Fix workingCapital
  console.log('📊 Fixing workingCapital...');
  const lowWorkingCapital = await prisma.franchise.findMany({
    where: { workingCapital: { gt: 0, lt: 1000 } },
    select: { id: true, name: true, workingCapital: true },
  });

  if (lowWorkingCapital.length > 0) {
    console.log(`   Found ${lowWorkingCapital.length} records to fix`);
    for (const franchise of lowWorkingCapital) {
      const oldValue = Number(franchise.workingCapital);
      const newValue = oldValue * 1000;
      await prisma.franchise.update({
        where: { id: franchise.id },
        data: { workingCapital: newValue },
      });
      console.log(`   ${franchise.name}: ${oldValue} → ${newValue}`);
    }
  } else {
    console.log('   ✅ No issues found\n');
  }

  // Fix franchiseFee
  console.log('📊 Fixing franchiseFee...');
  const lowFranchiseFee = await prisma.franchise.findMany({
    where: { franchiseFee: { gt: 0, lt: 1000 } },
    select: { id: true, name: true, franchiseFee: true },
  });

  if (lowFranchiseFee.length > 0) {
    console.log(`   Found ${lowFranchiseFee.length} records to fix`);
    for (const franchise of lowFranchiseFee) {
      const oldValue = Number(franchise.franchiseFee);
      const newValue = oldValue * 1000;
      await prisma.franchise.update({
        where: { id: franchise.id },
        data: { franchiseFee: newValue },
      });
      console.log(`   ${franchise.name}: ${oldValue} → ${newValue}`);
    }
  } else {
    console.log('   ✅ No issues found\n');
  }

  // Fix averageMonthlyRevenue
  console.log('📊 Fixing averageMonthlyRevenue...');
  const lowRevenue = await prisma.franchise.findMany({
    where: { averageMonthlyRevenue: { gt: 0, lt: 1000 } },
    select: { id: true, name: true, averageMonthlyRevenue: true },
  });

  if (lowRevenue.length > 0) {
    console.log(`   Found ${lowRevenue.length} records to fix`);
    for (const franchise of lowRevenue) {
      const oldValue = Number(franchise.averageMonthlyRevenue);
      const newValue = oldValue * 1000;
      await prisma.franchise.update({
        where: { id: franchise.id },
        data: { averageMonthlyRevenue: newValue },
      });
      console.log(`   ${franchise.name}: ${oldValue} → ${newValue}`);
    }
  } else {
    console.log('   ✅ No issues found\n');
  }

  console.log('\n✅ Numeric values fix complete!');
}

async function main() {
  try {
    await fixNumericValues();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
