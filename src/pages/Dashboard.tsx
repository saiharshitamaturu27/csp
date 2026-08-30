import { useEffect, useState } from 'react';
import { Users, CalendarDays, Pill, Activity, AlertTriangle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/i18n';
import { supabase, type Patient, type Appointment, type InventoryItem } from '../lib/supabase';
import { PageHeader, StatCard, Badge, EmptyState } from '../components/ui';
import { format, isToday, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { lang, profile } = useAuth();
  const [stats, setStats] = useState({ patients: 0, apptsToday: 0, followups: 0, lowStock: 0 });
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [stockAlerts, setStockAlerts] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ count: patientCount }, { data: appts }, { data: inv }, { data: recent }] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*, patient:patients(*)').order('scheduled_at', { ascending: true }).limit(20),
        supabase.from('inventory').select('*').order('quantity', { ascending: true }),
        supabase.from('patients').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const todayAppts = (appts || []).filter((a) => isToday(parseISO(a.scheduled_at)) && a.status === 'scheduled');
      const followups = (appts || []).filter((a) => new Date(a.scheduled_at) > new Date() && a.status === 'scheduled');
      const lowStock = (inv || []).filter((i) => i.quantity <= i.reorder_level);
      setStats({
        patients: patientCount || 0,
        apptsToday: todayAppts.length,
        followups: followups.length,
        lowStock: lowStock.length,
      });
      setRecentPatients((recent || []) as Patient[]);
      setUpcoming((appts || []).filter((a) => a.status === 'scheduled').slice(0, 5) as Appointment[]);
      setStockAlerts(lowStock.slice(0, 4) as InventoryItem[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <PageHeader title={`${t(lang, 'welcome')}, ${profile?.full_name?.split(' ')[0] || ''}`} subtitle={format(new Date(), 'EEEE, d MMMM yyyy')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label={t(lang, 'totalPatients')} value={stats.patients} color="primary" />
        <StatCard icon={CalendarDays} label={t(lang, 'todaysAppointments')} value={stats.apptsToday} color="secondary" />
        <StatCard icon={Activity} label={t(lang, 'pendingFollowups')} value={stats.followups} color="accent" />
        <StatCard icon={AlertTriangle} label={t(lang, 'lowStock')} value={stats.lowStock} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming appointments */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{t(lang, 'upcomingAppointments')}</h2>
            <Link to="/appointments" className="text-sm text-primary-600 hover:underline">{t(lang, 'viewAll')}</Link>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400 py-6 text-center">{t(lang, 'loading')}</p>
          ) : upcoming.length === 0 ? (
            <EmptyState icon={CalendarDays} message={t(lang, 'noData')} />
          ) : (
            <div className="space-y-2">
              {upcoming.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-secondary-50 text-secondary-600 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.patient?.full_name}</p>
                    <p className="text-xs text-gray-500">{format(parseISO(a.scheduled_at), 'd MMM, h:mm a')} · {t(lang, a.type)}</p>
                  </div>
                  <Badge status={a.status}>{t(lang, a.status)}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock alerts */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{t(lang, 'stockAlerts')}</h2>
            <Link to="/inventory" className="text-sm text-primary-600 hover:underline">{t(lang, 'viewAll')}</Link>
          </div>
          {stockAlerts.length === 0 ? (
            <EmptyState icon={Pill} message={t(lang, 'noData')} />
          ) : (
            <div className="space-y-2">
              {stockAlerts.map((i) => (
                <div key={i.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{i.medicine_name}</p>
                    <p className="text-xs text-gray-500">{i.facility}</p>
                  </div>
                  <span className="badge bg-warning-50 text-warning-700 shrink-0">{i.quantity} {i.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent patients */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{t(lang, 'recentPatients')}</h2>
            <Link to="/patients" className="text-sm text-primary-600 hover:underline">{t(lang, 'viewAll')}</Link>
          </div>
          {recentPatients.length === 0 ? (
            <EmptyState icon={Users} message={t(lang, 'noData')} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentPatients.map((p) => (
                <Link key={p.id} to="/patients" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold shrink-0">
                    {p.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.full_name}</p>
                    <p className="text-xs text-gray-500">{p.village} · {p.age} {t(lang, 'age').toLowerCase()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
