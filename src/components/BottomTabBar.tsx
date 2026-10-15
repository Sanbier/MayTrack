import React from 'react';
import { TabType } from '../types';
import { LayoutDashboard, Layers, Tag, Plus, BarChart2 } from 'lucide-react';

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
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 ios-glass-nav pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto px-4 py-1.5 flex items-center justify-around relative">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => onChangeTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
            currentTab === 'dashboard'
              ? 'text-indigo-600 scale-105 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Tổng quan</span>
        </button>

        {/* Tab 2: Orders */}
        <button
          onClick={() => onChangeTab('orders')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
            currentTab === 'orders'
              ? 'text-indigo-600 scale-105 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Sổ công đoạn</span>
        </button>

        {/* Floating Quick Action Button (+) in Center */}
        <div className="-mt-7 flex flex-col items-center">
          <button
            onClick={onOpenAddModal}
            aria-label="Thêm công đoạn mới"
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 text-white shadow-ios-floating active:scale-90 hover:scale-105 transition-all ring-4 ring-white flex items-center justify-center"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
          <span className="text-[9px] font-bold text-indigo-600 mt-0.5">Nhập mới</span>
        </div>

        {/* Tab 3: Reports */}
        <button
          onClick={() => onChangeTab('reports')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
            currentTab === 'reports'
              ? 'text-indigo-600 scale-105 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <BarChart2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Báo cáo</span>
        </button>

        {/* Tab 4: Presets */}
        <button
          onClick={() => onChangeTab('presets')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
            currentTab === 'presets'
              ? 'text-indigo-600 scale-105 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <Tag className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Bảng giá</span>
        </button>
      </div>
    </div>
  );
};
