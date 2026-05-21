import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import CorrectionNavbar from '../components/correction/CorrectionNavbar';
import CorrectionAccount from '../components/correction/CorrectionAccount';
import CorrectionResult from '../components/correction/CorrectionResult';
import CorrectionAdjust from '../components/correction/CorrectionAdjust';
import CorrectionClass from '../components/correction/CorrectionClass';
import CorrectionCanvas from '../components/correction/CorrectionCanvas';
import CorrectionTools from '../components/correction/CorrectionTools';
import React from 'react';
import type { ResponseData } from '../interfaces/InterfaceModel';
import {
  calculateHCdr,
  calculateVCdr,
  calculateAreaCdr,
  type Point,
  type Polygon,
} from '../utils/cdr';
import type { PolygonPayload } from '../types/api';

const dummyResult: ResponseData = {
  nama: 'John Doe',
  umur: '45',
  gender: 'Laki-laki',
  posisi: 'Kanan',
  gambar_url: '',
  mask_url: '',
  draw_url: '',
  html_content: '',
  v_cdr: '0.45',
  h_cdr: '0.40',
  area_cdr: '0.42',
  diagnose: 'Glaukoma',
};

function Correction() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);
  const [searchParams] = useSearchParams();
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  // State untuk mode gambar polygon baru
  const [isDrawing, setIsDrawing] = useState(false);
  // State visibility per polygon id
  const [polygonVisibilities, setPolygonVisibilities] = useState<{ [id: string]: boolean }>({});
  // State untuk background image canvas
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  // State untuk menyimpan gambar asli
  const [originalImageUrl, setOriginalImageUrl] = useState<string | undefined>(undefined);
  // State untuk mode compare
  const [isCompareMode, setIsCompareMode] = useState(false);
  // State zoom
  const [zoom, setZoom] = useState(1.0);
  const [resultData, setResultData] = useState<ResponseData | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  // State untuk CDR sudah dikelola di tempat lain

  // State adjustment untuk canvas
  const [adjustment, setAdjustment] = useState({
    gridline: false,
    gridlineSize: 1,
    gridlineColor: 'white',
    gridlineOpacity: 1,
    brightness: 1,
    contrast: 1,
    saturation: 1,
  });
  const handleAdjustmentChange = (newSettings: Partial<typeof adjustment>) => {
    setAdjustment((prev) => ({ ...prev, ...newSettings }));
  };

  // Sync visibilities setiap kali polygons berubah (tambah/hapus/rename)
  // Polygon yang baru: visible, yang dihapus: hilang
  // Polygon yang rename: pindahkan visibility ke label baru
  // Polygon 'drawing' diabaikan
  React.useEffect(() => {
    setPolygonVisibilities((old) => {
      const newVis: { [id: string]: boolean } = {};
      polygons.forEach((p) => {
        if (p.label !== 'drawing') {
          newVis[p.id] = old[p.id] !== undefined ? old[p.id] : true;
        }
      });
      return newVis;
    });
  }, [polygons]);

  useEffect(() => {
    const urlPatientId = searchParams.get('patient_id');
    if (urlPatientId) {
      setPatientId(parseInt(urlPatientId));
      localStorage.setItem('currentPatientId', urlPatientId);
      fetchPatientData(parseInt(urlPatientId));
    } else {
      const reviewData = localStorage.getItem('reviewData');
      if (reviewData) {
        const data = JSON.parse(reviewData);
        setImageUrl(data.gambar_url);
        setOriginalImageUrl(data.gambar_url);
        setResultData(data);

        const storedPatientId = localStorage.getItem('currentPatientId');
        if (storedPatientId) {
          setPatientId(parseInt(storedPatientId));
          // Tambahkan pemanggilan fetchPolygonData di sini
          fetchPolygonData(parseInt(storedPatientId));
        }
      } else {
        setResultData(dummyResult);
      }
    }
  }, [searchParams]);

  // Fungsi untuk mengambil data pasien dari database
  const fetchPatientData = async (patientId: number) => {
    try {
      const response = await fetch(`/api/history/${patientId}`, {
        method: 'GET'
      });

      if (response.status === 401) {
        // Session expired, arahkan ke login
        navigate('/login', {
          state: { from: { pathname: '/correction' } },
          replace: true
        });
        return;
      }

      const result = await response.json();

      if (result.success && result.data) {
        const patientData = result.data;

        const formattedData: ResponseData = {
          nama: patientData.patient_name,
          umur: patientData.age.toString(),
          gender: patientData.gender,
          posisi: patientData.eyes_position,
          gambar_url: `/api/uploads/${patientData.raw_img_path.replace(/^uploads\//, '')}`,
          mask_url: `/api/uploads/${patientData.mask_img_path.replace(/^uploads\//, '')}`,
          draw_url: `/api/uploads/${patientData.annot_img_path.replace(/^uploads\//, '')}`,
          html_content: '',
          v_cdr: patientData.v_cdr.toString(),
          h_cdr: patientData.h_cdr.toString(),
          area_cdr: patientData.area_cdr.toString(),
          diagnose: patientData.diagnose,
        };

        setResultData(formattedData);
        setImageUrl(formattedData.gambar_url);
        setOriginalImageUrl(formattedData.gambar_url);
        fetchPolygonData(patientId);
      } else {
        console.error('Gagal mengambil data pasien:', result.message);
        alert('Gagal mengambil data pasien dari database.');
        setResultData(dummyResult);
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
      alert('Terjadi error saat mengambil data pasien.');
      setResultData(dummyResult);
    }
  };

  // Fungsi untuk mengambil data polygon dari database
  const fetchPolygonData = async (patientId: number) => {
    try {
      const response = await fetch(`/api/get-polygon/${patientId}`, {
        method: 'GET'
      });

      if (response.status === 401) {
        // Session expired, arahkan ke login
        navigate('/login', {
          state: { from: { pathname: '/correction' } },
          replace: true
        });
        return;
      }

      const result = await response.json();

      if (result.success && result.data) {
        const polygonData = result.data;
        const loadedPolygons: Polygon[] = [];

        if (polygonData.disc_polygons && Array.isArray(polygonData.disc_polygons)) {
          polygonData.disc_polygons.forEach((discPolygon: { id?: string; points?: Array<{ x: number; y: number }> }, index: number) => {
            if (discPolygon && Array.isArray(discPolygon.points) && discPolygon.points.length > 0) {
              loadedPolygons.push({
                id: discPolygon.id || `disc_${Date.now()}_${index}`,
                label: 'disc',
                points: discPolygon.points.map((point: { x: number; y: number }) => ({
                  x: Number(point.x) || 0,
                  y: Number(point.y) || 0
                }))
              });
            } else if (Array.isArray(discPolygon)) {
              loadedPolygons.push({
                id: `disc_${Date.now()}_${index}`,
                label: 'disc',
                points: discPolygon.map((point: { x: number; y: number }) => ({
                  x: Number(point.x) || 0,
                  y: Number(point.y) || 0
                }))
              });
            }
          });
        }

        if (polygonData.cup_polygons && Array.isArray(polygonData.cup_polygons)) {
          polygonData.cup_polygons.forEach((cupPolygon: { id?: string; points?: Array<{ x: number; y: number }> }, index: number) => {
            if (cupPolygon && Array.isArray(cupPolygon.points) && cupPolygon.points.length > 0) {
              loadedPolygons.push({
                id: cupPolygon.id || `cup_${Date.now()}_${index}`,
                label: 'cup',
                points: cupPolygon.points.map((point: { x: number; y: number }) => ({
                  x: Number(point.x) || 0,
                  y: Number(point.y) || 0
                }))
              });
            } else if (Array.isArray(cupPolygon)) {
              loadedPolygons.push({
                id: `cup_${Date.now()}_${index}`,
                label: 'cup',
                points: cupPolygon.map((point: { x: number; y: number }) => ({
                  x: Number(point.x) || 0,
                  y: Number(point.y) || 0
                }))
              });
            }
          });
        }

        setPolygons(loadedPolygons);
      } else {
        setPolygons([]);
      }
    } catch {
      setPolygons([]);
    }
  };

  const handleAnalyzePolygons = async () => {
    if (!patientId) {
      alert('Patient ID tidak ditemukan. Pastikan data pasien sudah tersimpan.');
      return;
    }

    try {
      const discPolygons = polygons
        .filter(p => p.label === 'disc')
        .map(p => ({
          id: p.id,
          label: p.label,
          points: p.points
        }));

      const cupPolygons = polygons
        .filter(p => p.label === 'cup')
        .map(p => ({
          id: p.id,
          label: p.label,
          points: p.points
        }));

      const hasEmptyDiscPolygons = discPolygons.some(p => !p.points || p.points.length === 0);
      const hasEmptyCupPolygons = cupPolygons.some(p => !p.points || p.points.length === 0);

      if (hasEmptyDiscPolygons || hasEmptyCupPolygons) {
        alert('Tidak dapat menyimpan polygon. Terdapat polygon yang belum digambar (kosong). Pastikan semua polygon memiliki titik.');
        return;
      }

      const validDiscPolygons = discPolygons.filter(p => p.points.length >= 3);
      const validCupPolygons = cupPolygons.filter(p => p.points.length >= 3);

      if (discPolygons.length === 0 && cupPolygons.length === 0) {
        alert('Tidak ada polygon yang dapat disimpan. Pastikan Anda telah menggambar polygon disc atau cup.');
        return;
      }

      const vCdrValue = calculateVCdr(validDiscPolygons, validCupPolygons);
      const hCdrValue = calculateHCdr(validDiscPolygons, validCupPolygons);
      const areaCdrValue = calculateAreaCdr(validDiscPolygons, validCupPolygons);

      const newDiagnose = vCdrValue && vCdrValue > 0.5 ? "Glaucoma" : "Non Glaucoma";

      const polygonData: PolygonPayload = {
        disc_polygons: discPolygons,
        cup_polygons: cupPolygons
      };

      if (vCdrValue !== null && hCdrValue !== null && areaCdrValue !== null) {
        polygonData.calculated_cdr = {
          v_cdr: vCdrValue,
          h_cdr: hCdrValue,
          area_cdr: areaCdrValue
        };
      }

      const savedUserStr = localStorage.getItem('user');
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          polygonData.doctor_info = {
            id: savedUser.id,
            name: savedUser.name,
            username: savedUser.username,
            dr_id_number: savedUser.dr_id_number,
            email: savedUser.email
          };
        } catch (e) {
          console.warn('Failed to parse user from localStorage:', e);
        }
      }

      const response = await fetch(`/api/save-polygon/${patientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(polygonData)
      });

      if (response.status === 401) {
        // Session expired, arahkan ke login
        alert('Sesi Anda telah berakhir. Silakan login kembali.');
        navigate('/login', {
          state: { from: { pathname: '/correction' } },
          replace: true
        });
        return;
      }

      const result = await response.json();

      if (result.success) {
        if (vCdrValue !== null && hCdrValue !== null && areaCdrValue !== null) {
          const doctorInfo = result.doctor_name ? ` oleh ${result.doctor_name}` : '';
          alert(`Nilai CDR berhasil dihitung${doctorInfo}.\n\nV CDR: ${vCdrValue.toFixed(2)}\nH CDR: ${hCdrValue.toFixed(2)}\nArea CDR: ${areaCdrValue.toFixed(2)}\nDiagnosa: ${newDiagnose}`);
        } else {
          alert('Poligon berhasil disimpan.');
        }
      } else {
        alert(`Gagal menyimpan polygon: ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving polygons:', error);
      alert('Terjadi error saat menyimpan polygon.');
    }
  };

  // Handler toggle visibility per id
  const handleToggleVisibility = (id: string) => {
    setPolygonVisibilities((old) => ({ ...old, [id]: !old[id] }));
  };
  // Handler toggle all
  const handleToggleAllVisibility = () => {
    const visibles = Object.values(polygonVisibilities).every(Boolean);
    setPolygonVisibilities((old) => {
      const updated: { [id: string]: boolean } = {};
      Object.keys(old).forEach((id) => {
        updated[id] = !visibles ? true : false;
      });
      return updated;
    });
  };

  // Mulai mode gambar polygon
  const startDrawingPolygon = () => {
    if (isDrawing) {
      setPolygons((prev) => {
        const lastPolygon = prev[prev.length - 1];
        if (lastPolygon && lastPolygon.label === 'drawing') {
          if (lastPolygon.points.length >= 3) {
            const updatedPolygons = [...prev];
            updatedPolygons[updatedPolygons.length - 1] = {
              ...lastPolygon,
              label: 'disc',
            };
            return updatedPolygons;
          } else {
            return prev.slice(0, -1);
          }
        }
        return prev;
      });
      setIsDrawing(false);
    } else {
      setIsDrawing(true);
    }
  };

  // Tambah titik ke polygon baru
  const addPointToNewPolygon = (point: Point) => {
    if (!isDrawing) return;

    setPolygons((prev) => {
      const lastPolygon = prev[prev.length - 1];

      if (!lastPolygon || lastPolygon.label !== 'drawing') {
        return [...prev, { id: Date.now().toString(), label: 'drawing', points: [point] }];
      }

      const updatedPolygons = [...prev];
      updatedPolygons[updatedPolygons.length - 1] = {
        ...lastPolygon,
        points: [...lastPolygon.points, point]
      };
      return updatedPolygons;
    });
  };

  // Selesai gambar polygon baru
  const finishDrawingPolygon = () => {
    if (!isDrawing) return;

    setPolygons((prev) => {
      const lastPolygon = prev[prev.length - 1];

      if (lastPolygon && lastPolygon.label === 'drawing' && lastPolygon.points.length >= 3) {
        const updatedPolygons = [...prev];
        updatedPolygons[updatedPolygons.length - 1] = {
          ...lastPolygon,
          label: 'disc',
        };
        return updatedPolygons;
      }
      return prev;
    });

    setIsDrawing(false);
  };

  // Ubah label polygon
  const changePolygonLabel = (id: string, newLabel: string) => {
    setPolygons((prev) => prev.map((p) => p.id === id ? { ...p, label: newLabel } : p));
  };

  const handlePolygonsChange = (updatedPolygons: Polygon[]) => {
    setPolygons(updatedPolygons);
  };

  // Hapus polygon berdasarkan id
  const handleDeleteClass = (id: string) => {
    setPolygons((prev) => prev.filter((p) => p.id !== id));
  };

  // Dapatkan polygon yang sedang digambar
  const getDrawingPolygon = () => {
    const lastPolygon = polygons[polygons.length - 1];
    // Selalu return polygon 'drawing' jika ada, terlepas dari isDrawing state
    return lastPolygon && lastPolygon.label === 'drawing' ? lastPolygon.points : [];
  };

  // Dapatkan polygon yang sudah selesai (bukan drawing)
  const getFinishedPolygons = () => {
    // Filter polygon yang bukan 'drawing' untuk ditampilkan di sidebar
    return polygons.filter(p => p.label !== 'drawing');
  };

  // Dapatkan semua polygon untuk canvas (termasuk yang sedang digambar)
  const getAllPolygonsForCanvas = () => {
    return polygons; // Kembalikan semua polygon, termasuk 'drawing'
  };

  // Handler upload image dari CorrectionTools
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        setImageUrl(e.target.result);
        setOriginalImageUrl(e.target.result); // Simpan URL gambar asli
      }
    };
    reader.readAsDataURL(file);
  };

  // Handler toggle compare mode
  const handleToggleCompare = () => {
    setIsCompareMode(!isCompareMode);
    if (!isCompareMode) {
      // Switch ke gambar annot dari resultData jika tersedia
      if (resultData && resultData.draw_url) {
        setImageUrl(resultData.draw_url);
      } else {
        // Fallback ke draw_mask.png jika draw_url tidak tersedia
        setImageUrl('/api/uploads/draw_mask.png');
      }
    } else {
      // Switch kembali ke gambar asli
      setImageUrl(originalImageUrl);
    }
  };

  // Handler download background image
  const handleDownloadBackground = async () => {
    const url = imageUrl || '/content/glaucoma_fundus.jpg';
    // Ambil nama file dari data pasien
    let filename = 'canvas-background.jpg';
    if (dummyResult && dummyResult.nama && dummyResult.posisi) {
      const nama = dummyResult.nama.replace(/\s+/g, '_');
      const posisi = dummyResult.posisi.replace(/\s+/g, '_');
      filename = `${nama}_${posisi}.jpg`;
    }

    try {
      // Cek apakah browser mendukung File System Access API
      if ('showSaveFilePicker' in window) {
        // @ts-expect-error - File System Access API belum fully supported di TypeScript
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Image files',
            accept: {
              'image/jpeg': ['.jpg', '.jpeg'],
              'image/png': ['.png']
            }
          }]
        });

        // Fetch gambar dan convert ke blob
        const response = await fetch(url);
        const blob = await response.blob();

        // Tulis ke file yang dipilih user
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Fallback untuk browser yang tidak mendukung File System Access API
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup blob URL
        URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback jika terjadi error
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handler zoom in/out
  const clampZoom = (value: number) => Math.max(0.5, Math.min(3, value));
  const handleZoomIn = () => setZoom(z => clampZoom(z + 0.1));
  const handleZoomOut = () => setZoom(z => clampZoom(z - 0.1));
  const handleZoomChange = (z: number) => setZoom(clampZoom(z));
  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Header */}
      <div className="w-full py-5 flex shadow-xl">
        <div className="w-3/4 flex gap-10">
          <div className="flex justify-center ps-10 py-2 gap-12">

            {/* Logo & Navbar */}
            <CorrectionNavbar />
          </div>
        </div>
        <div className="w-1/4 my-auto">
          <button
            onClick={handleLogout}
            className="btn bg-mainBlue hover:bg-red-600 transition-colors duration-200"
            title="Logout"
          >
            <CorrectionAccount />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full flex">
        {/* Main Canvas */}
        <div className="w-3/4 pt-3 relative"> {/* Tambahkan relative di sini */}
          <div style={{ position: 'absolute', top: 30, left: 0, right: 0, zIndex: 10, display: 'flex', justifyContent: 'center', pointerEvents: 'auto' }}>
            <CorrectionTools
              onImageUpload={handleImageUpload}
              onDownloadBackground={handleDownloadBackground}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
            />
          </div>
          <CorrectionCanvas
            polygons={getAllPolygonsForCanvas()}
            onPolygonsChange={handlePolygonsChange}
            isDrawing={isDrawing}
            newPolygonPoints={getDrawingPolygon()}
            onAddPoint={addPointToNewPolygon}
            onFinishPolygon={finishDrawingPolygon}
            polygonVisibilities={polygonVisibilities}
            // Tambahan adjustment
            gridline={adjustment.gridline}
            gridlineSize={adjustment.gridlineSize}
            gridlineColor={adjustment.gridlineColor}
            gridlineOpacity={adjustment.gridlineOpacity}
            brightness={adjustment.brightness}
            contrast={adjustment.contrast}
            saturation={adjustment.saturation}
            imageUrl={imageUrl}
            zoom={zoom}
            onZoomChange={handleZoomChange}
          />
        </div>
        {/* Tools Side Bar */}
        <div className="w-1/4 flex flex-col bg-lightBlue relative">
          {resultData && (
            <CorrectionResult
              data={resultData}
              onAnalyze={handleAnalyzePolygons}
            />
          )}
          <CorrectionClass
            polygons={getFinishedPolygons()}
            onDeleteClass={handleDeleteClass}
            onStartDrawingPolygon={startDrawingPolygon}
            onChangeLabel={changePolygonLabel}
            isDrawing={isDrawing}
            polygonVisibilities={polygonVisibilities}
            onToggleVisibility={handleToggleVisibility}
            onToggleAllVisibility={handleToggleAllVisibility}
            onImageUpload={handleImageUpload}
            onToggleCompare={handleToggleCompare}
            isCompareMode={isCompareMode}
            patientId={patientId}
            resultData={resultData}
          />
          <CorrectionAdjust
            gridline={adjustment.gridline}
            gridlineSize={adjustment.gridlineSize}
            gridlineColor={adjustment.gridlineColor}
            gridlineOpacity={adjustment.gridlineOpacity}
            brightness={adjustment.brightness}
            contrast={adjustment.contrast}
            saturation={adjustment.saturation}
            onChange={handleAdjustmentChange}
          />
        </div>
      </div>
    </>
  );
}

// Pastikan export default berada di akhir file dan tidak ada masalah sintaks
export default Correction;