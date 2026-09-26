import prisma from '../lib/prisma.js';

export async function checkAndAwardBadges(userId) {
  const badges = await prisma.badge.findMany();
  const awardedBadges = [];

  const verifiedReportCount = await prisma.report.count({
    where: { userId, status: 'VERIFIED' },
  });

  const completedChallengeCount = await prisma.challengeProgress.count({
    where: { userId, isCompleted: true },
  });

  for (const badge of badges) {
    const alreadyOwned = await prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    });

    if (alreadyOwned) continue;

    let qualifies = false;

    if (badge.requirementType === 'VERIFIED_REPORT_COUNT' && verifiedReportCount >= badge.requirementValue) {
      qualifies = true;
    }

    if (badge.requirementType === 'COMPLETED_CHALLENGE_COUNT' && completedChallengeCount >= badge.requirementValue) {
      qualifies = true;
    }

    if (qualifies) {
      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      });

      await prisma.notification.create({
        data: {
          userId,
          title: 'Badge Baru Diperoleh!',
          message: `Kamu mendapatkan badge "${badge.name}"!`,
          type: 'BADGE_EARNED',
        },
      });

      awardedBadges.push(badge);
    }
  }

  return awardedBadges;
}
