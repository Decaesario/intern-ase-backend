import prisma from '../src/lib/prisma.js';

const wasteTypes = ['Plastik', 'Organik', 'Kaca', 'Logam', 'Jaring', 'Lainnya'];

async function main() {
  for (const name of wasteTypes) {
    await prisma.wasteType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const total = await prisma.wasteType.count();
  console.log(`Seed selesai. Total jenis sampah: ${total}`);
}

main()
  .catch((error) => {
    console.error('Seed gagal:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
