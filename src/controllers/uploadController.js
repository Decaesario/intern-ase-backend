export const uploadPhotos = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Minimal 1 foto wajib diunggah' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const urls = req.files.map((file) => `${baseUrl}/uploads/${file.filename}`);

    res.status(201).json({ message: 'Foto berhasil diunggah', urls });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
