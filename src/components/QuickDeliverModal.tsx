import React, { useState, useEffect } from 'react';
import { SewingOrder } from '../types';
import { getTodayString, getDayOfWeekVN, formatVND, formatNumber } from '../utils/format';
import { useVisualViewport } from '../utils/useVisualViewport';
import { DateInputVN } from './DateInputVN';
import { CheckCircle2, X, Calendar, PackageCheck, Scale } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickDeliverModalProps {
  order: SewingOrder | null;
  onClose: () => void;
  onConfirm: (deliveredOrder: SewingOrder) => void;
}

export const QuickDeliverModal: React.FC<QuickDeliverModalProps> = ({
  order,
  onClose,
  onConfirm,
}) => {
  const viewportHeight = useVisualViewport();
  const [deliveryDate, setDeliveryDate] = useState(getTodayString());
  const [deliverQty, setDeliverQty] = useState<number>(0);
  const [deliveryFabricKg, setDeliveryFabricKg] = useState<string>('');

  useEffect(() => {
    if (order) {
      setDeliveryDate(getTodayString());
      setDeliverQty(order.receiveQuantity);
      setDeliveryFabricKg(order.receiveFabricKg != null ? String(order.receiveFabricKg) : '');
    }
  }, [order]);

  if (!order) return null;

  const dayOfWeek = getDayOfWeekVN(deliveryDate);
  const total = order.unitPrice * (deliverQty || 0);

  const handleConfirm = () => {
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.7 },
    });

    const updated: SewingOrder = {
      ...order,
      status: 'DELIVERED',
      deliveryDate,
      deliveryDayOfWeek: dayOfWeek,
      deliverQuantity: Number(deliverQty) || 0,
      deliveryFabricKg: deliveryFabricKg ? parseFloat(deliveryFabricKg) : null,
      totalAmount: total,
      updatedAt: Date.now(),
    };

    onConfirm(updated);
    onClose();
  };

  const maxModalHeight = Math.min(Math.max(viewportHeight - 20, 360), 820);

  return (
    <div className="fixed md:absolute inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl p-4 sm:p-5 border border-slate-100 animate-in slide-in-from-bottom duration-300 overflow-y-auto overscroll-contain pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        style={{
          maxHeight: `${maxModalHeight}px`,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto -mt-1 mb-2.5 sm:hidden" />

        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">Xác Nhận Giao Hàng</h3>
              <p className="text-[10px] text-slate-500">Chuyển sang ĐÃ GIAO & ghi nhận tiền công</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Details Preview */}
        <div className="my-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Công đoạn
              </span>
              <h4 className="text-sm sm:text-base font-bold text-indigo-700">{order.stageName}</h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Đơn giá
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-800 font-mono">
                {formatVND(order.unitPrice)}
              </p>
            </div>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-7">
              <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-500" />
                Ngày giao hàng <span className="text-[9px] font-normal text-slate-400">(ngày/tháng/năm)</span>
              </label>
              <DateInputVN
                value={deliveryDate}
                onChange={setDeliveryDate}
                required
                theme="emerald"
                showQuickButtons={true}
              />
            </div>
            <div className="col-span-5">
              <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                Thứ
              </label>
              <div className="h-[38px] px-2.5 flex items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 text-center">
                {dayOfWeek}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-7">
              <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <PackageCheck className="w-3 h-3 text-emerald-500" />
                Số lượng thực giao
              </label>
              <input
                type="number"
                min="1"
                required
                value={deliverQty || ''}
                onChange={e => setDeliverQty(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 font-mono outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="col-span-5">
              <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Scale className="w-3 h-3 text-teal-500" />
                Kí vải (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="VD: 8"
                value={deliveryFabricKg}
                onChange={e => setDeliveryFabricKg(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 font-mono outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Money Calculation Banner */}
        <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-between shadow-md shadow-emerald-500/20">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-100 block">
              Tổng tiền công thực nhận
            </span>
            <span className="text-xs text-emerald-100 font-mono">
              {formatVND(order.unitPrice)} × {formatNumber(deliverQty)} cái
            </span>
          </div>
          <div className="text-xl font-extrabold font-mono text-white">
            {formatVND(total)}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3.5 flex gap-2">
          <button
            onClick={onClose}
            className="w-24 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 active:scale-98 transition-all"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Xác Nhận ĐÃ GIAO & Lưu
          </button>
        </div>
      </div>
    </div>
  );
};
