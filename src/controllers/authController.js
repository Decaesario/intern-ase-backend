import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Semua field wajib diisi' });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim();

    if (cleanName === '') {
      return res.status(400).json({ message: 'Nama tidak boleh kosong' });
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ message: 'Format email tidak valid' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Kata sandi minimal 8 karakter' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name: cleanName, email: cleanEmail, password: hashedPassword },
    });

    res.status(201).json({
      message: 'Registrasi berhasil',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Akun ini sudah dinonaktifkan' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'rahasia_sementara',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res.json({ message: 'Logout berhasil' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
