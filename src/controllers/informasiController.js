import prisma from '../lib/prisma.js';

// CREATE - khusus admin
export const createInformasi = async (req, res) => {
  try {
    const { title, content, coverImageUrl } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title dan content wajib diisi' });
    }

    const informasi = await prisma.informasiEdukasi.create({
      data: { title, content, coverImageUrl: coverImageUrl || null },
    });

    res.status(201).json({ message: 'Informasi berhasil dibuat', informasi });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// READ - semua (publik)
export const getAllInformasi = async (req, res) => {
  try {
    const informasiList = await prisma.informasiEdukasi.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({ informasiList });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// READ - detail 1 (publik)
export const getInformasiById = async (req, res) => {
  try {
    const { id } = req.params;

    const informasi = await prisma.informasiEdukasi.findUnique({
      where: { id: Number(id) },
    });

    if (!informasi) {
      return res.status(404).json({ message: 'Informasi tidak ditemukan' });
    }

    res.json({ informasi });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// UPDATE - khusus admin
export const updateInformasi = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, coverImageUrl } = req.body;

    const informasi = await prisma.informasiEdukasi.findUnique({ where: { id: Number(id) } });
    if (!informasi) {
      return res.status(404).json({ message: 'Informasi tidak ditemukan' });
    }

    const updated = await prisma.informasiEdukasi.update({
      where: { id: Number(id) },
      data: {
        title: title ?? informasi.title,
        content: content ?? informasi.content,
        coverImageUrl: coverImageUrl ?? informasi.coverImageUrl,
      },
    });

    res.json({ message: 'Informasi berhasil diperbarui', informasi: updated });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// DELETE - khusus admin
export const deleteInformasi = async (req, res) => {
  try {
    const { id } = req.params;

    const informasi = await prisma.informasiEdukasi.findUnique({ where: { id: Number(id) } });
    if (!informasi) {
      return res.status(404).json({ message: 'Informasi tidak ditemukan' });
    }

    await prisma.informasiEdukasi.delete({ where: { id: Number(id) } });

    res.json({ message: 'Informasi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
