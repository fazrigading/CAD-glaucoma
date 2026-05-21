export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    name: string;
    username: string;
    dr_id_number: string;
    email: string;
  };
}

export interface AuthCheckResponse {
  success: boolean;
  authenticated: boolean;
  user?: {
    id: number;
    name: string;
    username: string;
    dr_id_number: string;
    email: string;
  };
  message?: string;
}

export interface PolygonPayload {
  disc_polygons: Array<{ id: string; label: string; points: Array<{ x: number; y: number }> }>;
  cup_polygons: Array<{ id: string; label: string; points: Array<{ x: number; y: number }> }>;
  calculated_cdr?: {
    v_cdr: number;
    h_cdr: number;
    area_cdr: number;
  };
  doctor_info?: {
    id: number;
    name: string;
    username: string;
    dr_id_number: string;
    email: string;
  };
}

export interface SavePolygonResponse {
  success: boolean;
  message: string;
  patient_id: number;
  doctor_name?: string;
}
