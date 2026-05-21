import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Footers from '../components/general/footer';
import Navbar from '../components/general/navbar';
import Logo from '../components/overview/logo';
import type { PredictionHistory } from '../interfaces/InterfaceModel';
import type { HistoryResponse } from '../interfaces/InterfaceModel';

const History: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [predictions, setPredictions] = useState<PredictionHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/history' } }, replace: true });
      return;
    }
    if (isAuthenticated) {
      fetchPredictionHistory();
    }
  }, [authLoading, isAuthenticated, navigate]);

  const fetchPredictionHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/history');

      if (response.status === 401) {
        // Session expired, redirect to login (should not happen with dummy login)
        navigate('/login', {
          state: { from: { pathname: '/history' } },
          replace: true
        });
        return;
      }

      const data: HistoryResponse = await response.json();

      if (data.success) {
        setPredictions(data.data);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Gagal mengambil data history');
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <>
        <div className="w-full py-5">
          <div className="flex justify-center ps-12 py-2 gap-3">
            <Logo imgWidth={60} imgHeight={60} />
          </div>
          <h1 className="text-center text-4xl mb-4">SISTEM COMPUTER- AIDED DETECTION (CAD)</h1>
          <Navbar />
        </div>

        <div className="flex justify-center items-center min-h-screen">
          <div className="text-gray-600">Mengalihkan ke halaman login...</div>
        </div>

        <Footers />
      </>
    );
  }

  const handleDelete = async (id: number, patientName: string) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus data prediksi untuk pasien "${patientName}"?\n\nData yang dihapus tidak dapat dikembalikan.`
    );

    if (!confirmDelete) return;

    try {
      setDeleteLoading(id);
      const response = await fetch(`/api/history/${id}`, {
        method: 'DELETE'
      });

      if (response.status === 401) {
        alert('Sesi Anda telah berakhir. Silakan login kembali.');
        navigate('/login', {
          state: { from: { pathname: '/history' } },
          replace: true
        });
        return;
      }

      const data = await response.json();

      if (data.success) {
        setPredictions(prev => prev.filter(prediction => prediction.id !== id));
        alert('Data berhasil dihapus!');
      } else {
        alert(`Gagal menghapus data: ${data.message}`);
      }
    } catch (err) {
      console.error('Error deleting prediction:', err);
      alert('Terjadi kesalahan saat menghapus data');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEdit = async (prediction: PredictionHistory) => {
    const correctionData = {
      nama: prediction.patient_name,
      umur: prediction.age.toString(),
      gender: prediction.gender,
      posisi: prediction.eyes_position,
      gambar_url: getImageUrl(prediction.raw_img_path) || '',
      mask_url: getImageUrl(prediction.mask_img_path) || '',
      draw_url: getImageUrl(prediction.annot_img_path) || '',
      html_content: '',
      v_cdr: prediction.v_cdr.toString(),
      h_cdr: prediction.h_cdr.toString(),
      area_cdr: prediction.area_cdr.toString(),
      diagnose: prediction.diagnose,
    };

    localStorage.setItem('reviewData', JSON.stringify(correctionData));
    localStorage.setItem('currentPatientId', prediction.id.toString());

    navigate(`/correction?patient_id=${prediction.id}`);
  };

  const handleImageError = (imageKey: string) => {
    setImageErrors(prev => ({ ...prev, [imageKey]: true }));
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    const cleanPath = imagePath.replace(/^uploads\//, '');
    return `/api/uploads/${cleanPath}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDiagnoseColor = (diagnose: string) => {
    return diagnose === 'Glaucoma' ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100';
  };

  if (loading) {
    return (
      <>
        {/* Header */}
        <div className="w-full py-5">
          <div className="flex justify-center ps-12 py-2 gap-3">
            <Logo imgWidth={60} imgHeight={60} />
          </div>
          <h1 className="text-center text-4xl mb-4">SISTEM COMPUTER- AIDED DETECTION (CAD)</h1>
          <Navbar />
        </div>

        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>

        <Footers />
      </>
    );
  }

  if (error) {
    return (
      <>
        {/* Header */}
        <div className="w-full py-5">
          <div className="flex justify-center ps-12 py-2 gap-3">
            <Logo imgWidth={60} imgHeight={60} />
          </div>
          <h1 className="text-center text-4xl mb-4">SISTEM COMPUTER- AIDED DETECTION (CAD)</h1>
          <Navbar />
        </div>

        <div className="flex justify-center items-center min-h-screen">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </div>

        <Footers />
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="w-full py-5">
        <div className="flex gap-25 items-center">
          <div className="flex justify-center ps-12 py-2 gap-3">
            <Logo imgWidth={70} imgHeight={70} />
          </div>
          <h1 className="text-center text-4xl mb-4">SISTEM COMPUTER- AIDED DETECTION (CAD)</h1>
        </div>
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="w-full py-5 bg-slate-200">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
              <h1 className="text-2xl font-bold">History Prediksi Glaukoma</h1>
              <p className="text-blue-100">Daftar hasil prediksi citra fundus yang telah diupload</p>
            </div>

            <div className="p-6">
              {predictions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">Belum ada data prediksi</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-gray-600">Total: {predictions.length} data prediksi</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nama Pasien
                          </th>
                          <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Umur
                          </th>
                          <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Jenis Kelamin
                          </th>
                          <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Posisi Mata
                          </th>
                          <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Gambar Raw
                          </th>
                          <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Gambar Annot
                          </th>
                          <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            H-CDR
                          </th>
                          <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            V-CDR
                          </th>
                          <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Area CDR
                          </th>
                          <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Diagnosa
                          </th>
                          <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tanggal
                          </th>
                          <th className="px-6 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {predictions.map((prediction) => {
                          const rawImageUrl = getImageUrl(prediction.raw_img_path);
                          const annotImageUrl = getImageUrl(prediction.annot_img_path);
                          const rawImageKey = `raw-${prediction.id}`;
                          const annotImageKey = `annot-${prediction.id}`;

                          return (
                            <tr key={prediction.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {prediction.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {prediction.patient_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {prediction.age} tahun
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {prediction.gender}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {prediction.eyes_position}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {rawImageUrl && !imageErrors[rawImageKey] ? (
                                  <img
                                    src={rawImageUrl}
                                    alt={`Raw image for ${prediction.patient_name}`}
                                    className="w-16 h-16 object-cover rounded border cursor-pointer hover:scale-110 transition-transform"
                                    onError={() => handleImageError(rawImageKey)}
                                    onClick={() => window.open(rawImageUrl, '_blank')}
                                    title="Klik untuk memperbesar"
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center">
                                    <span className="text-xs text-gray-500">No Image</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {annotImageUrl && !imageErrors[annotImageKey] ? (
                                  <img
                                    src={annotImageUrl}
                                    alt={`Annotated image for ${prediction.patient_name}`}
                                    className="w-16 h-16 object-cover rounded border cursor-pointer hover:scale-110 transition-transform"
                                    onError={() => handleImageError(annotImageKey)}
                                    onClick={() => window.open(annotImageUrl, '_blank')}
                                    title="Klik untuk memperbesar"
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center">
                                    <span className="text-xs text-gray-500">No Image</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {prediction.h_cdr.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {prediction.v_cdr.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {prediction.area_cdr.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDiagnoseColor(prediction.diagnose)}`}>
                                  {prediction.diagnose}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(prediction.created_time)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEdit(prediction)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-3 rounded text-xs font-medium transition-colors duration-200 flex items-center gap-1"
                                    title="Edit prediksi"
                                  >
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(prediction.id, prediction.patient_name)}
                                    disabled={deleteLoading === prediction.id}
                                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-3 rounded text-xs font-medium transition-colors duration-200 flex items-center gap-1"
                                  >
                                    {deleteLoading === prediction.id ? (
                                      <>
                                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Hapus...
                                      </>
                                    ) : (
                                      <>
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footers />
    </>
  );
};

export default History;