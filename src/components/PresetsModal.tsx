import React, { useState } from 'react';
import { StagePreset } from '../types';
import { formatVND } from '../utils/format';
import { X, Plus, Trash2, Tag, Check, DollarSign } from 'lucide-react';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: StagePreset[];
  onSavePresets: (presets: StagePreset[]) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  presets,
  onSavePresets,
}) => {
  const [list, setList] = useState<StagePreset[]>(presets);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState<number>(5000);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newPreset: StagePreset = {
      id: `preset_${Date.now()}`,
      name: newName.trim(),
      defaultUnitPrice: Number(newPrice) || 0,
      color: 'indigo',
    };

    const next = [...list, newPreset];
    setList(next);
    onSavePresets(next);
    setNewName('');
    setNewPrice(5000);
  };

  const handleDelete = (id: string) => {
    const next = list.filter(p => p.id !== id);
    setList(next);
    onSavePresets(next);
  };

  const handleUpdatePrice = (id: string, price: number) => {
    const next = list.map(p => p.id === id ? { ...p, defaultUnitPrice: price } : p);
    setList(next);
    onSavePresets(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Bảng Giá Công Đoạn Mẫu</h3>
              <p className="text-xs text-slate-500">Cấu hình công đoạn để chọn nhanh 1 chạm</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add New Preset Form */}
        <form onSubmit={handleAdd} className="p-4 bg-slate-50 border-b border-slate-100 flex gap-2">
          <input
            type="text"
            required
            placeholder="Tên công đoạn mới..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="relative w-28">
            <input
              type="number"
              step="500"
              required
              placeholder="Đơn giá"
              value={newPrice || ''}
              onChange={e => setNewPrice(Number(e.target.value))}
              className="w-full pl-2 pr-6 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold font-mono text-purple-700 outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-400">đ</span>
          </div>
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold active:scale-95 transition-all flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm
          </button>
        </form>

        {/* List of Presets */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {list.map(p => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm"
            >
              <div className="flex-1 mr-2">
                <span className="text-xs font-bold text-slate-800 block">{p.name}</span>
                <span className="text-[11px] font-medium text-slate-400">Đơn giá áp dụng</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="500"
                  value={p.defaultUnitPrice}
                  onChange={e => handleUpdatePrice(p.id, Number(e.target.value))}
                  className="w-24 px-2 py-1 text-right text-xs font-bold font-mono text-indigo-700 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 active:scale-98 transition-all"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
};
