import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePicture: true,
        totalXP: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const oceanLevel = Math.floor(user.totalXP / 100) + 1;

    res.json({ user: { ...user, oceanLevel } });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// PATCH /api/users/profile - ubah nama, foto profil, dan/atau kata sandi
export const updateProfile = async (req, res) => {
  try {
    const { name, profilePicture, currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const data = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Nama tidak boleh kosong' });
      }
      data.name = name.trim();
    }

    if (profilePicture !== undefined) {
      data.profilePicture = profilePicture || null;
    }

    if (newPassword !== undefined) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Kata sandi lama wajib diisi untuk mengganti kata sandi' });
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentValid) {
        return res.status(401).json({ message: 'Kata sandi lama salah' });
      }

      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ message: 'Kata sandi baru minimal 8 karakter' });
      }

      data.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'Tidak ada data yang diubah' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: { id: true, name: true, email: true, role: true, profilePicture: true },
    });

    res.json({ message: 'Profil berhasil diperbarui', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        totalXP: true,
        isActive: true,
        createdAt: true,
      },
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['USER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Role tidak valid' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!targetUser) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({ message: `Role berhasil diubah menjadi ${role}`, user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
