import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';

// DELETE /api/users/me - soft delete akun sendiri (khusus USER)
export const deleteMyAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Kata sandi wajib diisi untuk menghapus akun' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Kata sandi salah' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: false },
    });

    res.json({ message: 'Akun berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
