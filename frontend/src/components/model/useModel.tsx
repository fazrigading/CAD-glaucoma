
import { useState } from "react";
import type { ResponseData, FormData } from "../../interfaces/InterfaceModel";
import { apiFetch } from "../../utils/api";
import OutputComponent from "./outputComponent";
import InputComponent from "./inputComponent";
import { BarLoader } from "react-spinners";

const useModel = () => {

  const [responseData, setResponseData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (formData: FormData) => {
    const { nama, umur, gender, posisi, gambar } = formData;
    if (!nama || !umur || !gambar) {
      alert("Harap Masukkan Data Dengan Lengkap");
      return;
    }
    const validImageTypes = ["image/jpeg", "image/png"];
    if (!validImageTypes.includes(gambar.type)) {
      alert("Gambar Harus Berformat PNG atau JPG");
      return;
    }

    const apiFormData = new FormData();
    apiFormData.append('nama', nama);
    apiFormData.append('umur', umur);
    apiFormData.append('gender', gender);
    apiFormData.append('posisi', posisi);
    apiFormData.append('gambar', gambar);

    try {
      setLoading(true);
      const data = await apiFetch<ResponseData>("/api/upload", {
        method: "POST",
        body: apiFormData,
      });
      setResponseData(data);
      localStorage.setItem('reviewData', JSON.stringify(data));
      if (data.patient_id) {
        localStorage.setItem('currentPatientId', data.patient_id.toString());
      }
    } catch {
      alert("Gagal Mengirim");
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