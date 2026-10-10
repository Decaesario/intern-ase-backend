import prisma from '../lib/prisma.js';

// CREATE - khusus admin
export const createBadge = async (req, res) => {
  try {
    const { name, description, imageUrl, requirementType, requirementValue } = req.body;

    const validTypes = ['VERIFIED_REPORT_COUNT', 'COMPLETED_CHALLENGE_COUNT'];
    if (!name || !requirementType || !requirementValue || !validTypes.includes(requirementType)) {
      return res.status(400).json({
        message: 'Name, requirementType (VERIFIED_REPORT_COUNT/COMPLETED_CHALLENGE_COUNT), dan requirementValue wajib diisi',
      });
    }

    const badge = await prisma.badge.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        requirementType,
        requirementValue,
      },
    });

    res.status(201).json({ message: 'Badge berhasil dibuat', badge });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// READ - semua badge (publik)
export const getAllBadges = async (req, res) => {
  try {
    const badges = await prisma.badge.findMany();
    res.json({ badges });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// READ - badge milik user yang login
export const getMyBadges = async (req, res) => {
  try {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: req.user.userId },
      include: { badge: true },
    });

    res.json({ userBadges });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// DELETE - khusus admin
export const deleteBadge = async (req, res) => {
  try {
    const badgeId = Number(req.params.id);
    if (!Number.isInteger(badgeId)) {
      return res.status(400).json({ message: 'ID badge tidak valid' });
    }

    const badge = await prisma.badge.findUnique({ where: { id: badgeId } });
    if (!badge) {
      return res.status(404).json({ message: 'Badge tidak ditemukan' });
    }

    // kepemilikan badge oleh user ikut dihapus dulu supaya tidak terkena foreign key error
    await prisma.$transaction([
      prisma.userBadge.deleteMany({ where: { badgeId } }),
      prisma.badge.delete({ where: { id: badgeId } }),
    ]);

    res.json({ message: 'Badge berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
