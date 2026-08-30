import { useEffect, useState, useCallback } from 'react';
import { HeartPulse, Plus, Edit2, Trash2, Baby, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/i18n';
import { supabase, type MaternalRecord, type Patient } from '../lib/supabase';
import { PageHeader, Modal, EmptyState, Badge } from '../components/ui';
import { format, parseISO, differenceInWeeks } from 'date-fns';

export default function MaternalCare() {
  const { lang } = useAuth();
  const [records, setRecords] = useState<MaternalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    patient_id: '', lmp: '', edd: '', gravida: '1', para: '0',
    trimester: '1', anc_visits: '0', risk_level: 'low', notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('maternal_records')
      .select('*, patient:patients(*)')
      .order('created_at', { ascending: false });
    setRecords((data || []) as MaternalRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.from('patients').select('*').eq('gender', 'female').order('full_name').then(({ data }) => setPatients((data || []) as Patient[]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditId(null);
    setForm({ patient_id: '', lmp: '', edd: '', gravida: '1', para: '0', trimester: '1', anc_visits: '0', risk_level: 'low', notes: '' });
    setModalOpen(true);
  };

  const openEdit = (r: MaternalRecord) => {
    setEditId(r.id);
    setForm({
      patient_id: r.patient_id,
      lmp: r.lmp || '',
      edd: r.edd || '',
      gravida: r.gravida.toString(),
      para: r.para.toString(),
      trimester: r.trimester.toString(),
      anc_visits: r.anc_visits.toString(),
      risk_level: r.risk_level,
      notes: r.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      patient_id: form.patient_id,
      lmp: form.lmp || null,
      edd: form.edd || null,
      gravida: parseInt(form.gravida) || 1,
      para: parseInt(form.para) || 0,
      trimester: parseInt(form.trimester) || 1,
      anc_visits: parseInt(form.anc_visits) || 0,
      risk_level: form.risk_level,
      notes: form.notes || null,
    };
    if (editId) {
      await supabase.from('maternal_records').update(payload).eq('id', editId);
    } else {
      await supabase.from('maternal_records').insert(payload);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t(lang, 'deleteConfirm'))) return;
    await supabase.from('maternal_records').delete().eq('id', id);
    load();
  };

  const calcGestationalAge = (lmp: string | null | undefined) => {
    if (!lmp) return null;
    const weeks = differenceInWeeks(new Date(), parseISO(lmp));
    return weeks;
  };

  return (
    <div>
      <PageHeader
        title={t(lang, 'maternal')}
        subtitle="ANC / PNC tracking and risk assessment"
        action={<button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />{t(lang, 'addNew')}</button>}
      />

      {/* Risk summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success-50 text-success-600 flex items-center justify-center"><HeartPulse className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{records.filter((r) => r.risk_level === 'low').length}</p><p className="text-xs text-gray-500">{t(lang, 'low')} {t(lang, 'riskLevel')}</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning-50 text-warning-600 flex items-center justify-center"><AlertCircle className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{records.filter((r) => r.risk_level === 'medium').length}</p><p className="text-xs text-gray-500">{t(lang, 'medium')} {t(lang, 'riskLevel')}</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-error-50 text-error-600 flex items-center justify-center"><AlertCircle className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{records.filter((r) => r.risk_level === 'high').length}</p><p className="text-xs text-gray-500">{t(lang, 'high')} {t(lang, 'riskLevel')}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-sm text-gray-400 col-span-2 py-12 text-center">{t(lang, 'loading')}</p>
        ) : records.length === 0 ? (
          <div className="col-span-2"><div className="card"><EmptyState icon={HeartPulse} message={t(lang, 'noData')} /></div></div>
        ) : (
          records.map((r) => {
            const ga = calcGestationalAge(r.lmp);
            return (
              <div key={r.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center"><Baby className="w-5 h-5" /></div>
                    <div>
                      <p className="font-semibold text-gray-900">{r.patient?.full_name}</p>
                      <p className="text-xs text-gray-500">{r.patient?.village} · Trimester {r.trimester}</p>
                    </div>
                  </div>
                  <Badge status={r.risk_level}>{t(lang, r.risk_level)} {t(lang, 'riskLevel')}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {ga !== null && <div><span className="text-gray-500">Gestational Age:</span> <span className="font-medium text-gray-900">{ga} weeks</span></div>}
                  {r.edd && <div><span className="text-gray-500">{t(lang, 'edd')}:</span> <span className="font-medium text-gray-900">{format(parseISO(r.edd), 'd MMM yyyy')}</span></div>}
                  <div><span className="text-gray-500">{t(lang, 'gravida')}/{t(lang, 'para')}:</span> <span className="font-medium text-gray-900">G{r.gravida} P{r.para}</span></div>
                  <div><span className="text-gray-500">{t(lang, 'ancVisits')}:</span> <span className="font-medium text-gray-900">{r.anc_visits}</span></div>
                </div>
                {r.notes && <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">{r.notes}</p>}
                <div className="flex gap-1 justify-end mt-3">
                  <button onClick={() => openEdit(r)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg hover:bg-error-50 text-gray-500 hover:text-error-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? t(lang, 'edit') : t(lang, 'maternal')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t(lang, 'selectPatient')} *</label>
            <select className="input" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} required>
              <option value="">-- {t(lang, 'selectPatient')} --</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name} ({p.village})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">{t(lang, 'lmp')}</label><input type="date" className="input" value={form.lmp} onChange={(e) => setForm({ ...form, lmp: e.target.value })} /></div>
            <div><label className="label">{t(lang, 'edd')}</label><input type="date" className="input" value={form.edd} onChange={(e) => setForm({ ...form, edd: e.target.value })} /></div>
            <div><label className="label">{t(lang, 'gravida')}</label><input type="number" className="input" value={form.gravida} onChange={(e) => setForm({ ...form, gravida: e.target.value })} min="1" /></div>
            <div><label className="label">{t(lang, 'para')}</label><input type="number" className="input" value={form.para} onChange={(e) => setForm({ ...form, para: e.target.value })} min="0" /></div>
            <div><label className="label">{t(lang, 'trimester')}</label><select className="input" value={form.trimester} onChange={(e) => setForm({ ...form, trimester: e.target.value })}><option value="1">1st</option><option value="2">2nd</option><option value="3">3rd</option></select></div>
            <div><label className="label">{t(lang, 'ancVisits')}</label><input type="number" className="input" value={form.anc_visits} onChange={(e) => setForm({ ...form, anc_visits: e.target.value })} min="0" /></div>
            <div className="col-span-2"><label className="label">{t(lang, 'riskLevel')}</label><select className="input" value={form.risk_level} onChange={(e) => setForm({ ...form, risk_level: e.target.value })}><option value="low">{t(lang, 'low')}</option><option value="medium">{t(lang, 'medium')}</option><option value="high">{t(lang, 'high')}</option></select></div>
            <div className="col-span-2"><label className="label">{t(lang, 'notes')}</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">{t(lang, 'cancel')}</button>
            <button type="submit" className="btn-primary">{t(lang, 'save')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
