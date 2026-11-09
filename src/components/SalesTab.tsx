// c:\Users\sanbi\Documents\MayTrack\src\components\SalesTab.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { SalesItem, SalesBillRecord } from '../types';
import {
  formatVND,
  formatNumber,
  formatInputDots,
  parseInputDots,
  formatDateVN,
  getTodayString,
  getDayOfWeekVN,
} from '../utils/format';
import { exportSalesToCSV } from '../utils/storage';
import { useVisualViewport } from '../utils/useVisualViewport';
import { DateInputVN } from './DateInputVN';
import confetti from 'canvas-confetti';
import {
  ShoppingBag,
  Search,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  X,
  Check,
  Copy,
  Receipt,
  PackagePlus,
  TrendingUp,
  Package,
  Calendar,
  Tag,
  ShoppingCart,
  Undo2,
  ChevronDown,
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

  // 3 Tab con giống luồng Sổ Công Đoạn: 1. Kho Hàng Nhập | 2. Bill Đã Bán | 3. Báo Cáo Lãi
  const [subTab, setSubTab] = useState<'inventory' | 'bills' | 'report'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'IN_STOCK' | 'OUT_OF_STOCK'>('IN_STOCK');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // State cho Modal Nhập Hàng Mới / Sửa Mặt Hàng
  const [editingItem, setEditingItem] = useState<SalesItem | null>(null);
  const [importMode, setImportMode] = useState<'NEW_PRODUCT' | 'RESTOCK_EXISTING'>('NEW_PRODUCT');
  const [selectedExistingId, setSelectedExistingId] = useState<string>('');
  const [importDate, setImportDate] = useState(getTodayString());
  const [category, setCategory] = useState('');
  const [productName, setProductName] = useState('');
  const [importQty, setImportQty] = useState<string>('10');
  const [importPrice, setImportPrice] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('');
  const [soldQty, setSoldQty] = useState<string>('0');
  const [note, setNote] = useState('');

  // State cho Modal Bấm Bán Hàng Nhanh (Lên Bill 1 chạm - giống QuickDeliverModal)
  const [sellingItem, setSellingItem] = useState<SalesItem | null>(null);
  const [saleDate, setSaleDate] = useState(getTodayString());
  const [saleQty, setSaleQty] = useState<string>('1');
  const [saleUnitPrice, setSaleUnitPrice] = useState<string>('');
  const [saleDiscount, setSaleDiscount] = useState<string>('');
  const [customerPaid, setCustomerPaid] = useState<string>('');
  const [customerNote, setCustomerNote] = useState('');

  // State cho Modal Nhập Thêm Hàng Nhanh (Restock 1 chạm)
  const [restockItem, setRestockItem] = useState<SalesItem | null>(null);
  const [restockAddQty, setRestockAddQty] = useState<string>('10');
  const [restockImportPrice, setRestockImportPrice] = useState<string>('');
  const [restockSellPrice, setRestockSellPrice] = useState<string>('');

  // State cho Modal Xem & Copy Bill Bán
  const [previewBill, setPreviewBill] = useState<{
    productName: string;
    category?: string;
    saleDate: string;
    saleDayOfWeek: string;
    quantity: number;
    sellPrice: number;
    discountAmount?: number;
    totalAmount: number;
    stockRemaining: number;
    customerNote?: string;
  } | null>(null);
  const [copiedBill, setCopiedBill] = useState(false);

  // State cho Modal Xác Nhận Hoàn Đơn & Xóa Mặt Hàng (Thay cho window.confirm để không xung đột Cloud Sync)
  const [confirmRefund, setConfirmRefund] = useState<{
    itemId: string;
    productName: string;
    bill: SalesBillRecord;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Khi bấm nút (+) từ BottomTabBar hoặc nút "+ Nhập hàng mới"
  useEffect(() => {
    if (isAddModalOpen && !editingItem) {
      setImportMode('NEW_PRODUCT');
      setSelectedExistingId('');
      setImportDate(getTodayString());
      setCategory('');
      setProductName('');
      setImportQty('10');
      setImportPrice('');
      setSellPrice('');
      setSoldQty('0');
      setNote('');
    }
  }, [isAddModalOpen, editingItem]);

  // Danh sách các Mục hàng (Category) đã tạo để chọn nhanh
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(item => {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set);
  }, [items]);

  // Mở Modal Sửa Mặt Hàng
  const handleOpenEditModal = (item: SalesItem) => {
    setEditingItem(item);
    setImportMode('NEW_PRODUCT');
    setImportDate(item.importDate || getTodayString());
    setCategory(item.category || '');
    setProductName(item.productName);
    setImportQty(String(item.importQty));
    setImportPrice(String(item.importPrice));
    setSellPrice(String(item.sellPrice));
    setSoldQty(String(item.soldQty || 0));
    setNote(item.note || '');
    onOpenAddModal();
  };

  const handleCloseAddModal = () => {
    setEditingItem(null);
    onCloseAddModal();
  };

  // Tự động kiểm tra xem tên sản phẩm đang chọn hoặc đang gõ có trùng với sản phẩm đã có trong kho không
  const matchedExistingItem = useMemo(() => {
    if (editingItem) return null;
    if (selectedExistingId) {
      const byId = items.find(i => i.id === selectedExistingId);
      if (byId) return byId;
    }
    const clean = productName.trim().toLowerCase();
    if (!clean) return null;
    return items.find(i => i.productName.trim().toLowerCase() === clean) || null;
  }, [editingItem, selectedExistingId, productName, items]);

  // Khi chọn 1 mặt hàng có sẵn từ Dropdown hoặc Chip để tránh trùng
  const handleSelectExistingForRestock = (item: SalesItem) => {
    setImportMode('RESTOCK_EXISTING');
    setSelectedExistingId(item.id);
    setProductName(item.productName);
    setCategory(item.category || '');
    setImportPrice(String(item.importPrice));
    setSellPrice(String(item.sellPrice));
  };

  // Khi người dùng gõ vào ô Tên sản phẩm: nếu gõ trùng tên SP đã có thì tự động điền giá của SP đó
  const handleProductNameChange = (val: string) => {
    setProductName(val);
    const clean = val.trim().toLowerCase();
    const matched = items.find(i => i.productName.trim().toLowerCase() === clean);
    if (matched) {
      setSelectedExistingId(matched.id);
      setImportMode('RESTOCK_EXISTING');
      if (!importPrice) setImportPrice(String(matched.importPrice));
      if (!sellPrice) setSellPrice(String(matched.sellPrice));
      if (!category && matched.category) setCategory(matched.category);
    } else {
      setSelectedExistingId('');
      setImportMode('NEW_PRODUCT');
    }
  };

  // Lưu trong Modal Nhập Hàng Mới / Sửa Mặt Hàng
  const handleSubmitProductForm = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedImportQty = Number(importQty) || 0;
    const parsedImportPrice = Number(importPrice) || 0;
    const parsedSellPrice = Number(sellPrice) || 0;
    const parsedSoldQty = Math.max(0, Number(soldQty) || 0);
    const now = Date.now();
    const dayVN = getDayOfWeekVN(importDate);

    // Trường hợp 1: Đang sửa mặt hàng
    if (editingItem) {
      if (!productName.trim()) return;
      const updated: SalesItem = {
        ...editingItem,
        importDate,
        importDayOfWeek: dayVN,
        category: category.trim() || undefined,
        productName: productName.trim(),
        importQty: parsedImportQty,
        importPrice: parsedImportPrice,
        sellPrice: parsedSellPrice,
        soldQty: parsedSoldQty,
        note: note.trim() || undefined,
        updatedAt: now,
      };
      onSaveItems(items.map(i => (i.id === editingItem.id ? updated : i)));
      handleCloseAddModal();
      return;
    }

    // Trường hợp 2: Đã chọn hoặc gõ trùng tên với mặt hàng đã có -> Tự động cộng dồn vào mặt hàng đó để không bị trùng
    if (matchedExistingItem) {
      const updated: SalesItem = {
        ...matchedExistingItem,
        importDate,
        importDayOfWeek: dayVN,
        category: category.trim() ? category.trim() : matchedExistingItem.category,
        importQty: (matchedExistingItem.importQty || 0) + parsedImportQty,
        importPrice: parsedImportPrice || matchedExistingItem.importPrice,
        sellPrice: parsedSellPrice || matchedExistingItem.sellPrice,
        note: note.trim() ? note.trim() : matchedExistingItem.note,
        updatedAt: now,
      };
      onSaveItems(items.map(i => (i.id === matchedExistingItem.id ? updated : i)));
      handleCloseAddModal();
      return;
    }

    // Trường hợp 3: Tạo mặt hàng mới / mục mới hoàn toàn
    if (!productName.trim()) return;
    const initialBills: SalesBillRecord[] =
      parsedSoldQty > 0
        ? [
            {
              id: `bill_${now}`,
              saleDate: importDate,
              saleDayOfWeek: dayVN,
              quantity: parsedSoldQty,
              sellPrice: parsedSellPrice,
              importPrice: parsedImportPrice,
              totalAmount: parsedSoldQty * parsedSellPrice,
              profitAmount: parsedSoldQty * (parsedSellPrice - parsedImportPrice),
              customerNote: 'Đã bán ban đầu',
              createdAt: now,
            },
          ]
        : [];

    const created: SalesItem = {
      id: `sales_${now}_${Math.random().toString(36).slice(2, 6)}`,
      importDate,
      importDayOfWeek: dayVN,
      category: category.trim() || undefined,
      productName: productName.trim(),
      importQty: parsedImportQty,
      importPrice: parsedImportPrice,
      sellPrice: parsedSellPrice,
      soldQty: parsedSoldQty,
      note: note.trim() || undefined,
      bills: initialBills,
      createdAt: now,
      updatedAt: now,
    };

    onSaveItems([created, ...items]);
    handleCloseAddModal();
  };

  // Mở Modal Bấm Bán Hàng Nhanh (Lên Bill)
  const handleOpenSellModal = (item: SalesItem) => {
    setSellingItem(item);
    setSaleDate(getTodayString());
    setSaleQty('1');
    setSaleUnitPrice(String(item.sellPrice));
    setSaleDiscount('');
    setCustomerPaid('');
    setCustomerNote('');
  };

  // Xác nhận Bán Hàng (Trừ tồn kho + Lưu lịch sử Bill + Pháo hoa)
  const handleConfirmSell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingItem) return;

    const qty = Math.max(1, Number(saleQty) || 1);
    const price = Number(saleUnitPrice) || sellingItem.sellPrice || 0;
    const discount = Math.max(0, Number(saleDiscount) || 0);
    const cost = sellingItem.importPrice || 0;
    const totalAmount = Math.max(0, qty * price - discount);
    const profitAmount = totalAmount - qty * cost;
    const dayVN = getDayOfWeekVN(saleDate);
    const now = Date.now();

    const newBill: SalesBillRecord = {
      id: `bill_${now}_${Math.random().toString(36).slice(2, 6)}`,
      saleDate,
      saleDayOfWeek: dayVN,
      quantity: qty,
      sellPrice: price,
      importPrice: cost,
      discountAmount: discount > 0 ? discount : undefined,
      totalAmount,
      profitAmount,
      customerNote: customerNote.trim() || undefined,
      createdAt: now,
    };

    const nextSoldQty = (sellingItem.soldQty || 0) + qty;
    const nextStock = (sellingItem.importQty || 0) - nextSoldQty;

    const updatedItem: SalesItem = {
      ...sellingItem,
      soldQty: nextSoldQty,
      bills: [newBill, ...(sellingItem.bills || [])],
      updatedAt: now,
    };

    confetti({
      particleCount: 65,
      spread: 65,
      origin: { y: 0.75 },
    });

    onSaveItems(items.map(i => (i.id === sellingItem.id ? updatedItem : i)));
    setSellingItem(null);

    // Hiển thị ngay phiếu Bill vừa tạo để có thể Copy gửi Zalo nếu cần
    setPreviewBill({
      productName: sellingItem.productName,
      category: sellingItem.category,
      saleDate,
      saleDayOfWeek: dayVN,
      quantity: qty,
      sellPrice: price,
      discountAmount: discount > 0 ? discount : undefined,
      totalAmount,
      stockRemaining: nextStock,
      customerNote: customerNote.trim() || undefined,
    });
  };

  // Mở Modal Nhập Thêm Hàng Nhanh (1 chạm từ thẻ)
  const handleOpenRestockModal = (item: SalesItem) => {
    setRestockItem(item);
    setRestockAddQty('10');
    setRestockImportPrice(String(item.importPrice));
    setRestockSellPrice(String(item.sellPrice));
  };

  // Xác nhận Nhập Thêm Hàng
  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    const addQty = Math.max(1, Number(restockAddQty) || 0);
    const nextImportPrice = Number(restockImportPrice) || restockItem.importPrice;
    const nextSellPrice = Number(restockSellPrice) || restockItem.sellPrice;

    const updated: SalesItem = {
      ...restockItem,
      importQty: (restockItem.importQty || 0) + addQty,
      importPrice: nextImportPrice,
      sellPrice: nextSellPrice,
      updatedAt: Date.now(),
    };

    onSaveItems(items.map(i => (i.id === restockItem.id ? updated : i)));
    setRestockItem(null);
  };

  // Xóa mặt hàng
  const handleDeleteItem = (id: string, name: string) => {
    setConfirmDelete({ id, name });
  };

  const executeDeleteItem = () => {
    if (!confirmDelete) return;
    onSaveItems(items.filter(i => i.id !== confirmDelete.id));
    setConfirmDelete(null);
  };

  // Xóa / Hoàn 1 Bill Bán (tự động cộng trả lại số lượng vào tồn kho)
  const handleRefundBill = (itemId: string, bill: SalesBillRecord) => {
    const productName = items.find(i => i.id === itemId)?.productName || '';
    setConfirmRefund({ itemId, productName, bill });
  };

  const executeRefundBill = () => {
    if (!confirmRefund) return;
    const { itemId, bill } = confirmRefund;
    const next = items.map(item => {
      if (item.id !== itemId) return item;
      const isLegacy = bill.id.startsWith('legacy_');
      const nextBills = isLegacy
        ? []
        : (item.bills || []).filter(b => b.id !== bill.id);
      const nextSold = isLegacy
        ? 0
        : Math.max(0, (item.soldQty || 0) - bill.quantity);
      return {
        ...item,
        soldQty: nextSold,
        bills: nextBills,
        updatedAt: Date.now(),
      };
    });
    onSaveItems(next);
    setConfirmRefund(null);
  };

  // Danh sách mặt hàng đã lọc
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (selectedCategory !== 'ALL' && (item.category || '') !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.productName.toLowerCase().includes(q);
        const matchCat = item.category ? item.category.toLowerCase().includes(q) : false;
        const matchNote = item.note ? item.note.toLowerCase().includes(q) : false;
        if (!matchName && !matchCat && !matchNote) return false;
      }
      const stock = (item.importQty || 0) - (item.soldQty || 0);
      if (stockFilter === 'IN_STOCK' && stock <= 0) return false;
      if (stockFilter === 'OUT_OF_STOCK' && stock > 0) return false;
      return true;
    });
  }, [items, searchQuery, stockFilter, selectedCategory]);

  // Danh sách toàn bộ các Bill Bán (gộp từ các mặt hàng, xếp mới nhất lên đầu)
  const allBills = useMemo(() => {
    const list: Array<{
      item: SalesItem;
      bill: SalesBillRecord;
    }> = [];

    items.forEach(item => {
      if (item.bills && item.bills.length > 0) {
        item.bills.forEach(bill => {
          list.push({ item, bill });
        });
      } else if ((item.soldQty || 0) > 0) {
        // Tương thích với mặt hàng đã có soldQty nhưng chưa có mảng bills chi tiết
        const qty = item.soldQty;
        const sPrice = item.sellPrice || 0;
        const iPrice = item.importPrice || 0;
        list.push({
          item,
          bill: {
            id: `legacy_${item.id}`,
            saleDate: item.importDate || getTodayString(),
            saleDayOfWeek: item.importDayOfWeek || getDayOfWeekVN(getTodayString()),
            quantity: qty,
            sellPrice: sPrice,
            importPrice: iPrice,
            totalAmount: qty * sPrice,
            profitAmount: qty * (sPrice - iPrice),
            customerNote: item.note,
            createdAt: item.updatedAt || item.createdAt,
          },
        });
      }
    });

    return list
      .filter(({ item, bill }) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.productName.toLowerCase().includes(q) ||
          (bill.customerNote && bill.customerNote.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (b.bill.createdAt || 0) - (a.bill.createdAt || 0));
  }, [items, searchQuery]);

  // Tổng hợp số liệu
  const summary = useMemo(() => {
    let totalUnitProfit = 0;     // Tổng lợi nhuận định mức / 1 SP (= Giá bán - Giá nhập)
    let totalRealizedProfit = 0; // Tổng tiền lời thực tế đã bán (= SL đã bán * Lợi nhuận 1 SP)
    let totalExpectedProfit = 0; // Tổng lời dự kiến nếu bán hết kho (= SL nhập * Lợi nhuận 1 SP)
    let totalRevenue = 0;        // Tổng tiền thu từ Bill Bán (= SL đã bán * Giá bán)
    let totalImportCapital = 0;  // Tổng vốn nhập hàng (= SL nhập * Giá nhập)
    let totalStockValue = 0;     // Giá trị vốn còn tồn trong kho
    let totalImportQty = 0;
    let totalSoldQty = 0;
    let totalStockQty = 0;
    let outOfStockCount = 0;
    let inStockCount = 0;

    items.forEach(item => {
      const impQty = item.importQty || 0;
      const impPrice = item.importPrice || 0;
      const sPrice = item.sellPrice || 0;
      const sQty = item.soldQty || 0;
      const unitProfit = sPrice - impPrice;
      const stockQty = impQty - sQty;

      totalUnitProfit += unitProfit;
      if (item.bills && item.bills.length > 0) {
        item.bills.forEach(b => {
          totalRevenue += b.totalAmount || 0;
          totalRealizedProfit += b.profitAmount || 0;
        });
      } else {
        totalRealizedProfit += sQty * unitProfit;
        totalRevenue += sQty * sPrice;
      }
      totalExpectedProfit += impQty * unitProfit;
      totalImportCapital += impQty * impPrice;
      totalStockValue += Math.max(0, stockQty) * impPrice;
      totalImportQty += impQty;
      totalSoldQty += sQty;
      totalStockQty += stockQty;

      if (stockQty <= 0) {
        outOfStockCount += 1;
      } else {
        inStockCount += 1;
      }
    });

    return {
      totalUnitProfit,
      totalRealizedProfit,
      totalExpectedProfit,
      totalRevenue,
      totalImportCapital,
      totalStockValue,
      totalImportQty,
      totalSoldQty,
      totalStockQty,
      outOfStockCount,
      inStockCount,
    };
  }, [items]);

  const handleCopyPreviewBill = () => {
    if (!previewBill) return;
    const text = [
      '🧾 PHIẾU BILL BÁN HÀNG',
      '------------------------',
      `📅 Ngày: ${formatDateVN(previewBill.saleDate)} (${previewBill.saleDayOfWeek})`,
      `📦 Sản phẩm: ${previewBill.productName}${previewBill.category ? ` (${previewBill.category})` : ''}`,
      `🔢 Số lượng: ${formatNumber(previewBill.quantity)}`,
      `💵 Đơn giá: ${formatVND(previewBill.sellPrice)}`,
      previewBill.discountAmount && previewBill.discountAmount > 0
        ? `🏷️ Giảm giá: -${formatVND(previewBill.discountAmount)}`
        : '',
      `💰 THÀNH TIỀN: ${formatVND(previewBill.totalAmount)}`,
      previewBill.customerNote ? `📝 Ghi chú: ${previewBill.customerNote}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopiedBill(true);
    setTimeout(() => setCopiedBill(false), 1800);
  };

  // Preview tự động trong Modal Nhập Hàng
  const previewUnitProfit = (Number(sellPrice) || 0) - (Number(importPrice) || 0);
  const previewTotalCapital = (Number(importQty) || 0) * (Number(importPrice) || 0);
  const previewStockQty = (Number(importQty) || 0) - (Number(soldQty) || 0);
  const maxModalHeight = Math.min(Math.max(viewportHeight - 20, 360), 840);

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* BANNER TỔNG QUAN BÁN HÀNG */}
      <div className="p-3.5 rounded-3xl bg-gradient-to-br from-orange-600 via-amber-600 to-rose-600 text-white shadow-lg shadow-orange-600/20 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/15 blur-xl pointer-events-none" />

        <div className="mb-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-100 block">
            Lợi nhuận thực thu (Đã bán {formatNumber(summary.totalSoldQty)} cái)
          </span>
          <div className="text-2xl font-black font-mono tracking-tight text-white">
            +{formatVND(summary.totalRealizedProfit)}
          </div>
        </div>

        {/* 3 Ô Thống Kê Nhanh: Doanh Thu - Vốn Nhập - Tồn Kho */}
        <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-white/20 text-center">
          <div className="p-2 rounded-2xl bg-black/15 backdrop-blur-xs">
            <span className="text-[9px] text-orange-100 font-bold uppercase block">
              Tiền Bill Đã Bán
            </span>
            <strong className="text-xs font-black font-mono text-white block mt-0.5">
              {formatVND(summary.totalRevenue)}
            </strong>
          </div>

          <div className="p-2 rounded-2xl bg-black/15 backdrop-blur-xs">
            <span className="text-[9px] text-orange-100 font-bold uppercase block">
              Tổng Vốn Nhập
            </span>
            <strong className="text-xs font-black font-mono text-white block mt-0.5">
              {formatVND(summary.totalImportCapital)}
            </strong>
          </div>

          <div className="p-2 rounded-2xl bg-black/15 backdrop-blur-xs">
            <span className="text-[9px] text-orange-100 font-bold uppercase block">
              Đang Tồn Kho
            </span>
            <strong className="text-xs font-black font-mono text-amber-200 block mt-0.5">
              {formatNumber(summary.totalStockQty)} cái
            </strong>
          </div>
        </div>
      </div>

      {/* BÁO ĐỘNG NẾU CÓ MẶT HÀNG HẾT TỒN KHO */}
      {summary.outOfStockCount > 0 && (
        <div
          onClick={() => {
            setSubTab('inventory');
            setStockFilter('OUT_OF_STOCK');
          }}
          className="p-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/20 flex items-center justify-between gap-2 cursor-pointer active:scale-98 transition-all"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-white/20">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase">
                ⚠️ Cảnh báo hết hàng: {summary.outOfStockCount} mặt hàng!
              </h4>
              <p className="text-[10px] text-white/90">
                Bấm để xem và nhập thêm hàng mới về bán
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-white text-rose-700 text-[11px] font-black shrink-0">
            Xem ngay
          </span>
        </div>
      )}

      {/* THANH CHUYỂN 3 MỤC CON: 1. KHO HÀNG | 2. BILL BÁN | 3. BÁO CÁO LÃI */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/75 rounded-2xl text-xs font-bold">
        <button
          type="button"
          onClick={() => setSubTab('inventory')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
            subTab === 'inventory'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>1. Kho Hàng</span>
          <span className="text-[10px] font-mono opacity-85">({items.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('bills')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
            subTab === 'bills'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>2. Bill Bán</span>
          <span className="text-[10px] font-mono opacity-85">({allBills.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('report')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
            subTab === 'report'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>3. Lãi & Vốn</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* MỤC 1: KHO HÀNG NHẬP (DANH SÁCH MẶT HÀNG & BẤM BÁN 1 CHẠM)        */}
      {/* ================================================================= */}
      {subTab === 'inventory' && (
        <div className="space-y-2.5">
          {/* Ô Tìm kiếm */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Tìm tên sản phẩm, ghi chú..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white/85 border border-slate-200/80 text-xs font-medium text-slate-800 shadow-xs focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          {/* Lọc theo Mục hàng (Category) nếu người dùng có phân loại */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                Tất cả mục
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap flex items-center gap-1 transition-all ${
                    selectedCategory === cat
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          )}

          {/* Bộ lọc phụ: Còn tồn / Hết hàng */}
          <div className="flex items-center gap-1 px-1.5 py-1 bg-orange-50/90 rounded-xl border border-orange-100 text-[11px] font-bold">
            <span className="text-[10px] text-orange-950/70 pl-1 uppercase tracking-wide shrink-0">
              Kho:
            </span>

            <button
              type="button"
              onClick={() => setStockFilter('IN_STOCK')}
              className={`px-2.5 py-0.5 rounded-lg transition-all flex items-center gap-1 ${
                stockFilter === 'IN_STOCK'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white/80 text-slate-700 hover:bg-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Còn tồn ({summary.inStockCount})
            </button>

            <button
              type="button"
              onClick={() => setStockFilter('OUT_OF_STOCK')}
              className={`px-2.5 py-0.5 rounded-lg transition-all flex items-center gap-1 ${
                stockFilter === 'OUT_OF_STOCK'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-white/80 text-slate-700 hover:bg-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Hết hàng ({summary.outOfStockCount})
            </button>
          </div>

          {/* Danh sách Thẻ Mặt Hàng (Thiết kế chuẩn OrderCard của MayTrack) */}
          <div className="space-y-2.5 pt-0.5">
            {filteredItems.map(item => {
              const unitProfit = (item.sellPrice || 0) - (item.importPrice || 0);
              const sold = item.soldQty || 0;
              const stock = (item.importQty || 0) - sold;
              const isOut = stock <= 0;

              const borderStyle = isOut
                ? 'border-l-4 border-l-rose-600 ring-2 ring-rose-300 bg-rose-50/10 border-slate-200'
                : 'border-l-4 border-l-emerald-500 border-slate-200/90';

              return (
                <div
                  key={item.id}
                  className={`relative overflow-hidden rounded-2xl p-3 bg-white border transition-all duration-150 shadow-xs hover:shadow-sm ${borderStyle}`}
                >
                  {/* Hàng 1: Tên Sản Phẩm */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                        {item.productName}
                      </h3>

                      {item.category && (
                        <span className="px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-bold">
                          {item.category}
                        </span>
                      )}

                      {isOut && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-600 text-white animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          ⚠️ HẾT HÀNG {stock < 0 ? `(Âm ${formatNumber(Math.abs(stock))})` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hàng 2: Lưới thông tin SL hiện tại - Đã bán/Tồn kho - Lợi nhuận/1 cái */}
                  <div className="grid grid-cols-3 gap-1.5 my-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        SL hiện tại
                      </span>
                      <strong className="text-xs font-mono font-extrabold text-slate-800">
                        {formatNumber(item.importQty)} cái
                      </strong>
                    </div>

                    <div className="border-x border-slate-200/80 px-1">
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        Đã bán / Tồn kho
                      </span>
                      <div className="text-xs font-mono font-extrabold">
                        <span className="text-orange-600">{formatNumber(sold)}</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className={isOut ? 'text-rose-600' : 'text-emerald-700'}>
                          {formatNumber(stock)} tồn
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        Lợi nhuận / 1 cái
                      </span>
                      <strong className="text-xs font-mono font-black text-amber-700">
                        +{formatVND(unitProfit)}
                      </strong>
                    </div>
                  </div>

                  {/* Ghi chú & Ngày nhập nếu có */}
                  {(item.note || item.importDate) && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 px-0.5">
                      {item.importDate ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Nhập: {formatDateVN(item.importDate)}
                        </span>
                      ) : (
                        <span />
                      )}
                      {item.note && <span className="italic truncate max-w-[60%]">{item.note}</span>}
                    </div>
                  )}

                  {/* Hàng 3: Các nút hành động 1 chạm giống OrderCard */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    {/* Nút chính 1: Bấm Bán Hàng */}
                    <button
                      type="button"
                      onClick={() => handleOpenSellModal(item)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Bán Hàng</span>
                    </button>

                    {/* Nút 2: Nhập thêm hàng vào kho cho mục này */}
                    <button
                      type="button"
                      onClick={() => handleOpenRestockModal(item)}
                      className="py-2 px-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/80 text-xs font-bold active:scale-95 transition-all flex items-center gap-1 shrink-0"
                      title="Nhập thêm số lượng hàng mới về"
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                      <span>+Nhập thêm</span>
                    </button>

                    {/* Nút Sửa */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95 transition-all shrink-0"
                      title="Chỉnh sửa thông tin mặt hàng"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Nút Xóa */}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id, item.productName)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 active:scale-95 transition-all shrink-0"
                      title="Xóa mặt hàng"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Trạng thái trống khi chưa có mặt hàng nào */}
            {filteredItems.length === 0 && (
              <div className="py-10 px-4 text-center rounded-3xl ios-glass border border-slate-200/90 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">
                    {items.length === 0
                      ? 'Kho hàng bán của bạn đang trống'
                      : 'Không tìm thấy mặt hàng nào phù hợp'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Bấm dấu <strong>(+)</strong> ở giữa thanh điều hướng dưới cùng để nhập mặt hàng mới.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MỤC 2: LỊCH SỬ BILL BÁN (DANH SÁCH CÁC ĐƠN ĐÃ BÁN CHO KHÁCH)      */}
      {/* ================================================================= */}
      {subTab === 'bills' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Danh sách Bill đã bán ({allBills.length} đơn)
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700">
              Tổng thu: {formatVND(summary.totalRevenue)}
            </span>
          </div>

          <div className="space-y-2">
            {allBills.map(({ item, bill }) => {
              const currentStock = (item.importQty || 0) - (item.soldQty || 0);
              return (
                <div
                  key={bill.id}
                  className="p-3 rounded-2xl bg-white border border-slate-200/90 border-l-4 border-l-emerald-500 shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {item.productName}
                        </h4>
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                          ĐÃ BÁN: {formatNumber(bill.quantity)} cái
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        <span>
                          {formatDateVN(bill.saleDate)} ({bill.saleDayOfWeek})
                        </span>
                        {bill.customerNote && (
                          <span className="text-slate-700 font-semibold">
                            • {bill.customerNote}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black font-mono text-emerald-700 block">
                        {formatVND(bill.totalAmount)}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-amber-700">
                        Lời: +{formatVND(bill.profitAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-mono">
                      Đơn giá: {formatVND(bill.sellPrice)}/c
                      {bill.discountAmount && bill.discountAmount > 0
                        ? ` (Giảm -${formatVND(bill.discountAmount)})`
                        : ''}{' '}
                      • Kho còn:{' '}
                      <strong className={currentStock <= 0 ? 'text-rose-600' : 'text-slate-800'}>
                        {formatNumber(currentStock)}
                      </strong>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewBill({
                            productName: item.productName,
                            category: item.category,
                            saleDate: bill.saleDate,
                            saleDayOfWeek: bill.saleDayOfWeek,
                            quantity: bill.quantity,
                            sellPrice: bill.sellPrice,
                            discountAmount: bill.discountAmount,
                            totalAmount: bill.totalAmount,
                            stockRemaining: currentStock,
                            customerNote: bill.customerNote,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center gap-1"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Xuất Bill</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRefundBill(item.id, bill)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-all"
                        title="Hoàn đơn & cộng lại tồn kho"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>Hoàn đơn</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {allBills.length === 0 && (
              <div className="py-10 px-4 text-center rounded-3xl ios-glass border border-slate-200/90 space-y-2">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">Chưa có Bill bán hàng nào</h4>
                <p className="text-[11px] text-slate-400">
                  Ở mục <strong>1. Kho Hàng</strong>, hãy bấm nút <strong>Bán Hàng</strong> trên sản phẩm khi có khách mua.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MỤC 3: BÁO CÁO LÃI & VỐN + XUẤT EXCEL/CSV                         */}
      {/* ================================================================= */}
      {subTab === 'report' && (
        <div className="space-y-3">
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-ios-card space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              Bảng Tổng Hợp Vốn - Doanh Thu - Lợi Nhuận
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/70">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                  Lãi thực đã thu
                </span>
                <strong className="text-base font-black font-mono text-emerald-700">
                  +{formatVND(summary.totalRealizedProfit)}
                </strong>
                <span className="text-[10px] text-emerald-700/80 block mt-0.5">
                  Từ {formatNumber(summary.totalSoldQty)} sản phẩm đã bán
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70">
                <span className="text-[10px] font-bold uppercase text-amber-900 block">
                  Lãi dự kiến nếu bán hết
                </span>
                <strong className="text-base font-black font-mono text-amber-700">
                  +{formatVND(summary.totalExpectedProfit)}
                </strong>
                <span className="text-[10px] text-amber-800/80 block mt-0.5">
                  Tổng {formatNumber(summary.totalImportQty)} sản phẩm nhập
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  Tổng vốn đã nhập
                </span>
                <strong className="text-sm font-black font-mono text-slate-900">
                  {formatVND(summary.totalImportCapital)}
                </strong>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  Vốn hàng đang tồn kho
                </span>
                <strong className="text-sm font-black font-mono text-indigo-700">
                  {formatVND(summary.totalStockValue)}
                </strong>
              </div>
            </div>
          </div>

          {/* Chi tiết lợi nhuận theo từng mặt hàng */}
          <div className="p-3.5 rounded-3xl bg-white border border-slate-200/90 shadow-ios-card space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Lợi nhuận từng mặt hàng
            </h4>
            {items.map((item, idx) => {
              const unitProfit = (item.sellPrice || 0) - (item.importPrice || 0);
              const sold = item.soldQty || 0;
              const stock = (item.importQty || 0) - sold;
              const realized =
                item.bills && item.bills.length > 0
                  ? item.bills.reduce((acc, b) => acc + (b.profitAmount || 0), 0)
                  : sold * unitProfit;

              return (
                <div
                  key={item.id}
                  className="p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <strong className="text-slate-900 font-bold flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-md bg-orange-100 text-orange-700 text-[10px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {item.productName}
                    </strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Lời/cái: +{formatVND(unitProfit)} • Đã bán: {formatNumber(sold)} • Tồn:{' '}
                      {formatNumber(stock)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-emerald-700 block">
                      +{formatVND(realized)}
                    </span>
                    <span className="text-[10px] text-slate-400">Lãi đã thu</span>
                  </div>
                </div>
              );
            })}

            {items.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-3">Chưa có mặt hàng nào</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => exportSalesToCSV(items)}
            className="w-full py-3 px-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Tải file Excel / CSV Sổ Bán Hàng</span>
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 1: NHẬP MẶT HÀNG MỚI / TẠO MỤC MỚI / NHẬP THÊM VÀO KHO      */}
      {/* ================================================================= */}
      {isAddModalOpen && (
        <div
          className="fixed md:absolute inset-0 z-50 flex items-end justify-center p-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleCloseAddModal}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-t-[32px] shadow-2xl flex flex-col border-t border-slate-100 animate-in slide-in-from-bottom duration-300 overflow-hidden"
            style={{ maxHeight: `${maxModalHeight}px` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2 shrink-0" />

            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-orange-50 text-orange-600">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {editingItem ? 'Chỉnh Sửa Mặt Hàng' : 'Phiếu Nhập Hàng Bán Mới'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Thêm sản phẩm mới hoặc chọn mặt hàng có sẵn để nhập thêm
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseAddModal}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmitProductForm}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            >
              {/* Ngày nhập hàng */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                    Thứ nhập
                  </label>
                  <div className="h-[38px] px-2.5 flex items-center justify-center rounded-xl bg-orange-50 border border-orange-200 text-xs font-bold text-orange-900">
                    {getDayOfWeekVN(importDate)}
                  </div>
                </div>
                <div className="col-span-8">
                  <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-orange-600" />
                    Ngày nhập hàng
                  </label>
                  <DateInputVN value={importDate} onChange={setImportDate} required />
                </div>
              </div>

              {/* Tên Sản Phẩm / Mặt Hàng (Có tùy chọn chọn từ SP đã có để khỏi bị trùng + gõ mới) */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 block">
                      Tên sản phẩm / mặt hàng <span className="text-rose-500">*</span>
                    </label>
                    {!editingItem && items.length > 0 && (
                      <span className="text-[10px] font-bold text-orange-600">
                        Chọn SP đã có hoặc gõ tên mới
                      </span>
                    )}
                  </div>

                  {/* Dropdown chọn sản phẩm đã có trong kho (để tránh nhập trùng) */}
                  {!editingItem && items.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="relative">
                        <select
                          value={matchedExistingItem ? matchedExistingItem.id : ''}
                          onChange={e => {
                            const val = e.target.value;
                            if (!val) {
                              setImportMode('NEW_PRODUCT');
                              setSelectedExistingId('');
                              setProductName('');
                              setImportPrice('');
                              setSellPrice('');
                              return;
                            }
                            const found = items.find(i => i.id === val);
                            if (found) {
                              handleSelectExistingForRestock(found);
                            }
                          }}
                          className="w-full h-[38px] pl-3 pr-8 rounded-xl bg-white border border-orange-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer truncate shadow-2xs"
                        >
                          <option value="">
                            ➕ Gõ tên mặt hàng mới hoàn toàn...
                          </option>
                          {items.map(item => {
                            const stock = (item.importQty || 0) - (item.soldQty || 0);
                            return (
                              <option key={item.id} value={item.id}>
                                📦 {item.productName} (Đang tồn: {stock} • Vốn: {formatVND(item.importPrice)} • Bán: {formatVND(item.sellPrice)})
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* Các nút bấm chọn nhanh 1 chạm các sản phẩm đã có */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                        <button
                          type="button"
                          onClick={() => {
                            setImportMode('NEW_PRODUCT');
                            setSelectedExistingId('');
                            setProductName('');
                            setImportPrice('');
                            setSellPrice('');
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all shrink-0 border ${
                            !matchedExistingItem
                              ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          + Mặt hàng mới
                        </button>

                        {items.map(item => {
                          const stock = (item.importQty || 0) - (item.soldQty || 0);
                          const isSelected = matchedExistingItem?.id === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectExistingForRestock(item)}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1 border ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                              }`}
                            >
                              <span>{item.productName}</span>
                              <span
                                className={`text-[10px] font-mono ${
                                  isSelected ? 'text-indigo-100' : 'text-slate-400'
                                }`}
                              >
                                ({stock})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Ô nhập tên mặt hàng (Có tự động kiểm tra trùng tên) */}
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên mặt hàng mới hoặc chọn ở trên..."
                    value={productName}
                    onChange={e => handleProductNameChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none"
                  />

                  {/* Thông báo ngắn gọn khi phát hiện sản phẩm đã có trong kho */}
                  {!editingItem && matchedExistingItem && (
                    <div className="px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 font-bold flex items-center gap-1.5 animate-in fade-in duration-150">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Đã có "{matchedExistingItem.productName}" trong kho</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Số lượng nhập & Giá nhập - Giá bán */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                    {matchedExistingItem
                      ? 'Số lượng nhập thêm *'
                      : 'Số lượng nhập *'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={formatInputDots(importQty)}
                    onChange={e => setImportQty(parseInputDots(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                {editingItem ? (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                      Tổng SL đã bán
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatInputDots(soldQty)}
                      onChange={e => setSoldQty(parseInputDots(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-orange-50/70 border border-orange-200 text-xs font-black font-mono text-orange-800 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                      Tổng vốn lô này
                    </label>
                    <div className="h-[34px] px-3 flex items-center rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700">
                      {formatVND(previewTotalCapital)}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                    Giá nhập (Vốn / 1 cái) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="VD: 50.000"
                    value={formatInputDots(importPrice)}
                    onChange={e => setImportPrice(parseInputDots(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                    Giá bán lẻ (1 cái) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="VD: 70.000"
                    value={formatInputDots(sellPrice)}
                    onChange={e => setSellPrice(parseInputDots(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs font-bold font-mono text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Khung Tự Động Tính Lợi Nhuận & Tồn Kho */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-amber-900 block">
                    Lợi nhuận 1 sản phẩm (= Giá bán − Giá nhập)
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Dự kiến lời lô này ({formatNumber(Number(importQty) || 0)} cái):{' '}
                    <strong className="font-mono text-emerald-700">
                      +{formatVND((Number(importQty) || 0) * previewUnitProfit)}
                    </strong>
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`text-base font-black font-mono ${
                      previewUnitProfit >= 0 ? 'text-amber-700' : 'text-rose-600'
                    }`}
                  >
                    +{formatVND(previewUnitProfit)}
                  </span>
                  {editingItem && (
                    <span className="text-[10px] font-bold text-slate-500 block">
                      Tồn: {formatNumber(previewStockQty)}
                    </span>
                  )}
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                  Ghi chú (Nguồn lấy hàng, màu sắc, kích cỡ...)
                </label>
                <input
                  type="text"
                  placeholder="Ghi chú thêm nếu cần..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="w-24 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl text-white text-xs font-black shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5 ${
                    matchedExistingItem
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25'
                      : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/25'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{editingItem ? 'Lưu Cập Nhật' : 'Thêm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: BẤM BÁN HÀNG NHANH (LÊN BILL 1 CHẠM - NHƯ QUICK DELIVER)  */}
      {/* ================================================================= */}
      {sellingItem && (
        <div
          className="fixed md:absolute inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSellingItem(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl p-4 space-y-3 border border-slate-100 animate-in slide-in-from-bottom duration-300 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto -mt-1 mb-1 sm:hidden" />

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Xác Nhận Bán Hàng (Lên Bill)</h3>
                  <p className="text-[10px] text-slate-500">
                    Tự động trừ tồn kho & tính tiền lời ngay lập tức
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSellingItem(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thông tin mặt hàng đang bán */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Sản phẩm xuất bán
                </span>
                <h4 className="text-sm font-black text-slate-900">{sellingItem.productName}</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Kho hiện còn
                </span>
                <strong className="text-sm font-mono font-black text-emerald-700">
                  {formatNumber((sellingItem.importQty || 0) - (sellingItem.soldQty || 0))} cái
                </strong>
              </div>
            </div>

            <form onSubmit={handleConfirmSell} className="space-y-3">
              {/* Ngày bán */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">Thứ</label>
                  <div className="h-[38px] px-2.5 flex items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
                    {getDayOfWeekVN(saleDate)}
                  </div>
                </div>
                <div className="col-span-8">
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                    Ngày bán hàng
                  </label>
                  <DateInputVN value={saleDate} onChange={setSaleDate} required theme="emerald" />
                </div>
              </div>

              {/* Số lượng bán (kèm nút chọn nhanh 1, 2, 5, 10) & Đơn giá bán */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                    Số lượng khách mua *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={formatInputDots(saleQty)}
                    onChange={e => setSaleQty(parseInputDots(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 5, 10].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSaleQty(String(n))}
                        className={`flex-1 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                          Number(saleQty) === n
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                    Giá bán thực tế (1 cái) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={formatInputDots(saleUnitPrice)}
                    onChange={e => setSaleUnitPrice(parseInputDots(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black font-mono text-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Mục Giảm giá để giảm số tiền thực tế bán */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                  Giảm giá (Trừ vào tiền bán thực tế)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Nhập số tiền giảm (VD: 5.000, 10.000...)"
                  value={formatInputDots(saleDiscount)}
                  onChange={e => setSaleDiscount(parseInputDots(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-amber-50/60 border border-amber-200 text-xs font-black font-mono text-amber-800 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <div className="flex gap-1 mt-1">
                  {[0, 5000, 10000, 15000, 20000].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSaleDiscount(d === 0 ? '' : String(d))}
                      className={`flex-1 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                        (Number(saleDiscount) || 0) === d
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {d === 0 ? 'Không giảm' : `-${formatNumber(d)}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ghi chú tên khách hàng */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                  Tên khách / Ghi chú đơn bán (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: Chị Lan mua, khách lẻ..."
                  value={customerNote}
                  onChange={e => setCustomerNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Banner Tổng Tiền Bill & Nhập Tiền Khách Đưa */}
              {(() => {
                const currentTotal = Math.max(
                  0,
                  (Number(saleQty) || 0) * (Number(saleUnitPrice) || 0) -
                    Math.max(0, Number(saleDiscount) || 0)
                );
                const paidAmount = Number(customerPaid) || 0;
                const changeAmount = paidAmount - currentTotal;

                return (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] uppercase font-extrabold text-emerald-100 block">
                          Thành tiền thu khách
                        </span>
                        {(Number(saleDiscount) || 0) > 0 && (
                          <span className="text-[10px] font-mono text-amber-200 block">
                            Đã giảm: -{formatVND(Number(saleDiscount) || 0)}
                          </span>
                        )}
                      </div>
                      <div className="text-xl font-black font-mono">
                        {formatVND(currentTotal)}
                      </div>
                    </div>

                    {/* Phần nhập tiền khách đưa & tính tiền thừa trả khách */}
                    <div className="pt-2.5 border-t border-white/20 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-bold text-emerald-50 shrink-0">
                          Tiền khách đưa:
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Nhập tiền khách đưa..."
                          value={formatInputDots(customerPaid)}
                          onChange={e => setCustomerPaid(parseInputDots(e.target.value))}
                          className="w-40 px-2.5 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-black font-mono text-right placeholder:text-slate-400 placeholder:font-normal outline-none focus:ring-2 focus:ring-amber-300"
                        />
                      </div>

                      <div className="flex gap-1">
                        {[
                          { label: 'Đủ tiền', val: currentTotal },
                          { label: '100.000', val: 100000 },
                          { label: '200.000', val: 200000 },
                          { label: '500.000', val: 500000 },
                        ].map(btn => (
                          <button
                            key={btn.label}
                            type="button"
                            onClick={() => setCustomerPaid(String(btn.val))}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                              paidAmount === btn.val && customerPaid !== ''
                                ? 'bg-amber-300 text-slate-900 shadow-2xs'
                                : 'bg-white/15 hover:bg-white/25 text-white'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      {customerPaid !== '' && paidAmount > 0 && (
                        <div className="pt-1 flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-100">
                            {changeAmount >= 0 ? 'Tiền thừa trả khách:' : 'Khách còn thiếu:'}
                          </span>
                          <strong
                            className={`font-mono text-sm font-black ${
                              changeAmount >= 0 ? 'text-amber-200' : 'text-rose-200'
                            }`}
                          >
                            {formatVND(Math.abs(changeAmount))}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSellingItem(null)}
                  className="w-24 py-2.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác Nhận Bán & Xuất Bill</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: NHẬP THÊM HÀNG NHANH CHO MẶT HÀNG ĐÃ CÓ (RESTOCK)        */}
      {/* ================================================================= */}
      {restockItem && (
        <div
          className="fixed md:absolute inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setRestockItem(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl p-4 space-y-3 border border-slate-100 animate-in slide-in-from-bottom duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Nhập Thêm Hàng Vào Kho</h3>
                  <p className="text-[10px] text-slate-500">{restockItem.productName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestockItem(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                  Số lượng nhập thêm đợt này *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={formatInputDots(restockAddQty)}
                  onChange={e => setRestockAddQty(parseInputDots(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black font-mono text-orange-700 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Tồn kho sau khi cộng:{' '}
                  <strong className="font-mono text-emerald-700">
                    {formatNumber(
                      (restockItem.importQty || 0) -
                        (restockItem.soldQty || 0) +
                        (Number(restockAddQty) || 0)
                    )}{' '}
                    cái
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                    Giá nhập (1 cái)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={formatInputDots(restockImportPrice)}
                    onChange={e => setRestockImportPrice(parseInputDots(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                    Giá bán (1 cái)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={formatInputDots(restockSellPrice)}
                    onChange={e => setRestockSellPrice(parseInputDots(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold font-mono text-emerald-700"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="w-24 py-2.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Thêm</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 4: XEM & COPY PHIẾU BILL BÁN GỬI ZALO CHO KHÁCH             */}
      {/* ================================================================= */}
      {previewBill && (
        <div
          className="fixed md:absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewBill(null)}
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
                  <h3 className="text-sm font-black text-slate-900">PHIẾU BILL BÁN HÀNG</h3>
                  <p className="text-[10px] text-slate-400">
                    {formatDateVN(previewBill.saleDate)} ({previewBill.saleDayOfWeek})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewBill(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Sản phẩm:</span>
                <strong className="text-slate-900 font-black">{previewBill.productName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số lượng mua:</span>
                <strong className="font-mono text-orange-700 font-black">
                  {formatNumber(previewBill.quantity)} cái
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Đơn giá:</span>
                <strong className="font-mono text-slate-900">
                  {formatVND(previewBill.sellPrice)}
                </strong>
              </div>
              {previewBill.discountAmount && previewBill.discountAmount > 0 ? (
                <div className="flex justify-between">
                  <span className="text-slate-500">Giảm giá:</span>
                  <strong className="font-mono text-rose-600">
                    -{formatVND(previewBill.discountAmount)}
                  </strong>
                </div>
              ) : null}
              {previewBill.customerNote && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Ghi chú:</span>
                  <strong className="text-slate-700">{previewBill.customerNote}</strong>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-black text-slate-800">TỔNG TIỀN BILL:</span>
                <span className="text-base font-black font-mono text-emerald-700">
                  {formatVND(previewBill.totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreviewBill(null)}
                className="w-24 py-2.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleCopyPreviewBill}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-98 transition-all"
              >
                {copiedBill ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedBill ? 'Đã copy Bill!' : 'Copy Bill gửi Zalo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 5: XÁC NHẬN HOÀN ĐƠN BÁN                                    */}
      {/* ================================================================= */}
      {confirmRefund && (
        <div
          className="fixed md:absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setConfirmRefund(null)}
        >
          <div
            className="w-full max-w-xs bg-white rounded-3xl shadow-2xl p-4 space-y-3 border border-slate-100 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Undo2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Xác nhận hoàn đơn?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Hoàn đơn bán <strong>{formatNumber(confirmRefund.bill.quantity)} cái</strong>{' '}
                <strong>"{confirmRefund.productName}"</strong>? Số lượng sẽ được cộng trả lại vào tồn kho.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmRefund(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={executeRefundBill}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                Hoàn đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 6: XÁC NHẬN XÓA MẶT HÀNG                                    */}
      {/* ================================================================= */}
      {confirmDelete && (
        <div
          className="fixed md:absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-xs bg-white rounded-3xl shadow-2xl p-4 space-y-3 border border-slate-100 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Xóa mặt hàng này?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Bạn có chắc muốn xóa mặt hàng <strong>"{confirmDelete.name}"</strong> khỏi kho không?
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={executeDeleteItem}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
