import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listSegments() {
  try {
    console.log('🔍 Fetching all segments and subsegments...\n');

    // Get all franchises with segment and subsegment data
    const franchises = await prisma.franchise.findMany({
      where: {
        OR: [{ segment: { not: null } }, { subsegment: { not: null } }],
      },
      select: {
        segment: true,
        subsegment: true,
      },
    });

    // Extract unique segments
    const segmentsSet = new Set<string>();
    const subsegmentsSet = new Set<string>();

    franchises.forEach((franchise) => {
      if (franchise.segment) {
        segmentsSet.add(franchise.segment);
      }
      if (franchise.subsegment) {
        subsegmentsSet.add(franchise.subsegment);
      }
    });

    // Convert to sorted arrays
    const segments = Array.from(segmentsSet).sort();
    const subsegments = Array.from(subsegmentsSet).sort();

    // Display results
    console.log('📊 SEGMENTS');
    console.log('='.repeat(50));
    console.log(`Total unique segments: ${segments.length}\n`);

    if (segments.length > 0) {
      segments.forEach((segment, index) => {
        console.log(`${index + 1}. ${segment}`);
      });
    } else {
      console.log('No segments found.');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    console.log('📊 SUBSEGMENTS');
    console.log('='.repeat(50));
    console.log(`Total unique subsegments: ${subsegments.length}\n`);

    if (subsegments.length > 0) {
      subsegments.forEach((subsegment, index) => {
        console.log(`${index + 1}. ${subsegment}`);
      });
    } else {
      console.log('No subsegments found.');
    }

    console.log('\n' + '='.repeat(50));
    console.log(`\n✅ Total franchises analyzed: ${franchises.length}`);
  } catch (error) {
    console.error('❌ Error fetching segments:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listSegments();
