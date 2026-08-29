import prisma from '../lib/prisma.js';

// CREATE - bikin laporan baru
export const createReport = async (req, res) => {
  try {
    const { latitude, longitude, wasteTypes, otherWasteType, dirtyLevel, description, imageUrl } = req.body;

    if (!latitude || !longitude || !wasteTypes || !dirtyLevel) {
      return res.status(400).json({ message: 'Latitude, longitude, wasteTypes, dan dirtyLevel wajib diisi' });
    }

    const report = await prisma.report.create({
      data: {
        userId: req.user.userId,
        latitude,
        longitude,
        wasteTypes,
        otherWasteType: otherWasteType || null,
        dirtyLevel,
        description: description || null,
        imageUrl: imageUrl || null,
      },
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
      include: { user: { select: { id: true, name: true } } },
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
    const { latitude, longitude, wasteTypes, otherWasteType, dirtyLevel, description, imageUrl } = req.body;

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
        wasteTypes: wasteTypes ?? report.wasteTypes,
        otherWasteType: otherWasteType ?? report.otherWasteType,
        dirtyLevel: dirtyLevel ?? report.dirtyLevel,
        description: description ?? report.description,
        imageUrl: imageUrl ?? report.imageUrl,
      },
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

    res.json({ message: `Status laporan berhasil diubah menjadi ${status}`, report: updatedReport });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
