import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';

interface DuplicateReport {
  generatedAt: string;
  summary: {
    totalGroups: number;
    totalDuplicates: number;
    duplicatesWithOwner: number;
    duplicatesWithReviews: number;
    duplicatesWithFavorites: number;
  };
  groups: Array<{
    scrapedWebsite: string;
    originalId: string;
    duplicateIds: string[];
    franchises: Array<{
      id: string;
      name: string;
      createdAt: string;
      ownerId: string | null;
      hasOwner: boolean;
      hasReviews: boolean;
      hasFavorites: boolean;
    }>;
  }>;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipConfirmation = args.includes('--yes');

  console.log('🗑️  Starting duplicate franchises deletion script...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No franchises will be deleted\n');
  }

  const prismaClient = new PrismaClient();

  try {
    // 1. Carregar relatório de duplicatas
    const reportPath = 'data/exports/duplicate-franchises-report.json';
    let report: DuplicateReport;

    try {
      const reportContent = await readFile(reportPath, 'utf-8');
      report = JSON.parse(reportContent);
    } catch (error) {
      console.error(`❌ Error reading report file: ${reportPath}`);
      console.error(
        '   Please run find-duplicate-franchises.ts first to generate the report.',
      );
      process.exit(1);
    }

    console.log(`📋 Loaded report generated at: ${report.generatedAt}`);
    console.log(
      `   Found ${report.summary.totalGroups} duplicate groups with ${report.summary.totalDuplicates} duplicates\n`,
    );

    // 2. Verificações de segurança
    if (report.summary.duplicatesWithOwner > 0) {
      console.log(
        '⚠️  WARNING: Some duplicates have owners! These should NOT be deleted.\n',
      );
      console.log('   Review the following franchises before proceeding:');
      for (const group of report.groups) {
        const duplicatesWithOwner = group.franchises
          .filter((f) => f.id !== group.originalId && f.hasOwner)
          .map((f) => `${f.name} (ID: ${f.id}, Owner: ${f.ownerId})`);

        if (duplicatesWithOwner.length > 0) {
          console.log(`\n   Group: ${group.scrapedWebsite}`);
          for (const dup of duplicatesWithOwner) {
            console.log(`     ⚠️  ${dup}`);
          }
        }
      }
      console.log();

      if (!skipConfirmation) {
        console.log(
          '❌ Cannot proceed: duplicates with owners detected. Please review manually.',
        );
        console.log(
          '   If you want to proceed anyway (NOT RECOMMENDED), use --yes flag.',
        );
        process.exit(1);
      } else {
        console.log(
          '⚠️  Proceeding with deletion despite duplicates with owners (--yes flag used)',
        );
      }
    }

    // 3. Confirmar antes de deletar
    if (!dryRun && !skipConfirmation) {
      console.log('⚠️  This will delete the following franchises:');
      console.log();
      for (const group of report.groups) {
        console.log(`   Group: ${group.scrapedWebsite}`);
        console.log(`     Keeping: ${group.originalId}`);
        console.log(`     Deleting: ${group.duplicateIds.join(', ')}`);
      }
      console.log();
      console.log(
        '⚠️  This action cannot be undone! Related data will be deleted (cascade):',
      );
      console.log('   - Reviews and review responses');
      console.log('   - Favorites');
      console.log('   - Business Models');
      console.log('   - Monthly Units');
      console.log();
      console.log('   Type "DELETE" to confirm, or anything else to cancel:');

      // Para scripts Node, vamos usar uma confirmação simples via argumento
      // Em ambiente interativo, o usuário deve usar --yes após revisar
      console.log();
      console.log(
        '   To proceed, run again with --yes flag: npm run delete-duplicates -- --yes',
      );
      process.exit(0);
    }

    // 4. Deletar duplicatas
    if (dryRun) {
      console.log('🔍 DRY RUN - Would delete the following:');
      for (const group of report.groups) {
        for (const dupId of group.duplicateIds) {
          const dup = group.franchises.find((f) => f.id === dupId);
          console.log(
            `   - ${dup?.name} (ID: ${dupId}) from group: ${group.scrapedWebsite}`,
          );
        }
      }
      console.log(
        `\n✅ DRY RUN complete. Would delete ${report.summary.totalDuplicates} franchises.`,
      );
      return;
    }

    console.log('🗑️  Starting deletion process...\n');

    let deletedCount = 0;
    let errorCount = 0;
    const errors: Array<{ id: string; name: string; error: string }> = [];

    for (const group of report.groups) {
      for (const dupId of group.duplicateIds) {
        const dup = group.franchises.find((f) => f.id === dupId);
        const dupName = dup?.name || 'Unknown';

        try {
          // Verificar se ainda existe antes de deletar
          const existing = await prismaClient.franchise.findUnique({
            where: { id: dupId },
            select: { id: true, name: true },
          });

          if (!existing) {
            console.log(
              `   ⚠️  Franchise ${dupName} (${dupId}) no longer exists, skipping...`,
            );
            continue;
          }

          // Deletar a franquia (cascades will handle related data)
          await prismaClient.franchise.delete({
            where: { id: dupId },
          });

          console.log(`   ✅ Deleted: ${dupName} (${dupId})`);
          deletedCount++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.error(
            `   ❌ Failed to delete ${dupName} (${dupId}): ${errorMessage}`,
          );
          errors.push({
            id: dupId,
            name: dupName,
            error: errorMessage,
          });
          errorCount++;
        }
      }
    }

    console.log();
    console.log('='.repeat(80));
    console.log('📊 DELETION SUMMARY');
    console.log('='.repeat(80));
    console.log(
      `Total duplicates in report: ${report.summary.totalDuplicates}`,
    );
    console.log(`Successfully deleted: ${deletedCount}`);
    console.log(`Errors: ${errorCount}`);

    if (errors.length > 0) {
      console.log();
      console.log('❌ Errors encountered:');
      for (const err of errors) {
        console.log(`   - ${err.name} (${err.id}): ${err.error}`);
      }
    }

    console.log();
    console.log('✅ Deletion process completed!');
  } catch (error) {
    console.error('\n❌ Error deleting duplicates:', error);
    process.exit(1);
  } finally {
    await prismaClient.$disconnect();
  }
}

void main();
