import React, { useState, useEffect } from 'react';
import { SewingOrder, StagePreset, OrderStatus } from '../types';
import { getTodayString, getDayOfWeekVN, formatVND, formatNumber } from '../utils/format';
import { useVisualViewport } from '../utils/useVisualViewport';
import { X, Check, Calendar, Layers, Package, Scale, FileText } from 'lucide-react';
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
  
  // Delivery fields
  const [deliveryDate, setDeliveryDate] = useState(getTodayString());
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
      setStatus(editingOrder.status);
      setDeliveryDate(editingOrder.deliveryDate || getTodayString());
      setDeliverQuantity(editingOrder.deliverQuantity ?? editingOrder.receiveQuantity);
      setDeliveryFabricKg(editingOrder.deliveryFabricKg != null ? String(editingOrder.deliveryFabricKg) : '');
      setNote(editingOrder.note || '');
    } else {
      setReceiveDate(getTodayString());
      setStageName(presets[0]?.name || 'TIM TIA');
      setUnitPrice(presets[0]?.defaultUnitPrice || 8000);
      setReceiveQuantity(10);
      setReceiveFabricKg('');
      setStatus('IN_PROGRESS');
      setDeliveryDate(getTodayString());
      setDeliverQuantity(10);
      setDeliveryFabricKg('');
      setNote('');
    }
  }, [editingOrder, isOpen, presets]);

  if (!isOpen) return null;

  const receiveDay = getDayOfWeekVN(receiveDate);
  const deliveryDay = getDayOfWeekVN(deliveryDate);
  const finalDeliveredQty = deliverQuantity || receiveQuantity;
  const liveTotalAmount = unitPrice * (status === 'DELIVERED' ? finalDeliveredQty : receiveQuantity);

  const handleSelectPreset = (p: StagePreset) => {
    setStageName(p.name);
    setUnitPrice(p.defaultUnitPrice);
  };

  const handleAddQty = (amount: number) => {
    setReceiveQuantity(prev => {
      const next = Math.max(1, prev + amount);
      if (status === 'DELIVERED') setDeliverQuantity(next);
      return next;
    });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!stageName.trim()) return;

    const orderData: SewingOrder = {
      id: editingOrder ? editingOrder.id : `order_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      receiveDate,
      receiveDayOfWeek: receiveDay,
      stageName: stageName.trim(),
      unitPrice: Number(unitPrice) || 0,
      receiveQuantity: Number(receiveQuantity) || 1,
      receiveFabricKg: receiveFabricKg ? parseFloat(receiveFabricKg) : null,
      status,
      deliveryDate: status === 'DELIVERED' ? deliveryDate : null,
      deliveryDayOfWeek: status === 'DELIVERED' ? deliveryDay : null,
      deliverQuantity: status === 'DELIVERED' ? Number(deliverQuantity || receiveQuantity) : null,
      deliveryFabricKg: status === 'DELIVERED' && deliveryFabricKg ? parseFloat(deliveryFabricKg) : null,
      totalAmount: liveTotalAmount,
      note: note.trim() || undefined,
      createdAt: editingOrder ? editingOrder.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    if (status === 'DELIVERED' && (!editingOrder || editingOrder.status !== 'DELIVERED')) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }

    onSave(orderData);
    onClose();
  };

  // Tính toán chiều cao tối đa thích ứng theo viewport bàn phím ảo & Safari Toolbar
  const maxModalHeight = Math.min(Math.max(viewportHeight - 20, 360), 820);

  return (
    <div 
      className="fixed md:absolute inset-0 z-50 flex items-end justify-center p-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 border-t border-slate-100"
        style={{
          maxHeight: `${maxModalHeight}px`,
          height: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* iOS Handlebar */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-2 shrink-0" />

        {/* Compact Header */}
        <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                {editingOrder ? 'Chỉnh Sửa Công Đoạn' : 'Phiếu Nhập Công Đoạn May'}
              </h2>
              <p className="text-[10px] text-slate-400">Ghi nhận sản lượng & tính tiền tự động</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body (Scrollable with min-h-0 auto-resize and overscroll-contain) */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-3 pb-8">
          {/* Quick Presets Carousel */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Gợi ý công đoạn nhanh
              </label>
              <span className="text-[10px] text-indigo-600 font-medium">Bấm để tự điền giá</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
              {presets.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 border ${
                    stageName === p.name
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <span>{p.name}</span>
                  <span className={`text-[10px] ${stageName === p.name ? 'text-indigo-200' : 'text-slate-400 font-mono'}`}>
                    ({formatVND(p.defaultUnitPrice)})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Row 1: Tên Công Đoạn (7 cols) + Đơn Giá (5 cols) - Auto Resize Side-by-side */}
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-7">
              <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                Tên công đoạn may <span className="text-rose-500">*</span>
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

          {/* Row 2: Ngày Nhận (7 cols) + Thứ Trong Tuần (5 cols) */}
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-7">
              <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-500" />
                Ngày nhận hàng
              </label>
              <input
                type="date"
                required
                value={receiveDate}
                onChange={e => setReceiveDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="col-span-5">
              <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                Thứ trong tuần
              </label>
              <div className="px-2.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 text-center">
                {receiveDay || '-'}
              </div>
            </div>
          </div>

          {/* Row 3: Số Lượng Nhận (7 cols) + Kí Vải (5 cols) */}
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-7">
              <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Package className="w-3 h-3 text-blue-500" />
                Số lượng nhận (cái)
              </label>
              <input
                type="number"
                min="1"
                required
                value={receiveQuantity || ''}
                onChange={e => {
                  const q = Number(e.target.value);
                  setReceiveQuantity(q);
                  if (status === 'DELIVERED') setDeliverQuantity(q);
                }}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              {/* Quick increment pills */}
              <div className="flex gap-1 mt-1">
                {[1, 5, 10, 50].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleAddQty(n)}
                    className="flex-1 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 active:scale-95"
                  >
                    +{n}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-5">
              <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Scale className="w-3 h-3 text-teal-500" />
                Kí vải (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="VD: 8.5"
                value={receiveFabricKg}
                onChange={e => setReceiveFabricKg(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <span className="text-[9px] text-slate-400 mt-1 block">Tùy chọn</span>
            </div>
          </div>

          {/* Row 4: Trạng Thái Đơn Hàng (Segmented Control) */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 mb-1 block">
              Trạng thái đơn hàng
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setStatus('PENDING')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  status === 'PENDING'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chờ may
              </button>
              <button
                type="button"
                onClick={() => setStatus('IN_PROGRESS')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  status === 'IN_PROGRESS'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đang may
              </button>
              <button
                type="button"
                onClick={() => setStatus('DELIVERED')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  status === 'DELIVERED'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đã giao
              </button>
            </div>
          </div>

          {/* Row 5: Chi Tiết Giao Hàng (chỉ hiện khi đã giao) */}
          {status === 'DELIVERED' && (
            <div className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Thông tin bàn giao & tính tiền
              </div>

              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-7">
                  <label className="text-[10px] font-semibold text-emerald-900 mb-0.5 block">
                    Ngày giao hàng
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-medium text-slate-800 outline-none"
                  />
                </div>
                <div className="col-span-5">
                  <label className="text-[10px] font-semibold text-emerald-900 mb-0.5 block">
                    Thứ giao
                  </label>
                  <div className="px-2 py-1.5 rounded-lg bg-emerald-100/60 border border-emerald-200 text-xs font-bold text-emerald-900 text-center">
                    {deliveryDay || '-'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-7">
                  <label className="text-[10px] font-semibold text-emerald-900 mb-0.5 block">
                    Số lượng thực giao
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={deliverQuantity || ''}
                    onChange={e => setDeliverQuantity(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-bold text-emerald-800 font-mono outline-none"
                  />
                </div>
                <div className="col-span-5">
                  <label className="text-[10px] font-semibold text-emerald-900 mb-0.5 block">
                    Kí vải giao
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="VD: 8"
                    value={deliveryFabricKg}
                    onChange={e => setDeliveryFabricKg(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-semibold text-slate-800 font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Row 6: Ghi chú thêm */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" />
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

        {/* STICKY FOOTER: TỔNG TIỀN + 2 NÚT HÀNH ĐỘNG (TỰ ĐỘNG KHÔNG BAO GIỜ CHỒNG ĐÈ) */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-white/95 backdrop-blur-md shrink-0 space-y-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {/* Live Total Calculation Row */}
          <div className="flex items-center justify-between px-1">
            <div>
              <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block">
                {status === 'DELIVERED' ? 'Tiền công thực nhận' : 'Tiền công dự kiến'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {formatVND(unitPrice)} × {formatNumber(status === 'DELIVERED' ? finalDeliveredQty : receiveQuantity)} cái
              </span>
            </div>
            <div className="text-lg font-black font-mono text-indigo-700">
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
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 active:scale-98 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {editingOrder ? 'Lưu Thay Đổi' : 'LƯU CÔNG ĐOẠN MAY'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
