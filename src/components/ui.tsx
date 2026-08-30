import { type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/i18n';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, color = 'primary', trend }: {
  icon: any; label: string; value: string | number; color?: string; trend?: string;
}) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    secondary: 'bg-secondary-50 text-secondary-600',
    accent: 'bg-accent-50 text-accent-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    error: 'bg-error-50 text-error-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && <p className="text-xs text-gray-400">{trend}</p>}
        </div>
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!open) return null;
  const sizeMap = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${sizeMap[size]} my-8`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <Icon className="w-12 h-12 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function Badge({ status, children }: { status: string; children: ReactNode }) {
  const map: Record<string, string> = {
    scheduled: 'bg-secondary-50 text-secondary-700',
    completed: 'bg-success-50 text-success-700',
    cancelled: 'bg-error-50 text-error-700',
    'no-show': 'bg-warning-50 text-warning-700',
    low: 'bg-success-50 text-success-700',
    medium: 'bg-warning-50 text-warning-700',
    high: 'bg-error-50 text-error-700',
    pending: 'bg-warning-50 text-warning-700',
    eligible: 'bg-success-50 text-success-700',
    approved: 'bg-success-50 text-success-700',
    rejected: 'bg-error-50 text-error-700',
  };
  return <span className={`badge ${map[status] || 'bg-gray-100 text-gray-700'}`}>{children}</span>;
}

export function ConfirmToast({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  const { lang } = useAuth();
  return (
    <div className="fixed bottom-5 right-5 z-50 card p-4 shadow-lg max-w-sm">
      <p className="text-sm text-gray-700 mb-3">{message}</p>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="btn-secondary text-sm">{t(lang, 'cancel')}</button>
        <button onClick={onConfirm} className="btn-danger text-sm">{t(lang, 'delete')}</button>
      </div>
    </div>
  );
}
