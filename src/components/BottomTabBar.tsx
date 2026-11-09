import React from 'react';
import { TabType } from '../types';
import { LayoutDashboard, Layers, Tag, Plus, BarChart2, ShoppingBag } from 'lucide-react';

interface BottomTabBarProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenAddModal: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentTab,
  onChangeTab,
  onOpenAddModal,
}) => {
  const isSalesTab = currentTab === 'sales';

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 ios-glass-nav pb-[calc(0.5rem+env(safe-area-inset-bottom))] bg-white/85 backdrop-blur-xl border-t border-slate-200/80">
      <div className="w-full max-w-md mx-auto px-2 py-1 flex items-center justify-between relative">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => onChangeTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl transition-all ${
            currentTab === 'dashboard'
              ? 'text-indigo-600 scale-105 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] whitespace-nowrap">Tổng quan</span>
        </button>

        {/* Tab 2: Orders */}
        <button
          onClick={() => onChangeTab('orders')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl transition-all ${
            currentTab === 'orders'
              ? 'text-indigo-600 scale-105 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] whitespace-nowrap">Sổ công đoạn</span>
        </button>

        {/* Floating Quick Action Button (+) in Center (Apple 56px style) */}
        <div className="-mt-7 flex flex-col items-center px-1">
          <button
            onClick={onOpenAddModal}
            aria-label={isSalesTab ? 'Nhập mặt hàng bán mới' : 'Thêm công đoạn mới'}
            className={`w-13 h-13 rounded-full text-white shadow-ios-floating active:scale-90 hover:scale-105 transition-all ring-4 ring-white flex items-center justify-center ${
              isSalesTab
                ? 'bg-gradient-to-tr from-orange-600 via-amber-500 to-rose-500'
                : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500'
            }`}
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
          <span
            className={`text-[9px] font-bold mt-0.5 whitespace-nowrap ${
              isSalesTab ? 'text-orange-600' : 'text-indigo-600'
            }`}
          >
            {isSalesTab ? 'Nhập hàng' : 'Nhập mới'}
          </span>
        </div>

        {/* Tab 3: Reports */}
        <button
          onClick={() => onChangeTab('reports')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl transition-all ${
            currentTab === 'reports'
              ? 'text-indigo-600 scale-105 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <BarChart2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] whitespace-nowrap">Báo cáo</span>
        </button>

        {/* Tab 4: Presets */}
        <button
          onClick={() => onChangeTab('presets')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl transition-all ${
            currentTab === 'presets'
              ? 'text-indigo-600 scale-105 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <Tag className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] whitespace-nowrap">Bảng giá</span>
        </button>

        {/* Tab 5: Bán Hàng (Độc lập theo Trang tính19) */}
        <button
          onClick={() => onChangeTab('sales')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl transition-all ${
            currentTab === 'sales'
              ? 'text-orange-600 scale-105 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] whitespace-nowrap">Bán hàng</span>
        </button>
      </div>
    </div>
  );
};
