import React, { useState, useEffect } from 'react';
import { SewingOrder, StagePreset, OrderStatus } from '../types';
import { getTodayString, getDayOfWeekVN, formatVND, formatNumber, formatDateVN } from '../utils/format';
import { useVisualViewport } from '../utils/useVisualViewport';
import { DateInputVN } from './DateInputVN';
import { X, Check, Calendar, Layers, Package, Scale, FileText, Send, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: SewingOrder) => void;
  editingOrder?: SewingOrder | null;
  presets: StagePreset[];
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingOrder,
  presets,
}) => {
  const viewportHeight = useVisualViewport();

  const [receiveDate, setReceiveDate] = useState(getTodayString());
  const [stageName, setStageName] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(8000);
  const [receiveQuantity, setReceiveQuantity] = useState<number>(10);
  const [receiveFabricKg, setReceiveFabricKg] = useState<string>('');
  const [status, setStatus] = useState<OrderStatus>('IN_PROGRESS');
  
  // Delivery field: để trống nếu chưa giao, điền ngày nếu đã giao
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [deliverQuantity, setDeliverQuantity] = useState<number>(10);
  const [deliveryFabricKg, setDeliveryFabricKg] = useState<string>('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (editingOrder) {
      setReceiveDate(editingOrder.receiveDate);
      setStageName(editingOrder.stageName);
      setUnitPrice(editingOrder.unitPrice);
      setReceiveQuantity(editingOrder.receiveQuantity);
      setReceiveFabricKg(editingOrder.receiveFabricKg != null ? String(editingOrder.receiveFabricKg) : '');
      setStatus(editingOrder.status === 'DELIVERED' ? 'IN_PROGRESS' : editingOrder.status);
      setDeliveryDate(editingOrder.deliveryDate || '');
      setDeliverQuantity(editingOrder.deliverQuantity ?? editingOrder.receiveQuantity);
      setDeliveryFabricKg(editingOrder.deliveryFabricKg != null ? String(editingOrder.deliveryFabricKg) : '');
      setNote(editingOrder.note || '');
    } else {
      setReceiveDate(getTodayString());
      setStageName(presets[0]?.name || 'TIM TIA');
      setUnitPrice(presets[0]?.defaultUnitPrice || 8000);
      setReceiveQuantity(10);
      setReceiveFabricKg('');
      setStatus('IN_PROGRESS'); // Mặc định là Đang Làm
      setDeliveryDate(''); // Mặc định chưa giao
      setDeliverQuantity(10);
      setDeliveryFabricKg('');
      setNote('');
    }
  }, [editingOrder, isOpen, presets]);

  if (!isOpen) return null;

  const receiveDay = getDayOfWeekVN(receiveDate);
  const deliveryDay = deliveryDate ? getDayOfWeekVN(deliveryDate) : '';
  const isDelivered = Boolean(deliveryDate);
  const finalDeliveredQty = deliverQuantity || receiveQuantity;
  const liveTotalAmount = unitPrice * (isDelivered ? finalDeliveredQty : receiveQuantity);

  const handleSelectPreset = (p: StagePreset) => {
    setStageName(p.name);
    setUnitPrice(p.defaultUnitPrice);
  };



  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!stageName.trim()) return;

    const finalStatus: OrderStatus = isDelivered ? 'DELIVERED' : status;
    const finalDeliveredNumber = isDelivered ? Number(deliverQuantity || receiveQuantity) : null;
    const finalDeliveredKg = isDelivered && deliveryFabricKg ? parseFloat(deliveryFabricKg) : null;

    const orderData: SewingOrder = {
      id: editingOrder ? editingOrder.id : `order_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      receiveDate,
      receiveDayOfWeek: receiveDay,
      stageName: stageName.trim(),
      unitPrice: Number(unitPrice) || 0,
      receiveQuantity: Number(receiveQuantity) || 1,
      receiveFabricKg: receiveFabricKg ? parseFloat(receiveFabricKg) : null,
      status: finalStatus,
      deliveryDate: isDelivered ? deliveryDate : null,
      deliveryDayOfWeek: isDelivered ? deliveryDay : null,
      deliverQuantity: finalDeliveredNumber,
      deliveryFabricKg: finalDeliveredKg,
      totalAmount: liveTotalAmount,
      note: note.trim() || undefined,
      createdAt: editingOrder ? editingOrder.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    if (isDelivered && (!editingOrder || editingOrder.status !== 'DELIVERED')) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }

    onSave(orderData);
    onClose();
  };

  // Chiều cao thích ứng theo viewport bàn phím ảo
  const maxModalHeight = Math.min(Math.max(viewportHeight - 20, 360), 840);

  return (
    <div 
      className="fixed md:absolute inset-0 z-50 flex items-end justify-center p-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-t-[32px] shadow-2xl flex flex-col border-t border-slate-100 animate-in slide-in-from-bottom duration-300 overflow-hidden"
        style={{
          maxHeight: `${maxModalHeight}px`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* iOS Handlebar */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2 shrink-0" />

        {/* Modal Header */}
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {editingOrder ? 'Chỉnh Sửa Công Đoạn May' : 'Phiếu Nhập Công Đoạn May'}
              </h3>
              <p className="text-[10px] text-slate-500">
                Ghi nhận sản lượng & tính tiền tự động
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3 flex-1 overscroll-contain">
          
          {/* Quick Preset Stage Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Gợi ý công đoạn nhanh
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold">
                Bấm để tự điền giá
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {presets.map(p => {
                const isSelected = stageName === p.name;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className={`ml-1 text-[10px] font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                      ({formatVND(p.defaultUnitPrice)})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 1: Tên công đoạn (7 cols) + Đơn giá (5 cols) */}
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-7">
              <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Tên công đoạn may <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: TIM TIA, Vắt sổ..."
                value={stageName}
                onChange={e => setStageName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="col-span-5">
              <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Đơn giá</span>
                <span className="text-[10px] text-indigo-600 font-mono font-bold">VNĐ/cái</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={unitPrice || ''}
                  onChange={e => setUnitPrice(Number(e.target.value))}
                  className="w-full pl-2.5 pr-6 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-indigo-700 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <span className="absolute right-2 top-2 text-[10px] font-bold text-slate-400">
                  đ
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Thứ trong tuần (Bên Trái) + Ngày Nhận Hàng (Bên Phải) */}
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-4">
              <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                Thứ
              </label>
              <div className="h-[38px] px-2.5 flex items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 text-center">
                {receiveDay || '-'}
              </div>
            </div>

            <div className="col-span-8">
              <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Ngày nhận hàng
              </label>
              <DateInputVN
                value={receiveDate}
                onChange={setReceiveDate}
                required
                theme="indigo"
              />
            </div>
          </div>

          {/* Row 3: Thứ giao (Bên Trái) + Ngày Giao Hàng (Bên Phải) */}
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-4">
              <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                Thứ giao
              </label>
              <div className={`h-[38px] px-2.5 flex items-center justify-center rounded-xl border text-xs font-bold text-center ${
                deliveryDate 
                  ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900 font-extrabold' 
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}>
                {deliveryDate ? (deliveryDay || '-') : 'Chưa giao'}
              </div>
            </div>

            <div className="col-span-8">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  Ngày giao hàng
                </label>
                {deliveryDate && (
                  <button
                    type="button"
                    onClick={() => setDeliveryDate('')}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-bold active:scale-95"
                  >
                    ✕ Bỏ ngày giao
                  </button>
                )}
              </div>

              {deliveryDate ? (
                <DateInputVN
                  value={deliveryDate}
                  onChange={setDeliveryDate}
                  theme="emerald"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setDeliveryDate(getTodayString())}
                  className="w-full h-[38px] px-3 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Điền ngày giao hàng</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 4: Số Lượng (7 cols) + Kí Vải (5 cols) */}
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-7">
              <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-blue-500" />
                Số lượng (cái)
              </label>
              <input
                type="number"
                min="1"
                required
                value={receiveQuantity || ''}
                onChange={e => {
                  const q = Number(e.target.value);
                  setReceiveQuantity(q);
                  if (deliveryDate) setDeliverQuantity(q);
                }}
                className="w-full h-[38px] px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="col-span-5">
              <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-teal-500" />
                Kí vải (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="VD: 8.5"
                value={receiveFabricKg}
                onChange={e => {
                  setReceiveFabricKg(e.target.value);
                  if (deliveryDate) setDeliveryFabricKg(e.target.value);
                }}
                className="w-full h-[38px] px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Row 5: TRẠNG THÁI TIẾN ĐỘ: Chỉ có 2 trường hợp [ Đang Làm ] và [ Chờ Làm ] */}
          {!deliveryDate ? (
            <div className="space-y-1.5 pt-1 border-t border-slate-100 animate-in fade-in duration-200">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                Trạng thái công đoạn:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('IN_PROGRESS')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border active:scale-98 ${
                    status === 'IN_PROGRESS'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25 ring-2 ring-amber-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${status === 'IN_PROGRESS' ? 'bg-white' : 'bg-amber-500'}`} />
                  <span>Đang Làm</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('PENDING')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border active:scale-98 ${
                    status === 'PENDING'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25 ring-2 ring-blue-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Clock className={`w-3.5 h-3.5 ${status === 'PENDING' ? 'text-white' : 'text-blue-500'}`} />
                  <span>Chờ Làm</span>
                </button>
              </div>
            </div>
          ) : (
            /* Khi đã có Ngày Giao Hàng -> Hiển thị huy hiệu ĐÃ GIAO gọn gàng */
            <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Trạng thái: Đã giao hàng</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-mono">
                {deliveryDay} ({formatDateVN(deliveryDate)})
              </span>
            </div>
          )}

          {/* Row 6: Ghi chú thêm */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Ghi chú thêm (Mã hàng, size...)
            </label>
            <input
              type="text"
              placeholder="VD: Mã hàng X-202, màu đen, size L..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </form>

        {/* STICKY FOOTER */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-white/95 backdrop-blur-md shrink-0 space-y-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {/* Live Total Calculation Row */}
          <div className="flex items-center justify-between px-1">
            <div>
              <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block">
                {isDelivered ? 'Tiền công thực nhận (Đã giao)' : 'Tiền công dự kiến (Đã nhận)'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {formatVND(unitPrice)} × {formatNumber(isDelivered ? finalDeliveredQty : receiveQuantity)} cái
              </span>
            </div>
            <div className={`text-lg font-black font-mono ${isDelivered ? 'text-emerald-700' : 'text-indigo-700'}`}>
              {formatVND(liveTotalAmount)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-24 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 active:scale-98 transition-all"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5 ${
                isDelivered
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
              }`}
            >
              <Check className="w-4 h-4" />
              {editingOrder 
                ? 'Lưu Thay Đổi' 
                : isDelivered 
                ? 'LƯU ĐƠN ĐÃ GIAO' 
                : (status === 'IN_PROGRESS' ? 'LƯU ĐÃ NHẬN (ĐANG LÀM)' : 'LƯU ĐÃ NHẬN (CHỜ LÀM)')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
