export type OverviewResponse = {
  storage_mode: string;
  totals: {
    devices: number;
    active_devices: number;
    open_alerts: number;
    avg_temp_c: number;
    estimated_kw: number;
  };
  rooms: Array<{
    id: string;
    name: string;
    building: string;
    occupancy: number;
    temp_c: number;
  }>;
  recent_alerts: Array<{
    id: string;
    severity: string;
    message: string;
    created_at: string;
  }>;
  cctv: { total: number; online: number; last_motion_at: string | null };
};

export type AttendanceLog = {
  id: string;
  student_id: string;
  name: string;
  gate: string;
  scanned_at: string;
};

export type EnergyPoint = {
  ts: string;
  building: string;
  kw: number;
};

export type CctvEvent = {
  id: string;
  camera_id: string;
  label: string;
  created_at: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  channel: string;
  read: boolean;
  created_at: string;
};
