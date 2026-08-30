import { useEffect, useState, useCallback } from 'react';
import { Pill, Plus, Edit2, Trash2, AlertTriangle, CalendarClock } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/i18n';
import { supabase, type InventoryItem } from '../lib/supabase';
import { PageHeader, Modal, EmptyState } from '../components/ui';
import { format, parseISO, differenceInDays, isAfter } from 'date-fns';

export default function Inventory() {
  const { lang } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    medicine_name: '', category: '', quantity: '', unit: 'tablets',
    reorder_level: '10', expiry_date: '', batch_no: '', facility: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('inventory').select('*').order('medicine_name');
    setItems((data || []) as InventoryItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditId(null);
    setForm({ medicine_name: '', category: '', quantity: '', unit: 'tablets', reorder_level: '10', expiry_date: '', batch_no: '', facility: '' });
    setModalOpen(true);
  };

  const openEdit = (i: InventoryItem) => {
    setEditId(i.id);
    setForm({
      medicine_name: i.medicine_name,
      category: i.category || '',
      quantity: i.quantity.toString(),
      unit: i.unit || 'tablets',
      reorder_level: i.reorder_level.toString(),
      expiry_date: i.expiry_date ? format(parseISO(i.expiry_date), 'yyyy-MM-dd') : '',
      batch_no: i.batch_no || '',
      facility: i.facility || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      medicine_name: form.medicine_name,
      category: form.category || null,
      quantity: parseInt(form.quantity) || 0,
      unit: form.unit,
      reorder_level: parseInt(form.reorder_level) || 0,
      expiry_date: form.expiry_date || null,
      batch_no: form.batch_no || null,
      facility: form.facility || null,
    };
    if (editId) {
      await supabase.from('inventory').update(payload).eq('id', editId);
    } else {
      await supabase.from('inventory').insert(payload);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t(lang, 'deleteConfirm'))) return;
    await supabase.from('inventory').delete().eq('id', id);
    load();
  };

  const lowStockCount = items.filter((i) => i.quantity <= i.reorder_level).length;
  const expiringSoon = items.filter((i) => i.expiry_date && isAfter(parseISO(i.expiry_date), new Date()) && differenceInDays(parseISO(i.expiry_date), new Date()) <= 90).length;

  return (
    <div>
      <PageHeader
        title={t(lang, 'inventory')}
        subtitle={`${lowStockCount} low stock · ${expiringSoon} expiring soon`}
        action={<button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />{t(lang, 'addNew')}</button>}
      />

      <div className="card overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-400 py-12 text-center">{t(lang, 'loading')}</p>
        ) : items.length === 0 ? (
          <EmptyState icon={Pill} message={t(lang, 'noData')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3">{t(lang, 'medicineName')}</th>
                  <th className="px-5 py-3 hidden sm:table-cell">{t(lang, 'category')}</th>
                  <th className="px-5 py-3">{t(lang, 'quantity')}</th>
                  <th className="px-5 py-3 hidden md:table-cell">{t(lang, 'expiryDate')}</th>
                  <th className="px-5 py-3 hidden lg:table-cell">{t(lang, 'batchNo')}</th>
                  <th className="px-5 py-3 hidden lg:table-cell">{t(lang, 'facility')}</th>
                  <th className="px-5 py-3 text-right">{t(lang, 'actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((i) => {
                  const lowStock = i.quantity <= i.reorder_level;
                  const expiring = i.expiry_date && isAfter(parseISO(i.expiry_date), new Date()) && differenceInDays(parseISO(i.expiry_date), new Date()) <= 90;
                  const expired = i.expiry_date && !isAfter(parseISO(i.expiry_date), new Date());
                  return (
                    <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{i.medicine_name}</span>
                          {lowStock && <span className="badge bg-warning-50 text-warning-700"><AlertTriangle className="w-3 h-3 mr-0.5" />Low</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell text-sm text-gray-600">{i.category || '-'}</td>
                      <td className="px-5 py-3">
                        <span className={`text-sm font-medium ${lowStock ? 'text-warning-700' : 'text-gray-900'}`}>{i.quantity} {i.unit}</span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        {i.expiry_date ? (
                          <span className={`inline-flex items-center gap-1 text-sm ${expired ? 'text-error-600' : expiring ? 'text-warning-600' : 'text-gray-700'}`}>
                            {expiring && <CalendarClock className="w-3.5 h-3.5" />}{format(parseISO(i.expiry_date), 'd MMM yyyy')}
                            {expired && ' (expired)'}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell text-sm text-gray-600">{i.batch_no || '-'}</td>
                      <td className="px-5 py-3 hidden lg:table-cell text-sm text-gray-600">{i.facility || '-'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(i)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(i.id)} className="p-2 rounded-lg hover:bg-error-50 text-gray-500 hover:text-error-600"><Trash2 className="w-4 h-4" /></button>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? t(lang, 'edit') : t(lang, 'addNew')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="label">{t(lang, 'medicineName')} *</label><input className="input" value={form.medicine_name} onChange={(e) => setForm({ ...form, medicine_name: e.target.value })} required /></div>
            <div><label className="label">{t(lang, 'category')}</label><input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="antibiotic, analgesic..." /></div>
            <div><label className="label">{t(lang, 'quantity')} *</label><input type="number" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required min="0" /></div>
            <div><label className="label">{t(lang, 'unit')}</label><select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}><option>tablets</option><option>capsules</option><option>sachets</option><option>vials</option><option>bottles</option><option>tubes</option></select></div>
            <div><label className="label">{t(lang, 'reorderLevel')}</label><input type="number" className="input" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} min="0" /></div>
            <div><label className="label">{t(lang, 'expiryDate')}</label><input type="date" className="input" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
            <div><label className="label">{t(lang, 'batchNo')}</label><input className="input" value={form.batch_no} onChange={(e) => setForm({ ...form, batch_no: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="label">{t(lang, 'facility')}</label><input className="input" value={form.facility} onChange={(e) => setForm({ ...form, facility: e.target.value })} placeholder="PHC / SC name" /></div>
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
