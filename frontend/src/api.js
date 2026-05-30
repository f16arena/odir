import axios from 'axios';

// Адрес бэкенда берётся из переменной окружения (Vercel),
// по умолчанию — локальная разработка.
export const API_ORIGIN = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Строит абсолютный URL для файла (снимок / Grad-CAM).
// Если бэкенд вернул уже полный URL (Supabase Storage) — используем как есть,
// иначе подставляем origin бэкенда (локальный режим со StaticFiles).
export const fileUrl = (path) =>
  !path ? '' : /^https?:\/\//.test(path) ? path : `${API_ORIGIN}${path}`;

const API = axios.create({
  baseURL: `${API_ORIGIN}/api`,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = (email, password) => {
  const form = new URLSearchParams();
  form.append('username', email);
  form.append('password', password);
  return API.post('/auth/login', form);
};

export const getMe = () => API.get('/auth/me');

export const register = (data) => API.post('/auth/register', data);

export const getPatients = () => API.get('/patients/');
export const getPatient  = (id) => API.get(`/patients/${id}`);
export const createPatient = (data) => API.post('/patients/', data);
export const updatePatient = (id, data) => API.patch(`/patients/${id}`, data);
export const deletePatient = (id) => API.delete(`/patients/${id}`);

export const predict = (patientId, file) => {
  const form = new FormData();
  form.append('file', file);
  return API.post(`/diagnoses/predict/${patientId}`, form);
};

export const getPatientDiagnoses = (patientId) =>
  API.get(`/diagnoses/patient/${patientId}`);

export const getRecentDiagnoses = (limit = 20) =>
  API.get(`/diagnoses/recent/list?limit=${limit}`);

export const updateComment = (diagnosisId, comment) =>
  API.patch(`/diagnoses/${diagnosisId}/comment`, { comment });

export const getSummary          = () => API.get('/analytics/summary');
export const getClassDistribution = () => API.get('/analytics/class-distribution');
export const getDiagnosesOverTime = (days = 30) =>
  API.get(`/analytics/diagnoses-over-time?days=${days}`);
export const getModelMetrics     = () => API.get('/analytics/model-metrics');
export const getPatientsStats    = () => API.get('/analytics/patients-stats');

export const getUsers     = () => API.get('/users/');
export const toggleUser   = (id) => API.patch(`/users/${id}/toggle`);
export const deleteUser   = (id) => API.delete(`/users/${id}`);
