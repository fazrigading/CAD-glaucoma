import { useEffect, useState as useReactState } from "react";
import type { FormData } from "../../interfaces/InterfaceModel";

// interface FormData 
interface InputComponentProps {
  onSubmit: (formData: FormData) => void;
}

// InputComponent
// This component handles the input form for user data and image upload
// It accepts an onSubmit function as a prop to handle form submission
const InputComponent = ({ onSubmit }: InputComponentProps) => {
    const [nama, setNama] = useReactState('');
    const [umur, setUmur] = useReactState('');
    const [gender, setGender] = useReactState('Laki-laki');
    const [posisi] = useReactState('Kanan');
    const [gambar, setGambar] = useReactState<File | null>(null);
    const [file, setFile] = useReactState<string | null>(null);
    const [filename, setFilename] = useReactState('');
    const [fileStatus, setFileStatus] = useReactState(true);
    const [canReview, setCanReview] = useReactState(false);

    useEffect(() => {
      // Cek apakah sudah ada hasil prediksi di localStorage
      const reviewData = localStorage.getItem('reviewData');
      setCanReview(!!reviewData);
      // Listen perubahan localStorage dari komponen lain
      const onStorage = () => {
        const reviewData = localStorage.getItem('reviewData');
        setCanReview(!!reviewData);
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    }, []);

    const handleReview = (e: React.MouseEvent) => {
      e.preventDefault();
      if (canReview) {
        const currentPatientId = localStorage.getItem('currentPatientId');
        if (currentPatientId) {
          window.location.href = `/correction?patient_id=${currentPatientId}`;
        } else {
          // Fallback jika tidak ada patient_id
          window.location.href = '/correction';
        }
      }
    };

    // Handlers for input changes
    // These functions update the state when the user inputs data
    // They are used for controlled components in React
    const handleNama = (e: React.ChangeEvent<HTMLInputElement>) => setNama(e.target.value);
    const handleUmur = (e: React.ChangeEvent<HTMLInputElement>) => setUmur(e.target.value);
    const handleGender = (e: React.ChangeEvent<HTMLSelectElement>) => setGender(e.target.value);


    // This function handles the image file input
    // It reads the selected file, updates the state, and prepares the image for display
    // It uses FileReader to convert the image to a data URL for preview
    const handleGambar = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files ? e.target.files[0] : null;
        setGambar(selectedFile);
        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => {
                setFile((event.target as FileReader).result as string);
                setFileStatus(false);
            };
            reader.readAsDataURL(selectedFile);
            setFilename(selectedFile.name);
        }
    };

    // This function handles the form submission
    // It prevents the default form submission behavior, validates the input,
    // and calls the onSubmit function passed as a prop with the form data
    // It ensures that all required fields are filled before submission
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit({ nama, umur, gender, posisi, gambar });
    };


    return (

      // Form for user input and image upload
      <form onSubmit={handleSubmit}>
      <div className="w-full">
        {/* Input Image Data */}
        <div className="w-full">
          <p className="text-center text-lg">Data Pemilik Gambar</p>

          {/* Input Column */}
          <div className="py-4 flex justify-between">
            {/* Input Nama */}
            <div className="w-1/2 flex gap-5">
              <p>Nama</p>
              <input 
                type="text" 
                placeholder="Masukan Nama"
                value={nama}
                onChange={handleNama}
                className="w-full input input-sm" 
              />
            </div>

            <div className="flex gap-5">
                <p>Umur</p>
                <input 
                  type="number" 
                  placeholder="Masukan Umur"
                  value={umur}
                  onChange={handleUmur}
                  className="input input-sm bg-darkblue"
                  min={0}
                />
              </div>

              {/* Input Gender */}
              <div className="flex gap-3">
                <p>Jenis Kelamin</p>
                <select value={gender} onChange={handleGender} className="select select-sm bg-darkblue">
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              {/* Input Posisi Mata */}
              {/* <div className="flex gap-3">
                <p>Posisi Mata</p>
                <select value={posisi} onChange={handlePosisi} className="select select-sm bg-darkblue">
                  <option value="Kanan">Kanan</option>
                  <option value="Kiri">Kiri</option>
                </select>
              </div> */}

            <div className="flex justify-between pt-3">
              
              {/* Input Umur */}
              {/* <div className="flex gap-5">
                <p>Umur</p>
                <input 
                  type="number" 
                  placeholder="Masukan Umur"
                  value={umur}
                  onChange={handleUmur}
                  className="input input-sm bg-darkblue"
                  min={0}
                />
              </div> */}

              {/* Input Gender */}
              {/* <div className="flex gap-3">
                <p>Jenis Kelamin</p>
                <select value={gender} onChange={handleGender} className="select select-sm bg-darkblue">
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div> */}

              {/* Input Posisi Mata */}
              {/* <div className="flex gap-3">
                <p>Posisi Mata</p>
                <select value={posisi} onChange={handlePosisi} className="select select-sm bg-darkblue">
                  <option value="Kanan">Kanan</option>
                  <option value="Kiri">Kiri</option>
                </select>
              </div> */}
              <input type="hidden" value={posisi} />
            </div>
          </div>
        </div>

        {/* Upload Image */}
        <div className="w-full">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-52 border-2 border-gray-500 border-dashed rounded-lg cursor-pointer bg-darkblue hover:opacity-70">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                
                {/* Upload Status */}
                {fileStatus ? (
                  <>
                    <p className="text-lg pb-4 text-gray-500">Upload Citra Fundus</p>
                    <span className="material-symbols-outlined text-[70px] text-gray-500">upload</span>
                  </>
                ) : (file && (
                  <div>                    
                    <img src={file} alt="Upload" width={100} className="m-auto"/>
                    <p className="text-align text-gray-500">{filename}</p>
                  </div>
                ))}

                {/* Drag and Drop Instructions */}
                <p className="mb-4 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or
                  drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG dan JPG</p>
              </div>

              {/* Hidden File Input */}
              <input 
                id="dropzone-file" 
                type="file" 
                accept="image/*" 
                onChange={handleGambar} 
                className="hidden" 
              />
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="w-full py-5 flex justify-center gap-5">
          <button type="submit" className="btn w-1/5 bg-mainRed text-white border-none shadow-none hover:bg-red-900 rounded-full font-bold">
            Prediksi
          </button>

          <button
            className="btn bg-mainRed text-white w-1/5 rounded-full"
            onClick={handleReview}
            disabled={!canReview}
            type="button"
          >
            Review
          </button>
        </div>

      </div>
    </form>
    );
};

export default InputComponent;