import express from 'express';
import {
  createReport,
  updateReport,
  deleteReport,
} from '../controllers/reportController.js';
import { getAllReports, getReportById } from '../controllers/reportQueryController.js';
import { verifyReport } from '../controllers/reportVerifyController.js';
import { updateReportStatus } from '../controllers/reportStatusController.js';
import { getMyReports } from '../controllers/myReportController.js';
import { getHeatmap, getHeatmapAreaDetail } from '../controllers/mapController.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/map', getHeatmap);
router.get('/map/:areaId', getHeatmapAreaDetail);
router.get('/me', verifyToken, getMyReports);
router.get('/', verifyToken, authorize('ADMIN'), getAllReports);
router.get('/:id', verifyToken, getReportById);
router.post('/', verifyToken, createReport);
router.patch('/:id', verifyToken, updateReport);
router.delete('/:id', verifyToken, deleteReport);
router.patch('/:id/verify', verifyToken, authorize('ADMIN'), verifyReport);
router.patch('/:id/status', verifyToken, authorize('ADMIN'), updateReportStatus);

export default router;
