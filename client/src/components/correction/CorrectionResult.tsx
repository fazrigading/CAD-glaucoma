import type { ResponseData } from "../../interfaces/InterfaceModel";

interface CorrectionResultProps {
  data: ResponseData;
  onAnalyze?: () => void;
  onDataUpdate?: (newData: ResponseData) => void; // Tambahan callback untuk update data
}

const CorrectionResult = ({ data, onAnalyze }: CorrectionResultProps) => {
  const handleAnalyzeClick = () => {
    if (onAnalyze) {
      onAnalyze();
    }
  };

  return (
    <div className="w-full px-3 py-2 text-left text-xs rounded">
      {/* Biodata Pasien */}
      <div className="mb-2 text-center flex justify-around flex-wrap">
        <div className="font-semibold text-sm mb-1 truncate">{data.nama}</div>
        <div className="font-semibold text-sm mb-1">|</div>
        <div className="font-semibold text-sm mb-1">{data.umur} tahun</div>
        <div className="font-semibold text-sm mb-1">|</div>
        <div className="font-semibold text-sm mb-1">{data.gender}</div>
        <div className="font-semibold text-sm mb-1">|</div>
        <div className="font-semibold text-sm mb-1">Mata {data.posisi}</div>
      </div>
      
      {/* Nilai CDR dari Database */}
      <div className="mb-2 pt-1">
        <div className="flex justify-between text-center">
          <div className="flex-1">
            <div className="font-bold text-mainRed text-lg leading-tight">{data.v_cdr}</div>
            <div className="text-[15px] font-bold text-gray-500">V CDR</div>
          </div>
          <div className="flex-1">
            <div className="font-bold text-mainRed text-lg leading-tight">{data.h_cdr}</div>
            <div className="text-[15px] font-bold text-gray-500">H CDR</div>
          </div>
          <div className="flex-1">
            <div className="font-bold text-mainRed text-lg leading-tight">{data.area_cdr}</div>
            <div className="text-[15px] font-bold text-gray-500">Area CDR</div>
          </div>
        </div>
      </div>
      
      {/* Hasil Prediksi */}
      <div className="mb-1 text-center">
        <span className="text-md text-gray-500">Indikasi</span>
        <div className={`text-xl font-bold leading-tight ${
          data.diagnose === 'Glaucoma' ? 'text-red-600' : 'text-green-600'
        }`}>
          {data.diagnose}
        </div>
      </div>
      <button 
        className="btn btn-xs w-full mt-1 bg-mainRed border-none text-white hover:bg-red-900"
        onClick={handleAnalyzeClick}
      >
        Analisis
      </button>
    </div>
  );
};

export default CorrectionResult;