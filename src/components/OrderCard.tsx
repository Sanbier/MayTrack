import React from 'react';
import { SewingOrder } from '../types';
import { formatVND, formatDateVN, formatNumber, formatKg } from '../utils/format';
import { CheckCircle2, Clock, Calendar, Edit3, Trash2, Send, Share2 } from 'lucide-react';

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

  const finalQty = isDelivered 
    ? (order.deliverQuantity || order.receiveQuantity) 
    : order.receiveQuantity;
  const finalFabricKg = isDelivered 
    ? (order.deliveryFabricKg || order.receiveFabricKg) 
    : order.receiveFabricKg;

  return (
    <div className={`relative overflow-hidden rounded-2xl p-3 bg-white border transition-all duration-150 shadow-xs hover:shadow-sm ${
      isDelivered 
        ? 'border-l-4 border-l-emerald-500 border-slate-200/90' 
        : isInProgress 
        ? 'border-l-4 border-l-amber-500 border-slate-200/90' 
        : 'border-l-4 border-l-blue-500 border-slate-200/90'
    }`}>
      {/* Row 1: Công đoạn + Trạng thái + Thành tiền */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight truncate">
            {order.stageName}
          </h3>

          {/* Compact Status Badge */}
          {isDelivered ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              ĐÃ GIAO
            </span>
          ) : isInProgress ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              ĐÃ NHẬN • ĐANG LÀM
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-900 shrink-0">
              <Clock className="w-2.5 h-2.5 text-blue-600" />
              ĐÃ NHẬN • CHỜ LÀM
            </span>
          )}
        </div>

        {/* Thành tiền to rõ */}
        <div className="text-right shrink-0">
          <span className={`text-sm sm:text-base font-black font-mono tracking-tight ${isDelivered ? 'text-emerald-700' : 'text-indigo-700'}`}>
            {formatVND(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* Row 2: Toàn bộ thông số ngắn gọn, liền mạch trên 1 hàng */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600 my-1.5">
        {/* Ngày nhận */}
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-indigo-500 shrink-0" />
          <span>Nhận: <strong className="text-slate-800">{formatDateVN(order.receiveDate)}</strong> ({order.receiveDayOfWeek})</span>
        </span>

        {/* Ngày giao (nếu đã giao) */}
        {isDelivered && order.deliveryDate && (
          <span className="flex items-center gap-1 text-emerald-800">
            <Send className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Giao: <strong className="text-emerald-900">{formatDateVN(order.deliveryDate)}</strong> ({order.deliveryDayOfWeek})</span>
          </span>
        )}

        <span className="text-slate-300">•</span>

        {/* Số lượng */}
        <span>
          SL: <strong className="font-mono text-slate-900 font-bold">{formatNumber(finalQty)}</strong> cái
        </span>

        {/* Đơn giá */}
        <span className="text-slate-400 font-mono text-[11px]">
          ({formatVND(order.unitPrice)}/c)
        </span>

        {/* Kí vải (nếu có) */}
        {finalFabricKg ? (
          <>
            <span className="text-slate-300">•</span>
            <span>
              Kí: <strong className="font-mono text-slate-800">{formatKg(finalFabricKg)}</strong>
            </span>
          </>
        ) : null}
      </div>

      {/* Row 3: Ghi chú nếu có */}
      {order.note && (
        <div className="text-[11px] text-slate-500 italic truncate mb-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100">
          * {order.note}
        </div>
      )}

      {/* Row 4: Thanh nút hành động tinh gọn */}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
        {/* Nút hành động chính */}
        {!isDelivered ? (
          <button
            onClick={() => onQuickDeliver(order)}
            className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Giao Hàng Ngay</span>
          </button>
        ) : (
          <button
            onClick={() => onShareReceipt(order)}
            className="py-1 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold active:scale-95 transition-all flex items-center gap-1 border border-emerald-200"
          >
            <Share2 className="w-3 h-3 text-emerald-600" />
            <span>Xem Phiếu Zalo</span>
          </button>
        )}

        {/* Nút Sửa & Xóa gọn gàng */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(order)}
            title="Chỉnh sửa công đoạn"
            className="py-1 px-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 active:scale-90 transition-all flex items-center gap-1 text-[11px] font-medium"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Sửa</span>
          </button>
          <button
            onClick={() => onDelete(order.id)}
            title="Xóa công đoạn"
            className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 active:scale-90 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
