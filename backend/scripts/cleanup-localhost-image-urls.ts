import { PrismaClient } from '@prisma/client';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { URL } from 'url';

const prisma = new PrismaClient();

async function deleteLocalFileForUrl(
  imageUrl: string,
  uploadPath: string,
): Promise<void> {
  try {
    const parsedUrl = new URL(imageUrl);
    let pathname = parsedUrl.pathname;

    // Normalize path: strip leading '/uploads' so we don't duplicate it
    if (pathname.startsWith('/uploads/')) {
      pathname = pathname.substring('/uploads'.length);
    }

    const filePath = join(uploadPath, pathname);

    await unlink(filePath).catch((error: unknown) => {
      const fsError = error as NodeJS.ErrnoException;
      if (fsError.code === 'ENOENT') {
        // File already gone, safe to ignore
        return;
      }
      throw error;
    });
  } catch (error) {
    console.warn(`Failed to delete file for URL ${imageUrl}:`, error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  const uploadPath = process.env.UPLOAD_PATH || './uploads';

  console.log('🧹 Starting localhost image cleanup script...\n');
  if (dryRun) {
    console.log('⚠️ DRY RUN MODE - No files or records will be modified\n');
  }

  try {
    const franchises = await prisma.franchise.findMany({
      where: {
        OR: [
          { logoUrl: { contains: 'localhost' } },
          { thumbnailUrl: { contains: 'localhost' } },
          { galleryUrls: { contains: 'localhost' } },
        ],
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        thumbnailUrl: true,
        galleryUrls: true,
      },
    });

    if (franchises.length === 0) {
      console.log('✅ No franchises found with localhost image URLs.');
      return;
    }

    console.log(
      `Found ${franchises.length} franchise(s) with localhost image URLs.\n`,
    );

    let totalImageRefs = 0;

    for (const franchise of franchises) {
      const imageUrlsToRemove: string[] = [];

      // logoUrl / thumbnailUrl
      if (franchise.logoUrl && franchise.logoUrl.includes('localhost')) {
        imageUrlsToRemove.push(franchise.logoUrl);
      }
      if (
        franchise.thumbnailUrl &&
        franchise.thumbnailUrl.includes('localhost')
      ) {
        imageUrlsToRemove.push(franchise.thumbnailUrl);
      }

      // galleryUrls is stored as JSON string
      let galleryArray: string[] = [];
      if (franchise.galleryUrls) {
        try {
          const parsed = JSON.parse(franchise.galleryUrls) as unknown;
          if (Array.isArray(parsed)) {
            galleryArray = parsed.filter(
              (url): url is string => typeof url === 'string',
            );
          }
        } catch (error) {
          console.warn(
            `Failed to parse galleryUrls for franchise ${franchise.id}:`,
            error,
          );
        }
      }

      const galleryUrlsToRemove = galleryArray.filter((url) =>
        url.includes('localhost'),
      );
      imageUrlsToRemove.push(...galleryUrlsToRemove);

      if (imageUrlsToRemove.length === 0) {
        continue;
      }

      totalImageRefs += imageUrlsToRemove.length;

      console.log(
        `Franchise "${franchise.name}" (${franchise.id}) - removing ${imageUrlsToRemove.length} localhost image reference(s)`,
      );

      if (!dryRun) {
        // Delete files from disk (best-effort)
        await Promise.all(
          imageUrlsToRemove.map((url) =>
            deleteLocalFileForUrl(url, uploadPath),
          ),
        );

        // Build updated fields, clearing only localhost entries
        const updateData: {
          logoUrl?: string | null;
          thumbnailUrl?: string | null;
          galleryUrls?: string | null;
        } = {};

        if (franchise.logoUrl && franchise.logoUrl.includes('localhost')) {
          updateData.logoUrl = null;
        }
        if (
          franchise.thumbnailUrl &&
          franchise.thumbnailUrl.includes('localhost')
        ) {
          updateData.thumbnailUrl = null;
        }

        if (galleryArray.length > 0) {
          const filteredGallery = galleryArray.filter(
            (url) => !url.includes('localhost'),
          );
          updateData.galleryUrls =
            filteredGallery.length > 0 ? JSON.stringify(filteredGallery) : null;
        }

        await prisma.franchise.update({
          where: { id: franchise.id },
          data: updateData,
        });
      }
    }

    console.log('\n📊 Cleanup summary');
    console.log('=========================');
    console.log(`Franchises affected: ${franchises.length}`);
    console.log(`Image references removed: ${totalImageRefs}`);
    if (dryRun) {
      console.log('\n✅ DRY RUN complete – no changes were made.');
    } else {
      console.log('\n✅ Cleanup completed successfully.');
    }
  } catch (error) {
    console.error('❌ Error during localhost image cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
