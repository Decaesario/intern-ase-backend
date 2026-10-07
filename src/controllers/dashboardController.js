import prisma from '../lib/prisma.js';
import { calculateOceanLevel } from '../utils/gamificationHelper.js';

// GET /api/dashboard/admin - ringkasan buat admin
export const getAdminDashboard = async (req, res) => {
  try {
    const totalReports = await prisma.report.count();
    const totalUsers = await prisma.user.count();

    const statusCounts = await prisma.report.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const summaryByStatus = {
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      VERIFIED: 0,
      REJECTED: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
    };

    statusCounts.forEach((item) => {
      summaryByStatus[item.status] = item._count.status;
    });

    const pendingReports = await prisma.report.findMany({
      where: { status: 'SUBMITTED' },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    res.json({
      totalReports,
      totalUsers,
      summaryByStatus,
      pendingReports,
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// GET /api/dashboard/user - ringkasan kontribusi user yang login
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, totalXP: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const statusCounts = await prisma.report.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true },
    });

    const reportsByStatus = {
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      VERIFIED: 0,
      REJECTED: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
    };

    let totalReports = 0;
    statusCounts.forEach((item) => {
      reportsByStatus[item.status] = item._count.status;
      totalReports += item._count.status;
    });

    const challengesJoined = await prisma.challengeProgress.count({ where: { userId } });
    const challengesCompleted = await prisma.challengeProgress.count({
      where: { userId, isCompleted: true },
    });

    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    res.json({
      user: { id: user.id, name: user.name },
      totalReports,
      reportsByStatus,
      challengesJoined,
      challengesCompleted,
      totalXP: user.totalXP,
      oceanLevel: calculateOceanLevel(user.totalXP),
      badges: userBadges.map((ub) => ({ ...ub.badge, earnedAt: ub.earnedAt })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
