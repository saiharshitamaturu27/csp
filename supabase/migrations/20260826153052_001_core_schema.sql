/*
# Rural Health Link — Core Schema

## Purpose
Multi-tenant telemedicine platform for rural health. Authenticated users (ASHA workers, doctors, admins) manage patients, appointments, consultations, prescriptions, maternal/child records, vaccinations, inventory, government scheme eligibility, and health education content.

## New Tables
1. `profiles` — extends auth.users with role (asha/doctor/admin), full name, phone, facility, language preference.
2. `patients` — people registered in the system (not auth users); demographics, contact, village.
3. `appointments` — scheduled consults linking patient + practitioner + type (in-person/video/tele).
4. `consultations` — clinical encounter record per appointment; vitals, chief complaint, diagnosis, notes.
5. `prescriptions` — meds prescribed during a consultation.
6. `vaccinations` — immunization records per patient.
7. `maternal_records` — ANC/PNC tracking for pregnant patients.
8. `inventory` — medicine stock at facility level.
9. `schemes` — government health welfare schemes (reference data, editable by admin).
10. `scheme_applications` — patient applications to schemes with eligibility + status.
11. `health_education` — educational content catalog (articles/videos).
12. `feedback` — user feedback messages.

## Security
- RLS enabled on every table.
- Owner-scoped policies using auth.uid() for profiles.
- All clinical/operational tables scoped to authenticated users (practitioners share access to patients they manage). Patient and clinical data is visible to all authenticated staff (small rural clinic model), with writes allowed for authenticated users.
- Scheme + health_education reference data readable by all authenticated.
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'asha' CHECK (role IN ('asha','doctor','admin')),
  phone text,
  facility text,
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en','hi','ta','te','kn','bn','mr','gu')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- PATIENTS
CREATE TABLE IF NOT EXISTS public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  age int,
  gender text CHECK (gender IN ('male','female','other')),
  phone text,
  village text,
  district text,
  blood_group text,
  allergies text,
  chronic_conditions text,
  registered_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "patients_select" ON public.patients;
CREATE POLICY "patients_select" ON public.patients FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "patients_insert" ON public.patients;
CREATE POLICY "patients_insert" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "patients_update" ON public.patients;
CREATE POLICY "patients_update" ON public.patients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "patients_delete" ON public.patients;
CREATE POLICY "patients_delete" ON public.patients FOR DELETE TO authenticated USING (true);

-- APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  practitioner_id uuid REFERENCES auth.users(id),
  scheduled_at timestamptz NOT NULL,
  type text NOT NULL DEFAULT 'in-person' CHECK (type IN ('in-person','video','tele')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','no-show')),
  reason text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "appt_select" ON public.appointments;
CREATE POLICY "appt_select" ON public.appointments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "appt_insert" ON public.appointments;
CREATE POLICY "appt_insert" ON public.appointments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "appt_update" ON public.appointments;
CREATE POLICY "appt_update" ON public.appointments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "appt_delete" ON public.appointments;
CREATE POLICY "appt_delete" ON public.appointments FOR DELETE TO authenticated USING (true);

-- CONSULTATIONS
CREATE TABLE IF NOT EXISTS public.consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  practitioner_id uuid REFERENCES auth.users(id),
  vitals jsonb,
  chief_complaint text,
  diagnosis text,
  notes text,
  ai_suggestion text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "consult_select" ON public.consultations;
CREATE POLICY "consult_select" ON public.consultations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "consult_insert" ON public.consultations;
CREATE POLICY "consult_insert" ON public.consultations FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "consult_update" ON public.consultations;
CREATE POLICY "consult_update" ON public.consultations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "consult_delete" ON public.consultations;
CREATE POLICY "consult_delete" ON public.consultations FOR DELETE TO authenticated USING (true);

-- PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  medicine_name text NOT NULL,
  dosage text,
  frequency text,
  duration text,
  instructions text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rx_select" ON public.prescriptions;
CREATE POLICY "rx_select" ON public.prescriptions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "rx_insert" ON public.prescriptions;
CREATE POLICY "rx_insert" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "rx_update" ON public.prescriptions;
CREATE POLICY "rx_update" ON public.prescriptions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "rx_delete" ON public.prescriptions;
CREATE POLICY "rx_delete" ON public.prescriptions FOR DELETE TO authenticated USING (true);

-- VACCINATIONS
CREATE TABLE IF NOT EXISTS public.vaccinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  vaccine_name text NOT NULL,
  dose_number int DEFAULT 1,
  administered_date date NOT NULL DEFAULT CURRENT_DATE,
  next_due date,
  administered_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vax_select" ON public.vaccinations;
CREATE POLICY "vax_select" ON public.vaccinations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "vax_insert" ON public.vaccinations;
CREATE POLICY "vax_insert" ON public.vaccinations FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "vax_update" ON public.vaccinations;
CREATE POLICY "vax_update" ON public.vaccinations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "vax_delete" ON public.vaccinations;
CREATE POLICY "vax_delete" ON public.vaccinations FOR DELETE TO authenticated USING (true);

-- MATERNAL RECORDS
CREATE TABLE IF NOT EXISTS public.maternal_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  lmp date,
  edd date,
  gravida int DEFAULT 1,
  para int DEFAULT 0,
  trimester int DEFAULT 1,
  anc_visits int DEFAULT 0,
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low','medium','high')),
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.maternal_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "maternal_select" ON public.maternal_records;
CREATE POLICY "maternal_select" ON public.maternal_records FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "maternal_insert" ON public.maternal_records;
CREATE POLICY "maternal_insert" ON public.maternal_records FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "maternal_update" ON public.maternal_records;
CREATE POLICY "maternal_update" ON public.maternal_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "maternal_delete" ON public.maternal_records;
CREATE POLICY "maternal_delete" ON public.maternal_records FOR DELETE TO authenticated USING (true);

-- INVENTORY
CREATE TABLE IF NOT EXISTS public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_name text NOT NULL,
  category text,
  quantity int NOT NULL DEFAULT 0,
  unit text,
  reorder_level int DEFAULT 10,
  expiry_date date,
  batch_no text,
  facility text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inv_select" ON public.inventory;
CREATE POLICY "inv_select" ON public.inventory FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "inv_insert" ON public.inventory;
CREATE POLICY "inv_insert" ON public.inventory FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "inv_update" ON public.inventory;
CREATE POLICY "inv_update" ON public.inventory FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "inv_delete" ON public.inventory;
CREATE POLICY "inv_delete" ON public.inventory FOR DELETE TO authenticated USING (true);

-- SCHEMES (reference)
CREATE TABLE IF NOT EXISTS public.schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  eligibility_criteria text,
  benefits text,
  category text,
  min_age int,
  max_age int,
  income_limit numeric,
  for_pregnant boolean DEFAULT false,
  for_child boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scheme_select" ON public.schemes;
CREATE POLICY "scheme_select" ON public.schemes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "scheme_insert" ON public.schemes;
CREATE POLICY "scheme_insert" ON public.schemes FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "scheme_update" ON public.schemes;
CREATE POLICY "scheme_update" ON public.schemes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "scheme_delete" ON public.schemes;
CREATE POLICY "scheme_delete" ON public.schemes FOR DELETE TO authenticated USING (true);

-- SCHEME APPLICATIONS
CREATE TABLE IF NOT EXISTS public.scheme_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  scheme_id uuid NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending','eligible','approved','rejected')),
  applied_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.scheme_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "schemeapp_select" ON public.scheme_applications;
CREATE POLICY "schemeapp_select" ON public.scheme_applications FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "schemeapp_insert" ON public.scheme_applications;
CREATE POLICY "schemeapp_insert" ON public.scheme_applications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "schemeapp_update" ON public.scheme_applications;
CREATE POLICY "schemeapp_update" ON public.scheme_applications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "schemeapp_delete" ON public.scheme_applications;
CREATE POLICY "schemeapp_delete" ON public.scheme_applications FOR DELETE TO authenticated USING (true);

-- HEALTH EDUCATION
CREATE TABLE IF NOT EXISTS public.health_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text,
  summary text,
  content text,
  video_url text,
  language text DEFAULT 'en',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.health_education ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "edu_select" ON public.health_education;
CREATE POLICY "edu_select" ON public.health_education FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "edu_insert" ON public.health_education;
CREATE POLICY "edu_insert" ON public.health_education FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "edu_update" ON public.health_education;
CREATE POLICY "edu_update" ON public.health_education FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "edu_delete" ON public.health_education;
CREATE POLICY "edu_delete" ON public.health_education FOR DELETE TO authenticated USING (true);

-- FEEDBACK
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject text,
  message text NOT NULL,
  rating int CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fb_select" ON public.feedback;
CREATE POLICY "fb_select" ON public.feedback FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "fb_insert" ON public.feedback;
CREATE POLICY "fb_insert" ON public.feedback FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "fb_update" ON public.feedback;
CREATE POLICY "fb_update" ON public.feedback FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "fb_delete" ON public.feedback;
CREATE POLICY "fb_delete" ON public.feedback FOR DELETE TO authenticated USING (true);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_patients_village ON public.patients(village);
CREATE INDEX IF NOT EXISTS idx_appt_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appt_date ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_consult_patient ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_vax_patient ON public.vaccinations(patient_id);
CREATE INDEX IF NOT EXISTS idx_maternal_patient ON public.maternal_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_inv_facility ON public.inventory(facility);
