import { SewingOrder, StagePreset, WorkshopSettings } from '../types';

const CLOUD_URL_KEY = 'maytrack_cloud_db_url_v1';
const LAST_SYNC_KEY = 'maytrack_last_sync_time_v1';

export interface CloudPayload {
  orders: SewingOrder[];
  presets: StagePreset[];
  settings: WorkshopSettings;
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
  return (localStorage.getItem(CLOUD_URL_KEY) || '').trim();
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
      throw new Error(`HTTP Error: ${res.status}`);
    }

    const data = await res.json();
    if (data && typeof data === 'object') {
      return data as CloudPayload;
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
  baseUrl?: string
): Promise<number> {
  const url = baseUrl || getCloudUrl();
  if (!url) return 0;

  const endpoint = getEndpoint(url);
  const now = Date.now();
  const payload: CloudPayload = {
    orders,
    presets,
    settings,
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
  if (!baseUrl) return () => {};

  const endpoint = getEndpoint(baseUrl);
  let eventSource: EventSource | null = null;

  try {
    eventSource = new EventSource(endpoint);

    eventSource.addEventListener('put', (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed && parsed.data && typeof parsed.data === 'object') {
          const payload = parsed.data as CloudPayload;
          // Bỏ qua nếu sự kiện do chính thiết bị này vừa gửi lên
          if (payload.deviceId && payload.deviceId === getDeviceId()) {
            return;
          }
          if (payload.orders && Array.isArray(payload.orders)) {
            onRemoteChange(payload);
          }
        }
      } catch (e) {
        console.error('Lỗi phân tích SSE:', e);
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
