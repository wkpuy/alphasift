import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'success' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        
        <div className="flex items-center gap-3 mb-4">
          {type === 'warning' && <AlertCircle className="text-amber-400" size={24} />}
          {type === 'danger' && <AlertCircle className="text-red-400" size={24} />}
          {type === 'success' && <CheckCircle className="text-emerald-400" size={24} />}
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>

        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={clsx(
              "flex-1 py-2.5 rounded-lg text-sm font-bold text-white transition-colors flex justify-center items-center gap-2",
              type === 'danger' && "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20",
              type === 'success' && "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20",
              type === 'warning' && "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20"
            )}
          >
            {type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
