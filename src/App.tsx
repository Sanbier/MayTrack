import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { SewingOrder, StagePreset, WorkshopSettings, TabType, OrderStatus } from './types';
import { 
  loadOrders, saveOrders, 
  loadPresets, savePresets, 
  loadSettings, saveSettings, 
  INITIAL_ORDERS, DEFAULT_PRESETS, DEFAULT_SETTINGS 
} from './utils/storage';
import { 
  getCloudUrl, fetchFromCloud, pushToCloud, 
  subscribeToCloudUpdates, CloudPayload 
} from './utils/cloudSync';
import { formatVND, formatNumber, formatKg, formatDateVN } from './utils/format';

import { StatCards } from './components/StatCard';
import { OrderCard } from './components/OrderCard';
import { OrderModal } from './components/OrderModal';
import { QuickDeliverModal } from './components/QuickDeliverModal';
import { ReceiptModal } from './components/ReceiptModal';
import { PresetsModal } from './components/PresetsModal';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { MonthDaysModal } from './components/MonthDaysModal';
import { BottomTabBar } from './components/BottomTabBar';

import { 
  Search, Plus, CheckCircle2, Clock, 
  TrendingUp, Scissors, ChevronRight, ChevronLeft, FileSpreadsheet, Settings, 
  Cloud, CloudLightning, RefreshCw, ArrowDownUp, Calendar
} from 'lucide-react';

function getCurrentMonthString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatMonthLabel(monthStr: string): string {
  if (!monthStr || monthStr === 'ALL') return 'Toàn bộ';
  const parts = monthStr.split('-');
  if (parts.length === 2) {
    return `Tháng ${parseInt(parts[1], 10)}/${parts[0]}`;
  }
  return monthStr;
}

function shiftMonth(monthStr: string, delta: number): string {
  const base = monthStr === 'ALL' ? getCurrentMonthString() : monthStr;
  const [yStr, mStr] = base.split('-');
  let y = parseInt(yStr, 10);
  let m = parseInt(mStr, 10) + delta;

  if (m < 1) {
    m = 12;
    y -= 1;
  } else if (m > 12) {
    m = 1;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function App() {
  const [orders, setOrders] = useState<SewingOrder[]>(loadOrders);
  const [presets, setPresets] = useState<StagePreset[]>(loadPresets);
  const [settings, setSettings] = useState<WorkshopSettings>(loadSettings);

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RECEIVED' | 'IN_PROGRESS' | 'PENDING' | 'DELIVERED'>('ALL');
  
  // Selected month: e.g. '2026-10' or 'ALL'
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return getCurrentMonthString();
  });
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // Swipe gesture detection
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0) {
        handleNextMonth();
      } else {
        handlePrevMonth();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };


  // Sort order: 'desc' (mới nhất trước) hoặc 'asc' (từ ngày cũ đến mới theo dòng thời gian)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>(() => {
    return (localStorage.getItem('maytrack_sort_order') as 'desc' | 'asc') || 'desc';
  });

  // Cloud Sync state
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudConnected, setCloudConnected] = useState<boolean>(() => !!getCloudUrl());
  const isRemoteUpdating = useRef(false);
  const hasInitialCloudSynced = useRef(false);

  // Modals state
  const [isOrderModalOpen, setOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SewingOrder | null>(null);
  const [quickDeliverOrder, setQuickDeliverOrder] = useState<SewingOrder | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<SewingOrder | null>(null);
  const [isPresetsOpen, setPresetsOpen] = useState(false);
  const [isExportOpen, setExportOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const receivedCount = useMemo(() => orders.filter(o => o.status !== 'DELIVERED').length, [orders]);
  const deliveredCount = useMemo(() => orders.filter(o => o.status === 'DELIVERED').length, [orders]);
  const inProgressCount = useMemo(() => orders.filter(o => o.status === 'IN_PROGRESS').length, [orders]);
  const pendingCount = useMemo(() => orders.filter(o => o.status === 'PENDING').length, [orders]);

  // Handle month stepper
  const handlePrevMonth = () => {
    setSelectedDate(null);
    setSelectedMonth(prev => shiftMonth(prev, -1));
  };

  const handleNextMonth = () => {
    setSelectedDate(null);
    setSelectedMonth(prev => shiftMonth(prev, 1));
  };

  // Toggle sort order
  const handleToggleSort = () => {
    const next = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(next);
    localStorage.setItem('maytrack_sort_order', next);
  };

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

  // Handle incoming cloud payload
  const applyCloudPayload = useCallback((payload: CloudPayload) => {
    isRemoteUpdating.current = true;
    const incomingOrders = Array.isArray(payload.orders) ? payload.orders : [];
    setOrders(incomingOrders);
    saveOrders(incomingOrders);

    if (payload.presets && Array.isArray(payload.presets) && payload.presets.length > 0) {
      setPresets(payload.presets);
      savePresets(payload.presets);
    }
    if (payload.settings && typeof payload.settings === 'object' && Object.keys(payload.settings).length > 0) {
      setSettings(payload.settings);
      saveSettings(payload.settings);
    }
    setCloudConnected(true);
    setTimeout(() => {
      isRemoteUpdating.current = false;
    }, 400);
  }, []);

  // Background auto-push to cloud when data changes locally
  useEffect(() => {
    if (!hasInitialCloudSynced.current) return; // Không bao giờ đẩy đè dữ liệu cũ lên mây trước khi tải xong đám mây!
    if (isRemoteUpdating.current) return;
    const url = getCloudUrl();
    if (!url) return;

    const timeout = setTimeout(async () => {
      try {
        setIsCloudSyncing(true);
        await pushToCloud(orders, presets, settings, url);
        setCloudConnected(true);
      } catch (err) {
        console.warn('Auto-sync push failed, will retry later');
      } finally {
        setIsCloudSyncing(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [orders, presets, settings]);

  // Cloud initial fetch & SSE real-time listener
  useEffect(() => {
    const url = getCloudUrl();
    if (!url) {
      setCloudConnected(false);
      return;
    }

    setIsCloudSyncing(true);
    fetchFromCloud(url)
      .then(data => {
        if (data) {
          applyCloudPayload(data);
        }
        hasInitialCloudSynced.current = true;
        setCloudConnected(true);
      })
      .catch(() => {
        hasInitialCloudSynced.current = true;
        setCloudConnected(false);
      })
      .finally(() => {
        setIsCloudSyncing(false);
      });

    const unsubscribe = subscribeToCloudUpdates(url, payload => {
      applyCloudPayload(payload);
    });

    const handleSync = () => {
      fetchFromCloud(url).then(data => {
        if (data) applyCloudPayload(data);
      }).catch(() => {});
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleSync();
      }
    };

    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [applyCloudPayload]);

  // Filtered & Sorted orders by real calendar date
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = o.stageName.toLowerCase().includes(q);
        const matchNote = o.note ? o.note.toLowerCase().includes(q) : false;
        if (!matchName && !matchNote) return false;
      }
      if (statusFilter === 'RECEIVED') {
        if (o.status === 'DELIVERED') return false;
      } else if (statusFilter !== 'ALL' && o.status !== statusFilter) {
        return false;
      }
      if (selectedDate) {
        const matchReceive = o.receiveDate === selectedDate;
        const matchDelivery = o.deliveryDate === selectedDate;
        if (!matchReceive && !matchDelivery) return false;
      } else if (selectedMonth !== 'ALL') {
        const inReceive = o.receiveDate.startsWith(selectedMonth);
        const inDelivery = o.deliveryDate ? o.deliveryDate.startsWith(selectedMonth) : false;
        if (!inReceive && !inDelivery) return false;
      }
      return true;
    }).sort((a, b) => {
      const dateA = a.receiveDate || '';
      const dateB = b.receiveDate || '';
      const diff = sortOrder === 'desc' 
        ? dateB.localeCompare(dateA) 
        : dateA.localeCompare(dateB);
      if (diff !== 0) return diff;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [orders, searchQuery, statusFilter, selectedMonth, sortOrder]);

  // Calculations
  const stats = useMemo(() => {
    let totalDeliveredAmount = 0;
    let totalPendingAmount = 0;
    let totalDeliveredQty = 0;
    let totalPendingQty = 0;
    let totalFabricKg = 0;

    const relevantOrders = selectedDate 
      ? orders.filter(o => o.receiveDate === selectedDate || o.deliveryDate === selectedDate)
      : (selectedMonth === 'ALL' 
          ? orders 
          : orders.filter(o => o.receiveDate.startsWith(selectedMonth) || (o.deliveryDate && o.deliveryDate.startsWith(selectedMonth))));

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
  }, [orders, selectedMonth, selectedDate]);

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

  const handleDeleteOrder = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công đoạn may này không?')) {
      const nextOrders = orders.filter(o => o.id !== id);
      setOrders(nextOrders);
      saveOrders(nextOrders);

      // Đẩy xóa ngay lập tức lên đám mây để tất cả thiết bị khác xóa theo tức thì
      const url = getCloudUrl();
      if (url) {
        setIsCloudSyncing(true);
        try {
          await pushToCloud(nextOrders, presets, settings, url);
          setCloudConnected(true);
        } catch (e) {
          console.error('Delete sync failed:', e);
        } finally {
          setIsCloudSyncing(false);
        }
      }
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

  // Orders for Dashboard sorted chronologically
  const activeDashboardOrders = useMemo(() => {
    return orders
      .filter(o => o.status !== 'DELIVERED')
      .sort((a, b) => b.receiveDate.localeCompare(a.receiveDate));
  }, [orders]);

  const recentDeliveredDashboardOrders = useMemo(() => {
    return orders
      .filter(o => o.status === 'DELIVERED')
      .sort((a, b) => {
        const dateA = a.deliveryDate || a.receiveDate;
        const dateB = b.deliveryDate || b.receiveDate;
        return dateB.localeCompare(dateA);
      });
  }, [orders]);

  return (
    // DESKTOP IPHONE SIMULATOR WRAPPER
    <div className="w-full min-h-[100dvh] md:flex md:items-center md:justify-center md:bg-slate-950 md:py-6 md:px-4">
      {/* PHONE SIMULATOR FRAME (iPhone 16 Pro / 15 Pro Max) */}
      <div className="relative w-full h-[100dvh] md:w-[412px] md:h-[880px] md:max-h-[96vh] bg-[#f8fafc] md:rounded-[52px] md:border-[12px] md:border-[#1a1a1a] md:shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col ring-1 ring-white/10">

        {/* Dynamic Island (Desktop Preview Only) */}
        <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-[125px] h-[30px] bg-black rounded-b-[20px] z-[60] pointer-events-none">
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-900 ring-1 ring-slate-800" />
        </div>

        {/* SCROLLABLE MAIN VIEWPORT */}
        <div 
          onTouchStart={handleTouchStart} 
          onTouchEnd={handleTouchEnd} 
          className="w-full flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar px-3.5 pt-2 md:pt-9 pb-24 text-slate-800"
        >
          {/* Main Container */}
          <main className="w-full">
        {/* Clean Header Bar: Month Stepper + All Toggle + Icons */}
        <div className="flex items-center justify-between gap-1.5 mb-2.5">
          {/* Month Stepper Navigator */}
          <div className="flex items-center bg-white/80 border border-slate-200/80 rounded-2xl p-0.5 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 active:scale-95 transition-all"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsMonthPickerOpen(true)}
              className="px-2 py-1 text-xs font-bold text-slate-800 hover:text-indigo-600 flex items-center gap-1 active:scale-95 transition-all"
              title="Bấm để chọn tháng"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{selectedDate ? `Ngày ${formatDateVN(selectedDate)}` : formatMonthLabel(selectedMonth)}</span>
            </button>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 active:scale-95 transition-all"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick "Toàn bộ" Toggle */}
          <button
            onClick={() => setSelectedMonth(selectedMonth === 'ALL' ? getCurrentMonthString() : 'ALL')}
            className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
              selectedMonth === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200/80'
            }`}
          >
            Tất cả
          </button>

          {/* Quick Action Icons: Cloud Sync Indicator + Export & Settings */}
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {/* Cloud Sync Status Indicator */}
            <button
              onClick={() => setSettingsOpen(true)}
              title={
                isCloudSyncing 
                  ? 'Đang đồng bộ đám mây...' 
                  : cloudConnected 
                  ? 'Đang đồng bộ thời gian thực (Bấm để xem)' 
                  : 'Chưa cài đồng bộ đám mây (Bấm để cài)'
              }
              className={`p-2 rounded-xl border shadow-sm active:scale-95 transition-all flex items-center justify-center ${
                cloudConnected
                  ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200'
                  : 'bg-white/80 text-slate-400 border-slate-200/80 hover:text-slate-600'
              }`}
            >
              {isCloudSyncing ? (
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
              ) : cloudConnected ? (
                <CloudLightning className="w-4 h-4 text-emerald-600" />
              ) : (
                <Cloud className="w-4 h-4 text-slate-400" />
              )}
            </button>

            <button
              onClick={() => setExportOpen(true)}
              title="Xuất file / Sao lưu"
              className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 shadow-sm active:scale-95 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              title="Cài đặt"
              className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 shadow-sm active:scale-95 transition-all"
            >
              <Settings className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
        {/* TAB 1: DASHBOARD */}
        {currentTab === 'dashboard' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            
            {/* Stat Cards */}
            <StatCards
              totalDeliveredAmount={stats.totalDeliveredAmount}
              totalPendingAmount={stats.totalPendingAmount}
              totalDeliveredQty={stats.totalDeliveredQty}
              totalPendingQty={stats.totalPendingQty}
              totalFabricKg={stats.totalFabricKg}
            />

            {/* Active / In-progress tasks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Công Đoạn Đã Nhận ({activeDashboardOrders.length})
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setStatusFilter('RECEIVED');
                    setCurrentTab('orders');
                  }}
                  className="text-xs font-semibold text-indigo-600 flex items-center"
                >
                  Xem tất cả <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {activeDashboardOrders.slice(0, 3).map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onQuickDeliver={setQuickDeliverOrder}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteOrder}
                    onShareReceipt={setReceiptOrder}
                  />
                ))}

                {activeDashboardOrders.length === 0 && (
                  <div className="p-5 text-center rounded-2xl ios-glass border border-dashed border-slate-300">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-700">Tất cả hàng đã được bàn giao!</p>
                    <p className="text-[11px] text-slate-400">Không còn công đoạn đã nhận nào chưa giao</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recently Delivered */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Công Đoạn Đã Giao Gần Đây
                  </h3>
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

              <div className="space-y-2.5">
                {recentDeliveredDashboardOrders.slice(0, 3).map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onQuickDeliver={setQuickDeliverOrder}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteOrder}
                    onShareReceipt={setReceiptOrder}
                  />
                ))}

                {recentDeliveredDashboardOrders.length === 0 && (
                  <div className="p-3 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400">Chưa có công đoạn nào đã giao</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SỔ CÔNG ĐOẠN (ORDERS LIST) */}
        {currentTab === 'orders' && (
          <div className="space-y-2.5 animate-in fade-in duration-200">
            
            {/* Search Input & Sort Toggle Row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Tìm công đoạn, ghi chú, mã hàng..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white/80 border border-slate-200/80 text-xs font-medium text-slate-800 shadow-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Sort Order Button */}
              <button
                onClick={handleToggleSort}
                title={sortOrder === 'desc' ? 'Đang xếp: Mới nhất trước (Bấm để đảo)' : 'Đang xếp: Cũ nhất trước (Bấm để đảo)'}
                className="px-2.5 py-2.5 rounded-2xl bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 shadow-sm active:scale-95 transition-all flex items-center gap-1 shrink-0 text-xs font-bold"
              >
                <ArrowDownUp className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[11px]">
                  {sortOrder === 'desc' ? 'Mới nhất' : 'Cũ nhất'}
                </span>
              </button>
            </div>

            {/* 2 Trạng Thái Chính: ĐÃ NHẬN vs ĐÃ GIAO */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 rounded-2xl text-xs font-bold">
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
                  onClick={() => setStatusFilter('RECEIVED')}
                  className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 ${
                    statusFilter === 'RECEIVED' || statusFilter === 'IN_PROGRESS' || statusFilter === 'PENDING'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>1. Đã Nhận</span>
                  <span className="text-[10px] opacity-80 font-mono">({receivedCount})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('DELIVERED')}
                  className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 ${
                    statusFilter === 'DELIVERED'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>2. Đã Giao</span>
                  <span className="text-[10px] opacity-80 font-mono">({deliveredCount})</span>
                </button>
              </div>

              {/* Nếu chọn nhóm [ ĐÃ NHẬN ] -> Hiển thị 2 trường hợp: [ Đang Làm ] và [ Chờ Làm ] */}
              {(statusFilter === 'RECEIVED' || statusFilter === 'IN_PROGRESS' || statusFilter === 'PENDING') && (
                <div className="flex items-center gap-1 px-1.5 py-1 bg-indigo-50/90 rounded-xl border border-indigo-100 text-[11px] font-bold animate-in fade-in duration-200">
                  <span className="text-[10px] text-indigo-900/70 pl-1 uppercase tracking-wide shrink-0">Lọc:</span>
                  <button
                    onClick={() => setStatusFilter('RECEIVED')}
                    className={`px-2 py-0.5 rounded-lg transition-all ${
                      statusFilter === 'RECEIVED'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white/80 text-slate-700 hover:bg-white'
                    }`}
                  >
                    Tất cả ({receivedCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('IN_PROGRESS')}
                    className={`px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 ${
                      statusFilter === 'IN_PROGRESS'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white/80 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Đang làm ({inProgressCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('PENDING')}
                    className={`px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 ${
                      statusFilter === 'PENDING'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white/80 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Chờ làm ({pendingCount})
                  </button>
                </div>
              )}
            </div>

            {/* List of Orders */}
            <div className="space-y-2.5 pt-1">
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
                <div className="py-10 text-center rounded-3xl ios-glass border border-slate-200">
                  <Scissors className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <h4 className="text-xs font-bold text-slate-700">Không có công đoạn nào</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hãy bấm nút (+) để thêm công đoạn may mới
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BÁO CÁO & THỐNG KÊ (REPORTS) */}
        {currentTab === 'reports' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Header Summary */}
            <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase font-extrabold tracking-wider text-indigo-300">
                  Thu nhập tiền công
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {formatMonthLabel(selectedMonth)}
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400">
                {formatVND(stats.totalDeliveredAmount)}
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
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
            <div className="p-3.5 rounded-3xl ios-glass border border-white/70 shadow-ios-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Cơ cấu thu nhập theo công đoạn
              </h3>

              <div className="space-y-2">
                {stageBreakdown.map((item, idx) => {
                  const percent = stats.totalDeliveredAmount > 0 
                    ? Math.round((item.amount / stats.totalDeliveredAmount) * 100) 
                    : 0;

                  return (
                    <div key={item.name} className="p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <strong className="text-slate-800 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          {item.name}
                        </strong>
                        <span className="font-bold font-mono text-indigo-700">
                          {formatVND(item.amount)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                        <span>{formatNumber(item.qty)} cái ({item.count} đơn)</span>
                        <span>{percent}% tổng tiền</span>
                      </div>
                    </div>
                  );
                })}

                {stageBreakdown.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-3">Chưa có dữ liệu thống kê</p>
                )}
              </div>
            </div>

            {/* Export Sheet Action */}
            <button
              onClick={() => setExportOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-sm hover:bg-slate-50 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Tải file Excel / CSV
            </button>
          </div>
        )}

        {/* TAB 4: BẢNG GIÁ CÔNG ĐOẠN (PRESETS) */}
        {currentTab === 'presets' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-3xl ios-glass border border-white/70 shadow-ios-card">
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Bảng Giá Công Đoạn Mẫu
                  </h3>
                  <p className="text-[10px] text-slate-400">Chọn 1 chạm khi nhập đơn mới</p>
                </div>
                <button
                  onClick={() => setPresetsOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                  Thêm mới
                </button>
              </div>

              <div className="space-y-1.5">
                {presets.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100"
                  >
                    <strong className="text-xs font-semibold text-slate-800">{p.name}</strong>
                    <span className="text-xs font-bold font-mono text-purple-700">
                      {formatVND(p.defaultUnitPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setPresetsOpen(true)}
              className="w-full py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 flex items-center justify-center gap-1.5 transition-all"
            >
              Chỉnh sửa danh mục bảng giá
            </button>
          </div>
        )}
      </main>
        </div>

        {/* Floating Bottom Tab Bar */}
        <BottomTabBar
          currentTab={currentTab}
          onChangeTab={setCurrentTab}
          onOpenAddModal={handleOpenAddModal}
        />

      {/* MODALS */}
      <MonthDaysModal
        isOpen={isMonthPickerOpen}
        onClose={() => setIsMonthPickerOpen(false)}
        selectedMonth={selectedMonth}
        selectedDate={selectedDate}
        orders={orders}
        onSelectDate={setSelectedDate}
        onSelectMonth={m => {
          setSelectedMonth(m);
        }}
      />

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
        onSaveSettings={setSettings}
        orders={orders}
        presets={presets}
        onCloudSyncApply={applyCloudPayload}
      />
      </div>
    </div>
  );
}
