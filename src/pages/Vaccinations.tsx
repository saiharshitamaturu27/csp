import { useEffect, useState, useCallback } from 'react';
import { Syringe, Plus, Edit2, Trash2, CalendarClock } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/i18n';
import { supabase, type Vaccination, type Patient } from '../lib/supabase';
import { PageHeader, Modal, EmptyState } from '../components/ui';
import { format, parseISO, isAfter } from 'date-fns';

const COMMON_VACCINES = [
  'BCG', 'OPV-0', 'OPV-1', 'OPV-2', 'OPV-3', 'DPT-1', 'DPT-2', 'DPT-3',
  'Hepatitis B-0', 'Hepatitis B-1', 'Hepatitis B-2', 'Hepatitis B-3',
  'Measles-1', 'Measles-2', 'MR-1', 'MR-2', 'JE', 'TT', 'Pentavalent-1',
  'Pentavalent-2', 'Pentavalent-3', 'Rotavirus-1', 'Rotavirus-2', 'Rotavirus-3',
  'PCV-1', 'PCV-2', 'PCV-3', 'Vitamin A',
];

export default function Vaccinations() {
  const { lang, user } = useAuth();
  const [records, setRecords] = useState<Vaccination[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ patient_id: '', vaccine_name: '', dose_number: '1', administered_date: format(new Date(), 'yyyy-MM-dd'), next_due: '', notes: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('vaccinations').select('*, patient:patients(*)').order('administered_date', { ascending: false }).limit(100);
    setRecords((data || []) as Vaccination[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.from('patients').select('*').order('full_name').then(({ data }) => setPatients((data || []) as Patient[]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditId(null);
    setForm({ patient_id: '', vaccine_name: '', dose_number: '1', administered_date: format(new Date(), 'yyyy-MM-dd'), next_due: '', notes: '' });
    setModalOpen(true);
  };

  const openEdit = (v: Vaccination) => {
    setEditId(v.id);
    setForm({
      patient_id: v.patient_id,
      vaccine_name: v.vaccine_name,
      dose_number: v.dose_number.toString(),
      administered_date: format(parseISO(v.administered_date), 'yyyy-MM-dd'),
      next_due: v.next_due ? format(parseISO(v.next_due), 'yyyy-MM-dd') : '',
      notes: v.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      patient_id: form.patient_id,
      vaccine_name: form.vaccine_name,
      dose_number: parseInt(form.dose_number) || 1,
      administered_date: form.administered_date,
      next_due: form.next_due || null,
      administered_by: user?.id,
      notes: form.notes || null,
    };
    if (editId) {
      await supabase.from('vaccinations').update(payload).eq('id', editId);
    } else {
      await supabase.from('vaccinations').insert(payload);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t(lang, 'deleteConfirm'))) return;
    await supabase.from('vaccinations').delete().eq('id', id);
    load();
  };

  const dueSoon = records.filter((r) => r.next_due && isAfter(parseISO(r.next_due), new Date()) && differenceInDays(parseISO(r.next_due), new Date()) <= 30);

  return (
    <div>
      <PageHeader
        title={t(lang, 'vaccinations')}
        subtitle={`${dueSoon.length} due in next 30 days`}
        action={<button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />{t(lang, 'addNew')}</button>}
      />

      <div className="card overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-400 py-12 text-center">{t(lang, 'loading')}</p>
        ) : records.length === 0 ? (
          <EmptyState icon={Syringe} message={t(lang, 'noData')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3">{t(lang, 'name')}</th>
                  <th className="px-5 py-3">{t(lang, 'vaccineName')}</th>
                  <th className="px-5 py-3">{t(lang, 'doseNo')}</th>
                  <th className="px-5 py-3">{t(lang, 'administeredDate')}</th>
                  <th className="px-5 py-3 hidden md:table-cell">{t(lang, 'nextDue')}</th>
                  <th className="px-5 py-3 text-right">{t(lang, 'actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((v) => {
                  const overdue = v.next_due && !isAfter(parseISO(v.next_due), new Date());
                  return (
                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{v.patient?.full_name || 'Unknown'}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
                          <Syringe className="w-3.5 h-3.5 text-primary-500" />{v.vaccine_name}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">Dose {v.dose_number}</td>
                      <td className="px-5 py-3 text-sm text-gray-700">{format(parseISO(v.administered_date), 'd MMM yyyy')}</td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        {v.next_due ? (
                          <span className={`inline-flex items-center gap-1 text-sm ${overdue ? 'text-error-600 font-medium' : 'text-gray-700'}`}>
                            <CalendarClock className="w-3.5 h-3.5" />{format(parseISO(v.next_due), 'd MMM yyyy')}
                            {overdue && ' (overdue)'}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(v)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(v.id)} className="p-2 rounded-lg hover:bg-error-50 text-gray-500 hover:text-error-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? t(lang, 'edit') : t(lang, 'vaccinations')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t(lang, 'selectPatient')} *</label>
            <select className="input" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} required>
              <option value="">-- {t(lang, 'selectPatient')} --</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name} ({p.village})</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t(lang, 'vaccineName')} *</label>
            <input className="input" list="vaccines" value={form.vaccine_name} onChange={(e) => setForm({ ...form, vaccine_name: e.target.value })} required placeholder="Select or type vaccine" />
            <datalist id="vaccines">{COMMON_VACCINES.map((v) => <option key={v} value={v} />)}</datalist>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">{t(lang, 'doseNo')}</label><input type="number" className="input" value={form.dose_number} onChange={(e) => setForm({ ...form, dose_number: e.target.value })} min="1" /></div>
            <div><label className="label">{t(lang, 'administeredDate')}</label><input type="date" className="input" value={form.administered_date} onChange={(e) => setForm({ ...form, administered_date: e.target.value })} /></div>
          </div>
          <div><label className="label">{t(lang, 'nextDue')}</label><input type="date" className="input" value={form.next_due} onChange={(e) => setForm({ ...form, next_due: e.target.value })} /></div>
          <div><label className="label">{t(lang, 'notes')}</label><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">{t(lang, 'cancel')}</button>
            <button type="submit" className="btn-primary">{t(lang, 'save')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function differenceInDays(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}
