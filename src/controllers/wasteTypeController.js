import prisma from '../lib/prisma.js';

// GET /api/waste-types - daftar jenis sampah untuk form pelaporan
export const getWasteTypes = async (req, res) => {
  try {
    const wasteTypes = await prisma.wasteType.findMany({
      orderBy: { id: 'asc' },
    });

    res.json({ wasteTypes });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
