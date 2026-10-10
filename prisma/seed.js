import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma.js';

const wasteTypes = ['Plastik', 'Organik', 'Kaca', 'Logam', 'Jaring', 'Lainnya'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function seedWasteTypes() {
  for (const name of wasteTypes) {
    await prisma.wasteType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const total = await prisma.wasteType.count();
  console.log(`Jenis sampah: ${total} data`);
}

// Admin pertama dibuat dari ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD di .env.
// Kalau email sudah ada, akunnya dijadikan ADMIN dan diaktifkan lagi (password tidak diubah).
async function seedAdmin() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log('Admin dilewati: ADMIN_EMAIL dan ADMIN_PASSWORD belum diatur di .env');
    return;
  }

  const email = ADMIN_EMAIL.trim();
  if (!EMAIL_REGEX.test(email)) {
    throw new Error('ADMIN_EMAIL tidak valid');
  }
  if (ADMIN_PASSWORD.length < 8) {
    throw new Error('ADMIN_PASSWORD minimal 8 karakter');
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN', isActive: true },
    });
    console.log(`Admin: akun ${email} sudah ada, dijadikan ADMIN (password tidak diubah)`);
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.create({
    data: {
      name: (ADMIN_NAME || 'Admin OceanGuard').trim(),
      email,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Admin: akun ${email} berhasil dibuat`);
}

async function main() {
  await seedWasteTypes();
  await seedAdmin();
  console.log('Seed selesai.');
}

main()
  .catch((error) => {
    console.error('Seed gagal:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
