# Rural Health Link — Complete Code Reference & API Guide

This document contains the complete source code for the Rural Health Link telemedicine platform, organized by file. The app is built with **React + TypeScript + Tailwind CSS** (frontend) and **Supabase** (backend: PostgreSQL database + Auth + REST API).

---

## TABLE OF CONTENTS

1. [Project Structure](#1-project-structure)
2. [Configuration Files](#2-configuration-files)
   - package.json
   - vite.config.ts
   - tailwind.config.js
   - postcss.config.js
   - index.html
3. [Database Schema (SQL Migration)](#3-database-schema-sql-migration)
4. [Database Seed Data](#4-database-seed-data)
5. [Supabase Client & TypeScript Types](#5-supabase-client--typescript-types)
6. [Authentication Context](#6-authentication-context)
7. [Internationalization (i18n)](#7-internationalization-i18n)
8. [Shared UI Components](#8-shared-ui-components)
9. [App Layout (Sidebar + Topbar)](#9-app-layout-sidebar--topbar)
10. [Main Entry & Router](#10-main-entry--router)
11. [Auth Page (Sign In / Sign Up)](#11-auth-page-sign-in--sign-up)
12. [Dashboard](#12-dashboard)
13. [Patient Management](#13-patient-management)
14. [Appointment Management](#14-appointment-management)
15. [Consultation & Prescription + AI Decision Support](#15-consultation--prescription--ai-decision-support)
16. [Maternal & Child Healthcare](#16-maternal--child-healthcare)
17. [Vaccination & Follow-up](#17-vaccination--follow-up)
18. [Medicine & Inventory Management](#18-medicine--inventory-management)
19. [Government Scheme Eligibility](#19-government-scheme-eligibility)
20. [Health Education](#20-health-education)
21. [Reports & Analytics](#21-reports--analytics)
22. [Feedback](#22-feedback)
23. [Supabase API Reference (CRUD Endpoints)](#23-supabase-api-reference-crud-endpoints)

---

## 1. PROJECT STRUCTURE

```
project/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .env                          # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── supabase/
│   └── migrations/
│       └── 001_core_schema.sql   # Database schema + RLS policies
└── src/
    ├── main.tsx                  # App entry point
    ├── App.tsx                   # Router (auth gate + protected routes)
    ├── index.css                 # Tailwind + component classes
    ├── lib/
    │   ├── supabase.ts           # Supabase client + all TypeScript types
    │   ├── AuthContext.tsx       # Auth provider (sign in/up/out, session)
    │   └── i18n.ts               # Multi-language translations (8 languages)
    ├── components/
    │   ├── AppLayout.tsx         # Sidebar nav + top bar + language switcher
    │   └── ui.tsx                # Reusable: PageHeader, StatCard, Modal, Badge, etc.
    └── pages/
        ├── AuthPage.tsx          # Sign in / sign up screen
        ├── Dashboard.tsx         # Stats + upcoming appts + stock alerts
        ├── Patients.tsx          # Patient CRUD + search
        ├── Appointments.tsx      # Appointment CRUD + video call UI
        ├── Consultations.tsx     # Consultation + vitals + AI support + prescriptions
        ├── MaternalCare.tsx      # ANC/PNC records + risk levels
        ├── Vaccinations.tsx      # Immunization records + due tracking
        ├── Inventory.tsx         # Medicine stock + low-stock/expiry alerts
        ├── Schemes.tsx           # Govt schemes + eligibility checker + applications
        ├── HealthEducation.tsx   # Health articles/videos catalog
        ├── Reports.tsx           # Charts (line, bar, pie) analytics
        └── FeedbackPage.tsx      # Feedback form + list
```

---

## 2. CONFIGURATION FILES

### package.json

```json
{
  "name": "rhlink",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.112.4",
    "clsx": "^2.1.1",
    "date-fns": "^4.4.0",
    "lucide-react": "^1.34.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-router-dom": "^7.18.2",
    "recharts": "^3.10.1"
  },
  "devDependencies": {
    "@types/node": "^24.13.3",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.4",
    "@vitejs/plugin-react": "^6.1.0",
    "autoprefixer": "^10.5.4",
    "oxlint": "^1.79.0",
    "postcss": "^8.5.26",
    "tailwindcss": "^3.4.19",
    "typescript": "~6.0.2",
    "vite": "^8.2.2"
  }
}
```

### vite.config.ts

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
})
```

### tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
          400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
          800: '#065f46', 900: '#064e3b',
        },
        secondary: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a',
        },
        accent: {
          50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
          400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
          800: '#9a3412', 900: '#7c2d12',
        },
        success: { 50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e', 600: '#16a34a', 700: '#15803d' },
        warning: { 50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
        error: { 50: '#fef2f2', 100: '#fee2e2', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
```

### postcss.config.js

```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

### index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/health.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <title>Rural Health Link — Telemedicine Assistant</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 3. DATABASE SCHEMA (SQL MIGRATION)

File: `supabase/migrations/001_core_schema.sql`

```sql
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
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
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
CREATE POLICY "patients_select" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "patients_insert" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "patients_update" ON public.patients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
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
CREATE POLICY "appt_select" ON public.appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "appt_insert" ON public.appointments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "appt_update" ON public.appointments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
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
CREATE POLICY "consult_select" ON public.consultations FOR SELECT TO authenticated USING (true);
CREATE POLICY "consult_insert" ON public.consultations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "consult_update" ON public.consultations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
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
CREATE POLICY "rx_select" ON public.prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "rx_insert" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "rx_update" ON public.prescriptions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
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
CREATE POLICY "vax_select" ON public.vaccinations FOR SELECT TO authenticated USING (true);
CREATE POLICY "vax_insert" ON public.vaccinations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vax_update" ON public.vaccinations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
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
CREATE POLICY "maternal_select" ON public.maternal_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "maternal_insert" ON public.maternal_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "maternal_update" ON public.maternal_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
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
CREATE POLICY "inv_select" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "inv_insert" ON public.inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "inv_update" ON public.inventory FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "inv_delete" ON public.inventory FOR DELETE TO authenticated USING (true);

-- SCHEMES (reference data)
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
CREATE POLICY "scheme_select" ON public.schemes FOR SELECT TO authenticated USING (true);
CREATE POLICY "scheme_insert" ON public.schemes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "scheme_update" ON public.schemes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
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
CREATE POLICY "schemeapp_select" ON public.scheme_applications FOR SELECT TO authenticated USING (true);
CREATE POLICY "schemeapp_insert" ON public.scheme_applications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "schemeapp_update" ON public.scheme_applications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
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
CREATE POLICY "edu_select" ON public.health_education FOR SELECT TO authenticated USING (true);
CREATE POLICY "edu_insert" ON public.health_education FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "edu_update" ON public.health_education FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
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
CREATE POLICY "fb_select" ON public.feedback FOR SELECT TO authenticated USING (true);
CREATE POLICY "fb_insert" ON public.feedback FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "fb_update" ON public.feedback FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "fb_delete" ON public.feedback FOR DELETE TO authenticated USING (true);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_patients_village ON public.patients(village);
CREATE INDEX IF NOT EXISTS idx_appt_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appt_date ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_consult_patient ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_vax_patient ON public.vaccinations(patient_id);
CREATE INDEX IF NOT EXISTS idx_maternal_patient ON public.maternal_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_inv_facility ON public.inventory(facility);
```

---

## 4. DATABASE SEED DATA

```sql
-- Government Schemes
INSERT INTO public.schemes (name, description, eligibility_criteria, benefits, category, min_age, max_age, income_limit, for_pregnant, for_child) VALUES
('Ayushman Bharat (PM-JAY)', 'National health protection scheme providing Rs 5 lakh health cover per family per year.', 'Families listed in SECC 2011 database; low-income households.', 'Up to Rs 5 lakh per family per year for secondary and tertiary care.', 'insurance', 0, 120, 0, true, true),
('Janani Suraksha Yojana (JSY)', 'Maternal benefit scheme to reduce maternal and neonatal mortality.', 'Pregnant women from BPL households; below age 19 at registration.', 'Cash assistance Rs 1400 (rural) / Rs 1000 (urban) for institutional delivery.', 'maternal', 18, 50, 0, true, false),
('Pradhan Mantri Matru Vandana Yojana (PMMVY)', 'Maternity benefit program for pregnant and lactating women.', 'First living child; pregnant women 19+; BPL criteria.', 'Rs 5000 in three installments for first child.', 'maternal', 19, 55, 0, true, false),
('Mission Indradhanush', 'Immunization drive for children and pregnant women.', 'Children 0-2 years and pregnant women who are partially or unvaccinated.', 'Free vaccines covering 12 vaccine-preventable diseases.', 'child', 0, 2, 0, true, true),
('Jan Aushadhi Scheme (PMBJP)', 'Affordable generic medicines through Jan Aushadhi Kendras.', 'Open to all; especially benefits low-income patients.', 'Generic medicines at 50-90% lower cost than branded equivalents.', 'medicine', 0, 120, 0, false, false),
('Rashtriya Bal Kalyan Yojana (RBK)', 'Child welfare scheme covering health, education and protection.', 'Children 0-18 from vulnerable families.', 'Financial assistance for child health and nutrition.', 'child', 0, 18, 0, false, true)
ON CONFLICT DO NOTHING;

-- Health Education
INSERT INTO public.health_education (title, category, summary, content, language) VALUES
('Handwashing and Hygiene', 'hygiene', 'Proper handwashing technique to prevent infections.', 'Wash hands with soap for 20 seconds. Clean between fingers, under nails, and wrists. Wash before eating, after using toilet, and before handling food.', 'en'),
('Exclusive Breastfeeding (0-6 months)', 'maternal', 'Why breast milk alone is best for the first 6 months.', 'Breastfeed within 1 hour of birth. No water, no other milk, no solids for first 6 months. Feed on demand, day and night.', 'en'),
('Recognizing Danger Signs in Pregnancy', 'maternal', 'When to seek emergency care during pregnancy.', 'Seek immediate care if you see: severe headache, blurred vision, swelling, bleeding, reduced fetal movement, or high fever.', 'en'),
('Child Immunization Schedule', 'child', 'Vaccination timeline from birth to 2 years.', 'BCG at birth, OPV-0 at birth, DPT-1/2/3 at 6/10/14 weeks, measles at 9 months. Follow up with booster doses.', 'en'),
('Oral Rehydration Solution (ORS)', 'emergency', 'How to prepare and use ORS for diarrhea.', 'Mix one ORS packet in 1 liter clean water. Give frequent small sips. Continue feeding. Seek care if dehydration worsens.', 'en'),
('Diabetes Management in Rural Settings', 'chronic', 'Lifestyle and monitoring tips for diabetes.', 'Eat balanced meals, reduce sugar and refined carbs, walk 30 minutes daily, check blood sugar regularly, take medicines on time.', 'en'),
('Malaria Prevention', 'public-health', 'Preventing mosquito-borne diseases.', 'Use mosquito nets, wear long sleeves, remove stagnant water, use repellents. Get tested if fever occurs within endemic areas.', 'en')
ON CONFLICT DO NOTHING;

-- Inventory
INSERT INTO public.inventory (medicine_name, category, quantity, unit, reorder_level, expiry_date, batch_no, facility) VALUES
('Paracetamol 500mg', 'analgesic', 500, 'tablets', 100, '2027-06-30', 'PCM2024A', 'PHC Rampur'),
('Amoxicillin 250mg', 'antibiotic', 120, 'capsules', 50, '2026-12-31', 'AMX2024B', 'PHC Rampur'),
('ORS Sachets', 'electrolyte', 300, 'sachets', 100, '2027-03-31', 'ORS2024C', 'PHC Rampur'),
('Iron Folic Acid Tablets', 'supplement', 800, 'tablets', 200, '2027-01-31', 'IFA2024D', 'PHC Rampur'),
('Metformin 500mg', 'antidiabetic', 60, 'tablets', 30, '2026-10-31', 'MET2024E', 'PHC Rampur'),
('Tetanus Toxoid Vaccine', 'vaccine', 45, 'vials', 20, '2026-08-31', 'TT2024F', 'PHC Rampur'),
('Insulin (Regular)', 'antidiabetic', 25, 'vials', 15, '2026-09-30', 'INS2024G', 'PHC Rampur'),
('Ranitidine 150mg', 'antacid', 200, 'tablets', 50, '2027-04-30', 'RAN2024H', 'PHC Rampur')
ON CONFLICT DO NOTHING;
```

---

## 5. SUPABASE CLIENT & TYPESCRIPT TYPES

File: `src/lib/supabase.ts`

```ts
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
```

---

## 6. AUTHENTICATION CONTEXT

File: `src/lib/AuthContext.tsx`

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, type Profile } from './supabase';
import type { Lang } from './i18n';

type AuthContextType = {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  lang: Lang;
  setLang: (l: Lang) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, meta: { full_name: string; role: string; phone?: string; facility?: string; language: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('rhl-lang') as Lang) || 'en');

  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem('rhl-lang', l); };

  const loadProfile = async (uid: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (error) { console.error('Profile load error:', error); return; }
    setProfile(data as Profile | null);
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' });
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else { setLoading(false); }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
          await loadProfile(session.user.id);
        } else { setUser(null); setProfile(null); }
      })();
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signUp = async (email: string, password: string, meta: { full_name: string; role: string; phone?: string; facility?: string; language: string }) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: meta } });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id, full_name: meta.full_name, role: meta.role,
        phone: meta.phone, facility: meta.facility, language: meta.language,
      });
    }
    return { error: null };
  };

  const signOut = async () => { await supabase.auth.signOut(); setUser(null); setProfile(null); };
  const refreshProfile = async () => { if (user) await loadProfile(user.id); };

  return (
    <AuthContext.Provider value={{ user, profile, loading, lang, setLang, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

---

## 7. INTERNATIONALIZATION (i18n)

File: `src/lib/i18n.ts`

```ts
export type Lang = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'bn' | 'mr' | 'gu';

export const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
];

type Dict = Record<string, string>;

const en: Dict = {
  appName: 'Rural Health Link', tagline: 'Telemedicine & Healthcare Assistant',
  signIn: 'Sign In', signUp: 'Sign Up', signOut: 'Sign Out',
  email: 'Email', password: 'Password', fullName: 'Full Name',
  phone: 'Phone Number', role: 'Role', facility: 'Health Facility', language: 'Language',
  asha: 'ASHA Worker', doctor: 'Doctor', admin: 'Administrator',
  dashboard: 'Dashboard', patients: 'Patients', appointments: 'Appointments',
  consultations: 'Consultations', prescriptions: 'Prescriptions',
  maternal: 'Maternal & Child Care', vaccinations: 'Vaccinations',
  inventory: 'Medicine Inventory', schemes: 'Govt. Schemes', education: 'Health Education',
  reports: 'Reports & Analytics', feedback: 'Feedback',
  welcome: 'Welcome back', totalPatients: 'Total Patients',
  todaysAppointments: "Today's Appointments", pendingFollowups: 'Pending Follow-ups',
  lowStock: 'Low Stock Alerts', registerPatient: 'Register Patient',
  searchPatients: 'Search patients by name, village...', name: 'Name', age: 'Age',
  gender: 'Gender', village: 'Village', district: 'District', bloodGroup: 'Blood Group',
  allergies: 'Allergies', chronicConditions: 'Chronic Conditions',
  save: 'Save', cancel: 'Cancel', scheduleAppointment: 'Schedule Appointment',
  consultationType: 'Consultation Type', inPerson: 'In-Person', video: 'Video Call', tele: 'Teleconsult',
  date: 'Date & Time', reason: 'Reason for Visit', status: 'Status',
  scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled', noShow: 'No Show',
  newConsultation: 'New Consultation', chiefComplaint: 'Chief Complaint', diagnosis: 'Diagnosis',
  notes: 'Clinical Notes', vitals: 'Vitals', bloodPressure: 'Blood Pressure',
  heartRate: 'Heart Rate', temperature: 'Temperature', weight: 'Weight',
  addPrescription: 'Add Prescription', medicine: 'Medicine', dosage: 'Dosage',
  frequency: 'Frequency', duration: 'Duration', instructions: 'Instructions',
  aiSuggestion: 'AI Decision Support', getAISuggestion: 'Get AI Suggestion',
  lmp: 'Last Menstrual Period', edd: 'Expected Due Date', gravida: 'Gravida', para: 'Para',
  trimester: 'Trimester', ancVisits: 'ANC Visits', riskLevel: 'Risk Level',
  low: 'Low', medium: 'Medium', high: 'High',
  vaccineName: 'Vaccine Name', doseNo: 'Dose Number', administeredDate: 'Administered Date',
  nextDue: 'Next Due', medicineName: 'Medicine Name', category: 'Category',
  quantity: 'Quantity', unit: 'Unit', reorderLevel: 'Reorder Level',
  expiryDate: 'Expiry Date', batchNo: 'Batch Number',
  checkEligibility: 'Check Eligibility', eligible: 'Eligible', notEligible: 'Not Eligible',
  apply: 'Apply', schemeName: 'Scheme Name', benefits: 'Benefits',
  eligibilityCriteria: 'Eligibility Criteria', healthTopics: 'Health Topics', readMore: 'Read More',
  sendFeedback: 'Send Feedback', subject: 'Subject', message: 'Message', rating: 'Rating',
  noData: 'No records found', loading: 'Loading...', error: 'Something went wrong',
  saveSuccess: 'Saved successfully', deleteConfirm: 'Are you sure you want to delete this record?',
  male: 'Male', female: 'Female', other: 'Other',
  recentPatients: 'Recently Registered Patients', upcomingAppointments: 'Upcoming Appointments',
  stockAlerts: 'Stock Alerts', patientDistribution: 'Patient Distribution by Village',
  appointmentTrend: 'Appointment Trend', vaccinationCoverage: 'Vaccination Coverage',
  maternalHealth: 'Maternal Health Tracking', viewAll: 'View All', actions: 'Actions',
  edit: 'Edit', delete: 'Delete', view: 'View', back: 'Back', register: 'Register',
  createAccount: 'Create your account', signInToContinue: 'Sign in to your account',
  alreadyHaveAccount: 'Already have an account?', dontHaveAccount: "Don't have an account?",
  noRecords: 'No records yet. Start by adding one.', clinicalRecords: 'Clinical Records',
  patientDetails: 'Patient Details', videoConsultation: 'Video Consultation',
  startVideoCall: 'Start Video Call', endCall: 'End Call', emergency: 'Emergency',
  publicHealth: 'Public Health', userManagement: 'User Management', offlineMode: 'Offline Mode',
  smartDevice: 'Smart Device', voiceSupport: 'Voice Support', securityPrivacy: 'Security & Privacy',
  governmentServices: 'Government Services', healthEducation: 'Health Education',
  userType: 'User Type', selectPatient: 'Select Patient', addNew: 'Add New',
  totalAppointments: 'Total Appointments', completedConsults: 'Completed Consultations',
  totalVaccinations: 'Total Vaccinations', pregnantWomen: 'Pregnant Women Tracked',
  expiringSoon: 'Expiring Soon', stockValue: 'Stock Value',
  patientsByGender: 'Patients by Gender', ageDistribution: 'Age Distribution',
  schemeApplications: 'Scheme Applications', pendingApplications: 'Pending Applications',
  approvedApplications: 'Approved Applications',
};

const hi: Dict = {
  ...en,
  appName: 'ग्रामीण स्वास्थ्य लिंक', tagline: 'टेलीमेडिसिन और स्वास्थ्य सहायक',
  signIn: 'साइन इन', signUp: 'साइन अप', signOut: 'साइन आउट',
  email: 'ईमेल', password: 'पासवर्ड', fullName: 'पूरा नाम', phone: 'फ़ोन नंबर',
  role: 'भूमिका', facility: 'स्वास्थ्य केंद्र', language: 'भाषा',
  asha: 'आशा कार्यकर्ता', doctor: 'डॉक्टर', admin: 'व्यवस्थापक',
  dashboard: 'डैशबोर्ड', patients: 'मरीज़', appointments: 'अपॉइंटमेंट',
  consultations: 'परामर्श', prescriptions: 'प्रिस्क्रिप्शन',
  maternal: 'मातृ एवं शिशु देखभाल', vaccinations: 'टीकाकरण', inventory: 'दवा भंडार',
  schemes: 'सरकारी योजनाएँ', education: 'स्वास्थ्य शिक्षा',
  reports: 'रिपोर्ट और विश्लेषण', feedback: 'प्रतिक्रिया',
  welcome: 'वापसी पर स्वागत है', totalPatients: 'कुल मरीज़',
  todaysAppointments: 'आज के अपॉइंटमेंट', pendingFollowups: 'लंबित फॉलो-अप',
  lowStock: 'कम स्टॉक अलर्ट', registerPatient: 'मरीज़ पंजीकृत करें',
  searchPatients: 'नाम, गाँव से मरीज़ खोजें...', name: 'नाम', age: 'आयु',
  gender: 'लिंग', village: 'गाँव', district: 'ज़िला',
  save: 'सहेजें', cancel: 'रद्द करें', scheduleAppointment: 'अपॉइंटमेंट तय करें',
  date: 'तारीख और समय', reason: 'देखने का कारण', status: 'स्थिति',
  scheduled: 'निर्धारित', completed: 'पूर्ण', cancelled: 'रद्द',
  newConsultation: 'नई परामर्श', chiefComplaint: 'मुख्य शिकायत', diagnosis: 'निदान',
  notes: 'नैदानिक नोट्स', vitals: 'महत्वपूर्ण संकेत',
  addPrescription: 'प्रिस्क्रिप्शन जोड़ें', medicine: 'दवा', dosage: 'खुराक',
  frequency: 'आवृत्ति', duration: 'अवधि', instructions: 'निर्देश',
  aiSuggestion: 'एआई निर्णय सहायता', getAISuggestion: 'एआई सुझाव प्राप्त करें',
  low: 'निम्न', medium: 'मध्यम', high: 'उच्च', vaccineName: 'टीका नाम',
  eligible: 'पात्र', notEligible: 'अपात्र', apply: 'आवेदन करें',
  checkEligibility: 'पात्रता जांचें', male: 'पुरुष', female: 'महिला', other: 'अन्य',
  saveSuccess: 'सफलतापूर्वक सहेजा गया', loading: 'लोड हो रहा है...', noData: 'कोई रिकॉर्ड नहीं मिला',
};

const dicts: Record<Lang, Dict> = { en, hi, ta: en, te: en, kn: en, bn: en, mr: en, gu: en };

export function t(lang: Lang, key: string): string {
  return dicts[lang]?.[key] ?? en[key] ?? key;
}
```

---

## 8. SHARED UI COMPONENTS

File: `src/components/ui.tsx`

```tsx
import { type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/i18n';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, color = 'primary', trend }: {
  icon: any; label: string; value: string | number; color?: string; trend?: string;
}) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    secondary: 'bg-secondary-50 text-secondary-600',
    accent: 'bg-accent-50 text-accent-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    error: 'bg-error-50 text-error-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && <p className="text-xs text-gray-400">{trend}</p>}
        </div>
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!open) return null;
  const sizeMap = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${sizeMap[size]} my-8`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <Icon className="w-12 h-12 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function Badge({ status, children }: { status: string; children: ReactNode }) {
  const map: Record<string, string> = {
    scheduled: 'bg-secondary-50 text-secondary-700', completed: 'bg-success-50 text-success-700',
    cancelled: 'bg-error-50 text-error-700', 'no-show': 'bg-warning-50 text-warning-700',
    low: 'bg-success-50 text-success-700', medium: 'bg-warning-50 text-warning-700',
    high: 'bg-error-50 text-error-700', pending: 'bg-warning-50 text-warning-700',
    eligible: 'bg-success-50 text-success-700', approved: 'bg-success-50 text-success-700',
    rejected: 'bg-error-50 text-error-700',
  };
  return <span className={`badge ${map[status] || 'bg-gray-100 text-gray-700'}`}>{children}</span>;
}

export function ConfirmToast({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  const { lang } = useAuth();
  return (
    <div className="fixed bottom-5 right-5 z-50 card p-4 shadow-lg max-w-sm">
      <p className="text-sm text-gray-700 mb-3">{message}</p>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="btn-secondary text-sm">{t(lang, 'cancel')}</button>
        <button onClick={onConfirm} className="btn-danger text-sm">{t(lang, 'delete')}</button>
      </div>
    </div>
  );
}
```

---

## 9. APP LAYOUT (SIDEBAR + TOPBAR)

File: `src/components/AppLayout.tsx`

```tsx
import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarDays, Stethoscope, HeartPulse,
  Syringe, Pill, Landmark, BookOpen, BarChart3, MessageSquare,
  LogOut, Menu, X, Globe, Activity,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t, LANGUAGES, type Lang } from '../lib/i18n';

const navItems = [
  { to: '/', key: 'dashboard', icon: LayoutDashboard },
  { to: '/patients', key: 'patients', icon: Users },
  { to: '/appointments', key: 'appointments', icon: CalendarDays },
  { to: '/consultations', key: 'consultations', icon: Stethoscope },
  { to: '/maternal', key: 'maternal', icon: HeartPulse },
  { to: '/vaccinations', key: 'vaccinations', icon: Syringe },
  { to: '/inventory', key: 'inventory', icon: Pill },
  { to: '/schemes', key: 'schemes', icon: Landmark },
  { to: '/education', key: 'education', icon: BookOpen },
  { to: '/reports', key: 'reports', icon: BarChart3 },
  { to: '/feedback', key: 'feedback', icon: MessageSquare },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { profile, signOut, lang, setLang } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const handleSignOut = async () => { await signOut(); navigate('/auth'); };
  const roleLabel = profile ? t(lang, profile.role) : '';
  const currentLang = LANGUAGES.find((l) => l.code === lang);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-200 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-gray-900 leading-tight truncate">{t(lang, 'appName')}</h1>
            <p className="text-[10px] text-gray-500 truncate">{t(lang, 'tagline')}</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="truncate">{t(lang, item.key)}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-gray-200 p-3 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold shrink-0">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{roleLabel}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="btn-ghost w-full mt-2 justify-start text-sm">
            <LogOut className="w-4 h-4" />{t(lang, 'signOut')}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-base font-semibold text-gray-900 hidden sm:block">{t(lang, 'welcome')}, {profile?.full_name?.split(' ')[0]}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setLangOpen((v) => !v)} className="btn-ghost text-sm px-3">
                <Globe className="w-4 h-4" /><span className="hidden sm:inline">{currentLang?.native}</span>
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg border border-gray-200 shadow-lg z-40 py-1 max-h-72 overflow-y-auto">
                    {LANGUAGES.map((l) => (
                      <button key={l.code} onClick={() => { setLang(l.code as Lang); setLangOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${lang === l.code ? 'text-primary-700 font-medium bg-primary-50' : 'text-gray-700'}`}>
                        {l.native} <span className="text-gray-400 text-xs">({l.label})</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
```

---

## 10. MAIN ENTRY & ROUTER

File: `src/main.tsx`

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './lib/AuthContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
```

File: `src/App.tsx`

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/AuthContext';
import AuthPage from './pages/AuthPage';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Consultations from './pages/Consultations';
import MaternalCare from './pages/MaternalCare';
import Vaccinations from './pages/Vaccinations';
import Inventory from './pages/Inventory';
import Schemes from './pages/Schemes';
import HealthEducation from './pages/HealthEducation';
import Reports from './pages/Reports';
import FeedbackPage from './pages/FeedbackPage';

function ProtectedRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/consultations" element={<Consultations />} />
        <Route path="/maternal" element={<MaternalCare />} />
        <Route path="/vaccinations" element={<Vaccinations />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/education" element={<HealthEducation />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: '3px' }} />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/*" element={user ? <ProtectedRoutes /> : <Navigate to="/auth" replace />} />
    </Routes>
  );
}
```

File: `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * { @apply border-gray-200; }
  body { @apply bg-gray-50 text-gray-900 antialiased; font-feature-settings: 'cv11', 'ss01'; }
}

@layer components {
  .btn { @apply inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed; }
  .btn-primary { @apply btn bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm; }
  .btn-secondary { @apply btn bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-400; }
  .btn-danger { @apply btn bg-error-600 text-white hover:bg-error-700 focus:ring-error-500; }
  .btn-ghost { @apply btn text-gray-600 hover:bg-gray-100 focus:ring-gray-400; }
  .input { @apply w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all; }
  .label { @apply block text-sm font-medium text-gray-700 mb-1.5; }
  .card { @apply bg-white rounded-xl border border-gray-200 shadow-sm; }
  .badge { @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium; }
  .stat-card { @apply card p-5 flex flex-col gap-1; }
}
```

---

## 11. AUTH PAGE (SIGN IN / SIGN UP)

File: `src/pages/AuthPage.tsx`

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, User, Phone, Building2, UserCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t, LANGUAGES, type Lang } from '../lib/i18n';

export default function AuthPage() {
  const { signIn, signUp, lang, setLang } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('asha');
  const [phone, setPhone] = useState('');
  const [facility, setFacility] = useState('');
  const [language, setLanguage] = useState(lang);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw new Error(error);
        navigate('/');
      } else {
        const { error } = await signUp(email, password, { full_name: fullName, role, phone, facility, language });
        if (error) throw new Error(error);
        navigate('/');
      }
    } catch (err: any) { setError(err.message || 'Authentication failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="relative flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center"><Activity className="w-6 h-6" /></div>
            <div><h1 className="text-xl font-bold">{t(lang, 'appName')}</h1><p className="text-sm text-primary-100">{t(lang, 'tagline')}</p></div>
          </div>
          <div className="space-y-6 max-w-md">
            <h2 className="text-3xl font-bold leading-tight">Healthcare for every village, powered by technology.</h2>
            <p className="text-primary-100 text-base leading-relaxed">Connecting ASHA workers, doctors, and patients across rural India with telemedicine, AI-assisted diagnosis, maternal care tracking, and government scheme access.</p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              {[{label:'Patients Managed',value:'2,400+'},{label:'Villages Connected',value:'180'},{label:'Consultations',value:'15,000+'},{label:'Vaccinations',value:'8,500+'}].map((s) => (
                <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-4"><p className="text-2xl font-bold">{s.value}</p><p className="text-sm text-primary-100">{s.label}</p></div>
              ))}
            </div>
          </div>
          <p className="text-sm text-primary-200">Trusted by rural health workers across India</p>
        </div>
      </div>
      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center"><Activity className="w-5 h-5 text-white" /></div>
            <div><h1 className="text-lg font-bold text-gray-900">{t(lang, 'appName')}</h1><p className="text-xs text-gray-500">{t(lang, 'tagline')}</p></div>
          </div>
          <div className="card p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{mode === 'signin' ? t(lang, 'signInToContinue') : t(lang, 'createAccount')}</h2>
              <p className="text-sm text-gray-500 mt-1">{mode === 'signin' ? t(lang, 'signIn') : t(lang, 'signUp')} to continue</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div><label className="label">{t(lang, 'fullName')}</label>
                  <div className="relative"><User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input className="input pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Dr. Anjali Sharma" /></div>
                </div>
              )}
              <div><label className="label">{t(lang, 'email')}</label>
                <div className="relative"><Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="email" className="input pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@health.gov.in" /></div>
              </div>
              <div><label className="label">{t(lang, 'password')}</label>
                <div className="relative"><Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="password" className="input pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" /></div>
              </div>
              {mode === 'signup' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">{t(lang, 'role')}</label>
                      <div className="relative"><UserCircle className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                        <select className="input pl-10" value={role} onChange={(e) => setRole(e.target.value)}>
                          <option value="asha">{t(lang, 'asha')}</option><option value="doctor">{t(lang, 'doctor')}</option><option value="admin">{t(lang, 'admin')}</option>
                        </select>
                      </div>
                    </div>
                    <div><label className="label">{t(lang, 'language')}</label>
                      <select className="input" value={language} onChange={(e) => { setLanguage(e.target.value as Lang); setLang(e.target.value as Lang); }}>
                        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">{t(lang, 'phone')}</label>
                      <div className="relative"><Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input className="input pl-10" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" /></div>
                    </div>
                    <div><label className="label">{t(lang, 'facility')}</label>
                      <div className="relative"><Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input className="input pl-10" value={facility} onChange={(e) => setFacility(e.target.value)} placeholder="PHC Rampur" /></div>
                    </div>
                  </div>
                </>
              )}
              {error && <div className="bg-error-50 border border-error-200 text-error-700 text-sm rounded-lg px-3.5 py-2.5">{error}</div>}
              <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? t(lang, 'loading') : mode === 'signin' ? t(lang, 'signIn') : t(lang, 'signUp')}</button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-5">
              {mode === 'signin' ? (<>{t(lang, 'dontHaveAccount')} <button onClick={() => { setMode('signup'); setError(null); }} className="text-primary-600 font-medium hover:underline">{t(lang, 'signUp')}</button></>)
              : (<>{t(lang, 'alreadyHaveAccount')} <button onClick={() => { setMode('signin'); setError(null); }} className="text-primary-600 font-medium hover:underline">{t(lang, 'signIn')}</button></>)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 23. SUPABASE API REFERENCE (CRUD ENDPOINTS)

All data operations use the Supabase JS client (`supabase.from('table')...`). Below is a complete reference of every API call used in the app, grouped by table.

### Authentication API

| Operation | Code |
|-----------|------|
| **Sign Up** | `supabase.auth.signUp({ email, password, options: { data: { full_name, role, phone, facility, language } } })` |
| **Sign In** | `supabase.auth.signInWithPassword({ email, password })` |
| **Sign Out** | `supabase.auth.signOut()` |
| **Get Session** | `supabase.auth.getSession()` |
| **Listen Auth Changes** | `supabase.auth.onAuthStateChange((event, session) => {...})` |

### profiles

| Operation | Code |
|-----------|------|
| **Read own profile** | `supabase.from('profiles').select('*').eq('id', uid).maybeSingle()` |
| **Insert profile** | `supabase.from('profiles').insert({ id, full_name, role, phone, facility, language })` |

### patients

| Operation | Code |
|-----------|------|
| **List (with search)** | `supabase.from('patients').select('*').order('created_at', { ascending: false }).or('full_name.ilike.%search%,village.ilike.%search%,phone.ilike.%search%').limit(100)` |
| **Count** | `supabase.from('patients').select('*', { count: 'exact', head: true })` |
| **Insert** | `supabase.from('patients').insert({ full_name, age, gender, phone, village, district, blood_group, allergies, chronic_conditions, registered_by })` |
| **Update** | `supabase.from('patients').update({ ...payload }).eq('id', id)` |
| **Delete** | `supabase.from('patients').delete().eq('id', id)` |

### appointments

| Operation | Code |
|-----------|------|
| **List (with patient join)** | `supabase.from('appointments').select('*, patient:patients(*)').order('scheduled_at', { ascending: false }).limit(100)` |
| **Filter by status** | `.eq('status', 'scheduled')` |
| **Insert** | `supabase.from('appointments').insert({ patient_id, scheduled_at, type, reason, status, practitioner_id })` |
| **Update** | `supabase.from('appointments').update({ ...payload }).eq('id', id)` |
| **Delete** | `supabase.from('appointments').delete().eq('id', id)` |

### consultations

| Operation | Code |
|-----------|------|
| **List (with patient join)** | `supabase.from('consultations').select('*, patient:patients(*)').order('created_at', { ascending: false }).limit(50)` |
| **Insert (returns created row)** | `supabase.from('consultations').insert({ patient_id, chief_complaint, diagnosis, notes, vitals, practitioner_id }).select().single()` |
| **Update** | `supabase.from('consultations').update({ ...payload }).eq('id', id)` |
| **Delete** | `supabase.from('consultations').delete().eq('id', id)` |

### prescriptions

| Operation | Code |
|-----------|------|
| **List by consultation** | `supabase.from('prescriptions').select('*').eq('consultation_id', consultId).order('created_at')` |
| **Bulk insert** | `supabase.from('prescriptions').insert([{ consultation_id, medicine_name, dosage, frequency, duration, instructions }, ...])` |
| **Update** | `supabase.from('prescriptions').update({ ...payload }).eq('id', id)` |
| **Delete** | `supabase.from('prescriptions').delete().eq('id', id)` |

### vaccinations

| Operation | Code |
|-----------|------|
| **List (with patient join)** | `supabase.from('vaccinations').select('*, patient:patients(*)').order('administered_date', { ascending: false }).limit(100)` |
| **Insert** | `supabase.from('vaccinations').insert({ patient_id, vaccine_name, dose_number, administered_date, next_due, administered_by, notes })` |
| **Update** | `supabase.from('vaccinations').update({ ...payload }).eq('id', id)` |
| **Delete** | `supabase.from('vaccinations').delete().eq('id', id)` |

### maternal_records

| Operation | Code |
|-----------|------|
| **List (with patient join)** | `supabase.from('maternal_records').select('*, patient:patients(*)').order('created_at', { ascending: false })` |
| **Insert** | `supabase.from('maternal_records').insert({ patient_id, lmp, edd, gravida, para, trimester, anc_visits, risk_level, notes })` |
| **Update** | `supabase.from('maternal_records').update({ ...payload }).eq('id', id)` |
| **Delete** | `supabase.from('maternal_records').delete().eq('id', id)` |

### inventory

| Operation | Code |
|-----------|------|
| **List** | `supabase.from('inventory').select('*').order('medicine_name')` |
| **Insert** | `supabase.from('inventory').insert({ medicine_name, category, quantity, unit, reorder_level, expiry_date, batch_no, facility })` |
| **Update** | `supabase.from('inventory').update({ ...payload }).eq('id', id)` |
| **Delete** | `supabase.from('inventory').delete().eq('id', id)` |

### schemes

| Operation | Code |
|-----------|------|
| **List** | `supabase.from('schemes').select('*').order('name')` |
| **Insert** | `supabase.from('schemes').insert({ name, description, eligibility_criteria, benefits, category, min_age, max_age, income_limit, for_pregnant, for_child })` |
| **Update** | `supabase.from('schemes').update({ ...payload }).eq('id', id)` |
| **Delete** | `supabase.from('schemes').delete().eq('id', id)` |

### scheme_applications

| Operation | Code |
|-----------|------|
| **List (with patient + scheme join)** | `supabase.from('scheme_applications').select('*, patient:patients(*), scheme:schemes(*)').order('created_at', { ascending: false })` |
| **Insert** | `supabase.from('scheme_applications').insert({ scheme_id, patient_id, status, applied_by })` |
| **Update status** | `supabase.from('scheme_applications').update({ status }).eq('id', id)` |
| **Delete** | `supabase.from('scheme_applications').delete().eq('id', id)` |

### health_education

| Operation | Code |
|-----------|------|
| **List (with category filter)** | `supabase.from('health_education').select('*').order('created_at', { ascending: false }).eq('category', filter)` |
| **Insert** | `supabase.from('health_education').insert({ title, category, summary, content, video_url, language })` |
| **Update** | `supabase.from('health_education').update({ ...payload }).eq('id', id)` |
| **Delete** | `supabase.from('health_education').delete().eq('id', id)` |

### feedback

| Operation | Code |
|-----------|------|
| **List** | `supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(50)` |
| **Insert** | `supabase.from('feedback').insert({ user_id, subject, message, rating })` |
| **Delete** | `supabase.from('feedback').delete().eq('id', id)` |

### REST API Endpoints (Supabase Auto-Generated)

Supabase automatically exposes a REST API for every table. The base URL is:
```
https://<your-project-id>.supabase.co/rest/v1/
```

All requests require these headers:
```
apikey: <your-anon-key>
Authorization: Bearer <user-jwt-token>
Content-Type: application/json
```

| Table | GET (List) | POST (Create) | PATCH (Update) | DELETE |
|-------|-----------|--------------|----------------|--------|
| profiles | `GET /rest/v1/profiles?id=eq.{uid}` | `POST /rest/v1/profiles` | `PATCH /rest/v1/profiles?id=eq.{id}` | — |
| patients | `GET /rest/v1/patients?order=created_at.desc` | `POST /rest/v1/patients` | `PATCH /rest/v1/patients?id=eq.{id}` | `DELETE /rest/v1/patients?id=eq.{id}` |
| appointments | `GET /rest/v1/appointments?select=*,patient:patients(*)&order=scheduled_at.desc` | `POST /rest/v1/appointments` | `PATCH /rest/v1/appointments?id=eq.{id}` | `DELETE /rest/v1/appointments?id=eq.{id}` |
| consultations | `GET /rest/v1/consultations?select=*,patient:patients(*)&order=created_at.desc` | `POST /rest/v1/consultations` | `PATCH /rest/v1/consultations?id=eq.{id}` | `DELETE /rest/v1/consultations?id=eq.{id}` |
| prescriptions | `GET /rest/v1/prescriptions?consultation_id=eq.{id}` | `POST /rest/v1/prescriptions` | `PATCH /rest/v1/prescriptions?id=eq.{id}` | `DELETE /rest/v1/prescriptions?id=eq.{id}` |
| vaccinations | `GET /rest/v1/vaccinations?select=*,patient:patients(*)&order=administered_date.desc` | `POST /rest/v1/vaccinations` | `PATCH /rest/v1/vaccinations?id=eq.{id}` | `DELETE /rest/v1/vaccinations?id=eq.{id}` |
| maternal_records | `GET /rest/v1/maternal_records?select=*,patient:patients(*)` | `POST /rest/v1/maternal_records` | `PATCH /rest/v1/maternal_records?id=eq.{id}` | `DELETE /rest/v1/maternal_records?id=eq.{id}` |
| inventory | `GET /rest/v1/inventory?order=medicine_name` | `POST /rest/v1/inventory` | `PATCH /rest/v1/inventory?id=eq.{id}` | `DELETE /rest/v1/inventory?id=eq.{id}` |
| schemes | `GET /rest/v1/schemes?order=name` | `POST /rest/v1/schemes` | `PATCH /rest/v1/schemes?id=eq.{id}` | `DELETE /rest/v1/schemes?id=eq.{id}` |
| scheme_applications | `GET /rest/v1/scheme_applications?select=*,patient:patients(*),scheme:schemes(*)` | `POST /rest/v1/scheme_applications` | `PATCH /rest/v1/scheme_applications?id=eq.{id}` | `DELETE /rest/v1/scheme_applications?id=eq.{id}` |
| health_education | `GET /rest/v1/health_education?order=created_at.desc` | `POST /rest/v1/health_education` | `PATCH /rest/v1/health_education?id=eq.{id}` | `DELETE /rest/v1/health_education?id=eq.{id}` |
| feedback | `GET /rest/v1/feedback?order=created_at.desc&limit=50` | `POST /rest/v1/feedback` | — | `DELETE /rest/v1/feedback?id=eq.{id}` |

### Common PostgREST Query Patterns Used

| Pattern | Example | Purpose |
|---------|---------|---------|
| **Select with join** | `select=*,patient:patients(*)` | Fetch appointment + its patient in one call |
| **Filter** | `?status=eq.scheduled` | Filter by exact match |
| **Search (ILIKE)** | `?or=(full_name.ilike.*search*,village.ilike.*search*)` | Text search across columns |
| **Order** | `?order=created_at.desc` | Sort results |
| **Limit** | `?limit=100` | Cap results |
| **Count** | `select=*` with `Prefer: count=exact` header | Get total count |
| **Filter by date** | `?scheduled_at=gte.2026-01-01` | Date range filters |

---

> **Note:** The page components for Dashboard, Patients, Appointments, Consultations (with AI Decision Support), MaternalCare, Vaccinations, Inventory, Schemes (with Eligibility Checker), HealthEducation, Reports (with charts), and FeedbackPage are all in the `src/pages/` directory. Their full source code is available in the project files. Each page follows the same pattern: load data from Supabase on mount, render in tables/cards, and provide modal forms for create/edit operations. The AI Decision Support in Consultations.tsx is a rule-based engine that analyzes vitals (BP, heart rate, temperature) and chief complaint text to generate clinical guidance suggestions.
