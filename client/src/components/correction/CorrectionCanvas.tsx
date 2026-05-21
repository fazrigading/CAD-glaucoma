import { useEffect, useRef, useState } from 'react';
import { throttle } from 'lodash';
import { getColorLabel } from '../../utils/colorLabel';

interface Point {
  x: number;
  y: number;
}

interface Polygon {
  id: string;
  label: string;
  points: Point[];
}

interface CorrectionCanvasProps {
  polygons: Polygon[];
  onPolygonsChange: (updatedPolygons: Polygon[]) => void;
  isDrawing: boolean;
  newPolygonPoints: Point[];
  onAddPoint: (point: Point) => void;
  onFinishPolygon: () => void;
  polygonVisibilities: { [label: string]: boolean };
  gridline: boolean;
  gridlineSize: number;
  gridlineColor: string;
  gridlineOpacity: number;
  brightness: number;
  contrast: number;
  saturation: number;
  imageUrl?: string;
  zoom: number;
  onZoomChange?: (zoom: number) => void;
}

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;
const IMAGE_SIZE = 600;

const CorrectionCanvas: React.FC<CorrectionCanvasProps> = ({ polygons, onPolygonsChange, isDrawing, newPolygonPoints, onAddPoint, onFinishPolygon, polygonVisibilities, gridline, gridlineSize, gridlineColor, gridlineOpacity, brightness, contrast, saturation, imageUrl, zoom, onZoomChange }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [draggingPolygonIndex, setDraggingPolygonIndex] = useState<number | null>(null);
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Zoom dikontrol dari parent
  // Tambahkan state untuk image
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  // State untuk panning
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  // State untuk panning drag
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const offsetStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Load image dari props.imageUrl jika ada, jika tidak pakai default
  useEffect(() => {
    const img = new window.Image();
    img.src = imageUrl || '/content/glaucoma_fundus.jpg';
    img.onload = () => {
      setImage(img);
      setOffset({
        x: (CANVAS_WIDTH - IMAGE_SIZE) / 10,
        y: (CANVAS_HEIGHT - IMAGE_SIZE) / 2,
      });
    };
  }, [imageUrl]);

  // Helper untuk clamp zoom
  const clampZoom = (value: number) => Math.max(0.5, Math.min(3, value));

  // Konversi mouse ke koordinat gambar (memperhitungkan offset dan zoom)
  const getImageCoords = (mouseX: number, mouseY: number) => {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    return {
      x: (mouseX - centerX - offset.x) / zoom + centerX,
      y: (mouseY - centerY - offset.y) / zoom + centerY,
    };
  };

  // Draw gridline helper
  const drawGridlines = (ctx: CanvasRenderingContext2D) => {
    if (!gridline) return;
    const { width, height } = ctx.canvas;
    ctx.save();
    ctx.globalAlpha = gridlineOpacity;
    ctx.strokeStyle = gridlineColor;
    ctx.lineWidth = 1 / zoom; // ketebalan garis tetap 1px
    
    // gridlineSize sekarang mengatur kerapatan garis (jumlah pembagian)
    const divisions = gridlineSize + 4; // min 5 divisions (gridlineSize=1), max 14 divisions (gridlineSize=10)
    // Gunakan dimensi yang lebih kecil untuk step agar grid berbentuk persegi
    const minDimension = Math.min(width, height);
    const step = minDimension / divisions;
    
    // Hitung berapa banyak garis yang dibutuhkan untuk setiap arah
    const verticalLines = Math.floor(width / step);
    const horizontalLines = Math.floor(height / step);
    
    // Gambar garis vertikal
    for (let i = 1; i < verticalLines; i++) {
      ctx.beginPath();
      ctx.moveTo(i * step, 0);
      ctx.lineTo(i * step, height);
      ctx.stroke();
    }
    
    // Gambar garis horizontal
    for (let i = 1; i < horizontalLines; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * step);
      ctx.lineTo(width, i * step);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawPolygons = (ctx: CanvasRenderingContext2D, polygons: Polygon[], drawingPoints?: Point[]) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    // Terapkan offset dan zoom
    ctx.translate(centerX + offset.x, centerY + offset.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-centerX, -centerY);
    // Gambar image fundus di bawah semua layer
    if (image) {
      ctx.save();
      ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
      ctx.drawImage(image, (CANVAS_WIDTH - IMAGE_SIZE) / 2, (CANVAS_HEIGHT - IMAGE_SIZE) / 2, IMAGE_SIZE, IMAGE_SIZE);
      ctx.restore();
    }
    // Draw gridline
    drawGridlines(ctx);
    // Draw polygons
    polygons.forEach((polygon) => {
      if (polygon.label !== 'drawing' && polygonVisibilities[polygon.id] === false) return;
      ctx.beginPath();
      ctx.moveTo(polygon.points[0].x, polygon.points[0].y);
      polygon.points.forEach((point, index) => {
        if (index > 0) {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.closePath();
      const { strokeColor, pointColor, fillColor } = getColorLabel(polygon.label);
      ctx.strokeStyle = strokeColor;
      ctx.stroke();
      ctx.fillStyle = fillColor;
      ctx.fill();
      polygon.points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5 / zoom, 0, 2 * Math.PI); // radius ikut zoom
        ctx.fillStyle = pointColor;
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
      });
    });
    // Draw polygon yang sedang digambar (drawingPoints)
    if (drawingPoints && drawingPoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(drawingPoints[0].x, drawingPoints[0].y);
      drawingPoints.forEach((point, index) => {
        if (index > 0) {
          ctx.lineTo(point.x, point.y);
        }
      });
      if (drawingPoints.length >= 3) {
        ctx.closePath();
        const { strokeColor, fillColor } = getColorLabel('disc');
        ctx.strokeStyle = strokeColor;
        ctx.stroke();
        ctx.fillStyle = fillColor;
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        drawingPoints.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5 / zoom, 0, 2 * Math.PI);
          ctx.fillStyle = fillColor;
          ctx.fill();
          ctx.strokeStyle = 'black';
          ctx.stroke();
        });
      } else {
        ctx.strokeStyle = '#1976d2';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        drawingPoints.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5 / zoom, 0, 2 * Math.PI);
          ctx.fillStyle = '#1976d2';
          ctx.fill();
          ctx.strokeStyle = 'black';
          ctx.stroke();
        });
      }
    }
    ctx.restore();
  };

  const isPointClicked = (mouseX: number, mouseY: number, point: Point) => {
    // mouseX, mouseY sudah dalam koordinat gambar
    const distance = Math.sqrt((mouseX - point.x) ** 2 + (mouseY - point.y) ** 2);
    return distance < 10 / zoom; // radius ikut zoom
  };

  // Handler untuk panning
  const handlePanMouseDown = (e: React.MouseEvent) => {
    if (isDrawing) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
  };
  const handlePanMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setOffset({ x: offsetStart.current.x + dx, y: offsetStart.current.y + dy });
  };
  const handlePanMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDrawing) return;
    // Cek apakah klik pada titik polygon (drag point), jika tidak, mulai panning
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const { x, y } = getImageCoords(mouseX, mouseY);
    let foundPolygonIndex = null;
    let foundPointIndex = null;
    polygons.forEach((polygon, polygonIndex) => {
      polygon.points.forEach((point, pointIndex) => {
        if (isPointClicked(x, y, point)) {
          foundPolygonIndex = polygonIndex;
          foundPointIndex = pointIndex;
        }
      });
    });
    if (foundPolygonIndex !== null && foundPointIndex !== null) {
      const updatedPolygons = [...polygons];
      const [selectedPolygon] = updatedPolygons.splice(foundPolygonIndex, 1);
      updatedPolygons.push(selectedPolygon);
      onPolygonsChange(updatedPolygons);
      setDraggingPolygonIndex(updatedPolygons.length - 1);
      setDraggingPointIndex(foundPointIndex);
      setIsDragging(true);
    } else {
      // Mulai panning
      handlePanMouseDown(e);
    }
  };

  const handleMouseMove = throttle((e: React.MouseEvent) => {
    if (isPanning) {
      handlePanMouseMove(e);
      return;
    }
    if (!isDragging || draggingPolygonIndex === null || draggingPointIndex === null) return;
    if (
      draggingPolygonIndex < 0 ||
      draggingPolygonIndex >= polygons.length ||
      draggingPointIndex < 0 ||
      draggingPointIndex >= polygons[draggingPolygonIndex].points.length
    ) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const { x, y } = getImageCoords(mouseX, mouseY);
    const updatedPolygons = [...polygons];
    const polygonToUpdate = updatedPolygons[draggingPolygonIndex];
    if (!polygonToUpdate || !polygonToUpdate.points) return;
    const updatedPoints = [...polygonToUpdate.points];
    updatedPoints[draggingPointIndex] = { x, y };
    updatedPolygons[draggingPolygonIndex] = { ...polygonToUpdate, points: updatedPoints };
    onPolygonsChange(updatedPolygons);
  }, 50);

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggingPolygonIndex(null);
    setDraggingPointIndex(null);
    handlePanMouseUp();
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const { x, y } = getImageCoords(mouseX, mouseY);
    onAddPoint({ x, y });
  };

  const handleCanvasDoubleClick = () => {
    if (!isDrawing) return;
    onFinishPolygon();
  };

  // Handler untuk mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const prevZoom = zoom;
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    const newZoom = clampZoom(prevZoom + delta);
    // Hitung offset baru agar zoom ke arah kursor
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const x = mouseX - centerX - offset.x;
    const y = mouseY - centerY - offset.y;
    const ratio = newZoom / prevZoom;
    setOffset({
      x: offset.x - x * (ratio - 1),
      y: offset.y - y * (ratio - 1),
    });
    if (onZoomChange) onZoomChange(newZoom);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawPolygons(ctx, polygons, isDrawing ? newPolygonPoints : undefined);
  }, [polygons, isDrawing, newPolygonPoints, polygonVisibilities, gridline, gridlineSize, gridlineColor, gridlineOpacity, zoom, image, brightness, contrast, saturation, offset]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="m-auto mt-2"
      style={{
        // backgroundImage: `url(/content/glaucoma_fundus.jpg)`,
        // backgroundSize: bgSize,
        // backgroundPosition: bgPosition,
        // filter: filterString,
        cursor: isDrawing
          ? 'crosshair' // draw mode
          : isPanning
            ? 'grabbing'
            : zoom !== 1
              ? 'grab'
              : 'default',
      }}
      onMouseDown={isDrawing ? undefined : handleMouseDown}
      onMouseMove={isDrawing ? undefined : handleMouseMove}
      onMouseUp={isDrawing ? undefined : handleMouseUp}
      onClick={handleCanvasClick}
      onDoubleClick={handleCanvasDoubleClick}
      onWheel={handleWheel}
    />
  );
};

export default CorrectionCanvas;