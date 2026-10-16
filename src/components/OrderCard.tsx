import React from 'react';
import { SewingOrder } from '../types';
import { formatVND, formatDateVN, formatNumber, formatKg, getDeliveryUrgency, getDayOfWeekVN } from '../utils/format';
import { CheckCircle2, Clock, Calendar, Edit3, Trash2, Send, Share2, AlertTriangle } from 'lucide-react';

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
  const urgency = getDeliveryUrgency(order.deliveryDate, order.status);

  const finalQty = isDelivered 
    ? (order.deliverQuantity || order.receiveQuantity) 
    : order.receiveQuantity;
  const finalFabricKg = isDelivered 
    ? (order.deliveryFabricKg || order.receiveFabricKg) 
    : order.receiveFabricKg;

  // Đường viền màu nhận diện + Báo động nếu còn 1 ngày, hôm nay hoặc quá hạn
  const baseBorder = isDelivered 
    ? 'border-l-4 border-l-emerald-500 border-slate-200/90' 
    : urgency.level === 'overdue'
    ? 'border-l-4 border-l-rose-600 ring-2 ring-rose-400 bg-rose-50/15'
    : urgency.level === 'today'
    ? 'border-l-4 border-l-rose-500 ring-2 ring-amber-400 bg-amber-50/20'
    : urgency.level === 'tomorrow'
    ? 'border-l-4 border-l-amber-500 ring-2 ring-amber-400/80 bg-amber-50/20'
    : isInProgress 
    ? 'border-l-4 border-l-blue-500 border-slate-200/90' 
    : 'border-l-4 border-l-amber-500 border-slate-200/90';

  return (
    <div className={`relative overflow-hidden rounded-2xl p-3 bg-white border transition-all duration-150 shadow-xs hover:shadow-sm ${baseBorder}`}>
      {/* Row 1: Công đoạn + Trạng thái + Báo Động Hạn Giao + Thành tiền */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
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
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-900 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              ĐÃ NHẬN • ĐANG LÀM
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 shrink-0">
              <Clock className="w-2.5 h-2.5 text-amber-600" />
              ĐÃ NHẬN • CHỜ LÀM
            </span>
          )}

          {/* BÁO ĐỘNG HẠN GIAO: Chỉ báo động khi CÒN 1 NGÀY, HÔM NAY hoặc QUÁ HẠN */}
          {urgency.level === 'tomorrow' && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] bg-amber-500 text-white font-extrabold animate-pulse shadow-xs ring-1 ring-amber-300 shrink-0">
              <AlertTriangle className="w-3 h-3" />
              ⚠️ CÒN 1 NGÀY GIAO
            </span>
          )}
          {urgency.level === 'today' && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] bg-rose-500 text-white font-extrabold animate-pulse shadow-xs ring-1 ring-rose-300 shrink-0">
              <AlertTriangle className="w-3 h-3" />
              🚨 HÔM NAY PHẢI GIAO
            </span>
          )}
          {urgency.level === 'overdue' && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] bg-rose-600 text-white font-extrabold animate-pulse shadow-xs shrink-0">
              <AlertTriangle className="w-3 h-3" />
              ⛔ QUÁ HẠN {Math.abs(urgency.diffDays || 0)}N
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

      {/* Row 2: Thông số sắp xếp 2 Hàng x 2 Cột chuẩn đối xứng: Nhận - SL / Giao - Kí */}
      {isDelivered ? (
        <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs text-slate-600 my-2">
          {/* Hàng 1 - Trái: Ngày Nhận */}
          <div className="flex items-center gap-1 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">
              Nhận: <strong className="text-slate-800">{formatDateVN(order.receiveDate)}</strong>{' '}
              <span className="text-slate-500 text-[11px]">({order.receiveDayOfWeek})</span>
            </span>
          </div>

          {/* Hàng 1 - Phải: Số lượng & Đơn giá */}
          <div className="text-right shrink-0 whitespace-nowrap">
            <span>
              SL: <strong className="font-mono text-slate-900 font-bold">{formatNumber(finalQty)}</strong> cái{' '}
              <span className="text-slate-400 font-mono text-[11px]">({formatVND(order.unitPrice)}/c)</span>
            </span>
          </div>

          {/* Hàng 2 - Trái: Ngày Giao */}
          <div className="flex items-center gap-1 min-w-0 text-emerald-800">
            <Send className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              Giao: <strong className="text-emerald-900">{formatDateVN(order.deliveryDate || order.receiveDate)}</strong>{' '}
              <span className="text-emerald-700/80 text-[11px]">({order.deliveryDayOfWeek || order.receiveDayOfWeek})</span>
            </span>
          </div>

          {/* Hàng 2 - Phải: Kí vải */}
          <div className="text-right shrink-0 whitespace-nowrap">
            {finalFabricKg ? (
              <span>
                Kí: <strong className="font-mono text-slate-800 font-bold">{formatKg(finalFabricKg)}</strong>
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">
                Kí: <span className="font-mono">-</span>
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Nhóm Đã Nhận (Chưa Giao) cũng chia 2 Hàng x 2 Cột */
        <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs text-slate-600 my-2">
          {/* Hàng 1 - Trái: Ngày Nhận */}
          <div className="flex items-center gap-1 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">
              Nhận: <strong className="text-slate-800">{formatDateVN(order.receiveDate)}</strong>{' '}
              <span className="text-slate-500 text-[11px]">({order.receiveDayOfWeek})</span>
            </span>
          </div>

          {/* Hàng 1 - Phải: Số lượng & Đơn giá */}
          <div className="text-right shrink-0 whitespace-nowrap">
            <span>
              SL: <strong className="font-mono text-slate-900 font-bold">{formatNumber(finalQty)}</strong> cái{' '}
              <span className="text-slate-400 font-mono text-[11px]">({formatVND(order.unitPrice)}/c)</span>
            </span>
          </div>

          {/* Hàng 2 - Trái: Hẹn giao hàng hoặc tiến độ may */}
          <div className="flex items-center gap-1 min-w-0 text-[11px]">
            {order.deliveryDate ? (
              <span className={`flex items-center gap-1 truncate ${
                urgency.level === 'tomorrow' ? 'text-amber-800 font-bold' :
                urgency.level === 'today' || urgency.level === 'overdue' ? 'text-rose-800 font-bold' :
                'text-indigo-900 font-semibold'
              }`}>
                <Send className={`w-3.5 h-3.5 shrink-0 ${
                  urgency.level === 'tomorrow' ? 'text-amber-600' :
                  urgency.level === 'today' || urgency.level === 'overdue' ? 'text-rose-600' :
                  'text-indigo-600'
                }`} />
                <span>
                  Hẹn giao: <strong>{formatDateVN(order.deliveryDate)}</strong> ({order.deliveryDayOfWeek || getDayOfWeekVN(order.deliveryDate)})
                </span>
              </span>
            ) : isInProgress ? (
              <span className="flex items-center gap-1 text-blue-700 font-semibold truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                Đang may gia công
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-700 font-semibold truncate">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Chờ may gia công
              </span>
            )}
          </div>

          {/* Hàng 2 - Phải: Kí vải */}
          <div className="text-right shrink-0 whitespace-nowrap">
            {finalFabricKg ? (
              <span>
                Kí: <strong className="font-mono text-slate-800 font-bold">{formatKg(finalFabricKg)}</strong>
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">
                Kí: <span className="font-mono">-</span>
              </span>
            )}
          </div>
        </div>
      )}

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
