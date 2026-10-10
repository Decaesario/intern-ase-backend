import express from 'express';
import {
  createInformasi,
  getAllInformasi,
  getInformasiById,
  updateInformasi,
  deleteInformasi,
} from '../controllers/informasiController.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';
import { limitLengths } from '../middleware/validateLength.js';

const informasiLimits = limitLengths({ title: 191, coverImageUrl: 191 });

const router = express.Router();

router.get('/', getAllInformasi);
router.get('/:id', getInformasiById);
router.post('/', verifyToken, authorize('ADMIN'), informasiLimits, createInformasi);
router.patch('/:id', verifyToken, authorize('ADMIN'), informasiLimits, updateInformasi);
router.delete('/:id', verifyToken, authorize('ADMIN'), deleteInformasi);

export default router;
