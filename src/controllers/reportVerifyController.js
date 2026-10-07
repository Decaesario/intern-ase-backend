import prisma from '../lib/prisma.js';
import { checkAndAwardBadges } from '../utils/badgeChecker.js';
import { advanceChallengesForUser } from '../utils/challengeHelper.js';

// VERIFY - khusus admin, approve/reject laporan (hanya dari status UNDER_REVIEW)
export const verifyReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectReason } = req.body;

    const reportId = Number(id);
    if (!Number.isInteger(reportId)) {
      return res.status(400).json({ message: 'ID laporan tidak valid' });
    }

    const validStatuses = ['VERIFIED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid, harus VERIFIED atau REJECTED' });
    }

    if (status === 'REJECTED' && !rejectReason) {
      return res.status(400).json({ message: 'Alasan penolakan wajib diisi' });
    }

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    if (report.status !== 'UNDER_REVIEW') {
      return res.status(409).json({
        message: `Laporan hanya bisa diverifikasi atau ditolak dari status UNDER_REVIEW, sedangkan status laporan saat ini ${report.status}`,
      });
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        rejectReason: status === 'REJECTED' ? rejectReason : null,
      },
    });

    if (status === 'VERIFIED') {
      await prisma.user.update({
        where: { id: report.userId },
        data: { totalXP: { increment: 20 } },
      });

      await prisma.notification.create({
        data: {
          userId: report.userId,
          title: 'Laporan Diverifikasi',
          message: 'Laporan kamu telah diverifikasi oleh Admin.',
          type: 'REPORT_STATUS_CHANGED',
        },
      });

      await prisma.notification.create({
        data: {
          userId: report.userId,
          title: 'XP Bertambah',
          message: 'Kamu mendapatkan 20 XP dari laporan yang terverifikasi!',
          type: 'XP_EARNED',
        },
      });

      await advanceChallengesForUser(report.userId);
      await checkAndAwardBadges(report.userId);
    }

    if (status === 'REJECTED') {
      await prisma.notification.create({
        data: {
          userId: report.userId,
          title: 'Laporan Ditolak',
          message: `Laporan kamu ditolak. Alasan: ${rejectReason}`,
          type: 'REPORT_REJECTED',
        },
      });
    }

    res.json({ message: `Status laporan berhasil diubah menjadi ${status}`, report: updatedReport });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
