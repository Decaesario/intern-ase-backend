import prisma from '../lib/prisma.js';

// GET /api/notifications - notifikasi milik user yang login
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { isRead } = req.query;

    const where = { userId };
    if (isRead === 'true') where.isRead = true;
    if (isRead === 'false') where.isRead = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({ unreadCount, notifications });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// PATCH /api/notifications/:id/read - tandai satu notifikasi sudah dibaca
export const markAsRead = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'ID notifikasi tidak valid' });
    }

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
    }

    if (notification.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Kamu tidak punya akses ke notifikasi ini' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({ message: 'Notifikasi ditandai sudah dibaca', notification: updated });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// PATCH /api/notifications/read-all - tandai semua notifikasi sudah dibaca
export const markAllAsRead = async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ message: 'Semua notifikasi ditandai sudah dibaca', updatedCount: result.count });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
