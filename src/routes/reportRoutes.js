import express from 'express';
import {
  createReport,
  updateReport,
  deleteReport,
} from '../controllers/reportController.js';
import { getAllReports, getPublicReports, getReportById } from '../controllers/reportQueryController.js';
import { verifyReport } from '../controllers/reportVerifyController.js';
import { updateReportStatus } from '../controllers/reportStatusController.js';
import { getMyReports } from '../controllers/myReportController.js';
import { getHeatmap, getHeatmapAreaDetail } from '../controllers/mapController.js';
import { verifyToken, authorize } from '../middleware/authMiddleware.js';
import { limitLengths } from '../middleware/validateLength.js';

const reportLimits = limitLengths({
  locationName: 191,
  description: 191,
  customWasteType: 191,
  photoUrls: 191,
});

const router = express.Router();

router.get('/map', getHeatmap);
router.get('/map/:areaId', getHeatmapAreaDetail);
router.get('/me', verifyToken, getMyReports);
router.get('/public', verifyToken, getPublicReports);
router.get('/', verifyToken, authorize('ADMIN'), getAllReports);
router.get('/:id', verifyToken, getReportById);
router.post('/', verifyToken, reportLimits, createReport);
router.patch('/:id', verifyToken, reportLimits, updateReport);
router.delete('/:id', verifyToken, deleteReport);
router.patch('/:id/verify', verifyToken, authorize('ADMIN'), limitLengths({ rejectReason: 150 }), verifyReport);
router.patch('/:id/status', verifyToken, authorize('ADMIN'), limitLengths({ resolutionNote: 2000, resolutionPhotoUrl: 191 }), updateReportStatus);

export default router;
