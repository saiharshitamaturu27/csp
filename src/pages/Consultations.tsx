import { useEffect, useState, useCallback } from 'react';
import { Stethoscope, Plus, Pill, Trash2, Sparkles, Activity, Thermometer, Heart } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/i18n';
import { supabase, type Consultation, type Patient, type Prescription } from '../lib/supabase';
import { PageHeader, Modal, EmptyState } from '../components/ui';
import { format, parseISO } from 'date-fns';

export default function Consultations() {
  const { lang, user } = useAuth();
  const [consults, setConsults] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailConsult, setDetailConsult] = useState<Consultation | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const [form, setForm] = useState({
    patient_id: '', chief_complaint: '', diagnosis: '', notes: '',
    bp_systolic: '', bp_diastolic: '', heart_rate: '', temperature: '', weight: '',
  });
  const [rxList, setRxList] = useState([{ medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('consultations')
      .select('*, patient:patients(*)')
      .order('created_at', { ascending: false })
      .limit(50);
    setConsults((data || []) as Consultation[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.from('patients').select('*').order('full_name').then(({ data }) => setPatients((data || []) as Patient[]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadPrescriptions = async (consultId: string) => {
    const { data } = await supabase.from('prescriptions').select('*').eq('consultation_id', consultId).order('created_at');
    setPrescriptions((data || []) as Prescription[]);
  };

  const openDetail = async (c: Consultation) => {
    setDetailConsult(c);
    await loadPrescriptions(c.id);
  };

  const openAdd = () => {
    setForm({ patient_id: '', chief_complaint: '', diagnosis: '', notes: '', bp_systolic: '', bp_diastolic: '', heart_rate: '', temperature: '', weight: '' });
    setRxList([{ medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    setModalOpen(true);
  };

  // AI Decision Support — rule-based clinical suggestions
  const getAISuggestion = () => {
    setAiLoading(true);
    setTimeout(() => {
      const complaint = form.chief_complaint.toLowerCase();
      const diagnosis = form.diagnosis.toLowerCase();
      const hr = parseInt(form.heart_rate);
      const temp = parseFloat(form.temperature);
      const bpSys = parseInt(form.bp_systolic);
      const suggestions: string[] = [];

      if (temp && temp >= 39) suggestions.push('High fever detected. Consider antipyretics (Paracetamol 500mg), rule out malaria/dengue in endemic areas, advise hydration.');
      else if (temp && temp >= 38) suggestions.push('Mild fever. Monitor temperature, advise rest and fluids. Consider Paracetamol if uncomfortable.');

      if (hr && hr > 100) suggestions.push('Tachycardia detected. Assess for dehydration, fever, anxiety, or cardiac causes.');
      if (hr && hr < 60) suggestions.push('Bradycardia detected. Check for medication effects, cardiac conduction issues.');

      if (bpSys && bpSys >= 140) suggestions.push('Elevated blood pressure. Recommend lifestyle counseling, salt restriction, follow-up BP monitoring. Consider antihypertensive if persistent.');
      if (bpSys && bpSys < 90) suggestions.push('Low blood pressure. Assess for shock, dehydration, sepsis. IV fluids if indicated.');

      if (complaint.includes('cough') || diagnosis.includes('cough')) suggestions.push('Cough present. Assess duration, sputum, breath sounds. Acute (<3 weeks) likely viral; chronic warrants TB screening.');
      if (complaint.includes('diarrhea') || diagnosis.includes('diarrhea')) suggestions.push('Diarrhea. Start ORS immediately, assess dehydration severity, check for blood in stool. Zinc supplementation for children.');
      if (complaint.includes('fever') || diagnosis.includes('fever')) suggestions.push('Fever workup: check for malaria (smear/RDT), dengue (NS1), typhoid (Widal). Monitor platelet count.');
      if (complaint.includes('pregnan') || diagnosis.includes('pregnan')) suggestions.push('Pregnancy-related complaint. Check BP, fetal heart rate, refer to ANC protocol. Screen for preeclampsia if BP elevated.');
      if (complaint.includes('chest pain') || diagnosis.includes('chest pain')) suggestions.push('Chest pain — assess for cardiac vs respiratory vs GI cause. ECG if available. Refer urgently if suspected cardiac.');
      if (complaint.includes('wound') || diagnosis.includes('wound')) suggestions.push('Wound care: clean with antiseptic, assess depth, consider tetanus prophylaxis, antibiotics if signs of infection.');

      if (suggestions.length === 0) {
        suggestions.push('No specific alerts triggered. Continue standard clinical assessment. Consider differential diagnosis based on presenting symptoms and patient history.');
      }
      suggestions.push('This AI suggestion is for decision support only and does not replace clinical judgment. Verify before prescribing.');
      setForm((f) => ({ ...f, notes: f.notes + (f.notes ? '\n\n' : '') + '[AI Support]: ' + suggestions.join(' ') }));
      setAiLoading(false);
    }, 800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vitals = {
      bp: form.bp_systolic && form.bp_diastolic ? `${form.bp_systolic}/${form.bp_diastolic}` : null,
      heart_rate: form.heart_rate || null,
      temperature: form.temperature || null,
      weight: form.weight || null,
    };
    const { data: consult, error } = await supabase.from('consultations').insert({
      patient_id: form.patient_id,
      chief_complaint: form.chief_complaint || null,
      diagnosis: form.diagnosis || null,
      notes: form.notes || null,
      vitals,
      practitioner_id: user?.id,
    }).select().single();

    if (consult && !error) {
      const validRx = rxList.filter((r) => r.medicine_name.trim());
      if (validRx.length > 0) {
        await supabase.from('prescriptions').insert(validRx.map((r) => ({
          consultation_id: consult.id,
          medicine_name: r.medicine_name,
          dosage: r.dosage || null,
          frequency: r.frequency || null,
          duration: r.duration || null,
          instructions: r.instructions || null,
        })));
      }
      // Mark linked appointment as completed if exists (skip — not linked here)
    }
    setModalOpen(false);
    load();
  };

  const addRxRow = () => setRxList([...rxList, { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const updateRx = (i: number, field: string, value: string) => {
    const updated = [...rxList];
    updated[i] = { ...updated[i], [field]: value };
    setRxList(updated);
  };
  const removeRx = (i: number) => setRxList(rxList.filter((_, idx) => idx !== i));

  return (
    <div>
      <PageHeader
        title={t(lang, 'consultations')}
        action={<button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />{t(lang, 'newConsultation')}</button>}
      />

      <div className="card overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-400 py-12 text-center">{t(lang, 'loading')}</p>
        ) : consults.length === 0 ? (
          <EmptyState icon={Stethoscope} message={t(lang, 'noData')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3">{t(lang, 'name')}</th>
                  <th className="px-5 py-3">{t(lang, 'diagnosis')}</th>
                  <th className="px-5 py-3 hidden md:table-cell">Vitals</th>
                  <th className="px-5 py-3">{t(lang, 'date')}</th>
                  <th className="px-5 py-3 text-right">{t(lang, 'actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {consults.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(c)}>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{c.patient?.full_name || 'Unknown'}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 max-w-xs truncate">{c.diagnosis || c.chief_complaint || '-'}</td>
                    <td className="px-5 py-3 hidden md:table-cell text-sm text-gray-600">
                      {c.vitals && (c.vitals.bp || c.vitals.heart_rate) ? `${c.vitals.bp || ''} ${c.vitals.heart_rate ? '· HR ' + c.vitals.heart_rate : ''}` : '-'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">{format(parseISO(c.created_at), 'd MMM yyyy')}</td>
                    <td className="px-5 py-3 text-right">
                      <button className="text-sm text-primary-600 hover:underline">{t(lang, 'view')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New consultation modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t(lang, 'newConsultation')} size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">{t(lang, 'selectPatient')} *</label>
            <select className="input" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} required>
              <option value="">-- {t(lang, 'selectPatient')} --</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name} ({p.village})</option>)}
            </select>
          </div>

          {/* Vitals */}
          <div>
            <label className="label">{t(lang, 'vitals')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="relative">
                <Heart className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5 z-10" />
                <input className="input pl-9" placeholder="BP (sys)" value={form.bp_systolic} onChange={(e) => setForm({ ...form, bp_systolic: e.target.value })} />
              </div>
              <input className="input" placeholder="BP (dia)" value={form.bp_diastolic} onChange={(e) => setForm({ ...form, bp_diastolic: e.target.value })} />
              <div className="relative">
                <Activity className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5 z-10" />
                <input className="input pl-9" placeholder="HR (bpm)" value={form.heart_rate} onChange={(e) => setForm({ ...form, heart_rate: e.target.value })} />
              </div>
              <div className="relative">
                <Thermometer className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5 z-10" />
                <input className="input pl-9" placeholder="Temp (°C)" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} />
              </div>
            </div>
          </div>

          <div>
            <label className="label">{t(lang, 'chiefComplaint')}</label>
            <input className="input" value={form.chief_complaint} onChange={(e) => setForm({ ...form, chief_complaint: e.target.value })} placeholder="e.g. Fever for 3 days, cough" />
          </div>
          <div>
            <label className="label">{t(lang, 'diagnosis')}</label>
            <input className="input" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="e.g. Acute upper respiratory infection" />
          </div>

          {/* AI Decision Support */}
          <div className="bg-gradient-to-r from-secondary-50 to-primary-50 rounded-xl p-4 border border-secondary-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-secondary-600" />
                <span className="text-sm font-medium text-secondary-700">{t(lang, 'aiSuggestion')}</span>
              </div>
              <button type="button" onClick={getAISuggestion} disabled={aiLoading} className="btn-secondary text-xs py-1.5 px-3 bg-white">
                {aiLoading ? t(lang, 'loading') : t(lang, 'getAISuggestion')}
              </button>
            </div>
            <p className="text-xs text-secondary-600">Analyzes vitals and symptoms to suggest clinical guidance. Review before applying.</p>
          </div>

          <div>
            <label className="label">{t(lang, 'notes')}</label>
            <textarea className="input" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t(lang, 'notes')} />
          </div>

          {/* Prescriptions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">{t(lang, 'prescriptions')}</label>
              <button type="button" onClick={addRxRow} className="text-sm text-primary-600 hover:underline flex items-center gap-1"><Plus className="w-3.5 h-3.5" />{t(lang, 'addPrescription')}</button>
            </div>
            <div className="space-y-2">
              {rxList.map((rx, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-5 gap-2 p-3 bg-gray-50 rounded-lg">
                  <input className="input" placeholder={t(lang, 'medicine')} value={rx.medicine_name} onChange={(e) => updateRx(i, 'medicine_name', e.target.value)} />
                  <input className="input" placeholder={t(lang, 'dosage')} value={rx.dosage} onChange={(e) => updateRx(i, 'dosage', e.target.value)} />
                  <input className="input" placeholder={t(lang, 'frequency')} value={rx.frequency} onChange={(e) => updateRx(i, 'frequency', e.target.value)} />
                  <input className="input" placeholder={t(lang, 'duration')} value={rx.duration} onChange={(e) => updateRx(i, 'duration', e.target.value)} />
                  <div className="flex gap-1">
                    <input className="input flex-1" placeholder={t(lang, 'instructions')} value={rx.instructions} onChange={(e) => updateRx(i, 'instructions', e.target.value)} />
                    {rxList.length > 1 && <button type="button" onClick={() => removeRx(i)} className="p-2 rounded-lg hover:bg-error-50 text-gray-400 hover:text-error-600"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">{t(lang, 'cancel')}</button>
            <button type="submit" className="btn-primary">{t(lang, 'save')}</button>
          </div>
        </form>
      </Modal>

      {/* Detail modal */}
      <Modal open={!!detailConsult} onClose={() => setDetailConsult(null)} title={t(lang, 'clinicalRecords')} size="lg">
        {detailConsult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{detailConsult.patient?.full_name}</h3>
                <p className="text-sm text-gray-500">{format(parseISO(detailConsult.created_at), 'd MMM yyyy, h:mm a')}</p>
              </div>
            </div>

            {detailConsult.vitals && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {detailConsult.vitals.bp && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">{t(lang, 'bloodPressure')}</p><p className="font-semibold text-gray-900">{detailConsult.vitals.bp}</p></div>}
                {detailConsult.vitals.heart_rate && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">{t(lang, 'heartRate')}</p><p className="font-semibold text-gray-900">{detailConsult.vitals.heart_rate} bpm</p></div>}
                {detailConsult.vitals.temperature && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">{t(lang, 'temperature')}</p><p className="font-semibold text-gray-900">{detailConsult.vitals.temperature}°C</p></div>}
                {detailConsult.vitals.weight && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">{t(lang, 'weight')}</p><p className="font-semibold text-gray-900">{detailConsult.vitals.weight} kg</p></div>}
              </div>
            )}

            {detailConsult.chief_complaint && <div><p className="text-xs font-medium text-gray-500 uppercase mb-1">{t(lang, 'chiefComplaint')}</p><p className="text-sm text-gray-800">{detailConsult.chief_complaint}</p></div>}
            {detailConsult.diagnosis && <div><p className="text-xs font-medium text-gray-500 uppercase mb-1">{t(lang, 'diagnosis')}</p><p className="text-sm text-gray-800">{detailConsult.diagnosis}</p></div>}
            {detailConsult.notes && <div><p className="text-xs font-medium text-gray-500 uppercase mb-1">{t(lang, 'notes')}</p><p className="text-sm text-gray-800 whitespace-pre-wrap">{detailConsult.notes}</p></div>}

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">{t(lang, 'prescriptions')}</p>
              {prescriptions.length === 0 ? (
                <p className="text-sm text-gray-400">No prescriptions</p>
              ) : (
                <div className="space-y-2">
                  {prescriptions.map((rx) => (
                    <div key={rx.id} className="flex items-start gap-3 p-3 bg-primary-50/40 rounded-lg border border-primary-100">
                      <Pill className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{rx.medicine_name}</p>
                        <p className="text-xs text-gray-600">{[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(' · ')}</p>
                        {rx.instructions && <p className="text-xs text-gray-500 mt-0.5">{rx.instructions}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
