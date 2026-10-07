import prisma from '../lib/prisma.js';

// Dipanggil saat laporan user berstatus VERIFIED.
// Semua challenge yang sedang aktif otomatis dibuatkan progress-nya (tanpa join),
// lalu progress ditambah 1. Kalau target tercapai: tandai selesai, beri rewardXP, kirim notifikasi.
export async function advanceChallengesForUser(userId) {
  const now = new Date();

  const activeChallenges = await prisma.challenge.findMany({
    where: { startDate: { lte: now }, endDate: { gte: now } },
  });

  for (const challenge of activeChallenges) {
    const progressRow = await prisma.challengeProgress.upsert({
      where: { userId_challengeId: { userId, challengeId: challenge.id } },
      update: {},
      create: { userId, challengeId: challenge.id, progress: 0, isCompleted: false },
    });

    if (progressRow.isCompleted) continue;

    const newProgress = progressRow.progress + 1;
    const isNowCompleted = newProgress >= challenge.target;

    await prisma.challengeProgress.update({
      where: { id: progressRow.id },
      data: {
        progress: newProgress,
        isCompleted: isNowCompleted,
        completedAt: isNowCompleted ? now : null,
      },
    });

    if (isNowCompleted) {
      await prisma.user.update({
        where: { id: userId },
        data: { totalXP: { increment: challenge.rewardXP } },
      });

      await prisma.notification.create({
        data: {
          userId,
          title: 'Challenge Selesai!',
          message: `Kamu berhasil menyelesaikan challenge "${challenge.name}" dan mendapatkan ${challenge.rewardXP} XP!`,
          type: 'CHALLENGE_COMPLETED',
        },
      });
    }
  }
}
