/**
 * Fix numeric values using direct SQL for better performance
 * Multiplies values < 1000 by 1000 to fix incorrect CAST results
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixField(field: string) {
  console.log(`📊 Fixing ${field}...`);

  // Count records that need fixing
  const countResult: any = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as count FROM Franchise WHERE \`${field}\` > 0 AND \`${field}\` < 1000`,
  );

  const count = Number(countResult[0]?.count || 0);

  if (count === 0) {
    console.log(`   ✅ No issues found\n`);
    return;
  }

  console.log(`   Found ${count} records to fix`);

  // Batch update using raw SQL
  const result = await prisma.$executeRawUnsafe(
    `UPDATE Franchise SET \`${field}\` = \`${field}\` * 1000 WHERE \`${field}\` > 0 AND \`${field}\` < 1000`,
  );

  console.log(`   ✅ Fixed ${result} records\n`);
}

async function fixNumericValuesBatch() {
  console.log('🔧 Starting batch numeric values fix...\n');

  const fields = [
    'minimumInvestment',
    'maximumInvestment',
    'setupCapital',
    'workingCapital',
    'franchiseFee',
    'averageMonthlyRevenue',
  ];

  for (const field of fields) {
    await fixField(field);
  }

  console.log('✅ All numeric values fixed!\n');

  // Verify no invalid ranges (min > max)
  console.log('🔍 Checking for invalid ranges...');
  const invalidRanges: any = await prisma.$queryRaw`
    SELECT id, name, minimumInvestment, maximumInvestment
    FROM Franchise
    WHERE minimumInvestment IS NOT NULL 
      AND maximumInvestment IS NOT NULL
      AND minimumInvestment > maximumInvestment
    LIMIT 10
  `;

  if (invalidRanges.length > 0) {
    console.log(`   ⚠️  Found ${invalidRanges.length} invalid ranges (showing first 10):`);
    invalidRanges.forEach((f: any) => {
      console.log(
        `      ${f.name}: min=${f.minimumInvestment}, max=${f.maximumInvestment}`,
      );
    });
    console.log('\n   You may want to manually review these.\n');
  } else {
    console.log('   ✅ No invalid ranges found\n');
  }

  // Show some sample corrected values
  console.log('📋 Sample corrected values:');
  const samples: any = await prisma.$queryRaw`
    SELECT name, minimumInvestment, maximumInvestment, franchiseFee
    FROM Franchise
    WHERE minimumInvestment IS NOT NULL
    ORDER BY minimumInvestment ASC
    LIMIT 5
  `;

  samples.forEach((f: any) => {
    console.log(
      `   ${f.name}: investment=${f.minimumInvestment}${f.maximumInvestment ? ` - ${f.maximumInvestment}` : ''}, fee=${f.franchiseFee || 'N/A'}`,
    );
  });
}

async function main() {
  try {
    await fixNumericValuesBatch();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
