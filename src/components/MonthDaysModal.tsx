import React, { useState } from 'react';
import { SewingOrder } from '../types';
import { getTodayString, formatDateVN } from '../utils/format';
import { useVisualViewport } from '../utils/useVisualViewport';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthDaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string; // 'YYYY-MM' or 'ALL'
  selectedDate: string | null; // 'YYYY-MM-DD' or null
  orders: SewingOrder[];
  onSelectDate: (dateStr: string | null) => void;
  onSelectMonth: (monthStr: string) => void;
}

export const MonthDaysModal: React.FC<MonthDaysModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  selectedDate,
  orders,
  onSelectDate,
  onSelectMonth,
}) => {
  const viewportHeight = useVisualViewport();

  // Current viewing month/year in the calendar
  const initialBase = selectedMonth !== 'ALL' ? selectedMonth : new Date().toISOString().substring(0, 7);
  const [viewYear, setViewYear] = useState<number>(() => parseInt(initialBase.split('-')[0], 10));
  const [viewMonth, setViewMonth] = useState<number>(() => parseInt(initialBase.split('-')[1], 10));

  if (!isOpen) return null;

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const currentMonthStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
  // Monday = 0 ... Sunday = 6
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  // Today string YYYY-MM-DD
  const todayStr = getTodayString();

  // Map orders by date in this month
  const ordersByDate: { [dateStr: string]: { count: number; deliveredCount: number; amount: number } } = {};
  orders.forEach(o => {
    const dates = new Set<string>();
    if (o.receiveDate && o.receiveDate.startsWith(currentMonthStr)) dates.add(o.receiveDate);
    if (o.deliveryDate && o.deliveryDate.startsWith(currentMonthStr)) dates.add(o.deliveryDate);

    dates.forEach(d => {
      if (!ordersByDate[d]) {
        ordersByDate[d] = { count: 0, deliveredCount: 0, amount: 0 };
      }
      ordersByDate[d].count += 1;
      if (o.status === 'DELIVERED') {
        ordersByDate[d].deliveredCount += 1;
        ordersByDate[d].amount += o.totalAmount;
      }
    });
  });

  const handleDayClick = (dayNum: number) => {
    const dayStr = `${currentMonthStr}-${String(dayNum).padStart(2, '0')}`;
    onSelectMonth(currentMonthStr);
    onSelectDate(dayStr);
    onClose();
  };

  const handleSelectWholeMonth = () => {
    onSelectMonth(currentMonthStr);
    onSelectDate(null);
    onClose();
  };

  const handleSelectAllTime = () => {
    onSelectMonth('ALL');
    onSelectDate(null);
    onClose();
  };

  const maxModalHeight = Math.min(Math.max(viewportHeight - 20, 360), 820);

  return (
    <div 
      className="fixed md:absolute inset-0 z-50 flex items-end justify-center p-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-t-[32px] shadow-2xl p-4 sm:p-5 border-t border-slate-100 animate-in slide-in-from-bottom duration-300 pb-[calc(1.25rem+env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain"
        style={{
          maxHeight: `${maxModalHeight}px`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* iOS Handlebar */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto -mt-1 mb-2.5" />

        {/* Header: Month & Year Navigator */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight font-mono px-2">
              Tháng {viewMonth}/{viewYear}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Day-of-Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center my-1.5">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((dw, i) => (
            <span 
              key={dw} 
              className={`text-[10px] font-bold uppercase py-0.5 ${
                i === 6 ? 'text-rose-500' : 'text-slate-400'
              }`}
            >
              {dw}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Empty offset days before 1st of month */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`offset-${i}`} className="h-10 sm:h-11" />
          ))}

          {/* Days 1 to 31 */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayStr = `${currentMonthStr}-${String(dayNum).padStart(2, '0')}`;
            const isToday = dayStr === todayStr;
            const isSelected = selectedDate === dayStr;
            const hasData = !!ordersByDate[dayStr];
            const data = ordersByDate[dayStr];

            return (
              <button
                key={dayNum}
                onClick={() => handleDayClick(dayNum)}
                className={`h-10 sm:h-11 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-600/30'
                    : isToday
                    ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700 font-bold'
                    : hasData
                    ? 'bg-slate-50 border border-slate-200/90 text-slate-800 font-bold hover:bg-indigo-50'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-mono">{dayNum}</span>

                {/* Status Dot / Amount Indicator */}
                {hasData && (
                  <span className="flex items-center gap-0.5 mt-0.5">
                    {data.deliveredCount > 0 ? (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-500'}`} />
                    ) : (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-500'}`} />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 my-2 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Đã giao
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Đã nhận (Đang làm)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full border border-indigo-500 bg-indigo-100" />
            Hôm nay ({formatDateVN(todayStr)})
          </span>
        </div>

        {/* Quick Filter Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={handleSelectWholeMonth}
            className={`py-2 rounded-xl text-xs font-bold transition-all border ${
              selectedMonth === currentMonthStr && selectedDate === null
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            Xem cả Tháng {viewMonth}/{viewYear}
          </button>

          <button
            onClick={handleSelectAllTime}
            className={`py-2 rounded-xl text-xs font-bold transition-all border ${
              selectedMonth === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            Xem toàn bộ
          </button>
        </div>
      </div>
    </div>
  );
};
