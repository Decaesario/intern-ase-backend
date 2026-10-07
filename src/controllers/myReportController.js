import prisma from '../lib/prisma.js';

// GET /api/reports/me - daftar laporan milik user yang login (Laporanku)
export const getMyReports = async (req, res) => {
  try {
    const { status } = req.query;

    const where = { userId: req.user.userId };
    if (status) where.status = status;

    const reports = await prisma.report.findMany({
      where,
      include: { wasteTypes: true, photos: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ total: reports.length, reports });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
