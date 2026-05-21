import { useRef } from 'react';
import CorrectionClasses from './CorrectionClasses';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { ResponseData } from '../../interfaces/InterfaceModel';

interface Point {
  x: number;
  y: number;
}
interface Polygon {
  id: string;
  label: string;
  points: Point[];
}

interface CorrectionClassProps {
  polygons: Polygon[];
  onDeleteClass: (id: string) => void;
  onStartDrawingPolygon: () => void;
  onChangeLabel: (id: string, newLabel: string) => void;
  isDrawing: boolean;
  polygonVisibilities: { [id: string]: boolean };
  onToggleVisibility: (id: string) => void;
  onToggleAllVisibility: () => void;
  onImageUpload: (file: File) => void;
  onToggleCompare: () => void;
  isCompareMode: boolean;
  patientId?: number | null;
  resultData?: ResponseData | null;
}

const CorrectionClass = ({ polygons, onDeleteClass, onStartDrawingPolygon, onChangeLabel, isDrawing, polygonVisibilities, onToggleVisibility, onToggleAllVisibility, onImageUpload, onToggleCompare, isCompareMode, patientId, resultData }: CorrectionClassProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Visibilitas per label
  const isVis = polygons.length > 0 && polygons.every((p) => polygonVisibilities[p.id] !== false);

  // Toggle semua
  const handleToggleAll = () => {
    onToggleAllVisibility();
  };

  // Toggle per label
  const handleToggle = (id: string) => {
    onToggleVisibility(id);
  };

  // Handle upload gambar
  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  // Handle compare toggle
  const handleCompareClick = () => {
    onToggleCompare();
  };

  // Handle download patient data
  const handleDownloadPatientData = async () => {
    if (!patientId || !resultData) {
      alert('Data pasien tidak tersedia untuk diunduh.');
      return;
    }

    try {
      // Buat objek ZIP
      const zip = new JSZip();
      
      // Tambahkan data pasien sebagai JSON
      const patientData = {
        id: patientId,
        nama: resultData.nama,
        umur: resultData.umur,
        gender: resultData.gender,
        posisi: resultData.posisi,
        v_cdr: resultData.v_cdr,
        h_cdr: resultData.h_cdr,
        area_cdr: resultData.area_cdr,
        diagnose: resultData.diagnose,
        polygons: polygons
      };
      
      zip.file('patient_data.json', JSON.stringify(patientData, null, 2));
      
      // Unduh gambar raw
      if (resultData.gambar_url) {
        const rawImageResponse = await fetch(resultData.gambar_url);
        if (rawImageResponse.ok) {
          const rawImageBlob = await rawImageResponse.blob();
          zip.file('raw_image' + getFileExtension(resultData.gambar_url), rawImageBlob);
        }
      }
      
      // Unduh gambar annotasi
      if (resultData.draw_url) {
        const annotImageResponse = await fetch(resultData.draw_url);
        if (annotImageResponse.ok) {
          const annotImageBlob = await annotImageResponse.blob();
          zip.file('annotation_image' + getFileExtension(resultData.draw_url), annotImageBlob);
        }
      }
      
      // Unduh gambar mask
      if (resultData.mask_url) {
        const maskImageResponse = await fetch(resultData.mask_url);
        if (maskImageResponse.ok) {
          const maskImageBlob = await maskImageResponse.blob();
          zip.file('mask_image' + getFileExtension(resultData.mask_url), maskImageBlob);
        }
      }
      
      // Generate ZIP dan unduh
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `patient_${patientId}_data.zip`);
      
    } catch (error) {
      console.error('Error downloading patient data:', error);
      alert('Terjadi kesalahan saat mengunduh data pasien.');
    }
  };
  
  // Helper function to get file extension
  const getFileExtension = (url: string): string => {
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const extensionMatch = filename.match(/\.[0-9a-z]+$/i);
    return extensionMatch ? extensionMatch[0] : '.jpg';
  };

  return (
    <div className="w-full py-5">
      <div className="w-full py-2 bg-mainBlue text-white flex justify-evenly">
        <button
          onClick={onStartDrawingPolygon}
          className={
            `transition-all duration-150 ` +
            (isDrawing
              ? 'bg-white text-mainBlue border border-mainBlue font-bold shadow-md'
              : 'hover:bg-white hover:text-mainBlue')
          }
        >
          <span className="material-symbols-outlined text-heading p-1">edit</span>
        </button>
        <button
          onClick={handleCompareClick}
          className={
            `transition-all duration-150 ` +
            (isCompareMode
              ? 'bg-white text-mainBlue border border-mainBlue font-bold shadow-md'
              : 'hover:bg-white hover:text-mainBlue')
          }
        >
          <span className="material-symbols-outlined text-heading p-1">compare</span>
        </button>
        <button>
          <span className="material-symbols-outlined text-heading p-1 hover:bg-white hover:text-mainBlue" onClick={handleToggleAll}>{isVis ? 'visibility' : 'visibility_off'}</span>
        </button>
        <button onClick={handleUploadClick}><span className="material-symbols-outlined text-heading p-1 hover:bg-white hover:text-mainBlue">upload</span></button>
        <button onClick={handleDownloadPatientData}>
          <span className="material-symbols-outlined text-heading p-1 hover:bg-white hover:text-mainBlue">download</span>
        </button>
      </div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <div className="w-full overflow-y-auto">
        {polygons.map((polygon, idx) => (
          <CorrectionClasses
            key={polygon.id}
            classes={polygon.label}
            isVisible={polygonVisibilities[polygon.id] ?? true}
            nomor={idx + 1}
            changeVisibility={() => handleToggle(polygon.id)}
            onDelete={() => onDeleteClass(polygon.id)}
            onChangeLabel={(newLabel: string) => onChangeLabel(polygon.id, newLabel)}
          />
        ))}
      </div>
    </div>
  );
};

export default CorrectionClass;