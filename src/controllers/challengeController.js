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

    const challenge = await prisma.challenge.create({
      data: {
        name,
        description: description || null,
        target,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rewardXP,
      },
    });

    res.status(201).json({ message: 'Challenge berhasil dibuat', challenge });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// READ - semua challenge (publik/user)
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

// DELETE - khusus admin
export const deleteChallenge = async (req, res) => {
  try {
    const { id } = req.params;

    const challenge = await prisma.challenge.findUnique({ where: { id: Number(id) } });
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge tidak ditemukan' });
    }

    await prisma.challenge.delete({ where: { id: Number(id) } });

    res.json({ message: 'Challenge berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// JOIN - user ikut challenge
export const joinChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const challengeId = Number(id);
    const userId = req.user.userId;

    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge tidak ditemukan' });
    }

    const existing = await prisma.challengeProgress.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });

    if (existing) {
      return res.status(409).json({ message: 'Kamu sudah mengikuti challenge ini' });
    }

    const progress = await prisma.challengeProgress.create({
      data: { userId, challengeId, progress: 0, isCompleted: false },
    });

    res.status(201).json({ message: 'Berhasil mengikuti challenge', progress });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// GET - progress user di semua challenge yang diikuti
export const getMyChallengeProgress = async (req, res) => {
  try {
    const userId = req.user.userId;

    const progressList = await prisma.challengeProgress.findMany({
      where: { userId },
      include: { challenge: true },
    });

    res.json({ progressList });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
