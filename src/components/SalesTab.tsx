// c:\Users\sanbi\Documents\MayTrack\src\components\SalesTab.tsx
import React, { useState, useMemo } from 'react';
import { SalesItem } from '../types';
import { formatVND, formatNumber } from '../utils/format';
import { exportSalesToCSV, INITIAL_SALES_ITEMS } from '../utils/storage';
import { useVisualViewport } from '../utils/useVisualViewport';
import {
  ShoppingBag,
  Plus,
  Minus,
  Search,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Table2,
  LayoutList,
  X,
  Check,
  Copy,
  Receipt,
  PackagePlus,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';

interface SalesTabProps {
  items: SalesItem[];
  onSaveItems: (items: SalesItem[]) => void;
  isAddModalOpen: boolean;
  onCloseAddModal: () => void;
  onOpenAddModal: () => void;
}

export const SalesTab: React.FC<SalesTabProps> = ({
  items,
  onSaveItems,
  isAddModalOpen,
  onCloseAddModal,
  onOpenAddModal,
}) => {
  const viewportHeight = useVisualViewport();
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK' | 'SOLD'>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'sheet'>('sheet');

  // State cho Modal Thêm / Sửa mặt hàng
  const [editingItem, setEditingItem] = useState<SalesItem | null>(null);
  const [productName, setProductName] = useState('');
  const [importQty, setImportQty] = useState<string>('1');
  const [importPrice, setImportPrice] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('');
  const [soldQty, setSoldQty] = useState<string>('0');
  const [note, setNote] = useState('');

  // State cho Modal Bill Bán (Copy gửi khách)
  const [billItem, setBillItem] = useState<SalesItem | null>(null);
  const [copiedBill, setCopiedBill] = useState(false);

  // Mở modal thêm mới từ bên ngoài hoặc nút nội bộ
  const openCreateModal = () => {
    setEditingItem(null);
    setProductName('');
    setImportQty('20');
    setImportPrice('');
    setSellPrice('');
    setSoldQty('0');
    setNote('');
    onOpenAddModal();
  };

  const openEditModal = (item: SalesItem) => {
    setEditingItem(item);
    setProductName(item.productName);
    setImportQty(String(item.importQty));
    setImportPrice(String(item.importPrice));
    setSellPrice(String(item.sellPrice));
    setSoldQty(String(item.soldQty || 0));
    setNote(item.note || '');
    onOpenAddModal();
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    onCloseAddModal();
  };

  // Lưu mặt hàng (Thêm mới hoặc Cập nhật)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    const parsedImportQty = Number(importQty) || 0;
    const parsedImportPrice = Number(importPrice) || 0;
    const parsedSellPrice = Number(sellPrice) || 0;
    const parsedSoldQty = Math.max(0, Number(soldQty) || 0);
    const now = Date.now();

    if (editingItem) {
      const updated: SalesItem = {
        ...editingItem,
        productName: productName.trim(),
        importQty: parsedImportQty,
        importPrice: parsedImportPrice,
        sellPrice: parsedSellPrice,
        soldQty: parsedSoldQty,
        note: note.trim() || undefined,
        updatedAt: now,
      };
      onSaveItems(items.map(i => (i.id === editingItem.id ? updated : i)));
    } else {
      const created: SalesItem = {
        id: `sales_${now}_${Math.random().toString(36).slice(2, 6)}`,
        productName: productName.trim(),
        importQty: parsedImportQty,
        importPrice: parsedImportPrice,
        sellPrice: parsedSellPrice,
        soldQty: parsedSoldQty,
        note: note.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      onSaveItems([...items, created]);
    }

    handleCloseModal();
  };

  // Tăng / giảm nhanh SL ĐÃ BÁN (Cột H)
  const handleQuickAdjustSold = (id: string, delta: number) => {
    const next = items.map(item => {
      if (item.id !== id) return item;
      const nextSold = Math.max(0, (item.soldQty || 0) + delta);
      return {
        ...item,
        soldQty: nextSold,
        updatedAt: Date.now(),
      };
    });
    onSaveItems(next);
  };

  // Nhập trực tiếp SL ĐÃ BÁN
  const handleSetSoldQty = (id: string, value: number) => {
    const nextSold = Math.max(0, value || 0);
    const next = items.map(item =>
      item.id === id ? { ...item, soldQty: nextSold, updatedAt: Date.now() } : item
    );
    onSaveItems(next);
  };

  // Xóa mặt hàng
  const handleDeleteItem = (id: string, name: string) => {
    if (window.confirm(`Xóa sản phẩm "${name}" khỏi danh sách bán hàng?`)) {
      onSaveItems(items.filter(i => i.id !== id));
    }
  };

  // Khôi phục 3 sản phẩm mẫu từ Google Sheet Trang tính19
  const handleResetSheetSample = () => {
    if (window.confirm('Khôi phục 3 sản phẩm mẫu từ Trang tính19 (Hoa 1tia 6 cánh, xoài, hoa 3)?')) {
      onSaveItems(INITIAL_SALES_ITEMS);
    }
  };

  // Lọc danh sách sản phẩm
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.productName.toLowerCase().includes(q);
        const matchNote = item.note ? item.note.toLowerCase().includes(q) : false;
        if (!matchName && !matchNote) return false;
      }

      const stock = (item.importQty || 0) - (item.soldQty || 0);
      if (stockFilter === 'IN_STOCK' && stock <= 0) return false;
      if (stockFilter === 'OUT_OF_STOCK' && stock > 0) return false;
      if (stockFilter === 'SOLD' && (item.soldQty || 0) <= 0) return false;

      return true;
    });
  }, [items, searchQuery, stockFilter]);

  // Tính toán tổng hợp theo đúng công thức Trang tính19 + thực tế bán hàng
  const summary = useMemo(() => {
    let totalUnitProfit = 0;     // =SUM(E3:E23) trong Trang tính19 (Tổng lợi nhuận đơn vị = 62.000)
    let totalRealizedProfit = 0; // Tổng lãi thực tế từ SL đã bán = SUM(SL ĐÃ BÁN * LỢI NHUẬN)
    let totalRevenue = 0;        // Tổng tiền BILL BÁN = SUM(SL ĐÃ BÁN * GIÁ BÁN)
    let totalImportCapital = 0;  // Tổng vốn nhập = SUM(SL NHẬP * giá nhập)
    let totalImportQty = 0;
    let totalSoldQty = 0;
    let totalStockQty = 0;
    let outOfStockCount = 0;

    items.forEach(item => {
      const impQty = item.importQty || 0;
      const impPrice = item.importPrice || 0;
      const sPrice = item.sellPrice || 0;
      const sQty = item.soldQty || 0;
      const unitProfit = sPrice - impPrice; // Công thức cột E: =D3-C3
      const stockQty = impQty - sQty;       // Công thức cột I: =B3-H3

      totalUnitProfit += unitProfit;
      totalRealizedProfit += sQty * unitProfit;
      totalRevenue += sQty * sPrice;
      totalImportCapital += impQty * impPrice;
      totalImportQty += impQty;
      totalSoldQty += sQty;
      totalStockQty += stockQty;
      if (stockQty <= 0) outOfStockCount += 1;
    });

    return {
      totalUnitProfit,
      totalRealizedProfit,
      totalRevenue,
      totalImportCapital,
      totalImportQty,
      totalSoldQty,
      totalStockQty,
      outOfStockCount,
    };
  }, [items]);

  // Nội dung text Bill Bán để copy gửi Zalo
  const formatBillText = (item: SalesItem) => {
    const sold = item.soldQty || 1;
    const total = sold * (item.sellPrice || 0);
    const stock = (item.importQty || 0) - (item.soldQty || 0);
    return [
      '🧾 BILL BÁN HÀNG',
      '------------------------',
      `📦 Sản phẩm: ${item.productName}`,
      `🔢 SL đã bán: ${formatNumber(sold)}`,
      `💵 Đơn giá bán: ${formatVND(item.sellPrice)}`,
      `💰 THÀNH TIỀN: ${formatVND(total)}`,
      `📊 Tồn kho còn: ${formatNumber(stock)} (${stock <= 0 ? '⚠️ HẾT HÀNG' : 'CÒN TỒN'})`,
      item.note ? `📝 Ghi chú: ${item.note}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const handleCopyBill = (item: SalesItem) => {
    navigator.clipboard.writeText(formatBillText(item));
    setCopiedBill(true);
    setTimeout(() => setCopiedBill(false), 1800);
  };

  // Preview lợi nhuận & tồn kho trong form Modal
  const previewUnitProfit = (Number(sellPrice) || 0) - (Number(importPrice) || 0);
  const previewStockQty = (Number(importQty) || 0) - (Number(soldQty) || 0);
  const maxModalHeight = Math.min(Math.max(viewportHeight - 20, 360), 840);

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* KHỐI TỔNG HỢP: TỔNG LỢI NHUẬN & THỐNG KÊ BÁN HÀNG */}
      <div className="p-3.5 rounded-3xl bg-gradient-to-br from-orange-600 via-amber-600 to-rose-600 text-white shadow-lg shadow-orange-600/20 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/15 blur-xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-white/20 backdrop-blur-md">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-100 block">
                Sổ Nhập Hàng Bán & Bill Bán (Độc Lập)
              </span>
              <h2 className="text-sm font-black tracking-tight">
                TỔNG LỢI NHUẬN: {formatVND(summary.totalUnitProfit)}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-3 py-1.5 rounded-xl bg-white text-orange-700 text-xs font-black shadow-sm active:scale-95 transition-all flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nhập hàng</span>
          </button>
        </div>

        {/* 4 Ô Chỉ Số Chi Tiết */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-xs">
          <div className="p-2 rounded-2xl bg-black/15 backdrop-blur-xs">
            <span className="text-[10px] text-orange-100 font-bold block uppercase">
              Lãi thực đã bán ({formatNumber(summary.totalSoldQty)} sp)
            </span>
            <span className="text-sm font-black font-mono text-emerald-300">
              +{formatVND(summary.totalRealizedProfit)}
            </span>
          </div>

          <div className="p-2 rounded-2xl bg-black/15 backdrop-blur-xs">
            <span className="text-[10px] text-orange-100 font-bold block uppercase">
              Tổng tiền Bill Bán
            </span>
            <span className="text-sm font-black font-mono text-white">
              {formatVND(summary.totalRevenue)}
            </span>
          </div>

          <div className="p-2 rounded-2xl bg-black/15 backdrop-blur-xs flex items-center justify-between">
            <span className="text-[10px] text-orange-100 font-bold">Tổng vốn nhập:</span>
            <strong className="font-mono text-[11px] text-white">
              {formatVND(summary.totalImportCapital)}
            </strong>
          </div>

          <div className="p-2 rounded-2xl bg-black/15 backdrop-blur-xs flex items-center justify-between">
            <span className="text-[10px] text-orange-100 font-bold">Tổng tồn kho:</span>
            <strong className="font-mono text-[11px] text-amber-200">
              {formatNumber(summary.totalStockQty)} / {formatNumber(summary.totalImportQty)}
            </strong>
          </div>
        </div>
      </div>

      {/* CẢNH BÁO NẾU CÓ MẶT HÀNG HẾT HÀNG / ÂM KHO */}
      {summary.outOfStockCount > 0 && (
        <div
          onClick={() => setStockFilter('OUT_OF_STOCK')}
          className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-2 cursor-pointer active:scale-98 transition-all"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-xs font-extrabold">
              ⚠️ CẢNH BÁO HẾT HÀNG: Có {summary.outOfStockCount} sản phẩm đã hết hoặc âm tồn kho!
            </span>
          </div>
          <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-lg shrink-0">
            Lọc xem
          </span>
        </div>
      )}

      {/* THANH TÌM KIẾM + CHUYỂN CHẾ ĐỘ XEM (BẢNG SHEET / THẺ) */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm tên sản phẩm (VD: Hoa 1tia, xoài...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white/85 border border-slate-200/80 text-xs font-medium text-slate-800 shadow-xs focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>

        <div className="flex items-center bg-slate-200/80 p-0.5 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('sheet')}
            title="Xem dạng bảng Google Sheet (Trang tính19)"
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all ${
              viewMode === 'sheet'
                ? 'bg-white text-orange-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Bảng Sheet</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            title="Xem dạng thẻ chi tiết"
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all ${
              viewMode === 'cards'
                ? 'bg-white text-orange-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Thẻ</span>
          </button>
        </div>
      </div>

      {/* BỘ LỌC TRẠNG THÁI TỒN KHO / ĐÃ BÁN */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/70 rounded-2xl text-[11px] font-bold">
        <button
          type="button"
          onClick={() => setStockFilter('ALL')}
          className={`py-1.5 rounded-xl transition-all ${
            stockFilter === 'ALL'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tất cả ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setStockFilter('IN_STOCK')}
          className={`py-1.5 rounded-xl transition-all ${
            stockFilter === 'IN_STOCK'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Còn tồn ({items.filter(i => (i.importQty || 0) - (i.soldQty || 0) > 0).length})
        </button>
        <button
          type="button"
          onClick={() => setStockFilter('SOLD')}
          className={`py-1.5 rounded-xl transition-all ${
            stockFilter === 'SOLD'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Đã bán ({items.filter(i => (i.soldQty || 0) > 0).length})
        </button>
        <button
          type="button"
          onClick={() => setStockFilter('OUT_OF_STOCK')}
          className={`py-1.5 rounded-xl transition-all ${
            stockFilter === 'OUT_OF_STOCK'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Hết hàng ({summary.outOfStockCount})
        </button>
      </div>

      {/* CHẾ ĐỘ 1: BẢNG GOOGLE SHEET (KHỚP 100% TRANG TÍNH 19: NHẬP HÀNG BÁN & BILL BÁN) */}
      {viewMode === 'sheet' && (
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-ios-card overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
              <Table2 className="w-3.5 h-3.5 text-orange-600" />
              Bảng Trang tính19 (Vuốt ngang để xem đầy đủ 2 khối)
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              Bấm +/- để cập nhật SL đã bán
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[760px] text-[11px] border-collapse">
              <thead>
                {/* Hàng tiêu đề nhóm 1: NHẬP HÀNG BÁN | BILL BÁN */}
                <tr className="border-b border-slate-200">
                  <th
                    colSpan={5}
                    className="py-2 px-2.5 bg-amber-100/90 text-amber-950 font-black text-left uppercase tracking-wider border-r-2 border-slate-300"
                  >
                    📦 1. NHẬP HÀNG BÁN (Cột A → E)
                  </th>
                  <th
                    colSpan={6}
                    className="py-2 px-2.5 bg-emerald-100/90 text-emerald-950 font-black text-left uppercase tracking-wider"
                  >
                    🧾 2. BILL BÁN & TỒN KHO (Cột G → K)
                  </th>
                </tr>

                {/* Hàng tiêu đề cột 2 */}
                <tr className="bg-slate-100/90 text-slate-700 font-extrabold border-b border-slate-200 text-[10px] uppercase">
                  <th className="py-2 px-2 text-left">Tên sản phẩm</th>
                  <th className="py-2 px-1.5 text-center">SL Nhập</th>
                  <th className="py-2 px-2 text-right">Giá nhập</th>
                  <th className="py-2 px-2 text-right">Giá bán</th>
                  <th className="py-2 px-2 text-right bg-amber-50/80 text-amber-900 border-r-2 border-slate-300">
                    Lợi nhuận
                  </th>

                  <th className="py-2 px-2 text-left">Tên sản phẩm</th>
                  <th className="py-2 px-2 text-center">SL Đã bán</th>
                  <th className="py-2 px-1.5 text-center">SL Tồn kho</th>
                  <th className="py-2 px-2 text-right">Giá bán</th>
                  <th className="py-2 px-2 text-center">Cảnh báo</th>
                  <th className="py-2 px-1.5 text-center">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => {
                  const unitProfit = (item.sellPrice || 0) - (item.importPrice || 0); // =D3-C3
                  const sold = item.soldQty || 0;
                  const stock = (item.importQty || 0) - sold; // =B3-H3
                  const isOut = stock <= 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/90 transition-colors">
                      {/* Cột A: TÊN SẢN PHẨM */}
                      <td className="py-2 px-2 font-bold text-slate-900">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="text-left hover:text-orange-600 transition-colors"
                          title="Bấm để sửa sản phẩm"
                        >
                          {item.productName}
                        </button>
                      </td>

                      {/* Cột B: SL NHẬP */}
                      <td className="py-2 px-1.5 text-center font-mono font-bold text-slate-800">
                        {formatNumber(item.importQty)}
                      </td>

                      {/* Cột C: giá nhập */}
                      <td className="py-2 px-2 text-right font-mono text-slate-600">
                        {formatNumber(item.importPrice)}
                      </td>

                      {/* Cột D: GIÁ BÁN */}
                      <td className="py-2 px-2 text-right font-mono font-semibold text-slate-800">
                        {formatNumber(item.sellPrice)}
                      </td>

                      {/* Cột E: LỢI NHUẬN (=D3-C3) */}
                      <td className="py-2 px-2 text-right font-mono font-extrabold text-amber-700 bg-amber-50/40 border-r-2 border-slate-300">
                        {formatNumber(unitProfit)}
                      </td>

                      {/* Cột G: BILL BÁN - TÊN SẢN PHẨM (=A3) */}
                      <td className="py-2 px-2 font-semibold text-slate-700">
                        {item.productName}
                      </td>

                      {/* Cột H: SL ĐÃ BÁN (Tăng giảm trực tiếp) */}
                      <td className="py-1.5 px-1.5 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustSold(item.id, -1)}
                            className="w-5 h-5 rounded-lg bg-white hover:bg-rose-50 text-slate-700 flex items-center justify-center active:scale-90 shadow-2xs"
                            title="Giảm 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={sold || ''}
                            placeholder="0"
                            onChange={e => handleSetSoldQty(item.id, parseInt(e.target.value, 10) || 0)}
                            className="w-9 text-center font-mono font-extrabold text-orange-700 bg-transparent outline-none text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustSold(item.id, 1)}
                            className="w-5 h-5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center active:scale-90 shadow-2xs"
                            title="Bán thêm 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Cột I: SL TỒN KHO (=B3-H3) */}
                      <td
                        className={`py-2 px-1.5 text-center font-mono font-black ${
                          isOut ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {sold > 0 || isOut ? formatNumber(stock) : formatNumber(stock)}
                      </td>

                      {/* Cột J: GIÁ BÁN (=D3) */}
                      <td className="py-2 px-2 text-right font-mono font-bold text-slate-800">
                        {sold > 0 ? formatNumber(item.sellPrice) : <span className="text-slate-300">—</span>}
                      </td>

                      {/* Cột K: CẢNH BÁO */}
                      <td className="py-2 px-2 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[10px] whitespace-nowrap">
                            ⚠️ CẢNH BÁO HẾT HÀNG {stock < 0 ? formatNumber(Math.abs(stock)) : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] whitespace-nowrap">
                            CÒN TỒN
                          </span>
                        )}
                      </td>

                      {/* Cột Thao tác */}
                      <td className="py-2 px-1.5 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setBillItem(item)}
                            className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50"
                            title="Xem Bill Bán"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-1 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                            title="Sửa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id, item.productName)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400 text-xs">
                      Chưa có sản phẩm nào phù hợp. Bấm <strong>+ Nhập hàng</strong> để thêm mới.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Dòng TỔNG LỢI NHUẬN ở đáy giống hệt dòng 24 của Trang tính19 */}
              <tfoot>
                <tr className="bg-amber-50/90 border-t-2 border-slate-300 font-black text-slate-900">
                  <td colSpan={4} className="py-2.5 px-2.5 text-left uppercase tracking-wider text-xs">
                    TỔNG LỢI NHUẬN (Cột E)
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-xs text-amber-800 border-r-2 border-slate-300">
                    {formatNumber(summary.totalUnitProfit)}
                  </td>
                  <td className="py-2.5 px-2 text-left text-[10px] uppercase text-emerald-900">
                    Tổng đã bán / Tồn:
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-xs text-orange-700">
                    {formatNumber(summary.totalSoldQty)}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-xs text-emerald-700">
                    {formatNumber(summary.totalStockQty)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-xs text-emerald-800">
                    {formatNumber(summary.totalRevenue)}
                  </td>
                  <td colSpan={2} className="py-2.5 px-2 text-center text-[10px] text-emerald-800">
                    Lãi thực: +{formatNumber(summary.totalRealizedProfit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* CHẾ ĐỘ 2: DẠNG THẺ MOBILE (TỐI ƯU THAO TÁC 1 CHẠM TRÊN ĐIỆN THOẠI) */}
      {viewMode === 'cards' && (
        <div className="space-y-2.5">
          {filteredItems.map(item => {
            const unitProfit = (item.sellPrice || 0) - (item.importPrice || 0);
            const sold = item.soldQty || 0;
            const stock = (item.importQty || 0) - sold;
            const realizedProfit = sold * unitProfit;
            const billRevenue = sold * (item.sellPrice || 0);
            const isOut = stock <= 0;

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-3xl bg-white border border-slate-200/90 shadow-ios-card space-y-2.5 transition-all"
              >
                {/* Header: Tên sản phẩm + Badge Cảnh báo Cột K */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{item.productName}</h3>
                    {item.note && <p className="text-[11px] text-slate-500 mt-0.5">{item.note}</p>}
                  </div>

                  {isOut ? (
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black flex items-center gap-1 shrink-0">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      ⚠️ CẢNH BÁO HẾT HÀNG {stock < 0 ? formatNumber(Math.abs(stock)) : ''}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      CÒN TỒN ({formatNumber(stock)})
                    </span>
                  )}
                </div>

                {/* 2 Khối song song: NHẬP HÀNG BÁN vs BILL BÁN */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Khối trái: NHẬP HÀNG BÁN */}
                  <div className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-1">
                    <span className="text-[10px] font-black uppercase text-amber-900 block">
                      1. Nhập Hàng Bán
                    </span>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">SL Nhập:</span>
                      <strong className="font-mono text-slate-900">{formatNumber(item.importQty)}</strong>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Giá nhập:</span>
                      <strong className="font-mono text-slate-700">{formatVND(item.importPrice)}</strong>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Giá bán:</span>
                      <strong className="font-mono text-slate-900">{formatVND(item.sellPrice)}</strong>
                    </div>
                    <div className="pt-1 border-t border-amber-200/80 flex justify-between text-[11px]">
                      <span className="font-bold text-amber-900">Lợi nhuận/SP:</span>
                      <strong className="font-mono text-amber-700 font-black">
                        +{formatVND(unitProfit)}
                      </strong>
                    </div>
                  </div>

                  {/* Khối phải: BILL BÁN */}
                  <div className="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 space-y-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-emerald-950 block">
                        2. Bill Bán
                      </span>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-600 font-semibold">SL Đã bán:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustSold(item.id, -1)}
                            className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 active:scale-90"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-mono font-black text-orange-700 text-xs">
                            {formatNumber(sold)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustSold(item.id, 1)}
                            className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center active:scale-90 shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">SL Tồn kho:</span>
                        <strong className={`font-mono font-black ${isOut ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {formatNumber(stock)}
                        </strong>
                      </div>

                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Tiền đã bán:</span>
                        <strong className="font-mono text-slate-900">{formatVND(billRevenue)}</strong>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-emerald-200/80 flex justify-between text-[11px]">
                      <span className="font-bold text-emerald-950">Lãi đã thu:</span>
                      <strong className="font-mono text-emerald-700 font-black">
                        +{formatVND(realizedProfit)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setBillItem(item)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-xs"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Xuất Bill Bán</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id, item.productName)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 active:scale-95 transition-all"
                    title="Xóa sản phẩm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NÚT XUẤT FILE CSV CHUẨN TRANG TÍNH 19 & KHÔI PHỤC MẪU */}
      <div className="pt-1 space-y-2">
        <button
          type="button"
          onClick={() => exportSalesToCSV(items)}
          className="w-full py-2.5 px-4 rounded-2xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Tải file Excel / CSV Bán Hàng (Chuẩn Trang tính19)</span>
        </button>

        <button
          type="button"
          onClick={handleResetSheetSample}
          className="w-full py-2 px-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/70 text-amber-900 text-[11px] font-semibold flex items-center justify-center gap-1.5 active:scale-98 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
          <span>Khôi phục 3 sản phẩm mẫu từ Trang tính19 (Hoa 1tia 6 cánh, xoài, hoa 3)</span>
        </button>
      </div>

      {/* MODAL 1: THÊM MỚI / SỬA SẢN PHẨM NHẬP HÀNG BÁN */}
      {isAddModalOpen && (
        <div
          className="fixed md:absolute inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 pb-[calc(1rem+env(safe-area-inset-bottom))]"
            style={{ maxHeight: `${maxModalHeight}px` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-2 shrink-0 sm:hidden" />

            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {editingItem ? 'Cập Nhật Mặt Hàng Bán' : 'Nhập Hàng Bán Mới'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Tự động tính Lợi nhuận (= Giá bán - Giá nhập) & Tồn kho
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmitForm}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3"
            >
              {/* Tên sản phẩm */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                  Tên sản phẩm (Cột A & G) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hoa 1tia 6 cánh, xoài, hoa 3..."
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              {/* Hàng 2: SL Nhập & SL Đã Bán */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                    SL Nhập (Cột B) *
                  </label>
                  <input
                    type="number"
                    required
                    value={importQty}
                    onChange={e => setImportQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                    SL Đã Bán (Cột H)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={soldQty}
                    onChange={e => setSoldQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-orange-50/60 border border-orange-200 text-xs font-black font-mono text-orange-800 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              {/* Hàng 3: Giá nhập & Giá bán */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                    Giá nhập / 1 SP (Cột C) *
                  </label>
                  <input
                    type="number"
                    step="500"
                    required
                    placeholder="VD: 50000"
                    value={importPrice}
                    onChange={e => setImportPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                    Giá bán / 1 SP (Cột D & J) *
                  </label>
                  <input
                    type="number"
                    step="500"
                    required
                    placeholder="VD: 70000"
                    value={sellPrice}
                    onChange={e => setSellPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs font-bold font-mono text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Khung tự động tính theo công thức Trang tính19 */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    Lợi nhuận / 1 SP (= Giá bán - Giá nhập):
                  </span>
                  <strong
                    className={`font-mono font-black ${
                      previewUnitProfit >= 0 ? 'text-amber-700' : 'text-rose-600'
                    }`}
                  >
                    {formatVND(previewUnitProfit)}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">
                    SL Tồn kho (= SL Nhập - SL Đã bán):
                  </span>
                  <strong
                    className={`font-mono font-black ${
                      previewStockQty <= 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {formatNumber(previewStockQty)} ({previewStockQty <= 0 ? '⚠️ CẢNH BÁO HẾT HÀNG' : 'CÒN TỒN'})
                  </strong>
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                  Ghi chú thêm (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: Nguồn nhập, khách đặt, màu sắc..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-24 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-md shadow-orange-600/25 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingItem ? 'Lưu Cập Nhật' : 'Lưu Nhập Hàng'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BILL BÁN HÀNG (XEM & COPY GỬI KHÁCH) */}
      {billItem && (
        <div
          className="fixed md:absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setBillItem(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-4 space-y-3 border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">BILL BÁN HÀNG</h3>
                  <p className="text-[10px] text-slate-400">Theo mẫu cột BILL BÁN (Trang tính19)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBillItem(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Tên sản phẩm:</span>
                <strong className="text-slate-900 font-black">{billItem.productName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SL Đã bán:</span>
                <strong className="font-mono text-orange-700 font-black">
                  {formatNumber(billItem.soldQty || 0)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SL Tồn kho:</span>
                <strong className="font-mono text-slate-800 font-bold">
                  {formatNumber((billItem.importQty || 0) - (billItem.soldQty || 0))}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Đơn giá bán:</span>
                <strong className="font-mono text-slate-900">{formatVND(billItem.sellPrice)}</strong>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-black text-slate-800">THÀNH TIỀN BILL:</span>
                <span className="text-base font-black font-mono text-emerald-700">
                  {formatVND((billItem.soldQty || 0) * (billItem.sellPrice || 0))}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBillItem(null)}
                className="w-24 py-2.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleCopyBill(billItem)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-98 transition-all"
              >
                {copiedBill ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedBill ? 'Đã copy Bill!' : 'Copy Bill gửi Zalo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
