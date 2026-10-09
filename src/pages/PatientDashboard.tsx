import { useEffect, useState } from 'react';
import { CalendarDays, Stethoscope, Syringe, HeartPulse, Landmark, FileText, Video } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/i18n';
import { supabase, type Appointment, type Consultation, type Vaccination, type MaternalRecord, type SchemeApplication } from '../lib/supabase';
import { PageHeader, StatCard, Badge, EmptyState } from '../components/ui';
import { format, parseISO, isToday, isFuture } from 'date-fns';
import { Link } from 'react-router-dom';

export default function PatientDashboard() {
  const { lang, profile } = useAuth();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingAppts, setUpcomingAppts] = useState<Appointment[]>([]);
  const [recentConsults, setRecentConsults] = useState<Consultation[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [maternalRecords, setMaternalRecords] = useState<MaternalRecord[]>([]);
  const [schemeApps, setSchemeApps] = useState<SchemeApplication[]>([]);
  const [stats, setStats] = useState({ appts: 0, consults: 0, vaccines: 0, schemes: 0 });

  useEffect(() => {
    (async () => {
      if (!profile) return;
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('registered_by', profile.id)
        .maybeSingle();

      const pid = patient?.id || null;
      setPatientId(pid);

      if (!pid) { setLoading(false); return; }

      const [appts, consults, vaccines, maternal, schemes] = await Promise.all([
        supabase.from('appointments').select('*, patient:patients(*)').eq('patient_id', pid).order('scheduled_at', { ascending: false }).limit(10),
        supabase.from('consultations').select('*, patient:patients(*)').eq('patient_id', pid).order('created_at', { ascending: false }).limit(5),
        supabase.from('vaccinations').select('*, patient:patients(*)').eq('patient_id', pid).order('administered_date', { ascending: false }).limit(5),
        supabase.from('maternal_records').select('*, patient:patients(*)').eq('patient_id', pid).order('created_at', { ascending: false }).limit(5),
        supabase.from('scheme_applications').select('*, scheme:schemes(*)').eq('patient_id', pid).order('created_at', { ascending: false }).limit(5),
      ]);

      const apptData = (appts.data || []) as Appointment[];
      const consultData = (consults.data || []) as Consultation[];
      const vaccineData = (vaccines.data || []) as Vaccination[];
      const maternalData = (maternal.data || []) as MaternalRecord[];
      const schemeData = (schemes.data || []) as SchemeApplication[];

      setUpcomingAppts(apptData.filter((a) => isFuture(parseISO(a.scheduled_at)) || isToday(parseISO(a.scheduled_at))));
      setRecentConsults(consultData);
      setVaccinations(vaccineData);
      setMaternalRecords(maternalData);
      setSchemeApps(schemeData);
      setStats({ appts: apptData.length, consults: consultData.length, vaccines: vaccineData.length, schemes: schemeData.length });
      setLoading(false);
    })();
  }, [profile]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: '3px' }} /></div>;
  }

  if (!patientId) {
    return (
      <div>
        <PageHeader title={`${t(lang, 'welcome')}, ${profile?.full_name?.split(' ')[0] || ''}`} subtitle={format(new Date(), 'EEEE, d MMMM yyyy')} />
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-600 text-sm mb-2">Your profile is not yet linked to a patient record.</p>
          <p className="text-gray-400 text-xs">Please contact your health center to be registered in the system.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={`${t(lang, 'welcome')}, ${profile?.full_name?.split(' ')[0] || ''}`} subtitle={format(new Date(), 'EEEE, d MMMM yyyy')} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="animate-fade-in-up"><StatCard icon={CalendarDays} label={t(lang, 'upcomingVisits')} value={upcomingAppts.length} color="secondary" /></div>
        <div className="animate-fade-in-up delay-75"><StatCard icon={Stethoscope} label={t(lang, 'myConsultations')} value={stats.consults} color="primary" /></div>
        <div className="animate-fade-in-up delay-150"><StatCard icon={Syringe} label={t(lang, 'myVaccinations')} value={stats.vaccines} color="accent" /></div>
        <div className="animate-fade-in-up delay-200"><StatCard icon={Landmark} label={t(lang, 'mySchemes')} value={stats.schemes} color="warning" /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming appointments */}
        <div className="card card-hover p-5 animate-fade-in-up delay-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{t(lang, 'upcomingVisits')}</h2>
            <Link to="/appointments" className="text-sm text-primary-600 hover:underline">{t(lang, 'viewAll')}</Link>
          </div>
          {upcomingAppts.length === 0 ? (
            <EmptyState icon={CalendarDays} message={t(lang, 'noAppointments')} />
          ) : (
            <div className="space-y-2">
              {upcomingAppts.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-secondary-50 text-secondary-600 flex items-center justify-center shrink-0">
                    {a.type === 'video' ? <Video className="w-5 h-5" /> : <CalendarDays className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{format(parseISO(a.scheduled_at), 'd MMM, h:mm a')}</p>
                    <p className="text-xs text-gray-500">{t(lang, a.type)}{a.reason ? ' · ' + a.reason : ''}</p>
                  </div>
                  <Badge status={a.status}>{t(lang, a.status)}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent consultations */}
        <div className="card card-hover p-5 animate-fade-in-up delay-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{t(lang, 'myConsultations')}</h2>
            <Link to="/consultations" className="text-sm text-primary-600 hover:underline">{t(lang, 'viewAll')}</Link>
          </div>
          {recentConsults.length === 0 ? (
            <EmptyState icon={Stethoscope} message={t(lang, 'noConsultations')} />
          ) : (
            <div className="space-y-2">
              {recentConsults.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.diagnosis || c.chief_complaint || 'Consultation'}</p>
                    <p className="text-xs text-gray-500">{format(parseISO(c.created_at), 'd MMM yyyy')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vaccinations */}
        <div className="card card-hover p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{t(lang, 'myVaccinations')}</h2>
            <Link to="/vaccinations" className="text-sm text-primary-600 hover:underline">{t(lang, 'viewAll')}</Link>
          </div>
          {vaccinations.length === 0 ? (
            <EmptyState icon={Syringe} message={t(lang, 'noVaccinations')} />
          ) : (
            <div className="space-y-2">
              {vaccinations.slice(0, 4).map((v) => (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                  <div className="w-10 h-10 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center shrink-0">
                    <Syringe className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{v.vaccine_name} (Dose {v.dose_number})</p>
                    <p className="text-xs text-gray-500">{format(parseISO(v.administered_date), 'd MMM yyyy')}</p>
                  </div>
                  {v.next_due && <span className="text-xs text-warning-600 shrink-0">Next: {format(parseISO(v.next_due), 'd MMM')}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheme applications */}
        <div className="card card-hover p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{t(lang, 'mySchemes')}</h2>
            <Link to="/schemes" className="text-sm text-primary-600 hover:underline">{t(lang, 'viewAll')}</Link>
          </div>
          {schemeApps.length === 0 ? (
            <EmptyState icon={Landmark} message={t(lang, 'noData')} />
          ) : (
            <div className="space-y-2">
              {schemeApps.slice(0, 4).map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                  <div className="w-10 h-10 rounded-lg bg-warning-50 text-warning-600 flex items-center justify-center shrink-0">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.scheme?.name || 'Scheme'}</p>
                    <p className="text-xs text-gray-500">{format(parseISO(s.created_at), 'd MMM yyyy')}</p>
                  </div>
                  <Badge status={s.status}>{t(lang, s.status)}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Maternal care (if any) */}
      {maternalRecords.length > 0 && (
        <div className="card card-hover p-5 mt-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{t(lang, 'myMaternalRecords')}</h2>
            <Link to="/maternal" className="text-sm text-primary-600 hover:underline">{t(lang, 'viewAll')}</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {maternalRecords.slice(0, 3).map((m) => (
              <div key={m.id} className="p-4 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <HeartPulse className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-medium text-gray-900">Trimester {m.trimester}</span>
                </div>
                <p className="text-xs text-gray-500">ANC Visits: {m.anc_visits}</p>
                <p className="text-xs text-gray-500">Risk: <Badge status={m.risk_level}>{t(lang, m.risk_level)}</Badge></p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
