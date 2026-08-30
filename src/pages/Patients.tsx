import { useEffect, useState, useCallback } from 'react';
import { Users, Plus, Search, Phone, MapPin, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/i18n';
import { supabase, type Patient } from '../lib/supabase';
import { PageHeader, Modal, EmptyState } from '../components/ui';

export default function Patients() {
  const { lang, user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: '', age: '', gender: 'male', phone: '', village: '', district: '',
    blood_group: '', allergies: '', chronic_conditions: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('patients').select('*').order('created_at', { ascending: false });
    if (search.trim()) {
      query = query.or(`full_name.ilike.%${search}%,village.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    const { data } = await query.limit(100);
    setPatients((data || []) as Patient[]);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditId(null);
    setForm({ full_name: '', age: '', gender: 'male', phone: '', village: '', district: '', blood_group: '', allergies: '', chronic_conditions: '' });
    setModalOpen(true);
  };

  const openEdit = (p: Patient) => {
    setEditId(p.id);
    setForm({
      full_name: p.full_name,
      age: p.age?.toString() || '',
      gender: p.gender || 'male',
      phone: p.phone || '',
      village: p.village || '',
      district: p.district || '',
      blood_group: p.blood_group || '',
      allergies: p.allergies || '',
      chronic_conditions: p.chronic_conditions || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      full_name: form.full_name,
      age: form.age ? parseInt(form.age) : null,
      gender: form.gender,
      phone: form.phone || null,
      village: form.village || null,
      district: form.district || null,
      blood_group: form.blood_group || null,
      allergies: form.allergies || null,
      chronic_conditions: form.chronic_conditions || null,
    };
    if (editId) {
      await supabase.from('patients').update(payload).eq('id', editId);
    } else {
      await supabase.from('patients').insert({ ...payload, registered_by: user?.id });
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t(lang, 'deleteConfirm'))) return;
    await supabase.from('patients').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <PageHeader
        title={t(lang, 'patients')}
        subtitle={`${patients.length} ${t(lang, 'patients').toLowerCase()}`}
        action={<button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />{t(lang, 'registerPatient')}</button>}
      />

      <div className="card mb-5">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input className="input pl-10" placeholder={t(lang, 'searchPatients')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-400 py-12 text-center">{t(lang, 'loading')}</p>
        ) : patients.length === 0 ? (
          <EmptyState icon={Users} message={t(lang, 'noData')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3">{t(lang, 'name')}</th>
                  <th className="px-5 py-3">{t(lang, 'age')}</th>
                  <th className="px-5 py-3">{t(lang, 'gender')}</th>
                  <th className="px-5 py-3 hidden md:table-cell">{t(lang, 'village')}</th>
                  <th className="px-5 py-3 hidden md:table-cell">{t(lang, 'phone')}</th>
                  <th className="px-5 py-3 text-right">{t(lang, 'actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold shrink-0">
                          {p.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.full_name}</p>
                          {p.blood_group && <p className="text-xs text-gray-400">Blood: {p.blood_group}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">{p.age || '-'}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 capitalize">{p.gender ? t(lang, p.gender) : '-'}</td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-700 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" />{p.village || '-'}</span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-700 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-400" />{p.phone || '-'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-error-50 text-gray-500 hover:text-error-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? t(lang, 'edit') : t(lang, 'registerPatient')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">{t(lang, 'fullName')} *</label>
              <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div>
              <label className="label">{t(lang, 'age')}</label>
              <input type="number" className="input" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} min="0" max="150" />
            </div>
            <div>
              <label className="label">{t(lang, 'gender')}</label>
              <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="male">{t(lang, 'male')}</option>
                <option value="female">{t(lang, 'female')}</option>
                <option value="other">{t(lang, 'other')}</option>
              </select>
            </div>
            <div>
              <label className="label">{t(lang, 'phone')}</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">{t(lang, 'bloodGroup')}</label>
              <select className="input" value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}>
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t(lang, 'village')}</label>
              <input className="input" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} />
            </div>
            <div>
              <label className="label">{t(lang, 'district')}</label>
              <input className="input" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t(lang, 'allergies')}</label>
              <input className="input" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="e.g. Penicillin, dust" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t(lang, 'chronicConditions')}</label>
              <input className="input" value={form.chronic_conditions} onChange={(e) => setForm({ ...form, chronic_conditions: e.target.value })} placeholder="e.g. Diabetes, Hypertension" />
            </div>
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
