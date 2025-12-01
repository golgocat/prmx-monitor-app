export interface MonitorLog {
  date: string;
  amount: number;
  cumulative: number;
  _id?: string;
}

export enum MonitorStatus {
  Instantiated = 'instantiated',
  Monitoring = 'monitoring',
  Triggered = 'triggered',
  Completed = 'completed'
}

export interface Monitor {
  id: string;
  regionName: string;
  lat: number;
  lon: number;
  radiusKm: number;
  locationKey?: string;
  startDate: string;
  endDate: string;
  cumulativeRainfall: number;
  triggerRainfall: number;
  status: MonitorStatus;
  logs: MonitorLog[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMonitorDTO {
  regionName: string;
  lat: number;
  lon: number;
  radiusKm: number;
  startDate: string;
  endDate: string;
  triggerRainfall: number;
}