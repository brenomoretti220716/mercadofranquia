import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function toSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(base: string): Promise<string> {
  let slug = base || 'franchise';
  let suffix = 2;

  // Try base slug, then slug-2, slug-3, ... until it is unique

  while (true) {
    const existing = await prisma.franchise.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function main() {
  const franchises = await prisma.franchise.findMany({
    select: { id: true, name: true, slug: true },
  });

  for (const franchise of franchises) {
    if (franchise.slug) continue;

    const base = toSlug(franchise.name);
    const unique = await generateUniqueSlug(base);

    await prisma.franchise.update({
      where: { id: franchise.id },
      data: { slug: unique },
    });
  }
}

main()
  .catch((error) => {
    console.error('Error backfilling franchise slugs:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
