import React, { useState } from 'react';
import { WorkshopSettings } from '../types';
import { X, Save, Home, User, Phone, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WorkshopSettings;
  onSave: (settings: WorkshopSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [form, setForm] = useState<WorkshopSettings>(settings);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-slate-100 animate-in slide-in-from-bottom-6 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">Cài Đặt Xưởng May</h3>
            <p className="text-xs text-slate-500">Thông tin xuất hiện trên phiếu thanh toán</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="my-4 space-y-3.5">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-indigo-500" />
              Tên xưởng may / Thương hiệu
            </label>
            <input
              type="text"
              required
              value={form.workshopName}
              onChange={e => setForm({ ...form, workshopName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-500" />
              Tên người thực hiện / Thợ may
            </label>
            <input
              type="text"
              required
              value={form.ownerName}
              onChange={e => setForm({ ...form, ownerName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-teal-500" />
              Số điện thoại (tùy chọn)
            </label>
            <input
              type="tel"
              placeholder="VD: 0912 345 678"
              value={form.phone || ''}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="pt-2 flex gap-2 pb-[env(safe-area-inset-bottom)]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 rounded-2xl text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-1.5 ${
                saved ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
              }`}
            >
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? 'Đã lưu!' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
