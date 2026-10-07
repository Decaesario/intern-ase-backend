import prisma from '../lib/prisma.js';

const REPORT_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'IN_PROGRESS', 'RESOLVED'];

// Status yang boleh dilihat orang lain (bukan pemilik/admin)
const PUBLIC_STATUSES = ['VERIFIED', 'IN_PROGRESS', 'RESOLVED'];

// Bangun filter pencarian: lokasi, deskripsi, jenis sampah, atau ID laporan
export const buildSearchFilter = (search) => {
  const keyword = String(search || '').trim();
  if (!keyword) return null;

  const conditions = [
    { locationName: { contains: keyword } },
    { description: { contains: keyword } },
    { customWasteType: { contains: keyword } },
    { wasteTypes: { some: { name: { contains: keyword } } } },
  ];

  if (/^\d+$/.test(keyword)) {
    conditions.push({ id: Number(keyword) });
  }

  return { OR: conditions };
};

// READ - semua laporan, khusus admin (Kelola Laporan)
// GET /api/reports?status=SUBMITTED&search=plastik
export const getAllReports = async (req, res) => {
  try {
    const { status, search } = req.query;

    if (status && !REPORT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status harus salah satu dari ${REPORT_STATUSES.join(', ')}` });
    }

    const where = {};
    if (status) where.status = status;

    const searchFilter = buildSearchFilter(search);
    if (searchFilter) Object.assign(where, searchFilter);

    const reports = await prisma.report.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        wasteTypes: true,
        photos: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ total: reports.length, reports });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// READ - detail 1 laporan
// Admin dan pemilik boleh melihat semua status; user lain hanya laporan yang sudah VERIFIED ke atas
export const getReportById = async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    if (!Number.isInteger(reportId)) {
      return res.status(400).json({ message: 'ID laporan tidak valid' });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        user: { select: { id: true, name: true } },
        wasteTypes: true,
        photos: true,
      },
    });

    if (!report) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = report.userId === req.user.userId;

    if (!isAdmin && !isOwner && !PUBLIC_STATUSES.includes(report.status)) {
      return res.status(403).json({ message: 'Kamu tidak punya akses ke laporan ini' });
    }

    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
