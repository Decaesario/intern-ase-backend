import prisma from '../lib/prisma.js';
import { checkAndAwardBadges } from '../utils/badgeChecker.js';

const POLLUTION_LEVELS = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

// Validasi jenis sampah: id harus ada di database, dan "Lainnya" wajib disertai customWasteType
const validateWasteTypes = async (wasteTypeIds, customWasteType) => {
  if (
    !Array.isArray(wasteTypeIds) ||
    wasteTypeIds.length === 0 ||
    !wasteTypeIds.every((id) => Number.isInteger(id))
  ) {
    return { error: 'wasteTypeIds harus berupa array angka dan minimal 1' };
  }

  const uniqueIds = [...new Set(wasteTypeIds)];
  const found = await prisma.wasteType.findMany({ where: { id: { in: uniqueIds } } });

  if (found.length !== uniqueIds.length) {
    return { error: 'Ada wasteTypeIds yang tidak ditemukan' };
  }

  const hasOther = found.some((w) => w.name === 'Lainnya');
  const cleanCustom = customWasteType ? String(customWasteType).trim() : '';

  if (hasOther && cleanCustom === '') {
    return { error: 'customWasteType wajib diisi jika memilih jenis sampah "Lainnya"' };
  }

  return { uniqueIds, customWasteType: hasOther ? cleanCustom : null };
};

// Validasi foto: array 1 sampai 5 URL berupa teks
const validatePhotoUrls = (photoUrls) => {
  if (
    !Array.isArray(photoUrls) ||
    photoUrls.length < 1 ||
    photoUrls.length > 5 ||
    !photoUrls.every((url) => typeof url === 'string' && url.trim() !== '')
  ) {
    return 'Wajib 1 sampai 5 foto (photoUrls berupa array URL)';
  }
  return null;
};

// CREATE - bikin laporan baru + notifikasi ke admin
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

    if (!latitude || !longitude || !pollutionLevel || !wasteTypeIds) {
      return res.status(400).json({
        message: 'Latitude, longitude, pollutionLevel, dan minimal 1 wasteTypeIds wajib diisi',
      });
    }

    if (!POLLUTION_LEVELS.includes(pollutionLevel)) {
      return res.status(400).json({
        message: 'pollutionLevel harus LOW, MODERATE, HIGH, atau CRITICAL',
      });
    }

    const photoError = validatePhotoUrls(photoUrls);
    if (photoError) {
      return res.status(400).json({ message: photoError });
    }

    const wasteCheck = await validateWasteTypes(wasteTypeIds, customWasteType);
    if (wasteCheck.error) {
      return res.status(400).json({ message: wasteCheck.error });
    }

    const report = await prisma.report.create({
      data: {
        userId: req.user.userId,
        latitude,
        longitude,
        locationName: locationName || null,
        pollutionLevel,
        description: description || null,
        customWasteType: wasteCheck.customWasteType,
        wasteTypes: {
          connect: wasteCheck.uniqueIds.map((id) => ({ id })),
        },
        photos: {
          create: photoUrls.map((url) => ({ fileUrl: url })),
        },
      },
      include: { wasteTypes: true, photos: true },
    });

    // FR-NTF-02: notifikasi ke semua admin aktif (kecuali pembuat laporan)
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true, id: { not: req.user.userId } },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: 'Laporan Baru Masuk',
          message: `Ada laporan baru (ID ${report.id}) yang menunggu untuk ditinjau.`,
          type: 'NEW_REPORT_ADMIN',
        })),
      });
    }

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
    const {
      latitude,
      longitude,
      locationName,
      pollutionLevel,
      description,
      customWasteType,
      wasteTypeIds,
      photoUrls,
    } = req.body;

    const report = await prisma.report.findUnique({
      where: { id: Number(id) },
      include: { wasteTypes: true },
    });

    if (!report) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    if (report.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Kamu tidak punya akses untuk mengubah laporan ini' });
    }

    if (report.status !== 'SUBMITTED') {
      return res.status(403).json({ message: 'Laporan tidak dapat diubah karena sudah dalam proses peninjauan' });
    }

    if (pollutionLevel !== undefined && !POLLUTION_LEVELS.includes(pollutionLevel)) {
      return res.status(400).json({
        message: 'pollutionLevel harus LOW, MODERATE, HIGH, atau CRITICAL',
      });
    }

    // Jenis sampah dan customWasteType divalidasi bersama supaya tetap konsisten
    const finalWasteTypeIds =
      wasteTypeIds !== undefined ? wasteTypeIds : report.wasteTypes.map((w) => w.id);
    const finalCustom =
      customWasteType !== undefined ? customWasteType : report.customWasteType;

    const wasteCheck = await validateWasteTypes(finalWasteTypeIds, finalCustom);
    if (wasteCheck.error) {
      return res.status(400).json({ message: wasteCheck.error });
    }

    const data = {
      latitude: latitude ?? report.latitude,
      longitude: longitude ?? report.longitude,
      locationName: locationName ?? report.locationName,
      pollutionLevel: pollutionLevel ?? report.pollutionLevel,
      description: description ?? report.description,
      customWasteType: wasteCheck.customWasteType,
      wasteTypes: { set: wasteCheck.uniqueIds.map((wid) => ({ id: wid })) },
    };

    if (photoUrls !== undefined) {
      const photoError = validatePhotoUrls(photoUrls);
      if (photoError) {
        return res.status(400).json({ message: photoError });
      }
      data.photos = {
        deleteMany: {},
        create: photoUrls.map((url) => ({ fileUrl: url })),
      };
    }

    const updatedReport = await prisma.report.update({
      where: { id: Number(id) },
      data,
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

// VERIFY - khusus admin, approve/reject laporan (hanya dari status UNDER_REVIEW)
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

    if (report.status !== 'UNDER_REVIEW') {
      return res.status(409).json({
        message: `Laporan hanya bisa diverifikasi atau ditolak dari status UNDER_REVIEW, sedangkan status laporan saat ini ${report.status}`,
      });
    }

    const updatedReport = await prisma.report.update({
      where: { id: Number(id) },
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
