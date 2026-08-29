import express from 'express';
import {
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  deleteReport,
  verifyReport,
} from '../controllers/reportController.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllReports);
router.get('/:id', getReportById);
router.post('/', verifyToken, createReport);
router.patch('/:id', verifyToken, updateReport);
router.delete('/:id', verifyToken, deleteReport);
router.patch('/:id/verify', verifyToken, authorize('ADMIN'), verifyReport);

export default router;
