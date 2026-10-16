import React, { useState, useEffect } from 'react';
import { StagePreset } from '../types';
import { useVisualViewport } from '../utils/useVisualViewport';
import { X, Plus, Trash2, Tag, Check } from 'lucide-react';

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
  const viewportHeight = useVisualViewport();
  const [list, setList] = useState<StagePreset[]>(presets);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState<number>(5000);

  useEffect(() => {
    setList(presets);
  }, [presets, isOpen]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newPreset: StagePreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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

  const handleUpdateName = (id: string, name: string) => {
    const next = list.map(p => p.id === id ? { ...p, name } : p);
    setList(next);
    onSavePresets(next);
  };

  const handleUpdatePrice = (id: string, price: number) => {
    const next = list.map(p => p.id === id ? { ...p, defaultUnitPrice: price } : p);
    setList(next);
    onSavePresets(next);
  };

  const maxModalHeight = Math.min(Math.max(viewportHeight - 20, 360), 840);

  return (
    <div className="fixed md:absolute inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        style={{ maxHeight: `${maxModalHeight}px` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-2 shrink-0 sm:hidden" />

        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-50 text-purple-600">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">Bảng Giá Công Đoạn May</h3>
              <p className="text-[10px] text-slate-500">Sửa trực tiếp tên & giá công đoạn bên dưới</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add New Preset Form */}
        <form onSubmit={handleAdd} className="p-3 bg-purple-50/60 border-b border-purple-100 flex gap-2 shrink-0">
          <input
            type="text"
            required
            placeholder="Tên công đoạn mới..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="relative w-28">
            <input
              type="number"
              step="100"
              required
              placeholder="Đơn giá"
              value={newPrice || ''}
              onChange={e => setNewPrice(Number(e.target.value))}
              className="w-full pl-2 pr-5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold font-mono text-purple-700 outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400 pointer-events-none">đ</span>
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold active:scale-95 transition-all flex items-center gap-1 shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm
          </button>
        </form>

        {/* List of Presets (Scrollable with min-h-0) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-2">
          <div className="flex items-center justify-between px-1 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
            <span>Tên công đoạn (bấm vào để sửa)</span>
            <span>Đơn giá (VNĐ/cái)</span>
          </div>

          {list.map((p, idx) => (
            <div
              key={p.id}
              className="p-2 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-1.5 transition-all hover:border-purple-200"
            >
              <span className="w-5 h-5 rounded-full bg-purple-50 text-purple-700 font-black text-[10px] flex items-center justify-center shrink-0">
                {idx + 1}
              </span>

              {/* Input Sửa Tên Công Đoạn */}
              <input
                type="text"
                required
                value={p.name}
                onChange={e => handleUpdateName(p.id, e.target.value)}
                placeholder="Tên công đoạn..."
                className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all truncate"
                title="Bấm để sửa tên công đoạn"
              />

              {/* Input Sửa Đơn Giá */}
              <div className="w-24 relative shrink-0">
                <input
                  type="number"
                  step="100"
                  required
                  value={p.defaultUnitPrice || ''}
                  onChange={e => handleUpdatePrice(p.id, Number(e.target.value))}
                  placeholder="Đơn giá"
                  className="w-full pl-2 pr-5 py-1.5 text-right rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold font-mono text-purple-700 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  title="Bấm để sửa đơn giá"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                  đ
                </span>
              </div>

              {/* Nút Xóa */}
              <button
                type="button"
                onClick={() => handleDelete(p.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shrink-0 active:scale-95"
                title="Xóa công đoạn này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 active:scale-98 transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Lưu Bảng Giá & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};