import React, { useState } from 'react';
import { SewingOrder, WorkshopSettings } from '../types';
import { formatDateVN, formatVND, formatNumber, formatKg } from '../utils/format';
import { useVisualViewport } from '../utils/useVisualViewport';
import { X, Copy, Check, Scissors } from 'lucide-react';

interface ReceiptModalProps {
  order: SewingOrder | null;
  settings: WorkshopSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  settings,
  onClose,
}) => {
  const viewportHeight = useVisualViewport();
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const totalQty = order.deliverQuantity || order.receiveQuantity;
  const isDelivered = order.status === 'DELIVERED';

  const shareText = `🧵 PHIẾU BÀN GIAO CÔNG ĐOẠN MAY
━━━━━━━━━━━━━━━━━━━━
🏠 ${settings.workshopName || 'Xưởng May'}
👤 Người thực hiện: ${settings.ownerName || 'Sanbier'}
📅 Ngày nhận: ${formatDateVN(order.receiveDate)} (${order.receiveDayOfWeek})
${order.deliveryDate ? `🚀 Ngày giao: ${formatDateVN(order.deliveryDate)} (${order.deliveryDayOfWeek})` : ''}
📍 Công đoạn: ${order.stageName}
💰 Đơn giá: ${formatVND(order.unitPrice)}/cái
📦 Số lượng: ${formatNumber(totalQty)} cái
⚖️ Kí vải: ${formatKg(order.deliveryFabricKg || order.receiveFabricKg)}
🏷️ Trạng thái: ${isDelivered ? 'ĐÃ GIAO' : (order.status === 'IN_PROGRESS' ? 'ĐÃ NHẬN (ĐANG LÀM)' : 'ĐÃ NHẬN (CHỜ LÀM)')}
━━━━━━━━━━━━━━━━━━━━
💵 TỔNG TIỀN CÔNG: ${formatVND(order.totalAmount)}
${order.note ? `📝 Ghi chú: ${order.note}` : ''}
━━━━━━━━━━━━━━━━━━━━
MayTrack Pro - Quản lý công đoạn may`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maxModalHeight = Math.min(Math.max(viewportHeight - 20, 360), 820);

  return (
    <div className="fixed md:absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col"
        style={{
          maxHeight: `${maxModalHeight}px`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Receipt Header Visual */}
        <div className="bg-slate-900 text-white p-4 text-center relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="w-9 h-9 mx-auto rounded-2xl bg-indigo-500/20 ring-2 ring-indigo-400 flex items-center justify-center mb-1.5">
            <Scissors className="w-4 h-4 text-indigo-300" />
          </div>
          <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
            {settings.workshopName || 'XƯỞNG MAY GIA CÔNG'}
          </h3>
          <p className="text-[10px] text-slate-400">PHIẾU ĐỐI SOÁT TIỀN CÔNG</p>
        </div>

        {/* Receipt Body (Scrollable with min-h-0) */}
        <div className="p-4 space-y-3 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="space-y-1 text-xs text-slate-600 pb-2.5 border-b border-dashed border-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Người phụ trách:</span>
              <strong className="text-slate-800">{settings.ownerName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ngày nhận hàng:</span>
              <span>{formatDateVN(order.receiveDate)} ({order.receiveDayOfWeek})</span>
            </div>
            {order.deliveryDate && (
              <div className="flex justify-between">
                <span className="text-slate-400">Ngày giao hàng:</span>
                <span className="font-semibold text-emerald-700">
                  {formatDateVN(order.deliveryDate)} ({order.deliveryDayOfWeek})
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Trạng thái:</span>
              <span className={`font-bold ${isDelivered ? 'text-emerald-600' : (order.status === 'IN_PROGRESS' ? 'text-amber-600' : 'text-blue-600')}`}>
                {isDelivered ? 'ĐÃ GIAO' : (order.status === 'IN_PROGRESS' ? 'ĐÃ NHẬN (ĐANG LÀM)' : 'ĐÃ NHẬN (CHỜ LÀM)')}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center py-0.5">
              <div>
                <strong className="text-slate-800 text-sm block">{order.stageName}</strong>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatVND(order.unitPrice)} × {formatNumber(totalQty)} cái
                </span>
              </div>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {formatVND(order.totalAmount)}
              </span>
            </div>

            {order.deliveryFabricKg || order.receiveFabricKg ? (
              <div className="flex justify-between text-slate-500 pt-0.5">
                <span>Khối lượng vải:</span>
                <span className="font-mono">{formatKg(order.deliveryFabricKg || order.receiveFabricKg)}</span>
              </div>
            ) : null}

            {order.note && (
              <div className="pt-0.5 text-[10px] text-slate-500 italic">
                * Ghi chú: {order.note}
              </div>
            )}
          </div>

          <div className="pt-2.5 border-t-2 border-slate-900 flex justify-between items-baseline">
            <span className="text-xs uppercase font-extrabold text-slate-900 tracking-wider">
              TỔNG CỘNG
            </span>
            <span className="text-xl font-black text-indigo-700 font-mono">
              {formatVND(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Receipt Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Đã copy text Zalo!' : 'Copy gửi Zalo'}
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
