import React, { useState, useMemo, useEffect } from 'react';
import { SewingOrder, StagePreset, WorkshopSettings, TabType, OrderStatus } from './types';
import { 
  loadOrders, saveOrders, 
  loadPresets, savePresets, 
  loadSettings, saveSettings, 
  INITIAL_ORDERS, DEFAULT_PRESETS, DEFAULT_SETTINGS 
} from './utils/storage';
import { formatVND, formatNumber, formatKg, formatDateVN } from './utils/format';

import { Header } from './components/Header';
import { StatCards } from './components/StatCard';
import { OrderCard } from './components/OrderCard';
import { OrderModal } from './components/OrderModal';
import { QuickDeliverModal } from './components/QuickDeliverModal';
import { ReceiptModal } from './components/ReceiptModal';
import { PresetsModal } from './components/PresetsModal';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { BottomTabBar } from './components/BottomTabBar';

import { 
  Search, Plus, Filter, Calendar, CheckCircle2, Clock, 
  TrendingUp, Scissors, Sparkles, Layers, ChevronRight, FileSpreadsheet, Tag
} from 'lucide-react';

export function App() {
  const [orders, setOrders] = useState<SewingOrder[]>(loadOrders);
  const [presets, setPresets] = useState<StagePreset[]>(loadPresets);
  const [settings, setSettings] = useState<WorkshopSettings>(loadSettings);

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // Modals state
  const [isOrderModalOpen, setOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SewingOrder | null>(null);
  const [quickDeliverOrder, setQuickDeliverOrder] = useState<SewingOrder | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<SewingOrder | null>(null);
  const [isPresetsOpen, setPresetsOpen] = useState(false);
  const [isExportOpen, setExportOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    savePresets(presets);
  }, [presets]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Extract distinct months from orders (e.g. "2026-07", "2026-10")
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => {
      if (o.receiveDate) set.add(o.receiveDate.substring(0, 7));
      if (o.deliveryDate) set.add(o.deliveryDate.substring(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = o.stageName.toLowerCase().includes(q);
        const matchNote = o.note ? o.note.toLowerCase().includes(q) : false;
        if (!matchName && !matchNote) return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && o.status !== statusFilter) {
        return false;
      }
      // Month filter
      if (selectedMonth !== 'ALL') {
        const inReceive = o.receiveDate.startsWith(selectedMonth);
        const inDelivery = o.deliveryDate ? o.deliveryDate.startsWith(selectedMonth) : false;
        if (!inReceive && !inDelivery) return false;
      }
      return true;
    }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [orders, searchQuery, statusFilter, selectedMonth]);

  // Calculations
  const stats = useMemo(() => {
    let totalDeliveredAmount = 0;
    let totalPendingAmount = 0;
    let totalDeliveredQty = 0;
    let totalPendingQty = 0;
    let totalFabricKg = 0;

    // Filter by selected month for stats as well
    const relevantOrders = selectedMonth === 'ALL' 
      ? orders 
      : orders.filter(o => o.receiveDate.startsWith(selectedMonth) || (o.deliveryDate && o.deliveryDate.startsWith(selectedMonth)));

    relevantOrders.forEach(o => {
      if (o.status === 'DELIVERED') {
        totalDeliveredAmount += o.totalAmount || (o.unitPrice * (o.deliverQuantity || o.receiveQuantity));
        totalDeliveredQty += o.deliverQuantity || o.receiveQuantity;
      } else {
        totalPendingAmount += o.unitPrice * o.receiveQuantity;
        totalPendingQty += o.receiveQuantity;
      }

      if (o.receiveFabricKg) {
        totalFabricKg += o.receiveFabricKg;
      }
    });

    return {
      totalDeliveredAmount,
      totalPendingAmount,
      totalDeliveredQty,
      totalPendingQty,
      totalFabricKg,
    };
  }, [orders, selectedMonth]);

  // Breakdown by stage name
  const stageBreakdown = useMemo(() => {
    const map: { [name: string]: { count: number; qty: number; amount: number } } = {};
    orders.forEach(o => {
      if (!map[o.stageName]) {
        map[o.stageName] = { count: 0, qty: 0, amount: 0 };
      }
      map[o.stageName].count += 1;
      map[o.stageName].qty += (o.deliverQuantity || o.receiveQuantity);
      if (o.status === 'DELIVERED') {
        map[o.stageName].amount += o.totalAmount;
      }
    });
    return Object.entries(map).map(([name, data]) => ({
      name,
      ...data,
    })).sort((a, b) => b.amount - a.amount);
  }, [orders]);

  // Handlers
  const handleSaveOrder = (saved: SewingOrder) => {
    setOrders(prev => {
      const idx = prev.findIndex(o => o.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  const handleDeleteOrder = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công đoạn may này không?')) {
      setOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  const handleQuickDeliverConfirm = (delivered: SewingOrder) => {
    setOrders(prev => prev.map(o => o.id === delivered.id ? delivered : o));
  };

  const handleOpenAddModal = () => {
    setEditingOrder(null);
    setOrderModalOpen(true);
  };

  const handleOpenEdit = (order: SewingOrder) => {
    setEditingOrder(order);
    setOrderModalOpen(true);
  };

  const handleResetSample = () => {
    setOrders(INITIAL_ORDERS);
    setPresets(DEFAULT_PRESETS);
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="min-h-screen text-slate-800 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      {/* Top Header */}
      <Header
        settings={settings}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenExport={() => setExportOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 pt-3">
        {/* Month Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar mb-2 text-xs">
          <button
            onClick={() => setSelectedMonth('ALL')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all whitespace-nowrap ${
              selectedMonth === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white/70 text-slate-600 hover:bg-white border border-slate-200'
            }`}
          >
            Tất cả tháng
          </button>
          {availableMonths.map(m => {
            const [y, mon] = m.split('-');
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`px-3 py-1.5 rounded-full font-bold transition-all whitespace-nowrap ${
                  selectedMonth === m
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-white/70 text-slate-600 hover:bg-white border border-slate-200'
                }`}
              >
                Tháng {parseInt(mon, 10)}/{y}
              </button>
            );
          })}
        </div>

        {/* TAB 1: DASHBOARD */}
        {currentTab === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Stat Cards */}
            <StatCards
              totalDeliveredAmount={stats.totalDeliveredAmount}
              totalPendingAmount={stats.totalPendingAmount}
              totalDeliveredQty={stats.totalDeliveredQty}
              totalPendingQty={stats.totalPendingQty}
              totalFabricKg={stats.totalFabricKg}
            />

            {/* Quick Action Banner */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 text-white shadow-lg shadow-indigo-500/20 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs uppercase font-extrabold tracking-wider text-teal-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ghi nhận tiến độ
                </span>
                <h3 className="text-sm font-bold">Thêm công đoạn hôm nay</h3>
                <p className="text-[11px] text-indigo-100">Chọn nhanh đơn giá mẫu chỉ trong 5 giây</p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2.5 rounded-2xl bg-white text-indigo-700 text-xs font-bold shadow-md hover:bg-indigo-50 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Thêm ngay
              </button>
            </div>

            {/* Active / In-progress tasks header */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Đang May & Chờ Giao ({orders.filter(o => o.status !== 'DELIVERED').length})
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setStatusFilter('IN_PROGRESS');
                    setCurrentTab('orders');
                  }}
                  className="text-xs font-semibold text-indigo-600 flex items-center"
                >
                  Xem tất cả <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>

              <div className="space-y-3">
                {orders.filter(o => o.status !== 'DELIVERED').slice(0, 3).map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onQuickDeliver={setQuickDeliverOrder}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteOrder}
                    onShareReceipt={setReceiptOrder}
                  />
                ))}

                {orders.filter(o => o.status !== 'DELIVERED').length === 0 && (
                  <div className="p-6 text-center rounded-2xl ios-glass border border-dashed border-slate-300">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-700">Tất cả hàng đã được bàn giao!</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Không còn công đoạn nào đang chờ may</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recently Delivered */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800">Công Đoạn Vừa Giao Gần Đây</h3>
                </div>
                <button
                  onClick={() => {
                    setStatusFilter('DELIVERED');
                    setCurrentTab('orders');
                  }}
                  className="text-xs font-semibold text-indigo-600 flex items-center"
                >
                  Xem tất cả <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>

              <div className="space-y-3">
                {orders.filter(o => o.status === 'DELIVERED').slice(0, 2).map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onQuickDeliver={setQuickDeliverOrder}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteOrder}
                    onShareReceipt={setReceiptOrder}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SỔ CÔNG ĐOẠN (ORDERS LIST) */}
        {currentTab === 'orders' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Tìm công đoạn, ghi chú, mã hàng..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white/80 border border-slate-200/80 text-xs font-medium text-slate-800 shadow-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Segmented Filter Pills */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/70 rounded-2xl text-[11px] font-bold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`py-1.5 rounded-xl transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({orders.length})
              </button>
              <button
                onClick={() => setStatusFilter('IN_PROGRESS')}
                className={`py-1.5 rounded-xl transition-all ${
                  statusFilter === 'IN_PROGRESS'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đang may
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`py-1.5 rounded-xl transition-all ${
                  statusFilter === 'PENDING'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chờ may
              </button>
              <button
                onClick={() => setStatusFilter('DELIVERED')}
                className={`py-1.5 rounded-xl transition-all ${
                  statusFilter === 'DELIVERED'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đã giao
              </button>
            </div>

            {/* List of Orders */}
            <div className="space-y-3 pt-1">
              {filteredOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onQuickDeliver={setQuickDeliverOrder}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteOrder}
                  onShareReceipt={setReceiptOrder}
                />
              ))}

              {filteredOrders.length === 0 && (
                <div className="py-12 text-center rounded-3xl ios-glass border border-slate-200">
                  <Scissors className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-700">Chưa tìm thấy công đoạn nào</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Hãy bấm nút (+) bên dưới để thêm công đoạn may mới vào sổ theo dõi.
                  </p>
                  <button
                    onClick={handleOpenAddModal}
                    className="mt-4 px-4 py-2 rounded-2xl bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm công đoạn
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BÁO CÁO & THỐNG KÊ (REPORTS) */}
        {currentTab === 'reports' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header Summary */}
            <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-300">
                  Báo cáo thu nhập tiền công
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {selectedMonth === 'ALL' ? 'Toàn bộ thời gian' : `Tháng ${selectedMonth}`}
                </span>
              </div>
              <div className="text-3xl font-black font-mono text-emerald-400">
                {formatVND(stats.totalDeliveredAmount)}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tổng sản phẩm</span>
                  <span className="text-sm font-bold font-mono text-white">
                    {formatNumber(stats.totalDeliveredQty + stats.totalPendingQty)} cái
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Khối lượng vải</span>
                  <span className="text-sm font-bold font-mono text-white">
                    {formatKg(stats.totalFabricKg)}
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown by Sewing Stage */}
            <div className="p-4 rounded-3xl ios-glass border border-white/70 shadow-ios-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Cơ cấu thu nhập theo công đoạn
              </h3>

              <div className="space-y-3">
                {stageBreakdown.map((item, idx) => {
                  const percent = stats.totalDeliveredAmount > 0 
                    ? Math.round((item.amount / stats.totalDeliveredAmount) * 100) 
                    : 0;

                  return (
                    <div key={item.name} className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <strong className="text-slate-800 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          {item.name}
                        </strong>
                        <span className="font-bold font-mono text-indigo-700">
                          {formatVND(item.amount)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                        <span>Sản lượng: {formatNumber(item.qty)} cái ({item.count} đơn)</span>
                        <span>{percent}% tổng tiền</span>
                      </div>
                    </div>
                  );
                })}

                {stageBreakdown.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">Chưa có dữ liệu thống kê</p>
                )}
              </div>
            </div>

            {/* Export Sheet Action */}
            <button
              onClick={() => setExportOpen(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-sm hover:bg-slate-50 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Tải file Excel / CSV giống Google Sheet
            </button>
          </div>
        )}

        {/* TAB 4: BẢNG GIÁ CÔNG ĐOẠN (PRESETS) */}
        {currentTab === 'presets' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-3xl ios-glass border border-white/70 shadow-ios-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Danh Mục Bảng Giá Mẫu</h3>
                    <p className="text-[11px] text-slate-400">Chọn 1 chạm khi nhập đơn mới</p>
                  </div>
                </div>
                <button
                  onClick={() => setPresetsOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm mới
                </button>
              </div>

              <div className="space-y-2">
                {presets.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-100"
                  >
                    <div>
                      <strong className="text-xs font-bold text-slate-800 block">{p.name}</strong>
                      <span className="text-[10px] text-slate-400">Đơn giá tiêu chuẩn</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-purple-700">
                      {formatVND(p.defaultUnitPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setPresetsOpen(true)}
              className="w-full py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 flex items-center justify-center gap-1.5 transition-all"
            >
              Chỉnh sửa & Quản lý danh mục
            </button>
          </div>
        )}
      </main>

      {/* Floating Bottom Tab Bar */}
      <BottomTabBar
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        onOpenAddModal={handleOpenAddModal}
      />

      {/* MODALS */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        onSave={handleSaveOrder}
        editingOrder={editingOrder}
        presets={presets}
      />

      <QuickDeliverModal
        order={quickDeliverOrder}
        onClose={() => setQuickDeliverOrder(null)}
        onConfirm={handleQuickDeliverConfirm}
      />

      <ReceiptModal
        order={receiptOrder}
        settings={settings}
        onClose={() => setReceiptOrder(null)}
      />

      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setPresetsOpen(false)}
        presets={presets}
        onSavePresets={setPresets}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setExportOpen(false)}
        orders={orders}
        presets={presets}
        settings={settings}
        onRestore={(o, p, s) => {
          setOrders(o);
          setPresets(p);
          setSettings(s);
        }}
        onResetSample={handleResetSample}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />
    </div>
  );
}
