// Membatasi panjang field teks di body (kolom VARCHAR di database maksimal 191 karakter).
// Field berupa array (misalnya photoUrls) dicek per elemen.
// Contoh: router.post('/', limitLengths({ description: 191 }), controller)
export const limitLengths = (limits) => (req, res, next) => {
  const body = req.body || {};

  for (const [field, max] of Object.entries(limits)) {
    const value = body[field];
    if (value === undefined || value === null) continue;

    const items = Array.isArray(value) ? value : [value];
    const tooLong = items.some((item) => typeof item === 'string' && item.length > max);

    if (tooLong) {
      return res.status(400).json({ message: `${field} maksimal ${max} karakter` });
    }
  }

  next();
};
