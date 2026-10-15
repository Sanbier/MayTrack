import React, { useState, useEffect } from 'react';
import { WorkshopSettings, SewingOrder, StagePreset } from '../types';
import { 
  getCloudUrl, setCloudUrl, 
  fetchFromCloud, pushToCloud, 
  getLastSyncTime, CloudPayload 
} from '../utils/cloudSync';
import { 
  X, Save, Home, User, Phone, Check, Cloud, 
  CloudLightning, RefreshCw, AlertCircle, ExternalLink, ShieldCheck 
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WorkshopSettings;
  onSaveSettings: (settings: WorkshopSettings) => void;
  orders: SewingOrder[];
  presets: StagePreset[];
  onCloudSyncApply: (payload: CloudPayload) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  orders,
  presets,
  onCloudSyncApply,
}) => {
  const [form, setForm] = useState<WorkshopSettings>(settings);
  const [cloudUrlInput, setCloudUrlInput] = useState(getCloudUrl);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [lastSync, setLastSync] = useState<number>(getLastSyncTime);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(settings);
    setCloudUrlInput(getCloudUrl());
    setLastSync(getLastSyncTime());
  }, [settings, isOpen]);

  if (!isOpen) return null;

  // Test and connect cloud database
  const handleConnectCloud = async () => {
    const url = cloudUrlInput.trim();
    if (!url) {
      setCloudUrl('');
      setSyncStatus('idle');
      setStatusMessage('Đã tắt đồng bộ đám mây (chỉ lưu trên máy).');
      return;
    }

    setSyncStatus('testing');
    setStatusMessage('Đang kết nối thử nghiệm...');

    try {
      // 1. Thử đọc dữ liệu
      const remoteData = await fetchFromCloud(url);
      setCloudUrl(url);

      if (remoteData && remoteData.orders && Array.isArray(remoteData.orders) && remoteData.orders.length > 0) {
        // Có dữ liệu trên mây sẵn -> áp dụng về máy
        onCloudSyncApply(remoteData);
        setSyncStatus('success');
        setStatusMessage(`Kết nối thành công! Đã đồng bộ ${remoteData.orders.length} công đoạn từ đám mây.`);
      } else {
        // Chưa có dữ liệu trên mây -> đẩy dữ liệu hiện tại lên
        await pushToCloud(orders, presets, form, url);
        setSyncStatus('success');
        setStatusMessage('Kết nối thành công! Đã khởi tạo và tải dữ liệu lên đám mây.');
      }
      setLastSync(Date.now());
    } catch (err: any) {
      setSyncStatus('error');
      setStatusMessage('Không thể kết nối! Vui lòng kiểm tra lại đường link và quyền Test Mode.');
    }
  };

  const handleManualPush = async () => {
    setSyncStatus('testing');
    try {
      const ts = await pushToCloud(orders, presets, form, cloudUrlInput);
      setLastSync(ts);
      setSyncStatus('success');
      setStatusMessage('Đã đồng bộ toàn bộ dữ liệu máy này lên đám mây thành công!');
    } catch (e) {
      setSyncStatus('error');
      setStatusMessage('Lỗi khi đẩy dữ liệu lên đám mây.');
    }
  };

  const handleManualPull = async () => {
    setSyncStatus('testing');
    try {
      const data = await fetchFromCloud(cloudUrlInput);
      if (data && data.orders) {
        onCloudSyncApply(data);
        setLastSync(Date.now());
        setSyncStatus('success');
        setStatusMessage(`Đã tải về thành công ${data.orders.length} công đoạn mới nhất!`);
      } else {
        setStatusMessage('Đám mây hiện chưa có dữ liệu.');
      }
    } catch (e) {
      setSyncStatus('error');
      setStatusMessage('Lỗi khi tải dữ liệu từ đám mây.');
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Handle */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Cài Đặt & Đồng Bộ Đám Mây</h3>
            <p className="text-xs text-slate-500">Tự động đồng bộ thời gian thực trên mọi thiết bị</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Section 1: Cloud Sync Multi-Device */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-blue-50/70 to-slate-50 border border-indigo-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                  <CloudLightning className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                    Đồng bộ thời gian thực đa thiết bị
                  </h4>
                  <p className="text-[11px] text-indigo-700/80">
                    Bấm trên iPhone ➔ Máy tính tự nhảy số ngay tức thì
                  </p>
                </div>
              </div>

              {cloudUrlInput ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Đang bật
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-600">
                  Chỉ lưu trên máy
                </span>
              )}
            </div>

            <div className="mt-3 space-y-2">
              <label className="text-[11px] font-bold text-slate-700 block">
                Đường link Cơ sở dữ liệu đám mây (Firebase Realtime URL):
              </label>
              <div className="flex gap-1.5">
                <input
                  type="url"
                  placeholder="https://tên-du-an.firebaseio.com"
                  value={cloudUrlInput}
                  onChange={e => {
                    setCloudUrlInput(e.target.value);
                    setSyncStatus('idle');
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-indigo-200 text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleConnectCloud}
                  disabled={syncStatus === 'testing'}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-1 shrink-0"
                >
                  {syncStatus === 'testing' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {syncStatus === 'testing' ? 'Kết nối...' : 'Kết nối'}
                </button>
              </div>

              {/* Status feedback message */}
              {statusMessage && (
                <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  syncStatus === 'success'
                    ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-200'
                    : syncStatus === 'error'
                    ? 'bg-rose-100/80 text-rose-900 border border-rose-200'
                    : 'bg-indigo-100/80 text-indigo-900'
                }`}>
                  {syncStatus === 'success' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : syncStatus === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                  )}
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Action buttons if connected */}
              {cloudUrlInput && (
                <div className="pt-2 flex items-center justify-between text-[11px] border-t border-indigo-100">
                  <span className="text-slate-500 font-medium">
                    {lastSync > 0 
                      ? `Lần đồng bộ cuối: ${new Date(lastSync).toLocaleTimeString('vi-VN')} ${new Date(lastSync).toLocaleDateString('vi-VN')}`
                      : 'Chưa đồng bộ'}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleManualPull}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 active:scale-95"
                    >
                      Tải về
                    </button>
                    <button
                      type="button"
                      onClick={handleManualPush}
                      className="px-2 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-semibold hover:bg-indigo-200 active:scale-95"
                    >
                      Đẩy lên
                    </button>
                  </div>
                </div>
              )}

              {/* Help box */}
              <div className="mt-2 p-2.5 rounded-xl bg-white/70 border border-slate-200/60 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">💡 Cách tạo Database miễn phí (chỉ mất 1 phút):</span>
                <ol className="list-decimal pl-4 space-y-0.5 text-slate-600 text-[10px]">
                  <li>Vào <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline inline-flex items-center gap-0.5">console.firebase.google.com <ExternalLink className="w-2.5 h-2.5" /></a> bấm <strong>Create a project</strong>.</li>
                  <li>Vào mục <strong>Realtime Database</strong> ➔ Bấm <strong>Create Database</strong> ➔ Chọn chế độ <strong>Start in test mode</strong>.</li>
                  <li>Copy đường link hiển thị trên đầu (dạng <code>https://...firebaseio.com</code>) dán vào ô trên là xong!</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin xưởng */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Thông tin hiển thị phiếu
            </h4>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-indigo-500" />
                Tên xưởng may / Tổ may
              </label>
              <input
                type="text"
                required
                value={form.workshopName}
                onChange={e => setForm({ ...form, workshopName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-500" />
                Người phụ trách / Thợ may
              </label>
              <input
                type="text"
                required
                value={form.ownerName}
                onChange={e => setForm({ ...form, ownerName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-teal-500" />
                Số điện thoại (tùy chọn)
              </label>
              <input
                type="tel"
                placeholder="VD: 0912 345 678"
                value={form.phone || ''}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="pt-2 flex gap-2 pb-[env(safe-area-inset-bottom)]">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Đóng
              </button>
              <button
                type="submit"
                className={`flex-1 py-3 rounded-2xl text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-1.5 ${
                  saved ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                }`}
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Đã lưu!' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
