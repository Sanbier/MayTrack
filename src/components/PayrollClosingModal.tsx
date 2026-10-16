import React, { useState } from 'react';
import { SewingOrder, WorkshopSettings } from '../types';
import { PayrollPeriodInfo, formatVND, formatNumber, formatKg, formatDateVN } from '../utils/format';
import { useVisualViewport } from '../utils/useVisualViewport';
import { X, Check, Copy, Banknote, Calendar, PackageCheck, Clock, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PayrollClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodInfo: PayrollPeriodInfo | null;
  orders: SewingOrder[];
  settings: WorkshopSettings;
}

export const PayrollClosingModal: React.FC<PayrollClosingModalProps> = ({
  isOpen,
  onClose,
  periodInfo,
  orders,
  settings,
}) => {
  const viewportHeight = useVisualViewport();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !periodInfo) return null;

  // Lọc các đơn ĐÃ GIAO trong kỳ (đủ điều kiện tính tiền công lãnh kỳ này)
  const deliveredOrders = orders.filter(o => {
    if (o.status !== 'DELIVERED') return false;
    const targetDate = o.deliveryDate || o.receiveDate;
    return targetDate >= periodInfo.startDate && targetDate <= periodInfo.endDate;
  });

  // Các đơn ĐÃ NHẬN (chưa giao, dự kiến chuyển sang kỳ sau)
  const pendingOrders = orders.filter(o => {
    if (o.status === 'DELIVERED') return false;
    const inReceive = o.receiveDate >= periodInfo.startDate && o.receiveDate <= periodInfo.endDate;
    const inDelivery = o.deliveryDate ? (o.deliveryDate >= periodInfo.startDate && o.deliveryDate <= periodInfo.endDate) : false;
    return inReceive || inDelivery;
  });

  // Tính tổng
  const totalAmount = deliveredOrders.reduce((sum, o) => {
    const qty = o.deliverQuantity || o.receiveQuantity;
    return sum + (o.unitPrice * qty);
  }, 0);

  const totalQty = deliveredOrders.reduce((sum, o) => sum + (o.deliverQuantity || o.receiveQuantity), 0);
  const totalFabric = deliveredOrders.reduce((sum, o) => sum + (o.deliveryFabricKg || o.receiveFabricKg || 0), 0);

  const pendingAmount = pendingOrders.reduce((sum, o) => sum + (o.unitPrice * o.receiveQuantity), 0);

  // Soạn nội dung sao chép gửi Zalo
  const handleCopyZalo = () => {
    const lines = [
      `📋 BẢNG CHỐT CÔNG LÃNH TIỀN`,
      `👤 Thợ may: ${settings.ownerName || 'Sanbier'}`,
      `🏢 Xưởng: ${settings.workshopName || 'Xưởng May Gia Công'}`,
      `📅 Kỳ công: ${periodInfo.rangeText}`,
      `🏁 Ngày chốt công: ${periodInfo.closingDateFormatted} (${periodInfo.closingDayFormatted})`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `💵 TỔNG TIỀN CÔNG THỰC LÃNH: ${formatVND(totalAmount)}`,
      `📦 Tổng sản phẩm đã giao: ${formatNumber(totalQty)} cái`,
      `⚖️ Tổng kí vải đã may: ${formatKg(totalFabric)}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `CHI TIẾT CÁC CÔNG ĐOẠN ĐÃ GIAO (${deliveredOrders.length} đơn):`,
    ];

    deliveredOrders.forEach((o, idx) => {
      const q = o.deliverQuantity || o.receiveQuantity;
      const amt = o.unitPrice * q;
      const dDate = o.deliveryDate ? formatDateVN(o.deliveryDate) : formatDateVN(o.receiveDate);
      lines.push(`${idx + 1}. ${o.stageName}: ${formatNumber(q)} cái × ${formatVND(o.unitPrice)} = ${formatVND(amt)} (Giao: ${dDate})`);
    });

    if (pendingOrders.length > 0) {
      lines.push(`━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`⏳ Đơn đang làm / chờ làm (kỳ sau): ${pendingOrders.length} đơn (${formatVND(pendingAmount)})`);
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`MayTrack Pro - Chốt công lãnh tiền`);

    const fullText = lines.join('\n');
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const maxModalHeight = Math.min(Math.max(viewportHeight - 20, 360), 840);

  return (
    <div className="fixed md:absolute inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        style={{ maxHeight: `${maxModalHeight}px` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Handle */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5">
                BẢNG CHỐT CÔNG LÃNH TIỀN
              </h3>
              <p className="text-[10px] text-emerald-800 font-bold">
                Kỳ {periodInfo.label} • Chốt ngày {periodInfo.closingDateFormatted} ({periodInfo.closingDayFormatted})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3.5">
          {/* Hero Banner: Tổng tiền công lãnh */}
          <div className="relative overflow-hidden rounded-3xl p-4 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl shadow-emerald-600/20 ring-1 ring-white/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">
                TỔNG TIỀN CÔNG THỰC LÃNH
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white border border-white/30">
                Chốt mùng {periodInfo.closingDay}
              </span>
            </div>

            <div className="text-3xl font-black font-mono tracking-tight text-white mt-1">
              {formatVND(totalAmount)}
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/20 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-emerald-200 block font-semibold">Đã giao</span>
                <strong className="text-white font-mono text-sm">{deliveredOrders.length} đơn</strong>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block font-semibold">Sản phẩm</span>
                <strong className="text-white font-mono text-sm">{formatNumber(totalQty)} cái</strong>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block font-semibold">Kí vải</span>
                <strong className="text-white font-mono text-sm">{formatKg(totalFabric)}</strong>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-emerald-100/90 text-center font-medium">
              📅 Chu kỳ tính: {periodInfo.rangeText}
            </div>
          </div>

          {/* Chi tiết danh sách đơn đã giao */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <span className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500">
                <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                Đơn đã giao được tính tiền ({deliveredOrders.length})
              </span>
              <span className="text-emerald-700 font-mono">{formatVND(totalAmount)}</span>
            </div>

            {deliveredOrders.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400">
                Chưa có đơn nào được giao trong kỳ {periodInfo.label}.
              </div>
            ) : (
              <div className="space-y-2">
                {deliveredOrders.map((o, idx) => {
                  const qty = o.deliverQuantity || o.receiveQuantity;
                  const amt = o.unitPrice * qty;
                  const kg = o.deliveryFabricKg || o.receiveFabricKg;
                  return (
                    <div 
                      key={o.id}
                      className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <strong className="text-slate-900 truncate">{o.stageName}</strong>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 pl-6 flex items-center gap-2 flex-wrap">
                          <span>SL: <strong className="font-mono text-slate-700">{formatNumber(qty)}</strong> cái</span>
                          <span>Giá: <strong className="font-mono text-slate-700">{formatVND(o.unitPrice)}</strong></span>
                          {kg && <span>Kí: <strong className="font-mono text-slate-700">{formatKg(kg)}</strong></span>}
                          {o.deliveryDate && <span>Giao: <strong className="text-emerald-700">{formatDateVN(o.deliveryDate)}</strong></span>}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-emerald-700 text-sm">
                          {formatVND(amt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Đơn đang làm / chờ làm (chưa giao) */}
          {pendingOrders.length > 0 && (
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1 text-xs">
              <div className="flex items-center justify-between font-bold text-amber-900">
                <span className="flex items-center gap-1 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Đơn còn đang làm / chờ may ({pendingOrders.length})
                </span>
                <span className="font-mono text-amber-800">+{formatVND(pendingAmount)}</span>
              </div>
              <p className="text-[10px] text-amber-800/80">
                Các đơn này sẽ được tính vào tiền công của kỳ chốt tiếp theo sau khi may xong và giao hàng.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-4 pt-2 border-t border-slate-100 flex items-center gap-2 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-24 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 active:scale-95 transition-all"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleCopyZalo}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 ${
              copied 
                ? 'bg-emerald-600 shadow-emerald-600/30 ring-2 ring-emerald-300' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã sao chép! Dán gửi Zalo ngay</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Sao Chép Bảng Chốt Gửi Zalo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};