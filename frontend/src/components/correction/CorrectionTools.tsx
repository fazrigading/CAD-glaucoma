import React, { useRef } from 'react';

interface CorrectionToolsProps {
  onImageUpload: (file: File) => void;
  onDownloadBackground: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const CorrectionTools: React.FC<CorrectionToolsProps> = ({ onImageUpload, onDownloadBackground, onZoomIn, onZoomOut }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPhotoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onDownloadBackground();
  };

  const handleZoomInClick = (e: React.MouseEvent) => {   
    e.preventDefault();
    onZoomIn();
  };

  const handleZoomOutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onZoomOut();
  };

  return (
    <div className="py-2 px-5 m-auto flex justify-center bg-slate-100 shadow-xl rounded-full">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <a href="" onClick={handleAddPhotoClick}>
        <span className="material-symbols-outlined p-1 rounded-lg text-slate-500 hover:bg-lightRed hover:text-white">add_photo_alternate</span>
      </a>
      <a href="" onClick={handleDownloadClick}>
        <span className="material-symbols-outlined p-1 rounded-lg text-slate-500 hover:bg-lightRed hover:text-white">download</span>
      </a>
      <a href="" onClick={handleZoomInClick}>
        <span className="material-symbols-outlined p-1 rounded-lg text-slate-500 hover:bg-lightRed hover:text-white">zoom_in</span>
      </a>
      <a href="" onClick={handleZoomOutClick}>
        <span className="material-symbols-outlined p-1 rounded-lg text-slate-500 hover:bg-lightRed hover:text-white">zoom_out</span>
      </a>
    </div>
  );
};

export default CorrectionTools; 