import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Profile = {
  id: string;
  full_name: string;
  role: 'asha' | 'doctor' | 'admin';
  phone?: string | null;
  facility?: string | null;
  language: string;
  created_at: string;
};

export type Patient = {
  id: string;
  full_name: string;
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
  village?: string | null;
  district?: string | null;
  blood_group?: string | null;
  allergies?: string | null;
  chronic_conditions?: string | null;
  registered_by?: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  patient_id: string;
  practitioner_id?: string | null;
  scheduled_at: string;
  type: 'in-person' | 'video' | 'tele';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  reason?: string | null;
  created_at: string;
  patient?: Patient;
};

export type Consultation = {
  id: string;
  appointment_id?: string | null;
  patient_id: string;
  practitioner_id?: string | null;
  vitals?: Record<string, any> | null;
  chief_complaint?: string | null;
  diagnosis?: string | null;
  notes?: string | null;
  ai_suggestion?: string | null;
  created_at: string;
  patient?: Patient;
};

export type Prescription = {
  id: string;
  consultation_id: string;
  medicine_name: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
  created_at: string;
};

export type Vaccination = {
  id: string;
  patient_id: string;
  vaccine_name: string;
  dose_number: number;
  administered_date: string;
  next_due?: string | null;
  administered_by?: string | null;
  notes?: string | null;
  created_at: string;
  patient?: Patient;
};

export type MaternalRecord = {
  id: string;
  patient_id: string;
  lmp?: string | null;
  edd?: string | null;
  gravida: number;
  para: number;
  trimester: number;
  anc_visits: number;
  risk_level: 'low' | 'medium' | 'high';
  notes?: string | null;
  created_at: string;
  patient?: Patient;
};

export type InventoryItem = {
  id: string;
  medicine_name: string;
  category?: string | null;
  quantity: number;
  unit?: string | null;
  reorder_level: number;
  expiry_date?: string | null;
  batch_no?: string | null;
  facility?: string | null;
  created_at: string;
};

export type Scheme = {
  id: string;
  name: string;
  description?: string | null;
  eligibility_criteria?: string | null;
  benefits?: string | null;
  category?: string | null;
  min_age?: number | null;
  max_age?: number | null;
  income_limit?: number | null;
  for_pregnant: boolean;
  for_child: boolean;
  created_at: string;
};

export type SchemeApplication = {
  id: string;
  patient_id: string;
  scheme_id: string;
  status: 'pending' | 'eligible' | 'approved' | 'rejected';
  applied_by?: string | null;
  notes?: string | null;
  created_at: string;
  patient?: Patient;
  scheme?: Scheme;
};

export type HealthEducation = {
  id: string;
  title: string;
  category?: string | null;
  summary?: string | null;
  content?: string | null;
  video_url?: string | null;
  language: string;
  created_at: string;
};

export type Feedback = {
  id: string;
  user_id?: string | null;
  subject?: string | null;
  message: string;
  rating?: number | null;
  created_at: string;
};
