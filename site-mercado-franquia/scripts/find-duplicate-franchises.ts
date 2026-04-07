import { PrismaClient } from '@prisma/client';

interface DuplicateGroup {
  scrapedWebsite: string;
  franchises: Array<{
    id: string;
    name: string;
    createdAt: Date;
    ownerId: string | null;
    reviewCount: number;
    favoritesCount: number;
    hasReviews: boolean;
    hasFavorites: boolean;
    hasOwner: boolean;
    businessModelsCount: number;
    monthlyUnitsCount: number;
  }>;
}

async function main() {
  console.log('🔍 Starting duplicate franchises identification script...\n');

  const prismaClient = new PrismaClient();

  try {
    // 1. Buscar todas as franquias com scrapedWebsite não nulo
    console.log('📊 Fetching franchises with scrapedWebsite...');
    const franchisesWithWebsite = await prismaClient.franchise.findMany({
      where: {
        scrapedWebsite: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        ownerId: true,
        scrapedWebsite: true,
        reviewCount: true,
        favoritesCount: true,
        reviews: {
          select: {
            id: true,
          },
        },
        favorites: {
          select: {
            id: true,
          },
        },
        businessModels: {
          select: {
            id: true,
          },
        },
        monthlyUnits: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(
      `✅ Found ${franchisesWithWebsite.length} franchises with scrapedWebsite\n`,
    );

    // 2. Agrupar por scrapedWebsite
    const groupedByWebsite = new Map<string, typeof franchisesWithWebsite>();

    for (const franchise of franchisesWithWebsite) {
      const website = franchise.scrapedWebsite!;
      if (!groupedByWebsite.has(website)) {
        groupedByWebsite.set(website, []);
      }
      groupedByWebsite.get(website)!.push(franchise);
    }

    // 3. Identificar grupos com mais de 1 franquia (duplicatas)
    const duplicateGroups: DuplicateGroup[] = [];

    for (const [scrapedWebsite, franchises] of groupedByWebsite.entries()) {
      if (franchises.length > 1) {
        const group: DuplicateGroup = {
          scrapedWebsite,
          franchises: franchises.map((f) => ({
            id: f.id,
            name: f.name,
            createdAt: f.createdAt,
            ownerId: f.ownerId,
            reviewCount: f.reviewCount,
            favoritesCount: f.favoritesCount,
            hasReviews: f.reviews.length > 0,
            hasFavorites: f.favorites.length > 0,
            hasOwner: f.ownerId !== null,
            businessModelsCount: f.businessModels.length,
            monthlyUnitsCount: f.monthlyUnits.length,
          })),
        };

        // Ordenar por createdAt (mais antiga primeiro)
        group.franchises.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        );

        duplicateGroups.push(group);
      }
    }

    console.log(
      `🔍 Found ${duplicateGroups.length} groups with duplicate franchises\n`,
    );

    if (duplicateGroups.length === 0) {
      console.log('✅ No duplicate franchises found! Database is clean.');
      return;
    }

    // 4. Gerar relatório detalhado
    console.log('='.repeat(80));
    console.log('📋 DUPLICATE FRANCHISES REPORT');
    console.log('='.repeat(80));
    console.log();

    let totalDuplicates = 0;
    let duplicatesWithOwner = 0;
    let duplicatesWithReviews = 0;
    let duplicatesWithFavorites = 0;

    for (let i = 0; i < duplicateGroups.length; i++) {
      const group = duplicateGroups[i];
      const original = group.franchises[0]; // Mais antiga
      const duplicates = group.franchises.slice(1); // Restantes são duplicatas

      totalDuplicates += duplicates.length;

      console.log(`Group ${i + 1}: ${group.scrapedWebsite}`);
      console.log(`  Total franchises: ${group.franchises.length}`);
      console.log(
        `  Original (to keep): ${original.name} (ID: ${original.id})`,
      );
      console.log(`    Created: ${original.createdAt.toISOString()}`);
      console.log(
        `    Owner: ${original.hasOwner ? `Yes (${original.ownerId})` : 'No'}`,
      );
      console.log(
        `    Reviews: ${original.reviewCount} (${original.hasReviews ? 'Has reviews' : 'No reviews'})`,
      );
      console.log(
        `    Favorites: ${original.favoritesCount} (${original.hasFavorites ? 'Has favorites' : 'No favorites'})`,
      );
      console.log(`    Business Models: ${original.businessModelsCount}`);
      console.log(`    Monthly Units: ${original.monthlyUnitsCount}`);

      console.log(`  Duplicates (to delete):`);
      for (const dup of duplicates) {
        if (dup.hasOwner) duplicatesWithOwner++;
        if (dup.hasReviews) duplicatesWithReviews++;
        if (dup.hasFavorites) duplicatesWithFavorites++;

        console.log(`    - ${dup.name} (ID: ${dup.id})`);
        console.log(`      Created: ${dup.createdAt.toISOString()}`);
        console.log(
          `      Owner: ${dup.hasOwner ? `⚠️  YES (${dup.ownerId}) - WARNING!` : 'No'}`,
        );
        console.log(
          `      Reviews: ${dup.reviewCount} (${dup.hasReviews ? '⚠️  Has reviews' : 'No reviews'})`,
        );
        console.log(
          `      Favorites: ${dup.favoritesCount} (${dup.hasFavorites ? '⚠️  Has favorites' : 'No favorites'})`,
        );
        console.log(`      Business Models: ${dup.businessModelsCount}`);
        console.log(`      Monthly Units: ${dup.monthlyUnitsCount}`);
      }
      console.log();
    }

    console.log('='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total duplicate groups: ${duplicateGroups.length}`);
    console.log(`Total duplicate franchises: ${totalDuplicates}`);
    console.log(
      `⚠️  Duplicates with owner: ${duplicatesWithOwner} (these should NOT be deleted!)`,
    );
    console.log(
      `⚠️  Duplicates with reviews: ${duplicatesWithReviews} (will be deleted with cascade)`,
    );
    console.log(
      `⚠️  Duplicates with favorites: ${duplicatesWithFavorites} (will be deleted with cascade)`,
    );
    console.log();

    // 5. Salvar relatório em arquivo JSON para o script de deleção
    const reportPath = 'data/exports/duplicate-franchises-report.json';
    const fs = await import('fs/promises');
    const path = await import('path');

    const reportDir = path.dirname(reportPath);
    await fs.mkdir(reportDir, { recursive: true });

    await fs.writeFile(
      reportPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          summary: {
            totalGroups: duplicateGroups.length,
            totalDuplicates,
            duplicatesWithOwner,
            duplicatesWithReviews,
            duplicatesWithFavorites,
          },
          groups: duplicateGroups.map((group) => ({
            scrapedWebsite: group.scrapedWebsite,
            originalId: group.franchises[0].id,
            duplicateIds: group.franchises.slice(1).map((f) => f.id),
            franchises: group.franchises,
          })),
        },
        null,
        2,
      ),
      'utf-8',
    );

    console.log(`💾 Report saved to: ${reportPath}`);
    console.log();
    console.log(
      '⚠️  IMPORTANT: Review the report carefully before deleting duplicates!',
    );
    console.log(
      '⚠️  Especially check if any duplicates with ownerId should be kept instead.',
    );
    console.log();
  } catch (error) {
    console.error('\n❌ Error finding duplicates:', error);
    process.exit(1);
  } finally {
    await prismaClient.$disconnect();
  }
}

void main();
