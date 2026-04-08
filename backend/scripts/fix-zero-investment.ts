/**
 * Fix franchises with zero investment values
 * 
 * Problem: Some franchises have minimumInvestment or maximumInvestment set to 0
 * Solution: Set these values to NULL to indicate missing data
 * 
 * This script will:
 * 1. Find all franchises with minimumInvestment = 0
 * 2. Find all franchises with maximumInvestment = 0
 * 3. Set those values to NULL
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixZeroInvestment() {
  console.log('🔧 Starting zero investment values fix...\n');

  // Fix minimumInvestment = 0
  console.log('📊 Fixing minimumInvestment with 0 values...');
  const zeroMinInvestment = await prisma.franchise.findMany({
    where: { minimumInvestment: 0 },
    select: { id: true, name: true, minimumInvestment: true, maximumInvestment: true },
  });

  if (zeroMinInvestment.length > 0) {
    console.log(`   Found ${zeroMinInvestment.length} records to fix`);
    for (const franchise of zeroMinInvestment) {
      await prisma.franchise.update({
        where: { id: franchise.id },
        data: { minimumInvestment: null },
      });
      console.log(`   ${franchise.name}: minimumInvestment 0 → NULL`);
    }
    console.log('   ✅ Done\n');
  } else {
    console.log('   ✅ No issues found\n');
  }

  // Fix maximumInvestment = 0
  console.log('📊 Fixing maximumInvestment with 0 values...');
  const zeroMaxInvestment = await prisma.franchise.findMany({
    where: { maximumInvestment: 0 },
    select: { id: true, name: true, minimumInvestment: true, maximumInvestment: true },
  });

  if (zeroMaxInvestment.length > 0) {
    console.log(`   Found ${zeroMaxInvestment.length} records to fix`);
    for (const franchise of zeroMaxInvestment) {
      await prisma.franchise.update({
        where: { id: franchise.id },
        data: { maximumInvestment: null },
      });
      console.log(`   ${franchise.name}: maximumInvestment 0 → NULL`);
    }
    console.log('   ✅ Done\n');
  } else {
    console.log('   ✅ No issues found\n');
  }

  // Report on franchises where both are now NULL
  console.log('📊 Checking franchises with both investment values NULL...');
  const bothNull = await prisma.franchise.count({
    where: {
      AND: [
        { minimumInvestment: null },
        { maximumInvestment: null },
      ],
    },
  });
  console.log(`   Found ${bothNull} franchises with no investment data\n`);

  console.log('✅ Zero investment values fix complete!');
}

async function main() {
  try {
    await fixZeroInvestment();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
