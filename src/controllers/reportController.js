import prisma from '../lib/prisma.js';

// CREATE - bikin laporan baru
export const createReport = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      locationName,
      wasteTypeIds,
      customWasteType,
      pollutionLevel,
      description,
      photoUrls,
    } = req.body;

    if (!latitude || !longitude || !pollutionLevel || !wasteTypeIds || wasteTypeIds.length === 0) {
      return res.status(400).json({
        message: 'Latitude, longitude, pollutionLevel, dan minimal 1 wasteTypeIds wajib diisi',
      });
    }

    if (!photoUrls || photoUrls.length < 1 || photoUrls.length > 5) {
      return res.status(400).json({ message: 'Wajib upload 1 sampai 5 foto' });
    }

    const report = await prisma.report.create({
      data: {
        userId: req.user.userId,
        latitude,
        longitude,
        locationName: locationName || null,
        pollutionLevel,
        description: description || null,
        customWasteType: customWasteType || null,
        wasteTypes: {
          connect: wasteTypeIds.map((id) => ({ id })),
        },
        photos: {
          create: photoUrls.map((url) => ({ fileUrl: url })),
        },
      },
      include: { wasteTypes: true, photos: true },
    });

    res.status(201).json({ message: 'Laporan berhasil dibuat', report });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// READ - semua laporan (bisa difilter by status)
export const getAllReports = async (req, res) => {
  try {
    const { status } = req.query;

    const reports = await prisma.report.findMany({
      where: status ? { status } : {},
      include: { wasteTypes: true, photos: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ reports });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// READ - detail 1 laporan
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id: Number(id) },
      include: {
        user: { select: { id: true, name: true } },
        wasteTypes: true,
        photos: true,
      },
    });

    if (!report) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// UPDATE - edit laporan (cuma pemilik, cuma kalau masih SUBMITTED)
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, locationName, pollutionLevel, description, customWasteType } = req.body;

    const report = await prisma.report.findUnique({ where: { id: Number(id) } });

    if (!report) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    if (report.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Kamu tidak punya akses untuk mengubah laporan ini' });
    }

    if (report.status !== 'SUBMITTED') {
      return res.status(403).json({ message: 'Laporan tidak dapat diubah karena sudah dalam proses peninjauan' });
    }

    const updatedReport = await prisma.report.update({
      where: { id: Number(id) },
      data: {
        latitude: latitude ?? report.latitude,
        longitude: longitude ?? report.longitude,
        locationName: locationName ?? report.locationName,
        pollutionLevel: pollutionLevel ?? report.pollutionLevel,
        description: description ?? report.description,
        customWasteType: customWasteType ?? report.customWasteType,
      },
      include: { wasteTypes: true, photos: true },
    });

    res.json({ message: 'Laporan berhasil diperbarui', report: updatedReport });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// DELETE - hapus laporan (cuma pemilik, cuma kalau masih SUBMITTED)
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({ where: { id: Number(id) } });

    if (!report) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    if (report.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Kamu tidak punya akses untuk menghapus laporan ini' });
    }

    if (report.status !== 'SUBMITTED') {
      return res.status(403).json({ message: 'Laporan tidak dapat dihapus karena sudah dalam proses peninjauan' });
    }

    await prisma.report.delete({ where: { id: Number(id) } });

    res.json({ message: 'Laporan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// VERIFY - khusus admin, approve/reject laporan
export const verifyReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectReason } = req.body;

    const validStatuses = ['VERIFIED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid, harus VERIFIED atau REJECTED' });
    }

    if (status === 'REJECTED' && !rejectReason) {
      return res.status(400).json({ message: 'Alasan penolakan wajib diisi' });
    }

    const report = await prisma.report.findUnique({ where: { id: Number(id) } });
    if (!report) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    const updatedReport = await prisma.report.update({
      where: { id: Number(id) },
      data: {
        status,
        rejectReason: status === 'REJECTED' ? rejectReason : null,
      },
    });

    // Kalau VERIFIED, kasih XP + update progress challenge
    if (status === 'VERIFIED') {
      await prisma.user.update({
        where: { id: report.userId },
        data: { totalXP: { increment: 20 } },
      });

      await prisma.notification.create({
        data: {
          userId: report.userId,
          title: 'Laporan Diverifikasi',
          message: 'Laporan kamu telah diverifikasi dan kamu mendapatkan 20 XP!',
          type: 'REPORT_STATUS_CHANGED',
        },
      });

      const now = new Date();
      const activeProgress = await prisma.challengeProgress.findMany({
        where: {
          userId: report.userId,
          isCompleted: false,
          challenge: {
            startDate: { lte: now },
            endDate: { gte: now },
          },
        },
        include: { challenge: true },
      });

      for (const cp of activeProgress) {
        const newProgress = cp.progress + 1;
        const isNowCompleted = newProgress >= cp.challenge.target;

        await prisma.challengeProgress.update({
          where: { id: cp.id },
          data: {
            progress: newProgress,
            isCompleted: isNowCompleted,
            completedAt: isNowCompleted ? now : null,
          },
        });

        if (isNowCompleted) {
          await prisma.user.update({
            where: { id: report.userId },
            data: { totalXP: { increment: cp.challenge.rewardXP } },
          });

          await prisma.notification.create({
            data: {
              userId: report.userId,
              title: 'Challenge Selesai!',
              message: `Kamu berhasil menyelesaikan challenge "${cp.challenge.name}" dan mendapatkan ${cp.challenge.rewardXP} XP!`,
              type: 'CHALLENGE_COMPLETED',
            },
          });
        }
      }
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
