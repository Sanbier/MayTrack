import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, Check } from 'lucide-react';

interface MonthPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string; // 'YYYY-MM' or 'ALL'
  onSelectMonth: (month: string) => void;
}

export const MonthPickerModal: React.FC<MonthPickerModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  onSelectMonth,
}) => {
  const currentYear = selectedMonth !== 'ALL' 
    ? parseInt(selectedMonth.split('-')[0], 10) 
    : new Date().getFullYear();

  const [year, setYear] = useState<number>(currentYear);

  if (!isOpen) return null;

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handlePick = (m: number) => {
    const formatted = `${year}-${String(m).padStart(2, '0')}`;
    onSelectMonth(formatted);
    onClose();
  };

  const handlePickAll = () => {
    onSelectMonth('ALL');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-slate-100 animate-in slide-in-from-bottom-6 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Chọn Tháng Xem Báo Cáo</h3>
              <p className="text-xs text-slate-500">Lọc đơn hàng & tiền công theo tháng</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Year Stepper */}
        <div className="flex items-center justify-between my-4 px-2">
          <button
            onClick={() => setYear(prev => prev - 1)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-base font-extrabold text-slate-800 font-mono">
            Năm {year}
          </span>
          <button
            onClick={() => setYear(prev => prev + 1)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 12 Months Grid */}
        <div className="grid grid-cols-3 gap-2">
          {months.map(m => {
            const mStr = `${year}-${String(m).padStart(2, '0')}`;
            const isSelected = selectedMonth === mStr;

            return (
              <button
                key={m}
                onClick={() => handlePick(m)}
                className={`py-3 rounded-2xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20 scale-102'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                Tháng {m}
              </button>
            );
          })}
        </div>

        {/* Action: Select All */}
        <div className="mt-4 pt-3 border-t border-slate-100 pb-[env(safe-area-inset-bottom)] space-y-2">
          <button
            onClick={handlePickAll}
            className={`w-full py-2.5 rounded-2xl text-xs font-bold transition-all border ${
              selectedMonth === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            Xem toàn bộ thời gian (Tất cả các tháng)
          </button>
        </div>
      </div>
    </div>
  );
};
