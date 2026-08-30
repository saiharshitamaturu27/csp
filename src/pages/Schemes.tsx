import { useEffect, useState, useCallback } from 'react';
import { Landmark, Plus, Edit2, Trash2, CheckCircle2, XCircle, FileText, Clock } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/i18n';
import { supabase, type Scheme, type SchemeApplication, type Patient } from '../lib/supabase';
import { PageHeader, Modal, EmptyState, Badge } from '../components/ui';
import { format, parseISO } from 'date-fns';

export default function Schemes() {
  const { lang, user } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [applications, setApplications] = useState<SchemeApplication[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'schemes' | 'applications'>('schemes');
  const [modalOpen, setModalOpen] = useState(false);
  const [eligibilityModal, setEligibilityModal] = useState<Scheme | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', eligibility_criteria: '', benefits: '', category: '', min_age: '', max_age: '', income_limit: '', for_pregnant: false, for_child: false });

  const load = useCallback(async () => {
    setLoading(true);
    const [s, a] = await Promise.all([
      supabase.from('schemes').select('*').order('name'),
      supabase.from('scheme_applications').select('*, patient:patients(*), scheme:schemes(*)').order('created_at', { ascending: false }),
    ]);
    setSchemes((s.data || []) as Scheme[]);
    setApplications((a.data || []) as SchemeApplication[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.from('patients').select('*').order('full_name').then(({ data }) => setPatients((data || []) as Patient[]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditId(null);
    setForm({ name: '', description: '', eligibility_criteria: '', benefits: '', category: '', min_age: '', max_age: '', income_limit: '', for_pregnant: false, for_child: false });
    setModalOpen(true);
  };

  const openEdit = (s: Scheme) => {
    setEditId(s.id);
    setForm({
      name: s.name, description: s.description || '', eligibility_criteria: s.eligibility_criteria || '',
      benefits: s.benefits || '', category: s.category || '',
      min_age: s.min_age?.toString() || '', max_age: s.max_age?.toString() || '',
      income_limit: s.income_limit?.toString() || '', for_pregnant: s.for_pregnant, for_child: s.for_child,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name, description: form.description || null, eligibility_criteria: form.eligibility_criteria || null,
      benefits: form.benefits || null, category: form.category || null,
      min_age: form.min_age ? parseInt(form.min_age) : null, max_age: form.max_age ? parseInt(form.max_age) : null,
      income_limit: form.income_limit ? parseFloat(form.income_limit) : null,
      for_pregnant: form.for_pregnant, for_child: form.for_child,
    };
    if (editId) await supabase.from('schemes').update(payload).eq('id', editId);
    else await supabase.from('schemes').insert(payload);
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t(lang, 'deleteConfirm'))) return;
    await supabase.from('schemes').delete().eq('id', id);
    load();
  };

  const applyScheme = async (schemeId: string, patientId: string, status: string) => {
    await supabase.from('scheme_applications').insert({ scheme_id: schemeId, patient_id: patientId, status, applied_by: user?.id });
    setEligibilityModal(null);
    load();
  };

  const updateAppStatus = async (id: string, status: string) => {
    await supabase.from('scheme_applications').update({ status }).eq('id', id);
    load();
  };

  return (
    <div>
      <PageHeader
        title={t(lang, 'schemes')}
        subtitle="Government health welfare scheme eligibility"
        action={tab === 'schemes' ? <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />{t(lang, 'addNew')}</button> : undefined}
      />

      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab('schemes')} className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'schemes' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{t(lang, 'schemeName')}s</button>
        <button onClick={() => setTab('applications')} className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'applications' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{t(lang, 'schemeApplications')} ({applications.length})</button>
      </div>

      {tab === 'schemes' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? <p className="text-sm text-gray-400 col-span-2 py-12 text-center">{t(lang, 'loading')}</p> :
           schemes.length === 0 ? <div className="col-span-2"><div className="card"><EmptyState icon={Landmark} message={t(lang, 'noData')} /></div></div> :
           schemes.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0"><Landmark className="w-5 h-5" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{s.name}</h3>
                    {s.category && <span className="badge bg-gray-100 text-gray-600 capitalize mt-1">{s.category}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-error-50 text-gray-500 hover:text-error-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{s.description}</p>
              {s.benefits && <p className="text-sm text-gray-700 mb-2"><span className="font-medium">{t(lang, 'benefits')}:</span> {s.benefits}</p>}
              {s.eligibility_criteria && <p className="text-xs text-gray-500 mb-3"><span className="font-medium">{t(lang, 'eligibilityCriteria')}:</span> {s.eligibility_criteria}</p>}
              <button onClick={() => setEligibilityModal(s)} className="btn-secondary w-full text-sm">{t(lang, 'checkEligibility')}</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {applications.length === 0 ? <EmptyState icon={FileText} message={t(lang, 'noData')} /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3">{t(lang, 'name')}</th>
                    <th className="px-5 py-3">{t(lang, 'schemeName')}</th>
                    <th className="px-5 py-3">{t(lang, 'date')}</th>
                    <th className="px-5 py-3">{t(lang, 'status')}</th>
                    <th className="px-5 py-3 text-right">{t(lang, 'actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applications.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{a.patient?.full_name}</td>
                      <td className="px-5 py-3 text-sm text-gray-700">{a.scheme?.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{format(parseISO(a.created_at), 'd MMM yyyy')}</td>
                      <td className="px-5 py-3"><Badge status={a.status}>{t(lang, a.status)}</Badge></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {a.status === 'pending' || a.status === 'eligible' ? (
                            <>
                              <button onClick={() => updateAppStatus(a.id, 'approved')} className="p-2 rounded-lg hover:bg-success-50 text-success-600" title="Approve"><CheckCircle2 className="w-4 h-4" /></button>
                              <button onClick={() => updateAppStatus(a.id, 'rejected')} className="p-2 rounded-lg hover:bg-error-50 text-error-600" title="Reject"><XCircle className="w-4 h-4" /></button>
                            </>
                          ) : <Clock className="w-4 h-4 text-gray-300 mx-auto" />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Eligibility checker modal */}
      <Modal open={!!eligibilityModal} onClose={() => setEligibilityModal(null)} title={t(lang, 'checkEligibility')} size="lg">
        {eligibilityModal && <EligibilityChecker scheme={eligibilityModal} patients={patients} onApply={applyScheme} />}
      </Modal>

      {/* Add/Edit scheme modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? t(lang, 'edit') : t(lang, 'addNew')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">{t(lang, 'schemeName')} *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label">{t(lang, 'description')}</label><textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Min Age</label><input type="number" className="input" value={form.min_age} onChange={(e) => setForm({ ...form, min_age: e.target.value })} /></div>
            <div><label className="label">Max Age</label><input type="number" className="input" value={form.max_age} onChange={(e) => setForm({ ...form, max_age: e.target.value })} /></div>
          </div>
          <div><label className="label">{t(lang, 'benefits')}</label><input className="input" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} /></div>
          <div><label className="label">{t(lang, 'eligibilityCriteria')}</label><textarea className="input" rows={2} value={form.eligibility_criteria} onChange={(e) => setForm({ ...form, eligibility_criteria: e.target.value })} /></div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.for_pregnant} onChange={(e) => setForm({ ...form, for_pregnant: e.target.checked })} /> For Pregnant Women</label>
            <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.for_child} onChange={(e) => setForm({ ...form, for_child: e.target.checked })} /> For Children</label>
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

function EligibilityChecker({ scheme, patients, onApply }: { scheme: Scheme; patients: Patient[]; onApply: (schemeId: string, patientId: string, status: string) => void }) {
  const { lang } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [result, setResult] = useState<{ eligible: boolean; reasons: string[] } | null>(null);

  const patient = patients.find((p) => p.id === selectedPatient);

  const handleCheck = () => {
    if (!patient) return;
    setResult(checkEligibility(scheme, patient));
  };

  const checkEligibility = (scheme: Scheme, patient: Patient): { eligible: boolean; reasons: string[] } => {
    const reasons: string[] = [];
    let eligible = true;
    if (scheme.min_age != null && patient.age != null && patient.age < scheme.min_age) { eligible = false; reasons.push(`Minimum age ${scheme.min_age} not met (patient is ${patient.age})`); }
    if (scheme.max_age != null && patient.age != null && patient.age > scheme.max_age) { eligible = false; reasons.push(`Maximum age ${scheme.max_age} exceeded (patient is ${patient.age})`); }
    if (scheme.for_pregnant && patient.gender !== 'female') { eligible = false; reasons.push('Scheme is for pregnant women only'); }
    if (scheme.for_child && patient.age != null && patient.age > 18) { eligible = false; reasons.push('Scheme is for children only'); }
    if (eligible) reasons.push('Patient meets all eligibility criteria');
    return { eligible, reasons };
  };

  return (
    <div className="space-y-4">
      <div className="bg-primary-50/50 rounded-lg p-3 border border-primary-100">
        <p className="font-medium text-gray-900">{scheme.name}</p>
        <p className="text-sm text-gray-600 mt-1">{scheme.description}</p>
      </div>
      <div>
        <label className="label">{t(lang, 'selectPatient')}</label>
        <select className="input" value={selectedPatient} onChange={(e) => { setSelectedPatient(e.target.value); setResult(null); }}>
          <option value="">-- Select --</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name} (Age: {p.age || '?'}, {p.gender})</option>)}
        </select>
      </div>
      <button onClick={handleCheck} disabled={!selectedPatient} className="btn-primary w-full">{t(lang, 'checkEligibility')}</button>

      {result && (
        <div className={`rounded-lg p-4 border ${result.eligible ? 'bg-success-50 border-success-200' : 'bg-error-50 border-error-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {result.eligible ? <CheckCircle2 className="w-5 h-5 text-success-600" /> : <XCircle className="w-5 h-5 text-error-600" />}
            <span className={`font-semibold ${result.eligible ? 'text-success-700' : 'text-error-700'}`}>{result.eligible ? t(lang, 'eligible') : t(lang, 'notEligible')}</span>
          </div>
          <ul className="space-y-1">
            {result.reasons.map((r, i) => <li key={i} className="text-sm text-gray-700 flex items-start gap-2"><span className="text-gray-400">•</span> {r}</li>)}
          </ul>
          {result.eligible && patient && (
            <button onClick={() => onApply(scheme.id, patient.id, 'eligible')} className="btn-primary w-full mt-3 text-sm">{t(lang, 'apply')}</button>
          )}
        </div>
      )}
    </div>
  );
}
