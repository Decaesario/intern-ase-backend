import express from 'express';
import multer from 'multer';
import { upload } from '../middleware/uploadMiddleware.js';
import { uploadPhotos } from '../controllers/uploadController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const handleUpload = (req, res, next) => {
  upload.array('photos', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Ukuran file maksimal 5MB' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ message: "Maksimal 5 foto, dan nama field harus 'photos'" });
      }
      return res.status(400).json({ message: err.message });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

router.post('/', verifyToken, handleUpload, uploadPhotos);

export default router;
