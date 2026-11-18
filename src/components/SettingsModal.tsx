import React, { useState, useEffect } from 'react';
import { WorkshopSettings, SewingOrder, StagePreset, SalesItem } from '../types';
import {
  getCloudUrl,
  setCloudUrl,
  fetchFromCloud,
  pushToCloud,
  mergeCloudAndLocal,
  getLastSyncTime,
  CloudPayload,
} from '../utils/cloudSync';
import { useVisualViewport } from '../utils/useVisualViewport';
import {
  X,
  Save,
  Home,
  User,
  Phone,
  Check,
  CloudLightning,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Copy,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WorkshopSettings;
  onSaveSettings: (settings: WorkshopSettings) => void;
  orders: SewingOrder[];
  presets: StagePreset[];
  salesItems: SalesItem[];
  onCloudSyncApply: (payload: CloudPayload) => void;
}

const FIREBASE_PERMANENT_RULES = `{
  "rules": {
    ".read": true,
    ".write": true
  }
}`;

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  orders,
  presets,
  salesItems,
  onCloudSyncApply,
}) => {
  const viewportHeight = useVisualViewport();
  const [form, setForm] = useState<WorkshopSettings>(settings);
  const [cloudUrlInput, setCloudUrlInput] = useState(getCloudUrl);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [lastSync, setLastSync] = useState<number>(getLastSyncTime);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(settings);
    setCloudUrlInput(getCloudUrl());
    setLastSync(getLastSyncTime());
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(FIREBASE_PERMANENT_RULES);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  // Test and connect cloud database (Smart Merge: không bao giờ làm mất dữ liệu máy hiện tại)
  const handleConnectCloud = async () => {
    const url = cloudUrlInput.trim();
    if (!url) {
      setCloudUrl('');
      setSyncStatus('idle');
      setIsPermissionDenied(false);
      setStatusMessage('Đã tắt đồng bộ đám mây (chỉ lưu trên máy).');
      return;
    }

    setSyncStatus('testing');
    setIsPermissionDenied(false);
    setStatusMessage('Đang kết nối và gộp dữ liệu an toàn...');

    try {
      const remoteData = await fetchFromCloud(url);
      setCloudUrl(url);

      if (remoteData) {
        const { mergedOrders, mergedSales } = mergeCloudAndLocal(orders, salesItems, remoteData);
        const nextPresets =
          remoteData.presets && remoteData.presets.length > 0 ? remoteData.presets : presets;
        const nextSettings =
          remoteData.settings && Object.keys(remoteData.settings).length > 0
            ? remoteData.settings
            : form;

        onCloudSyncApply({
          ...remoteData,
          orders: mergedOrders,
          presets: nextPresets,
          settings: nextSettings,
          salesItems: mergedSales,
        });

        await pushToCloud(mergedOrders, nextPresets, nextSettings, url, mergedSales);
        setSyncStatus('success');
        setStatusMessage(
          `Đồng bộ thành công! Đã gộp an toàn ${mergedOrders.length} công đoạn may và ${mergedSales.length} mặt hàng bán.`
        );
      } else {
        await pushToCloud(orders, presets, form, url, salesItems);
        setSyncStatus('success');
        setStatusMessage('Kết nối thành công! Đã đẩy toàn bộ dữ liệu máy này lên đám mây.');
      }
      setLastSync(Date.now());
    } catch (err: any) {
      setSyncStatus('error');
      if (err?.message === 'PERMISSION_DENIED') {
        setIsPermissionDenied(true);
        setStatusMessage(
          'Firebase đang khóa quyền đọc/ghi (Hết hạn 30 ngày Test Mode). Dữ liệu trên máy của bạn vẫn an toàn 100%! Hãy mở lại quyền Rules bên dưới.'
        );
      } else {
        setStatusMessage('Không thể kết nối! Vui lòng kiểm tra lại đường link và quyền Rules.');
      }
    }
  };

  const handleManualPush = async () => {
    setSyncStatus('testing');
    setIsPermissionDenied(false);
    try {
      const ts = await pushToCloud(orders, presets, form, cloudUrlInput, salesItems);
      setLastSync(ts);
      setSyncStatus('success');
      setStatusMessage(
        `Đã đẩy toàn bộ dữ liệu máy này (${orders.length} công đoạn, ${salesItems.length} mặt hàng bán) lên đám mây thành công!`
      );
    } catch (err: any) {
      setSyncStatus('error');
      if (err?.message === 'PERMISSION_DENIED') {
        setIsPermissionDenied(true);
        setStatusMessage(
          'Firebase đang từ chối quyền ghi (Permission denied) do hết 30 ngày Test Mode. Xem hướng dẫn mở khóa bên dưới.'
        );
      } else {
        setStatusMessage('Lỗi khi đẩy dữ liệu lên đám mây.');
      }
    }
  };

  const handleManualPull = async () => {
    setSyncStatus('testing');
    setIsPermissionDenied(false);
    try {
      const data = await fetchFromCloud(cloudUrlInput);
      if (data) {
        const { mergedOrders, mergedSales } = mergeCloudAndLocal(orders, salesItems, data);
        onCloudSyncApply({
          ...data,
          orders: mergedOrders,
          salesItems: mergedSales,
        });
        setLastSync(Date.now());
        setSyncStatus('success');
        setStatusMessage(
          `Đã tải & gộp an toàn ${mergedOrders.length} công đoạn và ${mergedSales.length} mặt hàng bán!`
        );
      } else {
        setStatusMessage('Đám mây hiện chưa có dữ liệu.');
      }
    } catch (err: any) {
      setSyncStatus('error');
      if (err?.message === 'PERMISSION_DENIED') {
        setIsPermissionDenied(true);
        setStatusMessage(
          'Firebase đang từ chối quyền đọc (Permission denied) do hết 30 ngày Test Mode. Xem hướng dẫn mở khóa bên dưới.'
        );
      } else {
        setStatusMessage('Lỗi khi tải dữ liệu từ đám mây.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setCloudUrl(cloudUrlInput);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  const maxModalHeight = Math.min(Math.max(viewportHeight - 20, 360), 840);

  return (
    <div className="fixed md:absolute inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        style={{
          maxHeight: `${maxModalHeight}px`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Handle */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Cài Đặt & Đồng Bộ Đám Mây
            </h3>
            <p className="text-[10px] text-slate-500">
              Tự động gộp & bảo vệ dữ liệu trên mọi thiết bị
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body (Scrollable with min-h-0 and overscroll-contain) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-4">
          {/* Section 1: Cloud Sync Multi-Device */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-blue-50/70 to-slate-50 border border-indigo-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                  <CloudLightning className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                    Đồng bộ thời gian thực đa thiết bị
                  </h4>
                  <p className="text-[10px] text-indigo-700/80">
                    Tự động gộp dữ liệu — Không bao giờ làm mất đơn trên máy chính
                  </p>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                  cloudUrlInput.trim()
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    cloudUrlInput.trim() ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                {cloudUrlInput.trim() ? 'Đang bật' : 'Chưa bật'}
              </span>
            </div>

            <div className="space-y-2 mt-2">
              <label className="text-[11px] font-bold text-slate-700 block">
                Link Firebase Realtime Database
              </label>

              <div className="flex gap-1.5">
                <input
                  type="url"
                  placeholder="https://xxx-default-rtdb.asia-southeast1.firebasedatabase.app"
                  value={cloudUrlInput}
                  onChange={e => setCloudUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleConnectCloud}
                  disabled={syncStatus === 'testing'}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold whitespace-nowrap active:scale-95 transition-all shadow-sm flex items-center gap-1"
                >
                  {syncStatus === 'testing' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Lưu & Kết nối
                </button>
              </div>

              {statusMessage && (
                <div
                  className={`p-2.5 rounded-xl text-[11px] font-medium flex items-start gap-1.5 ${
                    syncStatus === 'success'
                      ? 'bg-emerald-100 text-emerald-800'
                      : syncStatus === 'error'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {syncStatus === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{statusMessage}</span>
                </div>
              )}

              {cloudUrlInput.trim() && (
                <div className="pt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Đồng bộ lần cuối:{' '}
                    {lastSync ? new Date(lastSync).toLocaleTimeString('vi-VN') : 'Vừa xong'}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleManualPull}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 active:scale-95"
                    >
                      Tải & Gộp về
                    </button>
                    <button
                      type="button"
                      onClick={handleManualPush}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 active:scale-95 shadow-2xs"
                    >
                      Đẩy máy này lên mây
                    </button>
                  </div>
                </div>
              )}

              {/* Hướng dẫn mở khóa quyền Rules vĩnh viễn trên Firebase */}
              <div
                className={`mt-2 p-3 rounded-xl border text-[11px] space-y-2 ${
                  isPermissionDenied
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-white/80 border-slate-200/70 text-slate-600'
                }`}
              >
                <span className="font-extrabold text-slate-900 block">
                  🔓 Cách mở khóa đồng bộ vĩnh viễn (Khi Firebase hết hạn 30 ngày Test Mode):
                </span>
                <ol className="list-decimal pl-4 space-y-1 text-[10px]">
                  <li>
                    Vào{' '}
                    <a
                      href="https://console.firebase.google.com/project/maytrack/database/maytrack-default-rtdb/rules"
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 font-bold underline inline-flex items-center gap-0.5"
                    >
                      Firebase Realtime Database ➔ Rules (Quy tắc){' '}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </li>
                  <li>
                    Thay nội dung trong ô Rules bằng đoạn dưới đây rồi bấm{' '}
                    <strong>Publish (Xuất bản)</strong>:
                  </li>
                </ol>

                <div className="relative">
                  <pre className="p-2.5 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[10px] overflow-x-auto">
                    {FIREBASE_PERMANENT_RULES}
                  </pre>
                  <button
                    type="button"
                    onClick={handleCopyRules}
                    className="absolute right-2 top-2 px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold flex items-center gap-1"
                  >
                    {copiedRules ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRules ? 'Đã copy' : 'Copy Rules'}</span>
                  </button>
                </div>

                <p className="text-[10px] text-emerald-800 font-bold">
                  ✅ Sau khi bấm Publish trên Firebase, quay lại máy đang có dữ liệu bấm nút{' '}
                  <strong>"Đẩy máy này lên mây"</strong> — toàn bộ dữ liệu của bạn sẽ sang máy kia
                  ngay lập tức mà không mất bất kỳ thông tin nào!
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin xưởng */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Thông tin hiển thị phiếu
            </h4>

            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-indigo-500" />
                Tên xưởng may / Tổ may
              </label>
              <input
                type="text"
                required
                value={form.workshopName}
                onChange={e => setForm({ ...form, workshopName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-500" />
                Người phụ trách / Thợ may
              </label>
              <input
                type="text"
                required
                value={form.ownerName}
                onChange={e => setForm({ ...form, ownerName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-teal-500" />
                Số điện thoại (tùy chọn)
              </label>
              <input
                type="tel"
                placeholder="VD: 0912 345 678"
                value={form.phone || ''}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  Ngày chốt công lãnh tiền hàng tháng
                </span>
                <span className="text-[10px] text-indigo-600 font-bold">Mặc định: Mùng 3</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="28"
                  required
                  value={form.payCycleClosingDay ?? 3}
                  onChange={e =>
                    setForm({
                      ...form,
                      payCycleClosingDay: Math.max(
                        1,
                        Math.min(28, parseInt(e.target.value, 10) || 3)
                      ),
                    })
                  }
                  className="w-24 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-center font-mono"
                />
                <span className="text-xs text-slate-700 font-semibold">
                  Hàng tháng (chốt ngày {form.payCycleClosingDay ?? 3})
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Chu kỳ công sẽ tính từ ngày {(form.payCycleClosingDay ?? 3) + 1} tháng này đến ngày{' '}
                {form.payCycleClosingDay ?? 3} tháng sau để chốt lương lãnh tiền.
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-24 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Đóng
              </button>
              <button
                type="submit"
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-1.5 ${
                  saved ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                }`}
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Đã lưu!' : 'Lưu Cài Đặt'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
