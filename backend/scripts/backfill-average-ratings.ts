import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillAverageRatings() {
  const groups = await prisma.review.groupBy({
    by: ['franchiseId'],
    where: { isActive: true },
    _sum: { rating: true },
    _count: { rating: true },
  });

  const franchiseIds = await prisma.franchise.findMany({
    select: { id: true },
  });

  const withReviewsSet = new Set(groups.map((g) => g.franchiseId));
  const idsWithoutActiveReviews = franchiseIds
    .map((f) => f.id)
    .filter((id) => !withReviewsSet.has(id));

  const updates = groups.map((g) => {
    const sum = g._sum.rating ?? 0;
    const count = g._count.rating ?? 0;
    const average = count > 0 ? Number(sum) / count : null;
    return prisma.franchise.update({
      where: { id: g.franchiseId },
      data: {
        ratingSum: sum,
        reviewCount: count,
        averageRating: average,
      },
    });
  });

  const resets = idsWithoutActiveReviews.length
    ? [
        prisma.franchise.updateMany({
          where: { id: { in: idsWithoutActiveReviews } },
          data: { ratingSum: 0, reviewCount: 0, averageRating: null },
        }),
      ]
    : [];

  await prisma.$transaction([...updates, ...resets]);

  return { updated: groups.length, reset: idsWithoutActiveReviews.length };
}

async function main() {
  try {
    const result = await backfillAverageRatings();

    console.log(
      `Backfill complete. Updated: ${result.updated}, Reset: ${result.reset}`,
    );
  } catch (error) {
    console.error('Backfill failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
