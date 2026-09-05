import prisma from '../lib/prisma.js';

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
