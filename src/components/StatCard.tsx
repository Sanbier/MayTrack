import React from 'react';
import { Banknote, PackageCheck, Clock, Scale } from 'lucide-react';
import { formatVND, formatNumber, formatKg } from '../utils/format';

interface StatCardsProps {
  totalDeliveredAmount: number;
  totalPendingAmount: number;
  totalDeliveredQty: number;
  totalPendingQty: number;
  totalFabricKg: number;
}

export const StatCards: React.FC<StatCardsProps> = ({
  totalDeliveredAmount,
  totalPendingAmount,
  totalDeliveredQty,
  totalPendingQty,
  totalFabricKg,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3 mb-5">
      {/* Card 1: Tổng tiền công đã nhận / hoàn thành */}
      <div className="col-span-2 relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 text-white shadow-xl shadow-indigo-600/20 ring-1 ring-white/20">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md">
              <Banknote className="w-5 h-5 text-emerald-300" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-100">
              Tổng tiền công đã giao
            </span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
            Thực nhận
          </span>
        </div>

        <div className="mt-1">
          <div className="text-3xl font-extrabold tracking-tight font-mono text-white">
            {formatVND(totalDeliveredAmount)}
          </div>
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-indigo-200">
            <span>Dự kiến chờ giao:</span>
            <span className="font-semibold text-white font-mono">
              +{formatVND(totalPendingAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Số lượng hoàn thành vs chờ giao */}
      <div className="rounded-2xl p-4 ios-glass border border-white/70 shadow-ios-card">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
            <PackageCheck className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Sản phẩm đã giao
          </span>
        </div>
        <div className="text-2xl font-bold text-slate-800 font-mono">
          {formatNumber(totalDeliveredQty)}
          <span className="text-xs font-medium text-slate-400 ml-1">cái</span>
        </div>
        <div className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Đang may: {formatNumber(totalPendingQty)} cái
        </div>
      </div>

      {/* Card 3: Kí vải (kg) */}
      <div className="rounded-2xl p-4 ios-glass border border-white/70 shadow-ios-card">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
            <Scale className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Tổng kí vải
          </span>
        </div>
        <div className="text-2xl font-bold text-slate-800 font-mono">
          {formatKg(totalFabricKg)}
        </div>
        <div className="text-[11px] text-slate-500 font-medium mt-1">
          Vải nhận gia công
        </div>
      </div>
    </div>
  );
};
