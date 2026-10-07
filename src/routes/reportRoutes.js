import express from 'express';
import {
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  deleteReport,
  verifyReport,
} from '../controllers/reportController.js';
import { updateReportStatus } from '../controllers/reportStatusController.js';
import { getMyReports } from '../controllers/myReportController.js';
import { getHeatmap, getHeatmapAreaDetail } from '../controllers/mapController.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/map', getHeatmap);
router.get('/map/:areaId', getHeatmapAreaDetail);
router.get('/me', verifyToken, getMyReports);
router.get('/', getAllReports);
router.get('/:id', getReportById);
router.post('/', verifyToken, createReport);
router.patch('/:id', verifyToken, updateReport);
router.delete('/:id', verifyToken, deleteReport);
router.patch('/:id/verify', verifyToken, authorize('ADMIN'), verifyReport);
router.patch('/:id/status', verifyToken, authorize('ADMIN'), updateReportStatus);

export default router;
