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
};
