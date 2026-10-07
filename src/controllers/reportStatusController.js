import prisma from '../lib/prisma.js';

// status tujuan -> status asal yang diperbolehkan
const requiredCurrentStatus = {
  UNDER_REVIEW: 'SUBMITTED',
  IN_PROGRESS: 'VERIFIED',
  RESOLVED: 'IN_PROGRESS',
};

const notificationMessages = {
  UNDER_REVIEW: 'Laporan kamu sedang ditinjau oleh Admin.',
  IN_PROGRESS: 'Laporan kamu sedang dalam proses penanganan.',
  RESOLVED: 'Laporan kamu telah selesai ditangani. Terima kasih atas kontribusimu!',
};

// PATCH /api/reports/:id/status - khusus admin
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!requiredCurrentStatus[status]) {
      return res.status(400).json({
        message: 'Status tidak valid, harus UNDER_REVIEW, IN_PROGRESS, atau RESOLVED. Untuk VERIFIED/REJECTED gunakan endpoint verify',
      });
    }

    const report = await prisma.report.findUnique({ where: { id: Number(id) } });
    if (!report) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    const expected = requiredCurrentStatus[status];
    if (report.status !== expected) {
      return res.status(409).json({
        message: `Status ${status} hanya bisa dari ${expected}, sedangkan status laporan saat ini ${report.status}`,
      });
    }

    const updatedReport = await prisma.report.update({
      where: { id: Number(id) },
      data: { status },
    });

    await prisma.notification.create({
      data: {
        userId: report.userId,
        title: 'Status Laporan Diperbarui',
        message: notificationMessages[status],
        type: 'REPORT_STATUS_CHANGED',
      },
    });

    res.json({ message: `Status laporan berhasil diubah menjadi ${status}`, report: updatedReport });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
