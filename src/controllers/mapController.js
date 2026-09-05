import prisma from '../lib/prisma.js';
import { groupReportsIntoHeatmapAreas } from '../utils/geoHelper.js';

// GET /api/reports/map - nampilin heatmap dari laporan VERIFIED
export const getHeatmap = async (req, res) => {
  try {
    const verifiedReports = await prisma.report.findMany({
      where: { status: 'VERIFIED' },
      orderBy: { createdAt: 'asc' },
    });

    const areas = groupReportsIntoHeatmapAreas(verifiedReports, 20);

    const heatmapData = areas.map((area, index) => ({
      areaId: index + 1,
      centerLat: area.centerLat,
      centerLon: area.centerLon,
      totalReports: area.reports.length,
      latestReport: area.reports[area.reports.length - 1],
    }));

    res.json({ areas: heatmapData });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

// GET /api/reports/map/:areaId - detail 1 area heatmap
export const getHeatmapAreaDetail = async (req, res) => {
  try {
    const { areaId } = req.params;

    const verifiedReports = await prisma.report.findMany({
      where: { status: 'VERIFIED' },
      orderBy: { createdAt: 'asc' },
    });

    const areas = groupReportsIntoHeatmapAreas(verifiedReports, 20);
    const index = Number(areaId) - 1;

    if (index < 0 || index >= areas.length) {
      return res.status(404).json({ message: 'Area tidak ditemukan' });
    }

    const area = areas[index];

    res.json({
      areaId: Number(areaId),
      centerLat: area.centerLat,
      centerLon: area.centerLon,
      totalReports: area.reports.length,
      reports: area.reports,
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};
