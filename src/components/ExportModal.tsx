import React, { useRef } from 'react';
import { SewingOrder, StagePreset, WorkshopSettings } from '../types';
import { exportToCSV, exportJSONBackup } from '../utils/storage';
import { X, FileSpreadsheet, Download, Upload, RefreshCw, AlertTriangle, Check } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: SewingOrder[];
  presets: StagePreset[];
  settings: WorkshopSettings;
  onRestore: (orders: SewingOrder[], presets: StagePreset[], settings: WorkshopSettings) => void;
  onResetSample: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  orders,
  presets,
  settings,
  onRestore,
  onResetSample,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.orders && Array.isArray(parsed.orders)) {
          onRestore(parsed.orders, parsed.presets || presets, parsed.settings || settings);
          alert('Khôi phục dữ liệu thành công!');
          onClose();
        } else {
          alert('Tệp sao lưu không đúng định dạng!');
        }
      } catch (err) {
        alert('Lỗi đọc tệp sao lưu JSON!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed md:absolute inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-slate-100 animate-in slide-in-from-bottom-6 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Xuất & Sao Lưu Dữ Liệu</h3>
              <p className="text-xs text-slate-500">Đồng bộ với Google Sheet & bảo vệ dữ liệu</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 space-y-3">
          {/* Action 1: Export CSV Google Sheet */}
          <button
            onClick={() => {
              exportToCSV(orders);
            }}
            className="w-full p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 text-left flex items-start gap-3 transition-all active:scale-98"
          >
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-emerald-950">
                Xuất file CSV (Chuẩn Google Sheet)
              </h4>
              <p className="text-xs text-emerald-700/80 mt-0.5">
                Đúng định dạng 2 cột: CÔNG ĐOẠN NHẬN & CÔNG ĐOẠN GIAO như mẫu bảng tính.
              </p>
            </div>
          </button>

          {/* Action 2: Export JSON Backup */}
          <button
            onClick={() => {
              exportJSONBackup(orders, presets, settings);
            }}
            className="w-full p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200 text-left flex items-start gap-3 transition-all active:scale-98"
          >
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Download className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-indigo-950">
                Sao lưu tệp dự phòng (JSON)
              </h4>
              <p className="text-xs text-indigo-700/80 mt-0.5">
                Lưu trữ toàn bộ đơn hàng, bảng giá và cài đặt để chuyển sang máy khác.
              </p>
            </div>
          </button>

          {/* Action 3: Restore Backup */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-start gap-3 transition-all active:scale-98"
            >
              <div className="p-2.5 rounded-xl bg-slate-700 text-white">
                <Upload className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800">
                  Khôi phục dữ liệu từ tệp sao lưu
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tải tệp .json đã lưu trước đó để đồng bộ lại dữ liệu vào máy.
                </p>
              </div>
            </button>
          </div>

          {/* Action 4: Reset sample data */}
          <button
            onClick={() => {
              if (window.confirm('Khôi phục lại dữ liệu đơn hàng mẫu ban đầu?')) {
                onResetSample();
                onClose();
              }
            }}
            className="w-full p-3 rounded-2xl bg-amber-50/60 hover:bg-amber-100/60 border border-amber-200/60 text-left flex items-center gap-2.5 transition-all text-xs font-semibold text-amber-800"
          >
            <RefreshCw className="w-4 h-4 text-amber-600" />
            <span>Khôi phục dữ liệu mẫu bảng tính gốc (03/07/2026 - TIM TIA)</span>
          </button>
        </div>

        <div className="pt-2 pb-[env(safe-area-inset-bottom)]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
