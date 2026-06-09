import client from './client';

export interface DashboardActivity {
  id: number;
  label: string;
  text: string;
  percent: number;
  timestamp: string;
}

export interface DashboardChartItem {
  mes: string;
  Solicitudes: number;
  Aprobaciones: number;
}

export interface DashboardHome {
  stats: {
    total: number;
    approved: number;
    rejected: number;
  };
  chartData: DashboardChartItem[];
  activities: DashboardActivity[];
  myRequests: DashboardRequest[];
}

export interface DashboardRequest {
  id: number;
  entity: 'Anticipo' | 'Factura' | 'Viatico' | 'Legalizacion';
  number: string;
  description: string;
  status: string;
  statusLabel: string;
  progress: number;
  createdAt: string;
  detailPath: string;
}

export const getDashboardHome = async (): Promise<DashboardHome> => {
  const response = await client.get<DashboardHome>('/api/v1/dashboard/home');
  return response.data;
};
