// Menghitung jarak antara 2 koordinat (dalam meter) menggunakan Haversine formula
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // radius bumi dalam meter
  const toRad = (deg) => deg * (Math.PI / 180);

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // hasil dalam meter
}

// Mengelompokkan laporan ke dalam area heatmap berdasarkan radius maksimal
export function groupReportsIntoHeatmapAreas(reports, radiusMeters = 20) {
  const areas = [];

  for (const report of reports) {
    let addedToArea = false;

    for (const area of areas) {
      const distance = haversineDistance(
        area.centerLat,
        area.centerLon,
        report.latitude,
        report.longitude
      );

      if (distance <= radiusMeters) {
        area.reports.push(report);
        addedToArea = true;
        break;
      }
    }

    if (!addedToArea) {
      areas.push({
        centerLat: report.latitude,
        centerLon: report.longitude,
        reports: [report],
      });
    }
  }

  return areas;
}
