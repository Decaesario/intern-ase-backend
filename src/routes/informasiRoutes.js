import express from 'express';
import {
  createInformasi,
  getAllInformasi,
  getInformasiById,
  updateInformasi,
  deleteInformasi,
} from '../controllers/informasiController.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllInformasi);
router.get('/:id', getInformasiById);
router.post('/', verifyToken, authorize('ADMIN'), createInformasi);
router.patch('/:id', verifyToken, authorize('ADMIN'), updateInformasi);
router.delete('/:id', verifyToken, authorize('ADMIN'), deleteInformasi);

export default router;
