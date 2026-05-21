import type { ResponseData } from "../../interfaces/InterfaceModel";

// Component Props
// This component displays the output of the model after processing the input data
// It receives responseData as a prop, which contains the results from the API
interface OutputComponentProps {
  responseData: ResponseData | null;
}

const OutputComponent = ({ responseData }: OutputComponentProps) => {
  // If responseData is null, return null to avoid rendering
  // This is useful for cases where the data is still being fetched or not available
  // It prevents rendering errors when responseData is not yet ready
  if (!responseData) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="w-full flex justify-center items-center gap-10">
        <div className="py-4 flex justify-center gap-5">

          {/* Displaying images from the responseData */}
          {/* Each image is displayed with a caption below it */}
          {/* The images are expected to be URLs provided in the responseData object */}
          <div className="text-center">
            <img 
              src={responseData.gambar_url} 
              width={200} 
              height={200} 
              alt="citra fundus" 
            />
            <p className="pt-2">Gambar Asli</p>
          </div>

          {/* Masking Image */}
          <div className="text-center">
            <img 
              src={responseData.mask_url} 
              width={200} 
              height={200} 
              alt="citra fundus" 
            />
            <p className="pt-2">Masking</p>
          </div>

          {/* Drawn Image */}
          <div className="text-center">
            <img 
              src={responseData.draw_url} 
              width={200} 
              height={200} 
              alt="citra fundus" 
            />
            <p className="pt-2">Anotasi</p>
          </div>

        </div>

        <div className="flex gap-5">

          {/* Displaying user information */}
          <div className="flex flex-col">
            <p>Nama</p>
            <p>Umur</p>
            <p>Jenis Kelamin</p>
            <p>Posisi Mata</p>
            <p>V CDR</p>
            <p>H CDR</p>
            <p>Area CDR</p>
            <p>Prediksi</p>
          </div>
          
          {/* Displaying the values from responseData */}
          <div className="flex flex-col">
            <p>: {responseData.nama}</p>
            <p>: {responseData.umur}</p>
            <p>: {responseData.gender}</p>
            <p>: {responseData.posisi}</p>
            <p>: {responseData.v_cdr}</p>
            <p>: {responseData.h_cdr}</p>
            <p>: {responseData.area_cdr}</p>
            <p>: {responseData.diagnose}</p>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default OutputComponent;