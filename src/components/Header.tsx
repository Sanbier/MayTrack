import React from 'react';
import { Scissors, Download, Settings, Sparkles } from 'lucide-react';
import { WorkshopSettings } from '../types';

interface HeaderProps {
  settings: WorkshopSettings;
  onOpenSettings: () => void;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ settings, onOpenSettings, onOpenExport }) => {
  return (
    <header className="sticky top-0 z-30 px-4 pt-2 pb-3 ios-glass border-b border-white/60 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-2 ring-white">
            <Scissors className="w-5 h-5 text-white transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                MayTrack
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
                iOS Pro
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate max-w-[170px]">
              {settings.workshopName || 'Quản lý công đoạn may'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={onOpenExport}
            title="Xuất file Google Sheet / Sao lưu"
            className="p-2 rounded-xl bg-white/70 hover:bg-white text-slate-700 border border-slate-200/80 shadow-sm active:scale-95 transition-all"
          >
            <Download className="w-4 h-4 text-slate-700" />
          </button>
          <button
            onClick={onOpenSettings}
            title="Cài đặt xưởng"
            className="p-2 rounded-xl bg-white/70 hover:bg-white text-slate-700 border border-slate-200/80 shadow-sm active:scale-95 transition-all"
          >
            <Settings className="w-4 h-4 text-slate-700" />
          </button>
        </div>
      </div>
    </header>
  );
};
