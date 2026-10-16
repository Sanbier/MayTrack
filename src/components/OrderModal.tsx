import React, { useState, useEffect } from 'react';
import { SewingOrder, StagePreset, OrderStatus } from '../types';
import { getTodayString, getDayOfWeekVN, formatVND, formatNumber, formatDateVN, getDeliveryUrgency } from '../utils/format';
import { useVisualViewport } from '../utils/useVisualViewport';
import { DateInputVN } from './DateInputVN';
import { X, Check, Calendar, Layers, Package, Scale, FileText, Send, Clock, AlertTriangle, ChevronDown, List, Edit2 } from 'lucide-react';
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
  const [isCustomStage, setIsCustomStage] = useState(false);
  const [unitPrice, setUnitPrice] = useState<number>(8000);
  const [receiveQuantity, setReceiveQuantity] = useState<number>(10);
  const [receiveFabricKg, setReceiveFabricKg] = useState<string>('');
  const [status, setStatus] = useState<OrderStatus>('IN_PROGRESS');
  
  // Delivery field: ngày hẹn giao hàng hoặc ngày đã giao
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [deliverQuantity, setDeliverQuantity] = useState<number>(10);
  const [deliveryFabricKg, setDeliveryFabricKg] = useState<string>('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (editingOrder) {
      setReceiveDate(editingOrder.receiveDate);
      const matched = presets.find(p => p.name.trim().toLowerCase() === editingOrder.stageName.trim().toLowerCase());
      if (matched) {
        setStageName(matched.name);
        setIsCustomStage(false);
      } else {
        setStageName(editingOrder.stageName);
        setIsCustomStage(true);
      }
      setUnitPrice(editingOrder.unitPrice);
      setReceiveQuantity(editingOrder.receiveQuantity);
      setReceiveFabricKg(editingOrder.receiveFabricKg != null ? String(editingOrder.receiveFabricKg) : '');
      setStatus(editingOrder.status);
      setDeliveryDate(editingOrder.deliveryDate || '');
      setDeliverQuantity(editingOrder.deliverQuantity ?? editingOrder.receiveQuantity);
      setDeliveryFabricKg(editingOrder.deliveryFabricKg != null ? String(editingOrder.deliveryFabricKg) : '');
      setNote(editingOrder.note || '');
    } else {
      setReceiveDate(getTodayString());
      const firstPreset = presets[0];
      setStageName(firstPreset?.name || 'TIM TIA');
      setUnitPrice(firstPreset?.defaultUnitPrice || 8000);
      setIsCustomStage(false);
      setReceiveQuantity(10);
      setReceiveFabricKg('');
      setStatus('IN_PROGRESS'); // Mặc định là Đang Làm
      setDeliveryDate(''); // Để trống để người dùng tự chọn ngày hẹn giao
      setDeliverQuantity(10);
      setDeliveryFabricKg('');
      setNote('');
    }
  }, [editingOrder, isOpen, presets]);

  if (!isOpen) return null;

  const receiveDay = getDayOfWeekVN(receiveDate);
  const deliveryDay = deliveryDate ? getDayOfWeekVN(deliveryDate) : '';
  const isDelivered = status === 'DELIVERED';
  const finalDeliveredQty = deliverQuantity || receiveQuantity;
  const liveTotalAmount = unitPrice * (isDelivered ? finalDeliveredQty : receiveQuantity);

  // Tính toán báo động hạn giao
  const urgency = getDeliveryUrgency(deliveryDate, status);


  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!stageName.trim()) return;

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
      status,
      deliveryDate: deliveryDate || null,
      deliveryDayOfWeek: deliveryDay || null,
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
                Ghi nhận sản lượng & theo dõi hạn giao hàng
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
          
          {/* Row 1: Tên công đoạn (Dropdown List / Tự nhập) (7 cols) + Đơn giá (5 cols) */}
          <div className='grid grid-cols-12 gap-2'>
            <div className='col-span-7'>
              <label className='text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between'>
                <span>Tên công đoạn <span className='text-rose-500'>*</span></span>
                <button
                  type='button'
                  onClick={() => {
                    if (isCustomStage) {
                      setIsCustomStage(false);
                      if (!presets.some(p => p.name === stageName) && presets.length > 0) {
                        setStageName(presets[0].name);
                        setUnitPrice(presets[0].defaultUnitPrice);
                      }
                    } else {
                      setIsCustomStage(true);
                    }
                  }}
                  className='text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 active:scale-95 transition-all'
                >
                  {isCustomStage ? (
                    <>
                      <List className='w-3 h-3' />
                      <span>Chọn list</span>
                    </>
                  ) : (
                    <>
                      <Edit2 className='w-2.5 h-2.5' />
                      <span>Tự nhập</span>
                    </>
                  )}
                </button>
              </label>

              {isCustomStage ? (
                <div className='relative flex items-center'>
                  <input
                    type='text'
                    required
                    autoFocus
                    placeholder='Nhập tên công đoạn...'
                    value={stageName}
                    onChange={e => setStageName(e.target.value)}
                    className='w-full h-[38px] pl-3 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all'
                  />
                  <button
                    type='button'
                    onClick={() => {
                      setIsCustomStage(false);
                      if (presets.length > 0) {
                        setStageName(presets[0].name);
                        setUnitPrice(presets[0].defaultUnitPrice);
                      }
                    }}
                    className='absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 rounded transition-all'
                    title='Quay lại danh sách công đoạn'
                  >
                    <List className='w-4 h-4' />
                  </button>
                </div>
              ) : (
                <div className='relative'>
                  <select
                    value={stageName}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__custom__') {
                        setIsCustomStage(true);
                        setStageName('');
                      } else {
                        setIsCustomStage(false);
                        const matched = presets.find(p => p.name === val);
                        if (matched) {
                          setStageName(matched.name);
                          setUnitPrice(matched.defaultUnitPrice);
                        } else {
                          setStageName(val);
                        }
                      }
                    }}
                    className='w-full h-[38px] pl-3 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer truncate'
                  >
                    {presets.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({formatVND(p.defaultUnitPrice)})
                      </option>
                    ))}
                    {!presets.some(p => p.name === stageName) && stageName && (
                      <option value={stageName}>{stageName}</option>
                    )}
                    <option value='__custom__'>✏️ Nhập công đoạn khác...</option>
                  </select>
                  <ChevronDown className='w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none' />
                </div>
              )}
            </div>

            <div className='col-span-5'>
              <label className='text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between'>
                <span>Đơn giá</span>
                <span className='text-[10px] text-indigo-600 font-mono font-bold'>VNĐ/cái</span>
              </label>
              <div className='relative'>
                <input
                  type='number'
                  min='0'
                  step='100'
                  required
                  value={unitPrice || ''}
                  onChange={e => setUnitPrice(Number(e.target.value))}
                  className='w-full h-[38px] pl-2.5 pr-6 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-indigo-700 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all'
                />
                <span className='absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none'>
                  đ
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Thứ trong tuần (Bên Trái) + Ngày Nhận Hàng (Bên Phải) */}
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-4">
              <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                Thứ nhận
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
                {deliveryDate ? (deliveryDay || '-') : 'Chưa đặt'}
              </div>
            </div>

            <div className="col-span-8">
              <label className="text-[11px] font-bold text-emerald-800 mb-1 flex items-center gap-1">
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ngày hẹn giao hàng</span>
              </label>

              <DateInputVN
                value={deliveryDate}
                onChange={setDeliveryDate}
                placeholder="Bấm chọn ngày hẹn giao..."
                allowClear={true}
                theme="emerald"
              />
            </div>

            {/* Trạng thái hạn giao hàng (Báo động nếu còn 1 ngày / hôm nay / quá hạn) */}
            {deliveryDate && !isDelivered && (
              <div className="col-span-12">
                {urgency.level === 'overdue' ? (
                  <div className="p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-rose-600 text-white shadow-xs animate-pulse">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>⛔ ĐÃ QUÁ HẠN GIAO {Math.abs(urgency.diffDays || 0)} NGÀY!</span>
                  </div>
                ) : urgency.level === 'today' ? (
                  <div className="p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-rose-500 text-white shadow-xs animate-pulse">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>🚨 KHẨN CẤP: Hạn giao hàng là HÔM NAY! Phải làm cho kịp!</span>
                  </div>
                ) : urgency.level === 'tomorrow' ? (
                  <div className="p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-amber-500 text-white shadow-xs animate-pulse">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>⚠️ BÁO ĐỘNG: Còn đúng 1 ngày (mai giao) - Nhớ may gấp cho kịp!</span>
                  </div>
                ) : (
                  <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Còn {urgency.diffDays} ngày nữa đến hạn giao ({deliveryDay} - {formatDateVN(deliveryDate)})</span>
                  </div>
                )}
              </div>
            )}
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

          {/* Row 5: TRẠNG THÁI TIẾN ĐỘ: 3 Lựa Chọn Trực Quan */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
              Trạng thái đơn hàng:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setStatus('IN_PROGRESS')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border active:scale-95 ${
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
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border active:scale-95 ${
                  status === 'PENDING'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25 ring-2 ring-blue-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${status === 'PENDING' ? 'text-white' : 'text-blue-500'}`} />
                <span>Chờ Làm</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatus('DELIVERED');
                  if (!deliveryDate) setDeliveryDate(getTodayString());
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border active:scale-95 ${
                  status === 'DELIVERED'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25 ring-2 ring-emerald-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Đã Giao</span>
              </button>
            </div>
          </div>

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
                {isDelivered ? 'Tiền công thực nhận (Đã giao)' : 'Tiền công dự kiến (Đang/Chờ may)'}
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
                  : status === 'IN_PROGRESS'
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
              }`}
            >
              <Check className="w-4 h-4" />
              {editingOrder 
                ? 'Lưu Thay Đổi' 
                : isDelivered 
                ? 'LƯU ĐƠN ĐÃ GIAO' 
                : (status === 'IN_PROGRESS' ? 'LƯU ĐANG LÀM' : 'LƯU CHỜ LÀM')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
