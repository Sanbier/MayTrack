import React, { useState, useEffect } from 'react';
import { SewingOrder, StagePreset, OrderStatus } from '../types';
import { getTodayString, getDayOfWeekVN, formatVND } from '../utils/format';
import { X, Check, Plus, Minus, Sparkles, Calendar, Layers, DollarSign, Package, Scale, FileText } from 'lucide-react';
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
      // Reset form
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300 border border-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Sheet Top Bar Handle */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingOrder ? 'Chỉnh Sửa Công Đoạn' : 'Thêm Công Đoạn May Mới'}
              </h2>
              <p className="text-xs text-slate-500">Ghi nhận công việc & theo dõi tiền công</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Quick Presets Carousel */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Gợi ý công đoạn nhanh
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
              {presets.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 border ${
                    stageName === p.name
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <span>{p.name}</span>
                  <span className={`text-[10px] ${stageName === p.name ? 'text-indigo-200' : 'text-slate-400'}`}>
                    ({formatVND(p.defaultUnitPrice)})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Công Đoạn Name & Đơn Giá */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                Tên công đoạn <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: TIM TIA, Vắt sổ..."
                value={stageName}
                onChange={e => setStageName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Đơn giá (VNĐ/cái)</span>
                <span className="text-indigo-600 font-mono text-xs">{formatVND(unitPrice)}</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={unitPrice || ''}
                  onChange={e => setUnitPrice(Number(e.target.value))}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-indigo-700 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  đ
                </span>
              </div>
            </div>
          </div>

          {/* Ngày Nhận & Thứ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Ngày nhận
              </label>
              <input
                type="date"
                required
                value={receiveDate}
                onChange={e => setReceiveDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Thứ trong tuần
              </label>
              <div className="px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm font-bold text-slate-700">
                {receiveDay || '-'}
              </div>
            </div>
          </div>

          {/* Số lượng nhận & Kí vải */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-blue-500" />
                Số lượng nhận
              </label>
              <div className="flex items-center">
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
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              {/* Quick increment buttons */}
              <div className="flex gap-1 mt-1.5">
                {[1, 5, 10, 50].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleAddQty(n)}
                    className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 active:scale-95"
                  >
                    +{n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-teal-500" />
                Kí vải (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="VD: 8.5"
                value={receiveFabricKg}
                onChange={e => setReceiveFabricKg(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Tùy chọn khối lượng</span>
            </div>
          </div>

          {/* Trạng thái đơn */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              Trạng thái đơn hàng
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('PENDING')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  status === 'PENDING'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Chờ may
              </button>
              <button
                type="button"
                onClick={() => setStatus('IN_PROGRESS')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  status === 'IN_PROGRESS'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Đang may
              </button>
              <button
                type="button"
                onClick={() => setStatus('DELIVERED')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  status === 'DELIVERED'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Đã giao
              </button>
            </div>
          </div>

          {/* If Status is DELIVERED -> show Delivery Details */}
          {status === 'DELIVERED' && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wide">
                <Check className="w-4 h-4 text-emerald-600" />
                Thông tin bàn giao & tính tiền
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-emerald-900 mb-1 block">
                    Ngày giao
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 text-xs font-medium text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-emerald-900 mb-1 block">
                    Thứ bàn giao
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-emerald-100/60 border border-emerald-200 text-xs font-bold text-emerald-900">
                    {deliveryDay || '-'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-emerald-900 mb-1 block">
                    Số lượng thực giao
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={deliverQuantity || ''}
                    onChange={e => setDeliverQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 text-xs font-bold text-emerald-800 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-emerald-900 mb-1 block">
                    Kí vải bàn giao
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="VD: 8"
                    value={deliveryFabricKg}
                    onChange={e => setDeliveryFabricKg(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 text-xs font-semibold text-slate-800 font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Ghi chú */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Ghi chú thêm
            </label>
            <input
              type="text"
              placeholder="VD: Mã hàng X-202, màu đen, size L..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Live Total Calculation Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">
                {status === 'DELIVERED' ? 'Tiền công thực nhận' : 'Tiền công dự kiến'}
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {formatVND(unitPrice)} × {formatNumber(status === 'DELIVERED' ? finalDeliveredQty : receiveQuantity)} cái
              </span>
            </div>
            <div className="text-xl font-extrabold font-mono text-emerald-400">
              {formatVND(liveTotalAmount)}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 active:scale-98 transition-all hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {editingOrder ? 'Lưu Thay Đổi' : 'Thêm Công Đoạn'}
          </button>
        </div>
      </div>
    </div>
  );
};
