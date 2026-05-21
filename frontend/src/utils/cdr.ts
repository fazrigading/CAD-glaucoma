export interface Point {
  x: number;
  y: number;
}

export interface Polygon {
  id: string;
  label: string;
  points: Point[];
}

export const CDR_THRESHOLD = 0.5;

export function calculateHCdr(discPolygons: Polygon[], cupPolygons: Polygon[]): number | null {
  if (discPolygons.length === 0 || cupPolygons.length === 0) {
    return null;
  }

  const validDiscPolygons = discPolygons.filter(p => p.points.length >= 3);
  const validCupPolygons = cupPolygons.filter(p => p.points.length >= 3);

  if (validDiscPolygons.length === 0 || validCupPolygons.length === 0) {
    return null;
  }

  const allDiscPoints: Point[] = [];
  const allCupPoints: Point[] = [];

  validDiscPolygons.forEach(polygon => {
    allDiscPoints.push(...polygon.points);
  });

  validCupPolygons.forEach(polygon => {
    allCupPoints.push(...polygon.points);
  });

  const discMinX = Math.min(...allDiscPoints.map(p => p.x));
  const discMaxX = Math.max(...allDiscPoints.map(p => p.x));
  const discHorizontalDistance = discMaxX - discMinX;

  const cupMinX = Math.min(...allCupPoints.map(p => p.x));
  const cupMaxX = Math.max(...allCupPoints.map(p => p.x));
  const cupHorizontalDistance = cupMaxX - cupMinX;

  if (discHorizontalDistance === 0) {
    return null;
  }

  const hCdr = cupHorizontalDistance / discHorizontalDistance;
  return Math.round(hCdr * 100) / 100;
}

export function calculateVCdr(discPolygons: Polygon[], cupPolygons: Polygon[]): number | null {
  if (discPolygons.length === 0 || cupPolygons.length === 0) {
    return null;
  }

  const validDiscPolygons = discPolygons.filter(p => p.points.length >= 3);
  const validCupPolygons = cupPolygons.filter(p => p.points.length >= 3);

  if (validDiscPolygons.length === 0 || validCupPolygons.length === 0) {
    return null;
  }

  const allDiscPoints: Point[] = [];
  const allCupPoints: Point[] = [];

  validDiscPolygons.forEach(polygon => {
    allDiscPoints.push(...polygon.points);
  });

  validCupPolygons.forEach(polygon => {
    allCupPoints.push(...polygon.points);
  });

  const discMinY = Math.min(...allDiscPoints.map(p => p.y));
  const discMaxY = Math.max(...allDiscPoints.map(p => p.y));
  const discVerticalDistance = discMaxY - discMinY;

  const cupMinY = Math.min(...allCupPoints.map(p => p.y));
  const cupMaxY = Math.max(...allCupPoints.map(p => p.y));
  const cupVerticalDistance = cupMaxY - cupMinY;

  if (discVerticalDistance === 0) {
    return null;
  }

  const vCdr = cupVerticalDistance / discVerticalDistance;
  return Math.round(vCdr * 100) / 100;
}

export function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

export function calculateAreaCdr(discPolygons: Polygon[], cupPolygons: Polygon[]): number | null {
  if (discPolygons.length === 0 || cupPolygons.length === 0) {
    return null;
  }

  const validDiscPolygons = discPolygons.filter(p => p.points.length >= 3);
  const validCupPolygons = cupPolygons.filter(p => p.points.length >= 3);

  if (validDiscPolygons.length === 0 || validCupPolygons.length === 0) {
    return null;
  }

  let totalDiscArea = 0;
  validDiscPolygons.forEach(polygon => {
    totalDiscArea += calculatePolygonArea(polygon.points);
  });

  let totalCupArea = 0;
  validCupPolygons.forEach(polygon => {
    totalCupArea += calculatePolygonArea(polygon.points);
  });

  if (totalDiscArea === 0) {
    return null;
  }

  const areaCdr = totalCupArea / totalDiscArea;
  return Math.round(areaCdr * 100) / 100;
}

export function getDiagnose(vCdr: number | null): string {
  return vCdr !== null && vCdr > CDR_THRESHOLD ? "Glaucoma" : "Non Glaucoma";
}
