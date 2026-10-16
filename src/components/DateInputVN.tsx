import React from 'react';
import { formatDateVN } from '../utils/format';
import { Calendar, X } from 'lucide-react';

interface DateInputVNProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  required?: boolean;
  className?: string;
  theme?: 'indigo' | 'emerald';
  placeholder?: string;
  allowClear?: boolean;
}

export const DateInputVN: React.FC<DateInputVNProps> = ({
  value,
  onChange,
  required = false,
  className = '',
  theme = 'indigo',
  placeholder = 'Chọn ngày',
  allowClear = false,
}) => {
  const displayFormatted = formatDateVN(value);

  const activeBorder = theme === 'emerald'
    ? 'border-emerald-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 bg-white'
    : 'border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 bg-slate-50 focus-within:bg-white';

  const iconColor = theme === 'emerald' ? 'text-emerald-600' : 'text-indigo-500';

  return (
    <div className={`relative flex items-center justify-between px-3 h-[38px] rounded-xl border ${activeBorder} transition-all shadow-xs group ${className}`}>
      {/* Text hiển thị chuẩn Ngày / Tháng / Năm */}
      <div className="flex items-center gap-2 min-w-0 pointer-events-none">
        <Calendar className={`w-4 h-4 ${iconColor} shrink-0`} />
        {displayFormatted ? (
          <span className="font-mono text-xs font-bold text-slate-800 tracking-wider">
            {displayFormatted}
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-medium tracking-wide">
            {placeholder}
          </span>
        )}
      </div>

      {/* Nút xóa nhanh nếu có ngày */}
      {allowClear && value ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange('');
          }}
          className="relative z-20 p-1 text-slate-400 hover:text-rose-500 rounded-md hover:bg-slate-100 transition-all"
          title="Xóa ngày"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : null}

      {/* Input ẩn chuẩn để bấm mở bộ chọn ngày native của iOS/Android/Chrome */}
      <input
        type="date"
        required={required}
        value={value}
        onChange={e => {
          onChange(e.target.value || '');
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
    </div>
  );
};
