import prisma from '../lib/prisma.js';
import { calculateOceanLevel } from '../utils/gamificationHelper.js';
import { haversineDistance } from '../utils/geoHelper.js';

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
// Query opsional untuk laporan terdekat: ?lat=-6.9&lng=107.6&radius=5000 (meter, default 5000)
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();

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

    // challenge aktif + progress (otomatis, tanpa join)
    const activeChallenges = await prisma.challenge.findMany({
      where: { startDate: { lte: now }, endDate: { gte: now } },
      orderBy: { endDate: 'asc' },
    });
    const progressRows = await prisma.challengeProgress.findMany({
      where: { userId, challengeId: { in: activeChallenges.map((c) => c.id) } },
    });
    const progressMap = new Map(progressRows.map((p) => [p.challengeId, p]));

    const activeChallengeList = activeChallenges.map((challenge) => {
      const p = progressMap.get(challenge.id);
      return {
        id: challenge.id,
        name: challenge.name,
        target: challenge.target,
        rewardXP: challenge.rewardXP,
        endDate: challenge.endDate,
        progress: p ? p.progress : 0,
        isCompleted: p ? p.isCompleted : false,
      };
    });

    const challengesCompleted = await prisma.challengeProgress.count({
      where: { userId, isCompleted: true },
    });

    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    const latestReports = await prisma.report.findMany({
      where: { userId },
      include: { wasteTypes: true, photos: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const latestNotifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const unreadNotifications = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    // laporan VERIFIED di sekitar user (opsional, hanya kalau lat & lng dikirim)
    let nearbyReports = [];
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      const radius = parseFloat(req.query.radius) || 5000;
      const verified = await prisma.report.findMany({
        where: { status: 'VERIFIED' },
        select: { id: true, latitude: true, longitude: true, locationName: true, pollutionLevel: true },
      });
      nearbyReports = verified
        .map((r) => ({ ...r, distanceMeters: Math.round(haversineDistance(lat, lng, r.latitude, r.longitude)) }))
        .filter((r) => r.distanceMeters <= radius)
        .sort((a, b) => a.distanceMeters - b.distanceMeters);
    }

    res.json({
      user: { id: user.id, name: user.name },
      totalReports,
      reportsByStatus,
      totalXP: user.totalXP,
      oceanLevel: calculateOceanLevel(user.totalXP),
      activeChallenges: activeChallengeList,
      challengesCompleted,
      badges: userBadges.map((ub) => ({ ...ub.badge, earnedAt: ub.earnedAt })),
      latestReports,
      latestNotifications,
      unreadNotifications,
      nearbyReports,
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
