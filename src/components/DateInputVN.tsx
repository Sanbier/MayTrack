import React from 'react';
import { formatDateVN, getTodayString, getYesterdayString } from '../utils/format';
import { Calendar } from 'lucide-react';

interface DateInputVNProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  required?: boolean;
  className?: string;
  theme?: 'indigo' | 'emerald';
  showQuickButtons?: boolean;
}

export const DateInputVN: React.FC<DateInputVNProps> = ({
  value,
  onChange,
  required = false,
  className = '',
  theme = 'indigo',
  showQuickButtons = true,
}) => {
  const displayFormatted = formatDateVN(value); // '15/10/2026' (Ngày/Tháng/Năm)
  const today = getTodayString();
  const yesterday = getYesterdayString();

  const isToday = value === today;
  const isYesterday = value === yesterday;

  const activeBorder = theme === 'emerald'
    ? 'border-emerald-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 bg-white'
    : 'border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 bg-slate-50 focus-within:bg-white';

  const badgeColor = theme === 'emerald'
    ? 'text-emerald-700 bg-emerald-100/70'
    : 'text-indigo-600 bg-indigo-50';

  const iconColor = theme === 'emerald' ? 'text-emerald-600' : 'text-indigo-500';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Box hiển thị định dạng Ngày / Tháng / Năm */}
      <div className={`relative flex items-center justify-between px-3 py-2 rounded-xl border ${activeBorder} transition-all shadow-xs group`}>
        {/* Text hiển thị chuẩn Ngày / Tháng / Năm */}
        <div className="flex items-center gap-1.5 min-w-0 pointer-events-none">
          <Calendar className={`w-3.5 h-3.5 ${iconColor} shrink-0`} />
          <span className="font-mono text-xs font-bold text-slate-800 tracking-wider">
            {displayFormatted || 'DD/MM/YYYY'}
          </span>
        </div>

        {/* Nhãn nhỏ định dạng ngày/tháng/năm */}
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeColor} shrink-0 pointer-events-none uppercase tracking-wider`}>
          ngày/tháng/năm
        </span>

        {/* Input ẩn chuẩn để bấm mở bộ chọn ngày native của iOS/Android/Chrome */}
        <input
          type="date"
          required={required}
          value={value}
          onChange={e => {
            if (e.target.value) {
              onChange(e.target.value);
            }
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>

      {/* Quick buttons: Hôm nay / Hôm qua */}
      {showQuickButtons && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(today)}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all ${
              isToday 
                ? (theme === 'emerald' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-indigo-600 text-white shadow-xs')
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95'
            }`}
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => onChange(yesterday)}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all ${
              isYesterday 
                ? (theme === 'emerald' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-indigo-600 text-white shadow-xs')
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95'
            }`}
          >
            Hôm qua
          </button>
        </div>
      )}
    </div>
  );
};
