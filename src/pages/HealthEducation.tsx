import { useEffect, useState, useCallback } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Play } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/i18n';
import { supabase, type HealthEducation } from '../lib/supabase';
import { PageHeader, Modal, EmptyState } from '../components/ui';

const CATEGORIES = [
  { value: 'maternal', label: 'Maternal Health', color: 'bg-pink-50 text-pink-700' },
  { value: 'child', label: 'Child Health', color: 'bg-blue-50 text-blue-700' },
  { value: 'hygiene', label: 'Hygiene', color: 'bg-teal-50 text-teal-700' },
  { value: 'emergency', label: 'Emergency Care', color: 'bg-red-50 text-red-700' },
  { value: 'chronic', label: 'Chronic Diseases', color: 'bg-amber-50 text-amber-700' },
  { value: 'public-health', label: 'Public Health', color: 'bg-green-50 text-green-700' },
];

export default function HealthEducation() {
  const { lang } = useAuth();
  const [items, setItems] = useState<HealthEducation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [readItem, setReadItem] = useState<HealthEducation | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', category: '', summary: '', content: '', video_url: '', language: 'en' });

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('health_education').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('category', filter);
    const { data } = await query;
    setItems((data || []) as HealthEducation[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditId(null);
    setForm({ title: '', category: '', summary: '', content: '', video_url: '', language: lang });
    setModalOpen(true);
  };

  const openEdit = (h: HealthEducation) => {
    setEditId(h.id);
    setForm({ title: h.title, category: h.category || '', summary: h.summary || '', content: h.content || '', video_url: h.video_url || '', language: h.language });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { title: form.title, category: form.category || null, summary: form.summary || null, content: form.content || null, video_url: form.video_url || null, language: form.language };
    if (editId) await supabase.from('health_education').update(payload).eq('id', editId);
    else await supabase.from('health_education').insert(payload);
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t(lang, 'deleteConfirm'))) return;
    await supabase.from('health_education').delete().eq('id', id);
    load();
  };

  const catLabel = (c: string) => CATEGORIES.find((cat) => cat.value === c)?.label || c;
  const catColor = (c: string) => CATEGORIES.find((cat) => cat.value === c)?.color || 'bg-gray-100 text-gray-700';

  return (
    <div>
      <PageHeader
        title={t(lang, 'education')}
        subtitle={t(lang, 'healthTopics')}
        action={<button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" />{t(lang, 'addNew')}</button>}
      />

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button onClick={() => setFilter('all')} className={`px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c.value} onClick={() => setFilter(c.value)} className={`px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${filter === c.value ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{c.label}</button>
        ))}
      </div>

      {loading ? <p className="text-sm text-gray-400 py-12 text-center">{t(lang, 'loading')}</p> :
       items.length === 0 ? <div className="card"><EmptyState icon={BookOpen} message={t(lang, 'noData')} /></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((h) => (
            <div key={h.id} className="card overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-50 relative flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-primary-400" />
                {h.video_url && <div className="absolute top-3 right-3 badge bg-white/80 text-primary-700"><Play className="w-3 h-3 mr-0.5" />Video</div>}
                <span className={`absolute bottom-3 left-3 badge ${catColor(h.category || '')}`}>{catLabel(h.category || '')}</span>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-gray-900 mb-1">{h.title}</h3>
                <p className="text-sm text-gray-600 flex-1 line-clamp-2">{h.summary}</p>
                <div className="flex items-center gap-2 mt-4">
                  <button onClick={() => setReadItem(h)} className="btn-secondary flex-1 text-sm">{t(lang, 'readMore')}</button>
                  <button onClick={() => openEdit(h)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(h.id)} className="p-2 rounded-lg hover:bg-error-50 text-gray-500 hover:text-error-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Read modal */}
      <Modal open={!!readItem} onClose={() => setReadItem(null)} title={readItem?.title || ''} size="lg">
        {readItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`badge ${catColor(readItem.category || '')}`}>{catLabel(readItem.category || '')}</span>
            </div>
            {readItem.summary && <p className="text-sm font-medium text-gray-700">{readItem.summary}</p>}
            {readItem.content && <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{readItem.content}</p>}
            {readItem.video_url && (
              <a href={readItem.video_url} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
                <Play className="w-4 h-4" /> Watch Video
              </a>
            )}
          </div>
        )}
      </Modal>

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? t(lang, 'edit') : t(lang, 'addNew')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">{t(lang, 'name')} *</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div><label className="label">{t(lang, 'category')}</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div><label className="label">Summary</label><input className="input" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
          <div><label className="label">Content</label><textarea className="input" rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
          <div><label className="label">Video URL</label><input className="input" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://..." /></div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">{t(lang, 'cancel')}</button>
            <button type="submit" className="btn-primary">{t(lang, 'save')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
