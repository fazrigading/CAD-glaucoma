
import { useState } from "react";
import type { ResponseData, FormData } from "../../interfaces/InterfaceModel";
import OutputComponent from "./outputComponent";
import InputComponent from "./inputComponent";
import { BarLoader } from "react-spinners";

const useModel = () => {

  // State to manage form data and response
  const [responseData, setResponseData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);

  // Function to handle form submission
  const handleFormSubmit = async (formData: FormData) => {
    const { nama, umur, gender, posisi, gambar } = formData;
    if (!nama || !umur || !gambar) {
      alert("Harap Masukkan Data Dengan Lengkap");
      return;
    }
    // Validate image file type
    const validImageTypes = ["image/jpeg", "image/png"];
    if (!validImageTypes.includes(gambar.type)) {
      alert("Gambar Harus Berformat PNG atau JPG");
      return;
    }

    // Prepare FormData for API request
    const apiFormData = new FormData();
    apiFormData.append('nama', nama);
    apiFormData.append('umur', umur);
    apiFormData.append('gender', gender);
    apiFormData.append('posisi', posisi);
    apiFormData.append('gambar', gambar);

    // Send data to the API
    try {
      setLoading(true);
      // Gunakan URL relatif untuk API agar berfungsi di semua environment
      const response = await fetch("/api/upload", {
        method: "POST",
        body: apiFormData,
        credentials: 'include', // Menambahkan credentials untuk mengirim cookies session
      });

      // Check if the response is ok
      if (response.ok) {
        const data = await response.json();
        setResponseData(data);
        // Simpan ke localStorage untuk review
        localStorage.setItem('reviewData', JSON.stringify(data));
        // Simpan patient_id jika tersedia
        if (data.patient_id) {
          localStorage.setItem('currentPatientId', data.patient_id.toString());
        }
      } else { 
        alert("Gagal Mengirim");
      }

    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-2/3 m-auto">
      
      {/* Input Form */}
      <InputComponent onSubmit={handleFormSubmit} />

      {/* Loader */}
      {loading && 
        <div className="pb-5">
          <p className="text-subheading text-center">Harap Tunggu...</p>
          <BarLoader color="#36d7b7" width={`${100}%`} loading={loading} />
        </div>
      }

      {/* Output Component */}
      <OutputComponent responseData={responseData} />
    </div>
  )
}
export default useModel;