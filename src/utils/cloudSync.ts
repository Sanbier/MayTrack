import { SewingOrder, StagePreset, WorkshopSettings, SalesItem } from '../types';

export const DEFAULT_CLOUD_URL = 'https://maytrack-default-rtdb.asia-southeast1.firebasedatabase.app';
const CLOUD_URL_KEY = 'maytrack_cloud_db_url_v1';
const LAST_SYNC_KEY = 'maytrack_last_sync_time_v1';

export interface CloudPayload {
  orders: SewingOrder[];
  presets: StagePreset[];
  settings: WorkshopSettings;
  salesItems?: SalesItem[];
  lastUpdated: number;
  deviceId?: string;
}

export function getDeviceId(): string {
  let id = localStorage.getItem('maytrack_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('maytrack_device_id', id);
  }
  return id;
}

export function getCloudUrl(): string {
  const saved = localStorage.getItem(CLOUD_URL_KEY);
  if (saved !== null && saved !== undefined && saved !== '') {
    return saved.trim();
  }
  // Mặc định kết nối tự động tới database của bạn
  return DEFAULT_CLOUD_URL;
}

export function setCloudUrl(url: string): void {
  let clean = url.trim();
  if (clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  if (clean.endsWith('.json')) {
    clean = clean.slice(0, -5);
  }
  localStorage.setItem(CLOUD_URL_KEY, clean);
}

export function getLastSyncTime(): number {
  return Number(localStorage.getItem(LAST_SYNC_KEY) || '0');
}

export function setLastSyncTime(ts: number): void {
  localStorage.setItem(LAST_SYNC_KEY, String(ts));
}

function getEndpoint(baseUrl: string): string {
  let clean = baseUrl.trim();
  if (clean.endsWith('/')) clean = clean.slice(0, -1);
  if (clean.endsWith('/maytrack_data.json')) return clean;
  if (clean.endsWith('/maytrack_data')) return `${clean}.json`;
  return `${clean}/maytrack_data.json`;
}

function normalizeSalesItems(raw: unknown): SalesItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(Boolean).map((item: SalesItem) => ({
    ...item,
    importQty: Number(item.importQty) || 0,
    importPrice: Number(item.importPrice) || 0,
    sellPrice: Number(item.sellPrice) || 0,
    soldQty: Number(item.soldQty) || 0,
    bills: Array.isArray(item.bills) ? item.bills : [],
  }));
}

/**
 * Tải dữ liệu mới nhất từ đám mây
 */
export async function fetchFromCloud(baseUrl?: string): Promise<CloudPayload | null> {
  const url = baseUrl || getCloudUrl();
  if (!url) return null;

  const endpoint = getEndpoint(url);
  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('PERMISSION_DENIED');
      }
      throw new Error(`HTTP Error: ${res.status}`);
    }

    const data = await res.json();
    if (data && typeof data === 'object') {
      return {
        ...data,
        orders: Array.isArray(data.orders) ? data.orders : [],
        presets: Array.isArray(data.presets) ? data.presets : [],
        settings: data.settings || {},
        salesItems: normalizeSalesItems(data.salesItems),
        lastUpdated: data.lastUpdated || Date.now(),
      } as CloudPayload;
    }
    return null;
  } catch (err) {
    console.error('Lỗi tải từ đám mây:', err);
    throw err;
  }
}

/**
 * Đẩy dữ liệu lên đám mây
 */
export async function pushToCloud(
  orders: SewingOrder[],
  presets: StagePreset[],
  settings: WorkshopSettings,
  baseUrl?: string,
  salesItems?: SalesItem[]
): Promise<number> {
  const url = baseUrl || getCloudUrl();
  if (!url) return 0;

  const endpoint = getEndpoint(url);
  const now = Date.now();
  const payload: CloudPayload = {
    orders,
    presets,
    settings,
    salesItems,
    lastUpdated: now,
    deviceId: getDeviceId(),
  };

  try {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('PERMISSION_DENIED');
      }
      throw new Error(`Lỗi cập nhật đám mây: ${res.status}`);
    }

    setLastSyncTime(now);
    return now;
  } catch (err) {
    console.error('Lỗi đẩy lên đám mây:', err);
    throw err;
  }
}

/**
 * Lắng nghe thay đổi thời gian thực (Server-Sent Events)
 */
export function subscribeToCloudUpdates(
  baseUrl: string,
  onRemoteChange: (payload: CloudPayload) => void
): () => void {
  const url = baseUrl || getCloudUrl();
  if (!url) return () => {};

  const endpoint = getEndpoint(url);
  let eventSource: EventSource | null = null;

  try {
    eventSource = new EventSource(endpoint);

    eventSource.addEventListener('put', async (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data);
        if (!parsed) return;
        if (parsed.path === '/' && parsed.data && typeof parsed.data === 'object') {
          const payload = parsed.data as CloudPayload;
          if (payload.deviceId && payload.deviceId === getDeviceId()) {
            return;
          }
          const incomingOrders = Array.isArray(payload.orders) ? payload.orders : [];
          onRemoteChange({
            ...payload,
            orders: incomingOrders,
            salesItems: normalizeSalesItems(payload.salesItems),
          });
        } else if (parsed.path !== '/') {
          const fresh = await fetchFromCloud(baseUrl);
          if (fresh && fresh.deviceId !== getDeviceId()) {
            onRemoteChange(fresh);
          }
        }
      } catch (e) {
        console.error('Lỗi phân tích SSE:', e);
      }
    });

    eventSource.addEventListener('patch', async () => {
      try {
        const fresh = await fetchFromCloud(baseUrl);
        if (fresh && fresh.deviceId !== getDeviceId()) {
          onRemoteChange(fresh);
        }
      } catch (e) {
        console.error('Lỗi phân tích SSE patch:', e);
      }
    });

    eventSource.onerror = (err) => {
      console.warn('Mất kết nối SSE đám mây, trình duyệt sẽ tự động kết nối lại...', err);
    };
  } catch (e) {
    console.error('Không thể khởi tạo EventSource:', e);
  }

  return () => {
    if (eventSource) {
      eventSource.close();
    }
  };
}

/**
 * Gộp thông minh dữ liệu trên máy (Local) và dữ liệu Đám mây (Cloud)
 * Đảm bảo khi kết nối lại đám mây sau thời gian mất mạng / hết hạn quyền,
 * toàn bộ đơn hàng và mặt hàng bán mới nhập trên máy chính KHÔNG BAO GIỜ bị mất!
 */
export function mergeCloudAndLocal(
  localOrders: SewingOrder[],
  localSales: SalesItem[],
  cloud: CloudPayload
): {
  mergedOrders: SewingOrder[];
  mergedSales: SalesItem[];
  hasLocalUnsyncedChanges: boolean;
} {
  const cloudOrders = Array.isArray(cloud.orders) ? cloud.orders : [];
  const cloudSales = Array.isArray(cloud.salesItems) ? cloud.salesItems : [];
  const cloudLastUpdated = cloud.lastUpdated || 0;

  let hasLocalUnsyncedChanges = false;

  const orderMap = new Map<string, SewingOrder>();
  cloudOrders.forEach(o => {
    if (o && o.id) orderMap.set(o.id, o);
  });

  const cloudHasRealOrders = cloudOrders.some(o => o && o.id && !o.id.startsWith('sample_'));

  localOrders.forEach(localOrd => {
    if (!localOrd || !localOrd.id) return;
    if (localOrd.id.startsWith('sample_') && cloudHasRealOrders) return;

    const existingCloud = orderMap.get(localOrd.id);
    const localTime = localOrd.updatedAt || localOrd.createdAt || 0;

    if (!existingCloud) {
      if (cloudOrders.length === 0 || localTime > cloudLastUpdated) {
        orderMap.set(localOrd.id, localOrd);
        hasLocalUnsyncedChanges = true;
      }
    } else {
      const cloudTime = existingCloud.updatedAt || existingCloud.createdAt || 0;
      if (localTime > cloudTime) {
        orderMap.set(localOrd.id, localOrd);
        hasLocalUnsyncedChanges = true;
      }
    }
  });

  const mergedOrders = Array.from(orderMap.values()).sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  );

  const salesMap = new Map<string, SalesItem>();
  cloudSales.forEach(s => {
    if (s && s.id) salesMap.set(s.id, s);
  });

  localSales.forEach(localItem => {
    if (!localItem || !localItem.id) return;
    const existingCloud = salesMap.get(localItem.id);
    const localTime = localItem.updatedAt || localItem.createdAt || 0;

    if (!existingCloud) {
      if (cloudSales.length === 0 || localTime > cloudLastUpdated) {
        salesMap.set(localItem.id, localItem);
        hasLocalUnsyncedChanges = true;
      }
    } else {
      const cloudTime = existingCloud.updatedAt || existingCloud.createdAt || 0;
      if (localTime > cloudTime) {
        salesMap.set(localItem.id, localItem);
        hasLocalUnsyncedChanges = true;
      }
    }
  });

  const mergedSales = Array.from(salesMap.values()).sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  );

  return {
    mergedOrders,
    mergedSales,
    hasLocalUnsyncedChanges,
  };
}
