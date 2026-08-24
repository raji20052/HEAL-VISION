import axios from 'axios';
import { 
  User, WoundSummary, WoundDetail, TemporalProgress, 
  DoctorPatientItem, DoctorNote, NotificationItem, ReportItem, WoundImage 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('healvision_jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  auth: {
    register: (data: any) => apiClient.post('/auth/register', data).then(r => r.data),
    login: (data: any) => apiClient.post('/auth/login', data).then(r => r.data),
    demoLogin: (role: 'patient' | 'doctor') => apiClient.post(`/auth/demo-login?role=${role}`).then(r => r.data),
    getMe: (): Promise<User> => apiClient.get('/auth/me').then(r => r.data),
    updateProfile: (data: any): Promise<User> => apiClient.put('/auth/me', data).then(r => r.data),
    changePassword: (data: { current_password: string; new_password: string }) => apiClient.post('/auth/change-password', data).then(r => r.data),
  },

  // Wounds
  wounds: {
    list: (statusFilter?: string): Promise<WoundSummary[]> => 
      apiClient.get('/wounds', { params: { status_filter: statusFilter } }).then(r => r.data),
    create: (data: any): Promise<WoundDetail> => apiClient.post('/wounds', data).then(r => r.data),
    getDetail: (id: string): Promise<WoundDetail> => apiClient.get(`/wounds/${id}`).then(r => r.data),
    update: (id: string, data: any): Promise<WoundDetail> => apiClient.put(`/wounds/${id}`, data).then(r => r.data),
    delete: (id: string) => apiClient.delete(`/wounds/${id}`),
  },

  // Images & Uploads
  images: {
    upload: (
      woundId: string | FormData, 
      file?: File, 
      meta?: { days_since_dressing?: number; is_baseline?: boolean; notes?: string }
    ): Promise<WoundImage> => {
      let formData: FormData;
      if (woundId instanceof FormData) {
        formData = woundId;
      } else {
        formData = new FormData();
        formData.append('wound_id', woundId);
        if (file) formData.append('file', file);
        if (meta?.days_since_dressing !== undefined) {
          formData.append('days_since_dressing', meta.days_since_dressing.toString());
        }
        if (meta?.is_baseline !== undefined) {
          formData.append('is_baseline', meta.is_baseline.toString());
        }
        if (meta?.notes) {
          formData.append('notes', meta.notes);
        }
      }

      return apiClient.post('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(r => r.data);
    },
    delete: (woundId: string, imageId: string) => apiClient.delete(`/images/${imageId}`),
  },

  // AI & Progress
  ai: {
    analyze: (imageId: string, customCalibration?: number) => 
      apiClient.post(`/ai/analyze/${imageId}`, null, { params: { custom_calibration: customCalibration } }).then(r => r.data),
    getProgress: (woundId: string): Promise<TemporalProgress> => 
      apiClient.get(`/ai/progress/${woundId}`).then(r => r.data),
    getEvaluation: () => apiClient.get('/ai/evaluate').then(r => r.data),
  },

  // Doctor Clinical Hub
  doctor: {
    getStats: () => apiClient.get('/doctor/dashboard-stats').then(r => r.data),
    listPatients: (filterStatus?: string): Promise<DoctorPatientItem[]> => 
      apiClient.get('/doctor/patients', { params: { filter_status: filterStatus } }).then(r => r.data),
    getPatients: (filterStatus?: string): Promise<DoctorPatientItem[]> => 
      apiClient.get('/doctor/patients', { params: { filter_status: filterStatus } }).then(r => r.data),
    addClinicalNote: (data: any): Promise<DoctorNote> => apiClient.post('/doctor/notes', data).then(r => r.data),
  },

  // Telemedicine & Sharing
  sharing: {
    share: (data: { wound_id: string; doctor_email?: string; doctor_id?: string; permissions?: string; expires_in_days?: number }) => 
      apiClient.post('/sharing', data).then(r => r.data),
    shareWound: (woundId: string, data: { doctor_email?: string; doctor_id?: string; permissions?: string; expires_in_days?: number }) => 
      apiClient.post('/sharing', { wound_id: woundId, ...data }).then(r => r.data),
    getMyShares: (): Promise<any[]> => apiClient.get('/sharing/my-shares').then(r => r.data),
    revoke: (shareId: string) => apiClient.delete(`/sharing/${shareId}`),
    revokeShare: (woundId: string, shareId: string) => apiClient.delete(`/sharing/${shareId}`),
    listDoctors: (): Promise<any[]> => apiClient.get('/sharing/doctors').then(r => r.data),
  },

  // Reports
  reports: {
    generate: (data: { wound_id: string; title?: string; report_type?: string }): Promise<ReportItem> => 
      apiClient.post('/reports/generate', data).then(r => r.data),
    listForWound: (woundId: string): Promise<ReportItem[]> => 
      apiClient.get(`/reports/wound/${woundId}`).then(r => r.data),
    getHtmlUrl: (reportId: string) => `${API_BASE_URL}/reports/${reportId}/html`,
  },

  // Notifications
  notifications: {
    list: (limit = 20): Promise<NotificationItem[]> => 
      apiClient.get('/notifications', { params: { limit } }).then(r => r.data),
    getUnreadCount: (): Promise<{ unread_count: number }> => 
      apiClient.get('/notifications/unread-count').then(r => r.data),
    markRead: (id: string): Promise<NotificationItem> => 
      apiClient.put(`/notifications/${id}/read`).then(r => r.data),
    markAllRead: () => apiClient.put('/notifications/read-all').then(r => r.data),
  },

  // Demo
  demo: {
    seed: () => apiClient.post('/demo/seed').then(r => r.data),
    getCredentials: () => apiClient.get('/demo/credentials').then(r => r.data),
  }
};

export const getStorageUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://127.0.0.1:8000';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
