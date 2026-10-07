import prisma from '../lib/prisma.js';

// CREATE - khusus admin
export const createChallenge = async (req, res) => {
  try {
    const { name, description, target, startDate, endDate, rewardXP } = req.body;

    if (!name || !target || !startDate || !endDate || !rewardXP) {
      return res.status(400).json({
        message: 'Name, target, startDate, endDate, dan rewardXP wajib diisi',
      });
    }

    if (!Number.isInteger(target) || target < 1 || !Number.isInteger(rewardXP) || rewardXP < 1) {
      return res.status(400).json({ message: 'target dan rewardXP harus bilangan bulat positif' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || end <= start) {
      return res.status(400).json({ message: 'Periode tidak valid, endDate harus setelah startDate' });
    }

    const challenge = await prisma.challenge.create({
      data: {
        name,
        description: description || null,
        target,
        startDate: start,
        endDate: end,
        rewardXP,
      },
    });

    res.status(201).json({ message: 'Challenge berhasil dibuat', challenge });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// READ - semua challenge (publik, tanpa progress)
export const getAllChallenges = async (req, res) => {
  try {
    const challenges = await prisma.challenge.findMany({
      orderBy: { startDate: 'desc' },
    });

    res.json({ challenges });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// READ - challenge milik user lengkap dengan progress
// GET /api/challenges/me?tab=active (default) | completed
export const getMyChallenges = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tab = req.query.tab || 'active';

    if (!['active', 'completed'].includes(tab)) {
      return res.status(400).json({ message: 'tab harus active atau completed' });
    }

    const now = new Date();

    if (tab === 'completed') {
      const rows = await prisma.challengeProgress.findMany({
        where: { userId, isCompleted: true },
        include: { challenge: true },
        orderBy: { completedAt: 'desc' },
      });

      const challenges = rows.map((row) => ({
        ...row.challenge,
        progress: row.progress,
        isCompleted: true,
        completedAt: row.completedAt,
      }));

      return res.json({ tab, total: challenges.length, challenges });
    }

    const activeChallenges = await prisma.challenge.findMany({
      where: { startDate: { lte: now }, endDate: { gte: now } },
      orderBy: { endDate: 'asc' },
    });

    const progressRows = await prisma.challengeProgress.findMany({
      where: { userId, challengeId: { in: activeChallenges.map((c) => c.id) } },
    });
    const progressMap = new Map(progressRows.map((p) => [p.challengeId, p]));

    const challenges = activeChallenges
      .map((challenge) => {
        const p = progressMap.get(challenge.id);
        return {
          ...challenge,
          progress: p ? p.progress : 0,
          isCompleted: p ? p.isCompleted : false,
          completedAt: p ? p.completedAt : null,
        };
      })
      .filter((c) => !c.isCompleted);

    res.json({ tab, total: challenges.length, challenges });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// DELETE - khusus admin
export const deleteChallenge = async (req, res) => {
  try {
    const challengeId = Number(req.params.id);
    if (!Number.isInteger(challengeId)) {
      return res.status(400).json({ message: 'ID challenge tidak valid' });
    }

    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge tidak ditemukan' });
    }

    // progress user ikut dihapus dulu supaya tidak terkena foreign key error
    await prisma.$transaction([
      prisma.challengeProgress.deleteMany({ where: { challengeId } }),
      prisma.challenge.delete({ where: { id: challengeId } }),
    ]);

    res.json({ message: 'Challenge berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
