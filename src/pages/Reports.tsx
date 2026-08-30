import { useEffect, useState } from 'react';
import { Users, CalendarDays, Stethoscope, Syringe, HeartPulse, Pill, BarChart3, TrendingUp } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { PageHeader, StatCard } from '../components/ui';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { format, parseISO, subMonths } from 'date-fns';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const { lang } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    totals: { patients: number; appts: number; consults: number; vax: number; maternal: number; inventory: number };
    villageDist: { name: string; count: number }[];
    genderDist: { name: string; value: number }[];
    ageDist: { name: string; count: number }[];
    apptTrend: { month: string; count: number }[];
    statusDist: { name: string; value: number }[];
    riskDist: { name: string; value: number }[];
    schemeDist: { name: string; value: number }[];
  } | null>(null);

  useEffect(() => {
    (async () => {
      const [patients, appts, consults, vax, maternal, inventory, schemeApps] = await Promise.all([
        supabase.from('patients').select('*'),
        supabase.from('appointments').select('*'),
        supabase.from('consultations').select('*'),
        supabase.from('vaccinations').select('*'),
        supabase.from('maternal_records').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('scheme_applications').select('*, scheme:schemes(*)'),
      ]);

      const patientData = patients.data || [];
      const apptData = appts.data || [];
      const consultData = consults.data || [];
      const vaxData = vax.data || [];
      const maternalData = maternal.data || [];
      const invData = inventory.data || [];
      const schemeData = schemeApps.data || [];

      // Village distribution
      const villageMap: Record<string, number> = {};
      patientData.forEach((p: any) => { const v = p.village || 'Unknown'; villageMap[v] = (villageMap[v] || 0) + 1; });
      const villageDist = Object.entries(villageMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);

      // Gender distribution
      const genderMap: Record<string, number> = {};
      patientData.forEach((p: any) => { const g = p.gender || 'other'; genderMap[g] = (genderMap[g] || 0) + 1; });
      const genderDist = Object.entries(genderMap).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

      // Age distribution
      const ageBuckets = { '0-5': 0, '6-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0 };
      patientData.forEach((p: any) => {
        const a = p.age;
        if (a == null) return;
        if (a <= 5) ageBuckets['0-5']++;
        else if (a <= 18) ageBuckets['6-18']++;
        else if (a <= 35) ageBuckets['19-35']++;
        else if (a <= 50) ageBuckets['36-50']++;
        else if (a <= 65) ageBuckets['51-65']++;
        else ageBuckets['65+']++;
      });
      const ageDist = Object.entries(ageBuckets).map(([name, count]) => ({ name, count }));

      // Appointment trend (last 6 months)
      const trendMap: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        trendMap[format(d, 'MMM yyyy')] = 0;
      }
      apptData.forEach((a: any) => {
        const m = format(parseISO(a.scheduled_at), 'MMM yyyy');
        if (trendMap[m] !== undefined) trendMap[m]++;
      });
      const apptTrend = Object.entries(trendMap).map(([month, count]) => ({ month, count }));

      // Appointment status distribution
      const statusMap: Record<string, number> = {};
      apptData.forEach((a: any) => { statusMap[a.status] = (statusMap[a.status] || 0) + 1; });
      const statusDist = Object.entries(statusMap).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

      // Maternal risk distribution
      const riskMap: Record<string, number> = {};
      maternalData.forEach((m: any) => { riskMap[m.risk_level] = (riskMap[m.risk_level] || 0) + 1; });
      const riskDist = Object.entries(riskMap).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

      // Scheme application distribution
      const schemeStatusMap: Record<string, number> = {};
      schemeData.forEach((s: any) => { schemeStatusMap[s.status] = (schemeStatusMap[s.status] || 0) + 1; });
      const schemeDist = Object.entries(schemeStatusMap).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

      setData({
        totals: { patients: patientData.length, appts: apptData.length, consults: consultData.length, vax: vaxData.length, maternal: maternalData.length, inventory: invData.length },
        villageDist, genderDist, ageDist, apptTrend, statusDist, riskDist, schemeDist,
      });
      setLoading(false);
    })();
  }, []);

  if (loading || !data) {
    return (
      <div>
        <PageHeader title={t(lang, 'reports')} />
        <p className="text-sm text-gray-400 py-12 text-center">{t(lang, 'loading')}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t(lang, 'reports')} subtitle="Overview of healthcare operations and outcomes" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Users} label={t(lang, 'totalPatients')} value={data.totals.patients} color="primary" />
        <StatCard icon={CalendarDays} label={t(lang, 'totalAppointments')} value={data.totals.appts} color="secondary" />
        <StatCard icon={Stethoscope} label={t(lang, 'completedConsults')} value={data.totals.consults} color="accent" />
        <StatCard icon={Syringe} label={t(lang, 'totalVaccinations')} value={data.totals.vax} color="success" />
        <StatCard icon={HeartPulse} label={t(lang, 'pregnantWomen')} value={data.totals.maternal} color="warning" />
        <StatCard icon={Pill} label="Inventory Items" value={data.totals.inventory} color="error" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment trend */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary-600" />{t(lang, 'appointmentTrend')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.apptTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Village distribution */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary-600" />{t(lang, 'patientDistribution')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.villageDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender distribution */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t(lang, 'patientsByGender')}</h3>
          {data.genderDist.length === 0 ? <p className="text-sm text-gray-400 text-center py-12">No data</p> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.genderDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e: any) => `${e.name}: ${e.value}`}>
                  {data.genderDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Age distribution */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t(lang, 'ageDistribution')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.ageDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Maternal risk */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t(lang, 'maternalHealth')}</h3>
          {data.riskDist.length === 0 ? <p className="text-sm text-gray-400 text-center py-12">No data</p> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.riskDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e: any) => `${e.name}: ${e.value}`}>
                  {data.riskDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Scheme applications */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t(lang, 'schemeApplications')}</h3>
          {data.schemeDist.length === 0 ? <p className="text-sm text-gray-400 text-center py-12">No data</p> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.schemeDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e: any) => `${e.name}: ${e.value}`}>
                  {data.schemeDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
