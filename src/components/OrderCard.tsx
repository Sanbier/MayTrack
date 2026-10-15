import React from 'react';
import { SewingOrder } from '../types';
import { formatVND, formatDateVN, formatNumber, formatKg } from '../utils/format';
import { CheckCircle2, Clock, AlertCircle, Calendar, ArrowRight, Edit3, Trash2, Send, Share2 } from 'lucide-react';

interface OrderCardProps {
  order: SewingOrder;
  onQuickDeliver: (order: SewingOrder) => void;
  onEdit: (order: SewingOrder) => void;
  onDelete: (id: string) => void;
  onShareReceipt: (order: SewingOrder) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onQuickDeliver,
  onEdit,
  onDelete,
  onShareReceipt,
}) => {
  const isDelivered = order.status === 'DELIVERED';
  const isInProgress = order.status === 'IN_PROGRESS';

  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-200 ios-glass border ${
      isDelivered 
        ? 'border-emerald-200/80 shadow-ios-card hover:shadow-ios-card-lg' 
        : 'border-slate-200/80 shadow-ios-card hover:shadow-ios-card-lg ring-1 ring-indigo-500/10'
    }`}>
      {/* Header: Date + Status */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          <span>Nhận:</span>
          <span className="font-semibold text-slate-700">{formatDateVN(order.receiveDate)}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
            {order.receiveDayOfWeek}
          </span>
        </div>

        {isDelivered ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ĐÃ GIAO
          </span>
        ) : isInProgress ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            ĐANG MAY
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            CHỜ MAY
          </span>
        )}
      </div>

      {/* Main Body: Stage Name & Metrics */}
      <div className="py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              {order.stageName}
            </h3>
            {order.note && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 italic">
                {order.note}
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-medium">Đơn giá</span>
            <span className="text-sm font-bold text-indigo-600 font-mono">
              {formatVND(order.unitPrice)}
            </span>
          </div>
        </div>

        {/* Quantities & Fabric info */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Số lượng nhận
            </span>
            <span className="text-sm font-bold text-slate-700 font-mono">
              {formatNumber(order.receiveQuantity)} <span className="text-[11px] font-normal text-slate-500">cái</span>
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Kí vải
            </span>
            <span className="text-sm font-bold text-slate-700 font-mono">
              {formatKg(order.receiveFabricKg)}
            </span>
          </div>
        </div>

        {/* Delivery Result (if delivered) */}
        {isDelivered && (
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-200/80">
            <div className="flex items-center justify-between text-xs text-emerald-800 font-medium">
              <span className="flex items-center gap-1">
                <Send className="w-3 h-3 text-emerald-600" />
                Giao ngày: {formatDateVN(order.deliveryDate || '')} ({order.deliveryDayOfWeek})
              </span>
              <span>SL giao: <strong className="font-mono">{formatNumber(order.deliverQuantity || order.receiveQuantity)}</strong> cái</span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between pt-1 border-t border-emerald-200/60">
              <span className="text-xs font-semibold text-emerald-900 uppercase tracking-wide">
                Thành tiền:
              </span>
              <span className="text-lg font-extrabold text-emerald-700 font-mono">
                {formatVND(order.totalAmount)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
        {!isDelivered ? (
          <button
            onClick={() => onQuickDeliver(order)}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-98 hover:brightness-105 transition-all flex items-center justify-center gap-1.5 mr-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Bấm giao hàng ngay
          </button>
        ) : (
          <button
            onClick={() => onShareReceipt(order)}
            className="py-1.5 px-3 rounded-xl bg-emerald-100/70 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold active:scale-95 transition-all flex items-center gap-1"
          >
            <Share2 className="w-3.5 h-3.5" />
            Xem phiếu
          </button>
        )}

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(order)}
            title="Chỉnh sửa"
            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/70 active:scale-95 transition-all"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(order.id)}
            title="Xóa"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50/70 active:scale-95 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
