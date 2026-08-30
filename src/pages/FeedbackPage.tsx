import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Star, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/i18n';
import { supabase, type Feedback } from '../lib/supabase';
import { PageHeader, EmptyState } from '../components/ui';
import { format, parseISO } from 'date-fns';

export default function FeedbackPage() {
  const { lang, user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ subject: '', message: '', rating: 5 });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(50);
    setFeedbacks((data || []) as Feedback[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await supabase.from('feedback').insert({
      user_id: user?.id,
      subject: form.subject || null,
      message: form.message,
      rating: form.rating,
    });
    setForm({ subject: '', message: '', rating: 5 });
    setSubmitting(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t(lang, 'deleteConfirm'))) return;
    await supabase.from('feedback').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <PageHeader title={t(lang, 'feedback')} subtitle="Share your experience and suggestions" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback form */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t(lang, 'sendFeedback')}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t(lang, 'subject')}</label>
              <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Brief subject" />
            </div>
            <div>
              <label className="label">{t(lang, 'message')} *</label>
              <textarea className="input" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required placeholder="Your feedback..." />
            </div>
            <div>
              <label className="label">{t(lang, 'rating')}</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, rating: r })}
                    className={`p-1 ${r <= form.rating ? 'text-accent-500' : 'text-gray-300'} hover:text-accent-400 transition-colors`}
                  >
                    <Star className="w-6 h-6" fill={r <= form.rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              <Send className="w-4 h-4" />{submitting ? t(lang, 'loading') : t(lang, 'sendFeedback')}
            </button>
          </form>
        </div>

        {/* Feedback list */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Recent Feedback ({feedbacks.length})</h3>
            </div>
            {loading ? (
              <p className="text-sm text-gray-400 py-12 text-center">{t(lang, 'loading')}</p>
            ) : feedbacks.length === 0 ? (
              <EmptyState icon={MessageSquare} message={t(lang, 'noData')} />
            ) : (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {feedbacks.map((f) => (
                  <div key={f.id} className="p-5 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        {f.subject && <p className="font-medium text-gray-900 text-sm">{f.subject}</p>}
                        <p className="text-xs text-gray-500">{format(parseISO(f.created_at), 'd MMM yyyy, h:mm a')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {f.rating && (
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((r) => (
                              <Star key={r} className={`w-3.5 h-3.5 ${r <= f.rating! ? 'text-accent-500' : 'text-gray-200'}`} fill={r <= f.rating! ? 'currentColor' : 'none'} />
                            ))}
                          </div>
                        )}
                        <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded-lg hover:bg-error-50 text-gray-400 hover:text-error-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{f.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
