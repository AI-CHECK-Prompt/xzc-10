import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export interface Ship {
  id: string;
  shipCode: string;
  name: string;
  imoNumber?: string;
  mmsi?: string;
  callSign?: string;
  flag?: string;
  type?: string;
  length?: number;
  width?: number;
  draft?: number;
  tonnage?: number;
  status?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Waypoint {
  latitude: number;
  longitude: number;
  name?: string;
  order: number;
}

export interface Route {
  id: string;
  routeCode: string;
  name: string;
  shipId: string;
  ship?: Ship;
  waypoints: Waypoint[];
  startPort?: string;
  endPort?: string;
  totalDistance?: number;
  estimatedTime?: string;
  status?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShipPosition {
  shipId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  course?: number;
  status?: string;
  heading?: number;
  timestamp?: string;
  shipName?: string;
  shipCode?: string;
}

export const shipApi = {
  getAll: () => api.get<Ship[]>('/ships'),
  getById: (id: string) => api.get<Ship>(`/ships/${id}`),
  getByCode: (code: string) => api.get<Ship>(`/ships/code/${code}`),
  create: (data: Omit<Ship, 'id' | 'createdAt' | 'updatedAt'>) => api.post<Ship>('/ships', data),
  update: (id: string, data: Partial<Ship>) => api.put<Ship>(`/ships/${id}`, data),
  delete: (id: string) => api.delete(`/ships/${id}`),
};

export const routeApi = {
  getAll: () => api.get<Route[]>('/routes'),
  getById: (id: string) => api.get<Route>(`/routes/${id}`),
  getByCode: (code: string) => api.get<Route>(`/routes/code/${code}`),
  getByShipId: (shipId: string) => api.get<Route[]>(`/routes/ship/${shipId}`),
  create: (data: Omit<Route, 'id' | 'createdAt' | 'updatedAt' | 'ship'>) => api.post<Route>('/routes', data),
  update: (id: string, data: Partial<Route>) => api.put<Route>(`/routes/${id}`, data),
  delete: (id: string) => api.delete(`/routes/${id}`),
};

export const positionApi = {
  update: (data: Omit<ShipPosition, 'shipName' | 'shipCode'>) => api.post('/positions', data),
  getById: (shipId: string) => api.get<ShipPosition>(`/positions/${shipId}`),
  getAll: () => api.get<ShipPosition[]>('/positions'),
  getHistory: (shipId: string) => api.get<ShipPosition[]>(`/positions/${shipId}/history`),
  getDeviation: (shipId: string) => api.get<{ deviation: number; timestamp: string }>(`/positions/${shipId}/deviation`),
  getAllDeviations: () => api.get<{ shipId: string; deviation: number; timestamp: string }[]>('/positions/deviation/all'),
};

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  deviationThreshold: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notifyOnCreation: boolean;
  notifyOnUpdate: boolean;
  shipId?: string;
  routeId?: string;
  createdAt: string;
  updatedAt: string;
}

export const alertRuleApi = {
  getAll: () => api.get<AlertRule[]>('/alert-rules'),
  getById: (id: string) => api.get<AlertRule>(`/alert-rules/${id}`),
  getByShipId: (shipId: string) => api.get<AlertRule[]>(`/alert-rules/ship/${shipId}`),
  getByRouteId: (routeId: string) => api.get<AlertRule[]>(`/alert-rules/route/${routeId}`),
  create: (data: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>) => api.post<AlertRule>('/alert-rules', data),
  update: (id: string, data: Partial<AlertRule>) => api.put<AlertRule>(`/alert-rules/${id}`, data),
  delete: (id: string) => api.delete(`/alert-rules/${id}`),
  toggleStatus: (id: string) => api.put<AlertRule>(`/alert-rules/${id}/toggle`),
  getEnabledRules: () => api.get<AlertRule[]>('/alert-rules/enabled/all'),
};

export interface Alert {
  id: string;
  type: 'deviation' | 'speed' | 'course' | 'eta' | 'custom';
  level: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  title: string;
  message?: string;
  shipId: string;
  shipName?: string;
  shipCode?: string;
  routeId?: string;
  routeName?: string;
  deviationDistance?: number;
  threshold?: number;
  latitude?: number;
  longitude?: number;
  ruleId?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export const alertApi = {
  getAll: () => api.get<Alert[]>('/alerts'),
  getById: (id: string) => api.get<Alert>(`/alerts/${id}`),
  getByShipId: (shipId: string) => api.get<Alert[]>(`/alerts/ship/${shipId}`),
  getByStatus: (status: string) => api.get<Alert[]>(`/alerts?status=${status}`),
  getByLevel: (level: string) => api.get<Alert[]>(`/alerts?level=${level}`),
  getActive: () => api.get<Alert[]>('/alerts/active/all'),
  create: (data: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>) => api.post<Alert>('/alerts', data),
  update: (id: string, data: Partial<Alert>) => api.put<Alert>(`/alerts/${id}`, data),
  acknowledge: (id: string, data: { acknowledgedBy?: string }) => api.put<Alert>(`/alerts/${id}/acknowledge`, data),
  resolve: (id: string, data: { resolvedBy?: string; resolutionNote?: string }) => api.put<Alert>(`/alerts/${id}/resolve`, data),
  delete: (id: string) => api.delete(`/alerts/${id}`),
  getStats: () => api.get<{ total: number; active: number; acknowledged: number; resolved: number; byLevel: { level: string; count: number }[] }>('/alerts/stats/all'),
};

export interface AnalysisDashboard {
  summary: {
    totalRoutes: number;
    activeRoutes: number;
    completedRoutes: number;
    inProgressRoutes: number;
    avgCompletionRate: number;
    totalAlerts: number;
    activeAlerts: number;
  };
  deviationStats: {
    ships: {
      shipId: string;
      shipName: string;
      shipCode: string;
      currentDeviation: number;
      avgDeviation: number;
      maxDeviation: number;
      hasActiveAlert: boolean;
    }[];
    overallAvgDeviation: number;
    maxDeviation: number;
    alertCount: number;
  };
  alertTrend: {
    dailyData: { date: string; count: number }[];
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
  };
}

export const analysisApi = {
  getDashboard: () => api.get<AnalysisDashboard>('/analysis/dashboard'),
  getRouteSummary: () => api.get('/analysis/routes/summary'),
  getRouteAnalysis: (routeId: string) => api.get(`/analysis/routes/${routeId}`),
  getShipAnalysis: (shipId: string) => api.get(`/analysis/ships/${shipId}`),
  getDeviationStats: () => api.get('/analysis/deviation/stats'),
  getAlertTrend: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return api.get(`/analysis/alerts/trend?${params.toString()}`);
  },
};
