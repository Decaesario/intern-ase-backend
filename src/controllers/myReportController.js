import prisma from '../lib/prisma.js';
import { buildSearchFilter } from './reportQueryController.js';

const REPORT_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'IN_PROGRESS', 'RESOLVED'];

// GET /api/reports/me - daftar laporan milik user yang login (Laporanku)
// Query opsional: ?status=VERIFIED&search=plastik
export const getMyReports = async (req, res) => {
  try {
    const { status, search } = req.query;

    if (status && !REPORT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status harus salah satu dari ${REPORT_STATUSES.join(', ')}` });
    }

    const where = { userId: req.user.userId };
    if (status) where.status = status;

    const searchFilter = buildSearchFilter(search);
    if (searchFilter) Object.assign(where, searchFilter);

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
