import { useEffect, useState, useCallback } from 'react';
import { CalendarDays, Plus, Video, Phone, MapPin, Edit2, Trash2, Stethoscope } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/i18n';
import { supabase, type Appointment, type Patient } from '../lib/supabase';
import { PageHeader, Modal, EmptyState, Badge } from '../components/ui';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import VideoCallRoom from '../components/VideoCallRoom';

export default function Appointments() {
  const { lang, user } = useAuth();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [videoCallAppt, setVideoCallAppt] = useState<Appointment | null>(null);
  const [form, setForm] = useState({ patient_id: '', scheduled_at: '', type: 'in-person', reason: '', status: 'scheduled' });

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('appointments').select('*, patient:patients(*)').order('scheduled_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query.limit(100);
    setAppts((data || []) as Appointment[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    supabase.from('patients').select('*').order('full_name').then(({ data }) => setPatients((data || []) as Patient[]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditId(null);
    setForm({ patient_id: '', scheduled_at: '', type: 'in-person', reason: '', status: 'scheduled' });
    setModalOpen(true);
  };

  const openEdit = (a: Appointment) => {
    setEditId(a.id);
    setForm({
      patient_id: a.patient_id,
      scheduled_at: format(parseISO(a.scheduled_at), "yyyy-MM-dd'T'HH:mm"),
      type: a.type,
      reason: a.reason || '',
      status: a.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      patient_id: form.patient_id,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      type: form.type,
      reason: form.reason || null,
      status: form.status,
      practitioner_id: user?.id,
    };
    if (editId) {
      await supabase.from('appointments').update(payload).eq('id', editId);
    } else {
      await supabase.from('appointments').insert(payload);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t(lang, 'deleteConfirm'))) return;
    await supabase.from('appointments').delete().eq('id', id);
    load();
  };

  const typeIcon = (type: string) => {
    if (type === 'video') return <Video className="w-4 h-4" />;
    if (type === 'tele') return <Phone className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  return (
    <div>
      <PageHeader
        title={t(lang, 'appointments')}
        action={<button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />{t(lang, 'scheduleAppointment')}</button>}
      />

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {['all', 'scheduled', 'completed', 'cancelled', 'no-show'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            {f === 'all' ? 'All' : t(lang, f)}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-400 py-12 text-center">{t(lang, 'loading')}</p>
        ) : appts.length === 0 ? (
          <EmptyState icon={CalendarDays} message={t(lang, 'noData')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3">{t(lang, 'name')}</th>
                  <th className="px-5 py-3">{t(lang, 'date')}</th>
                  <th className="px-5 py-3">{t(lang, 'consultationType')}</th>
                  <th className="px-5 py-3 hidden md:table-cell">{t(lang, 'reason')}</th>
                  <th className="px-5 py-3">{t(lang, 'status')}</th>
                  <th className="px-5 py-3 text-right">{t(lang, 'actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appts.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{a.patient?.full_name || 'Unknown'}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{format(parseISO(a.scheduled_at), 'd MMM, h:mm a')}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
                        {typeIcon(a.type)} {t(lang, a.type)}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-sm text-gray-600 max-w-xs truncate">{a.reason || '-'}</td>
                    <td className="px-5 py-3"><Badge status={a.status}>{t(lang, a.status)}</Badge></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {a.type === 'video' && a.status === 'scheduled' && (
                          <button onClick={() => setVideoCallAppt(a)} className="p-2 rounded-lg hover:bg-secondary-50 text-secondary-600" title={t(lang, 'videoConsultation')}>
                            <Video className="w-4 h-4" />
                          </button>
                        )}
                        <Link to="/consultations" className="p-2 rounded-lg hover:bg-primary-50 text-primary-600" title={t(lang, 'newConsultation')}>
                          <Stethoscope className="w-4 h-4" />
                        </Link>
                        <button onClick={() => openEdit(a)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg hover:bg-error-50 text-gray-500 hover:text-error-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? t(lang, 'edit') : t(lang, 'scheduleAppointment')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t(lang, 'selectPatient')} *</label>
            <select className="input" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} required>
              <option value="">-- {t(lang, 'selectPatient')} --</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name} ({p.village})</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t(lang, 'date')} *</label>
            <input type="datetime-local" className="input" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t(lang, 'consultationType')}</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="in-person">{t(lang, 'inPerson')}</option>
                <option value="video">{t(lang, 'video')}</option>
                <option value="tele">{t(lang, 'tele')}</option>
              </select>
            </div>
            <div>
              <label className="label">{t(lang, 'status')}</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="scheduled">{t(lang, 'scheduled')}</option>
                <option value="completed">{t(lang, 'completed')}</option>
                <option value="cancelled">{t(lang, 'cancelled')}</option>
                <option value="no-show">{t(lang, 'noShow')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">{t(lang, 'reason')}</label>
            <textarea className="input" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">{t(lang, 'cancel')}</button>
            <button type="submit" className="btn-primary">{t(lang, 'save')}</button>
          </div>
        </form>
      </Modal>

      {/* Video call room */}
      {videoCallAppt && (
        <VideoCallRoom appointment={videoCallAppt} onEnd={() => setVideoCallAppt(null)} />
      )}
    </div>
  );
}
