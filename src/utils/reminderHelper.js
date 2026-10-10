import prisma from '../lib/prisma.js';

// Pengingat dikirim ke user yang belum menyelesaikan challenge yang berakhir dalam 2 hari
export const REMINDER_WINDOW_DAYS = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

const shortenName = (name) => (name.length > 90 ? `${name.slice(0, 87)}...` : name);

// Tiap user hanya dapat 1 pengingat per challenge, jadi aman dipanggil berulang kali
export async function sendChallengeReminders() {
  const now = new Date();
  const deadline = new Date(now.getTime() + REMINDER_WINDOW_DAYS * DAY_MS);

  const challenges = await prisma.challenge.findMany({
    where: {
      startDate: { lte: now },
      endDate: { gte: now, lte: deadline },
    },
  });

  let remindersSent = 0;

  for (const challenge of challenges) {
    const label = `"${shortenName(challenge.name)}"`;

    // user aktif yang belum menyelesaikan challenge ini (termasuk yang belum punya progress)
    const users = await prisma.user.findMany({
      where: {
        role: 'USER',
        isActive: true,
        NOT: {
          challengeProgress: { some: { challengeId: challenge.id, isCompleted: true } },
        },
      },
      select: { id: true },
    });

    if (users.length === 0) continue;

    const alreadyReminded = await prisma.notification.findMany({
      where: {
        type: 'CHALLENGE_REMINDER',
        userId: { in: users.map((u) => u.id) },
        createdAt: { gte: challenge.startDate },
        message: { contains: label },
      },
      select: { userId: true },
    });

    const remindedIds = new Set(alreadyReminded.map((n) => n.userId));
    const targets = users.filter((u) => !remindedIds.has(u.id));

    if (targets.length === 0) continue;

    const daysLeft = Math.max(1, Math.ceil((challenge.endDate - now) / DAY_MS));

    await prisma.notification.createMany({
      data: targets.map((u) => ({
        userId: u.id,
        title: 'Pengingat Challenge',
        message: `Challenge ${label} berakhir dalam ${daysLeft} hari. Ayo selesaikan sebelum waktunya habis!`,
        type: 'CHALLENGE_REMINDER',
      })),
    });

    remindersSent += targets.length;
  }

  return { challengesChecked: challenges.length, remindersSent };
}
