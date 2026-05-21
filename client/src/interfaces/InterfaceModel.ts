export interface ResponseData {
  patient_id?: number;
  nama: string;
  umur: string;
  gender: string;
  posisi: string;
  gambar_url: string;
  mask_url: string;
  draw_url: string;
  html_content: string;
  v_cdr: string;
  h_cdr: string;
  area_cdr: string;
  diagnose: string; 
}

export interface FormData {
  nama: string;
  umur: string;
  gender: string;
  posisi: string;
  gambar: File | null;
}

export interface PredictionHistory {
  id: number;
  patient_name: string;
  age: number;
  gender: 'Laki-laki' | 'Perempuan';
  eyes_position: 'Kanan' | 'Kiri';
  raw_img_path: string;
  mask_img_path: string;
  annot_img_path: string;
  h_cdr: number;
  v_cdr: number;
  area_cdr: number;
  diagnose: 'Glaucoma' | 'Non Glaucoma';
  created_time: string;
}

export interface HistoryResponse {
  success: boolean;
  message: string;
  data: PredictionHistory[];
  total: number;
}

export interface PredictionDetailResponse {
  success: boolean;
  message: string;
  data: PredictionHistory | null;
}