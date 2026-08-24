export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  patient_profile?: {
    date_of_birth?: string;
    gender?: string;
    emergency_contact?: string;
    medical_history?: string;
  };
  doctor_profile?: {
    specialty?: string;
    license_number?: string;
    hospital_clinic?: string;
    contact_phone?: string;
  };
}

export type MonitoringStatus = 
  | 'healing_normally' 
  | 'needs_monitoring' 
  | 'possible_abnormal_change' 
  | 'insufficient_quality'
  | 'no_wound_detected';

export type HealingTrend = 
  | 'improving' 
  | 'stable' 
  | 'worsening' 
  | 'needs_attention' 
  | 'undetermined';

export interface AIAnalysis {
  id: string;
  model_version: string;
  image_quality_status: 'PASS' | 'WARNING' | 'FAIL';
  quality_metrics: {
    blur_score?: number;
    brightness?: number;
    contrast?: number;
    glare_ratio_pct?: number;
    resolution?: string;
  };
  wound_area_px: number;
  estimated_area_cm2: number;
  color_granulation_pct: number;
  color_slough_pct: number;
  color_necrotic_pct: number;
  color_pale_pct: number;
  exudate_level: 'None' | 'Low' | 'Moderate' | 'High';
  exudate_area_pct: number;
  tissue_classification: string;
  healing_trend: HealingTrend;
  monitoring_status: MonitoringStatus;
  confidence_score: number;
  change_from_previous?: {
    area_change_pct?: number;
    granulation_change_pct?: number;
    slough_change_pct?: number;
    previous_assessment_date?: string;
  };
  limitations: string[];
  observations: string[];
  disclaimer: string;
}

export interface WoundImage {
  id: string;
  wound_id: string;
  image_url: string;
  thumbnail_url?: string;
  mask_url?: string;
  overlay_url?: string;
  heatmap_url?: string;
  capture_date: string;
  days_since_dressing: number;
  notes?: string;
  image_width: number;
  image_height: number;
  file_size_kb: number;
  image_quality_score: number;
  is_baseline: boolean;
  created_at: string;
  ai_analysis?: AIAnalysis;
}

export interface DoctorNote {
  id: string;
  doctor_id: string;
  doctor_name: string;
  clinical_observation: string;
  recommendations?: string;
  follow_up_date?: string;
  review_status: 'reviewed' | 'follow_up_required' | 'urgent_consult';
  created_at: string;
}

export interface PatientNote {
  id: string;
  pain_level?: number;
  exudate_change?: string;
  symptoms?: string;
  created_at: string;
}

export interface SharedDoctorInfo {
  id: string;
  doctor_id: string;
  doctor_name: string;
  doctor_email: string;
  specialty?: string;
  hospital_clinic?: string;
  shared_at: string;
  expires_at?: string;
  permissions: string;
}

export interface WoundSummary {
  id: string;
  name: string;
  wound_type: string;
  body_location: string;
  dressing_type: string;
  status: string;
  created_at: string;
  latest_image_date?: string;
  latest_status: MonitoringStatus;
  latest_area_cm2: number;
  area_reduction_pct: number;
  image_count: number;
  days_in_monitoring: number;
  doctor_shared: boolean;
  thumbnail_url?: string;
}

export interface WoundDetail {
  id: string;
  patient_id: string;
  patient_name?: string;
  name: string;
  wound_type: string;
  body_location: string;
  first_observed_date?: string;
  dressing_applied_date?: string;
  dressing_type: string;
  status: string;
  description?: string;
  notes?: string;
  created_at: string;
  images: WoundImage[];
  doctor_notes: DoctorNote[];
  patient_notes: PatientNote[];
  shared_doctors: SharedDoctorInfo[];
  latest_analysis?: AIAnalysis;
}

export interface TemporalProgress {
  wound_id: string;
  wound_name: string;
  total_observations: number;
  days_tracked: number;
  overall_area_change_pct: number;
  healing_velocity_cm2_per_day: number;
  trajectory_assessment?: string;
  overall_trajectory_assessment?: string;
  datapoints: Array<{
    date: string;
    day_number: number;
    image_id: string;
    area_cm2: number;
    granulation_pct: number;
    slough_pct: number;
    necrotic_pct: number;
    pale_pct: number;
    exudate_level: string;
    monitoring_status: MonitoringStatus;
    is_baseline: boolean;
  }>;
}

export interface DoctorDashboardStats {
  total_assigned_patients: number;
  pending_reviews: number;
  abnormal_alerts: number;
  reviewed_this_week: number;
}

export interface DoctorPatientItem {
  patient_id: string;
  patient_name: string;
  patient_email: string;
  wound_id: string;
  wound_name: string;
  wound_type: string;
  body_location: string;
  dressing_type: string;
  last_updated: string;
  latest_status: MonitoringStatus;
  latest_area_cm2: number;
  pending_review: boolean;
  image_count: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notification_type: 'alert' | 'review' | 'quality_warning' | 'info';
  is_read: boolean;
  wound_id?: string;
  created_at: string;
}

export interface ReportItem {
  id: string;
  wound_id: string;
  wound_name?: string;
  title: string;
  report_type: string;
  generated_at: string;
  summary_findings: string;
  html_content?: string;
}
